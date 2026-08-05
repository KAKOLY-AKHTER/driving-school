import 'dotenv/config'
import dns from 'dns'
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import Groq from 'groq-sdk'


dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const app = express()
const allowedOrigins = String(process.env.CLIENT_URL || '').split(',').map(value => value.trim()).filter(Boolean)
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origin not allowed by CORS'))
  },
}))
app.use(express.json({ limit: '100kb' }))

const rateBuckets = new Map()
function rateLimit({ windowMs = 60_000, max = 20 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`
    const now = Date.now()
    const bucket = rateBuckets.get(key)
    if (!bucket || now - bucket.startedAt >= windowMs) {
      rateBuckets.set(key, { startedAt: now, count: 1 })
      return next()
    }
    bucket.count += 1
    if (bucket.count > max) return res.status(429).json({ error: 'Too many requests. Please try again shortly.' })
    return next()
  }
}

const cleanText = (value, maxLength = 500) => String(value || '').trim().slice(0, maxLength)
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isDateKey = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value)
const BOOKING_TIMES = new Set([
  '07:00 AM - 09:00 AM', '09:00 AM - 11:00 AM', '12:00 PM - 02:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM',
  '9:00 AM - 11:00 AM', '11:00 AM - 1:00 PM', '2:00 PM - 4:00 PM', '4:00 PM - 6:00 PM',
])

const PORT = process.env.PORT || 3001
const MONGO_URI = process.env.MONGO_URI
const DB_NAME = 'driving_school'

let db, usersCol, bookingsCol, contactCol, settingsCol, pricingCol, enrollmentsCol, areasCol, socialsCol, refundsCol, cartsCol
let connectPromise = null

async function connectDB() {
  if (connectPromise) return connectPromise
  connectPromise = (async () => {
    const client = new MongoClient(MONGO_URI)
    await client.connect()
    db = client.db(DB_NAME)
    usersCol = db.collection('users')
    bookingsCol = db.collection('bookings')
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
    await cartsCol.createIndex({ uid: 1 }, { unique: true })
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

app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/health', (req, res) => res.json({ ok: true }))

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
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/users/:uid', async (req, res) => {
  try {
    const user = await usersCol.findOne({ uid: req.params.uid })
    res.json(user || { uid: req.params.uid })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params
    const data = { ...req.body }
    delete data._id
    delete data.uid
    await usersCol.updateOne(
      { uid },
      { $set: data },
      { upsert: true }
    )
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/bookings/availability', async (req, res) => {
  try {
    if (!req.query.date) return res.status(400).json({ error: 'Date required' })
    const bookings = await bookingsCol.find({ date: req.query.date, status: { $ne: 'cancelled' } }).toArray()
    res.json({ bookedTimes: [...new Set(bookings.map(b => b.timeSlot).filter(Boolean))] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/bookings/:uid', async (req, res) => {
  try {
    const bookings = await bookingsCol
      .find({ userId: req.params.uid })
      .sort({ date: -1 })
      .toArray()
    res.json(bookings)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/bookings', rateLimit({ windowMs: 60_000, max: 30 }), async (req, res) => {
  try {
    const { userId, date, timeSlot } = req.body
    if (!userId || !date || !timeSlot) {
      return res.status(400).json({ error: 'User, date, and time slot are required.' })
    }
    if (!isDateKey(date) || !BOOKING_TIMES.has(timeSlot)) {
      return res.status(400).json({ error: 'Please choose a valid booking date and time.' })
    }
    if (new Date(`${date}T23:59:59`) < new Date()) {
      return res.status(400).json({ error: 'Past dates cannot be booked.' })
    }
    const existing = await bookingsCol.findOne({ date, timeSlot, status: { $ne: 'cancelled' } })
    if (existing) {
      return res.status(409).json({ error: 'This time slot has already been booked. Please choose another slot.' })
    }
    const booking = {
      userId,
      date,
      timeSlot,
      courseId: String(req.body.courseId || ''),
      hours: 2,
      status: req.body.status || 'scheduled',
      createdAt: new Date().toISOString(),
    }
    const result = await bookingsCol.insertOne(booking)
    res.json({ ...booking, _id: result.insertedId })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await bookingsCol.deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/users/:uid/courses', async (req, res) => {
  try {
    const { uid } = req.params
    const course = req.body
    if (!course || !course.id) return res.status(400).json({ error: 'Course id required' })
    const user = await usersCol.findOne({ uid })
    const existing = (user?.courses || []).find(c => c.id === course.id)
    if (existing) {
      return res.json({ ok: true, courses: user.courses, duplicate: true })
    }
    await usersCol.updateOne(
      { uid },
      { $push: { courses: course } },
      { upsert: true }
    )
    const updated = await usersCol.findOne({ uid })
    res.json({ ok: true, courses: updated?.courses || [] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/users/:uid/courses/:courseId', async (req, res) => {
  try {
    const { uid, courseId } = req.params
    await usersCol.updateOne(
      { uid },
      { $pull: { courses: { id: courseId } } }
    )
    const user = await usersCol.findOne({ uid })
    res.json({ ok: true, courses: user?.courses || [] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/users/:uid/payments', async (req, res) => {
  try {
    const { uid } = req.params
    const payment = req.body
    if (!payment) return res.status(400).json({ error: 'Payment data required' })
    await usersCol.updateOne(
      { uid },
      { $push: { payments: { $each: [payment], $position: 0 } } },
      { upsert: true }
    )
    const user = await usersCol.findOne({ uid })
    res.json({ ok: true, payments: user?.payments || [] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/users/:uid/cart', async (req, res) => {
  try {
    const cart = await cartsCol.findOne({ uid: req.params.uid })
    res.json(cart?.items || [])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/users/:uid/cart', async (req, res) => {
  try {
    const { uid } = req.params
    const course = req.body
    if (!course || !course.id) return res.status(400).json({ error: 'Course id required' })
    const cart = await cartsCol.findOne({ uid })
    const existing = (cart?.items || []).find(c => c.id === course.id)
    if (existing) {
      return res.json({ ok: true, items: cart.items, duplicate: true })
    }
    const items = [...(cart?.items || []), course]
    await cartsCol.updateOne({ uid }, { $set: { items, updatedAt: new Date().toISOString() } }, { upsert: true })
    res.json({ ok: true, items })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/users/:uid/cart/:courseId', async (req, res) => {
  try {
    const { uid, courseId } = req.params
    const cart = await cartsCol.findOne({ uid })
    const items = (cart?.items || []).filter(c => c.id !== courseId)
    await cartsCol.updateOne({ uid }, { $set: { items, updatedAt: new Date().toISOString() } }, { upsert: true })
    await bookingsCol.deleteMany({ userId: uid, courseId: String(courseId), status: 'scheduled' })
    res.json({ ok: true, items })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/users/:uid/cart/checkout', async (req, res) => {
  try {
    const { uid } = req.params
    const cart = await cartsCol.findOne({ uid })
    const items = cart?.items || []
    if (items.length === 0) return res.json({ ok: true, enrolled: 0 })
    const user = await usersCol.findOne({ uid })
    const existingCourses = user?.courses || []
    const toAdd = []
    for (const item of items) {
      if (existingCourses.some(c => c.id === item.id)) continue
      toAdd.push({
        id: item.id,
        title: item.title,
        price: item.price,
        status: 'Enrolled',
        progress: 0,
        enrolledAt: new Date().toISOString(),
        email: user?.email || '',
      })
    }
    const payment = {
      date: new Date().toISOString().split('T')[0],
      ref: `INV-${Date.now().toString(36).toUpperCase()}`,
      email: user?.email || '',
      item: toAdd.map(c => c.title).join(' + '),
      amount: toAdd.reduce((sum, c) => sum + (parseFloat(String(c.price).replace(/[^0-9.]/g, '')) || 0), 0),
      status: 'Pending',
    }
    await usersCol.updateOne(
      { uid },
      {
        $push: {
          courses: { $each: toAdd },
          payments: { $each: [payment], $position: 0 },
        },
      },
      { upsert: true }
    )
    const checkedOutCourseIds = items.map(item => String(item.id))
    await bookingsCol.updateMany(
      { userId: uid, courseId: { $in: checkedOutCourseIds }, status: 'scheduled' },
      { $set: { status: 'confirmed', confirmedAt: new Date().toISOString() } }
    )
    await cartsCol.deleteOne({ uid })
    res.json({ ok: true, enrolled: toAdd.length, payment })
  } catch (e) {
    res.status(500).json({ error: e.message })
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
      if (!seen.has(c.id)) seen.set(c.id, c)
    }
    const deduped = Array.from(seen.values())
    await usersCol.updateOne({ uid }, { $set: { courses: deduped } })
    res.json({ ok: true, courses: deduped })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/users/:uid/messages', async (req, res) => {
  try {
    const user = await usersCol.findOne({ uid: req.params.uid })
    res.json(user?.messages || [])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/users/:uid/messages', async (req, res) => {
  try {
    const { uid } = req.params
    const { subject, text } = req.body
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
      { $push: { messages: { $each: [thread], $position: 0 } } },
      { upsert: true }
    )
    const user = await usersCol.findOne({ uid })
    res.json({ ok: true, thread, messages: user?.messages || [] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/users/:uid/messages/:threadId/reply', async (req, res) => {
  try {
    const { uid, threadId } = req.params
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'Text required' })
    const reply = { from: 'user', text, timestamp: new Date().toISOString() }
    await usersCol.updateOne(
      { uid, 'messages.id': threadId },
      { $push: { 'messages.$.messages': reply } }
    )
    const user = await usersCol.findOne({ uid })
    res.json({ ok: true, messages: user?.messages || [] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/users/:uid/messages/read', async (req, res) => {
  try {
    const { uid } = req.params
    await usersCol.updateOne({ uid }, { $set: { 'messages.$[].read': true } })
    const user = await usersCol.findOne({ uid })
    res.json({ ok: true, messages: user?.messages || [] })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const SYSTEM_PROMPT = `You are a friendly AI assistant for A Precision Driving School located in San Ramon, California. You help students with questions about driving courses, scheduling, payments, and general driving education. Keep responses concise, helpful, and friendly. Respond in the same language the user writes in.

KEY INFORMATION:
- Location: San Ramon, CA
- Phone: (925) 555-0123
- Email: info@aprecisiondriving.com

COURSES:
1. Online Driver Ed ($59.99) - State-approved online course
2. Basic BTW Package A ($299.99) - 2 hours in-car
3. Basic BTW Package D ($499.99) - 4 hours in-car
4. Essential BTW Package B ($749.99) - 6 hours in-car
5. Ideal BTW + Online Package C ($799.99) - 6 hours BTW + online
6. Premier BTW Package E ($1,199.99) - 10 hours in-car
7. Duplicate Certificate 400C ($25.00)

POLICIES:
- Must have learner's permit for BTW lessons
- 24-hour cancellation notice required
- Refunds from dashboard
- 2-hour time slots: 9-11AM, 11AM-1PM, 2-4PM, 4-6PM`

app.post('/api/chat', rateLimit({ windowMs: 60_000, max: 12 }), async (req, res) => {
  try {
    const { messages } = req.body
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' })
    }

    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({ role: m.role, content: m.content }))
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
    console.error('Chat error:', e.message.substring(0, 200))
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/users/:uid/conversations', async (req, res) => {
  try {
    const user = await usersCol.findOne({ uid: req.params.uid })
    const convs = (user?.conversations || []).map(({ messages: _messages, ...rest }) => rest)
    res.json(convs)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/users/:uid/conversations/:convId', async (req, res) => {
  try {
    const user = await usersCol.findOne({ uid: req.params.uid })
    const conv = (user?.conversations || []).find(c => c.id === req.params.convId)
    res.json(conv || null)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/users/:uid/conversations', async (req, res) => {
  try {
    const { uid } = req.params
    const { title, messages } = req.body
    const conv = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      title: title || 'New chat',
      messages: messages || [],
      createdAt: new Date().toISOString(),
    }
    await usersCol.updateOne(
      { uid },
      { $push: { conversations: { $each: [conv], $position: 0 } } },
      { upsert: true }
    )
    res.json({ ok: true, conversation: conv })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/users/:uid/conversations/:convId', async (req, res) => {
  try {
    const { uid, convId } = req.params
    const { title, messages } = req.body
    const update = {}
    if (title !== undefined) update['conversations.$.title'] = title
    if (messages !== undefined) update['conversations.$.messages'] = messages
    await usersCol.updateOne(
      { uid, 'conversations.id': convId },
      { $set: update }
    )
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
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
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/admin/stats', async (req, res) => {
  try {
    const [totalUsers, totalBookings, activeEnrollments] = await Promise.all([
      usersCol.countDocuments(),
      bookingsCol.countDocuments(),
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
    const bookings = await bookingsCol.find().sort({ _id: -1 }).toArray()
    res.json(bookings)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/admin/users/:uid/role', async (req, res) => {
  try {
    const { isAdmin } = req.body
    await usersCol.updateOne({ uid: req.params.uid }, { $set: { isAdmin: !!isAdmin } }, { upsert: true })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/admin/bookings/:id', async (req, res) => {
  try {
    await bookingsCol.deleteOne({ _id: new ObjectId(req.params.id) })
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
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/admin/pricing', async (req, res) => {
  try {
    const doc = {
      ...req.body,
      features: req.body.features || [],
      createdAt: new Date().toISOString(),
    }
    const result = await pricingCol.insertOne(doc)
    res.json({ ok: true, _id: result.insertedId })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/admin/pricing/:id', async (req, res) => {
  try {
    await pricingCol.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date().toISOString() } }
    )
    res.json({ ok: true })
  } catch (e) {
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
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/admin/areas', async (req, res) => {
  try {
    const doc = {
      ...req.body,
      createdAt: new Date().toISOString(),
    }
    const result = await areasCol.insertOne(doc)
    res.json({ ok: true, _id: result.insertedId })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/admin/areas/:id', async (req, res) => {
  try {
    await areasCol.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date().toISOString() } }
    )
    res.json({ ok: true })
  } catch (e) {
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
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/admin/socials', async (req, res) => {
  try {
    const doc = {
      platform: req.body.platform || 'website',
      url: req.body.url || '',
      order: Number(req.body.order) || 0,
      createdAt: new Date().toISOString(),
    }
    const result = await socialsCol.insertOne(doc)
    res.json({ ok: true, _id: result.insertedId })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/admin/socials/:id', async (req, res) => {
  try {
    await socialsCol.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updatedAt: new Date().toISOString() } }
    )
    res.json({ ok: true })
  } catch (e) {
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
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/admin/settings', async (req, res) => {
  try {
    await settingsCol.updateOne(
      { _id: 'site' },
      { $set: { ...req.body, updatedAt: new Date().toISOString() } },
      { upsert: true }
    )
    res.json({ ok: true })
  } catch (e) {
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
    const totalRefunded = all.filter(x => x.Status === 'refunded').length
    const totalAmount = all
      .filter(x => x.Status === 'refunded' && x.Amount)
      .reduce((sum, x) => sum + (parseFloat(String(x.Amount).replace(/[^0-9.]/g, '')) || 0), 0)
    const pending = all.filter(x => x.Status === 'pending' || !x.Status).length
    res.json({ totalRequests, totalRefunded, totalAmount, pending })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/admin/refunds', async (req, res) => {
  try {
    const doc = {
      ...req.body,
      Status: req.body.Status || 'pending',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }
    const r = await refundsCol.insertOne(doc)
    res.json({ ok: true, _id: r.insertedId })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/admin/refunds/:id', async (req, res) => {
  try {
    await refundsCol.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { ...req.body, updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19) } }
    )
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/admin/refunds/:id', async (req, res) => {
  try {
    await refundsCol.deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})


async function seedPricing() {
  const count = await pricingCol.countDocuments()
  if (count === 0) {
    await pricingCol.insertMany(DEFAULT_PRICING.map(t => ({ ...t, createdAt: new Date().toISOString() })))
    console.log('Seeded default pricing packages')
  } else {
    const first = await pricingCol.findOne()
    if (first && first.name && !first.planName) {
      await pricingCol.drop()
      await pricingCol.insertMany(DEFAULT_PRICING.map(t => ({ ...t, createdAt: new Date().toISOString() })))
      console.log('Replaced old-format pricing with new schema')
    }
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
