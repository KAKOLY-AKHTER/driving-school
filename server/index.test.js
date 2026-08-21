import assert from 'node:assert/strict'
import test from 'node:test'

process.env.VERCEL = '1'
const {
  DEFAULT_LOCATIONS,
  bookingsForEnrollment,
  pricingForBookingLocation,
  sanitizeLocation,
  sanitizePricing,
  sanitizeReview,
  sanitizeBlog,
  packageSlotAllowance,
  splitCheckoutItems,
  validateContinuationSlotCount,
  validateAvailabilitySlot,
} = await import('./index.js')

test('customer reviews require clear text and constrain rating, order, and visibility', () => {
  assert.deepEqual(sanitizeReview({ name: '  Jane Doe ', text: '  Excellent instructor. ', rating: 9, order: -5, published: false }), {
    name: 'Jane Doe',
    text: 'Excellent instructor.',
    rating: 5,
    order: 0,
    published: false,
  })
  assert.throws(
    () => sanitizeReview({ name: '', text: 'Helpful', rating: 5 }),
    error => error.status === 400 && /name and review text/i.test(error.message)
  )
})

test('blog posts sanitize publish data and require secure images', () => {
  const post = sanitizeBlog({
    title: '  Safe Driving Basics  ',
    content: 'Check your mirrors before every lane change.',
    category: '  Driving Tips  ',
    author: '  School Team  ',
    imageUrl: 'https://example.com/driving.jpg',
    published: true,
    featured: true,
    order: -10,
  })

  assert.equal(post.title, 'Safe Driving Basics')
  assert.equal(post.category, 'Driving Tips')
  assert.equal(post.author, 'School Team')
  assert.equal(post.excerpt, 'Check your mirrors before every lane change.')
  assert.equal(post.readingMinutes, 1)
  assert.equal(post.order, 0)
  assert.equal(post.published, true)
  assert.equal(post.featured, true)
  assert.throws(
    () => sanitizeBlog({ title: 'Unsafe image', content: 'Text', imageUrl: 'http://example.com/image.jpg' }),
    error => error.status === 400 && /secure HTTPS URL/i.test(error.message)
  )
})

test('admin availability accepts only valid future dates and the five public lesson times', () => {
  assert.deepEqual(validateAvailabilitySlot('2099-12-20', '07:00 AM - 09:00 AM', { allowToday: false }), {
    date: '2099-12-20',
    timeSlot: '07:00 AM - 09:00 AM',
  })
  assert.throws(
    () => validateAvailabilitySlot('2099-02-31', '07:00 AM - 09:00 AM'),
    error => error.status === 400 && /valid booking date and time/i.test(error.message)
  )
  assert.throws(
    () => validateAvailabilitySlot('2099-12-20', '11:00 AM - 01:00 PM'),
    error => error.status === 400 && /five supported lesson times/i.test(error.message)
  )
})

test('booking locations match the approved Near and Long city groups', () => {
  const nearNames = DEFAULT_LOCATIONS
    .filter(location => location.distance === 'Near')
    .map(location => location.name)
  const longNames = DEFAULT_LOCATIONS
    .filter(location => location.distance === 'Long')
    .map(location => location.name)

  assert.deepEqual(nearNames, [
    'Fremont', 'Newark', 'Hayward', 'Union City', 'San Lorenzo', 'San Leandro',
    'Castro Valley', 'Ashland', 'Oakland',
  ])
  assert.equal(longNames.length, 22)
  assert.equal(DEFAULT_LOCATIONS.length, 31)
  assert.equal(new Set(DEFAULT_LOCATIONS.map(location => location.name.toLowerCase())).size, 31)
})

test('booking location input is normalized and constrained to Near or Long', () => {
  assert.deepEqual(
    sanitizeLocation({ name: '  Redwood   CITY ', distance: 'long', order: 10 }),
    { name: 'Redwood CITY', key: 'redwood city', distance: 'Long', order: 10 }
  )
  assert.throws(
    () => sanitizeLocation({ name: 'Fremont', distance: 'medium' }),
    error => error.status === 400 && /Near or Long/.test(error.message)
  )
})

test('Near and Long locations select the matching server-authoritative plan price', () => {
  const tier = { planName: 'BASIC PLAN', planPrice: '$210', planPriceTwo: '$275' }
  assert.deepEqual(pricingForBookingLocation(tier, { distance: 'Near' }), {
    amount: 210,
    label: '$210',
    distance: 'Near',
  })
  assert.deepEqual(pricingForBookingLocation(tier, { distance: 'Long' }), {
    amount: 275,
    label: '$275',
    distance: 'Long',
  })
})

test('admin pricing accepts dollar values and rejects malformed prices', () => {
  const plan = sanitizePricing({
    id: '2',
    planName: 'BASIC PLAN',
    planPrice: ' $210.00 ',
    planPriceTwo: '275.50',
    options: [],
  })
  assert.equal(plan.planPrice, '$210')
  assert.equal(plan.planPriceTwo, '$275.50')
  assert.throws(
    () => sanitizePricing({ id: '2', planName: 'BASIC PLAN', planPrice: 'free', planPriceTwo: '$275' }),
    error => error.status === 400 && /valid dollar amounts/.test(error.message)
  )
})

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
