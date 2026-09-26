/**
 * Imports every historic tbl_candidate_credits row into the administrator-only
 * legacy archive. It intentionally does not create accounts or modify bookings.
 *
 * Usage:
 *   node server/scripts/importLegacyStudentCredits.mjs --file "C:\path\old-export.json"
 *   node server/scripts/importLegacyStudentCredits.mjs --file "C:\path\old-export.json" --apply
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

function toLegacyCredit(row) {
  const removalNote = cleanText(row.removal_note, 2000)
  const cancelEventId = cleanText(row.cancel_eventid, 500)
  return {
    legacyCandidateCreditId: cleanText(row.int_candidate_credit_id, 40),
    legacyCandidateId: cleanText(row.int_candidate_id, 40),
    zoneSlotTimingId: cleanText(row.int_zone_slot_timing_id, 80),
    fromSlotId: cleanText(row.from_id, 40),
    toSlotId: cleanText(row.to_id, 40),
    fromTime: cleanText(row.from, 80),
    toTime: cleanText(row.to, 80),
    slotId: cleanText(row.int_slot_id, 40),
    legacyZoneId: cleanText(row.fk_zone_id, 80),
    locationId: cleanText(row.fk_loc_id, 80),
    legacyInstructorId: cleanText(row.fk_instructor_id, 80),
    scheduledDate: cleanDate(row.schedule_date),
    pickup: cleanText(row.str_pickup, 80),
    dropoff: cleanText(row.str_dropdown, 80),
    pickupAddress: cleanText(row.str_pickup_address, 500),
    dropoffAddress: cleanText(row.str_dropdown_address, 500),
    insertedAt: cleanDate(row.inserted_date),
    active: yes(row.bit_active),
    cartId: cleanText(row.int_cart_id, 80),
    paid: yes(row.bit_paid),
    lesson: yes(row.bit_lesson),
    studentLocation: cleanText(row.str_student_location, 500),
    googleEventId: cleanText(row.google_event_id, 500),
    eventId: cleanText(row.event_id, 500),
    cancelEventId,
    removalNote,
    cancelled: Boolean(cancelEventId || removalNote),
    source: 'aprecisi_SchDb.tbl_candidate_credits',
  }
}

if (!sourceFile) {
  console.error('Usage: node server/scripts/importLegacyStudentCredits.mjs --file "C:\\path\\old-export.json" [--apply]')
  process.exitCode = 1
} else {
  const exportData = JSON.parse(await fs.readFile(path.resolve(sourceFile), 'utf8'))
  const table = Array.isArray(exportData) ? exportData.find(item => item?.type === 'table' && item?.name === 'tbl_candidate_credits') : null
  const rows = Array.isArray(table?.data) ? table.data : []
  if (!rows.length) throw new Error('tbl_candidate_credits was not found or has no rows.')
  const credits = rows.map(toLegacyCredit).filter(credit => credit.legacyCandidateCreditId && credit.legacyCandidateId)
  const summary = { sourceRows: rows.length, validRecords: credits.length, mode: shouldApply ? 'APPLY' : 'DRY RUN' }
  if (!shouldApply) {
    console.log(JSON.stringify(summary, null, 2))
    console.log('Dry run complete. No database records were created or changed.')
  } else {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required when using --apply.')
    const client = new MongoClient(process.env.MONGO_URI)
    try {
      await client.connect()
      const collection = client.db('driving_school').collection('legacy_student_credits')
      await collection.createIndex({ legacyCandidateCreditId: 1 }, { unique: true, name: 'unique_legacy_student_credit' })
      await collection.createIndex({ legacyCandidateId: 1, scheduledDate: -1 })
      const importedAt = new Date().toISOString()
      const result = await collection.bulkWrite(credits.map(credit => ({
        updateOne: {
          filter: { legacyCandidateCreditId: credit.legacyCandidateCreditId },
          update: { $set: { ...credit, importedAt }, $setOnInsert: { createdAt: importedAt } },
          upsert: true,
        },
      })), { ordered: false })
      console.log(JSON.stringify({ ...summary, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount }, null, 2))
      console.log('Import complete. Historic credits are retained for administrator review only.')
    } finally {
      await client.close()
    }
  }
}
