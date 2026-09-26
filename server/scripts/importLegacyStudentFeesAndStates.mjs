/**
 * Imports tbl_candidate_fees_fine or tbl_country_state for the administrator
 * legacy archive. Raw card details are intentionally not included in fee data.
 *
 * Usage:
 *   node server/scripts/importLegacyStudentFeesAndStates.mjs --file "C:\\path\\export.json"
 *   node server/scripts/importLegacyStudentFeesAndStates.mjs --file "C:\\path\\export.json" --apply
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

const toLegacyFee = row => ({
  // Never add card_type, card_number, expiry_date, or cc_id here.
  legacyCandidateFeeId: cleanText(row.int_candidate_package_id, 40),
  legacyCandidateId: cleanText(row.int_candidate_id, 40),
  zoneSlotTimingId: cleanText(row.int_zone_slot_time_id, 80),
  fee: cleanText(row.package_fees, 40),
  paymentStatus: cleanText(row.payment_status, 40),
  transactionId: cleanText(row.transaction_id, 500),
  active: yes(row.bit_active),
  insertedAt: cleanDate(row.inserted_date),
  source: 'aprecisi_SchDb.tbl_candidate_fees_fine',
})

const toCountryState = row => ({
  legacyCountryStateId: cleanText(row.int_country_state_id, 40),
  countryStateName: cleanText(row.str_country_state, 120),
  stateAbbreviation: cleanText(row.str_state_abbr, 20),
  active: yes(row.bit_active),
  source: 'aprecisi_SchDb.tbl_country_state',
})

if (!sourceFile) {
  console.error('Usage: node server/scripts/importLegacyStudentFeesAndStates.mjs --file "C:\\path\\old-export.json" [--apply]')
  process.exitCode = 1
} else {
  const exportData = JSON.parse(await fs.readFile(path.resolve(sourceFile), 'utf8'))
  const table = Array.isArray(exportData) ? exportData.find(item => item?.type === 'table' && ['tbl_candidate_fees_fine', 'tbl_country_state'].includes(item?.name)) : null
  const rows = Array.isArray(table?.data) ? table.data : []
  if (!table || !rows.length) throw new Error('tbl_candidate_fees_fine or tbl_country_state was not found or has no rows.')

  const isFees = table.name === 'tbl_candidate_fees_fine'
  const records = rows.map(isFees ? toLegacyFee : toCountryState)
    .filter(record => isFees ? record.legacyCandidateFeeId && record.legacyCandidateId : record.legacyCountryStateId)
  const collectionName = isFees ? 'legacy_student_fees' : 'legacy_country_states'
  const idField = isFees ? 'legacyCandidateFeeId' : 'legacyCountryStateId'
  const summary = {
    table: table.name,
    sourceRows: rows.length,
    validRecords: records.length,
    skippedMissingRequiredId: rows.length - records.length,
    mode: shouldApply ? 'APPLY' : 'DRY RUN',
    ...(isFees ? { sensitivePaymentFieldsExcluded: ['card_type', 'card_number', 'expiry_date', 'cc_id'] } : {}),
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
      await collection.createIndex({ [idField]: 1 }, { unique: true, name: isFees ? 'unique_legacy_student_fee' : 'unique_legacy_country_state' })
      if (isFees) await collection.createIndex({ legacyCandidateId: 1, insertedAt: -1 })
      const importedAt = new Date().toISOString()
      const result = await collection.bulkWrite(records.map(record => ({
        updateOne: {
          filter: { [idField]: record[idField] },
          update: { $set: { ...record, importedAt }, $setOnInsert: { createdAt: importedAt } },
          upsert: true,
        },
      })), { ordered: false })
      console.log(JSON.stringify({ ...summary, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount }, null, 2))
      console.log('Import complete. Records are retained for administrator review only.')
    } finally {
      await client.close()
    }
  }
}
