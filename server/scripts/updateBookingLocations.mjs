/**
 * Adds the client-approved booking locations without deleting historical
 * locations, courses, carts, or bookings. It also upgrades location identity
 * from city-only to City + ZIP, so a city may safely have several ZIP codes.
 *
 * Usage:
 *   node server/scripts/updateBookingLocations.mjs
 *   node server/scripts/updateBookingLocations.mjs --apply
 */
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

const shouldApply = process.argv.slice(2).includes('--apply')
const cleanText = (value, maxLength = 120) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength)
const cityKey = value => cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const locationKey = (name, zipCode) => {
  const city = cityKey(name)
  const zip = cleanText(zipCode, 10)
  return zip ? `${city}::${zip}` : city
}

const requestedLocations = [
  ['Livermore', '94550', 'Near'], ['Livermore', '94551', 'Near'],
  ['Dublin', '94568', 'Near'],
  ['San Ramon', '94582', 'Near'], ['San Ramon', '94583', 'Near'],
  ['Pleasanton', '94566', 'Near'], ['Pleasanton', '94568', 'Near'], ['Pleasanton', '94588', 'Near'],
  ['Alamo', '94507', 'Near'],
  ['Danville', '94506', 'Near'], ['Danville', '94526', 'Near'],
  ['Diablo', '94528', 'Long'],
].map(([name, zipCode, distance]) => ({ name, zipCode, distance, cityKey: cityKey(name), key: locationKey(name, zipCode) }))

if (!shouldApply) {
  console.log(JSON.stringify({
    mode: 'DRY RUN',
    action: 'Preserve all existing locations; add or update the approved City + ZIP entries.',
    requestedLocations,
  }, null, 2))
  console.log('Dry run complete. No database records were changed.')
} else {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required when using --apply.')
  const client = new MongoClient(process.env.MONGO_URI)
  try {
    await client.connect()
    const locations = client.db('driving_school').collection('locations')
    const now = new Date().toISOString()
    const existing = await locations.find().toArray()
    const legacyCompatibleLocations = existing.filter(location => location.legacyCityKey || Number(location.order) < 1000)
    const legacyCities = new Set()
    for (const location of legacyCompatibleLocations) {
      const normalizedCity = cityKey(location.name)
      if (legacyCities.has(normalizedCity)) {
        throw new Error(`More than one legacy location uses the city key ${normalizedCity}. Resolve this before retrying; no data was changed.`)
      }
      legacyCities.add(normalizedCity)
    }
    const schemaUpdates = existing.filter(location => {
      const nextCityKey = cityKey(location.name)
      const nextKey = locationKey(location.name, location.zipCode)
      return !legacyCompatibleLocations.includes(location) && (location.cityKey !== nextCityKey || location.key !== nextKey)
    })
    const canonicalKeys = new Map()
    for (const location of existing) {
      const nextKey = locationKey(location.name, location.zipCode)
      if (!nextKey) throw new Error(`Location ${location._id} has no usable city name.`)
      if (canonicalKeys.has(nextKey)) {
        throw new Error(`Two existing locations would become the same City + ZIP entry (${nextKey}). Resolve the duplicate before retrying; no data was changed.`)
      }
      canonicalKeys.set(nextKey, location._id)
    }

    // Each existing city-only key is converted before inserting a second ZIP
    // for the same city. No existing document is removed.
    for (const location of schemaUpdates) {
      await locations.updateOne(
        { _id: location._id },
        { $set: { cityKey: cityKey(location.name), key: locationKey(location.name, location.zipCode), updatedAt: now } }
      )
    }
    // Keep pre-existing city keys available until the new API is deployed.
    // New code still matches these rows by their ZIP, while an older running
    // deployment can continue resolving every original city as before.
    for (const location of legacyCompatibleLocations) {
      const normalizedCity = cityKey(location.name)
      await locations.updateOne(
        { _id: location._id },
        { $set: { cityKey: normalizedCity, legacyCityKey: normalizedCity, key: normalizedCity, active: false, updatedAt: now } }
      )
    }

    const result = await locations.bulkWrite(requestedLocations.map((location, index) => ({
      updateOne: {
        filter: { cityKey: location.cityKey, zipCode: location.zipCode },
        update: {
          $set: { name: location.name, cityKey: location.cityKey, zipCode: location.zipCode, distance: location.distance, active: true, updatedAt: now },
          $setOnInsert: { order: 1000 + index, createdAt: now },
        },
        upsert: true,
      },
    })), { ordered: true })

    console.log(JSON.stringify({
      mode: 'APPLY',
      preservedExistingLocations: existing.length,
      upgradedToCityAndZipIdentity: schemaUpdates.length,
      legacyCityKeysRetainedForCompatibility: legacyCompatibleLocations.length,
      requestedEntries: requestedLocations.length,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
    }, null, 2))
    console.log('Location update complete. No prior location, course, cart, or booking was deleted.')
  } finally {
    await client.close()
  }
}
