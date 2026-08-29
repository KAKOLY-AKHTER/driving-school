import { auth } from './firebase'

const API_URL = import.meta.env.VITE_API_URL || ''
const REQUEST_TIMEOUT_MS = 20_000
const pathPart = (value) => encodeURIComponent(String(value ?? ''))

export function readableErrorMessage(value, fallback = 'Something went wrong. Please try again.') {
  const visited = new Set()

  const extract = (candidate) => {
    if (typeof candidate === 'string') {
      const message = candidate.trim()
      return message && message !== '[object Object]' ? message : ''
    }
    if (!candidate || typeof candidate !== 'object' || visited.has(candidate)) return ''
    visited.add(candidate)

    for (const key of ['message', 'error_description', 'description', 'detail', 'error']) {
      const message = extract(candidate[key])
      if (message) return message
    }
    return ''
  }

  return extract(value) || fallback
}

async function request(path, options = {}) {
  const { timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const applyAuthHeader = async (forceRefresh = false) => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      headers.delete('Authorization')
      return false
    }
    const token = await currentUser.getIdToken(forceRefresh)
    headers.set('Authorization', `Bearer ${token}`)
    return true
  }
  await applyAuthHeader()

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  if (options.signal) {
    if (options.signal.aborted) controller.abort()
    else options.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  const send = () => fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
    signal: controller.signal,
  })

  let res
  try {
    res = await send()

    // Firebase can retain a previously issued ID token across a browser or API
    // restart. If the API rejects that token, ask Firebase for a fresh one and
    // retry exactly once. Authentication is still fully verified by the API.
    if (res.status === 401 && auth.currentUser) {
      try {
        await applyAuthHeader(true)
        res = await send()
      } catch {
        // Preserve the API's original, user-friendly 401 response when the
        // Firebase session itself can no longer be refreshed.
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The server took too long to respond. Please try again.')
    throw new Error('Unable to reach the server. Check your connection and try again.')
  } finally {
    window.clearTimeout(timeout)
  }
  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : null
  if (!res.ok) {
    const error = new Error(readableErrorMessage(
      data?.error ?? data?.message ?? data,
      `Request failed with status ${res.status}`,
    ))
    error.status = res.status
    error.code = data?.issue || data?.code || ''
    throw error
  }
  return data
}

export const api = {
  recoverAdminAccess: (recoverySecret, newPassword) => request('/api/admin/recover-access', {
    method: 'POST',
    body: JSON.stringify({ recoverySecret, newPassword }),
  }),
  getUser: (uid) => request(`/api/users/${pathPart(uid)}`),
  saveUser: (uid, data) => request(`/api/users/${pathPart(uid)}`, { method: 'PUT', body: JSON.stringify(data) }),
  uploadProfileImage: (uid, file) => request(`/api/users/${pathPart(uid)}/profile-image`, {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
    timeoutMs: 60_000,
  }),
  removeProfileImage: (uid) => request(`/api/users/${pathPart(uid)}/profile-image`, { method: 'DELETE' }),
  getBookings: (uid) => request(`/api/bookings/${pathPart(uid)}`),
  getBookingAvailability: (date) => request(`/api/bookings/availability?date=${encodeURIComponent(date)}`),
  getAvailability: (params) => request(`/api/availability?${new URLSearchParams(params)}`),
  deleteBooking: (id) => request(`/api/bookings/${pathPart(id)}`, { method: 'DELETE' }),
  adminStats: () => request('/api/admin/stats'),
  adminUsers: () => request('/api/admin/users'),
  adminUserDetails: (uid) => request(`/api/admin/users/${pathPart(uid)}/details`),
  adminDeleteUser: (uid) => request(`/api/admin/users/${pathPart(uid)}`, { method: 'DELETE' }),
  adminUpdateUserCourse: (uid, data) => request(`/api/admin/users/${pathPart(uid)}/courses`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteUserCourse: (uid, data) => request(`/api/admin/users/${pathPart(uid)}/courses`, { method: 'DELETE', body: JSON.stringify(data) }),
  adminBookings: () => request('/api/admin/bookings'),
  adminCreatePhoneBooking: (data) => request('/api/admin/bookings', { method: 'POST', body: JSON.stringify(data) }),
  adminAvailability: (params) => request(`/api/admin/availability?${new URLSearchParams(params)}`),
  adminBookingLeadTime: () => request('/api/admin/booking-lead-time'),
  adminUpdateBookingLeadTime: (days) => request('/api/admin/booking-lead-time', { method: 'PUT', body: JSON.stringify({ days }) }),
  adminAddAvailability: (dates, times) => request('/api/admin/availability', { method: 'POST', body: JSON.stringify({ dates, times }) }),
  adminUpdateAvailabilityStatus: (ids, status) => request('/api/admin/availability/status', { method: 'PUT', body: JSON.stringify({ ids, status }) }),
  adminDeleteAvailability: (id) => request(`/api/admin/availability/${pathPart(id)}`, { method: 'DELETE' }),
  adminSetRole: (uid, isAdmin) => request(`/api/admin/users/${pathPart(uid)}/role`, { method: 'PUT', body: JSON.stringify({ isAdmin }) }),
  adminUpdateBookingStatus: (id, status) => request(`/api/admin/bookings/${pathPart(id)}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  adminDeleteBooking: (id) => request(`/api/admin/bookings/${pathPart(id)}`, { method: 'DELETE' }),
  adminGoogleCalendar: () => request('/api/admin/google-calendar'),
  adminConnectGoogleCalendar: (loginHint = '') => request('/api/admin/google-calendar/connect', { method: 'POST', body: JSON.stringify({ loginHint }) }),
  adminTestGoogleCalendar: () => request('/api/admin/google-calendar/test', { method: 'POST' }),
  adminSyncUpcomingGoogleCalendar: () => request('/api/admin/google-calendar/sync-upcoming', { method: 'POST', timeoutMs: 60_000 }),
  adminDisconnectGoogleCalendar: () => request('/api/admin/google-calendar', { method: 'DELETE' }),
  adminContacts: () => request('/api/admin/contacts'),
  adminUpdateContact: (id, data) => request(`/api/admin/contacts/${pathPart(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteContact: (id) => request(`/api/admin/contacts/${pathPart(id)}`, { method: 'DELETE' }),
  addCourse: (uid, course) => request(`/api/users/${pathPart(uid)}/courses`, { method: 'POST', body: JSON.stringify(course) }),
  removeCourse: (uid, courseId, enrollmentId = '') => request(`/api/users/${pathPart(uid)}/courses/${pathPart(courseId)}${enrollmentId ? `?enrollmentId=${pathPart(enrollmentId)}` : ''}`, { method: 'DELETE' }),
  requestCourseRefund: (uid, courseId, reason = '', enrollmentId = '') => request(`/api/users/${pathPart(uid)}/courses/${pathPart(courseId)}/refund`, { method: 'POST', body: JSON.stringify({ reason, enrollmentId }) }),
  saveCourseProgress: (uid, enrollmentId, completedModules) => request(`/api/users/${pathPart(uid)}/courses/${pathPart(enrollmentId)}/progress`, { method: 'PUT', body: JSON.stringify({ completedModules }) }),
  addPayment: (uid, payment) => request(`/api/users/${pathPart(uid)}/payments`, { method: 'POST', body: JSON.stringify(payment) }),
  dedupCourses: (uid) => request(`/api/users/${pathPart(uid)}/dedup-courses`, { method: 'POST' }),
  getCart: (uid) => request(`/api/users/${pathPart(uid)}/cart`),
  addToCart: (uid, course) => request(`/api/users/${pathPart(uid)}/cart`, { method: 'POST', body: JSON.stringify(course) }),
  removeFromCart: (uid, courseId) => request(`/api/users/${pathPart(uid)}/cart/${pathPart(courseId)}`, { method: 'DELETE' }),
  enrollAllCart: (uid) => request(`/api/users/${pathPart(uid)}/cart/checkout`, { method: 'POST' }),
  getPayPalConfig: () => request('/api/paypal/config'),
  validateCoupon: (uid, code) => request(`/api/users/${pathPart(uid)}/coupons/validate`, { method: 'POST', body: JSON.stringify({ code }), timeoutMs: 35_000 }),
  createPayPalOrder: (uid, couponCode = '') => request(`/api/users/${pathPart(uid)}/paypal/orders`, { method: 'POST', body: JSON.stringify({ couponCode }), timeoutMs: 35_000 }),
  capturePayPalOrder: (uid, orderId) => request(`/api/users/${pathPart(uid)}/paypal/orders/${pathPart(orderId)}/capture`, { method: 'POST', timeoutMs: 50_000 }),
  getMessages: (uid) => request(`/api/users/${pathPart(uid)}/messages`),
  createThread: (uid, subject, text) => request(`/api/users/${pathPart(uid)}/messages`, { method: 'POST', body: JSON.stringify({ subject, text }) }),
  replyThread: (uid, threadId, text) => request(`/api/users/${pathPart(uid)}/messages/${pathPart(threadId)}/reply`, { method: 'POST', body: JSON.stringify({ text }) }),
  markAllRead: (uid) => request(`/api/users/${pathPart(uid)}/messages/read`, { method: 'PUT' }),
  markThreadRead: (uid, threadId) => request(`/api/users/${pathPart(uid)}/messages/${pathPart(threadId)}/read`, { method: 'PUT' }),
  adminSupport: (params = {}) => request(`/api/admin/support?${new URLSearchParams(params)}`),
  adminReplySupport: (uid, threadId, text) => request(`/api/admin/support/${pathPart(uid)}/${pathPart(threadId)}/reply`, { method: 'POST', body: JSON.stringify({ text }) }),
  adminReadSupport: (uid, threadId) => request(`/api/admin/support/${pathPart(uid)}/${pathPart(threadId)}/read`, { method: 'PUT' }),
  adminUpdateSupportStatus: (uid, threadId, status) => request(`/api/admin/support/${pathPart(uid)}/${pathPart(threadId)}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  chat: (messages) => request('/api/chat', { method: 'POST', body: JSON.stringify({ messages }) }),
  getConversations: (uid) => request(`/api/users/${pathPart(uid)}/conversations`),
  getConversation: (uid, convId) => request(`/api/users/${pathPart(uid)}/conversations/${pathPart(convId)}`),
  createConversation: (uid, title, messages) => request(`/api/users/${pathPart(uid)}/conversations`, { method: 'POST', body: JSON.stringify({ title, messages }) }),
  updateConversation: (uid, convId, data) => request(`/api/users/${pathPart(uid)}/conversations/${pathPart(convId)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConversation: (uid, convId) => request(`/api/users/${pathPart(uid)}/conversations/${pathPart(convId)}`, { method: 'DELETE' }),
  getSettings: () => request('/api/settings'),
  adminUpdateSettings: (data) => request('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getPricing: () => request('/api/pricing'),
  adminEnrollments: (params) => request(`/api/admin/enrollments?${new URLSearchParams(params)}`),
  adminEnrollmentsStats: () => request('/api/admin/enrollments/stats'),
  adminAddEnrollment: (data) => request('/api/admin/enrollments', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateEnrollment: (id, data) => request(`/api/admin/enrollments/${pathPart(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteEnrollment: (id) => request(`/api/admin/enrollments/${pathPart(id)}`, { method: 'DELETE' }),
  adminRefunds: (params) => request(`/api/admin/refunds?${new URLSearchParams(params)}`),
  adminRefundsStats: () => request('/api/admin/refunds/stats'),
  adminAddRefund: (data) => request('/api/admin/refunds', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateRefund: (id, data) => request(`/api/admin/refunds/${pathPart(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteRefund: (id) => request(`/api/admin/refunds/${pathPart(id)}`, { method: 'DELETE' }),
  adminAddPricing: (data) => request('/api/admin/pricing', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdatePricing: (id, data) => request(`/api/admin/pricing/${pathPart(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeletePricing: (id, confirmedEnrollmentWarning = false) => request(`/api/admin/pricing/${pathPart(id)}${confirmedEnrollmentWarning ? '?confirmEnrolled=true' : ''}`, { method: 'DELETE' }),
  adminCoupons: () => request('/api/admin/coupons'),
  adminAddCoupon: (data) => request('/api/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateCoupon: (id, data) => request(`/api/admin/coupons/${pathPart(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteCoupon: (id, confirmedUsageWarning = false) => request(`/api/admin/coupons/${pathPart(id)}${confirmedUsageWarning ? '?confirmUsed=true' : ''}`, { method: 'DELETE' }),
  getLocations: () => request('/api/locations'),
  adminAddLocation: (data) => request('/api/admin/locations', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateLocation: (id, data) => request(`/api/admin/locations/${pathPart(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminLocationUsage: (id) => request(`/api/admin/locations/${pathPart(id)}/usage`),
  adminDeleteLocation: (id, confirmedInUse = false) => request(`/api/admin/locations/${pathPart(id)}${confirmedInUse ? '?confirmInUse=true' : ''}`, { method: 'DELETE' }),
  getReviews: () => request('/api/reviews'),
  adminReviews: () => request('/api/admin/reviews'),
  adminAddReview: (data) => request('/api/admin/reviews', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateReview: (id, data) => request(`/api/admin/reviews/${pathPart(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteReview: (id) => request(`/api/admin/reviews/${pathPart(id)}`, { method: 'DELETE' }),
  adminUploadReviewImage: (file) => request('/api/admin/review-images', {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
    timeoutMs: 60_000,
  }),
  getBlogs: (params = {}) => request(`/api/blogs?${new URLSearchParams(params)}`),
  getBlog: (slug) => request(`/api/blogs/${pathPart(slug)}`),
  adminBlogs: () => request('/api/admin/blogs'),
  adminUploadBlogImage: (file) => request('/api/admin/blog-images', {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
    timeoutMs: 60_000,
  }),
  adminAddBlog: (data) => request('/api/admin/blogs', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateBlog: (id, data) => request(`/api/admin/blogs/${pathPart(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteBlog: (id) => request(`/api/admin/blogs/${pathPart(id)}`, { method: 'DELETE' }),
  getAreas: () => request('/api/areas'),
  adminAddArea: (data) => request('/api/admin/areas', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateArea: (id, data) => request(`/api/admin/areas/${pathPart(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteArea: (id) => request(`/api/admin/areas/${pathPart(id)}`, { method: 'DELETE' }),
  getSocials: () => request('/api/socials'),
  adminAddSocial: (data) => request('/api/admin/socials', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateSocial: (id, data) => request(`/api/admin/socials/${pathPart(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteSocial: (id) => request(`/api/admin/socials/${pathPart(id)}`, { method: 'DELETE' }),
}

export function makeEmbedCode(mapUrl) {
  if (!mapUrl) return ''
  return `<iframe src="${mapUrl}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Google Map"></iframe>`
}
