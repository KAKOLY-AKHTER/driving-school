const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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
  addCourse: (uid, course) => request(`/api/users/${uid}/courses`, { method: 'POST', body: JSON.stringify(course) }),
  removeCourse: (uid, courseId) => request(`/api/users/${uid}/courses/${courseId}`, { method: 'DELETE' }),
  addPayment: (uid, payment) => request(`/api/users/${uid}/payments`, { method: 'POST', body: JSON.stringify(payment) }),
  dedupCourses: (uid) => request(`/api/users/${uid}/dedup-courses`, { method: 'POST' }),
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
}
