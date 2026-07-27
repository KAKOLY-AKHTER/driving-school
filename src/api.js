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
}
