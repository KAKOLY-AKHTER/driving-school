import 'dotenv/config'
import dns from 'dns'
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import Groq from 'groq-sdk'

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001
const MONGO_URI = process.env.MONGO_URI
const DB_NAME = 'driving_school'

let db, usersCol, bookingsCol, contactCol

async function connectDB() {
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  db = client.db(DB_NAME)
  usersCol = db.collection('users')
  bookingsCol = db.collection('bookings')
  contactCol = db.collection('contact')
  await usersCol.createIndex({ uid: 1 }, { unique: true })
  await bookingsCol.createIndex({ userId: 1, date: 1 })
  console.log('MongoDB connected')
}

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.post('/api/contact', async (req, res) => {
  try {
    const { firstName, lastName, phone, email, comments } = req.body
    if (!firstName || !lastName || !phone || !email || !comments) {
      return res.status(400).json({ error: 'All fields required' })
    }
    await contactCol.insertOne({ ...req.body, createdAt: new Date().toISOString() })
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

app.post('/api/bookings', async (req, res) => {
  try {
    const booking = {
      userId: req.body.userId,
      date: req.body.date,
      timeSlot: req.body.timeSlot,
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

app.post('/api/chat', async (req, res) => {
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
    const convs = (user?.conversations || []).map(({ messages, ...rest }) => rest)
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

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`API running on port ${PORT}`))
  })
  .catch((e) => {
    console.error('MongoDB connection failed:', e.message)
    process.exit(1)
  })
