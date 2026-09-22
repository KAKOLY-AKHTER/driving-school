/**
 * Safe one-time importer for the old A Precision PHP/phpMyAdmin export.
 *
 * This importer deliberately never reads or stores legacy passwords or reset
 * tokens. Other historic profile details are retained in the administrator-only
 * Legacy Students view so the school can review the original student record.
 *
 * Usage (safe preview):
 *   node server/scripts/importLegacyStudents.mjs --file "C:\\path\\old-export.json"
 *
 * Apply after reviewing the preview:
 *   node server/scripts/importLegacyStudents.mjs --file "C:\\path\\old-export.json" --apply
 *
 * The source export must remain outside this repository.  The script needs
 * MONGO_URI in server/.env or the root .env only when --apply is supplied.
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

// Match the API server's Windows DNS fallback. Some local Windows setups use
// a loopback resolver that cannot resolve MongoDB Atlas SRV records.
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
const normalizeEmail = value => cleanText(value, 320).toLowerCase()
const validEmail = value => /^\S+@\S+\.\S+$/.test(value)
const cleanDate = value => {
  const text = cleanText(value, 40)
  if (!text || /^0{4}-0{2}-0{2}/.test(text)) return ''
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString()
}

function newestFirst(a, b) {
  const activeDifference = Number(b.legacyActive) - Number(a.legacyActive)
  if (activeDifference) return activeDifference
  const dateDifference = (new Date(b.legacyJoinedAt || 0)).getTime() - (new Date(a.legacyJoinedAt || 0)).getTime()
  if (dateDifference) return dateDifference
  return Number(b.legacyCandidateId || 0) - Number(a.legacyCandidateId || 0)
}

function toLegacyStudent(row) {
  const firstName = cleanText(row.str_fname, 80)
  const middleName = cleanText(row.str_mname, 80)
  const lastName = cleanText(row.str_lname, 80)
  const displayName = [firstName, middleName, lastName].filter(Boolean).join(' ').slice(0, 160)
  return {
    legacyCandidateId: cleanText(row.int_candidate_id, 40),
    firstName,
    middleName,
    lastName,
    displayName,
    email: normalizeEmail(row.str_email),
    username: cleanText(row.str_username, 160),
    phone: cleanText(row.str_phone, 30),
    secondaryPhone: cleanText(row.str_phone2, 30),
    alternatePhone: cleanText(row.str_phone3, 30),
    dob: cleanDate(row.dtt_dob),
    gender: cleanText(row.str_gender, 20),
    address: cleanText(row.str_address1, 500),
    address2: cleanText(row.str_address2 || row.str_aptno, 300),
    city: cleanText(row.str_city, 100),
    state: cleanText(row.str_state, 80),
    countryStateId: cleanText(row.int_country_state_id, 40),
    zipCode: cleanText(row.str_zipcode, 20),
    apartmentNumber: cleanText(row.str_aptno, 80),
    gateCode: cleanText(row.str_gatecode, 100),
    primaryHomeAddress: cleanText(row.str_primary_home_address, 500),
    schoolAffiliate: cleanText(row.str_school_affiliate, 180),
    highSchool: cleanText(row.str_highschool, 180),
    studentHighSchool: cleanText(row.str_stud_high_school, 180),
    legacyPhotoReference: cleanText(row.str_photo, 500),
    chapterCheck: cleanText(row.str_chapter_check, 1000),
    versionType: cleanText(row.bit_version_type, 40),
    payerName: cleanText(row.str_payer_name, 160),
    payerRelationship: cleanText(row.str_relation, 100),
    licenseNumber: cleanText(row.str_licenseno, 160),
    licenseIssuedAt: cleanDate(row.dtt_issue),
    licenseExpiresAt: cleanDate(row.dtt_exp),
    permitNumber: cleanText(row.str_student_permit_no, 160),
    permitIssuedAt: cleanDate(row.dtt_permit_issued),
    permitExpiresAt: cleanDate(row.dtt_permit_expired),
    medicalCondition: cleanText(row.str_medical_condition, 1000),
    medications: cleanText(row.str_medications, 1000),
    usesLenses: String(row.bit_lense || '') === '1',
    comments: cleanText(row.str_coments, 2000),
    legacyNotes: cleanText(row.txt_notes, 4000),
    legacyJoinedAt: cleanDate(row.dtt_date_join),
    legacyActive: String(row.bit_active || '') === '1',
    source: 'aprecisi_SchDb.tbl_candidate_new',
  }
}

if (!sourceFile) {
  console.error('Usage: node server/scripts/importLegacyStudents.mjs --file "C:\\path\\old-export.json" [--apply]')
  process.exitCode = 1
} else {
  const raw = await fs.readFile(path.resolve(sourceFile), 'utf8')
  const exportData = JSON.parse(raw)
  const table = Array.isArray(exportData)
    ? exportData.find(item => item?.type === 'table' && item?.name === 'tbl_candidate_new')
    : null
  const rows = Array.isArray(table?.data) ? table.data : []
  if (!rows.length) throw new Error('tbl_candidate_new was not found or has no rows.')

  const byEmail = new Map()
  let skippedWithoutEmail = 0
  for (const row of rows) {
    const student = toLegacyStudent(row)
    if (!validEmail(student.email)) {
      skippedWithoutEmail += 1
      continue
    }
    const current = byEmail.get(student.email) || []
    current.push(student)
    byEmail.set(student.email, current)
  }

  const importedAt = new Date().toISOString()
  const students = [...byEmail.values()].map(group => {
    const sorted = [...group].sort(newestFirst)
    const primary = sorted[0]
    return {
      ...primary,
      legacyCandidateIds: sorted.map(item => item.legacyCandidateId).filter(Boolean),
      duplicateRecordCount: sorted.length,
      requiresAdminReview: sorted.length > 1,
      importedAt,
    }
  })
  const duplicateEmailGroups = students.filter(student => student.duplicateRecordCount > 1).length
  const summary = {
    sourceRows: rows.length,
    validUniqueEmails: students.length,
    skippedWithoutValidEmail: skippedWithoutEmail,
    duplicateEmailGroups,
    rowsInDuplicateEmailGroups: students.filter(student => student.duplicateRecordCount > 1).reduce((sum, student) => sum + student.duplicateRecordCount, 0),
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
      const collection = client.db('driving_school').collection('legacy_students')
      await collection.createIndex({ email: 1 }, { unique: true, name: 'unique_legacy_student_email' })
      const operations = students.map(student => ({
        updateOne: {
          filter: { email: student.email },
          update: {
            $set: student,
            // Never reset a student who was already linked to a real new-site
            // Firebase account during a later legacy-data refresh.
            $setOnInsert: { createdAt: importedAt, activationStatus: 'pending' },
          },
          upsert: true,
        },
      }))
      const result = await collection.bulkWrite(operations, { ordered: false })
      const legacyByEmail = new Map(students.map(student => [student.email, student]))
      const websiteUsers = await client.db('driving_school').collection('users').find(
        { email: { $exists: true, $ne: '' } },
        { projection: { uid: 1, email: 1 } },
      ).toArray()
      const activatedAt = new Date().toISOString()
      const matchedAccounts = websiteUsers.filter(user => legacyByEmail.has(normalizeEmail(user.email)) && cleanText(user.uid, 160))
      if (matchedAccounts.length) {
        await collection.bulkWrite(matchedAccounts.map(user => ({
          updateOne: {
            filter: {
              email: normalizeEmail(user.email),
              $or: [{ linkedUid: { $exists: false } }, { linkedUid: null }, { linkedUid: '' }, { linkedUid: user.uid }],
            },
            update: { $set: { linkedUid: user.uid, activationStatus: 'activated', activatedAt } },
          },
        })), { ordered: false })
        await client.db('driving_school').collection('users').bulkWrite(matchedAccounts.map(user => ({
          updateOne: {
            filter: { uid: user.uid },
            update: { $set: { legacyCandidateId: legacyByEmail.get(normalizeEmail(user.email)).legacyCandidateId, legacyMatchedAt: activatedAt } },
          },
        })), { ordered: false })
      }
      console.log(JSON.stringify({ ...summary, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount, linkedExistingAccounts: matchedAccounts.length }, null, 2))
      console.log('Import complete. Legacy passwords and reset tokens were never imported.')
    } finally {
      await client.close()
    }
  }
}
