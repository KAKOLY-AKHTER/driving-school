import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import dns from 'node:dns'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MongoClient, ObjectId } from 'mongodb'
import Groq from 'groq-sdk'
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto'
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
    const url = new URL(String(value).trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.origin
  } catch {
    return ''
  }
}

const normalizeDeploymentOrigin = (value) => {
  const candidate = String(value || '').trim()
  if (!candidate) return ''
  return normalizeOrigin(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`)
}

const configuredClientOrigins = String(process.env.CLIENT_URL || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean)
const vercelSystemOrigins = [
  process.env.VERCEL_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_BRANCH_URL,
]
  .map(normalizeDeploymentOrigin)
  .filter(Boolean)
const allowedOrigins = new Set([...configuredClientOrigins, ...vercelSystemOrigins])
const isProduction = process.env.NODE_ENV === 'production'
const isVercelRuntime = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV)
const localDevelopmentHosts = new Set(['localhost', '127.0.0.1', '::1'])

const isLocalDevelopmentOrigin = (origin) => {
  if (isProduction) return false
  try {
    return localDevelopmentHosts.has(new URL(origin).hostname)
  } catch {
    return false
  }
}

const requestOrigins = (req) => {
  const hosts = [
    req.get('host'),
    String(req.get('x-forwarded-host') || '').split(',')[0].trim(),
  ].filter(Boolean)
  const protocols = new Set([
    req.protocol,
    String(req.get('x-forwarded-proto') || '').split(',')[0].trim(),
  ].filter(protocol => protocol === 'http' || protocol === 'https'))

  const origins = new Set()
  for (const host of hosts) {
    for (const protocol of protocols) {
      const origin = normalizeOrigin(`${protocol}://${host}`)
      if (origin) origins.add(origin)
    }
  }
  return origins
}

const corsPolicy = {
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86_400,
}

app.use(cors((req, callback) => {
  const requestOrigin = req.get('origin')

  // Requests without an Origin header (server-to-server, health checks, curl)
  // are not cross-origin browser requests and do not need CORS headers.
  if (!requestOrigin) return callback(null, { ...corsPolicy, origin: false })

  const normalized = normalizeOrigin(requestOrigin)
  const isAllowed = Boolean(normalized) && (
    allowedOrigins.has(normalized)
    || isLocalDevelopmentOrigin(normalized)
    || (isVercelRuntime && requestOrigins(req).has(normalized))
  )

  if (isAllowed) return callback(null, { ...corsPolicy, origin: normalized })
  return callback(new Error('Origin not allowed by CORS'))
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
const escapeEmailHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;')

const resendConfiguration = () => ({
  apiKey: cleanText(process.env.RESEND_API_KEY, 500),
  from: cleanText(process.env.CONTACT_FROM_EMAIL, 320),
  adminEmail: cleanText(process.env.CONTACT_ADMIN_EMAIL, 160).toLowerCase(),
})

async function sendResendEmail({ to, subject, html, replyTo }) {
  const { apiKey, from } = resendConfiguration()
  if (!apiKey || !from) return { skipped: true }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    signal: AbortSignal.timeout(8_000),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(cleanText(payload?.message, 240) || `Resend request failed with status ${response.status}.`)
  return { id: cleanText(payload?.id, 160) }
}

const emailShell = ({ eyebrow, title, body, footer }) => `<!doctype html><html><body style="margin:0;background:#f3f6fb;font-family:Arial,sans-serif;color:#17233a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #dfe7f1;border-radius:18px;overflow:hidden;box-shadow:0 16px 45px rgba(8,32,72,.1)"><tr><td style="height:7px;background:#0145a8"></td></tr><tr><td style="padding:34px 34px 12px"><div style="color:#a77900;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase">${eyebrow}</div><h1 style="margin:10px 0 0;color:#082048;font-size:28px;line-height:1.25">${title}</h1></td></tr><tr><td style="padding:12px 34px 34px;font-size:15px;line-height:1.7">${body}</td></tr><tr><td style="padding:18px 34px;background:#082048;color:#d8e1ed;font-size:12px;line-height:1.6">${footer}</td></tr></table></td></tr></table></body></html>`

async function deliverContactEmails(contact) {
  const { apiKey, from, adminEmail } = resendConfiguration()
  if (!apiKey || !from || !isEmail(adminEmail)) return { status: 'skipped', reason: 'Contact email environment variables are incomplete.' }
  const name = `${contact.firstName} ${contact.lastName}`.trim()
  const safeName = escapeEmailHtml(name)
  const safeEmail = escapeEmailHtml(contact.email)
  const safePhone = escapeEmailHtml(contact.phone)
  const safeComments = escapeEmailHtml(contact.comments).replaceAll('\n', '<br>')
  const adminHtml = emailShell({
    eyebrow: 'New website enquiry', title: `New message from ${safeName}`,
    body: `<p>A visitor submitted the website contact form.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f7faff"><tr><td style="padding:12px;font-weight:700">Email</td><td style="padding:12px"><a href="mailto:${safeEmail}" style="color:#0145a8">${safeEmail}</a></td></tr><tr><td style="padding:12px;font-weight:700">Phone</td><td style="padding:12px">${safePhone}</td></tr><tr><td style="padding:12px;font-weight:700;vertical-align:top">Message</td><td style="padding:12px">${safeComments}</td></tr></table><p>Reply to this email to respond directly to ${safeName}.</p>`,
    footer: 'A Precision Driving School · Website contact notification',
  })
  const receiptHtml = emailShell({
    eyebrow: 'Message received', title: `Thank you, ${safeName}.`,
    body: `<p>We received your message and a member of our team will get back to you as soon as possible.</p><div style="padding:16px;border-left:4px solid #fdbc01;background:#f7faff">${safeComments}</div><p>If your request is urgent, please call or text the school directly.</p>`,
    footer: 'A Precision Driving School · Please keep this email for your records.',
  })
  const results = await Promise.allSettled([
    sendResendEmail({ to: adminEmail, subject: `Website enquiry from ${name}`, html: adminHtml, replyTo: contact.email }),
    sendResendEmail({ to: contact.email, subject: 'We received your message | A Precision Driving School', html: receiptHtml, replyTo: adminEmail }),
  ])
  const sentIds = results.filter(result => result.status === 'fulfilled').map(result => result.value?.id).filter(Boolean)
  const errors = results.filter(result => result.status === 'rejected').map(result => cleanText(result.reason?.message, 240))
  return { status: errors.length === 0 ? 'sent' : sentIds.length ? 'partial' : 'failed', sentIds, ...(errors.length ? { error: errors.join(' | ') } : {}) }
}
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
const planPriceAmount = (value) => {
  const raw = cleanText(value, 40).replace(/[$,\s]/g, '')
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null
  const amount = Number(raw)
  return Number.isFinite(amount) && amount >= 0 && amount <= 1_000_000 ? amount : null
}
const normalizePlanPrice = (value) => {
  const amount = planPriceAmount(value)
  if (amount === null) return ''
  const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
  return `$${formatted}`
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
  ['parentPhone', 30], ['gender', 20], ['pickupAddress', 500],
  ['medications', 1000], ['notes', 2000], ['termsAcceptedAt', 40], ['submittedAt', 40], ['issueDate', 40], ['expiryDate', 40],
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
  const planPrice = normalizePlanPrice(value.planPrice)
  const planPriceTwo = normalizePlanPrice(value.planPriceTwo ?? value.planPrice)
  if (!id || !planName || !planPrice || !planPriceTwo) {
    throw new HttpError(400, 'Plan id, name, Near price, and Long price are required. Use valid dollar amounts.')
  }
  const allowedPermissions = new Set(['Select', 'Included', 'Optional', 'Not Included'])
  const options = (Array.isArray(value.options) ? value.options : []).slice(0, 20).map(option => ({
    text: cleanText(option?.text, 500),
    permission: allowedPermissions.has(option?.permission) ? option.permission : 'Select',
  }))
  return { id, planName, planPrice, planPriceTwo, options, order: cleanInteger(value.order, 0, 0, 10_000) }
}
const normalizeCouponCode = value => cleanText(value, 32).toUpperCase().replace(/\s+/g, '')
function sanitizeCoupon(value) {
  if (!isPlainObject(value)) throw new HttpError(400, 'A valid coupon is required.')
  const code = normalizeCouponCode(value.code)
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)) {
    throw new HttpError(400, 'Coupon code must be 3–32 characters using letters, numbers, hyphens, or underscores.')
  }
  const discountType = cleanText(value.discountType, 20).toLowerCase()
  if (!['fixed', 'percentage'].includes(discountType)) {
    throw new HttpError(400, 'Choose Fixed Amount or Percentage discount.')
  }
  const discountValue = Number(value.discountValue)
  const validValue = Number.isFinite(discountValue)
    && discountValue > 0
    && discountValue <= (discountType === 'percentage' ? 100 : 1_000_000)
    && Math.round(discountValue * 100) === discountValue * 100
  if (!validValue) {
    throw new HttpError(400, discountType === 'percentage'
      ? 'Percentage discount must be between 0.01 and 100.'
      : 'Fixed discount must be a valid dollar amount greater than zero.')
  }
  const startsAt = cleanText(value.startsAt, 10)
  const expiresAt = cleanText(value.expiresAt, 10)
  if (startsAt && !isDateKey(startsAt)) throw new HttpError(400, 'Start date must be a valid date.')
  if (expiresAt && !isDateKey(expiresAt)) throw new HttpError(400, 'Expiry date must be a valid date.')
  if (startsAt && expiresAt && expiresAt < startsAt) throw new HttpError(400, 'Expiry date cannot be before the start date.')
  return {
    code,
    discountType,
    discountValue: Number(discountValue.toFixed(2)),
    startsAt,
    expiresAt,
    isActive: value.isActive !== false,
  }
}
function couponDiscountQuote(subtotal, coupon, dateKey = californiaDateKey()) {
  const subtotalCents = moneyCents(subtotal)
  if (!coupon || !coupon.code) return { subtotal: subtotalCents / 100, discount: 0, total: subtotalCents / 100, coupon: null }
  if (coupon.isActive === false) throw new HttpError(400, 'This coupon is currently paused.')
  if (coupon.startsAt && dateKey < coupon.startsAt) throw new HttpError(400, `This coupon starts on ${coupon.startsAt}.`)
  if (coupon.expiresAt && dateKey > coupon.expiresAt) throw new HttpError(400, 'This coupon has expired.')
  if (subtotalCents <= 0) throw new HttpError(400, 'This order does not qualify for a coupon discount.')
  const requestedDiscountCents = coupon.discountType === 'percentage'
    ? Math.round(subtotalCents * Number(coupon.discountValue) / 100)
    : moneyCents(coupon.discountValue)
  // PayPal requires a positive capture amount. A coupon can discount the order
  // down to one cent, but never create a zero or negative payment.
  const discountCents = Math.max(0, Math.min(requestedDiscountCents, subtotalCents - 1))
  if (discountCents <= 0) throw new HttpError(400, 'This coupon does not reduce the current order total.')
  return {
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    total: (subtotalCents - discountCents) / 100,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
    },
  }
}
const couponCheckoutFingerprint = (cartFingerprint, quote) => quote?.coupon
  ? createHash('sha256').update(`${cartFingerprint}|${quote.coupon.code}|${moneyString(quote.discount)}|${moneyString(quote.total)}`).digest('hex')
  : cartFingerprint
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
const normalizeLocationKey = (value) => cleanText(value, 120)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

function sanitizeLocation(value) {
  if (!isPlainObject(value)) throw new HttpError(400, 'A valid booking location is required.')
  const name = cleanText(value.name, 120)
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|[\s'-])([a-z])/g, (_match, boundary, letter) => `${boundary}${letter.toUpperCase()}`)
  const key = normalizeLocationKey(name)
  const zipCode = cleanText(value.zipCode, 10)
  const rawDistance = cleanText(value.distance, 20).toLowerCase()
  const distance = rawDistance === 'near' ? 'Near' : rawDistance === 'long' ? 'Long' : ''
  if (!name || !key) throw new HttpError(400, 'City name is required.')
  if (zipCode && !/^\d{5}(?:-\d{4})?$/.test(zipCode)) {
    throw new HttpError(400, 'ZIP code must contain 5 digits or use ZIP+4 format.')
  }
  if (!distance) throw new HttpError(400, 'Package distance must be Near or Long.')
  return { name, key, zipCode, distance, order: cleanInteger(value.order, 0, 0, 10_000) }
}

async function locationUsage(location) {
  const safeName = cleanText(location?.name, 120).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!safeName) return { enrollments: 0, carts: 0, bookings: 0, total: 0 }
  const exactCity = { $regex: `^${safeName}$`, $options: 'i' }
  const [enrollmentRows, cartRows, bookings] = await Promise.all([
    usersCol.aggregate([
      { $unwind: '$courses' },
      { $match: { 'courses.city': exactCity } },
      { $count: 'count' },
    ]).toArray(),
    cartsCol.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.city': exactCity } },
      { $count: 'count' },
    ]).toArray(),
    bookingsCol.countDocuments({ city: exactCity }),
  ])
  const enrollments = Number(enrollmentRows[0]?.count || 0)
  const carts = Number(cartRows[0]?.count || 0)
  return { enrollments, carts, bookings, total: enrollments + carts + bookings }
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
function sanitizeReview(value, { partial = false } = {}) {
  if (!isPlainObject(value)) throw new HttpError(400, 'A valid customer review is required.')
  const output = {}
  if (!partial || value.name !== undefined) output.name = cleanText(value.name, 120)
  if (!partial || value.text !== undefined) output.text = cleanText(value.text, 1200)
  if (!partial || value.rating !== undefined) output.rating = cleanInteger(value.rating, 5, 1, 5)
  if (!partial || value.order !== undefined) output.order = cleanInteger(value.order, 0, 0, 10_000)
  if (!partial || value.published !== undefined) output.published = value.published !== false
  if (!partial && (!output.name || !output.text)) throw new HttpError(400, 'Reviewer name and review text are required.')
  if (partial && value.name !== undefined && !output.name) throw new HttpError(400, 'Reviewer name is required.')
  if (partial && value.text !== undefined && !output.text) throw new HttpError(400, 'Review text is required.')
  return output
}
const normalizeBlogSlug = value => cleanText(value, 180)
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 160)

function sanitizeBlog(value) {
  if (!isPlainObject(value)) throw new HttpError(400, 'A valid blog post is required.')
  const title = cleanText(value.title, 180).replace(/\s+/g, ' ')
  const content = cleanText(value.content, 30_000)
  const excerpt = cleanText(value.excerpt, 420) || content.slice(0, 260).trim()
  const category = cleanText(value.category, 80).replace(/\s+/g, ' ') || 'Driving Tips'
  const author = cleanText(value.author, 120).replace(/\s+/g, ' ') || 'A Precision Driving School'
  const imageUrl = cleanHttpUrl(value.imageUrl)
  const slug = normalizeBlogSlug(value.slug)
  const published = value.published === true
  const featured = value.featured === true
  const order = cleanInteger(value.order, 0, 0, 10_000)
  const rawPublishedAt = cleanText(value.publishedAt, 80)
  let publishedAt = ''
  if (rawPublishedAt) {
    const parsed = new Date(rawPublishedAt)
    if (Number.isNaN(parsed.getTime())) throw new HttpError(400, 'Please enter a valid publication date.')
    publishedAt = parsed.toISOString()
  }
  if (!title || !content) throw new HttpError(400, 'Blog title and content are required.')
  if (value.imageUrl && !imageUrl) throw new HttpError(400, 'Blog image must use a secure HTTPS URL.')
  return {
    title,
    slug,
    excerpt,
    content,
    category,
    author,
    imageUrl,
    published,
    featured,
    order,
    publishedAt,
    readingMinutes: Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200)),
  }
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
const isFinalRefundStatus = value => ['refunded', 'denied'].includes(cleanText(value || 'pending', 20).toLowerCase())
const BOOKING_TIMES = new Set([
  '07:00 AM - 09:00 AM', '09:00 AM - 11:00 AM', '11:00 AM - 01:00 PM', '12:00 PM - 02:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM',
  '9:00 AM - 11:00 AM', '11:00 AM - 1:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM',
])
const BOOKING_TIME_ORDER = new Map([
  '07:00 AM - 09:00 AM',
  '09:00 AM - 11:00 AM',
  '11:00 AM - 01:00 PM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
].map((time, index) => [time, index]))
const ADMIN_AVAILABILITY_TIMES = [
  '07:00 AM - 09:00 AM',
  '09:00 AM - 11:00 AM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
]
const ADMIN_AVAILABILITY_TIME_SET = new Set(ADMIN_AVAILABILITY_TIMES)
const CUSTOM_APPOINTMENT_TIME_PATTERN = /^(0[1-9]|1[0-2]):(00|15|30|45) (AM|PM)$/
const BOOKING_HOLD_MINUTES = Math.max(5, Math.min(60, Number(process.env.BOOKING_HOLD_MINUTES) || 15))
const ACTIVE_BOOKING_STATUSES = ['held', 'scheduled', 'confirmed', 'booked']
const COUNTED_PACKAGE_BOOKING_STATUSES = new Set(['scheduled', 'confirmed', 'booked', 'completed'])

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
const isCustomAppointmentTime = value => CUSTOM_APPOINTMENT_TIME_PATTERN.test(normalizeBookingTime(value))
const isSupportedStoredBookingTime = value => {
  const normalized = normalizeBookingTime(value)
  return BOOKING_TIMES.has(normalized) || isCustomAppointmentTime(normalized)
}
const isDmvRentalTier = tier => {
  const id = String(tier?.id || '')
  const name = cleanText(tier?.planName || tier?.title, 180).toUpperCase()
  return id === '6' || id === '7' || name.includes('DMV DRIVE TEST CAR RENTAL')
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
const PAYPAL_ENVIRONMENT = String(process.env.PAYPAL_ENVIRONMENT || 'sandbox').trim().toLowerCase() === 'live'
  ? 'live'
  : 'sandbox'
const PAYPAL_API_BASE = PAYPAL_ENVIRONMENT === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'
const PAYPAL_CURRENCY = 'USD'
const PAYPAL_ORDER_HOLD_MINUTES = Math.max(15, Math.min(60, Number(process.env.PAYPAL_ORDER_HOLD_MINUTES) || 30))
const GOOGLE_CALENDAR_TIME_ZONE = String(process.env.GOOGLE_CALENDAR_TIME_ZONE || 'America/Los_Angeles').trim()
const GOOGLE_CALENDAR_SETTING_ID = 'google-calendar'
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

let db, mongoClient, usersCol, bookingsCol, bookingSlotsCol, availabilityCol, contactCol, settingsCol, pricingCol, couponsCol, enrollmentsCol, areasCol, locationsCol, socialsCol, reviewsCol, blogsCol, refundsCol, cartsCol, paypalOrdersCol
let connectPromise = null

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function googleCalendarConfiguration() {
  const clientId = String(process.env.GOOGLE_CALENDAR_CLIENT_ID || '').trim()
  const clientSecret = String(process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '').trim()
  const redirectUri = String(process.env.GOOGLE_CALENDAR_REDIRECT_URI || '').trim()
  const tokenSecret = String(process.env.GOOGLE_CALENDAR_TOKEN_SECRET || '').trim()
  if (!clientId || !clientSecret || !redirectUri || tokenSecret.length < 32) {
    throw new HttpError(503, 'Google Calendar is not configured yet. Add the OAuth environment variables first.')
  }
  try {
    const parsed = new URL(redirectUri)
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Invalid protocol')
  } catch {
    throw new HttpError(503, 'GOOGLE_CALENDAR_REDIRECT_URI must be a valid HTTPS URL.')
  }
  return { clientId, clientSecret, redirectUri, tokenSecret }
}

const googleCalendarIsConfigured = () => {
  try {
    googleCalendarConfiguration()
    return true
  } catch {
    return false
  }
}

function encryptCalendarToken(value, secret) {
  const iv = randomBytes(12)
  const key = createHash('sha256').update(secret).digest()
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()])
  return {
    version: 1,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  }
}

function decryptCalendarToken(payload, secret) {
  if (!payload?.iv || !payload?.tag || !payload?.ciphertext) throw new Error('Stored Google Calendar token is invalid.')
  const key = createHash('sha256').update(secret).digest()
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(payload.tag, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

async function googleRequest(url, { method = 'GET', accessToken = '', body, form } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const headers = { Accept: 'application/json' }
    let requestBody
    if (form) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
      requestBody = new URLSearchParams(form)
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
      requestBody = JSON.stringify(body)
    }
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const response = await fetch(url, { method, headers, body: requestBody, signal: controller.signal })
    const text = await response.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch { data = null }
    if (!response.ok) {
      const error = new Error(data?.error_description || data?.error?.message || `Google API request failed (${response.status}).`)
      error.status = response.status
      throw error
    }
    return data
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Google Calendar took too long to respond.')
    throw error
  } finally {
    clearTimeout(timer)
  }
}

async function googleCalendarAccessToken(integration) {
  const config = googleCalendarConfiguration()
  const refreshToken = decryptCalendarToken(integration.refreshToken, config.tokenSecret)
  const token = await googleRequest('https://oauth2.googleapis.com/token', {
    method: 'POST',
    form: {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    },
  })
  if (!token?.access_token) throw new Error('Google did not return an access token.')
  return token.access_token
}

const bookingClockMinutes = (hour, minute, meridiem) => {
  let value = Number(hour) % 12
  if (String(meridiem).toUpperCase() === 'PM') value += 12
  return value * 60 + Number(minute)
}

function googleCalendarEventTimes(booking) {
  const time = normalizeBookingTime(booking?.timeSlot)
  const matches = [...time.matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi)]
  if (!isDateKey(booking?.date) || matches.length === 0) throw new Error('Booking date or time is invalid for Google Calendar.')
  const startMinutes = bookingClockMinutes(matches[0][1], matches[0][2], matches[0][3])
  let endMinutes = matches[1]
    ? bookingClockMinutes(matches[1][1], matches[1][2], matches[1][3])
    : startMinutes + Math.max(1, Math.min(12, Number(booking?.hours) || 2)) * 60
  if (endMinutes <= startMinutes) endMinutes += 24 * 60
  const localDateTime = (date, minutes) => {
    const base = new Date(`${date}T12:00:00Z`)
    base.setUTCDate(base.getUTCDate() + Math.floor(minutes / (24 * 60)))
    const dateKey = base.toISOString().slice(0, 10)
    const inDay = minutes % (24 * 60)
    return `${dateKey}T${String(Math.floor(inDay / 60)).padStart(2, '0')}:${String(inDay % 60).padStart(2, '0')}:00`
  }
  return {
    start: { dateTime: localDateTime(booking.date, startMinutes), timeZone: GOOGLE_CALENDAR_TIME_ZONE },
    end: { dateTime: localDateTime(booking.date, endMinutes), timeZone: GOOGLE_CALENDAR_TIME_ZONE },
  }
}

async function googleCalendarEventBody(booking) {
  const profile = booking?.userId
    ? await usersCol.findOne({ uid: booking.userId }, { projection: { displayName: 1, name: 1, firstName: 1, lastName: 1, email: 1, phone: 1, courses: 1 } })
    : null
  const course = (Array.isArray(profile?.courses) ? profile.courses : []).find(item =>
    (booking.enrollmentId && String(item?.enrollmentId || '') === String(booking.enrollmentId))
      || String(item?.id || '') === String(booking.courseId || '')
  )
  const studentName = cleanText(profile?.displayName || profile?.name || [profile?.firstName, profile?.lastName].filter(Boolean).join(' '), 160) || 'Student'
  const studentEmail = normalizeEmail(booking?.email || profile?.email)
  const plan = cleanText(course?.title || course?.planName, 180) || 'Legacy / Unassigned'
  const city = cleanText(course?.city || course?.location || booking?.location, 200)
  const cityZip = cleanText(course?.cityZip || booking?.cityZip, 10)
  const location = city ? `${city}, California${cityZip ? ` ${cityZip}` : ''}` : ''
  const description = [
    `Student: ${studentName}`,
    studentEmail ? `Email: ${studentEmail}` : '',
    profile?.phone ? `Phone: ${cleanText(profile.phone, 40)}` : '',
    `Plan: ${plan}`,
    `Booking status: ${normalizedBookingStatus(booking.status) || 'confirmed'}`,
    `Booking ID: ${String(booking._id)}`,
  ].filter(Boolean).join('\n')
  return {
    summary: `Driving Lesson — ${studentName}`,
    description,
    ...(location ? { location } : {}),
    ...googleCalendarEventTimes(booking),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 2 * 60 },
      ],
    },
    extendedProperties: { private: { bookingId: String(booking._id), source: 'aprecision-driving-school' } },
  }
}

async function recordCalendarSync(bookingId, values) {
  if (!bookingId || !ObjectId.isValid(String(bookingId))) return
  await bookingsCol.updateOne(
    { _id: new ObjectId(String(bookingId)) },
    { $set: Object.fromEntries(Object.entries(values).map(([key, value]) => [`googleCalendar.${key}`, value])) }
  )
}

async function syncBookingWithGoogleCalendar(booking, { deleted = false, integration, accessToken } = {}) {
  if (!booking?._id) return { skipped: true }
  const connection = integration || await settingsCol.findOne({ _id: GOOGLE_CALENDAR_SETTING_ID })
  if (!connection?.connected || !connection?.refreshToken || !googleCalendarIsConfigured()) return { skipped: true }
  const calendarId = encodeURIComponent(connection.calendarId || 'primary')
  const eventId = cleanText(booking?.googleCalendar?.eventId, 1024)
  const cancelled = deleted || normalizedBookingStatus(booking.status) === 'cancelled'
  try {
    const token = accessToken || await googleCalendarAccessToken(connection)
    if (cancelled) {
      if (eventId) {
        try {
          await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(eventId)}?sendUpdates=all`, { method: 'DELETE', accessToken: token })
        } catch (error) {
          if (error.status !== 404 && error.status !== 410) throw error
        }
      }
      if (!deleted) await recordCalendarSync(booking._id, { status: 'removed', eventId: '', htmlLink: '', syncedAt: new Date().toISOString(), lastError: '' })
      return { removed: true }
    }

    const eventBody = await googleCalendarEventBody(booking)
    let event
    if (eventId) {
      try {
        event = await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(eventId)}?sendUpdates=all`, { method: 'PATCH', accessToken: token, body: eventBody })
      } catch (error) {
        if (error.status !== 404 && error.status !== 410) throw error
      }
    }
    if (!event) {
      event = await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?sendUpdates=all`, { method: 'POST', accessToken: token, body: eventBody })
    }
    await recordCalendarSync(booking._id, {
      status: 'synced',
      eventId: cleanText(event?.id, 1024),
      htmlLink: cleanText(event?.htmlLink, 2048),
      connectedEmail: connection.connectedEmail || '',
      syncedAt: new Date().toISOString(),
      lastError: '',
    })
    return { synced: true, eventId: event?.id }
  } catch (error) {
    if (!deleted) await recordCalendarSync(booking._id, {
      status: 'failed',
      attemptedAt: new Date().toISOString(),
      lastError: cleanText(error?.message, 240) || 'Google Calendar sync failed.',
    })
    await settingsCol.updateOne(
      { _id: GOOGLE_CALENDAR_SETTING_ID },
      { $set: { lastError: cleanText(error?.message, 240), lastErrorAt: new Date().toISOString() } }
    )
    console.warn('Google Calendar booking sync failed:', error?.message || error)
    return { synced: false, error }
  }
}

async function syncBookingIdsWithGoogleCalendar(bookingIds = []) {
  const ids = bookingIds.filter(id => ObjectId.isValid(String(id))).map(id => new ObjectId(String(id)))
  if (!ids.length || !googleCalendarIsConfigured()) return
  const integration = await settingsCol.findOne({ _id: GOOGLE_CALENDAR_SETTING_ID })
  if (!integration?.connected || !integration?.refreshToken) return
  let accessToken
  try {
    accessToken = await googleCalendarAccessToken(integration)
  } catch (error) {
    await settingsCol.updateOne({ _id: GOOGLE_CALENDAR_SETTING_ID }, { $set: { lastError: cleanText(error?.message, 240), lastErrorAt: new Date().toISOString() } })
    return
  }
  const bookings = await bookingsCol.find({ _id: { $in: ids } }).toArray()
  for (const booking of bookings) await syncBookingWithGoogleCalendar(booking, { integration, accessToken })
}

async function safelySyncBookingIdsWithGoogleCalendar(bookingIds = []) {
  try {
    await syncBookingIdsWithGoogleCalendar(bookingIds)
  } catch (error) {
    console.warn('Google Calendar batch sync was deferred:', error?.message || error)
  }
}

async function safelySyncBookingWithGoogleCalendar(booking, options) {
  try {
    await syncBookingWithGoogleCalendar(booking, options)
  } catch (error) {
    console.warn('Google Calendar sync was deferred:', error?.message || error)
  }
}

async function safelySyncCancelledCourseBookings(uid, cancellationReason) {
  try {
    const bookings = await bookingsCol.find({
      userId: uid,
      status: 'cancelled',
      cancellationReason,
      'googleCalendar.eventId': { $exists: true, $ne: '' },
    }).toArray()
    for (const booking of bookings) await safelySyncBookingWithGoogleCalendar(booking)
  } catch (error) {
    console.warn('Cancelled course calendar cleanup was deferred:', error?.message || error)
  }
}

const moneyCents = (value) => Math.round(Number(value || 0) * 100)
const moneyString = (value) => (moneyCents(value) / 100).toFixed(2)

function checkoutFingerprint(items = []) {
  const canonical = items.map(item => ({
    id: String(item.id || ''),
    enrollmentId: cleanText(item.enrollmentId, 160),
    title: cleanText(item.title, 180),
    city: cleanText(item.city, 120),
    cityZip: cleanText(item.cityZip, 10),
    cityDistance: cleanText(item.cityDistance, 20),
    continuation: item.continuation === true,
    chargeAmount: moneyString(item.chargeAmount),
    pickupSlots: (Array.isArray(item.pickupSlots) ? item.pickupSlots : [])
      .map(slot => ({ date: cleanText(slot.date, 10), time: normalizeBookingTime(slot.time) }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
  })).sort((a, b) => a.id.localeCompare(b.id) || a.enrollmentId.localeCompare(b.enrollmentId))
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex')
}

const payableCheckoutAmount = (items = []) => items.reduce(
  (sum, item) => sum + (item.continuation === true ? 0 : Number(item.chargeAmount || 0)),
  0
)

async function resolveCouponQuote(code, subtotal, session, snapshot = null) {
  const normalizedCode = normalizeCouponCode(code || snapshot?.code)
  if (!normalizedCode) return couponDiscountQuote(subtotal, null)
  const coupon = snapshot?.code
    ? { ...snapshot, code: normalizedCode, isActive: true, startsAt: '', expiresAt: '' }
    : await couponsCol.findOne({ code: normalizedCode }, { session })
  if (!coupon) throw new HttpError(400, 'Coupon code was not found. Check the code and try again.')
  return couponDiscountQuote(subtotal, coupon)
}

let paypalAccessToken = ''
let paypalAccessTokenExpiresAt = 0

function paypalConfiguration() {
  const clientId = String(process.env.PAYPAL_CLIENT_ID || '').trim()
  const clientSecret = String(process.env.PAYPAL_CLIENT_SECRET || '').trim()
  if (!clientId || !clientSecret) {
    throw new HttpError(503, 'PayPal Sandbox is not configured yet. Please contact the school.')
  }
  return { clientId, clientSecret }
}

async function getPayPalAccessToken() {
  if (paypalAccessToken && paypalAccessTokenExpiresAt > Date.now() + 60_000) return paypalAccessToken
  const { clientId, clientSecret } = paypalConfiguration()
  let response
  try {
    response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    console.error('PayPal authentication request failed:', error?.message || error)
    throw new HttpError(502, 'PayPal could not be reached. Please try again.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.access_token) {
    console.error('PayPal authentication rejected:', response.status, data?.error || data?.name || 'unknown')
    throw new HttpError(502, 'PayPal authentication failed. Please contact the school.')
  }
  paypalAccessToken = data.access_token
  paypalAccessTokenExpiresAt = Date.now() + Math.max(60, Number(data.expires_in) || 300) * 1000
  return paypalAccessToken
}

async function paypalApiRequest(pathname, { method = 'GET', body, requestId = '' } = {}) {
  const accessToken = await getPayPalAccessToken()
  let response
  try {
    response = await fetch(`${PAYPAL_API_BASE}${pathname}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20_000),
    })
  } catch (error) {
    console.error('PayPal API request failed:', error?.message || error)
    throw new HttpError(502, 'PayPal could not be reached. Please try again.')
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const issue = cleanText(data?.details?.[0]?.issue || data?.name, 120)
    console.error('PayPal API rejected request:', response.status, issue || 'unknown', cleanText(data?.debug_id, 120))
    const error = new HttpError(response.status === 422 ? 422 : 502, 'PayPal could not complete this request. Please try again.')
    error.paypalIssue = issue
    throw error
  }
  return data
}

const refundedPaymentCents = (payment) => moneyCents(payment?.refundedAmount || 0)

function findPayPalPaymentForRefund(user, refund) {
  const payments = Array.isArray(user?.payments) ? user.payments : []
  const enrollmentId = cleanText(refund?.Enrollment_ID, 160)
  const courseName = cleanText(refund?.Course_Name, 200).toLowerCase()
  const refundAmount = planPriceAmount(refund?.Amount)
  const eligible = payments
    .map((payment, index) => ({ payment, index }))
    .filter(({ payment }) =>
      cleanText(payment?.provider, 40).toLowerCase() === 'paypal'
      && cleanText(payment?.providerCaptureId, 120)
      && refundedPaymentCents(payment) < moneyCents(payment?.amount)
    )

  if (enrollmentId) {
    const exact = eligible.find(({ payment }) =>
      (Array.isArray(payment?.enrollmentIds) && payment.enrollmentIds.some(id => String(id) === enrollmentId))
      || (Array.isArray(payment?.courseBreakdown) && payment.courseBreakdown.some(item =>
        String(item?.enrollmentId) === enrollmentId
      ))
    )
    // A modern refund carrying an enrollment id must never fall back to a
    // similarly named legacy invoice. That could refund the wrong purchase
    // when a student buys the same package more than once.
    return exact || null
  }

  // Legacy invoices did not store enrollment IDs. Only match them when the
  // entire captured invoice is unmistakably for this one course and amount.
  return eligible.find(({ payment }) => {
    const item = cleanText(payment?.item, 500).toLowerCase()
    return courseName
      && item === courseName
      && refundAmount !== null
      && moneyCents(payment?.amount) === moneyCents(refundAmount)
  }) || null
}

async function resolvePayPalRefund(refund, payment) {
  const existingRefundId = cleanText(refund?.Provider_Refund_ID, 120)
  if (existingRefundId) {
    return paypalApiRequest(`/v2/payments/refunds/${encodeURIComponent(existingRefundId)}`)
  }

  const captureId = cleanText(payment?.providerCaptureId, 120)
  const refundAmount = planPriceAmount(refund?.Amount)
  if (!captureId || refundAmount === null || refundAmount <= 0) {
    throw new HttpError(409, 'This refund is not linked to a captured PayPal payment. Review the payment record before approving it.')
  }

  return paypalApiRequest(`/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    method: 'POST',
    requestId: `refund-${String(refund._id)}`,
    body: {
      amount: {
        value: moneyString(refundAmount),
        currency_code: PAYPAL_CURRENCY,
      },
      note_to_payer: 'Approved refund from A Precision Driving School.',
    },
  })
}

const isDuplicateKey = (error) => error?.code === 11000
const activeHoldExpiry = () => new Date(Date.now() + BOOKING_HOLD_MINUTES * 60_000)

function validateBookingSlot(date, timeSlot, { allowCustomAppointment = false } = {}) {
  const cleanDate = cleanText(date, 10)
  const cleanTime = normalizeBookingTime(timeSlot)
  const validTime = BOOKING_TIMES.has(cleanTime) || (allowCustomAppointment && isCustomAppointmentTime(cleanTime))
  if (!isDateKey(cleanDate) || !validTime) {
    throw new HttpError(400, 'Please choose a valid booking date and time.')
  }
  if (cleanDate < californiaDateKey()) {
    throw new HttpError(400, 'Past dates cannot be booked.')
  }
  return { date: cleanDate, timeSlot: cleanTime }
}

function validateAvailabilitySlot(date, timeSlot, { allowToday = true } = {}) {
  const slot = validateBookingSlot(date, timeSlot)
  if (!ADMIN_AVAILABILITY_TIME_SET.has(slot.timeSlot)) {
    throw new HttpError(400, 'Please choose one of the five supported lesson times.')
  }
  if (!allowToday && slot.date <= californiaDateKey()) {
    throw new HttpError(400, 'Please choose a future date.')
  }
  return slot
}

function adminAvailabilityStatus(slot, today = californiaDateKey()) {
  return slot?.status === 'available' && slot?.date <= today ? 'expired' : slot?.status
}

async function assertSlotsOpenForBooking(slots, session, status = 409, { dateAvailabilityOnly = false } = {}) {
  if (dateAvailabilityOnly) {
    const dates = [...new Set(slots.map(slot => slot.date))]
    if (!dates.length) throw new HttpError(status, 'Please choose at least one available appointment date.')
    const openDateSlots = await effectiveAvailabilitySlots({ date: { $in: dates } }, session)
    const availableDateSet = new Set(openDateSlots.filter(slot => slot.status === 'available').map(slot => slot.date))
    if (dates.some(date => !availableDateSet.has(date))) {
      throw new HttpError(status, 'One or more selected appointment dates are no longer available. Please choose again.')
    }
    return
  }
  const keys = [...new Set(slots.map(slot => bookingSlotKey(slot.date, slot.timeSlot)))]
  if (!keys.length) throw new HttpError(status, 'Please choose at least one available time slot.')
  const openCount = await availabilityCol.countDocuments(
    { slotKey: { $in: keys }, status: 'available' },
    session ? { session } : undefined
  )
  if (openCount !== keys.length) {
    throw new HttpError(status, 'One or more selected time slots are no longer available. Please choose again.')
  }
}

async function effectiveAvailabilitySlots(filter, session) {
  const availability = await availabilityCol.find(filter, session ? { session } : undefined)
    .sort({ date: 1, timeOrder: 1 })
    .toArray()
  if (!availability.length) return []
  const now = new Date()
  const locks = await bookingSlotsCol.find({
    _id: { $in: availability.map(item => item.slotKey) },
    $or: [
      { status: { $in: ['confirmed', 'booked', 'scheduled'] } },
      { status: 'held', expiresAt: { $gt: now } },
    ],
  }, session ? { session } : undefined).toArray()
  const locksByKey = new Map(locks.map(lock => [String(lock._id), lock]))
  return availability.map(item => {
    const lock = locksByKey.get(item.slotKey)
    const lockStatus = normalizedBookingStatus(lock?.status)
    const status = lockStatus === 'held'
      ? 'held'
      : lock
        ? 'booked'
        : item.status === 'blocked'
          ? 'blocked'
          : 'available'
    return { ...item, status }
  })
}

function pickupSlotsFromCourse(course, tier = course) {
  const source = Array.isArray(course?.pickupSlots) ? course.pickupSlots : []
  const allowCustomAppointment = isDmvRentalTier(tier)
  const slots = source.map(slot => validateBookingSlot(
    slot?.date,
    slot?.time || slot?.timeSlot,
    { allowCustomAppointment }
  ))
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

function validateSlotCountForTier(slots, tier, status = 400, planLabel = 'This plan') {
  const maximumSlots = slotLimitForTier(tier)
  if (slots.length < 1) {
    throw new HttpError(status, `${planLabel} must include at least 1 booking slot.`)
  }
  if (slots.length > maximumSlots) {
    throw new HttpError(status, `${planLabel} allows up to ${maximumSlots} booking slot${maximumSlots === 1 ? '' : 's'}.`)
  }
}

const normalizedBookingStatus = (value) => cleanText(value, 40).toLowerCase()

function canonicalAdminBookingStatus(booking, today = californiaDateKey()) {
  const status = normalizedBookingStatus(booking?.status)
  if (status === 'cancelled' || status === 'canceled') return 'cancelled'
  if (status === 'completed' || status === 'refunded' || status === 'no show' || String(booking?.date || '') < today) return 'completed'
  if (status === 'confirmed') return 'confirmed'
  return 'scheduled'
}
const normalizedCourseStatus = (value) => cleanText(value || 'Enrolled', 40).toLowerCase()
const courseCanAcceptMoreBookings = (course) => {
  const status = normalizedCourseStatus(course?.status)
  return !['cancelled', 'refunded', 'refund pending'].includes(status)
}
const courseEnrollmentFingerprint = (course) => cleanText(
  course?.enrolledAt || course?.createdAt || course?.paymentRef || 'legacy-current-enrollment',
  160
)
const findCourseEnrollmentIndex = (courses, courseId, fingerprint = '', { activeOnly = false } = {}) => {
  const candidates = []
  for (let index = 0; index < courses.length; index += 1) {
    const course = courses[index]
    if (String(course?.id) !== String(courseId)) continue
    if (activeOnly && !courseCanAcceptMoreBookings(course)) continue
    if (fingerprint && courseEnrollmentFingerprint(course) !== fingerprint) continue
    candidates.push(index)
  }
  return candidates.length ? candidates[candidates.length - 1] : -1
}

const safeStoredPickupSlot = (slot) => {
  const date = cleanText(slot?.date, 10)
  const timeSlot = normalizeBookingTime(slot?.time || slot?.timeSlot)
  if (!isDateKey(date) || !isSupportedStoredBookingTime(timeSlot)) return null
  return { date, time: timeSlot }
}

function packageSlotAllowance(course, tier, linkedBookings = [], selected = 0) {
  const maximum = slotLimitForTier(tier || course)
  const bookingBySlot = new Map()
  for (const booking of linkedBookings) {
    if (!isDateKey(booking?.date)) continue
    const time = normalizeBookingTime(booking?.timeSlot || booking?.time)
    if (!isSupportedStoredBookingTime(time)) continue
    bookingBySlot.set(bookingSlotKey(booking.date, time), normalizedBookingStatus(booking.status))
  }

  // pickupSlots is retained as a legacy fallback. A linked booking document is
  // authoritative, so a cancelled slot is not counted even if an old course
  // record still contains that slot.
  const effectiveSlots = new Map()
  for (const rawSlot of Array.isArray(course?.pickupSlots) ? course.pickupSlots : []) {
    const slot = safeStoredPickupSlot(rawSlot)
    if (!slot) continue
    const key = bookingSlotKey(slot.date, slot.time)
    if (normalizedBookingStatus(bookingBySlot.get(key)) === 'cancelled') continue
    effectiveSlots.set(key, slot)
  }
  for (const booking of linkedBookings) {
    const status = normalizedBookingStatus(booking?.status)
    if (!COUNTED_PACKAGE_BOOKING_STATUSES.has(status)) continue
    const slot = safeStoredPickupSlot({ date: booking.date, time: booking.timeSlot })
    if (slot) effectiveSlots.set(bookingSlotKey(slot.date, slot.time), slot)
  }

  const pickupSlots = [...effectiveSlots.values()].sort((a, b) =>
    a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
  )
  const used = pickupSlots.length
  const remaining = Math.max(0, maximum - used)
  return {
    maximum,
    used,
    selected: Math.max(0, Number(selected) || 0),
    remaining,
    remainingAfterSelection: Math.max(0, remaining - Math.max(0, Number(selected) || 0)),
    pickupSlots,
  }
}

const splitCheckoutItems = (items) => ({
  newItems: items.filter(item => !item.continuation),
  continuationItems: items.filter(item => item.continuation),
})

function validateContinuationSlotCount(selected, allowance, planLabel, status = 409) {
  if (selected < 1) {
    throw new HttpError(status, `${planLabel} must include at least 1 booking slot.`)
  }
  if (allowance.remaining === 0) {
    throw new HttpError(status, `You have already used all ${allowance.maximum} booking slots included with ${planLabel}.`)
  }
  if (selected > allowance.remaining) {
    throw new HttpError(status, `${planLabel} has ${allowance.remaining} booking slot${allowance.remaining === 1 ? '' : 's'} remaining.`)
  }
}

function bookingsForEnrollment(course, linkedBookings, nextEnrollmentAt = '') {
  const enrolledAt = Date.parse(course?.enrolledAt || course?.createdAt || '')
  if (!Number.isFinite(enrolledAt)) return linkedBookings
  // Holds are created shortly before checkout writes enrolledAt. Include that
  // small reservation window, while excluding bookings from an older purchase
  // of the same plan.
  const lowerBound = enrolledAt - (BOOKING_HOLD_MINUTES + 1) * 60_000
  const nextAt = Date.parse(nextEnrollmentAt || '')
  return linkedBookings.filter(booking => {
    const createdAt = Date.parse(booking?.createdAt || booking?.confirmedAt || '')
    if (!Number.isFinite(createdAt)) return true
    return createdAt >= lowerBound && (!Number.isFinite(nextAt) || createdAt < nextAt)
  })
}

async function linkedCourseBookings(uid, courseId, session, course) {
  const linked = await bookingsCol.find(
    {
      userId: uid,
      courseId: { $in: courseIdCandidates(courseId) },
      ...(course?.enrollmentId ? { enrollmentId: cleanText(course.enrollmentId, 160) } : {}),
    },
    { session }
  ).toArray()
  return course ? bookingsForEnrollment(course, linked) : linked
}

async function pricingTierById(courseId, session) {
  const candidates = [String(courseId)]
  if (/^\d+$/.test(String(courseId))) candidates.push(Number(courseId))
  return pricingCol.findOne({ id: { $in: candidates } }, { session })
}

async function bookingLocationByName(name, session) {
  const key = normalizeLocationKey(name)
  if (!key) throw new HttpError(400, 'Please select a booking city.')
  const location = await locationsCol.findOne({ key }, { session })
  if (!location) throw new HttpError(400, 'The selected booking city is not available.')
  return location
}

function pricingForBookingLocation(tier, location) {
  const distance = location?.distance === 'Long' ? 'Long' : 'Near'
  const configuredPrice = distance === 'Long'
    ? (tier?.planPriceTwo || tier?.planPrice)
    : tier?.planPrice
  const amount = planPriceAmount(configuredPrice)
  if (amount === null) {
    throw new HttpError(409, `${cleanText(tier?.planName, 160) || 'This plan'} does not have a valid ${distance} price. Please contact the school.`)
  }
  return {
    amount,
    label: normalizePlanPrice(configuredPrice),
    distance,
  }
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
      // Keep the expired cart selection visible so checkout can fail as a
      // whole. Removing only the expired item here could silently turn a mixed
      // cart into a partial checkout.
      await cartsCol.updateMany(
        { 'items.holdExpiresAt': { $lte: now.toISOString() } },
        {
          $set: {
            'items.$[expired].holdExpired': true,
            updatedAt: now.toISOString(),
          },
        },
        { arrayFilters: [{ 'expired.holdExpiresAt': { $lte: now.toISOString() } }] }
      )
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
    if (!isDateKey(booking.date) || !isSupportedStoredBookingTime(booking.timeSlot)) continue
    if (booking.status === 'held' && (!booking.holdExpiresAt || new Date(booking.holdExpiresAt) <= now)) continue

    const timeSlot = normalizeBookingTime(booking.timeSlot)
    const held = booking.status === 'held'
    const lock = {
      _id: bookingSlotKey(booking.date, timeSlot),
      date: booking.date,
      timeSlot,
      userId: booking.userId,
      courseId: String(booking.courseId || ''),
      enrollmentId: cleanText(booking.enrollmentId, 160),
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

async function cancelCourseBookings(uid, courseId, reason, session, { includeUnassigned = false, enrollmentId = '' } = {}) {
  const courseIds = courseIdCandidates(courseId)
  const enrollmentFilter = enrollmentId ? { enrollmentId: cleanText(enrollmentId, 160) } : {}
  const activeFilter = {
    userId: uid,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    ...enrollmentFilter,
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
      ...enrollmentFilter,
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

  const user = await usersCol.findOne({ uid }, { session, projection: { courses: 1 } })
  const courses = user?.courses || []
  const enrollmentId = cleanText(refund?.Enrollment_ID, 160)
  const fingerprint = cleanText(refund?.Enrollment_Date, 160)
  let courseIndex = enrollmentId
    ? courses.findLastIndex(course => String(course?.id) === courseId && String(course?.enrollmentId) === enrollmentId)
    : -1
  if (courseIndex < 0) courseIndex = findCourseEnrollmentIndex(courses, courseId, fingerprint)
  if (courseIndex < 0) return 0
  const course = courses[courseIndex]

  const normalizedStatus = cleanText(status, 20).toLowerCase()
  const courseStatus = normalizedStatus === 'refunded'
    ? 'Refunded'
    : normalizedStatus === 'denied'
      ? 'Enrolled'
      : 'Refund Pending'
  if (normalizedStatus === 'refunded') {
    await cancelCourseBookings(uid, courseId, 'refund_approved', session, {
      enrollmentId: cleanText(course?.enrollmentId, 160),
    })
  }

  const decisionAt = new Date().toISOString()
  const update = {
    $set: {
      [`courses.${courseIndex}.status`]: courseStatus,
      [`courses.${courseIndex}.refundStatus`]: normalizedStatus,
    },
  }
  if (normalizedStatus === 'pending') {
    update.$unset = { [`courses.${courseIndex}.refundDecisionAt`]: '' }
  } else {
    update.$set[`courses.${courseIndex}.refundDecisionAt`] = decisionAt
  }
  const result = await usersCol.updateOne(
    { uid },
    update,
    { session }
  )
  return result.modifiedCount
}

async function createSlotHold({ uid, courseId, enrollmentId, date, timeSlot, session, expiresAt }) {
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
      enrollmentId: cleanText(enrollmentId, 160),
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
    enrollmentId: cleanText(enrollmentId, 160),
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
    availabilityCol = db.collection('availability')
    contactCol = db.collection('contact')
    settingsCol = db.collection('settings')
    pricingCol = db.collection('pricing')
    couponsCol = db.collection('coupons')
    enrollmentsCol = db.collection('enrollments')
    areasCol = db.collection('areas')
    locationsCol = db.collection('locations')
    socialsCol = db.collection('socials')
    reviewsCol = db.collection('reviews')
    blogsCol = db.collection('blogs')
    refundsCol = db.collection('refunds')
    cartsCol = db.collection('carts')
    paypalOrdersCol = db.collection('paypal_orders')
    await usersCol.createIndex({ uid: 1 }, { unique: true })
    await bookingsCol.createIndex({ userId: 1, date: 1 })
    await bookingsCol.createIndex({ holdExpiresAt: 1 }, { expireAfterSeconds: 0, name: 'expire_booking_holds' })
    await bookingSlotsCol.createIndex({ date: 1 })
    await bookingSlotsCol.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'expire_slot_holds' })
    await availabilityCol.createIndex({ slotKey: 1 }, { unique: true, name: 'unique_admin_availability_slot' })
    await availabilityCol.createIndex({ date: 1, timeOrder: 1 })
    await cartsCol.createIndex({ uid: 1 }, { unique: true })
    await couponsCol.createIndex({ code: 1 }, { unique: true, name: 'unique_coupon_code' })
    await couponsCol.createIndex({ isActive: 1, expiresAt: 1 })
    await paypalOrdersCol.createIndex({ uid: 1, createdAt: -1 })
    await paypalOrdersCol.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'expire_unfinished_paypal_orders' })
    await refundsCol.createIndex({ requestKey: 1 }, { unique: true, sparse: true, name: 'unique_user_refund_request' })
    await locationsCol.createIndex({ key: 1 }, { unique: true, sparse: true, name: 'unique_booking_location' })
    await reviewsCol.createIndex({ published: 1, order: 1 })
    await blogsCol.createIndex({ slug: 1 }, { unique: true, name: 'unique_blog_slug' })
    await blogsCol.createIndex({ published: 1, featured: -1, publishedAt: -1 })
    await cleanupExpiredHolds(true)
    await backfillBookingSlotLocks()
    await seedPricing()
    await seedAreas()
    await seedLocations()
    await seedSocials()
    await seedReviews()
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

app.get('/api/google-calendar/callback', async (req, res) => {
  const state = cleanText(req.query?.state, 200)
  const stateId = state ? `google-calendar-oauth-state:${createHash('sha256').update(state).digest('hex')}` : ''
  let stateRecord = null
  const fallbackOrigin = configuredClientOrigins[0] || requestOrigins(req).values().next().value || ''
  const redirectBack = (result, message = '') => {
    const origin = stateRecord?.returnTo || fallbackOrigin
    if (!origin) return res.status(result === 'connected' ? 200 : 400).send(result === 'connected' ? 'Google Calendar connected. You may close this page.' : 'Google Calendar connection failed.')
    const target = new URL('/admin', origin)
    target.searchParams.set('tab', 'account')
    target.searchParams.set('calendar', result)
    if (message) target.searchParams.set('message', cleanText(message, 160))
    return res.redirect(303, target.toString())
  }
  try {
    if (!stateId) throw new HttpError(400, 'The Google Calendar connection request is invalid or expired.')
    stateRecord = await settingsCol.findOneAndDelete({ _id: stateId })
    if (!stateRecord || new Date(stateRecord.expiresAt).getTime() <= Date.now()) throw new HttpError(400, 'The Google Calendar connection request expired. Please start again.')
    if (req.query?.error) return redirectBack('error', req.query.error === 'access_denied' ? 'Google access was cancelled.' : 'Google authorization failed.')
    const code = cleanText(req.query?.code, 4096)
    if (!code) throw new HttpError(400, 'Google did not return an authorization code.')
    const config = googleCalendarConfiguration()
    const tokens = await googleRequest('https://oauth2.googleapis.com/token', {
      method: 'POST',
      form: {
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      },
    })
    if (!tokens?.access_token || !tokens?.refresh_token) throw new Error('Google did not return offline calendar access. Please connect again and approve access.')
    const identity = await googleRequest('https://openidconnect.googleapis.com/v1/userinfo', { accessToken: tokens.access_token })
    const connectedEmail = normalizeEmail(identity?.email)
    await settingsCol.updateOne(
      { _id: GOOGLE_CALENDAR_SETTING_ID },
      {
        $set: {
          connected: true,
          connectedEmail,
          calendarId: 'primary',
          refreshToken: encryptCalendarToken(tokens.refresh_token, config.tokenSecret),
          grantedScope: cleanText(tokens.scope, 1024),
          connectedAt: new Date().toISOString(),
          connectedBy: stateRecord.adminUid || '',
          lastError: '',
        },
      },
      { upsert: true }
    )
    return redirectBack('connected')
  } catch (error) {
    console.warn('Google Calendar OAuth callback failed:', error?.message || error)
    return redirectBack('error', error?.message || 'Google Calendar connection failed.')
  }
})

app.get('/api/admin/google-calendar', async (_req, res) => {
  const integration = await settingsCol.findOne({ _id: GOOGLE_CALENDAR_SETTING_ID })
  res.setHeader('Cache-Control', 'no-store')
  res.json({
    configured: googleCalendarIsConfigured(),
    connected: Boolean(integration?.connected && integration?.refreshToken),
    connectedEmail: integration?.connectedEmail || '',
    calendarId: integration?.calendarId || 'primary',
    connectedAt: integration?.connectedAt || '',
    lastTestAt: integration?.lastTestAt || '',
    lastError: integration?.lastError || '',
  })
})

app.post('/api/admin/google-calendar/connect', async (req, res) => {
  try {
    const config = googleCalendarConfiguration()
    const state = randomBytes(32).toString('hex')
    const stateHash = createHash('sha256').update(state).digest('hex')
    const requestOrigin = String(req.get('origin') || '')
    const returnTo = allowedOrigins.has(requestOrigin)
      ? requestOrigin
      : (configuredClientOrigins[0] || requestOrigins(req).values().next().value)
    await settingsCol.insertOne({
      _id: `google-calendar-oauth-state:${stateHash}`,
      adminUid: req.auth.uid,
      returnTo,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    })
    const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authorizationUrl.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: `openid email ${GOOGLE_CALENDAR_SCOPE}`,
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent select_account',
      state,
      login_hint: cleanText(req.body?.loginHint, 320) || 'info@aprecision.com',
    }).toString()
    res.json({ url: authorizationUrl.toString() })
  } catch (error) {
    res.status(error.status || 500).json({ error: error?.message || 'Unable to start Google Calendar connection.' })
  }
})

app.post('/api/admin/google-calendar/test', async (_req, res) => {
  try {
    const integration = await settingsCol.findOne({ _id: GOOGLE_CALENDAR_SETTING_ID })
    if (!integration?.connected || !integration?.refreshToken) throw new HttpError(409, 'Connect a Google Calendar account first.')
    const accessToken = await googleCalendarAccessToken(integration)
    const calendarId = encodeURIComponent(integration.calendarId || 'primary')
    await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?maxResults=1&singleEvents=true`, { accessToken })
    const testedAt = new Date().toISOString()
    await settingsCol.updateOne({ _id: GOOGLE_CALENDAR_SETTING_ID }, { $set: { lastTestAt: testedAt, lastError: '' } })
    res.json({ ok: true, testedAt })
  } catch (error) {
    await settingsCol.updateOne({ _id: GOOGLE_CALENDAR_SETTING_ID }, { $set: { lastError: cleanText(error?.message, 240), lastErrorAt: new Date().toISOString() } })
    res.status(error.status || 502).json({ error: error?.message || 'Google Calendar connection test failed.' })
  }
})

app.post('/api/admin/google-calendar/sync-upcoming', async (_req, res) => {
  const bookings = await bookingsCol.find({
    date: { $gte: californiaDateKey() },
    status: { $in: ['scheduled', 'confirmed', 'booked'] },
  }, { projection: { _id: 1 } }).sort({ date: 1 }).limit(250).toArray()
  await safelySyncBookingIdsWithGoogleCalendar(bookings.map(booking => booking._id))
  res.json({ ok: true, count: bookings.length })
})

app.delete('/api/admin/google-calendar', async (_req, res) => {
  const integration = await settingsCol.findOne({ _id: GOOGLE_CALENDAR_SETTING_ID })
  if (integration?.refreshToken && googleCalendarIsConfigured()) {
    try {
      const accessToken = await googleCalendarAccessToken(integration)
      await googleRequest(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`, { method: 'POST' })
    } catch (error) {
      console.warn('Google Calendar token revocation could not be confirmed:', error?.message || error)
    }
  }
  await settingsCol.deleteOne({ _id: GOOGLE_CALENDAR_SETTING_ID })
  res.json({ ok: true })
})

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
    const createdAt = new Date().toISOString()
    const contact = { firstName, lastName, phone, email, comments, createdAt, emailDelivery: { status: 'pending' } }
    const insertResult = await contactCol.insertOne(contact)
    const emailDelivery = await deliverContactEmails(contact).catch(error => ({
      status: 'failed',
      error: cleanText(error?.message, 240) || 'Email delivery failed.',
    }))
    await contactCol.updateOne(
      { _id: insertResult.insertedId },
      { $set: { emailDelivery: { ...emailDelivery, attemptedAt: new Date().toISOString() } } }
    ).catch(error => console.warn('Contact email status could not be saved:', error?.message || error))
    if (emailDelivery.status === 'failed') console.warn('Contact email delivery failed:', emailDelivery.error)
    if (emailDelivery.status === 'skipped') console.warn(emailDelivery.reason)
    res.json({ ok: true, emailNotification: emailDelivery.status })
  } catch (e) {
    sendServerError(res, e, 'Contact submission failed')
  }
})

app.get('/api/users/:uid', async (req, res) => {
  try {
    const user = await usersCol.findOne({ uid: req.params.uid })
    if (!user) return res.json({ uid: req.params.uid })

    const allCourseBookings = await bookingsCol.find({
      userId: req.params.uid,
      courseId: { $exists: true, $nin: [null, ''] },
    }).toArray()
    const bookingsByCourse = new Map()
    for (const booking of allCourseBookings) {
      const key = String(booking.courseId)
      if (!bookingsByCourse.has(key)) bookingsByCourse.set(key, [])
      bookingsByCourse.get(key).push(booking)
    }
    const storedCourses = user.courses || []
    const courses = storedCourses.map((course, courseIndex) => {
      const samePlanBookings = bookingsByCourse.get(String(course?.id)) || []
      const nextEnrollment = storedCourses
        .slice(courseIndex + 1)
        .find(candidate => String(candidate?.id) === String(course?.id))
      const linked = course?.enrollmentId
        ? samePlanBookings.filter(booking => String(booking?.enrollmentId) === String(course.enrollmentId))
        : bookingsForEnrollment(course, samePlanBookings, nextEnrollment?.enrolledAt || nextEnrollment?.createdAt)
      const allowance = packageSlotAllowance(course, course, linked)
      const refundStatus = cleanText(course?.refundStatus, 20).toLowerCase()
      return {
        ...course,
        pickupSlots: allowance.pickupSlots,
        slotAllowance: {
          maximum: allowance.maximum,
          used: allowance.used,
          remaining: allowance.remaining,
        },
        slotUsage: {
          maximum: allowance.maximum,
          used: allowance.used,
          remaining: allowance.remaining,
        },
        canBookMore: courseCanAcceptMoreBookings(course) && allowance.remaining > 0,
        canRequestRefund: courseCanAcceptMoreBookings(course) && !['pending', 'denied', 'refunded'].includes(refundStatus),
      }
    })
    res.json({ ...user, courses })
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
    const slots = await effectiveAvailabilitySlots({ date })
    const availableTimes = slots.filter(slot => slot.status === 'available').map(slot => slot.time)
    const bookedTimes = ADMIN_AVAILABILITY_TIMES.filter(time => !availableTimes.includes(time))
    const customLocks = await bookingSlotsCol.find({
      date,
      status: { $in: ['held', 'confirmed', 'booked', 'scheduled'] },
      timeSlot: { $regex: CUSTOM_APPOINTMENT_TIME_PATTERN },
    }, { projection: { timeSlot: 1 } }).toArray()
    res.json({
      date,
      configured: slots.length > 0,
      slots: ADMIN_AVAILABILITY_TIMES.map(time => {
        const slot = slots.find(item => item.time === time)
        return { time, status: slot?.status || 'unavailable' }
      }),
      availableTimes,
      bookedTimes,
      customBookedTimes: [...new Set(customLocks.map(lock => normalizeBookingTime(lock.timeSlot)))],
    })
  } catch (e) {
    sendServerError(res, e, 'Booking availability lookup failed')
  }
})

app.get('/api/availability', async (req, res) => {
  try {
    const from = cleanText(req.query.from, 10)
    const to = cleanText(req.query.to, 10)
    if (!isDateKey(from) || !isDateKey(to) || from > to) {
      return res.status(400).json({ error: 'A valid availability date range is required.' })
    }
    const rangeDays = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
    if (rangeDays > 93) return res.status(400).json({ error: 'Availability can be viewed up to 93 days at a time.' })
    await cleanupExpiredHolds()
    const slots = await effectiveAvailabilitySlots({ date: { $gte: from, $lte: to } })
    const dates = {}
    for (const slot of slots) {
      if (!dates[slot.date]) dates[slot.date] = []
      dates[slot.date].push({ time: slot.time, status: slot.status })
    }
    res.json({ from, to, dates, slots: slots.map(({ _id, slotKey, date, time, status }) => ({ _id, slotKey, date, time, status })) })
  } catch (error) {
    sendServerError(res, error, 'Availability calendar lookup failed')
  }
})

app.get('/api/bookings/:uid', requireAuth, requireSelf, async (req, res) => {
  try {
    const bookings = await bookingsCol
      .find({ userId: req.auth.uid, status: { $ne: 'held' } })
      .sort({ date: -1, createdAt: -1 })
      .toArray()
    bookings.sort((a, b) => {
      const dateOrder = String(b.date || '').localeCompare(String(a.date || ''))
      if (dateOrder) return dateOrder
      const aTime = BOOKING_TIME_ORDER.get(normalizeBookingTime(a.timeSlot)) ?? -1
      const bTime = BOOKING_TIME_ORDER.get(normalizeBookingTime(b.timeSlot)) ?? -1
      return bTime - aTime
    })
    const today = californiaDateKey()
    res.json(bookings.map(booking => {
      const status = normalizedBookingStatus(booking.status)
      return {
        ...booking,
        normalizedStatus: status,
        isUpcoming: booking.date >= today && !['cancelled', 'completed'].includes(status),
      }
    }))
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
      await assertSlotsOpenForBooking([{ date, timeSlot }], session)
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

    await safelySyncBookingIdsWithGoogleCalendar([booking._id])
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
      const bookingStatus = normalizedBookingStatus(booking.status)
      if (bookingStatus === 'cancelled') return { found: true, duplicate: true, booking }
      if (bookingStatus === 'completed') {
        throw new HttpError(409, 'A completed lesson cannot be cancelled.')
      }
      await bookingSlotsCol.deleteOne({ bookingId, userId: req.auth.uid }, { session })
      if (bookingStatus === 'held') {
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
      if (booking.courseId) {
        const user = await usersCol.findOne({ uid: req.auth.uid }, { session, projection: { courses: 1 } })
        const courses = user?.courses || []
        let targetCourseIndex = booking.enrollmentId
          ? courses.findLastIndex(course =>
              String(course?.id) === String(booking.courseId)
              && String(course?.enrollmentId) === String(booking.enrollmentId)
            )
          : -1
        if (targetCourseIndex < 0) {
          targetCourseIndex = findCourseEnrollmentIndex(courses, booking.courseId, '', { activeOnly: true })
        }
        const nextCourses = courses.map((course, index) => {
          if (index !== targetCourseIndex) return course
          const nextSlots = (Array.isArray(course.pickupSlots) ? course.pickupSlots : []).filter(slot => {
            const parsed = safeStoredPickupSlot(slot)
            return !parsed || bookingSlotKey(parsed.date, parsed.time) !== bookingSlotKey(booking.date, booking.timeSlot)
          })
          return {
            ...course,
            pickupSlots: nextSlots,
            slotUsed: nextSlots.length,
            slotMaximum: slotLimitForTier(course),
          }
        })
        await usersCol.updateOne(
          { uid: req.auth.uid },
          { $set: { courses: nextCourses } },
          { session }
        )
      }
      return { found: true, booking: { ...booking, status: 'cancelled', cancelledAt } }
    })
    if (!result.found) return res.status(404).json({ error: 'Booking not found.' })
    if (!result.duplicate && !result.removedHold) await safelySyncBookingWithGoogleCalendar(result.booking)
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
    course.enrollmentId = cleanText(course.enrollmentId, 160) || randomUUID()
    const user = await usersCol.findOne({ uid })
    const existing = (user?.courses || []).find(c =>
      String(c.id) === courseId
      && (String(c.enrollmentId) === String(course.enrollmentId) || courseCanAcceptMoreBookings(c))
    )
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

app.put('/api/users/:uid/courses/:enrollmentId/progress', async (req, res) => {
  try {
    const uid = req.auth.uid
    const enrollmentKey = cleanText(req.params.enrollmentId, 160)
    const allowedModules = new Set(['mod1', 'mod2', 'mod3'])
    if (!Array.isArray(req.body?.completedModules)) {
      return res.status(400).json({ error: 'Completed modules must be provided as a list.' })
    }
    const completedModules = [...new Set(req.body.completedModules.map(moduleId => cleanText(moduleId, 20)))]
    if (completedModules.some(moduleId => !allowedModules.has(moduleId))) {
      return res.status(400).json({ error: 'One or more course modules are not valid.' })
    }

    const result = await withMongoTransaction(async (session) => {
      const user = await usersCol.findOne({ uid }, { session, projection: { courses: 1 } })
      const courses = user?.courses || []
      let courseIndex = courses.findLastIndex(course =>
        String(course?.enrollmentId) === enrollmentKey && courseCanAcceptMoreBookings(course)
      )
      // Legacy clients used the pricing course id because enrollment ids did
      // not exist yet. Resolve only the latest active online-course purchase.
      if (courseIndex < 0) {
        courseIndex = courses.findLastIndex(course =>
          String(course?.id) === enrollmentKey && courseCanAcceptMoreBookings(course)
        )
      }
      if (courseIndex < 0) return { found: false }
      const course = courses[courseIndex]
      const title = String(course?.title || course?.planName || '').toUpperCase()
      if (String(course?.id) !== '1' && !title.includes('ONLINE DRIVER')) {
        throw new HttpError(409, 'Study progress is only available for the online driver education course.')
      }

      const enrollmentId = cleanText(course.enrollmentId, 160) || randomUUID()
      const progress = Math.round((completedModules.length / allowedModules.size) * 100)
      const updatedAt = new Date().toISOString()
      const updatedCourse = {
        ...course,
        enrollmentId,
        completedModules,
        progress,
        progressUpdatedAt: updatedAt,
      }
      await usersCol.updateOne(
        { uid },
        {
          $set: {
            [`courses.${courseIndex}`]: updatedCourse,
            // Retained for older dashboard builds; the enrollment record above
            // is the authoritative source.
            completedModules,
          },
        },
        { session }
      )
      return { found: true, course: updatedCourse }
    })
    if (!result.found) return res.status(404).json({ error: 'Online course enrollment not found.' })
    res.json({
      ok: true,
      enrollmentId: result.course.enrollmentId,
      completedModules: result.course.completedModules,
      progress: result.course.progress,
      course: result.course,
    })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    sendServerError(res, e, 'Course progress update failed')
  }
})

app.delete('/api/users/:uid/courses/:courseId', async (req, res) => {
  try {
    // requireSelf permits either the account owner or a verified database admin;
    // use the requested profile id so admin course management targets that user.
    const uid = cleanText(req.params.uid, 160)
    const courseId = cleanText(req.params.courseId, 120)
    const requestedEnrollmentId = cleanText(req.query?.enrollmentId, 160)
    if (!courseId) return res.status(400).json({ error: 'Course id required.' })
    const result = await withMongoTransaction(async (session) => {
      const user = await usersCol.findOne({ uid }, { session })
      const courses = user?.courses || []
      let courseIndex = requestedEnrollmentId
        ? courses.findLastIndex(item =>
            String(item?.id) === courseId && String(item?.enrollmentId) === requestedEnrollmentId
          )
        : -1
      if (courseIndex < 0) courseIndex = findCourseEnrollmentIndex(courses, courseId, '', { activeOnly: true })
      if (courseIndex < 0) return { found: false }
      const course = courses[courseIndex]
      if (String(course.status || '').toLowerCase() === 'refund pending') {
        throw new HttpError(409, 'This course already has a pending refund request.')
      }

      const activeCourseCount = courses.filter(item => {
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
        {
          includeUnassigned: activeCourseCount === 1 && !course.enrollmentId,
          enrollmentId: cleanText(course.enrollmentId, 160),
        }
      )
      const unlinkedBookings = await countUnassignedActiveBookings(uid, session)
      const ids = courseIdCandidates(courseId)
      const nextCourses = courses.filter((_item, index) => index !== courseIndex)
      await usersCol.updateOne(
        { uid },
        { $set: { courses: nextCourses } },
        { session }
      )
      await cartsCol.updateOne(
        { uid },
        { $pull: { items: { id: { $in: ids } } }, $set: { updatedAt: new Date().toISOString() } },
        { session }
      )
      await cartsCol.deleteOne({ uid, items: { $size: 0 } }, { session })
      return { found: true, course, releasedBookings, unlinkedBookings, courses: nextCourses }
    })
    if (!result.found) return res.status(404).json({ error: 'Course not found.' })
    await safelySyncCancelledCourseBookings(uid, 'course_cancelled')
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
    const requestedEnrollmentId = cleanText(req.body?.enrollmentId, 160)
    const reason = cleanText(req.body?.reason, 1000) || 'Requested by student from the dashboard.'
    if (!courseId) return res.status(400).json({ error: 'Course id required.' })

    const result = await withMongoTransaction(async (session) => {
      const user = await usersCol.findOne({ uid }, { session })
      const courses = user?.courses || []
      let courseIndex = requestedEnrollmentId
        ? courses.findLastIndex(item =>
            String(item?.id) === courseId && String(item?.enrollmentId) === requestedEnrollmentId
          )
        : -1
      if (courseIndex < 0) courseIndex = findCourseEnrollmentIndex(courses, courseId, '', { activeOnly: true })
      if (courseIndex < 0) return { found: false }
      const course = courses[courseIndex]

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
        Enrollment_ID: cleanText(course.enrollmentId, 160),
        Enrollment_Date: enrollmentFingerprint,
        Full_Name: fullName,
        Email: normalizeEmail(req.auth.email || user.email),
        Phone: cleanText(user.phone, 40),
        Course_Name: cleanText(course.title || course.planName || 'Driving course', 200),
        Amount: course.paidAmount !== undefined
          ? `$${moneyString(course.paidAmount)}`
          : (cleanText(course.price, 40) || '$0'),
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
        {
          includeUnassigned: activeCourseCount === 1 && !course.enrollmentId,
          enrollmentId: cleanText(course.enrollmentId, 160),
        }
      )
      const unlinkedBookings = await countUnassignedActiveBookings(uid, session)
      const ids = courseIdCandidates(courseId)
      await usersCol.updateOne(
        { uid },
        {
          $set: {
            [`courses.${courseIndex}.status`]: 'Refund Pending',
            [`courses.${courseIndex}.refundStatus`]: 'pending',
            [`courses.${courseIndex}.refundRequestId`]: refundId.toString(),
            [`courses.${courseIndex}.refundRequestedAt`]: requestedAt.toISOString(),
          },
        },
        { session }
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
    if (!result.duplicate) await safelySyncCancelledCourseBookings(uid, 'refund_requested')
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

    await cleanupExpiredHolds()
    const expiresAt = activeHoldExpiry()
    const result = await withMongoTransaction(async (session) => {
      const tier = await pricingTierById(courseId, session)
      if (!tier) throw new HttpError(400, 'The selected pricing plan is not available.')
      const slots = pickupSlotsFromCourse(req.body, tier)
      const customDmvAppointment = isDmvRentalTier(tier) && slots.every(slot => isCustomAppointmentTime(slot.timeSlot))
      await assertSlotsOpenForBooking(slots, session, 409, { dateAvailabilityOnly: customDmvAppointment })
      const bookingLocation = await bookingLocationByName(req.body?.city, session)
      const locationPrice = pricingForBookingLocation(tier, bookingLocation)
      const user = await usersCol.findOne({ uid }, { session, projection: { courses: 1 } })
      const courses = user?.courses || []
      const matchingCourses = courses.filter(course => String(course.id) === courseId)
      if (matchingCourses.some(course => normalizedCourseStatus(course.status) === 'refund pending')) {
        throw new HttpError(409, `A refund request for ${tier.planName} is still pending. Additional slots cannot be booked yet.`)
      }
      const activeCourseIndex = findCourseEnrollmentIndex(courses, courseId, '', { activeOnly: true })
      let activeCourse = activeCourseIndex >= 0 ? courses[activeCourseIndex] : null
      const enrollmentId = cleanText(activeCourse?.enrollmentId, 160) || randomUUID()

      const cart = await cartsCol.findOne({ uid }, { session })
      const oldItems = cart?.items || []
      const existingIndex = oldItems.findIndex(item => String(item.id) === courseId)
      const duplicate = existingIndex >= 0

      if (duplicate) await releaseCourseHolds(uid, courseId, session)
      let allowance
      if (activeCourse) {
        const linked = await linkedCourseBookings(uid, courseId, session, activeCourse)
        allowance = packageSlotAllowance(activeCourse, tier, linked, slots.length)
        validateContinuationSlotCount(slots.length, allowance, tier.planName)
        if (!activeCourse.enrollmentId) {
          const bookingIds = linked.map(booking => booking._id).filter(Boolean)
          await usersCol.updateOne(
            { uid },
            { $set: { [`courses.${activeCourseIndex}.enrollmentId`]: enrollmentId } },
            { session }
          )
          if (bookingIds.length) {
            await bookingsCol.updateMany(
              { _id: { $in: bookingIds }, userId: uid },
              { $set: { enrollmentId } },
              { session }
            )
            await bookingSlotsCol.updateMany(
              { bookingId: { $in: bookingIds }, userId: uid },
              { $set: { enrollmentId } },
              { session }
            )
          }
          activeCourse = { ...activeCourse, enrollmentId }
        }
      } else {
        validateSlotCountForTier(slots, tier)
        allowance = packageSlotAllowance({}, tier, [], slots.length)
      }
      for (const slot of slots) {
        await createSlotHold({ uid, courseId, enrollmentId, ...slot, session, expiresAt })
      }

      const course = {
        id: courseId,
        title: cleanText(tier.planName, 160),
        price: locationPrice.label,
        originalPlanPrice: locationPrice.label,
        nearPrice: normalizePlanPrice(tier.planPrice),
        longPrice: normalizePlanPrice(tier.planPriceTwo || tier.planPrice),
        priceBasis: locationPrice.distance,
        chargeAmount: activeCourse ? 0 : locationPrice.amount,
        city: bookingLocation.name,
        cityZip: bookingLocation.zipCode || '',
        cityDistance: bookingLocation.distance,
        pickupSlots: slots.map(slot => ({ date: slot.date, time: slot.timeSlot })),
        continuation: Boolean(activeCourse),
        enrollmentId,
        slotAllowance: {
          maximum: allowance.maximum,
          used: allowance.used,
          selected: slots.length,
          remainingAfterSelection: allowance.remainingAfterSelection,
        },
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
      return { items, duplicate, continuation: Boolean(activeCourse), slotAllowance: course.slotAllowance }
    })
    res.json({
      ok: true,
      items: result.items,
      duplicate: result.duplicate,
      continuation: result.continuation,
      slotAllowance: result.slotAllowance,
    })
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

async function processCartCheckout(req, { quoteOnly = false, couponCode = '', couponSnapshot = null } = {}) {
  const uid = req.auth.uid
  await cleanupExpiredHolds()
  return withMongoTransaction(async (session) => {
      const cart = await cartsCol.findOne({ uid }, { session })
      const items = cart?.items || []
      if (items.length === 0) {
        return { enrolled: 0, continued: 0, newBookings: 0, payment: null, courses: [] }
      }

      const now = new Date()
      const holds = []
      const verifiedItems = []
      const user = await usersCol.findOne({ uid }, { session })
      const existingCourses = user?.courses || []
      const seenCourseIds = new Set()
      for (const item of items) {
        const courseId = String(item.id)
        if (seenCourseIds.has(courseId)) throw new HttpError(409, 'The same pricing plan cannot appear in the cart twice.')
        seenCourseIds.add(courseId)
        const tier = await pricingTierById(courseId, session)
        if (!tier) throw new HttpError(400, 'A pricing plan in your cart is no longer available.')
        const slots = pickupSlotsFromCourse(item, tier)
        const customDmvAppointment = isDmvRentalTier(tier) && slots.every(slot => isCustomAppointmentTime(slot.timeSlot))
        const bookingLocation = await bookingLocationByName(item.city, session)
        const locationPrice = pricingForBookingLocation(tier, bookingLocation)
        const requestedEnrollmentId = cleanText(item.enrollmentId, 160)
        let activeCourseIndex = requestedEnrollmentId
          ? existingCourses.findLastIndex(course =>
              String(course?.id) === courseId
              && String(course?.enrollmentId) === requestedEnrollmentId
              && courseCanAcceptMoreBookings(course)
            )
          : -1
        if (activeCourseIndex < 0) {
          activeCourseIndex = findCourseEnrollmentIndex(existingCourses, courseId, '', { activeOnly: true })
        }
        const continuation = activeCourseIndex >= 0
        const activeCourse = continuation ? existingCourses[activeCourseIndex] : null
        const enrollmentId = cleanText(activeCourse?.enrollmentId, 160) || requestedEnrollmentId || randomUUID()
        if (existingCourses.some(course =>
          String(course?.id) === courseId && normalizedCourseStatus(course.status) === 'refund pending'
        )) {
          throw new HttpError(409, `A refund request for ${tier.planName} is still pending. Additional slots cannot be booked yet.`)
        }
        if (item.continuation === true && !continuation) {
          throw new HttpError(409, `${tier.planName} is no longer available for additional lesson bookings. Please refresh your cart.`)
        }
        if (continuation && requestedEnrollmentId && activeCourse?.enrollmentId && requestedEnrollmentId !== activeCourse.enrollmentId) {
          throw new HttpError(409, `${tier.planName} changed after it was added to your cart. Please select the lessons again.`)
        }
        let allowance
        if (continuation) {
          const linked = await linkedCourseBookings(uid, courseId, session, activeCourse)
          allowance = packageSlotAllowance(activeCourse, tier, linked, slots.length)
          validateContinuationSlotCount(slots.length, allowance, tier.planName)
          if (!activeCourse.enrollmentId) {
            const legacyBookingIds = linked.map(booking => booking._id).filter(Boolean)
            if (legacyBookingIds.length) {
              await bookingsCol.updateMany(
                { _id: { $in: legacyBookingIds }, userId: uid },
                { $set: { enrollmentId } },
                { session }
              )
              await bookingSlotsCol.updateMany(
                { bookingId: { $in: legacyBookingIds }, userId: uid },
                { $set: { enrollmentId } },
                { session }
              )
            }
          }
        } else {
          validateSlotCountForTier(slots, tier, 409, `The ${tier.planName} selection`)
          allowance = packageSlotAllowance({}, tier, [], slots.length)
        }
        await assertSlotsOpenForBooking(slots, session, 409, { dateAvailabilityOnly: customDmvAppointment })
        verifiedItems.push({
          ...item,
          id: courseId,
          title: tier.planName,
          price: locationPrice.label,
          originalPlanPrice: locationPrice.label,
          nearPrice: normalizePlanPrice(tier.planPrice),
          longPrice: normalizePlanPrice(tier.planPriceTwo || tier.planPrice),
          priceBasis: locationPrice.distance,
          chargeAmount: continuation ? 0 : locationPrice.amount,
          city: bookingLocation.name,
          cityZip: bookingLocation.zipCode || '',
          cityDistance: bookingLocation.distance,
          continuation,
          activeCourseIndex,
          enrollmentId,
          slotAllowance: {
            maximum: allowance.maximum,
            used: allowance.used,
            selected: slots.length,
            remainingAfterSelection: allowance.remainingAfterSelection,
          },
          pickupSlots: slots.map(slot => ({ date: slot.date, time: slot.timeSlot })),
        })
        for (const slot of slots) {
          const enrollmentScope = requestedEnrollmentId || cleanText(activeCourse?.enrollmentId, 160)
          const lock = await bookingSlotsCol.findOne({
            _id: bookingSlotKey(slot.date, slot.timeSlot),
            userId: uid,
            courseId,
            ...(enrollmentScope ? { enrollmentId: enrollmentScope } : {}),
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
            ...(enrollmentScope ? { enrollmentId: enrollmentScope } : {}),
            status: 'held',
          }, { session })
          if (!heldBooking) throw new HttpError(409, 'A reserved time slot is no longer available. Please select it again.')
          holds.push({ lock, booking: heldBooking, enrollmentId })
        }
      }
      const subtotalAmount = payableCheckoutAmount(verifiedItems)
      const effectiveCouponSnapshot = couponSnapshot || (!quoteOnly ? req.verifiedPayment?.couponSnapshot : null)
      const effectiveCouponCode = couponCode || (!quoteOnly ? req.verifiedPayment?.couponCode : '')
      const couponQuote = await resolveCouponQuote(effectiveCouponCode, subtotalAmount, session, effectiveCouponSnapshot)
      const quoteAmount = couponQuote.total
      const cartFingerprint = couponCheckoutFingerprint(checkoutFingerprint(verifiedItems), couponQuote)
      if (quoteOnly) {
        if (quoteAmount <= 0) {
          throw new HttpError(400, 'No PayPal payment is required for this booking.')
        }
        const extendedExpiry = new Date(Date.now() + PAYPAL_ORDER_HOLD_MINUTES * 60_000)
        const heldBookingIds = holds.map(({ booking }) => booking._id).filter(Boolean)
        const heldLockIds = holds.map(({ lock }) => lock._id).filter(Boolean)
        if (heldBookingIds.length) {
          await bookingsCol.updateMany(
            { _id: { $in: heldBookingIds }, userId: uid, status: 'held' },
            { $set: { holdExpiresAt: extendedExpiry } },
            { session }
          )
        }
        if (heldLockIds.length) {
          await bookingSlotsCol.updateMany(
            { _id: { $in: heldLockIds }, userId: uid, status: 'held' },
            { $set: { expiresAt: extendedExpiry } },
            { session }
          )
        }
        await cartsCol.updateOne(
          { uid },
          {
            $set: {
              'items.$[].holdExpiresAt': extendedExpiry.toISOString(),
              'items.$[].holdExpired': false,
              updatedAt: new Date().toISOString(),
            },
          },
          { session }
        )
        return {
          quoteOnly: true,
          amount: quoteAmount,
          subtotal: couponQuote.subtotal,
          discount: couponQuote.discount,
          coupon: couponQuote.coupon,
          currency: PAYPAL_CURRENCY,
          cartFingerprint,
          description: verifiedItems.filter(item => !item.continuation).map(item => item.title).join(' + ').slice(0, 127),
          itemCount: verifiedItems.length,
          holdExpiresAt: extendedExpiry,
        }
      }

      const verifiedPayment = req.verifiedPayment || null
      if (quoteAmount > 0) {
        if (!verifiedPayment) {
          throw new HttpError(402, 'Please complete the PayPal payment before enrollment.')
        }
        if (verifiedPayment.currency !== PAYPAL_CURRENCY || moneyCents(verifiedPayment.amount) !== moneyCents(quoteAmount)) {
          throw new HttpError(409, 'The booking total changed. No enrollment was completed; please restart PayPal checkout.')
        }
        if (verifiedPayment.cartFingerprint !== cartFingerprint) {
          throw new HttpError(409, 'Your cart changed after PayPal checkout started. Please restart checkout.')
        }
      }

      const enrolledAt = new Date().toISOString()
      const { newItems, continuationItems: continuedItems } = splitCheckoutItems(verifiedItems)
      const toAdd = newItems
        .map(item => {
          const originalAmountCents = moneyCents(item.chargeAmount)
          const subtotalCents = moneyCents(couponQuote.subtotal)
          const discountCents = moneyCents(couponQuote.discount)
          const allocatedDiscountCents = subtotalCents > 0
            ? Math.floor(discountCents * originalAmountCents / subtotalCents)
            : 0
          return ({
          id: item.id,
          title: item.title,
          price: item.price,
          city: item.city || '',
          cityZip: item.cityZip || '',
          cityDistance: item.cityDistance || '',
          preferredDate: item.preferredDate || '',
          pickupTime: item.pickupTime || '',
          pickupSlots: item.pickupSlots || [],
          status: 'Enrolled',
          progress: 0,
          slotMaximum: item.slotAllowance.maximum,
          slotUsed: item.pickupSlots.length,
          enrollmentId: item.enrollmentId,
          enrolledAt,
          email: normalizeEmail(req.auth.email) || user?.email || '',
          paidAmount: (originalAmountCents - allocatedDiscountCents) / 100,
          couponCode: couponQuote.coupon?.code || '',
        })})

      if (toAdd.length) {
        const previousPaidCents = toAdd.slice(0, -1).reduce((sum, item) => sum + moneyCents(item.paidAmount), 0)
        toAdd[toAdd.length - 1].paidAmount = Math.max(0, moneyCents(quoteAmount) - previousPaidCents) / 100
      }

      const nextCourses = [...existingCourses, ...toAdd]
      for (const item of continuedItems) {
        const current = nextCourses[item.activeCourseIndex]
        if (!current || !courseCanAcceptMoreBookings(current) || String(current.id) !== item.id) {
          throw new HttpError(409, `${item.title} is no longer available for additional lesson bookings.`)
        }
        const mergedSlots = new Map()
        for (const rawSlot of Array.isArray(current.pickupSlots) ? current.pickupSlots : []) {
          const slot = safeStoredPickupSlot(rawSlot)
          if (slot) mergedSlots.set(bookingSlotKey(slot.date, slot.time), slot)
        }
        for (const rawSlot of item.pickupSlots) {
          const slot = safeStoredPickupSlot(rawSlot)
          if (slot) mergedSlots.set(bookingSlotKey(slot.date, slot.time), slot)
        }
        const pickupSlots = [...mergedSlots.values()].sort((a, b) =>
          a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
        )
        nextCourses[item.activeCourseIndex] = {
          ...current,
          enrollmentId: item.enrollmentId,
          pickupSlots,
          slotMaximum: item.slotAllowance.maximum,
          slotUsed: item.slotAllowance.used + item.pickupSlots.length,
          lastBookingAt: enrolledAt,
        }
      }

      const payment = toAdd.length ? {
        date: enrolledAt.split('T')[0],
        ref: `INV-${Date.now().toString(36).toUpperCase()}`,
        email: normalizeEmail(req.auth.email) || user?.email || '',
        item: toAdd.map(course => course.title).join(' + '),
        amount: quoteAmount,
        subtotal: couponQuote.subtotal,
        discount: couponQuote.discount,
        coupon: couponQuote.coupon,
        couponCode: couponQuote.coupon?.code || '',
        enrollmentIds: toAdd.map(course => cleanText(course.enrollmentId, 160)).filter(Boolean),
        courseBreakdown: toAdd.map(course => ({
          courseId: String(course.id || ''),
          enrollmentId: cleanText(course.enrollmentId, 160),
          title: cleanText(course.title, 200),
          amount: Number(course.paidAmount || 0),
        })),
        refundedAmount: 0,
        providerRefundIds: [],
        status: verifiedPayment ? 'Paid' : 'Pending',
        ...(verifiedPayment ? {
          provider: 'PayPal',
          providerEnvironment: PAYPAL_ENVIRONMENT,
          providerOrderId: verifiedPayment.orderId,
          providerCaptureId: verifiedPayment.captureId,
          payerEmail: verifiedPayment.payerEmail || '',
          paidAt: verifiedPayment.paidAt || enrolledAt,
        } : {}),
      } : null
      const userUpdate = {
        $set: { courses: nextCourses },
        $setOnInsert: { uid },
      }
      if (payment) userUpdate.$push = { payments: { $each: [payment], $position: 0 } }
      await usersCol.updateOne(
        { uid },
        userUpdate,
        { upsert: true, session }
      )

      if (couponQuote.coupon) {
        await couponsCol.updateOne(
          { code: couponQuote.coupon.code },
          { $inc: { redemptionCount: 1 }, $set: { lastRedeemedAt: enrolledAt } },
          { session }
        )
      }

      for (const { lock, booking, enrollmentId } of holds) {
        const lockResult = await bookingSlotsCol.updateOne(
          { _id: lock._id, userId: uid, status: 'held', holdToken: lock.holdToken },
          { $set: { status: 'confirmed', confirmedAt: now, enrollmentId }, $unset: { expiresAt: '', holdToken: '' } },
          { session }
        )
        const bookingResult = await bookingsCol.updateOne(
          { _id: booking._id, userId: uid, status: 'held', holdToken: booking.holdToken },
          { $set: { status: 'confirmed', confirmedAt: now.toISOString(), enrollmentId }, $unset: { holdExpiresAt: '', holdToken: '' } },
          { session }
        )
        if (lockResult.matchedCount !== 1 || bookingResult.matchedCount !== 1) {
          throw new HttpError(409, 'A reserved time slot changed before checkout. Please select it again.')
        }
      }

      await cartsCol.deleteOne({ uid }, { session })
      return {
        enrolled: toAdd.length,
        continued: continuedItems.length,
        newBookings: holds.length,
        bookingIds: holds.map(({ booking }) => String(booking._id)),
        payment,
        courses: nextCourses,
      }
    })
}

async function checkoutCartHandler(req, res) {
  try {
    const checkout = await processCartCheckout(req)
    await safelySyncBookingIdsWithGoogleCalendar(checkout.bookingIds)
    const { bookingIds: _bookingIds, ...publicCheckout } = checkout
    return res.json({ ok: true, ...publicCheckout })
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      error: error.status ? error.message : 'Checkout could not be completed. Please try again.',
    })
  }
}

app.post('/api/users/:uid/coupons/validate', rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
  try {
    const quote = await processCartCheckout(req, { quoteOnly: true, couponCode: req.body?.code })
    if (!quote.coupon) throw new HttpError(400, 'Enter a coupon code first.')
    return res.json({
      ok: true,
      coupon: quote.coupon,
      subtotal: moneyString(quote.subtotal),
      discount: moneyString(quote.discount),
      total: moneyString(quote.amount),
      message: `${quote.coupon.code} applied successfully. You save $${moneyString(quote.discount)}.`,
    })
  } catch (error) {
    return res.status(error.status || 500).json({
      ok: false,
      error: error.status ? error.message : 'Coupon could not be verified. Please try again.',
    })
  }
})

app.get('/api/paypal/config', requireAuth, (_req, res) => {
  try {
    const { clientId } = paypalConfiguration()
    res.setHeader('Cache-Control', 'no-store')
    return res.json({
      clientId,
      currency: PAYPAL_CURRENCY,
      environment: PAYPAL_ENVIRONMENT,
    })
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.status ? error.message : 'PayPal configuration is unavailable.',
    })
  }
})

app.post('/api/users/:uid/paypal/orders', rateLimit({ windowMs: 60_000, max: 10 }), async (req, res) => {
  try {
    const quote = await processCartCheckout(req, { quoteOnly: true, couponCode: req.body?.couponCode })
    const reusableOrder = await paypalOrdersCol.findOne({
      uid: req.auth.uid,
      cartFingerprint: quote.cartFingerprint,
      status: { $in: ['CREATED', 'CAPTURING'] },
      expiresAt: { $gt: new Date() },
    }, { sort: { createdAt: -1 } })
    if (reusableOrder) {
      return res.json({
        id: reusableOrder._id,
        status: reusableOrder.status,
        amount: moneyString(reusableOrder.amount),
        currency: reusableOrder.currency,
        environment: PAYPAL_ENVIRONMENT,
      })
    }

    const requestId = randomUUID()
    const order = await paypalApiRequest('/v2/checkout/orders', {
      method: 'POST',
      requestId,
      body: {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `cart-${req.auth.uid}`.slice(0, 256),
          custom_id: quote.cartFingerprint,
          description: quote.description || 'Driving lesson booking',
          amount: {
            currency_code: PAYPAL_CURRENCY,
            value: moneyString(quote.amount),
          },
        }],
        application_context: {
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      },
    })
    const orderId = cleanText(order?.id, 80)
    if (!orderId) throw new HttpError(502, 'PayPal did not create an order. Please try again.')

    await paypalOrdersCol.updateOne(
      { _id: orderId },
      {
        $setOnInsert: {
          _id: orderId,
          uid: req.auth.uid,
          status: 'CREATED',
          amount: Number(moneyString(quote.amount)),
          subtotal: Number(moneyString(quote.subtotal)),
          discount: Number(moneyString(quote.discount)),
          couponCode: quote.coupon?.code || '',
          couponSnapshot: quote.coupon || null,
          currency: PAYPAL_CURRENCY,
          cartFingerprint: quote.cartFingerprint,
          requestId,
          createdAt: new Date(),
          expiresAt: new Date(quote.holdExpiresAt),
        },
      },
      { upsert: true }
    )

    return res.status(201).json({
      id: orderId,
      status: order.status || 'CREATED',
      amount: moneyString(quote.amount),
      subtotal: moneyString(quote.subtotal),
      discount: moneyString(quote.discount),
      coupon: quote.coupon,
      currency: PAYPAL_CURRENCY,
      environment: PAYPAL_ENVIRONMENT,
    })
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.status ? error.message : 'PayPal order could not be created. Please try again.',
      ...(error.paypalIssue ? { issue: error.paypalIssue } : {}),
    })
  }
})

app.post('/api/users/:uid/paypal/orders/:orderId/capture', rateLimit({ windowMs: 60_000, max: 12 }), async (req, res) => {
  const orderId = cleanText(req.params.orderId, 80)
  if (!/^[A-Za-z0-9-]{5,80}$/.test(orderId)) {
    return res.status(400).json({ error: 'Invalid PayPal order.' })
  }

  let record
  try {
    record = await paypalOrdersCol.findOne({ _id: orderId, uid: req.auth.uid })
    if (!record) throw new HttpError(404, 'PayPal order was not found or has expired.')
    if (record.status === 'COMPLETED' && record.checkoutResult) {
      return res.json({
        ok: true,
        orderId,
        captureId: record.captureId,
        status: 'COMPLETED',
        ...record.checkoutResult,
      })
    }

    let captureData = null
    let capture = null
    if (record.status !== 'CAPTURED') {
      // The buyer can leave the PayPal approval window open for several minutes.
      // Revalidate the authoritative cart and refresh its slot holds immediately
      // before capture so an expired or changed booking is never charged.
      const refreshedQuote = await processCartCheckout(req, { quoteOnly: true, couponCode: record.couponCode })
      if (
        refreshedQuote.currency !== record.currency
        || moneyCents(refreshedQuote.amount) !== moneyCents(record.amount)
        || refreshedQuote.cartFingerprint !== record.cartFingerprint
      ) {
        throw new HttpError(409, 'Your booking or total changed before payment. Please restart PayPal checkout.')
      }
      await paypalOrdersCol.updateOne(
        { _id: orderId, uid: req.auth.uid, status: { $in: ['CREATED', 'CAPTURING'] } },
        { $set: { expiresAt: new Date(refreshedQuote.holdExpiresAt) } }
      )

      const staleCapture = new Date(Date.now() - 90_000)
      const claim = await paypalOrdersCol.updateOne(
        {
          _id: orderId,
          uid: req.auth.uid,
          $or: [
            { status: 'CREATED' },
            { status: 'CAPTURING', captureStartedAt: { $lt: staleCapture } },
          ],
        },
        { $set: { status: 'CAPTURING', captureStartedAt: new Date() } }
      )
      if (claim.matchedCount !== 1) {
        throw new HttpError(409, 'This PayPal payment is already being processed. Please wait a moment.')
      }

      try {
        captureData = await paypalApiRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
          method: 'POST',
          requestId: `capture-${orderId}`,
        })
      } catch (error) {
        await paypalOrdersCol.updateOne(
          { _id: orderId, uid: req.auth.uid, status: 'CAPTURING' },
          { $set: { status: 'CREATED' }, $unset: { captureStartedAt: '' } }
        )
        throw error
      }

      capture = captureData?.purchase_units?.[0]?.payments?.captures?.[0]
      const capturedAmount = capture?.amount
      if (
        captureData?.status !== 'COMPLETED'
        || capture?.status !== 'COMPLETED'
        || cleanText(capturedAmount?.currency_code, 3) !== record.currency
        || moneyCents(capturedAmount?.value) !== moneyCents(record.amount)
      ) {
        await paypalOrdersCol.updateOne(
          { _id: orderId, uid: req.auth.uid },
          { $set: { status: 'REVIEW_REQUIRED', paypalStatus: captureData?.status || capture?.status || 'UNKNOWN' }, $unset: { expiresAt: '' } }
        )
        throw new HttpError(409, 'PayPal payment requires review. Please contact the school before trying again.')
      }

      await paypalOrdersCol.updateOne(
        { _id: orderId, uid: req.auth.uid },
        {
          $set: {
            status: 'CAPTURED',
            captureId: cleanText(capture.id, 100),
            payerEmail: cleanText(captureData?.payer?.email_address, 180),
            paidAt: capture.create_time || new Date().toISOString(),
            capturedAt: new Date(),
          },
          $unset: { expiresAt: '', captureStartedAt: '' },
        }
      )
      record = await paypalOrdersCol.findOne({ _id: orderId, uid: req.auth.uid })
    }

    req.verifiedPayment = {
      amount: Number(record.amount),
      currency: record.currency,
      cartFingerprint: record.cartFingerprint,
      orderId,
      captureId: record.captureId,
      payerEmail: record.payerEmail,
      paidAt: record.paidAt,
      couponCode: record.couponCode || '',
      couponSnapshot: record.couponSnapshot || null,
    }
    const checkout = await processCartCheckout(req)
    await safelySyncBookingIdsWithGoogleCalendar(checkout.bookingIds)
    const checkoutResult = {
      enrolled: checkout.enrolled,
      continued: checkout.continued,
      newBookings: checkout.newBookings,
      payment: checkout.payment,
      courses: checkout.courses,
    }
    await paypalOrdersCol.updateOne(
      { _id: orderId, uid: req.auth.uid },
      { $set: { status: 'COMPLETED', completedAt: new Date(), checkoutResult } }
    )
    return res.json({
      ok: true,
      orderId,
      captureId: record.captureId,
      status: 'COMPLETED',
      ...checkoutResult,
    })
  } catch (error) {
    const issue = error.paypalIssue || ''
    const message = issue === 'INSTRUMENT_DECLINED'
      ? 'The selected PayPal payment method was declined. Please choose another one.'
      : (error.status ? error.message : 'PayPal payment could not be completed. Please try again.')
    return res.status(error.status || 500).json({
      ok: false,
      error: message,
      ...(issue ? { issue } : {}),
    })
  }
})

app.post('/api/users/:uid/cart/checkout', checkoutCartHandler)

app.post('/api/users/:uid/dedup-courses', async (req, res) => {
  try {
    const { uid } = req.params
    const user = await usersCol.findOne({ uid })
    if (!user || !user.courses || user.courses.length === 0) {
      return res.json({ ok: true, courses: [] })
    }
    const seenEnrollmentIds = new Set()
    const deduped = []
    for (const c of user.courses) {
      const enrollmentId = cleanText(c?.enrollmentId, 160)
      // Legacy entries without an enrollment id may represent distinct
      // purchases, so preserving them is safer than deleting history.
      if (!enrollmentId) {
        deduped.push(c)
        continue
      }
      if (seenEnrollmentIds.has(enrollmentId)) continue
      seenEnrollmentIds.add(enrollmentId)
      deduped.push(c)
    }
    await usersCol.updateOne({ uid }, { $set: { courses: deduped } })
    res.json({ ok: true, courses: deduped })
  } catch (e) {
    sendServerError(res, e, 'Course cleanup failed')
  }
})

app.get('/api/users/:uid/messages', async (req, res) => {
  try {
    const user = await usersCol.findOne({ uid: req.params.uid })
    const threads = Array.isArray(user?.messages) ? user.messages : []
    threads.sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))
    res.json(threads)
  } catch (e) {
    sendServerError(res, e, 'Message lookup failed')
  }
})

app.post('/api/users/:uid/messages', rateLimit({ windowMs: 10 * 60_000, max: 10 }), async (req, res) => {
  try {
    const { uid } = req.params
    const subject = cleanText(req.body?.subject, 200)
    const text = cleanText(req.body?.text, 4000)
    if (!subject || !text) return res.status(400).json({ error: 'Subject and text required' })
    const now = new Date().toISOString()
    const thread = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      subject,
      messages: [{ from: 'user', text, timestamp: now }],
      status: 'open',
      unreadByAdmin: true,
      unreadByUser: false,
      read: false,
      createdAt: now,
      updatedAt: now,
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

app.post('/api/users/:uid/messages/:threadId/reply', rateLimit({ windowMs: 60_000, max: 20 }), async (req, res) => {
  try {
    const { uid, threadId } = req.params
    const text = cleanText(req.body?.text, 4000)
    if (!text) return res.status(400).json({ error: 'Text required' })
    const now = new Date().toISOString()
    const reply = { from: 'user', text, timestamp: now }
    const result = await usersCol.updateOne(
      { uid, 'messages.id': threadId },
      {
        $push: { 'messages.$.messages': { $each: [reply], $slice: -200 } },
        $set: {
          'messages.$.status': 'open',
          'messages.$.unreadByAdmin': true,
          'messages.$.unreadByUser': false,
          'messages.$.read': false,
          'messages.$.updatedAt': now,
        },
      }
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
      { $set: { 'messages.$[].read': true, 'messages.$[].unreadByUser': false } }
    )
    const user = await usersCol.findOne({ uid })
    res.json({ ok: true, messages: user?.messages || [] })
  } catch (e) {
    sendServerError(res, e, 'Message status update failed')
  }
})

app.put('/api/users/:uid/messages/:threadId/read', async (req, res) => {
  try {
    const { uid, threadId } = req.params
    const result = await usersCol.updateOne(
      { uid, 'messages.id': threadId },
      { $set: { 'messages.$.read': true, 'messages.$.unreadByUser': false } }
    )
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Support conversation not found.' })
    const user = await usersCol.findOne({ uid }, { projection: { messages: 1 } })
    res.json({ ok: true, messages: user?.messages || [] })
  } catch (e) {
    sendServerError(res, e, 'Message status update failed')
  }
})

app.get('/api/admin/support', async (req, res) => {
  try {
    const search = cleanText(req.query?.search, 160).toLowerCase()
    const statusFilter = cleanText(req.query?.status, 20).toLowerCase()
    const accounts = await usersCol.find(
      { 'messages.0': { $exists: true } },
      { projection: { uid: 1, name: 1, displayName: 1, email: 1, phone: 1, photoURL: 1, messages: 1 } }
    ).limit(1000).toArray()

    const threads = accounts.flatMap(account => {
      const identity = {
        uid: cleanText(account.uid, 180),
        name: cleanText(account.name || account.displayName, 160) || 'Student',
        email: normalizeEmail(account.email),
        phone: cleanText(account.phone, 40),
        photoURL: cleanHttpUrl(account.photoURL),
      }
      return (Array.isArray(account.messages) ? account.messages : []).map(thread => {
        const replies = Array.isArray(thread?.messages) ? thread.messages.slice(-200) : []
        const updatedAt = cleanText(
          thread?.updatedAt || replies[replies.length - 1]?.timestamp || thread?.createdAt,
          80
        )
        return {
          id: cleanText(thread?.id, 180),
          subject: cleanText(thread?.subject, 200) || 'Support request',
          status: cleanText(thread?.status, 20).toLowerCase() === 'closed' ? 'closed' : 'open',
          unreadByAdmin: typeof thread?.unreadByAdmin === 'boolean' ? thread.unreadByAdmin : thread?.read === false,
          createdAt: cleanText(thread?.createdAt, 80),
          updatedAt,
          messages: replies.map(message => ({
            from: message?.from === 'admin' ? 'admin' : 'user',
            text: cleanText(message?.text, 4000),
            timestamp: cleanText(message?.timestamp, 80),
          })).filter(message => message.text),
          student: identity,
        }
      })
    }).filter(thread => thread.id && thread.student.uid)

    const filtered = threads.filter(thread => {
      const matchesStatus = !statusFilter || statusFilter === 'all' || thread.status === statusFilter
      const haystack = [thread.subject, thread.student.name, thread.student.email, thread.student.phone]
        .join(' ').toLowerCase()
      return matchesStatus && (!search || haystack.includes(search))
    }).sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))

    res.json({
      threads: filtered,
      counts: {
        total: threads.length,
        open: threads.filter(thread => thread.status === 'open').length,
        unread: threads.filter(thread => thread.unreadByAdmin).length,
      },
    })
  } catch (e) {
    sendServerError(res, e, 'Live support inbox lookup failed')
  }
})

app.post('/api/admin/support/:uid/:threadId/reply', rateLimit({ windowMs: 60_000, max: 60 }), async (req, res) => {
  try {
    const { uid, threadId } = req.params
    const text = cleanText(req.body?.text, 4000)
    if (!text) return res.status(400).json({ error: 'Reply text is required.' })
    const now = new Date().toISOString()
    const reply = { from: 'admin', text, timestamp: now }
    const result = await usersCol.updateOne(
      { uid, 'messages.id': threadId },
      {
        $push: { 'messages.$.messages': { $each: [reply], $slice: -200 } },
        $set: {
          'messages.$.status': 'open',
          'messages.$.unreadByAdmin': false,
          'messages.$.unreadByUser': true,
          'messages.$.read': false,
          'messages.$.updatedAt': now,
        },
      }
    )
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Support conversation not found.' })
    res.json({ ok: true, reply })
  } catch (e) {
    sendServerError(res, e, 'Live support reply failed')
  }
})

app.put('/api/admin/support/:uid/:threadId/read', async (req, res) => {
  try {
    const { uid, threadId } = req.params
    const result = await usersCol.updateOne(
      { uid, 'messages.id': threadId },
      { $set: { 'messages.$.unreadByAdmin': false } }
    )
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Support conversation not found.' })
    res.json({ ok: true })
  } catch (e) {
    sendServerError(res, e, 'Live support message status update failed')
  }
})

app.put('/api/admin/support/:uid/:threadId/status', async (req, res) => {
  try {
    const { uid, threadId } = req.params
    const status = cleanText(req.body?.status, 20).toLowerCase()
    if (!['open', 'closed'].includes(status)) return res.status(400).json({ error: 'Status must be open or closed.' })
    const now = new Date().toISOString()
    const result = await usersCol.updateOne(
      { uid, 'messages.id': threadId },
      { $set: { 'messages.$.status': status, 'messages.$.unreadByAdmin': false, 'messages.$.updatedAt': now } }
    )
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Support conversation not found.' })
    res.json({ ok: true, status, updatedAt: now })
  } catch (e) {
    sendServerError(res, e, 'Live support status update failed')
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
      const nearPrice = normalizePlanPrice(tier.planPrice)
      const longPrice = normalizePlanPrice(tier.planPriceTwo || tier.planPrice)
      const slots = slotLimitForTier(tier)
      const prices = nearPrice ? ` (Near ${nearPrice}; Long ${longPrice || nearPrice})` : ''
      return `${index + 1}. ${name}${prices} - booking requires at least 1 lesson slot; maximum ${slots} lesson slot${slots === 1 ? '' : 's'}`
    }).join('\n')
    : 'Current packages and prices are available on the website Pricing page.'

  return `You are the support assistant for A Precision Driving School. Help students with the school website, course selection, lesson scheduling, permits, invoices, refund requests, and general California driving education. Keep answers concise, clear, professional, and friendly. Respond in the same language as the student.

RESPONSE FORMAT:
- Use clean Markdown with short paragraphs, descriptive headings, and bullet or numbered lists.
- Use a Markdown table only when comparing several plans. Every table header, divider, and data row must be on its own line.
- Never output raw HTML, JSON, or a compressed one-line table.
- Do not use decorative symbols excessively.

CURRENT SCHOOL INFORMATION:
- Address: ${address}
- Phone: ${phone}
- Email: ${email}

CURRENT WEBSITE PACKAGES:
${courseLines}

WEBSITE WORKFLOWS:
- Students choose a package, city, and at least 1 date and time slot from the Pricing page, up to the package maximum, then continue through the cart.
- Students can view invoices, cancel future bookings, cancel a course, or submit a refund request from their dashboard.
- A submitted refund remains Refund Pending until an administrator approves or denies it.
 - PayPal checkout is configured for secure online payments. Students should complete payment only through the website checkout. Never request card numbers, PayPal passwords, bank details, or payment credentials in chat.
 - Do not invent prices, policies, availability, confirmations, or refund decisions. If current information is unavailable, ask the student to contact the school.`
}

const groqModels = [...new Set([
  cleanText(process.env.GROQ_MODEL, 120),
  'llama-3.1-8b-instant',
  'openai/gpt-oss-20b',
].filter(Boolean))]

async function createSupportCompletion(messages) {
  let lastError
  for (const model of groqModels) {
    try {
      return await groq.chat.completions.create({
        model,
        messages,
        max_tokens: 800,
        temperature: 0.7,
      })
    } catch (error) {
      lastError = error
      const code = cleanText(error?.error?.error?.code || error?.error?.code || error?.code, 80).toLowerCase()
      if (Number(error?.status) === 404 || code === 'model_not_found') continue
      throw error
    }
  }
  throw lastError || new Error('No supported assistant model is available.')
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

    const completion = await createSupportCompletion(chatMessages)

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not process your request.'
    res.json({ ok: true, reply })
  } catch (e) {
    console.error('Chat request failed:', cleanText(e?.code || e?.error?.code || e?.status || 'unknown', 80))
    return res.status(503).json({ error: 'The support assistant is temporarily unavailable. Please try again shortly.' })
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
    const today = californiaDateKey()
    const inactiveCourseStatuses = ['refund pending', 'refunded', 'cancelled', 'canceled']
    const [totalUsers, totalBookings, activeEnrollmentRows, upcomingBookings, pendingContacts, pendingRefunds, unreadSupportRows] = await Promise.all([
      usersCol.countDocuments({ isAdmin: { $ne: true } }),
      bookingsCol.countDocuments({ status: { $ne: 'held' } }),
      usersCol.aggregate([
        { $match: { isAdmin: { $ne: true } } },
        { $unwind: '$courses' },
        {
          $match: {
            $expr: {
              $not: [{
                $in: [
                  { $toLower: { $ifNull: ['$courses.status', 'enrolled'] } },
                  inactiveCourseStatuses,
                ],
              }],
            },
          },
        },
        { $count: 'count' },
      ]).toArray(),
      bookingsCol.countDocuments({
        date: { $gte: today },
        $expr: { $in: [{ $toLower: { $ifNull: ['$status', 'scheduled'] } }, ['scheduled', 'confirmed', 'booked']] },
      }),
      contactCol.countDocuments({ $or: [{ status: { $exists: false } }, { status: null }, { status: '' }, { status: { $regex: /^new$/i } }] }),
      refundsCol.countDocuments({ Status: { $regex: /^pending$/i } }),
      usersCol.aggregate([
        { $unwind: '$messages' },
        {
          $match: {
            $or: [
              { 'messages.unreadByAdmin': true },
              { 'messages.unreadByAdmin': { $exists: false }, 'messages.read': false },
            ],
          },
        },
        { $count: 'count' },
      ]).toArray(),
    ])
    res.json({
      totalUsers,
      totalBookings,
      activeEnrollments: Number(activeEnrollmentRows[0]?.count || 0),
      upcomingBookings,
      pendingContacts,
      pendingRefunds,
      unreadSupport: Number(unreadSupportRows[0]?.count || 0),
    })
  } catch (e) {
    sendServerError(res, e, 'Admin statistics lookup failed')
  }
})

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await usersCol.find().sort({ _id: -1 }).toArray()
    res.json(users)
  } catch (e) {
    sendServerError(res, e, 'Admin user lookup failed')
  }
})

app.get('/api/admin/bookings', async (req, res) => {
  try {
    const bookings = await bookingsCol.find({ status: { $ne: 'held' } }).sort({ _id: -1 }).toArray()
    const today = californiaDateKey()
    res.json(bookings.map(booking => ({
      ...booking,
      status: canonicalAdminBookingStatus(booking, today),
    })))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/admin/availability', async (req, res) => {
  try {
    await cleanupExpiredHolds()
    const page = cleanInteger(req.query.page, 1, 1, 100_000)
    const limit = cleanInteger(req.query.limit, 10, 5, 100)
    const search = cleanText(req.query.search, 80)
    const statusFilter = cleanText(req.query.status, 20).toLowerCase()
    const from = cleanText(req.query.from, 10)
    const to = cleanText(req.query.to, 10)
    const filter = {}
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [{ date: { $regex: safeSearch, $options: 'i' } }, { time: { $regex: safeSearch, $options: 'i' } }]
    }
    if (from || to) {
      filter.date = {}
      if (from && isDateKey(from)) filter.date.$gte = from
      if (to && isDateKey(to)) filter.date.$lte = to
      if (!Object.keys(filter.date).length) delete filter.date
    }
    const today = californiaDateKey()
    const effective = (await effectiveAvailabilitySlots(filter)).map(slot => ({
      ...slot,
      status: adminAvailabilityStatus(slot, today),
    }))
    const filtered = statusFilter === 'manageable'
      ? effective.filter(slot => slot.status === 'available' || slot.status === 'blocked')
      : ['available', 'blocked', 'held', 'booked', 'expired'].includes(statusFilter)
        ? effective.filter(slot => slot.status === statusFilter)
        : effective
    const total = filtered.length
    const pages = Math.max(1, Math.ceil(total / limit))
    const safePage = Math.min(page, pages)
    const items = filtered.slice((safePage - 1) * limit, safePage * limit)
      .map(({ _id, slotKey, date, time, status, createdAt, updatedAt }) => ({ _id, slotKey, date, time, status, createdAt, updatedAt }))
    res.json({ items, total, page: safePage, pages, limit })
  } catch (error) {
    sendServerError(res, error, 'Admin availability lookup failed')
  }
})

app.post('/api/admin/availability', rateLimit({ windowMs: 60_000, max: 30 }), async (req, res) => {
  try {
    const dates = [...new Set((Array.isArray(req.body?.dates) ? req.body.dates : []).map(date => cleanText(date, 10)))]
    const times = [...new Set((Array.isArray(req.body?.times) ? req.body.times : []).map(time => normalizeBookingTime(time)))]
    if (!dates.length || dates.length > 90) throw new HttpError(400, 'Choose between 1 and 90 future dates.')
    if (!times.length || times.length > ADMIN_AVAILABILITY_TIMES.length) throw new HttpError(400, 'Choose at least one supported lesson time.')
    const slots = dates.flatMap(date => times.map(time => validateAvailabilitySlot(date, time, { allowToday: false })))
    const now = new Date().toISOString()
    const operations = slots.map(slot => {
      const slotKey = bookingSlotKey(slot.date, slot.timeSlot)
      return {
        updateOne: {
          filter: { slotKey },
          update: {
            $set: {
              slotKey,
              date: slot.date,
              time: slot.timeSlot,
              timeOrder: ADMIN_AVAILABILITY_TIMES.indexOf(slot.timeSlot),
              status: 'available',
              updatedAt: now,
              updatedBy: req.auth.uid,
            },
            $setOnInsert: { createdAt: now, createdBy: req.auth.uid },
          },
          upsert: true,
        },
      }
    })
    await availabilityCol.bulkWrite(operations, { ordered: false })
    res.status(201).json({ ok: true, saved: slots.length })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Availability creation failed')
  }
})

app.put('/api/admin/availability/status', async (req, res) => {
  try {
    const ids = [...new Set((Array.isArray(req.body?.ids) ? req.body.ids : []).map(id => cleanText(id, 40)))]
    const status = cleanText(req.body?.status, 20).toLowerCase()
    if (!ids.length || ids.length > 100 || ids.some(id => !ObjectId.isValid(id))) throw new HttpError(400, 'Choose valid availability rows.')
    if (!['available', 'blocked'].includes(status)) throw new HttpError(400, 'Status must be Available or Blocked.')
    const objectIds = ids.map(id => new ObjectId(id))
    const result = await withMongoTransaction(async (session) => {
      const slots = await availabilityCol.find({ _id: { $in: objectIds } }, { session }).toArray()
      if (slots.length !== objectIds.length) throw new HttpError(404, 'One or more availability rows were not found.')
      if (slots.some(slot => slot.date <= californiaDateKey())) {
        throw new HttpError(409, 'Expired availability cannot be changed. Only future slots can be managed.')
      }
      const activeLock = await bookingSlotsCol.findOne({
        _id: { $in: slots.map(slot => slot.slotKey) },
        $or: [
          { status: { $in: ['confirmed', 'booked', 'scheduled'] } },
          { status: 'held', expiresAt: { $gt: new Date() } },
        ],
      }, { session })
      if (activeLock) throw new HttpError(409, 'Held or booked times cannot be changed. Cancel the related booking first.')
      return availabilityCol.updateMany(
        { _id: { $in: objectIds } },
        { $set: { status, updatedAt: new Date().toISOString(), updatedBy: req.auth.uid } },
        { session }
      )
    })
    res.json({ ok: true, updated: result.modifiedCount })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Availability status update failed')
  }
})

app.delete('/api/admin/availability/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid availability id.')
    const id = new ObjectId(req.params.id)
    await withMongoTransaction(async (session) => {
      const slot = await availabilityCol.findOne({ _id: id }, { session })
      if (!slot) throw new HttpError(404, 'Availability row not found.')
      if (slot.date <= californiaDateKey()) {
        throw new HttpError(409, 'Expired availability cannot be deleted. Only future slots can be managed.')
      }
      const activeLock = await bookingSlotsCol.findOne({
        _id: slot.slotKey,
        $or: [
          { status: { $in: ['confirmed', 'booked', 'scheduled'] } },
          { status: 'held', expiresAt: { $gt: new Date() } },
        ],
      }, { session })
      if (activeLock) throw new HttpError(409, 'A held or booked time cannot be deleted. Cancel the related booking first.')
      await availabilityCol.deleteOne({ _id: id }, { session })
    })
    res.json({ ok: true })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Availability deletion failed')
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
    const deletedBooking = await withMongoTransaction(async (session) => {
      const booking = await bookingsCol.findOne({ _id: bookingId }, { session })
      if (!booking) throw new HttpError(404, 'Booking not found.')

      // Match by bookingId so deleting an old history record can never release a
      // newer student's lock that happens to use the same date and time.
      await bookingSlotsCol.deleteMany({ bookingId }, { session })
      await bookingsCol.deleteOne({ _id: bookingId }, { session })

      if (booking.userId && booking.courseId !== undefined && booking.courseId !== null && booking.courseId !== '') {
        const profile = await usersCol.findOne({ uid: booking.userId }, { session, projection: { courses: 1 } })
        const courses = Array.isArray(profile?.courses) ? profile.courses : []
        let courseIndex = -1
        if (booking.enrollmentId) {
          courseIndex = courses.findIndex(course => String(course?.enrollmentId || '') === String(booking.enrollmentId))
        }
        if (courseIndex < 0) courseIndex = findCourseEnrollmentIndex(courses, booking.courseId)

        if (courseIndex >= 0) {
          const targetSlotKey = bookingSlotKey(booking.date, booking.timeSlot)
          const nextCourses = courses.map((course, index) => {
            if (index !== courseIndex) return course
            const pickupSlots = (Array.isArray(course?.pickupSlots) ? course.pickupSlots : []).filter(slot => {
              const safeSlot = safeStoredPickupSlot(slot)
              return !safeSlot || bookingSlotKey(safeSlot.date, safeSlot.time) !== targetSlotKey
            })
            return { ...course, pickupSlots }
          })
          await usersCol.updateOne({ uid: booking.userId }, { $set: { courses: nextCourses } }, { session })
        }
      }
      return booking
    })
    await safelySyncBookingWithGoogleCalendar(deletedBooking, { deleted: true })
    res.json({ ok: true, booking: deletedBooking })
  } catch (e) {
    if (e instanceof HttpError) return res.status(e.status).json({ error: e.message })
    sendServerError(res, e, 'Admin booking deletion failed')
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
    if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid pricing plan id.')
    const pricingId = new ObjectId(req.params.id)
    const plan = await pricingCol.findOne({ _id: pricingId }, { projection: { id: 1, planName: 1 } })
    if (!plan) throw new HttpError(404, 'Pricing plan not found.')
    const enrolledCount = await usersCol.countDocuments({
      courses: { $elemMatch: { id: { $in: courseIdCandidates(plan.id) } } },
    })
    if (enrolledCount > 0 && req.query.confirmEnrolled !== 'true') {
      throw new HttpError(409, `This plan is linked to ${enrolledCount} enrolled account${enrolledCount === 1 ? '' : 's'}. Confirm the enrolled-plan warning before deleting it.`)
    }
    await pricingCol.deleteOne({ _id: pricingId })
    res.json({ ok: true })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
    sendServerError(res, e, 'Pricing plan deletion failed')
  }
})

app.get('/api/admin/coupons', async (_req, res) => {
  try {
    const today = californiaDateKey()
    const coupons = await couponsCol.find().sort({ createdAt: -1, code: 1 }).toArray()
    res.json(coupons.map(coupon => ({
      ...coupon,
      effectiveStatus: coupon.isActive === false
        ? 'paused'
        : coupon.startsAt && today < coupon.startsAt
          ? 'scheduled'
          : coupon.expiresAt && today > coupon.expiresAt
            ? 'expired'
            : 'active',
    })))
  } catch (error) {
    sendServerError(res, error, 'Coupon list lookup failed')
  }
})

app.post('/api/admin/coupons', async (req, res) => {
  try {
    const now = new Date().toISOString()
    const doc = { ...sanitizeCoupon(req.body), redemptionCount: 0, createdAt: now, updatedAt: now }
    const result = await couponsCol.insertOne(doc)
    res.status(201).json({ ok: true, coupon: { ...doc, _id: result.insertedId } })
  } catch (error) {
    if (isDuplicateKey(error)) return res.status(409).json({ error: 'That coupon code already exists.' })
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Coupon creation failed')
  }
})

app.put('/api/admin/coupons/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid coupon id.')
    const existing = await couponsCol.findOne({ _id: new ObjectId(req.params.id) })
    if (!existing) throw new HttpError(404, 'Coupon not found.')
    const doc = { ...sanitizeCoupon(req.body), updatedAt: new Date().toISOString() }
    await couponsCol.updateOne({ _id: existing._id }, { $set: doc })
    res.json({ ok: true, coupon: { ...existing, ...doc } })
  } catch (error) {
    if (isDuplicateKey(error)) return res.status(409).json({ error: 'That coupon code already exists.' })
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Coupon update failed')
  }
})

app.delete('/api/admin/coupons/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid coupon id.')
    const coupon = await couponsCol.findOne({ _id: new ObjectId(req.params.id) })
    if (!coupon) throw new HttpError(404, 'Coupon not found.')
    const used = Number(coupon.redemptionCount || 0)
    if (used > 0 && req.query.confirmUsed !== 'true') {
      throw new HttpError(409, `This coupon has been used ${used} time${used === 1 ? '' : 's'}. Confirm the usage-history warning before deleting it.`)
    }
    await couponsCol.deleteOne({ _id: coupon._id })
    res.json({ ok: true })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Coupon deletion failed')
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

app.get('/api/locations', async (_req, res) => {
  try {
    const locations = await locationsCol.find().sort({ order: 1, name: 1 }).toArray()
    res.json(locations)
  } catch (error) {
    sendServerError(res, error, 'Booking location lookup failed')
  }
})

app.post('/api/admin/locations', async (req, res) => {
  try {
    const now = new Date().toISOString()
    const doc = { ...sanitizeLocation(req.body), createdAt: now, updatedAt: now }
    const result = await locationsCol.insertOne(doc)
    res.status(201).json({ ok: true, location: { ...doc, _id: result.insertedId } })
  } catch (error) {
    if (isDuplicateKey(error)) return res.status(409).json({ error: 'This city already exists.' })
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Booking location creation failed')
  }
})

app.put('/api/admin/locations/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid location id.')
    const doc = { ...sanitizeLocation(req.body), updatedAt: new Date().toISOString() }
    const result = await locationsCol.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: doc },
      { returnDocument: 'after' }
    )
    if (!result) return res.status(404).json({ error: 'Location not found.' })
    res.json({ ok: true, location: result })
  } catch (error) {
    if (isDuplicateKey(error)) return res.status(409).json({ error: 'This city already exists.' })
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Booking location update failed')
  }
})

app.get('/api/admin/locations/:id/usage', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid location id.')
    const location = await locationsCol.findOne({ _id: new ObjectId(req.params.id) })
    if (!location) throw new HttpError(404, 'Location not found.')
    res.json({ location: { _id: location._id, name: location.name }, ...(await locationUsage(location)) })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Booking location usage lookup failed')
  }
})

app.delete('/api/admin/locations/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid location id.')
    const id = new ObjectId(req.params.id)
    const location = await locationsCol.findOne({ _id: id })
    if (!location) return res.status(404).json({ error: 'Location not found.' })
    const usage = await locationUsage(location)
    if (usage.total > 0 && req.query.confirmInUse !== 'true') {
      throw new HttpError(409, `This city is used by ${usage.total} existing record${usage.total === 1 ? '' : 's'}. Confirm the in-use location warning before deleting it.`)
    }
    const result = await locationsCol.deleteOne({ _id: id })
    if (!result.deletedCount) return res.status(404).json({ error: 'Location not found.' })
    res.json({ ok: true })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Booking location deletion failed')
  }
})

app.get('/api/reviews', async (_req, res) => {
  try {
    const reviews = await reviewsCol.find({ published: true })
      .sort({ order: 1, createdAt: 1 })
      .project({ name: 1, text: 1, rating: 1, order: 1 })
      .toArray()
    res.json(reviews)
  } catch (error) {
    sendServerError(res, error, 'Customer review lookup failed')
  }
})

app.get('/api/admin/reviews', async (_req, res) => {
  try {
    const reviews = await reviewsCol.find().sort({ order: 1, createdAt: 1 }).toArray()
    res.json(reviews)
  } catch (error) {
    sendServerError(res, error, 'Admin review lookup failed')
  }
})

app.post('/api/admin/reviews', async (req, res) => {
  try {
    const now = new Date().toISOString()
    const doc = { ...sanitizeReview(req.body), createdAt: now, updatedAt: now, updatedBy: req.auth.uid }
    const result = await reviewsCol.insertOne(doc)
    res.status(201).json({ ok: true, review: { ...doc, _id: result.insertedId } })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Customer review creation failed')
  }
})

app.put('/api/admin/reviews/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid review id.')
    const doc = { ...sanitizeReview(req.body), updatedAt: new Date().toISOString(), updatedBy: req.auth.uid }
    const review = await reviewsCol.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: doc },
      { returnDocument: 'after' }
    )
    if (!review) return res.status(404).json({ error: 'Review not found.' })
    res.json({ ok: true, review })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Customer review update failed')
  }
})

app.delete('/api/admin/reviews/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid review id.')
    const result = await reviewsCol.deleteOne({ _id: new ObjectId(req.params.id) })
    if (!result.deletedCount) return res.status(404).json({ error: 'Review not found.' })
    res.json({ ok: true })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Customer review deletion failed')
  }
})

async function uniqueBlogSlug(value, excludeId = null) {
  const base = normalizeBlogSlug(value) || `post-${Date.now().toString(36)}`
  for (let suffix = 1; suffix <= 500; suffix += 1) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`
    const query = { slug }
    if (excludeId) query._id = { $ne: excludeId }
    const existing = await blogsCol.findOne(query, { projection: { _id: 1 } })
    if (!existing) return slug
  }
  throw new HttpError(409, 'A unique blog URL could not be generated. Please change the title.')
}

app.get('/api/blogs', async (req, res) => {
  try {
    const limit = cleanInteger(req.query?.limit, 50, 1, 100)
    const category = cleanText(req.query?.category, 80)
    const query = {
      published: true,
      publishedAt: { $lte: new Date().toISOString() },
    }
    if (category) query.category = category
    const posts = await blogsCol.find(query)
      .sort({ featured: -1, order: 1, publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .project({ title: 1, slug: 1, excerpt: 1, category: 1, author: 1, imageUrl: 1, featured: 1, publishedAt: 1, readingMinutes: 1 })
      .toArray()
    res.json(posts)
  } catch (error) {
    sendServerError(res, error, 'Blog post lookup failed')
  }
})

app.get('/api/blogs/:slug', async (req, res) => {
  try {
    const slug = normalizeBlogSlug(req.params.slug)
    if (!slug) return res.status(404).json({ error: 'Blog post not found.' })
    const post = await blogsCol.findOne({
      slug,
      published: true,
      publishedAt: { $lte: new Date().toISOString() },
    }, { projection: { updatedBy: 0 } })
    if (!post) return res.status(404).json({ error: 'Blog post not found.' })
    res.json(post)
  } catch (error) {
    sendServerError(res, error, 'Blog post lookup failed')
  }
})

app.get('/api/admin/blogs', async (_req, res) => {
  try {
    const posts = await blogsCol.find().sort({ featured: -1, order: 1, publishedAt: -1, createdAt: -1 }).toArray()
    res.json(posts)
  } catch (error) {
    sendServerError(res, error, 'Admin blog lookup failed')
  }
})

app.post('/api/admin/blogs', async (req, res) => {
  try {
    const now = new Date().toISOString()
    const clean = sanitizeBlog(req.body)
    const slug = await uniqueBlogSlug(clean.slug || clean.title)
    const doc = {
      ...clean,
      slug,
      publishedAt: clean.published ? (clean.publishedAt || now) : clean.publishedAt,
      createdAt: now,
      updatedAt: now,
      createdBy: req.auth.uid,
      updatedBy: req.auth.uid,
    }
    const result = await blogsCol.insertOne(doc)
    res.status(201).json({ ok: true, post: { ...doc, _id: result.insertedId } })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    if (error.code === 11000) return res.status(409).json({ error: 'A blog post already uses this URL.' })
    sendServerError(res, error, 'Blog post creation failed')
  }
})

app.put('/api/admin/blogs/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid blog post id.')
    const id = new ObjectId(req.params.id)
    const existing = await blogsCol.findOne({ _id: id })
    if (!existing) return res.status(404).json({ error: 'Blog post not found.' })
    const now = new Date().toISOString()
    const clean = sanitizeBlog(req.body)
    const requestedSlug = clean.slug || existing.slug || clean.title
    const slug = requestedSlug === existing.slug ? existing.slug : await uniqueBlogSlug(requestedSlug, id)
    const doc = {
      ...clean,
      slug,
      publishedAt: clean.published ? (clean.publishedAt || existing.publishedAt || now) : clean.publishedAt,
      updatedAt: now,
      updatedBy: req.auth.uid,
    }
    const post = await blogsCol.findOneAndUpdate({ _id: id }, { $set: doc }, { returnDocument: 'after' })
    res.json({ ok: true, post })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    if (error.code === 11000) return res.status(409).json({ error: 'A blog post already uses this URL.' })
    sendServerError(res, error, 'Blog post update failed')
  }
})

app.delete('/api/admin/blogs/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid blog post id.')
    const result = await blogsCol.deleteOne({ _id: new ObjectId(req.params.id) })
    if (!result.deletedCount) return res.status(404).json({ error: 'Blog post not found.' })
    res.json({ ok: true })
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message })
    sendServerError(res, error, 'Blog post deletion failed')
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

const DEFAULT_LOCATIONS = [
  'Fremont', 'Newark', 'Hayward', 'Union City', 'San Lorenzo', 'San Leandro',
  'Castro Valley', 'Ashland', 'Oakland',
].map((name, index) => ({ name, distance: 'Near', order: index + 1 }))
  .concat([
    'San Jose', 'Santa Clara', 'Sunnyvale', 'Palo Alto', 'San Mateo', 'Mountain View',
    'Cupertino', 'Menlo Park', 'Redwood City', 'San Francisco', 'Millbrae', 'San Bruno',
    'Burlingame', 'Hillsborough', 'South San Francisco', 'Foster City', 'Brisbane',
    'Belmont', 'Alameda', 'Pleasanton', 'San Ramon', 'Milpitas',
  ].map((name, index) => ({ name, distance: 'Long', order: index + 10 })))

const DEFAULT_SOCIALS = [
  { platform: 'facebook', url: 'https://www.facebook.com/people/A-Precision-Driving-School/61561300479300/', order: 0 },
  { platform: 'instagram', url: 'https://www.instagram.com/aprecisiondrivingschool/', order: 1 },
  { platform: 'youtube', url: 'https://www.youtube.com/@aprecisiondrivingschool', order: 2 },
]

const DEFAULT_REVIEWS = [
  { name: 'Hamza Mian', text: 'I had a great time learning how to drive with the instructors. They are very knowledgeable with driving and passing the behind the wheel test.', rating: 5, published: true, order: 0 },
  { name: 'Roop L.', text: 'I had a very positive experience with this driving school. My daughter had lessons with Raj, and she is a truly great instructor. Raj does a wonderful job helping students understand how to react to the car and the surrounding environment.', rating: 5, published: true, order: 1 },
  { name: 'SimplyXenia', text: 'Working with Ken has been a very enjoyable experience!! He stays calm and collected while practicing with me. While still giving me helpful tips for the future.', rating: 5, published: true, order: 2 },
  { name: 'Armaan', text: 'Had an excellent experience with A Precision Driving School. Definitely recommend if you are looking to learn driving and ace your exam. They taught me everything from starting the car to going on the freeway, and I am far more confident as a driver.', rating: 5, published: true, order: 3 },
  { name: 'Mudassar Mujawar', text: 'I opted for 6 hours classes and time spent in each class was worth. Instructors were knowledgeable and professional throughout, appreciate the way driving skills were imparted during the classes.', rating: 5, published: true, order: 4 },
  { name: 'Olivia Brandeis', text: 'Ken was a very patient and flexible instructor. He had lots of available times and even took me through the course before my driving test. I would highly recommend this service.', rating: 5, published: true, order: 5 },
  { name: 'Shishir Bahubali', text: 'Really good driving school. I had Ken as my instructor all three times and he was very helpful. He was very good at explaining what I have to do and answering all my questions.', rating: 5, published: true, order: 6 },
  { name: 'Aryav Dusara', text: 'The experience I had with A Precision Driving School was very good. The instructor was very helpful and was able to teach me how to drive without any prior experience on my part.', rating: 5, published: true, order: 7 },
  { name: 'Mehek Saini', text: 'The driving instructors are super helpful and teach amazingly. They always answer questions specifically and point out and help you fix your mistakes. I 100% recommend.', rating: 5, published: true, order: 8 },
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
    const { search, status, page = 1, limit = 10 } = req.query
    const p = Math.max(1, parseInt(page))
    const l = Math.min(100, Math.max(1, parseInt(limit)))
    const filter = {}
    const normalizedStatusFilter = cleanText(status, 30).toLowerCase()
    if (normalizedStatusFilter && normalizedStatusFilter !== 'all') {
      if (!['pending', 'refunded', 'denied'].includes(normalizedStatusFilter)) {
        throw new HttpError(400, 'Invalid refund status filter.')
      }
      filter.Status = { $regex: `^${normalizedStatusFilter}$`, $options: 'i' }
    }
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
    const userIds = [...new Set(data.map(refund => cleanText(refund.uid || refund.User_UID, 160)).filter(Boolean))]
    const paymentUsers = userIds.length
      ? await usersCol.find({ uid: { $in: userIds } }, { projection: { uid: 1, payments: 1 } }).toArray()
      : []
    const usersById = new Map(paymentUsers.map(user => [user.uid, user]))
    const enriched = data.map(refund => {
      const uid = cleanText(refund.uid || refund.User_UID, 160)
      const paymentMatch = findPayPalPaymentForRefund(usersById.get(uid), refund)
      const payment = paymentMatch?.payment
      return {
        ...refund,
        PayPal_Reference: cleanText(refund.Provider_Refund_ID || refund.Provider_Payment_Ref || payment?.ref || payment?.providerOrderId, 120),
        PayPal_Capture_ID: cleanText(refund.Provider_Capture_ID || payment?.providerCaptureId, 120),
      }
    })
    res.json({ data: enriched, total, page: p, limit: l, totalPages: Math.ceil(total / l) })
  } catch (e) {
    sendServerError(res, e, 'Refund record lookup failed')
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
    if (sanitized.Status !== 'pending') throw new HttpError(400, 'New refund records must start as Pending.')
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
    const existingRefund = await refundsCol.findOne({ _id: refundId })
    if (!existingRefund) return res.status(404).json({ error: 'Refund record not found.' })
    const existingStatus = cleanText(existingRefund.Status || 'pending', 20).toLowerCase()
    if (isFinalRefundStatus(existingStatus)) {
      return res.status(409).json({ error: `This refund is already ${existingStatus} and can no longer be changed.` })
    }
    const requestedStatus = cleanText(sanitized.Status || existingRefund.Status || 'pending', 20).toLowerCase()

    let providerRefund = null
    let matchedPayment = null
    if (requestedStatus === 'refunded' && cleanText(existingRefund.Status, 20).toLowerCase() !== 'refunded') {
      const uid = cleanText(existingRefund.uid || existingRefund.User_UID, 160)
      if (!uid) return res.status(409).json({ error: 'This refund is not linked to a student payment.' })
      const user = await usersCol.findOne({ uid }, { projection: { payments: 1 } })
      matchedPayment = findPayPalPaymentForRefund(user, existingRefund)
      if (!matchedPayment) {
        return res.status(409).json({
          error: 'No matching captured PayPal payment was found. Verify the invoice before approving this refund.',
        })
      }
      providerRefund = await resolvePayPalRefund(existingRefund, matchedPayment.payment)
      const providerStatus = cleanText(providerRefund?.status, 30).toUpperCase()
      const providerFields = {
        Provider: 'PayPal',
        Provider_Environment: PAYPAL_ENVIRONMENT,
        Provider_Order_ID: cleanText(matchedPayment.payment.providerOrderId, 120),
        Provider_Capture_ID: cleanText(matchedPayment.payment.providerCaptureId, 120),
        Provider_Payment_Ref: cleanText(matchedPayment.payment.ref, 120),
        Provider_Refund_ID: cleanText(providerRefund?.id, 120),
        Provider_Refund_Status: providerStatus,
        Provider_Updated_At: new Date().toISOString(),
      }
      if (providerStatus === 'PENDING') {
        await refundsCol.updateOne(
          { _id: refundId, Status: { $ne: 'refunded' } },
          { $set: { ...providerFields, updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19) } }
        )
        return res.status(202).json({ ok: true, status: 'pending', providerStatus })
      }
      if (providerStatus !== 'COMPLETED') {
        return res.status(502).json({ error: 'PayPal has not completed this refund. Please try again later.' })
      }
    }

    const result = await withMongoTransaction(async (session) => {
      const existing = await refundsCol.findOne({ _id: refundId }, { session })
      if (!existing) return { found: false }
      const currentStatus = cleanText(existing.Status || 'pending', 20).toLowerCase()
      if (isFinalRefundStatus(currentStatus)) {
        throw new HttpError(409, `This refund is already ${currentStatus} and can no longer be changed.`)
      }
      const updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const providerStatus = cleanText(providerRefund?.status, 30).toUpperCase()
      const providerRefundId = cleanText(providerRefund?.id || existing.Provider_Refund_ID, 120)
      const providerFields = providerRefund ? {
        Provider: 'PayPal',
        Provider_Environment: PAYPAL_ENVIRONMENT,
        Provider_Order_ID: cleanText(matchedPayment?.payment?.providerOrderId, 120),
        Provider_Capture_ID: cleanText(matchedPayment?.payment?.providerCaptureId, 120),
        Provider_Payment_Ref: cleanText(matchedPayment?.payment?.ref, 120),
        Provider_Refund_ID: providerRefundId,
        Provider_Refund_Status: providerStatus,
        Provider_Updated_At: new Date().toISOString(),
      } : {}
      await refundsCol.updateOne(
        { _id: refundId },
        { $set: { ...sanitized, ...providerFields, updated_at: updatedAt } },
        { session }
      )
      const nextStatus = sanitized.Status || existing.Status || 'pending'
      await applyRefundDecisionToCourse(existing, nextStatus, session)
      if (String(nextStatus).toLowerCase() === 'refunded' && providerRefundId) {
        const uid = cleanText(existing.uid || existing.User_UID, 160)
        const user = await usersCol.findOne({ uid }, { session, projection: { payments: 1 } })
        const paymentMatch = findPayPalPaymentForRefund(user, existing)
        if (!paymentMatch) throw new HttpError(409, 'The linked PayPal payment changed before the refund was saved.')
        const payment = paymentMatch.payment
        const refundIds = Array.isArray(payment.providerRefundIds)
          ? payment.providerRefundIds.map(id => String(id))
          : []
        const alreadyRecorded = refundIds.includes(providerRefundId)
        const refundedAmount = alreadyRecorded
          ? Number(payment.refundedAmount || 0)
          : Number(payment.refundedAmount || 0) + Number(providerRefund?.amount?.value || planPriceAmount(existing.Amount) || 0)
        const paymentAmount = Number(payment.amount || 0)
        const paymentStatus = moneyCents(refundedAmount) >= moneyCents(paymentAmount)
          ? 'Refunded'
          : 'Partially Refunded'
        await usersCol.updateOne(
          { uid },
          {
            $set: {
              [`payments.${paymentMatch.index}.status`]: paymentStatus,
              [`payments.${paymentMatch.index}.refundedAmount`]: Number(moneyString(refundedAmount)),
              [`payments.${paymentMatch.index}.providerRefundIds`]: alreadyRecorded ? refundIds : [...refundIds, providerRefundId],
              [`payments.${paymentMatch.index}.providerRefundId`]: providerRefundId,
              [`payments.${paymentMatch.index}.refundStatus`]: 'COMPLETED',
              [`payments.${paymentMatch.index}.refundedAt`]: cleanText(providerRefund?.update_time || providerRefund?.create_time, 80) || new Date().toISOString(),
            },
          },
          { session }
        )
      }
      return { found: true, status: nextStatus, providerStatus: providerStatus || undefined }
    })
    if (!result.found) return res.status(404).json({ error: 'Refund record not found.' })
    res.json({ ok: true, status: result.status, providerStatus: result.providerStatus })
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
      const existingStatus = cleanText(existing.Status || 'pending', 20).toLowerCase()
      if (isFinalRefundStatus(existingStatus)) {
        throw new HttpError(409, `This refund is already ${existingStatus} and cannot be deleted.`)
      }
      if (String(existing.Status || 'pending').toLowerCase() === 'pending') {
        const uid = cleanText(existing.uid || existing.User_UID, 160)
        const courseId = cleanText(existing.Course_ID, 120)
        if (uid && courseId) {
          const user = await usersCol.findOne({ uid }, { session, projection: { courses: 1 } })
          const courses = user?.courses || []
          const enrollmentId = cleanText(existing.Enrollment_ID, 160)
          let courseIndex = enrollmentId
            ? courses.findLastIndex(course =>
                String(course?.id) === courseId && String(course?.enrollmentId) === enrollmentId
              )
            : -1
          if (courseIndex < 0) {
            courseIndex = findCourseEnrollmentIndex(courses, courseId, cleanText(existing.Enrollment_Date, 160))
          }
          if (courseIndex >= 0) {
            await usersCol.updateOne(
              { uid },
              {
                $set: { [`courses.${courseIndex}.status`]: 'Enrolled' },
                $unset: {
                  [`courses.${courseIndex}.refundRequestId`]: '',
                  [`courses.${courseIndex}.refundRequestedAt`]: '',
                  [`courses.${courseIndex}.refundStatus`]: '',
                  [`courses.${courseIndex}.refundDecisionAt`]: '',
                },
              },
              { session }
            )
          }
        }
      }
      await refundsCol.deleteOne({ _id: refundId }, { session })
      return true
    })
    if (!result) return res.status(404).json({ error: 'Refund record not found.' })
    res.json({ ok: true })
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message })
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

async function seedLocations() {
  const createdAt = new Date().toISOString()
  await locationsCol.bulkWrite(DEFAULT_LOCATIONS.map(location => {
    const doc = sanitizeLocation(location)
    return {
      updateOne: {
        filter: { key: doc.key },
        update: { $setOnInsert: { ...doc, createdAt, updatedAt: createdAt } },
        upsert: true,
      },
    }
  }), { ordered: false })
}

async function seedSocials() {
  const count = await socialsCol.countDocuments()
  if (count === 0) {
    await socialsCol.insertMany(DEFAULT_SOCIALS.map(s => ({ ...s, createdAt: new Date().toISOString() })))
    console.log('Seeded default social links')
  }
}

async function seedReviews() {
  const count = await reviewsCol.countDocuments()
  if (count === 0) {
    const now = new Date().toISOString()
    await reviewsCol.insertMany(DEFAULT_REVIEWS.map(review => ({ ...sanitizeReview(review), createdAt: now, updatedAt: now })))
    console.log('Seeded default customer reviews')
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

export {
  DEFAULT_LOCATIONS,
  deliverContactEmails,
  escapeEmailHtml,
  adminAvailabilityStatus,
  canonicalAdminBookingStatus,
  bookingsForEnrollment,
  checkoutFingerprint,
  couponCheckoutFingerprint,
  couponDiscountQuote,
  findPayPalPaymentForRefund,
  decryptCalendarToken,
  encryptCalendarToken,
  googleCalendarEventTimes,
  isFinalRefundStatus,
  moneyString,
  normalizePlanPrice,
  normalizeLocationKey,
  packageSlotAllowance,
  pickupSlotsFromCourse,
  pricingForBookingLocation,
  refundedPaymentCents,
  sanitizeLocation,
  sanitizeBlog,
  sanitizeCoupon,
  sanitizePricing,
  sanitizeReview,
  payableCheckoutAmount,
  splitCheckoutItems,
  validateContinuationSlotCount,
  validateAvailabilitySlot,
  slotLimitForTier,
}
export default app
