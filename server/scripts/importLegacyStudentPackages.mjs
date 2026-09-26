/**
 * Safely imports historic package purchases from tbl_candidate_package or
 * tbl_candidate_package_pending. Payment card details are deliberately never
 * read into the output document or written to MongoDB.
 *
 * Usage:
 *   node server/scripts/importLegacyStudentPackages.mjs --file "C:\\path\\export.json"
 *   node server/scripts/importLegacyStudentPackages.mjs --file "C:\\path\\export.json" --apply
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
const cleanDate = value => {
  const text = cleanText(value, 40)
  if (!text || /^0{4}-0{2}-0{2}/.test(text)) return ''
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}
const yes = value => ['1', 'yes', 'true'].includes(cleanText(value, 20).toLowerCase())

function toLegacyPackage(row, source) {
  // Do not add card_type, card_number, expiry_date, or cc_id here.
  return {
    legacyCandidatePackageId: cleanText(row.int_candidate_package_id, 40),
    legacyCandidateId: cleanText(row.int_candidate_id, 40),
    legacyPackageId: cleanText(row.int_package_id, 40),
    packageFee: cleanText(row.package_fees, 40),
    paymentStatus: cleanText(row.payment_status, 40),
    transactionId: cleanText(row.transaction_id, 500),
    active: yes(row.bit_active),
    insertedAt: cleanDate(row.inserted_date),
    source,
  }
}

if (!sourceFile) {
  console.error('Usage: node server/scripts/importLegacyStudentPackages.mjs --file "C:\\path\\old-export.json" [--apply]')
  process.exitCode = 1
} else {
  const exportData = JSON.parse(await fs.readFile(path.resolve(sourceFile), 'utf8'))
  const table = Array.isArray(exportData) ? exportData.find(item => item?.type === 'table' && ['tbl_candidate_package', 'tbl_candidate_package_pending'].includes(item?.name)) : null
  const rows = Array.isArray(table?.data) ? table.data : []
  if (!table || !rows.length) throw new Error('tbl_candidate_package or tbl_candidate_package_pending was not found or has no rows.')

  const isPending = table.name === 'tbl_candidate_package_pending'
  const source = `aprecisi_SchDb.${table.name}`
  const collectionName = isPending ? 'legacy_student_pending_packages' : 'legacy_student_packages'
  const packages = rows.map(row => toLegacyPackage(row, source)).filter(item => item.legacyCandidatePackageId && item.legacyCandidateId)
  const summary = {
    table: table.name,
    sourceRows: rows.length,
    validRecords: packages.length,
    skippedMissingPackageOrCandidateId: rows.length - packages.length,
    mode: shouldApply ? 'APPLY' : 'DRY RUN',
    sensitivePaymentFieldsExcluded: ['card_type', 'card_number', 'expiry_date', 'cc_id'],
  }
  if (!shouldApply) {
    console.log(JSON.stringify(summary, null, 2))
    console.log('Dry run complete. No database records were created or changed.')
  } else {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required when using --apply.')
    const client = new MongoClient(process.env.MONGO_URI)
    try {
      await client.connect()
      const collection = client.db('driving_school').collection(collectionName)
      await collection.createIndex({ legacyCandidatePackageId: 1 }, { unique: true, name: 'unique_legacy_student_package' })
      await collection.createIndex({ legacyCandidateId: 1, insertedAt: -1 })
      const importedAt = new Date().toISOString()
      const result = await collection.bulkWrite(packages.map(item => ({
        updateOne: {
          filter: { legacyCandidatePackageId: item.legacyCandidatePackageId },
          update: { $set: { ...item, importedAt }, $setOnInsert: { createdAt: importedAt } },
          upsert: true,
        },
      })), { ordered: false })
      console.log(JSON.stringify({ ...summary, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount }, null, 2))
      console.log('Import complete. Historic package records are retained for administrator review only.')
    } finally {
      await client.close()
    }
  }
}
