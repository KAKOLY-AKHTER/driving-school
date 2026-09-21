/**
 * Safe one-time importer for the old A Precision PHP/phpMyAdmin export.
 *
 * This importer deliberately never reads or stores legacy passwords, reset
 * tokens, payment details, license numbers, medical details, or payer data.
 * It only imports the minimum student profile data needed to recognise an old
 * student on the new site.
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
    secondaryPhone: cleanText(row.str_phone2 || row.str_phone3, 30),
    dob: cleanDate(row.dtt_dob),
    address: cleanText(row.str_address1, 500),
    address2: cleanText(row.str_address2 || row.str_aptno, 300),
    city: cleanText(row.str_city, 100),
    state: cleanText(row.str_state, 80),
    zipCode: cleanText(row.str_zipcode, 20),
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
      activationStatus: 'pending',
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
            $setOnInsert: { createdAt: importedAt },
          },
          upsert: true,
        },
      }))
      const result = await collection.bulkWrite(operations, { ordered: false })
      console.log(JSON.stringify({ ...summary, matched: result.matchedCount, modified: result.modifiedCount, upserted: result.upsertedCount }, null, 2))
      console.log('Import complete. No legacy password, token, financial, license, payer, or medical field was imported.')
    } finally {
      await client.close()
    }
  }
}
