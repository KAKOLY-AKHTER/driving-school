/**
 * Imports the old online certificate student and test archives. The candidate
 * export contains old passwords; this importer deliberately never stores them.
 *
 * Usage:
 *   node server/scripts/importLegacyCertificateArchive.mjs --file "C:\\path\\export.json"
 *   node server/scripts/importLegacyCertificateArchive.mjs --file "C:\\path\\export.json" --apply
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
const normalizeEmail = value => cleanText(value, 320).toLowerCase()
const cleanDate = value => {
  const text = cleanText(value, 40)
  if (!text || /^0{4}-0{2}-0{2}/.test(text)) return ''
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}
const yes = value => ['1', 'yes', 'true'].includes(cleanText(value, 20).toLowerCase())

const toLegacyCertificateStudent = row => {
  const firstName = cleanText(row.str_fname, 80)
  const middleName = cleanText(row.str_mname, 80)
  const lastName = cleanText(row.str_lname, 80)
  return {
    legacyCandidateId: cleanText(row.int_candidate_id, 40),
    firstName,
    middleName,
    lastName,
    displayName: [firstName, middleName, lastName].filter(Boolean).join(' ').slice(0, 160),
    email: normalizeEmail(row.str_email),
    username: cleanText(row.str_username, 160),
    dob: cleanDate(row.dtt_dob),
    address: cleanText(row.str_address1, 500),
    address2: cleanText(row.str_address2, 300),
    city: cleanText(row.str_city, 120),
    state: cleanText(row.str_state, 80),
    zipCode: cleanText(row.str_zipcode, 20),
    phone: cleanText(row.str_phone, 30),
    joinedAt: cleanDate(row.dtt_date_join),
    courseProgress: cleanText(row.str_chapter_check, 500),
    courseCompleted: yes(row.bit_course_completed),
    certificateDetails: cleanText(row.str_certificate_details, 1000),
    certificateIssued: yes(row.bit_certificate),
    legacyCourseId: cleanText(row.int_course_id, 40),
    courseName: cleanText(row.str_course, 240),
    coursePrice: cleanText(row.dec_course_price, 40),
    active: yes(row.bit_active),
    paid: yes(row.bit_paid),
    source: 'aprecisi_online_db.tbl_candid_0124',
  }
}

const toLegacyCertificateTest = row => ({
  legacyTestId: cleanText(row.int_test_id, 40),
  legacyCandidateId: cleanText(row.int_candidate_id, 40),
  testDate: cleanDate(row.dtt_date_test),
  testLevelId: cleanText(row.int_test_level_id, 40),
  score: cleanText(row.str_test_score, 40),
  versionType: cleanText(row.bit_version_type, 40),
  active: yes(row.bit_active),
  source: 'aprecisi_online_db.tbl_test',
})

if (!sourceFile) {
  console.error('Usage: node server/scripts/importLegacyCertificateArchive.mjs --file "C:\\path\\old-export.json" [--apply]')
  process.exitCode = 1
} else {
  const exportData = JSON.parse(await fs.readFile(path.resolve(sourceFile), 'utf8'))
  const table = Array.isArray(exportData) ? exportData.find(item => item?.type === 'table' && ['tbl_candid_0124', 'tbl_test'].includes(item?.name)) : null
  const rows = Array.isArray(table?.data) ? table.data : []
  if (!table || !rows.length) throw new Error('tbl_candid_0124 or tbl_test was not found or has no rows.')

  const students = table.name === 'tbl_candid_0124'
  const records = rows.map(students ? toLegacyCertificateStudent : toLegacyCertificateTest)
    .filter(record => students ? record.legacyCandidateId : record.legacyTestId && record.legacyCandidateId)
  const collectionName = students ? 'legacy_certificate_students' : 'legacy_certificate_tests'
  const idField = students ? 'legacyCandidateId' : 'legacyTestId'
  const summary = {
    table: table.name,
    sourceRows: rows.length,
    validRecords: records.length,
    skippedMissingRequiredId: rows.length - records.length,
    mode: shouldApply ? 'APPLY' : 'DRY RUN',
    ...(students ? { excludedSensitiveFields: ['str_password'] } : {}),
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
      await collection.createIndex({ [idField]: 1 }, { unique: true, name: students ? 'unique_legacy_certificate_student' : 'unique_legacy_certificate_test' })
      if (students) await collection.createIndex({ email: 1, joinedAt: -1 })
      else await collection.createIndex({ legacyCandidateId: 1, testDate: -1, testLevelId: 1 })
      const importedAt = new Date().toISOString()
      const result = await collection.bulkWrite(records.map(record => ({
        updateOne: {
          filter: { [idField]: record[idField] },
          update: { $set: { ...record, importedAt }, $setOnInsert: { createdAt: importedAt } },
          upsert: true,
        },
      })), { ordered: false })
      console.log(JSON.stringify({ ...summary, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount }, null, 2))
      console.log('Import complete. Certificate archive records are for administrator review only.')
    } finally {
      await client.close()
    }
  }
}
