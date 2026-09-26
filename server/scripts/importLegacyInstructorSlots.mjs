/**
 * Safe one-time importer for instructor schedule slots from the old PHP site.
 *
 * The supplied tbl_zone_slots export does not include instructor names, email
 * addresses, passwords, or contact details. It is therefore imported only as
 * an administrator-visible schedule archive, grouped by legacy instructor ID.
 *
 * Usage (safe preview):
 *   node server/scripts/importLegacyInstructorSlots.mjs --file "C:\\path\\old-export.json"
 *
 * Apply after reviewing the preview:
 *   node server/scripts/importLegacyInstructorSlots.mjs --file "C:\\path\\old-export.json" --apply
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

const configuredDnsServers = String(process.env.DNS_SERVERS || '')
  .split(',').map(value => value.trim()).filter(Boolean)
const isLoopbackDnsServer = value => /^127(?:\.\d{1,3}){3}(?::\d+)?$/.test(String(value || '').trim()) || String(value || '').trim() === '::1'
if (configuredDnsServers.length) {
  dns.setServers(configuredDnsServers)
} else if (process.platform === 'win32') {
  const currentServers = dns.getServers()
  if (currentServers.length && currentServers.every(isLoopbackDnsServer)) dns.setServers(['1.1.1.1', '8.8.8.8'])
}

const args = process.argv.slice(2)
const argValue = (name) => {
  const index = args.indexOf(name)
  return index >= 0 ? String(args[index + 1] || '').trim() : ''
}
const sourceFile = argValue('--file')
const shouldApply = args.includes('--apply')

const cleanText = (value, maxLength = 500) => String(value ?? '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, maxLength)

const cleanDate = value => {
  const text = cleanText(value, 40)
  if (!text) return ''
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : text
}

const isYes = value => ['yes', '1', 'true'].includes(cleanText(value, 10).toLowerCase())

function toLegacyInstructorSlot(row, importedAt) {
  return {
    legacySlotId: cleanText(row.int_zone_slot_id, 80),
    legacyInstructorId: cleanText(row.int_instructor_id, 80),
    legacyZoneId: cleanText(row.int_zone_id, 80),
    slotDate: cleanDate(row.slot_date),
    locationId: cleanText(row.str_location, 160),
    insertedAt: cleanText(row.inserted_date, 80),
    active: isYes(row.bit_active),
    fromHour: cleanText(row.from_time, 40),
    toHour: cleanText(row.to_time, 40),
    breakHours: cleanText(row.int_break_time, 40),
    autismSupport: isYes(row.bit_autism),
    source: 'aprecisi_SchDb.tbl_zone_slots',
    importedAt,
  }
}

if (!sourceFile) {
  console.error('Usage: node server/scripts/importLegacyInstructorSlots.mjs --file "C:\\path\\old-export.json" [--apply]')
  process.exitCode = 1
} else {
  const raw = await fs.readFile(path.resolve(sourceFile), 'utf8')
  const exportData = JSON.parse(raw)
  const table = Array.isArray(exportData)
    ? exportData.find(item => item?.type === 'table' && item?.name === 'tbl_zone_slots')
    : null
  const rows = Array.isArray(table?.data) ? table.data : []
  if (!rows.length) throw new Error('tbl_zone_slots was not found or has no rows.')

  const importedAt = new Date().toISOString()
  const slots = []
  let skippedWithoutIdentity = 0
  for (const row of rows) {
    const slot = toLegacyInstructorSlot(row, importedAt)
    if (!slot.legacySlotId || !slot.legacyInstructorId) {
      skippedWithoutIdentity += 1
      continue
    }
    slots.push(slot)
  }

  const summary = {
    sourceRows: rows.length,
    validSlots: slots.length,
    skippedWithoutIdentity,
    uniqueInstructorIds: new Set(slots.map(slot => slot.legacyInstructorId)).size,
    activeSlots: slots.filter(slot => slot.active).length,
    inactiveSlots: slots.filter(slot => !slot.active).length,
    mode: shouldApply ? 'APPLY' : 'DRY RUN',
  }

  if (!shouldApply) {
    console.log(JSON.stringify(summary, null, 2))
    console.log('Dry run complete. No database records were created or changed.')
  } else {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required when using --apply.')
    const client = new MongoClient(process.env.MONGO_URI)
    try {
      await client.connect()
      const collection = client.db('driving_school').collection('legacy_instructor_slots')
      await collection.createIndex({ legacySlotId: 1 }, { unique: true, name: 'unique_legacy_instructor_slot' })
      await collection.createIndex({ legacyInstructorId: 1, slotDate: -1 })
      let matched = 0
      let modified = 0
      let upserted = 0
      for (let index = 0; index < slots.length; index += 500) {
        const result = await collection.bulkWrite(slots.slice(index, index + 500).map(slot => ({
          updateOne: {
            filter: { legacySlotId: slot.legacySlotId },
            update: { $set: slot, $setOnInsert: { createdAt: importedAt } },
            upsert: true,
          },
        })), { ordered: false })
        matched += result.matchedCount
        modified += result.modifiedCount
        upserted += result.upsertedCount
      }
      console.log(JSON.stringify({ ...summary, matched, modified, upserted }, null, 2))
      console.log('Import complete. The source did not contain instructor names, contact details, or passwords.')
    } finally {
      await client.close()
    }
  }
}
