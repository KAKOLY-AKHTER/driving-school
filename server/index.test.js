import assert from 'node:assert/strict'
import test from 'node:test'

process.env.VERCEL = '1'
const {
  bookingsForEnrollment,
  packageSlotAllowance,
  splitCheckoutItems,
  validateContinuationSlotCount,
} = await import('./index.js')

const premier = { id: '5', planName: 'PREMIER PLAN' }
const slots = [
  { date: '2026-08-12', time: '07:00 AM - 09:00 AM' },
  { date: '2026-08-13', time: '09:00 AM - 11:00 AM' },
  { date: '2026-08-14', time: '12:00 PM - 02:00 PM' },
]

test('Premier continuation uses only the remaining active-enrollment allowance', () => {
  const initial = {
    ...premier,
    enrolledAt: '2026-08-10T12:00:00.000Z',
    pickupSlots: [slots[0]],
  }
  const firstBooking = {
    ...slots[0],
    timeSlot: slots[0].time,
    status: 'confirmed',
    createdAt: '2026-08-10T11:59:30.000Z',
  }
  const before = packageSlotAllowance(initial, premier, [firstBooking], 2)
  assert.deepEqual(
    { used: before.used, remaining: before.remaining, remainingAfterSelection: before.remainingAfterSelection },
    { used: 1, remaining: 4, remainingAfterSelection: 2 }
  )

  const continuedCourse = { ...initial, pickupSlots: slots }
  const continuedBookings = slots.map((slot, index) => ({
    ...slot,
    timeSlot: slot.time,
    status: 'confirmed',
    createdAt: `2026-08-${String(10 + index).padStart(2, '0')}T12:00:00.000Z`,
  }))
  const after = packageSlotAllowance(continuedCourse, premier, continuedBookings)
  assert.deepEqual(
    { used: after.used, remaining: after.remaining },
    { used: 3, remaining: 2 }
  )
})

test('a cancelled lesson restores one package slot even with stale legacy pickupSlots', () => {
  const course = { ...premier, pickupSlots: slots }
  const linked = slots.map((slot, index) => ({
    date: slot.date,
    timeSlot: slot.time,
    status: index === 1 ? 'cancelled' : 'confirmed',
  }))
  const allowance = packageSlotAllowance(course, premier, linked)
  assert.equal(allowance.used, 2)
  assert.equal(allowance.remaining, 3)
})

test('repurchasing the same plan excludes bookings from the earlier enrollment', () => {
  const current = { ...premier, enrolledAt: '2026-08-20T12:00:00.000Z' }
  const linked = [
    { ...slots[0], timeSlot: slots[0].time, status: 'completed', createdAt: '2026-08-10T12:00:00.000Z' },
    { ...slots[1], timeSlot: slots[1].time, status: 'confirmed', createdAt: '2026-08-20T11:59:30.000Z' },
  ]
  const currentBookings = bookingsForEnrollment(current, linked)
  const allowance = packageSlotAllowance(current, premier, currentBookings)
  assert.equal(allowance.used, 1)
  assert.equal(allowance.remaining, 4)
})

test('mixed checkout charges only new packages and keeps continuation invoice-free', () => {
  const items = [
    { id: '5', price: '$999', continuation: true },
    { id: '2', price: '$210', continuation: false },
  ]
  const { newItems, continuationItems } = splitCheckoutItems(items)
  const amount = newItems.reduce(
    (sum, item) => sum + Number.parseFloat(String(item.price).replace(/[^0-9.]/g, '')),
    0
  )
  assert.equal(newItems.length, 1)
  assert.equal(continuationItems.length, 1)
  assert.equal(amount, 210)
})

test('continuation rejects a selection above the remaining maximum', () => {
  assert.throws(
    () => validateContinuationSlotCount(3, { maximum: 5, used: 3, remaining: 2 }, 'PREMIER PLAN'),
    error => error.status === 409 && /2 booking slots remaining/.test(error.message)
  )
})
