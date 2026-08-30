import assert from 'node:assert/strict'
import test from 'node:test'

process.env.VERCEL = '1'
const {
  DEFAULT_LOCATIONS,
  adminAvailabilityStatus,
  adminUserProfileDetails,
  canonicalAdminBookingStatus,
  cloudinarySignature,
  bookingsForEnrollment,
  checkoutFingerprint,
  couponCheckoutFingerprint,
  couponDiscountQuote,
  escapeEmailHtml,
  findPayPalPaymentForRefund,
  decryptCalendarToken,
  detectBlogImageType,
  encryptCalendarToken,
  googleCalendarEventTimes,
  isFinalRefundStatus,
  moneyString,
  payableCheckoutAmount,
  pricingForBookingLocation,
  refundedPaymentCents,
  sanitizeLocation,
  sanitizePricing,
  sanitizeReview,
  sanitizeBlog,
  sanitizeCoupon,
  packageSlotAllowance,
  pickupSlotsFromCourse,
  splitCheckoutItems,
  validateContinuationSlotCount,
  validateAvailabilitySlot,
  validateClosedAvailabilityDates,
  validateAdminBookingStatusChange,
} = await import('./index.js')

test('Cloudinary request signatures use stable sorted upload parameters', () => {
  assert.equal(
    cloudinarySignature({
      unique_filename: 'false',
      timestamp: 1787846400,
      public_id: 'a-precision-driving-school/blog/blog-test',
      overwrite: 'false',
    }, 'secret-value'),
    '82f32c16c24d7dcb7afa4f60819db35e84af0243'
  )
})

test('admin user details expose profile fields without passwords or private account data', () => {
  const profile = adminUserProfileDetails({
    uid: 'student-1',
    firstName: 'Ava',
    email: 'ava@example.com',
    phone: '+1 555 0100',
    address: '123 Main Street',
    password: 'never-return-this',
    refreshToken: 'never-return-this-either',
    messages: [{ text: 'private support content' }],
    payments: [{ providerCaptureId: 'CAPTURE' }],
  })
  assert.deepEqual(profile, {
    uid: 'student-1',
    firstName: 'Ava',
    email: 'ava@example.com',
    phone: '+1 555 0100',
    address: '123 Main Street',
  })
})

test('coupon validation normalizes codes and accepts fixed or percentage discounts', () => {
  assert.deepEqual(
    sanitizeCoupon({ code: ' save-15 ', discountType: 'fixed', discountValue: '15', startsAt: '', expiresAt: '2026-12-31', isActive: true }),
    { code: 'SAVE-15', discountType: 'fixed', discountValue: 15, startsAt: '', expiresAt: '2026-12-31', isActive: true }
  )
  assert.throws(() => sanitizeCoupon({ code: 'x', discountType: 'percentage', discountValue: 10 }), /3–32 characters/)
  assert.throws(() => sanitizeCoupon({ code: 'SAVE10', discountType: 'percentage', discountValue: 101 }), /between 0.01 and 100/)
})

test('coupon quotes calculate fixed and percentage savings without creating a zero PayPal amount', () => {
  const fixed = couponDiscountQuote(210, { code: 'SAVE15', discountType: 'fixed', discountValue: 15, isActive: true }, '2026-08-25')
  assert.deepEqual(fixed, { subtotal: 210, discount: 15, total: 195, coupon: { code: 'SAVE15', discountType: 'fixed', discountValue: 15 } })
  const percentage = couponDiscountQuote(599, { code: 'SUMMER10', discountType: 'percentage', discountValue: 10, isActive: true }, '2026-08-25')
  assert.equal(percentage.discount, 59.9)
  assert.equal(percentage.total, 539.1)
  const full = couponDiscountQuote(20, { code: 'FREE100', discountType: 'percentage', discountValue: 100, isActive: true }, '2026-08-25')
  assert.equal(full.discount, 19.99)
  assert.equal(full.total, 0.01)
})

test('paused, scheduled, and expired coupons cannot be used', () => {
  assert.throws(() => couponDiscountQuote(100, { code: 'PAUSED', discountType: 'fixed', discountValue: 10, isActive: false }, '2026-08-25'), /paused/)
  assert.throws(() => couponDiscountQuote(100, { code: 'LATER', discountType: 'fixed', discountValue: 10, isActive: true, startsAt: '2026-08-26' }, '2026-08-25'), /starts on/)
  assert.throws(() => couponDiscountQuote(100, { code: 'OLD', discountType: 'fixed', discountValue: 10, isActive: true, expiresAt: '2026-08-24' }, '2026-08-25'), /expired/)
})

test('coupon changes the checkout fingerprint while identical quotes stay stable', () => {
  const base = 'cart-fingerprint'
  const quote = { discount: 15, total: 195, coupon: { code: 'SAVE15' } }
  assert.equal(couponCheckoutFingerprint(base, null), base)
  assert.equal(couponCheckoutFingerprint(base, quote), couponCheckoutFingerprint(base, quote))
  assert.notEqual(couponCheckoutFingerprint(base, quote), couponCheckoutFingerprint(base, { discount: 10, total: 200, coupon: { code: 'SAVE10' } }))
})

test('Google Calendar refresh tokens are encrypted and authenticated at rest', () => {
  const secret = 'a-production-only-secret-with-more-than-32-characters'
  const encrypted = encryptCalendarToken('refresh-token-value', secret)
  assert.notEqual(encrypted.ciphertext, 'refresh-token-value')
  assert.equal(decryptCalendarToken(encrypted, secret), 'refresh-token-value')
  assert.throws(() => decryptCalendarToken({ ...encrypted, ciphertext: `${encrypted.ciphertext.slice(0, -2)}AA` }, secret))
})

test('Google Calendar lesson times preserve California wall time and duration', () => {
  assert.deepEqual(
    googleCalendarEventTimes({ date: '2026-09-10', timeSlot: '09:30 AM - 11:30 AM' }),
    {
      start: { dateTime: '2026-09-10T09:30:00', timeZone: 'America/Los_Angeles' },
      end: { dateTime: '2026-09-10T11:30:00', timeZone: 'America/Los_Angeles' },
    }
  )
  assert.equal(
    googleCalendarEventTimes({ date: '2026-09-10', timeSlot: '04:00 PM', hours: 2 }).end.dateTime,
    '2026-09-10T18:00:00'
  )
})

test('contact email content escapes untrusted HTML', () => {
  assert.equal(
    escapeEmailHtml(`<script>alert("x")</script> & 'test'`),
    '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#039;test&#039;'
  )
})

test('PayPal quote uses server cents and excludes free continuation items', () => {
  const items = [
    { id: '5', chargeAmount: 999, continuation: false },
    { id: '2', chargeAmount: 210, continuation: true },
    { id: '6', chargeAmount: 225.555, continuation: false },
  ]
  assert.equal(moneyString(payableCheckoutAmount(items)), '1224.56')
})

test('PayPal cart fingerprint is stable across plan and slot ordering', () => {
  const first = {
    id: '5',
    enrollmentId: '',
    title: 'PREMIER PLAN',
    city: 'Fremont',
    cityDistance: 'Near',
    continuation: false,
    chargeAmount: 999,
    pickupSlots: [
      { date: '2026-09-02', time: '09:00 AM - 11:00 AM' },
      { date: '2026-09-01', time: '07:00 AM - 09:00 AM' },
    ],
  }
  const second = { id: '2', title: 'BASIC PLAN', city: 'Newark', chargeAmount: 210, pickupSlots: [] }
  const reorderedFirst = { ...first, pickupSlots: [...first.pickupSlots].reverse() }
  assert.equal(checkoutFingerprint([first, second]), checkoutFingerprint([second, reorderedFirst]))
  assert.notEqual(checkoutFingerprint([first]), checkoutFingerprint([{ ...first, chargeAmount: 998 }]))
})

test('PayPal refund matching is enrollment-scoped and tracks previously refunded cents', () => {
  const user = {
    payments: [{
      status: 'Paid',
      amount: 999,
      refundedAmount: 200,
      provider: 'PayPal',
      providerCaptureId: 'CAPTURE-123',
      enrollmentIds: ['enrollment-premier'],
      courseBreakdown: [{ enrollmentId: 'enrollment-premier', courseId: '5', title: 'PREMIER PLAN', amount: 999 }],
    }],
  }
  const refund = { Enrollment_ID: 'enrollment-premier', Course_ID: '5', Course_Name: 'PREMIER PLAN', Amount: '$999' }
  const match = findPayPalPaymentForRefund(user, refund)

  assert.equal(match.index, 0)
  assert.equal(match.payment.providerCaptureId, 'CAPTURE-123')
  assert.equal(refundedPaymentCents(match.payment), 20000)
  assert.equal(
    findPayPalPaymentForRefund(user, { ...refund, Enrollment_ID: 'another-enrollment' }),
    null
  )
})

test('refunded and denied refund decisions are terminal', () => {
  assert.equal(isFinalRefundStatus('Refunded'), true)
  assert.equal(isFinalRefundStatus(' denied '), true)
  assert.equal(isFinalRefundStatus('pending'), false)
})

test('customer reviews require clear text and constrain rating, order, and visibility', () => {
  assert.deepEqual(sanitizeReview({ name: '  Jane Doe ', text: '  Excellent instructor. ', rating: 9, order: -5, published: false }), {
    name: 'Jane Doe',
    text: 'Excellent instructor.',
    rating: 5,
    order: 0,
    published: false,
    imageUrl: '',
    imagePublicId: '',
  })
  assert.throws(
    () => sanitizeReview({ name: '', text: 'Helpful', rating: 5 }),
    error => error.status === 400 && /name and review text/i.test(error.message)
  )
  assert.deepEqual(sanitizeReview({
    name: 'Jane Doe',
    text: 'Excellent instructor.',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/reviewer.jpg',
    imagePublicId: 'a-precision-driving-school/reviews/review-123',
  }).imagePublicId, 'a-precision-driving-school/reviews/review-123')
  assert.throws(
    () => sanitizeReview({ name: 'Jane Doe', text: 'Helpful', imageUrl: 'https://example.com/reviewer.jpg', imagePublicId: 'a-precision-driving-school/reviews/review-123' }),
    error => error.status === 400 && /secure image uploader/i.test(error.message)
  )
})

test('blog posts sanitize publish data and require secure images', () => {
  const post = sanitizeBlog({
    title: '  Safe Driving Basics  ',
    content: 'Check your mirrors before every lane change.',
    category: '  Driving Tips  ',
    author: '  School Team  ',
    imageUrl: 'https://example.com/driving.jpg',
    imagePublicId: 'a-precision-driving-school/blog/blog-123',
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
  assert.equal(post.imagePublicId, 'a-precision-driving-school/blog/blog-123')
  assert.throws(
    () => sanitizeBlog({ title: 'Unsafe image', content: 'Text', imageUrl: 'http://example.com/image.jpg' }),
    error => error.status === 400 && /secure HTTPS URL/i.test(error.message)
  )
  assert.throws(
    () => sanitizeBlog({ title: 'Unsafe image id', content: 'Text', imagePublicId: 'another-folder/image' }),
    error => error.status === 400 && /image reference is invalid/i.test(error.message)
  )

  const richPost = sanitizeBlog({
    title: 'Formatted article',
    content: '<h2 style="text-align: center" onclick="alert(1)">Safe heading</h2><p><strong>Useful</strong> advice <a href="javascript:alert(1)">here</a>.</p><script>alert(1)</script>',
  })
  assert.match(richPost.content, /<h2 style="text-align:center">Safe heading<\/h2>/)
  assert.match(richPost.content, /<strong>Useful<\/strong>/)
  assert.doesNotMatch(richPost.content, /onclick|javascript:|<script/i)
  assert.equal(richPost.excerpt, 'Safe heading Useful advice here.')

  assert.throws(
    () => sanitizeBlog({ title: 'Empty formatted article', content: '<p><br></p>' }),
    error => error.status === 400 && /title and content are required/i.test(error.message)
  )
})

test('blog image uploads accept real JPG, PNG, and WebP signatures only', () => {
  assert.equal(detectBlogImageType(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])), 'image/jpeg')
  assert.equal(detectBlogImageType(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])), 'image/png')
  assert.equal(detectBlogImageType(Buffer.from('RIFF0000WEBP', 'ascii')), 'image/webp')
  assert.equal(detectBlogImageType(Buffer.from('<script>alert(1)</script>')), '')
})

test('admin availability accepts only valid future dates and the five public lesson times', () => {
  const expectedTimes = [
    '07:00 AM - 09:00 AM',
    '09:30 AM - 11:30 AM',
    '12:00 PM - 02:00 PM',
    '02:30 PM - 04:30 PM',
    '05:00 PM - 07:00 PM',
  ]
  for (const timeSlot of expectedTimes) {
    assert.deepEqual(validateAvailabilitySlot('2099-12-20', timeSlot, { allowToday: false }), {
      date: '2099-12-20',
      timeSlot,
    })
  }
  assert.throws(
    () => validateAvailabilitySlot('2099-02-31', '07:00 AM - 09:00 AM'),
    error => error.status === 400 && /valid booking date and time/i.test(error.message)
  )
  assert.throws(
    () => validateAvailabilitySlot('2099-12-20', '09:00 AM - 11:00 AM'),
    error => error.status === 400 && /five supported lesson times/i.test(error.message)
  )
})

test('closed availability dates are future-only, unique, and sorted', () => {
  assert.deepEqual(
    validateClosedAvailabilityDates(['2099-12-22', '2099-12-20', '2099-12-22'], '2099-12-19'),
    ['2099-12-20', '2099-12-22']
  )
  assert.throws(
    () => validateClosedAvailabilityDates(['2099-12-19'], '2099-12-19'),
    /Only future dates/
  )
  assert.throws(
    () => validateClosedAvailabilityDates(['2099-02-31'], '2099-01-01'),
    /valid calendar date/
  )
})

test('admin availability identifies future rows from the old no-break schedule', () => {
  assert.equal(adminAvailabilityStatus({ date: '2099-12-20', time: '09:00 AM - 11:00 AM', status: 'available' }, '2099-12-19'), 'legacy')
  assert.equal(adminAvailabilityStatus({ date: '2099-12-20', time: '09:00 AM - 11:00 AM', status: 'booked' }, '2099-12-19'), 'booked')
})

test('admin availability marks non-future open slots expired without hiding booked status', () => {
  const today = '2026-08-24'
  assert.equal(adminAvailabilityStatus({ date: '2026-08-23', status: 'available' }, today), 'expired')
  assert.equal(adminAvailabilityStatus({ date: today, status: 'available' }, today), 'expired')
  assert.equal(adminAvailabilityStatus({ date: '2026-08-25', status: 'available' }, today), 'available')
  assert.equal(adminAvailabilityStatus({ date: '2026-08-23', status: 'booked' }, today), 'booked')
})

test('admin bookings expose only the four canonical dashboard statuses', () => {
  const today = '2026-08-24'
  assert.equal(canonicalAdminBookingStatus({ date: '2026-08-25', status: 'booked' }, today), 'scheduled')
  assert.equal(canonicalAdminBookingStatus({ date: '2026-08-25', status: 'confirmed' }, today), 'confirmed')
  assert.equal(canonicalAdminBookingStatus({ date: '2026-08-23', status: 'confirmed' }, today), 'completed')
  assert.equal(canonicalAdminBookingStatus({ date: '2026-08-25', status: 'canceled' }, today), 'cancelled')
})

test('admin booking status changes protect final and future lesson states', () => {
  const today = '2026-08-27'
  assert.equal(validateAdminBookingStatusChange({ date: '2026-08-28', status: 'scheduled' }, 'confirmed', today), 'confirmed')
  assert.equal(validateAdminBookingStatusChange({ date: today, status: 'confirmed' }, 'completed', today), 'completed')
  assert.equal(validateAdminBookingStatusChange({ date: '2026-08-28', status: 'confirmed' }, 'cancelled', today), 'cancelled')
  assert.equal(validateAdminBookingStatusChange({ date: '2026-08-26', status: 'completed' }, 'cancelled', today), 'cancelled')
  assert.equal(validateAdminBookingStatusChange({ date: today, status: 'completed' }, 'confirmed', today), 'confirmed')
  assert.throws(() => validateAdminBookingStatusChange({ date: '2026-08-28', status: 'confirmed' }, 'completed', today), /future lesson/i)
  assert.throws(() => validateAdminBookingStatusChange({ date: '2026-08-26', status: 'confirmed' }, 'confirmed', today), /past lesson/i)
  assert.throws(() => validateAdminBookingStatusChange({ date: '2026-08-28', status: 'cancelled' }, 'confirmed', today), /cancelled booking is final/i)
})

test('only the two DMV rental plans accept exact appointment times', () => {
  const selection = { pickupSlots: [{ date: '2099-12-20', time: '09:15 AM' }] }

  assert.deepEqual(
    pickupSlotsFromCourse(selection, { id: '6', planName: 'DMV Drive Test Car Rental' }),
    [{ date: '2099-12-20', timeSlot: '09:15 AM' }]
  )
  assert.deepEqual(
    pickupSlotsFromCourse(selection, { id: '7', planName: 'DMV Drive Test Car Rental.' }),
    [{ date: '2099-12-20', timeSlot: '09:15 AM' }]
  )
  assert.throws(
    () => pickupSlotsFromCourse(selection, { id: '2', planName: 'BASIC PLAN' }),
    error => error.status === 400 && /valid booking date and time/i.test(error.message)
  )
  assert.throws(
    () => pickupSlotsFromCourse(
      { pickupSlots: [{ date: '2099-12-20', time: '09:10 AM' }] },
      { id: '6', planName: 'DMV Drive Test Car Rental' }
    ),
    error => error.status === 400 && /valid booking date and time/i.test(error.message)
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
    sanitizeLocation({ name: '  Redwood   CITY ', zipCode: '94063', distance: 'long', order: 10 }),
    { name: 'Redwood City', key: 'redwood city', zipCode: '94063', distance: 'Long', order: 10 }
  )
  assert.equal(sanitizeLocation({ name: 'REDWOOD city', distance: 'Near' }).key, 'redwood city')
  assert.equal(sanitizeLocation({ name: 'Fremont', zipCode: '94536-1234', distance: 'Near' }).zipCode, '94536-1234')
  assert.throws(
    () => sanitizeLocation({ name: 'Fremont', zipCode: '9453', distance: 'Near' }),
    error => error.status === 400 && /ZIP code/.test(error.message)
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
  const autoIdPlan = sanitizePricing({ planName: 'AUTO ID PLAN', planPrice: '$210', planPriceTwo: '$275', options: [] })
  assert.match(autoIdPlan.id, /^plan-[a-f0-9]{24}$/)
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
