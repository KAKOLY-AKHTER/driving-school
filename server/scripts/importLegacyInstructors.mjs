/**
 * Safe one-time importer for old instructor profile records.
 *
 * It deliberately ignores passwords, reset tokens, calendar credentials, and
 * licence numbers. Only administrator-useful directory fields are imported.
 *
 * Usage:
 *   node server/scripts/importLegacyInstructors.mjs --file "C:\\path\\instructors.json"
 *   node server/scripts/importLegacyInstructors.mjs --file "C:\\path\\instructors.json" --apply
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
const cleanText = (value, maxLength = 500) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength)
const isYes = value => ['yes', '1', 'true'].includes(cleanText(value, 10).toLowerCase())

function toLegacyInstructor(row, importedAt) {
  const firstName = cleanText(row.first_name, 80)
  const lastName = cleanText(row.last_name, 80)
  return {
    legacyInstructorId: cleanText(row.int_instructor_id, 80),
    firstName,
    lastName,
    displayName: [firstName, lastName].filter(Boolean).join(' ').replace(/\s*\/\s*/g, ' / ').trim(),
    username: cleanText(row.username, 160),
    email: cleanText(row.email, 320).toLowerCase(),
    phone: cleanText(row.phone, 40),
    address: cleanText(row.address, 500),
    addedAt: cleanText(row.date_added, 40),
    active: isYes(row.is_active),
    color: cleanText(row.color, 30),
    source: 'aprecisi_SchDb.instructors',
    importedAt,
  }
}

if (!sourceFile) {
  console.error('Usage: node server/scripts/importLegacyInstructors.mjs --file "C:\\path\\instructors.json" [--apply]')
  process.exitCode = 1
} else {
  const raw = await fs.readFile(path.resolve(sourceFile), 'utf8')
  const exportData = JSON.parse(raw)
  const table = Array.isArray(exportData) ? exportData.find(item => item?.type === 'table' && item?.name === 'instructors') : null
  const rows = Array.isArray(table?.data) ? table.data : []
  if (!rows.length) throw new Error('instructors was not found or has no rows.')
  const importedAt = new Date().toISOString()
  const instructors = rows.map(row => toLegacyInstructor(row, importedAt)).filter(item => item.legacyInstructorId)
  const summary = { sourceRows: rows.length, validInstructors: instructors.length, activeInstructors: instructors.filter(item => item.active).length, mode: shouldApply ? 'APPLY' : 'DRY RUN' }

  if (!shouldApply) {
    console.log(JSON.stringify(summary, null, 2))
    console.log('Dry run complete. No database records were created or changed.')
  } else {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required when using --apply.')
    const client = new MongoClient(process.env.MONGO_URI)
    try {
      await client.connect()
      const collection = client.db('driving_school').collection('legacy_instructors')
      await collection.createIndex({ legacyInstructorId: 1 }, { unique: true, name: 'unique_legacy_instructor_profile' })
      const result = await collection.bulkWrite(instructors.map(instructor => ({
        updateOne: {
          filter: { legacyInstructorId: instructor.legacyInstructorId },
          update: { $set: instructor, $setOnInsert: { createdAt: importedAt } },
          upsert: true,
        },
      })), { ordered: false })
      console.log(JSON.stringify({ ...summary, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount }, null, 2))
      console.log('Import complete. Passwords, password reset values, calendar credentials, and licence numbers were ignored.')
    } finally {
      await client.close()
    }
  }
}
