const API_URL = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res.json()
}

export const api = {
  getUser: (uid) => request(`/api/users/${uid}`),
  saveUser: (uid, data) => request(`/api/users/${uid}`, { method: 'PUT', body: JSON.stringify(data) }),
  getBookings: (uid) => request(`/api/bookings/${uid}`),
  createBooking: (data) => request('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  deleteBooking: (id) => request(`/api/bookings/${id}`, { method: 'DELETE' }),
  adminStats: () => request('/api/admin/stats'),
  adminUsers: () => request('/api/admin/users'),
  adminBookings: () => request('/api/admin/bookings'),
  adminSetRole: (uid, isAdmin) => request(`/api/admin/users/${uid}/role`, { method: 'PUT', body: JSON.stringify({ isAdmin }) }),
  adminDeleteBooking: (id) => request(`/api/admin/bookings/${id}`, { method: 'DELETE' }),
  adminContacts: () => request('/api/admin/contacts'),
  adminUpdateContact: (id, data) => request(`/api/admin/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteContact: (id) => request(`/api/admin/contacts/${id}`, { method: 'DELETE' }),
  addCourse: (uid, course) => request(`/api/users/${uid}/courses`, { method: 'POST', body: JSON.stringify(course) }),
  removeCourse: (uid, courseId) => request(`/api/users/${uid}/courses/${courseId}`, { method: 'DELETE' }),
  addPayment: (uid, payment) => request(`/api/users/${uid}/payments`, { method: 'POST', body: JSON.stringify(payment) }),
  dedupCourses: (uid) => request(`/api/users/${uid}/dedup-courses`, { method: 'POST' }),
  getCart: (uid) => request(`/api/users/${uid}/cart`),
  addToCart: (uid, course) => request(`/api/users/${uid}/cart`, { method: 'POST', body: JSON.stringify(course) }),
  removeFromCart: (uid, courseId) => request(`/api/users/${uid}/cart/${courseId}`, { method: 'DELETE' }),
  enrollAllCart: (uid) => request(`/api/users/${uid}/cart/checkout`, { method: 'POST' }),
  getMessages: (uid) => request(`/api/users/${uid}/messages`),
  createThread: (uid, subject, text) => request(`/api/users/${uid}/messages`, { method: 'POST', body: JSON.stringify({ subject, text }) }),
  replyThread: (uid, threadId, text) => request(`/api/users/${uid}/messages/${threadId}/reply`, { method: 'POST', body: JSON.stringify({ text }) }),
  markAllRead: (uid) => request(`/api/users/${uid}/messages/read`, { method: 'PUT' }),
  chat: (messages) => request('/api/chat', { method: 'POST', body: JSON.stringify({ messages }) }),
  getConversations: (uid) => request(`/api/users/${uid}/conversations`),
  getConversation: (uid, convId) => request(`/api/users/${uid}/conversations/${convId}`),
  createConversation: (uid, title, messages) => request(`/api/users/${uid}/conversations`, { method: 'POST', body: JSON.stringify({ title, messages }) }),
  updateConversation: (uid, convId, data) => request(`/api/users/${uid}/conversations/${convId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteConversation: (uid, convId) => request(`/api/users/${uid}/conversations/${convId}`, { method: 'DELETE' }),
  getSettings: () => request('/api/settings'),
  adminUpdateSettings: (data) => request('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getPricing: () => request('/api/pricing'),
  adminEnrollments: (params) => request(`/api/admin/enrollments?${new URLSearchParams(params)}`),
  adminEnrollmentsStats: () => request('/api/admin/enrollments/stats'),
  adminAddEnrollment: (data) => request('/api/admin/enrollments', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateEnrollment: (id, data) => request(`/api/admin/enrollments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteEnrollment: (id) => request(`/api/admin/enrollments/${id}`, { method: 'DELETE' }),
  adminRefunds: (params) => request(`/api/admin/refunds?${new URLSearchParams(params)}`),
  adminRefundsStats: () => request('/api/admin/refunds/stats'),
  adminAddRefund: (data) => request('/api/admin/refunds', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateRefund: (id, data) => request(`/api/admin/refunds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteRefund: (id) => request(`/api/admin/refunds/${id}`, { method: 'DELETE' }),
  adminAddPricing: (data) => request('/api/admin/pricing', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdatePricing: (id, data) => request(`/api/admin/pricing/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeletePricing: (id) => request(`/api/admin/pricing/${id}`, { method: 'DELETE' }),
  getAreas: () => request('/api/areas'),
  adminAddArea: (data) => request('/api/admin/areas', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateArea: (id, data) => request(`/api/admin/areas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteArea: (id) => request(`/api/admin/areas/${id}`, { method: 'DELETE' }),
  getSocials: () => request('/api/socials'),
  adminAddSocial: (data) => request('/api/admin/socials', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateSocial: (id, data) => request(`/api/admin/socials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteSocial: (id) => request(`/api/admin/socials/${id}`, { method: 'DELETE' }),
}

export function makeEmbedCode(mapUrl) {
  if (!mapUrl) return ''
  return `<iframe src="${mapUrl}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Google Map"></iframe>`
}
