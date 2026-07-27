import 'dotenv/config'
import dns from 'dns'
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3001
const MONGO_URI = process.env.MONGO_URI
const DB_NAME = 'driving_school'

let db, usersCol, bookingsCol

async function connectDB() {
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  db = client.db(DB_NAME)
  usersCol = db.collection('users')
  bookingsCol = db.collection('bookings')
  await usersCol.createIndex({ uid: 1 }, { unique: true })
  await bookingsCol.createIndex({ userId: 1, date: 1 })
  console.log('MongoDB connected')
}

app.get('/api/health', (req, res) => res.json({ ok: true }))

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

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`API running on port ${PORT}`))
  })
  .catch((e) => {
    console.error('MongoDB connection failed:', e.message)
    process.exit(1)
  })
