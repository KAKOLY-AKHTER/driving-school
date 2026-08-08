import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import dns from 'node:dns'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MongoClient, ObjectId } from 'mongodb'
import Groq from 'groq-sdk'
import { randomUUID } from 'node:crypto'
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const serverDirectory = path.dirname(fileURLToPath(import.meta.url))
// Resolve configuration relative to this file so local authentication works
// whether the API is started from the repository root or from /server.
dotenv.config({ path: path.join(serverDirectory, '.env') })
dotenv.config({ path: path.join(serverDirectory, '..', '.env') })


const configuredDnsServers = String(process.env.DNS_SERVERS || '')
  .split(',')
  .map(server => server.trim())
  .filter(Boolean)
const isLoopbackDnsServer = (server) => {
  const value = String(server || '').trim().toLowerCase()
  return /^127(?:\.\d{1,3}){3}(?::\d+)?$/.test(value)
    || value === '::1'
    || value === '0:0:0:0:0:0:0:1'
    || /^\[::1\](?::\d+)?$/.test(value)
}

if (configuredDnsServers.length > 0) {
  try {
    dns.setServers(configuredDnsServers)
  } catch (error) {
    console.warn('DNS_SERVERS could not be applied:', error?.message || error)
  }
} else if (process.platform === 'win32') {
  const currentDnsServers = dns.getServers()
  if (currentDnsServers.length > 0 && currentDnsServers.every(isLoopbackDnsServer)) {
    dns.setServers(['1.1.1.1', '8.8.8.8'])
  }
}


const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', Math.max(0, Math.min(2, Number(process.env.TRUST_PROXY_HOPS) || 1)))

const normalizeOrigin = (value) => {
  try {
    return new URL(String(value).trim()).origin
  } catch {
    return ''
  }
}
const allowedOrigins = String(process.env.CLIENT_URL || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean)
const isProduction = process.env.NODE_ENV === 'production'
app.use(cors({
  origin(origin, callback) {
    const normalized = origin ? normalizeOrigin(origin) : ''
    if (!origin || allowedOrigins.includes(normalized) || (!isProduction && allowedOrigins.length === 0)) return callback(null, true)
    return callback(new Error('Origin not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86_400,
}))
app.use(express.json({ limit: '100kb' }))
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})

const rateBuckets = new Map()
let lastRateBucketSweep = 0
let nextRateLimiterId = 0
const MAX_RATE_BUCKETS = 10_000

function sweepRateBuckets(now) {
  for (const [bucketKey, value] of rateBuckets) {
    if (value.expiresAt <= now) rateBuckets.delete(bucketKey)
  }
  if (rateBuckets.size < MAX_RATE_BUCKETS) return

  const targetSize = Math.floor(MAX_RATE_BUCKETS * 0.9)
  for (const bucketKey of rateBuckets.keys()) {
    rateBuckets.delete(bucketKey)
    if (rateBuckets.size <= targetSize) break
  }
}

function rateLimit({ windowMs = 60_000, max = 20 } = {}) {
  const limiterId = ++nextRateLimiterId
  return (req, res, next) => {
    const now = Date.now()
    if (now - lastRateBucketSweep >= 60_000 || rateBuckets.size >= MAX_RATE_BUCKETS) {
      sweepRateBuckets(now)
      lastRateBucketSweep = now
    }
    const key = `${limiterId}:${req.ip}`
    const bucket = rateBuckets.get(key)
    if (!bucket || bucket.expiresAt <= now) {
      rateBuckets.set(key, { startedAt: now, expiresAt: now + windowMs, count: 1 })
      res.setHeader('RateLimit-Limit', String(max))
      res.setHeader('RateLimit-Remaining', String(Math.max(0, max - 1)))
      return next()
    }
    bucket.count += 1
    const remaining = Math.max(0, max - bucket.count)
    res.setHeader('RateLimit-Limit', String(max))
    res.setHeader('RateLimit-Remaining', String(remaining))
    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - bucket.startedAt)) / 1000))
      res.setHeader('Retry-After', String(retryAfter))
      return res.status(429).json({ error: 'Too many requests. Please try again shortly.' })
    }
    return next()
  }
}

const cleanText = (value, maxLength = 500) => String(value || '').trim().slice(0, maxLength)
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isDateKey = (value) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1 || month < 1 || month > 12 || day < 1) return false
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return day <= daysInMonth[month - 1]
}
const californiaDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const californiaDateKey = (date = new Date()) => {
  const parts = Object.fromEntries(
    californiaDateFormatter.formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value])
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}
const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const cleanInteger = (value, fallback = 0, min = -10_000, max = 10_000) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback
}
const cleanHttpUrl = (value, maxLength = 2000) => {
  const raw = cleanText(value, maxLength)
  if (!raw) return ''
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}
const safeRecord = (value, depth = 0) => {
  if (depth > 3) return undefined
  if (typeof value === 'string') return cleanText(value, 4000)
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'boolean' || value === null) return value
  if (Array.isArray(value)) return value.slice(0, 100).map(item => safeRecord(item, depth + 1)).filter(item => item !== undefined)
  if (!isPlainObject(value)) return undefined
  const output = {}
  for (const [key, item] of Object.entries(value).slice(0, 100)) {
    if (!/^[A-Za-z0-9 _-]{1,80}$/.test(key)) continue
    const sanitized = safeRecord(item, depth + 1)
    if (sanitized !== undefined) output[key] = sanitized
  }
  return output
}
const sendServerError = (res, error, context = 'Request failed') => {
  console.error(`${context}:`, error?.message || error)
  return res.status(500).json({ error: 'Something went wrong. Please try again.' })
}
const USER_TEXT_FIELDS = new Map([
  ['firstName', 80], ['middleName', 80], ['lastName', 80], ['displayName', 160], ['name', 160],
  ['username', 160], ['dob', 20], ['phone', 30], ['email', 320], ['address', 500], ['city', 100],
  ['state', 80], ['zipCode', 20], ['courseType', 120], ['photoURL', 2000], ['permit', 160],
  ['medications', 1000], ['notes', 2000], ['submittedAt', 40], ['issueDate', 40], ['expiryDate', 40],
])
function sanitizeUserProfile(value) {
  if (!isPlainObject(value)) throw new HttpError(400, 'A valid profile is required.')
  const output = {}
  for (const [field, maxLength] of USER_TEXT_FIELDS) {
    if (value[field] === undefined) continue
    output[field] = field === 'email'
      ? normalizeEmail(value[field])
      : field === 'photoURL'
        ? cleanHttpUrl(value[field])
        : cleanText(value[field], maxLength)
  }
  if (output.email && !isEmail(output.email)) throw new HttpError(400, 'Please enter a valid email address.')
  if (value.completedModules !== undefined) {
    if (!Array.isArray(value.completedModules)) throw new HttpError(400, 'Completed modules must be a list.')
    output.completedModules = [...new Set(value.completedModules.map(item => cleanText(item, 120)).filter(Boolean))].slice(0, 200)
  }
  return output
}
function sanitizeChatMessages(value, maxMessages = 100) {
  if (!Array.isArray(value)) throw new HttpError(400, 'Messages must be a list.')
  return value.slice(-maxMessages).map(message => {
    const role = message?.role === 'assistant' ? 'assistant' : 'user'
    const content = cleanText(message?.content ?? message?.text, 4000)
    if (!content) throw new HttpError(400, 'Messages cannot be empty.')
    return { role, content }
  })
}
function sanitizePricing(value) {
  if (!isPlainObject(value)) throw new HttpError(400, 'A valid pricing plan is required.')
  const id = cleanText(value.id, 120)
  const planName = cleanText(value.planName, 160)
  const planPrice = cleanText(value.planPrice, 40)
  const planPriceTwo = cleanText(value.planPriceTwo, 40)
  if (!id || !planName || !planPrice) throw new HttpError(400, 'Plan id, name, and price are required.')
  const allowedPermissions = new Set(['Select', 'Included', 'Optional', 'Not Included'])
  const options = (Array.isArray(value.options) ? value.options : []).slice(0, 20).map(option => ({
    text: cleanText(option?.text, 500),
    permission: allowedPermissions.has(option?.permission) ? option.permission : 'Select',
  }))
  return { id, planName, planPrice, planPriceTwo: planPriceTwo || planPrice, options, order: cleanInteger(value.order, 0, 0, 10_000) }
}
function sanitizeArea(value) {
  if (!isPlainObject(value)) throw new HttpError(400, 'A valid service area is required.')
  const name = cleanText(value.name, 120)
  const map = cleanHttpUrl(value.map)
  let mapHost = ''
  try {
    mapHost = new URL(map).hostname.toLowerCase()
  } catch {
    // The validation message below intentionally covers malformed URLs.
  }
  const isGoogleMapsHost = mapHost === 'google.com'
    || mapHost.endsWith('.google.com')
    || mapHost === 'googleusercontent.com'
    || mapHost.endsWith('.googleusercontent.com')
  if (!name || !map || !isGoogleMapsHost) {
    throw new HttpError(400, 'Area name and a secure Google Maps URL are required.')
  }
  return { name, map, icon: cleanText(value.icon, 4000), order: cleanInteger(value.order, 0, 0, 10_000) }
}
function sanitizeSocial(value) {
  if (!isPlainObject(value)) throw new HttpError(400, 'A valid social link is required.')
  const platform = cleanText(value.platform || 'website', 40).toLowerCase()
  const url = cleanHttpUrl(value.url)
  if (!url) throw new HttpError(400, 'A secure social URL is required.')
  const allowedPlatforms = new Set([
    'facebook', 'instagram', 'youtube', 'linkedin', 'x', 'twitter', 'tiktok', 'whatsapp', 'link', 'website',
  ])
  if (!allowedPlatforms.has(platform)) throw new HttpError(400, 'Please choose a supported social platform.')
  return { platform, url, order: cleanInteger(value.order, 0, 0, 10_000) }
}
function sanitizeSettings(value) {
  if (!isPlainObject(value)) throw new HttpError(400, 'Valid site settings are required.')
  const output = {
    phone: cleanText(value.phone, 40),
    email: normalizeEmail(value.email),
    address: cleanText(value.address, 300),
    subaddress: cleanText(value.subaddress, 300),
    scheduleLabel: cleanText(value.scheduleLabel, 200),
    scheduleLink: cleanHttpUrl(value.scheduleLink),
  }
  if (output.email && !isEmail(output.email)) throw new HttpError(400, 'Please enter a valid settings email address.')
  if (value.scheduleLink && !output.scheduleLink) throw new HttpError(400, 'Schedule link must be a secure HTTPS URL.')
  return output
}
function sanitizeRefundRecord(value, { partial = false } = {}) {
  if (!isPlainObject(value)) throw new HttpError(400, 'Valid refund information is required.')
  const fields = new Map([
    ['Full_Name', 200], ['Email', 320], ['Phone', 40], ['Course_Name', 200],
    ['Amount', 40], ['Reason', 1000],
  ])
  const output = {}
  for (const [field, maxLength] of fields) {
    if (partial && value[field] === undefined) continue
    output[field] = field === 'Email'
      ? normalizeEmail(value[field])
      : cleanText(value[field], maxLength)
  }
  if (output.Email && !isEmail(output.Email)) throw new HttpError(400, 'Please enter a valid refund email address.')
  if (!partial && (!output.Full_Name || !output.Amount)) {
    throw new HttpError(400, 'Student name and refund amount are required.')
  }
  if (!partial || value.Status !== undefined) {
    const status = cleanText(value.Status || 'pending', 20).toLowerCase()
    if (!['pending', 'refunded', 'denied'].includes(status)) throw new HttpError(400, 'Please choose a valid refund status.')
    output.Status = status
  }
  return output
}
const BOOKING_TIMES = new Set([
  '07:00 AM - 09:00 AM', '09:00 AM - 11:00 AM', '11:00 AM - 01:00 PM', '12:00 PM - 02:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM',
  '9:00 AM - 11:00 AM', '11:00 AM - 1:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM',
])
const BOOKING_HOLD_MINUTES = Math.max(5, Math.min(60, Number(process.env.BOOKING_HOLD_MINUTES) || 15))
const ACTIVE_BOOKING_STATUSES = ['held', 'scheduled', 'confirmed', 'booked']

const normalizeEmail = (value) => cleanText(value, 320).toLowerCase()
const normalizeBookingTime = (value) => {
  const compact = cleanText(value, 80).replace(/\s+/g, ' ')
  const aliases = {
    '9:00 AM - 11:00 AM': '09:00 AM - 11:00 AM',
    '11:00 AM - 1:00 PM': '11:00 AM - 01:00 PM',
    '2:00 PM - 4:00 PM': '02:00 PM - 04:00 PM',
    '4:00 PM - 6:00 PM': '04:00 PM - 06:00 PM',
  }
  return aliases[compact] || compact
}
const bookingSlotKey = (date, timeSlot) => `${date}|${normalizeBookingTime(timeSlot)}`
const courseIdCandidates = (courseId) => {
  const normalized = cleanText(courseId, 120)
  const candidates = [normalized]
  if (/^\d+$/.test(normalized)) candidates.push(Number(normalized))
  return [...new Set(candidates)]
}

let firebaseAuth
let canCheckFirebaseTokenRevocation = false
function getFirebaseAdminAuth() {
  if (firebaseAuth) return firebaseAuth

  let serviceAccount
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    || (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
      : '')

  if (rawServiceAccount) {
    try {
      serviceAccount = JSON.parse(rawServiceAccount)
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT must contain valid JSON.')
    }
  } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  }

  const projectId = serviceAccount?.projectId || serviceAccount?.project_id
    || process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
    || process.env.VITE_FIREBASE_PROJECT_ID
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is required for API authentication.')

  const options = { projectId }
  if (serviceAccount) {
    options.credential = cert({
      projectId,
      clientEmail: serviceAccount.clientEmail || serviceAccount.client_email,
      privateKey: String(serviceAccount.privateKey || serviceAccount.private_key || '').replace(/\\n/g, '\n'),
    })
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    options.credential = applicationDefault()
  }

  // Signature, issuer and audience validation only need the Firebase project id.
  // Revocation lookup additionally needs an Admin credential, which local
  // development may intentionally omit.
  canCheckFirebaseTokenRevocation = Boolean(options.credential)

  const firebaseApp = getApps()[0] || initializeApp(options)
  firebaseAuth = getAuth(firebaseApp)
  return firebaseAuth
}

async function requireAuth(req, res, next) {
  const authorization = String(req.headers.authorization || '')
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match) return res.status(401).json({ error: 'Authentication required.' })

  try {
    const adminAuth = getFirebaseAdminAuth()
    if (isProduction && !canCheckFirebaseTokenRevocation) {
      const configurationError = new Error('Firebase Admin credentials are required in production.')
      configurationError.code = 'auth/server-misconfigured'
      throw configurationError
    }
    req.auth = await adminAuth.verifyIdToken(match[1], canCheckFirebaseTokenRevocation)
    return next()
  } catch (error) {
    console.warn('Authentication rejected:', error.code || error.message)
    if (!isProduction && error.code && error.message) {
      console.warn('Authentication detail:', error.message)
    }
    if (error.code === 'auth/server-misconfigured') {
      return res.status(503).json({ error: 'Authentication service is temporarily unavailable.' })
    }
    return res.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' })
  }
}

async function requireSelf(req, res, next) {
  if (req.auth?.uid && req.auth.uid === req.params.uid) return next()
  try {
    const admin = await usersCol?.findOne({ uid: req.auth?.uid, isAdmin: true }, { projection: { _id: 1 } })
    if (admin) return next()
  } catch (error) {
    return sendServerError(res, error, 'Account authorization check failed')
  }
  return res.status(403).json({ error: 'You cannot access another user\'s account.' })
}

const PORT = process.env.PORT || 3001
const MONGO_URI = process.env.MONGO_URI
const DB_NAME = 'driving_school'

let db, mongoClient, usersCol, bookingsCol, bookingSlotsCol, contactCol, settingsCol, pricingCol, enrollmentsCol, areasCol, socialsCol, refundsCol, cartsCol
let connectPromise = null

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const isDuplicateKey = (error) => error?.code === 11000
const activeHoldExpiry = () => new Date(Date.now() + BOOKING_HOLD_MINUTES * 60_000)

function validateBookingSlot(date, timeSlot) {
  const cleanDate = cleanText(date, 10)
  const cleanTime = cleanText(timeSlot, 80).replace(/\s+/g, ' ')
  if (!isDateKey(cleanDate) || !BOOKING_TIMES.has(cleanTime)) {
    throw new HttpError(400, 'Please choose a valid booking date and time.')
  }
  if (cleanDate < californiaDateKey()) {
    throw new HttpError(400, 'Past dates cannot be booked.')
  }
  return { date: cleanDate, timeSlot: normalizeBookingTime(cleanTime) }
}

function pickupSlotsFromCourse(course) {
  const source = Array.isArray(course?.pickupSlots) ? course.pickupSlots : []
  const slots = source.map(slot => validateBookingSlot(slot?.date, slot?.time || slot?.timeSlot))
  const seen = new Set()
  for (const slot of slots) {
    const key = bookingSlotKey(slot.date, slot.timeSlot)
    if (seen.has(key)) throw new HttpError(400, 'The same date and time cannot be selected twice.')
    seen.add(key)
  }
  return slots
}

function slotLimitForTier(tier) {
  const id = String(tier?.id || '')
  const name = String(tier?.planName || '').toUpperCase()
  if (id === '2' || name.includes('BASIC PLAN')) return 1
  if (id === '5' || name.includes('PREMIER')) return 5
  if (id === '3' || name.includes('ESSENTIAL')) return 3
  if (id === '4' || name.includes('IDEAL FOR STUDENTS')) return 3
  if (id === '6' || id === '7' || name.includes('DMV DRIVE TEST CAR RENTAL')) return 1
  if (id === '8' || name.includes('FREEWAY FOCUSED COURSE')) return 1
  return 3
}

async function pricingTierById(courseId, session) {
  const candidates = [String(courseId)]
  if (/^\d+$/.test(String(courseId))) candidates.push(Number(courseId))
  return pricingCol.findOne({ id: { $in: candidates } }, { session })
}

let holdCleanupPromise = null
let lastHoldCleanupAt = 0
async function cleanupExpiredHolds(force = false) {
  if (!bookingSlotsCol || !bookingsCol) return
  const nowMs = Date.now()
  if (!force && nowMs - lastHoldCleanupAt < 30_000) return holdCleanupPromise
  if (holdCleanupPromise) return holdCleanupPromise

  lastHoldCleanupAt = nowMs
  holdCleanupPromise = (async () => {
    const now = new Date()
    const expiredLocks = await bookingSlotsCol
      .find({ status: 'held', expiresAt: { $lte: now } }, { projection: { bookingId: 1 } })
      .toArray()
    const bookingIds = expiredLocks.map(lock => lock.bookingId).filter(Boolean)

    await bookingSlotsCol.deleteMany({ status: 'held', expiresAt: { $lte: now } })
    if (bookingIds.length) {
      await bookingsCol.deleteMany({
        _id: { $in: bookingIds },
        status: 'held',
        holdExpiresAt: { $lte: now },
      })
    }
    await bookingsCol.deleteMany({ status: 'held', holdExpiresAt: { $lte: now } })
    if (cartsCol) {
      await cartsCol.updateMany(
        { 'items.holdExpiresAt': { $lte: now.toISOString() } },
        { $pull: { items: { holdExpiresAt: { $lte: now.toISOString() } } }, $set: { updatedAt: now.toISOString() } }
      )
      await cartsCol.deleteMany({ items: { $size: 0 } })
    }
  })().finally(() => {
    holdCleanupPromise = null
  })
  return holdCleanupPromise
}

async function backfillBookingSlotLocks() {
  const now = new Date()
  const cursor = bookingsCol.find({ status: { $in: ACTIVE_BOOKING_STATUSES } })
  for await (const booking of cursor) {
    if (!isDateKey(booking.date) || !BOOKING_TIMES.has(String(booking.timeSlot || '').replace(/\s+/g, ' '))) continue
    if (booking.status === 'held' && (!booking.holdExpiresAt || new Date(booking.holdExpiresAt) <= now)) continue

    const timeSlot = normalizeBookingTime(booking.timeSlot)
    const held = booking.status === 'held'
    const lock = {
      _id: bookingSlotKey(booking.date, timeSlot),
      date: booking.date,
      timeSlot,
      userId: booking.userId,
      courseId: String(booking.courseId || ''),
      bookingId: booking._id,
      status: held ? 'held' : 'confirmed',
      createdAt: new Date(),
    }
    if (held) lock.expiresAt = new Date(booking.holdExpiresAt)
    await bookingSlotsCol.updateOne({ _id: lock._id }, { $setOnInsert: lock }, { upsert: true })
  }
}

async function releaseCourseHolds(uid, courseId, session) {
  const filter = { userId: uid, courseId: { $in: courseIdCandidates(courseId) }, status: 'held' }
  const heldBookings = await bookingsCol.find(filter, { session, projection: { _id: 1 } }).toArray()
  const bookingIds = heldBookings.map(booking => booking._id)
  if (bookingIds.length) {
    await bookingSlotsCol.deleteMany(
      { userId: uid, courseId: { $in: courseIdCandidates(courseId) }, status: 'held', bookingId: { $in: bookingIds } },
      { session }
    )
    await bookingsCol.deleteMany({ ...filter, _id: { $in: bookingIds } }, { session })
  }
}

const unassignedBookingCourseFilter = [
  { courseId: { $exists: false } },
  { courseId: null },
  { courseId: '' },
]

async function countUnassignedActiveBookings(uid, session) {
  return bookingsCol.countDocuments({
    userId: uid,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    $or: unassignedBookingCourseFilter,
  }, { session })
}

async function cancelCourseBookings(uid, courseId, reason, session, { includeUnassigned = false } = {}) {
  const courseIds = courseIdCandidates(courseId)
  const activeFilter = {
    userId: uid,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    ...(includeUnassigned
      ? { $or: [{ courseId: { $in: courseIds } }, ...unassignedBookingCourseFilter] }
      : { courseId: { $in: courseIds } }),
  }
  const activeBookings = await bookingsCol
    .find(activeFilter, { session, projection: { _id: 1, status: 1 } })
    .toArray()
  const bookingIds = activeBookings.map(booking => booking._id)

  if (bookingIds.length) {
    await bookingSlotsCol.deleteMany(
      { userId: uid, bookingId: { $in: bookingIds } },
      { session }
    )
  }
  // Remove any stale lock that lost its booking document as well.
  await bookingSlotsCol.deleteMany(
    {
      userId: uid,
      status: { $in: ['held', 'confirmed'] },
      ...(includeUnassigned
        ? { $or: [{ courseId: { $in: courseIds } }, ...unassignedBookingCourseFilter] }
        : { courseId: { $in: courseIds } }),
    },
    { session }
  )

  const heldIds = activeBookings.filter(booking => booking.status === 'held').map(booking => booking._id)
  if (heldIds.length) {
    await bookingsCol.deleteMany(
      { _id: { $in: heldIds }, userId: uid, status: 'held' },
      { session }
    )
  }

  const confirmedIds = activeBookings.filter(booking => booking.status !== 'held').map(booking => booking._id)
  if (confirmedIds.length) {
    await bookingsCol.updateMany(
      { _id: { $in: confirmedIds }, userId: uid, status: { $in: ACTIVE_BOOKING_STATUSES.filter(status => status !== 'held') } },
      {
        $set: {
          status: 'cancelled',
          cancellationReason: cleanText(reason, 120),
          cancelledAt: new Date().toISOString(),
        },
        $unset: { holdExpiresAt: '', holdToken: '' },
      },
      { session }
    )
  }

  return activeBookings.length
}

async function applyRefundDecisionToCourse(refund, status, session) {
  const uid = cleanText(refund?.uid || refund?.User_UID, 160)
  const courseId = cleanText(refund?.Course_ID, 120)
  if (!uid || !courseId) return 0

  const normalizedStatus = cleanText(status, 20).toLowerCase()
  const courseStatus = normalizedStatus === 'refunded'
    ? 'Refunded'
    : normalizedStatus === 'denied'
      ? 'Enrolled'
      : 'Refund Pending'
  if (normalizedStatus === 'refunded') {
    await cancelCourseBookings(uid, courseId, 'refund_approved', session)
  }

  const decisionAt = new Date().toISOString()
  const update = {
    $set: {
      'courses.$[course].status': courseStatus,
      'courses.$[course].refundStatus': normalizedStatus,
    },
  }
  if (normalizedStatus === 'pending') {
    update.$unset = { 'courses.$[course].refundDecisionAt': '' }
  } else {
    update.$set['courses.$[course].refundDecisionAt'] = decisionAt
  }
  const result = await usersCol.updateOne(
    { uid },
    update,
    { session, arrayFilters: [{ 'course.id': { $in: courseIdCandidates(courseId) } }] }
  )
  return result.modifiedCount
}

async function createSlotHold({ uid, courseId, date, timeSlot, session, expiresAt }) {
  const key = bookingSlotKey(date, timeSlot)
  await bookingSlotsCol.deleteOne(
    { _id: key, status: 'held', expiresAt: { $lte: new Date() } },
    { session }
  )

  const bookingId = new ObjectId()
  const holdToken = randomUUID()
  const now = new Date()
  try {
    await bookingSlotsCol.insertOne({
      _id: key,
      date,
      timeSlot,
      userId: uid,
      courseId: String(courseId),
      bookingId,
      holdToken,
      status: 'held',
      expiresAt,
      createdAt: now,
    }, { session })
  } catch (error) {
    if (isDuplicateKey(error)) throw new HttpError(409, 'This time slot has already been booked. Please choose another slot.')
    throw error
  }

  await bookingsCol.insertOne({
    _id: bookingId,
    userId: uid,
    date,
    timeSlot,
    courseId: String(courseId),
    hours: 2,
    status: 'held',
    holdToken,
    holdExpiresAt: expiresAt,
    createdAt: now.toISOString(),
  }, { session })
  return bookingId
}

async function withMongoTransaction(callback) {
  const session = mongoClient.startSession()
  try {
    let value
    await session.withTransaction(async () => {
      value = await callback(session)
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      readPreference: 'primary',
    })
    return value
  } finally {
    await session.endSession()
  }
}

async function connectDB() {
  if (connectPromise) return connectPromise
  connectPromise = (async () => {
    if (!MONGO_URI) throw new Error('MONGO_URI is required.')
    mongoClient = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
      maxPoolSize: Math.max(5, Math.min(50, Number(process.env.MONGO_MAX_POOL_SIZE) || 20)),
    })
    await mongoClient.connect()
    db = mongoClient.db(DB_NAME)
    usersCol = db.collection('users')
    bookingsCol = db.collection('bookings')
    bookingSlotsCol = db.collection('booking_slots')
    contactCol = db.collection('contact')
    settingsCol = db.collection('settings')
    pricingCol = db.collection('pricing')
    enrollmentsCol = db.collection('enrollments')
    areasCol = db.collection('areas')
    socialsCol = db.collection('socials')
    refundsCol = db.collection('refunds')
    cartsCol = db.collection('carts')
    await usersCol.createIndex({ uid: 1 }, { unique: true })
    await bookingsCol.createIndex({ userId: 1, date: 1 })
    await bookingsCol.createIndex({ holdExpiresAt: 1 }, { expireAfterSeconds: 0, name: 'expire_booking_holds' })
    await bookingSlotsCol.createIndex({ date: 1 })
    await bookingSlotsCol.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'expire_slot_holds' })
    await cartsCol.createIndex({ uid: 1 }, { unique: true })
    await refundsCol.createIndex({ requestKey: 1 }, { unique: true, sparse: true, name: 'unique_user_refund_request' })
    await cleanupExpiredHolds(true)
    await backfillBookingSlotLocks()
    await seedPricing()
    await seedAreas()
    await seedSocials()
    console.log('MongoDB connected')
    return db
  })().catch((e) => {
    connectPromise = null
    throw e
  })
  return connectPromise
}

app.get('/api/health', async (_req, res) => {
  try {
    await connectDB()
    await db.command({ ping: 1 })
    res.setHeader('Cache-Control', 'no-store')
    return res.json({ ok: true })
  } catch (error) {
    console.error('Health check failed:', error?.message || error)
    return res.status(503).json({ ok: false })
  }
})

app.use('/api', rateLimit({ windowMs: 60_000, max: 300 }))
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (e) {
    sendServerError(res, e, 'Database connection failed')
  }
})

async function requireAdmin(req, res, next) {
  try {
    const admin = await usersCol.findOne({ uid: req.auth?.uid, isAdmin: true }, { projection: { _id: 1 } })
    if (!admin) return res.status(403).json({ error: 'Administrator access required.' })
    return next()
  } catch (error) {
    return sendServerError(res, error, 'Administrator check failed')
  }
}

app.use('/api/admin', requireAuth, requireAdmin)
app.use('/api/users/:uid', requireAuth, requireSelf)

app.post('/api/contact', rateLimit({ windowMs: 10 * 60_000, max: 5 }), async (req, res) => {
  try {
    const firstName = cleanText(req.body.firstName, 80)
    const lastName = cleanText(req.body.lastName, 80)
    const phone = cleanText(req.body.phone, 30)
    const email = cleanText(req.body.email, 160).toLowerCase()
    const comments = cleanText(req.body.comments, 2000)
    if (!firstName || !lastName || !phone || !email || !comments) {
      return res.status(400).json({ error: 'All fields are required.' })
    }
    if (!isEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' })
    await contactCol.insertOne({ firstName, lastName, phone, email, comments, createdAt: new Date().toISOString() })
    res.json({ ok: true })
  } catch (e) {
    sendServerError(res, e, 'Contact submission failed')
  }
})

app.get('/api/users/:uid', async (req, res) => {
  try {
    const user = await usersCol.findOne({ uid: req.params.uid })
    res.json(user || { uid: req.params.uid })
  } catch (e) {
    sendServerError(res, e, 'Profile lookup failed')
  }
})

async function claimInitialAdmin(decodedToken) {
  const allowedUid = cleanText(process.env.ADMIN_UID, 160)
  const allowedEmail = normalizeEmail(process.env.ADMIN_EMAIL)
  const tokenEmail = normalizeEmail(decodedToken?.email)
  const uidAuthorized = allowedUid && decodedToken?.uid === allowedUid
  const verifiedEmailAuthorized = !allowedUid
    && allowedEmail
    && decodedToken?.email_verified === true
    && tokenEmail === allowedEmail
  if (!uidAuthorized && !verifiedEmailAuthorized) return false

  const currentAdmin = await usersCol.findOne({ isAdmin: true }, { projection: { uid: 1 } })
  if (currentAdmin) return currentAdmin.uid === decodedToken.uid

  try {
    await settingsCol.insertOne({
      _id: 'admin-bootstrap',
      uid: decodedToken.uid,
      email: tokenEmail,
      createdAt: new Date(),
    })
  } catch (error) {
    if (error.code !== 11000) throw error
  }

  const bootstrap = await settingsCol.findOne({ _id: 'admin-bootstrap' })
  return bootstrap?.uid === decodedToken.uid
}

app.put('/api/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params
    const requestedAdminBootstrap = req.body?.isAdmin === true
    const data = sanitizeUserProfile(req.body)
    const authenticatedEmail = normalizeEmail(req.auth?.email)
    if (authenticatedEmail) data.email = authenticatedEmail

    if (requestedAdminBootstrap) {
      const canBootstrap = await claimInitialAdmin(req.auth)
      if (!canBootstrap) {
        return res.status(403).json({
          error: process.env.ADMIN_UID
            ? 'Administrator setup is restricted to the configured administrator account.'
            : process.env.ADMIN_EMAIL
              ? 'Administrator setup requires the configured administrator email to be verified.'
              : 'Administrator setup is disabled until ADMIN_EMAIL or ADMIN_UID is configured on the server.',
        })
      }
      data.isAdmin = true
    }

    await usersCol.updateOne(
      { uid },
      {
        $set: data,
        $setOnInsert: { uid, createdAt: new Date().toISOString() },
      },
      { upsert: true }
    )
    res.json({ ok: true })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    sendServerError(res, e, 'Profile update failed')
  }
})

app.get('/api/bookings/availability', async (req, res) => {
  try {
    const date = cleanText(req.query.date, 10)
    if (!isDateKey(date)) return res.status(400).json({ error: 'A valid date is required.' })
    await cleanupExpiredHolds()
    const now = new Date()
    const locks = await bookingSlotsCol.find({
      date,
      $or: [
        { status: 'confirmed' },
        { status: 'held', expiresAt: { $gt: now } },
      ],
    }, { projection: { timeSlot: 1 } }).toArray()
    res.json({ bookedTimes: [...new Set(locks.map(lock => lock.timeSlot).filter(Boolean))] })
  } catch (e) {
    sendServerError(res, e, 'Booking availability lookup failed')
  }
})

app.get('/api/bookings/:uid', requireAuth, requireSelf, async (req, res) => {
  try {
    const bookings = await bookingsCol
      .find({ userId: req.auth.uid, status: { $ne: 'held' } })
      .sort({ date: -1 })
      .toArray()
    res.json(bookings)
  } catch (e) {
    sendServerError(res, e, 'Booking history lookup failed')
  }
})

app.post('/api/bookings', requireAuth, requireAdmin, rateLimit({ windowMs: 60_000, max: 30 }), async (req, res) => {
  try {
    const { date, timeSlot } = validateBookingSlot(req.body.date, req.body.timeSlot)
    const userId = req.auth.uid
    const courseId = cleanText(req.body.courseId, 120)
    await cleanupExpiredHolds()

    const booking = await withMongoTransaction(async (session) => {
      const key = bookingSlotKey(date, timeSlot)
      await bookingSlotsCol.deleteOne({ _id: key, status: 'held', expiresAt: { $lte: new Date() } }, { session })
      const existingLock = await bookingSlotsCol.findOne({ _id: key }, { session })
      if (existingLock) {
        if (existingLock.status === 'held' && existingLock.userId === userId && existingLock.courseId === courseId) {
          const existingBooking = await bookingsCol.findOne({ _id: existingLock.bookingId, userId }, { session })
          if (existingBooking) return existingBooking
        }
        throw new HttpError(409, 'This time slot has already been booked. Please choose another slot.')
      }

      const bookingId = new ObjectId()
      const now = new Date()
      const doc = {
        _id: bookingId,
        userId,
        email: normalizeEmail(req.auth.email),
        date,
        timeSlot,
        courseId,
        hours: 2,
        status: 'scheduled',
        createdAt: now.toISOString(),
      }
      try {
        await bookingSlotsCol.insertOne({
          _id: key,
          date,
          timeSlot,
          userId,
          courseId,
          bookingId,
          status: 'confirmed',
          createdAt: now,
        }, { session })
      } catch (error) {
        if (isDuplicateKey(error)) throw new HttpError(409, 'This time slot has already been booked. Please choose another slot.')
        throw error
      }
      await bookingsCol.insertOne(doc, { session })
      return doc
    })

    res.json(booking)
  } catch (e) {
    res.status(e.status || (isDuplicateKey(e) ? 409 : 500)).json({
      error: e.status || isDuplicateKey(e)
        ? e.message || 'This time slot has already been booked. Please choose another slot.'
        : 'Unable to create the booking. Please try again.',
    })
  }
})

app.delete('/api/bookings/:id', requireAuth, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid booking id.' })
    const bookingId = new ObjectId(req.params.id)
    const result = await withMongoTransaction(async (session) => {
      const booking = await bookingsCol.findOne({ _id: bookingId, userId: req.auth.uid }, { session })
      if (!booking) return { found: false }
      if (booking.status === 'cancelled') return { found: true, duplicate: true, booking }
      if (booking.status === 'completed') {
        throw new HttpError(409, 'A completed lesson cannot be cancelled.')
      }
      await bookingSlotsCol.deleteOne({ bookingId, userId: req.auth.uid }, { session })
      if (booking.status === 'held') {
        await bookingsCol.deleteOne({ _id: bookingId, userId: req.auth.uid, status: 'held' }, { session })
        return { found: true, removedHold: true, booking: { ...booking, status: 'cancelled' } }
      }
      const cancelledAt = new Date().toISOString()
      await bookingsCol.updateOne(
        { _id: bookingId, userId: req.auth.uid },
        {
          $set: { status: 'cancelled', cancelledAt, cancellationReason: 'student_request' },
          $unset: { holdExpiresAt: '', holdToken: '' },
        },
        { session }
      )
      return { found: true, booking: { ...booking, status: 'cancelled', cancelledAt } }
    })
    if (!result.found) return res.status(404).json({ error: 'Booking not found.' })
    res.json({ ok: true, booking: result.booking, duplicate: Boolean(result.duplicate) })
  } catch (e) {
    res.status(e.status || 500).json({ error: e.status ? e.message : 'Unable to cancel the booking. Please try again.' })
  }
})

app.post('/api/users/:uid/courses', requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params
    const course = safeRecord(req.body)
    const courseId = cleanText(course?.id, 120)
    if (!courseId) return res.status(400).json({ error: 'Course id required' })
    course.id = courseId
    const user = await usersCol.findOne({ uid })
    const existing = (user?.courses || []).find(c => String(c.id) === courseId)
    if (existing) {
      return res.json({ ok: true, courses: user.courses, duplicate: true })
    }
    await usersCol.updateOne(
      { uid },
      { $push: { courses: { $each: [course], $slice: -100 } }, $setOnInsert: { uid, createdAt: new Date().toISOString() } },
      { upsert: true }
    )
    const updated = await usersCol.findOne({ uid })
    res.json({ ok: true, courses: updated?.courses || [] })
  } catch (e) {
    sendServerError(res, e, 'Course assignment failed')
  }
})

app.delete('/api/users/:uid/courses/:courseId', async (req, res) => {
  try {
    const uid = req.auth.uid
    const courseId = cleanText(req.params.courseId, 120)
    if (!courseId) return res.status(400).json({ error: 'Course id required.' })
    const result = await withMongoTransaction(async (session) => {
      const user = await usersCol.findOne({ uid }, { session })
      const course = (user?.courses || []).find(item => String(item?.id) === courseId)
      if (!course) return { found: false }
      if (String(course.status || '').toLowerCase() === 'refund pending') {
        throw new HttpError(409, 'This course already has a pending refund request.')
      }

      const activeCourseCount = (user?.courses || []).filter(item => {
        const status = String(item?.status || 'enrolled').toLowerCase()
        return !['cancelled', 'refunded'].includes(status)
      }).length
      // Old dashboard bookings did not store a courseId. They can only be
      // associated safely when this is the student's sole active course.
      const releasedBookings = await cancelCourseBookings(
        uid,
        courseId,
        'course_cancelled',
        session,
        { includeUnassigned: activeCourseCount === 1 }
      )
      const unlinkedBookings = await countUnassignedActiveBookings(uid, session)
      const ids = courseIdCandidates(courseId)
      await usersCol.updateOne(
        { uid },
        { $pull: { courses: { id: { $in: ids } } } },
        { session }
      )
      await cartsCol.updateOne(
        { uid },
        { $pull: { items: { id: { $in: ids } } }, $set: { updatedAt: new Date().toISOString() } },
        { session }
      )
      await cartsCol.deleteOne({ uid, items: { $size: 0 } }, { session })
      const updated = await usersCol.findOne({ uid }, { session, projection: { courses: 1 } })
      return { found: true, course, releasedBookings, unlinkedBookings, courses: updated?.courses || [] }
    })
    if (!result.found) return res.status(404).json({ error: 'Course not found.' })
    res.json({
      ok: true,
      courses: result.courses,
      cancelledCourse: result.course,
      releasedBookings: result.releasedBookings,
      unlinkedBookings: result.unlinkedBookings,
    })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    sendServerError(res, e, 'Course cancellation failed')
  }
})

app.post('/api/users/:uid/courses/:courseId/refund', rateLimit({ windowMs: 10 * 60_000, max: 10 }), async (req, res) => {
  try {
    const uid = req.auth.uid
    const courseId = cleanText(req.params.courseId, 120)
    const reason = cleanText(req.body?.reason, 1000) || 'Requested by student from the dashboard.'
    if (!courseId) return res.status(400).json({ error: 'Course id required.' })

    const result = await withMongoTransaction(async (session) => {
      const user = await usersCol.findOne({ uid }, { session })
      const courses = user?.courses || []
      const course = courses.find(item => String(item?.id) === courseId)
      if (!course) return { found: false }

      const enrollmentFingerprint = cleanText(
        course.enrolledAt || course.createdAt || course.paymentRef || 'legacy-current-enrollment',
        160
      )
      const requestKey = `${uid}|${courseId}|${enrollmentFingerprint}`
      const existing = await refundsCol.findOne({ requestKey }, { session })
      if (existing) {
        const existingStatus = cleanText(existing.Status || 'pending', 20).toLowerCase()
        if (existingStatus === 'denied') {
          throw new HttpError(409, 'The refund request for this enrollment was reviewed and denied. Please contact the school if you need further help.')
        }
        if (existingStatus === 'refunded') {
          throw new HttpError(409, 'This enrollment has already been refunded.')
        }
        return { found: true, duplicate: true, refund: existing, courses }
      }

      const refundId = new ObjectId()
      const requestedAt = new Date()
      const fullName = cleanText(
        user.displayName || user.username || user.name
          || [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' '),
        200
      ) || 'Student'
      const refund = {
        _id: refundId,
        requestKey,
        uid,
        User_UID: uid,
        Course_ID: courseId,
        Enrollment_Date: enrollmentFingerprint,
        Full_Name: fullName,
        Email: normalizeEmail(req.auth.email || user.email),
        Phone: cleanText(user.phone, 40),
        Course_Name: cleanText(course.title || course.planName || 'Driving course', 200),
        Amount: cleanText(course.price, 40) || '$0',
        Reason: reason,
        Status: 'pending',
        created_at: requestedAt.toISOString().replace('T', ' ').slice(0, 19),
        createdAt: requestedAt,
      }
      await refundsCol.insertOne(refund, { session })

      const activeCourseCount = courses.filter(item => {
        const status = String(item?.status || 'enrolled').toLowerCase()
        return !['cancelled', 'refunded'].includes(status)
      }).length
      const releasedBookings = await cancelCourseBookings(
        uid,
        courseId,
        'refund_requested',
        session,
        { includeUnassigned: activeCourseCount === 1 }
      )
      const unlinkedBookings = await countUnassignedActiveBookings(uid, session)
      const ids = courseIdCandidates(courseId)
      await usersCol.updateOne(
        { uid },
        {
          $set: {
            'courses.$[course].status': 'Refund Pending',
            'courses.$[course].refundStatus': 'pending',
            'courses.$[course].refundRequestId': refundId.toString(),
            'courses.$[course].refundRequestedAt': requestedAt.toISOString(),
          },
        },
        { session, arrayFilters: [{ 'course.id': { $in: ids } }] }
      )
      await cartsCol.updateOne(
        { uid },
        { $pull: { items: { id: { $in: ids } } }, $set: { updatedAt: requestedAt.toISOString() } },
        { session }
      )
      await cartsCol.deleteOne({ uid, items: { $size: 0 } }, { session })
      const updated = await usersCol.findOne({ uid }, { session, projection: { courses: 1 } })
      return {
        found: true,
        duplicate: false,
        refund,
        releasedBookings,
        unlinkedBookings,
        courses: updated?.courses || [],
      }
    })

    if (!result.found) return res.status(404).json({ error: 'Course not found.' })
    res.status(result.duplicate ? 200 : 201).json({
      ok: true,
      duplicate: Boolean(result.duplicate),
      refund: result.refund,
      courses: result.courses,
      releasedBookings: result.releasedBookings || 0,
      unlinkedBookings: result.unlinkedBookings || 0,
    })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    if (isDuplicateKey(e)) {
      return res.status(409).json({ error: 'A refund request already exists for this course enrollment.' })
    }
    sendServerError(res, e, 'Refund request failed')
  }
})

app.post('/api/users/:uid/payments', requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params
    const payment = safeRecord(req.body)
    if (!payment || Object.keys(payment).length === 0) return res.status(400).json({ error: 'Payment data required' })
    await usersCol.updateOne(
      { uid },
      {
        $push: { payments: { $each: [payment], $position: 0, $slice: 100 } },
        $setOnInsert: { uid, createdAt: new Date().toISOString() },
      },
      { upsert: true }
    )
    const user = await usersCol.findOne({ uid })
    res.json({ ok: true, payments: user?.payments || [] })
  } catch (e) {
    sendServerError(res, e, 'Payment record update failed')
  }
})

app.get('/api/users/:uid/cart', async (req, res) => {
  try {
    await cleanupExpiredHolds()
    const cart = await cartsCol.findOne({ uid: req.params.uid })
    res.json(cart?.items || [])
  } catch (e) {
    sendServerError(res, e, 'Cart lookup failed')
  }
})

app.post('/api/users/:uid/cart', async (req, res) => {
  try {
    const uid = req.auth.uid
    const courseId = cleanText(req.body?.id, 120)
    if (!courseId) return res.status(400).json({ ok: false, error: 'Course id required' })

    const slots = pickupSlotsFromCourse(req.body)
    await cleanupExpiredHolds()
    const expiresAt = activeHoldExpiry()
    const result = await withMongoTransaction(async (session) => {
      const tier = await pricingTierById(courseId, session)
      if (!tier) throw new HttpError(400, 'The selected pricing plan is not available.')
      const user = await usersCol.findOne({ uid }, { session, projection: { courses: 1 } })
      if ((user?.courses || []).some(course => String(course.id) === courseId)) {
        throw new HttpError(409, 'You are already enrolled in this plan. Please choose a different plan.')
      }
      const requiredSlots = slotLimitForTier(tier)
      if (slots.length !== requiredSlots) {
        throw new HttpError(400, `This plan requires exactly ${requiredSlots} booking slot${requiredSlots === 1 ? '' : 's'}.`)
      }

      const cart = await cartsCol.findOne({ uid }, { session })
      const oldItems = cart?.items || []
      const existingIndex = oldItems.findIndex(item => String(item.id) === courseId)
      const duplicate = existingIndex >= 0

      if (duplicate) await releaseCourseHolds(uid, courseId, session)
      for (const slot of slots) {
        await createSlotHold({ uid, courseId, ...slot, session, expiresAt })
      }

      const course = {
        id: courseId,
        title: cleanText(tier.planName, 160),
        price: cleanText(tier.planPrice, 40),
        city: cleanText(req.body?.city, 120),
        pickupSlots: slots.map(slot => ({ date: slot.date, time: slot.timeSlot })),
      }
      if (slots.length) {
        course.preferredDate = slots[0].date
        course.pickupTime = slots[0].timeSlot
        course.holdExpiresAt = expiresAt.toISOString()
      } else {
        delete course.holdExpiresAt
      }

      const items = duplicate
        ? oldItems.map((item, index) => index === existingIndex ? course : item)
        : [...oldItems, course]
      await cartsCol.updateOne(
        { uid },
        { $set: { uid, items, updatedAt: new Date().toISOString() } },
        { upsert: true, session }
      )
      return { items, duplicate }
    })
    res.json({ ok: true, items: result.items, duplicate: result.duplicate })
  } catch (e) {
    const status = e.status || (isDuplicateKey(e) ? 409 : 500)
    res.status(status).json({
      ok: false,
      error: e.status
        ? e.message
        : isDuplicateKey(e)
          ? 'One of the selected time slots is no longer available. Please choose another slot.'
          : 'Unable to add this course to your cart.',
    })
  }
})

app.delete('/api/users/:uid/cart/:courseId', async (req, res) => {
  try {
    const uid = req.auth.uid
    const courseId = cleanText(req.params.courseId, 120)
    const items = await withMongoTransaction(async (session) => {
      const cart = await cartsCol.findOne({ uid }, { session })
      const nextItems = (cart?.items || []).filter(item => String(item.id) !== courseId)
      await releaseCourseHolds(uid, courseId, session)
      if (nextItems.length) {
        await cartsCol.updateOne(
          { uid },
          { $set: { items: nextItems, updatedAt: new Date().toISOString() } },
          { session }
        )
      } else {
        await cartsCol.deleteOne({ uid }, { session })
      }
      return nextItems
    })
    res.json({ ok: true, items })
  } catch {
    res.status(500).json({ error: 'Unable to remove this course from your cart.' })
  }
})

app.post('/api/users/:uid/cart/checkout', async (req, res) => {
  try {
    const uid = req.auth.uid
    await cleanupExpiredHolds()
    const checkout = await withMongoTransaction(async (session) => {
      const cart = await cartsCol.findOne({ uid }, { session })
      const items = cart?.items || []
      if (items.length === 0) return { enrolled: 0, payment: null }

      const now = new Date()
      const holds = []
      const verifiedItems = []
      for (const item of items) {
        const courseId = String(item.id)
        const slots = pickupSlotsFromCourse(item)
        const tier = await pricingTierById(courseId, session)
        if (!tier) throw new HttpError(400, 'A pricing plan in your cart is no longer available.')
        const requiredSlots = slotLimitForTier(tier)
        if (slots.length !== requiredSlots) {
          throw new HttpError(409, `The ${tier.planName} selection must contain exactly ${requiredSlots} booking slot${requiredSlots === 1 ? '' : 's'}.`)
        }
        verifiedItems.push({
          ...item,
          id: courseId,
          title: tier.planName,
          price: tier.planPrice,
          pickupSlots: slots.map(slot => ({ date: slot.date, time: slot.timeSlot })),
        })
        for (const slot of slots) {
          const lock = await bookingSlotsCol.findOne({
            _id: bookingSlotKey(slot.date, slot.timeSlot),
            userId: uid,
            courseId,
            status: 'held',
            expiresAt: { $gt: now },
          }, { session })
          if (!lock) {
            throw new HttpError(409, 'A reserved time slot expired or is no longer available. Please select the slot again.')
          }
          const heldBooking = await bookingsCol.findOne({
            _id: lock.bookingId,
            userId: uid,
            courseId,
            status: 'held',
          }, { session })
          if (!heldBooking) throw new HttpError(409, 'A reserved time slot is no longer available. Please select it again.')
          holds.push({ lock, booking: heldBooking })
        }
      }

      const user = await usersCol.findOne({ uid }, { session })
      const existingCourses = user?.courses || []
      const duplicateCourse = verifiedItems.find(item =>
        existingCourses.some(course => String(course.id) === String(item.id))
      )
      if (duplicateCourse) {
        throw new HttpError(409, `You are already enrolled in ${duplicateCourse.title}. Please remove it from the cart.`)
      }
      const enrolledAt = new Date().toISOString()
      const toAdd = verifiedItems
        .map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          city: item.city || '',
          preferredDate: item.preferredDate || '',
          pickupTime: item.pickupTime || '',
          pickupSlots: item.pickupSlots || [],
          status: 'Enrolled',
          progress: 0,
          enrolledAt,
          email: normalizeEmail(req.auth.email) || user?.email || '',
        }))

      const payment = {
        date: enrolledAt.split('T')[0],
        ref: `INV-${Date.now().toString(36).toUpperCase()}`,
        email: normalizeEmail(req.auth.email) || user?.email || '',
        item: toAdd.map(course => course.title).join(' + '),
        amount: toAdd.reduce((sum, course) => sum + (parseFloat(String(course.price).replace(/[^0-9.]/g, '')) || 0), 0),
        status: 'Pending',
      }

      const push = { payments: { $each: [payment], $position: 0 } }
      if (toAdd.length) push.courses = { $each: toAdd }
      await usersCol.updateOne(
        { uid },
        { $push: push, $setOnInsert: { uid } },
        { upsert: true, session }
      )

      for (const { lock, booking } of holds) {
        const lockResult = await bookingSlotsCol.updateOne(
          { _id: lock._id, userId: uid, status: 'held', holdToken: lock.holdToken },
          { $set: { status: 'confirmed', confirmedAt: now }, $unset: { expiresAt: '', holdToken: '' } },
          { session }
        )
        const bookingResult = await bookingsCol.updateOne(
          { _id: booking._id, userId: uid, status: 'held', holdToken: booking.holdToken },
          { $set: { status: 'confirmed', confirmedAt: now.toISOString() }, $unset: { holdExpiresAt: '', holdToken: '' } },
          { session }
        )
        if (lockResult.matchedCount !== 1 || bookingResult.matchedCount !== 1) {
          throw new HttpError(409, 'A reserved time slot changed before checkout. Please select it again.')
        }
      }

      await cartsCol.deleteOne({ uid }, { session })
      return { enrolled: toAdd.length, payment }
    })
    res.json({ ok: true, enrolled: checkout.enrolled, payment: checkout.payment })
  } catch (e) {
    res.status(e.status || 500).json({
      ok: false,
      error: e.status ? e.message : 'Checkout could not be completed. Please try again.',
    })
  }
})

app.post('/api/users/:uid/dedup-courses', async (req, res) => {
  try {
    const { uid } = req.params
    const user = await usersCol.findOne({ uid })
    if (!user || !user.courses || user.courses.length === 0) {
      return res.json({ ok: true, courses: [] })
    }
    const seen = new Map()
    for (const c of user.courses) {
      const key = String(c?.id ?? '')
      if (key && !seen.has(key)) seen.set(key, c)
    }
    const deduped = Array.from(seen.values())
    await usersCol.updateOne({ uid }, { $set: { courses: deduped } })
    res.json({ ok: true, courses: deduped })
  } catch (e) {
    sendServerError(res, e, 'Course cleanup failed')
  }
})

app.get('/api/users/:uid/messages', async (req, res) => {
  try {
    const user = await usersCol.findOne({ uid: req.params.uid })
    res.json(user?.messages || [])
  } catch (e) {
    sendServerError(res, e, 'Message lookup failed')
  }
})

app.post('/api/users/:uid/messages', async (req, res) => {
  try {
    const { uid } = req.params
    const subject = cleanText(req.body?.subject, 200)
    const text = cleanText(req.body?.text, 4000)
    if (!subject || !text) return res.status(400).json({ error: 'Subject and text required' })
    const thread = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      subject,
      messages: [{ from: 'user', text, timestamp: new Date().toISOString() }],
      read: false,
      createdAt: new Date().toISOString(),
    }
    await usersCol.updateOne(
      { uid },
      {
        $push: { messages: { $each: [thread], $position: 0, $slice: 100 } },
        $setOnInsert: { uid, createdAt: new Date().toISOString() },
      },
      { upsert: true }
    )
    const user = await usersCol.findOne({ uid })
    res.json({ ok: true, thread, messages: user?.messages || [] })
  } catch (e) {
    sendServerError(res, e, 'Message creation failed')
  }
})

app.post('/api/users/:uid/messages/:threadId/reply', async (req, res) => {
  try {
    const { uid, threadId } = req.params
    const text = cleanText(req.body?.text, 4000)
    if (!text) return res.status(400).json({ error: 'Text required' })
    const reply = { from: 'user', text, timestamp: new Date().toISOString() }
    const result = await usersCol.updateOne(
      { uid, 'messages.id': threadId },
      { $push: { 'messages.$.messages': { $each: [reply], $slice: -200 } } }
    )
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Message thread not found.' })
    const user = await usersCol.findOne({ uid })
    res.json({ ok: true, messages: user?.messages || [] })
  } catch (e) {
    sendServerError(res, e, 'Message reply failed')
  }
})

app.put('/api/users/:uid/messages/read', async (req, res) => {
  try {
    const { uid } = req.params
    await usersCol.updateOne(
      { uid, messages: { $type: 'array' } },
      { $set: { 'messages.$[].read': true } }
    )
    const user = await usersCol.findOne({ uid })
    res.json({ ok: true, messages: user?.messages || [] })
  } catch (e) {
    sendServerError(res, e, 'Message status update failed')
  }
})

async function supportSystemPrompt() {
  const [settings, pricing] = await Promise.all([
    settingsCol.findOne({ _id: 'site' }),
    pricingCol.find({}).sort({ order: 1, planName: 1 }).limit(50).toArray(),
  ])
  const phone = cleanText(settings?.phone, 40) || '+1 925 329 1736'
  const email = normalizeEmail(settings?.email) || 'aprecisiondrivingschool@gmail.com'
  const address = [cleanText(settings?.address, 300), cleanText(settings?.subaddress, 300)]
    .filter(Boolean)
    .join(', ') || '2001 Omega Rd, Ste 205, San Ramon, CA 94583'
  const courseLines = pricing.length
    ? pricing.map((tier, index) => {
      const name = cleanText(tier.planName, 160) || `Plan ${index + 1}`
      const price = cleanText(tier.planPrice, 40)
      const slots = slotLimitForTier(tier)
      return `${index + 1}. ${name}${price ? ` (${price})` : ''} - requires ${slots} lesson slot${slots === 1 ? '' : 's'}`
    }).join('\n')
    : 'Current packages and prices are available on the website Pricing page.'

  return `You are the support assistant for A Precision Driving School. Help students with the school website, course selection, lesson scheduling, permits, invoices, refund requests, and general California driving education. Keep answers concise, clear, professional, and friendly. Respond in the same language as the student.

CURRENT SCHOOL INFORMATION:
- Address: ${address}
- Phone: ${phone}
- Email: ${email}

CURRENT WEBSITE PACKAGES:
${courseLines}

WEBSITE WORKFLOWS:
- Students choose a package, city, required dates and time slots from the Pricing page, then continue through the cart.
- Students can view invoices, cancel future bookings, cancel a course, or submit a refund request from their dashboard.
- A submitted refund remains Refund Pending until an administrator approves or denies it.
- Payment-provider and bank instructions are not yet configured. Never request or invent card, bank, routing, or payment credentials; direct payment questions to the school using the contact details above.
- Do not invent prices, policies, availability, confirmations, or refund decisions. If current information is unavailable, ask the student to contact the school.`
}

app.post('/api/chat', requireAuth, rateLimit({ windowMs: 60_000, max: 12 }), async (req, res) => {
  try {
    if (!groq) return res.status(503).json({ error: 'Chat is temporarily unavailable.' })
    const messages = sanitizeChatMessages(req.body?.messages, 30)
    if (messages.length === 0) return res.status(400).json({ error: 'At least one message is required.' })

    const chatMessages = [
      { role: 'system', content: await supportSystemPrompt() },
      ...messages,
    ]

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: chatMessages,
      max_tokens: 800,
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not process your request.'
    res.json({ ok: true, reply })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    sendServerError(res, e, 'Chat request failed')
  }
})

app.get('/api/users/:uid/conversations', async (req, res) => {
  try {
    const user = await usersCol.findOne({ uid: req.params.uid })
    const convs = (user?.conversations || []).map(({ messages: _messages, ...rest }) => rest)
    res.json(convs)
  } catch (e) {
    sendServerError(res, e, 'Conversation list lookup failed')
  }
})

app.get('/api/users/:uid/conversations/:convId', async (req, res) => {
  try {
    const user = await usersCol.findOne({ uid: req.params.uid })
    const conv = (user?.conversations || []).find(c => c.id === req.params.convId)
    res.json(conv || null)
  } catch (e) {
    sendServerError(res, e, 'Conversation lookup failed')
  }
})

app.post('/api/users/:uid/conversations', async (req, res) => {
  try {
    const { uid } = req.params
    const title = cleanText(req.body?.title, 200) || 'New chat'
    const messages = sanitizeChatMessages(req.body?.messages || [], 100)
    const conv = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      title,
      messages,
      createdAt: new Date().toISOString(),
    }
    await usersCol.updateOne(
      { uid },
      {
        $push: { conversations: { $each: [conv], $position: 0, $slice: 50 } },
        $setOnInsert: { uid, createdAt: new Date().toISOString() },
      },
      { upsert: true }
    )
    res.json({ ok: true, conversation: conv })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    sendServerError(res, e, 'Conversation creation failed')
  }
})

app.put('/api/users/:uid/conversations/:convId', async (req, res) => {
  try {
    const { uid, convId } = req.params
    const update = {}
    if (req.body?.title !== undefined) update['conversations.$.title'] = cleanText(req.body.title, 200)
    if (req.body?.messages !== undefined) update['conversations.$.messages'] = sanitizeChatMessages(req.body.messages, 100)
    if (Object.keys(update).length === 0) return res.status(400).json({ error: 'No conversation changes were provided.' })
    const result = await usersCol.updateOne(
      { uid, 'conversations.id': convId },
      { $set: update }
    )
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Conversation not found.' })
    res.json({ ok: true })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    sendServerError(res, e, 'Conversation update failed')
  }
})

app.delete('/api/users/:uid/conversations/:convId', async (req, res) => {
  try {
    const { uid, convId } = req.params
    await usersCol.updateOne(
      { uid },
      { $pull: { conversations: { id: convId } } }
    )
    res.json({ ok: true })
  } catch (e) {
    sendServerError(res, e, 'Conversation deletion failed')
  }
})

app.get('/api/admin/stats', async (req, res) => {
  try {
    const [totalUsers, totalBookings, activeEnrollments] = await Promise.all([
      usersCol.countDocuments(),
      bookingsCol.countDocuments({ status: { $ne: 'held' } }),
      usersCol.countDocuments({ courseType: { $exists: true, $ne: '' } }),
    ])
    res.json({ totalUsers, totalBookings, activeEnrollments })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await usersCol.find().sort({ _id: -1 }).toArray()
    res.json(users)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/admin/bookings', async (req, res) => {
  try {
    const bookings = await bookingsCol.find({ status: { $ne: 'held' } }).sort({ _id: -1 }).toArray()
    res.json(bookings)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/admin/users/:uid/role', async (req, res) => {
  try {
    const targetUid = cleanText(req.params.uid, 160)
    const isAdmin = req.body?.isAdmin === true
    if (!targetUid) return res.status(400).json({ error: 'User id required.' })
    if (!isAdmin && targetUid === req.auth.uid) {
      return res.status(400).json({ error: 'You cannot remove your own administrator access.' })
    }
    if (!isAdmin) {
      const adminCount = await usersCol.countDocuments({ isAdmin: true })
      if (adminCount <= 1) return res.status(400).json({ error: 'At least one administrator must remain.' })
    }
    await usersCol.updateOne({ uid: targetUid }, { $set: { isAdmin } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/admin/bookings/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid booking id.' })
    const bookingId = new ObjectId(req.params.id)
    await withMongoTransaction(async (session) => {
      await bookingSlotsCol.deleteOne({ bookingId }, { session })
      await bookingsCol.deleteOne({ _id: bookingId }, { session })
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/admin/contacts', async (req, res) => {
  try {
    const contacts = await contactCol.find().sort({ _id: -1 }).toArray()
    res.json(contacts)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/admin/contacts/:id', async (req, res) => {
  try {
    await contactCol.updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/admin/contacts/:id', async (req, res) => {
  try {
    await contactCol.deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/pricing', async (req, res) => {
  try {
    const tiers = await pricingCol.find().sort({ order: 1, name: 1 }).toArray()
    res.json(tiers)
  } catch (e) {
    sendServerError(res, e, 'Pricing lookup failed')
  }
})

app.post('/api/admin/pricing', async (req, res) => {
  try {
    const doc = {
      ...sanitizePricing(req.body),
      createdAt: new Date().toISOString(),
    }
    const result = await pricingCol.insertOne(doc)
    res.json({ ok: true, _id: result.insertedId })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/admin/pricing/:id', async (req, res) => {
  try {
    const doc = sanitizePricing(req.body)
    if (req.body?.order === undefined) delete doc.order
    await pricingCol.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...doc, updatedAt: new Date().toISOString() } }
    )
    res.json({ ok: true })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/admin/pricing/:id', async (req, res) => {
  try {
    await pricingCol.deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/areas', async (req, res) => {
  try {
    const areas = await areasCol.find().sort({ order: 1, name: 1 }).toArray()
    res.json(areas)
  } catch (e) {
    sendServerError(res, e, 'Service area lookup failed')
  }
})

app.post('/api/admin/areas', async (req, res) => {
  try {
    const doc = {
      ...sanitizeArea(req.body),
      createdAt: new Date().toISOString(),
    }
    const result = await areasCol.insertOne(doc)
    res.json({ ok: true, _id: result.insertedId })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/admin/areas/:id', async (req, res) => {
  try {
    const doc = sanitizeArea(req.body)
    if (req.body?.order === undefined) delete doc.order
    await areasCol.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...doc, updatedAt: new Date().toISOString() } }
    )
    res.json({ ok: true })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/admin/areas/:id', async (req, res) => {
  try {
    await areasCol.deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/socials', async (req, res) => {
  try {
    const socials = await socialsCol.find().sort({ order: 1, platform: 1 }).toArray()
    res.json(socials)
  } catch (e) {
    sendServerError(res, e, 'Social link lookup failed')
  }
})

app.post('/api/admin/socials', async (req, res) => {
  try {
    const doc = {
      ...sanitizeSocial(req.body),
      createdAt: new Date().toISOString(),
    }
    const result = await socialsCol.insertOne(doc)
    res.json({ ok: true, _id: result.insertedId })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/admin/socials/:id', async (req, res) => {
  try {
    const doc = sanitizeSocial(req.body)
    if (req.body?.order === undefined) delete doc.order
    await socialsCol.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...doc, updatedAt: new Date().toISOString() } }
    )
    res.json({ ok: true })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/admin/socials/:id', async (req, res) => {
  try {
    await socialsCol.deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await settingsCol.findOne({ _id: 'site' })
    if (!settings) {
      return res.json({
        phone: '+1 925 329 1736',
        email: 'aprecisiondrivingschool@gmail.com',
        address: '2001 Omega Rd, Ste 205',
        subaddress: 'San Ramon, CA 94583',
        scheduleLabel: 'aprecisiondrivingschool.com',
        scheduleLink: 'https://www.aprecisiondrivingschool.com/schedule/cart_home.html',
      })
    }
    res.json(settings)
  } catch (e) {
    sendServerError(res, e, 'Site settings lookup failed')
  }
})

app.put('/api/admin/settings', async (req, res) => {
  try {
    const settings = sanitizeSettings(req.body)
    await settingsCol.updateOne(
      { _id: 'site' },
      { $set: { ...settings, updatedAt: new Date().toISOString() } },
      { upsert: true }
    )
    res.json({ ok: true })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    res.status(500).json({ error: e.message })
  }
})

const AREA_ICON = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5'

const DEFAULT_AREAS = [
  { name: 'San Ramon', map: 'https://maps.google.com/maps?q=San+Ramon+CA&t=&z=13&ie=UTF8&iwloc=&output=embed', icon: AREA_ICON, order: 0 },
  { name: 'Danville', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100863.97399194786!2d-122.04184640146435!3d37.813488021706846!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808ff31209500587%3A0x185b7b97f3832fd5!2sDanville%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1714387044634!5m2!1sen!2sin', icon: AREA_ICON, order: 1 },
  { name: 'Livermore', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d101045.39924703917!2d-121.85476100892504!3d37.68049120011074!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fe586385a2071%3A0x98d32231cb6bd871!2sLivermore%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1714386912208!5m2!1sen!2sin', icon: AREA_ICON, order: 2 },
  { name: 'Pleasanton', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d202142.65679680137!2d-122.1723057097092!3d37.66145075852708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fe9a261ba755f%3A0xb3ab6847e1ea7d16!2sPleasanton%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1714386614013!5m2!1sen!2sin', icon: AREA_ICON, order: 3 },
  { name: 'Dublin', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100989.52971764698!2d-121.99252020662772!3d37.7214898142999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fe65cd6892231%3A0x3b327c848ef64057!2sDublin%2C%20CA%2094568%2C%20USA!5e0!3m2!1sen!2sin!4v1715787261489!5m2!1sen!2sin', icon: AREA_ICON, order: 4 },
]

const DEFAULT_SOCIALS = [
  { platform: 'facebook', url: 'https://www.facebook.com/people/A-Precision-Driving-School/61561300479300/', order: 0 },
  { platform: 'instagram', url: 'https://www.instagram.com/aprecisiondrivingschool/', order: 1 },
  { platform: 'youtube', url: 'https://www.youtube.com/@aprecisiondrivingschool', order: 2 },
]

const DEFAULT_PRICING = [
  { id: '1', planName: 'TEEN ONLINE DRIVERS ED', planPrice: '$39.99', planPriceTwo: '$39.99', options: [
    { text: 'CA DMV- Approved For Permit', permission: 'Included' },
    { text: 'Guaranteed to Pass!', permission: 'Included' },
    { text: 'Complete in Section, Easy & Convenient', permission: 'Included' },
    { text: 'Get Certificate of Completion', permission: 'Included' },
    { text: 'Fast Certificate Processing..', permission: 'Included' },
  ], order: 0 },
  { id: '2', planName: 'BASIC PLAN', planPrice: '$210', planPriceTwo: '$210', options: [
    { text: 'Online Course', permission: 'Included' },
    { text: '2 hours professional Training only', permission: 'Included' },
    { text: '2 Hours Behind-the-Wheel', permission: 'Included' },
    { text: '6-Hour Behind-the-Wheel-Training', permission: 'Not Included' },
    { text: '10-Hour Behind-the-Wheel-Training', permission: 'Not Included' },
  ], order: 1 },
  { id: '3', planName: 'ESSENTIAL PLAN', planPrice: '$599', planPriceTwo: '$599', options: [
    { text: 'Online Course', permission: 'Included' },
    { text: 'Behind the wheel only', permission: 'Included' },
    { text: '2 Hours Behind-the-Wheel', permission: 'Not Included' },
    { text: '6-Hour Behind-the-Wheel-Training', permission: 'Included' },
    { text: 'We will provide the required DL 400D certificate. (Teens Only)', permission: 'Included' },
  ], order: 2 },
  { id: '4', planName: 'IDEAL FOR STUDENTS', planPrice: '$615', planPriceTwo: '$615', options: [
    { text: 'Online Course', permission: 'Included' },
    { text: 'Everything you need to get licensed! Our most popular package!', permission: 'Included' },
    { text: 'Will provide a DL 400C certificate for the online course.', permission: 'Included' },
    { text: '6-Hour Behind-the-Wheel-Training', permission: 'Included' },
    { text: "You'll receive the DL 400D certificate (Teens Only)", permission: 'Included' },
  ], order: 3 },
  { id: '5', planName: 'PREMIER PLAN', planPrice: '$999', planPriceTwo: '$999', options: [
    { text: 'Online Course', permission: 'Included' },
    { text: '6 Hours Behind-the-Wheel', permission: 'Included' },
    { text: 'Plus 4 Extra hours!', permission: 'Included' },
    { text: '10-Hour Training', permission: 'Included' },
    { text: '', permission: 'Select' },
  ], order: 4 },
  { id: '6', planName: 'DMV Drive Test Car Rental', planPrice: '$225', planPriceTwo: '$290', options: [
    { text: 'DMV Drive Test Car Rental with 30 minutes practice', permission: 'Included' },
    { text: 'Use the school\'s car for DMV Drive Test.', permission: 'Included' },
    { text: 'Instructor accompanies you to the DMV.', permission: 'Included' },
    { text: '', permission: 'Select' },
    { text: '', permission: 'Select' },
  ], order: 5 },
  { id: '7', planName: 'DMV Drive Test Car Rental.', planPrice: '$249', planPriceTwo: '$320', options: [
    { text: 'DMV Drive Test Car Rental with 1 hour practice', permission: 'Included' },
    { text: 'Use the school\'s car for DMV Drive Test.', permission: 'Included' },
    { text: 'Instructor accompanies you to the DMV.', permission: 'Included' },
    { text: '', permission: 'Select' },
    { text: '', permission: 'Select' },
  ], order: 6 },
  { id: '8', planName: 'Freeway Focused Course', planPrice: '$200', planPriceTwo: '$249', options: [
    { text: '2-hour special training', permission: 'Included' },
    { text: 'Designed to help drivers feel confident on the freeway', permission: 'Included' },
    { text: 'Designed to teach merging', permission: 'Included' },
    { text: 'Exiting, lane changing, highway laws', permission: 'Included' },
    { text: 'Using dual-control vehicles.', permission: 'Included' },
  ], order: 7 },
]

app.get('/api/admin/enrollments', async (req, res) => {
  try {
    const { search, page = 1, limit = 10, from, to } = req.query
    const p = Math.max(1, parseInt(page))
    const l = Math.min(100, Math.max(1, parseInt(limit)))
    const filter = {}
    if (search) {
      const r = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [
        { Full_Name: r }, { Email: r }, { Phone: r },
        { Course_Name: r }, { Address: r }, { City: r },
        { 'Permit.Calender_booking_Id': r },
      ]
    }
    if (from || to) {
      filter.Applied_date = {}
      if (from) filter.Applied_date.$gte = from
      if (to) filter.Applied_date.$lte = to
    }
    const total = await enrollmentsCol.countDocuments(filter)
    const data = await enrollmentsCol.find(filter)
      .sort({ Applied_date: -1, _id: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .toArray()
    res.json({ data, total, page: p, limit: l, totalPages: Math.ceil(total / l) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/admin/enrollments/stats', async (req, res) => {
  try {
    const totalStudents = await enrollmentsCol.distinct('Email').then(e => e.length)
    const totalPackages = await enrollmentsCol.distinct('Course_Name').then(e => e.length)
    const totalEnrolled = await enrollmentsCol.countDocuments()
    res.json({ totalStudents, totalPackages, totalEnrolled })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/admin/enrollments', async (req, res) => {
  try {
    const doc = { ...req.body, Applied_date: new Date().toISOString().replace('T', ' ').slice(0, 19) }
    const r = await enrollmentsCol.insertOne(doc)
    res.json({ ok: true, _id: r.insertedId })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/admin/enrollments/:id', async (req, res) => {
  try {
    await enrollmentsCol.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date().toISOString() } }
    )
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/admin/enrollments/:id', async (req, res) => {
  try {
    await enrollmentsCol.deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/admin/refunds', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query
    const p = Math.max(1, parseInt(page))
    const l = Math.min(100, Math.max(1, parseInt(limit)))
    const filter = {}
    if (search) {
      const r = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ Full_Name: r }, { Email: r }, { Phone: r }, { Course_Name: r }, { Reason: r }]
    }
    const total = await refundsCol.countDocuments(filter)
    const data = await refundsCol.find(filter)
      .sort({ created_at: -1, _id: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .toArray()
    res.json({ data, total, page: p, limit: l, totalPages: Math.ceil(total / l) })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/admin/refunds/stats', async (req, res) => {
  try {
    const all = await refundsCol.find({}).toArray()
    const totalRequests = all.length
    const totalRefunded = all.filter(x => String(x.Status || '').toLowerCase() === 'refunded').length
    const totalAmount = all
      .filter(x => String(x.Status || '').toLowerCase() === 'refunded' && x.Amount)
      .reduce((sum, x) => sum + (parseFloat(String(x.Amount).replace(/[^0-9.]/g, '')) || 0), 0)
    const pending = all.filter(x => String(x.Status || 'pending').toLowerCase() === 'pending').length
    res.json({ totalRequests, totalRefunded, totalAmount, pending })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/admin/refunds', async (req, res) => {
  try {
    const sanitized = sanitizeRefundRecord(req.body)
    const doc = {
      ...sanitized,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }
    const r = await refundsCol.insertOne(doc)
    res.json({ ok: true, _id: r.insertedId })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    sendServerError(res, e, 'Refund record creation failed')
  }
})

app.put('/api/admin/refunds/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid refund id.' })
    const refundId = new ObjectId(req.params.id)
    const sanitized = sanitizeRefundRecord(req.body, { partial: true })
    const result = await withMongoTransaction(async (session) => {
      const existing = await refundsCol.findOne({ _id: refundId }, { session })
      if (!existing) return { found: false }
      const updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
      await refundsCol.updateOne(
        { _id: refundId },
        { $set: { ...sanitized, updated_at: updatedAt } },
        { session }
      )
      const nextStatus = sanitized.Status || existing.Status || 'pending'
      await applyRefundDecisionToCourse(existing, nextStatus, session)
      return { found: true, status: nextStatus }
    })
    if (!result.found) return res.status(404).json({ error: 'Refund record not found.' })
    res.json({ ok: true, status: result.status })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    sendServerError(res, e, 'Refund record update failed')
  }
})

app.delete('/api/admin/refunds/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid refund id.' })
    const refundId = new ObjectId(req.params.id)
    const result = await withMongoTransaction(async (session) => {
      const existing = await refundsCol.findOne({ _id: refundId }, { session })
      if (!existing) return false
      if (String(existing.Status || 'pending').toLowerCase() === 'pending') {
        const uid = cleanText(existing.uid || existing.User_UID, 160)
        const courseId = cleanText(existing.Course_ID, 120)
        if (uid && courseId) {
          await usersCol.updateOne(
            { uid },
            {
              $set: { 'courses.$[course].status': 'Enrolled' },
              $unset: {
                'courses.$[course].refundRequestId': '',
                'courses.$[course].refundRequestedAt': '',
                'courses.$[course].refundStatus': '',
                'courses.$[course].refundDecisionAt': '',
              },
            },
            { session, arrayFilters: [{ 'course.id': { $in: courseIdCandidates(courseId) } }] }
          )
        }
      }
      await refundsCol.deleteOne({ _id: refundId }, { session })
      return true
    })
    if (!result) return res.status(404).json({ error: 'Refund record not found.' })
    res.json({ ok: true })
  } catch (e) {
    sendServerError(res, e, 'Refund record deletion failed')
  }
})


async function seedPricing() {
  const count = await pricingCol.countDocuments()
  if (count === 0) {
    await pricingCol.insertMany(DEFAULT_PRICING.map(t => ({ ...t, createdAt: new Date().toISOString() })))
    console.log('Seeded default pricing packages')
    return
  }

  const legacyCount = await pricingCol.countDocuments({
    planName: { $exists: false },
    name: { $exists: true },
  })
  if (legacyCount > 0) {
    console.warn(`Found ${legacyCount} legacy pricing record(s); preserved them for a controlled migration.`)
  }
}

async function seedAreas() {
  const count = await areasCol.countDocuments()
  if (count === 0) {
    await areasCol.insertMany(DEFAULT_AREAS.map(a => ({ ...a, createdAt: new Date().toISOString() })))
    console.log('Seeded default service areas')
  }
}

async function seedSocials() {
  const count = await socialsCol.countDocuments()
  if (count === 0) {
    await socialsCol.insertMany(DEFAULT_SOCIALS.map(s => ({ ...s, createdAt: new Date().toISOString() })))
    console.log('Seeded default social links')
  }
}

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' })
})

app.use((error, _req, res, next) => {
  console.error('Unhandled request error:', error?.message || error)
  if (res.headersSent) return next(error)
  if (error?.message === 'Origin not allowed by CORS') {
    return res.status(403).json({ error: 'Request origin is not allowed.' })
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' })
  }
  if (error?.type === 'entity.parse.failed' || (error instanceof SyntaxError && error?.status === 400)) {
    return res.status(400).json({ error: 'Invalid JSON request body.' })
  }
  return res.status(500).json({ error: 'Something went wrong. Please try again.' })
})

if (process.env.VERCEL !== '1') {
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`API running on port ${PORT}`))
    })
    .catch((e) => {
      console.error('MongoDB connection failed:', e.message)
      process.exit(1)
    })
}

export default app
