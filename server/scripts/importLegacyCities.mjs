/**
 * Imports the old tbl_cities lookup data so archived schedules can show a
 * readable city and ZIP instead of only an old location ID.
 *
 * Usage:
 *   node server/scripts/importLegacyCities.mjs --file "C:\\path\\cities.json"
 *   node server/scripts/importLegacyCities.mjs --file "C:\\path\\cities.json" --apply
 */
import fs from 'node:fs/promises'
import dns from 'node:dns'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const serverDirectory = path.resolve(scriptDirectory, '..')
dotenv.config({ path: path.join(serverDirectory, '.env') })
dotenv.config({ path: path.join(serverDirectory, '..', '.env') })
const configuredDnsServers = String(process.env.DNS_SERVERS || '').split(',').map(value => value.trim()).filter(Boolean)
const isLoopbackDnsServer = value => /^127(?:\.\d{1,3}){3}(?::\d+)?$/.test(String(value || '').trim()) || String(value || '').trim() === '::1'
if (configuredDnsServers.length) dns.setServers(configuredDnsServers)
else if (process.platform === 'win32') {
  const currentServers = dns.getServers()
  if (currentServers.length && currentServers.every(isLoopbackDnsServer)) dns.setServers(['1.1.1.1', '8.8.8.8'])
}

const args = process.argv.slice(2)
const argValue = name => {
  const index = args.indexOf(name)
  return index >= 0 ? String(args[index + 1] || '').trim() : ''
}
const sourceFile = argValue('--file')
const shouldApply = args.includes('--apply')
const cleanText = (value, maxLength = 160) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength)

if (!sourceFile) {
  console.error('Usage: node server/scripts/importLegacyCities.mjs --file "C:\\path\\cities.json" [--apply]')
  process.exitCode = 1
} else {
  const raw = await fs.readFile(path.resolve(sourceFile), 'utf8')
  const exportData = JSON.parse(raw)
  const table = Array.isArray(exportData) ? exportData.find(item => item?.type === 'table' && item?.name === 'tbl_cities') : null
  const rows = Array.isArray(table?.data) ? table.data : []
  if (!rows.length) throw new Error('tbl_cities was not found or has no rows.')
  const importedAt = new Date().toISOString()
  const cities = rows.map(row => ({
    legacyCityId: cleanText(row.int_city_id, 80),
    cityName: cleanText(row.str_city, 120),
    zipCode: cleanText(row.int_zip_code, 20),
    legacyZoneId: cleanText(row.int_zone_id, 80),
    active: cleanText(row.bit_active, 10).toLowerCase() === 'yes',
    source: 'aprecisi_SchDb.tbl_cities',
    importedAt,
  })).filter(city => city.legacyCityId)
  const summary = { sourceRows: rows.length, validCities: cities.length, mode: shouldApply ? 'APPLY' : 'DRY RUN' }
  if (!shouldApply) {
    console.log(JSON.stringify(summary, null, 2))
    console.log('Dry run complete. No database records were created or changed.')
  } else {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required when using --apply.')
    const client = new MongoClient(process.env.MONGO_URI)
    try {
      await client.connect()
      const collection = client.db('driving_school').collection('legacy_cities')
      await collection.createIndex({ legacyCityId: 1 }, { unique: true, name: 'unique_legacy_city' })
      const result = await collection.bulkWrite(cities.map(city => ({ updateOne: { filter: { legacyCityId: city.legacyCityId }, update: { $set: city, $setOnInsert: { createdAt: importedAt } }, upsert: true } })), { ordered: false })
      console.log(JSON.stringify({ ...summary, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount }, null, 2))
      console.log('Import complete.')
    } finally {
      await client.close()
    }
  }
}
