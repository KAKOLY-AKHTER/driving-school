import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

const COURSE_MAP = {
  '1': 'Online Driver Ed',
  '7': 'Duplicate Certificate 400C',
  '2': 'Basic BTW (Package A - 2h)',
  '12': 'Basic BTW (Package D - 4h)',
  '3': 'Essential BTW (Package B - 6h)',
  '8': 'Ideal BTW + Online (Package C - 6h)',
  '4': 'Premier BTW (Package E - 10h)',
}

const TIME_SLOT_MAP = {
  slot1: 'Morning 1 (9-11 AM)',
  slot2: 'Morning 2 (11 AM-1 PM)',
  slot3: 'Afternoon 1 (2-4 PM)',
  slot4: 'Afternoon 2 (4-6 PM)',
}

const SVG = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>,
  users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>,
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  close: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
}

export default function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({ totalUsers: 0, totalBookings: 0, activeEnrollments: 0 })
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [bookingSearch, setBookingSearch] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [courseModal, setCourseModal] = useState(null)
  const [selectedCourseId, setSelectedCourseId] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [s, u, b] = await Promise.all([
          api.adminStats(),
          api.adminUsers(),
          api.adminBookings(),
        ])
        setStats(s)
        setUsers(u)
        setBookings(b)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const handleLogout = async () => { await signOut(auth); navigate('/') }

  const handleToggleAdmin = async (uid, currentIsAdmin) => {
    try {
      await api.adminSetRole(uid, !currentIsAdmin)
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isAdmin: !currentIsAdmin } : u))
      setMsg(`User ${!currentIsAdmin ? 'promoted to' : 'removed from'} admin.`)
      setTimeout(() => setMsg(''), 2000)
    } catch {
      setMsg('Failed to update role.')
      setTimeout(() => setMsg(''), 2000)
    }
  }

  const handleDeleteBooking = async (id) => {
    try {
      await api.adminDeleteBooking(id)
      setBookings(prev => prev.filter(b => b._id !== id))
      setStats(prev => ({ ...prev, totalBookings: prev.totalBookings - 1 }))
      setMsg('Booking deleted.')
      setTimeout(() => setMsg(''), 2000)
    } catch {
      setMsg('Failed to delete booking.')
      setTimeout(() => setMsg(''), 2000)
    }
  }

  const handleAddCourse = async (uid) => {
    if (!selectedCourseId) return
    const courseName = COURSE_MAP[selectedCourseId] || selectedCourseId
    const course = { id: selectedCourseId, title: courseName, status: 'Enrolled', progress: 0, enrolledAt: new Date().toISOString() }
    try {
      const result = await api.addCourse(uid, course)
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, courses: result.courses || [] } : u))
      setSelectedCourseId('')
      setCourseModal(null)
      setMsg(`Course "${courseName}" added for user.`)
      setTimeout(() => setMsg(''), 2500)
    } catch {
      setMsg('Failed to add course.')
      setTimeout(() => setMsg(''), 2500)
    }
  }

  const handleRemoveCourse = async (uid, courseId) => {
    try {
      const result = await api.removeCourse(uid, courseId)
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, courses: result.courses || [] } : u))
      setMsg('Course removed.')
      setTimeout(() => setMsg(''), 2500)
    } catch {
      setMsg('Failed to remove course.')
      setTimeout(() => setMsg(''), 2500)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const initials = user?.displayName ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : user?.email?.[0]?.toUpperCase() || '?'

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase()
    return !q || (u.displayName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').includes(q)
  })

  const filteredBookings = bookings.filter(b => {
    const q = bookingSearch.toLowerCase()
    if (!q) return true
    const u = users.find(ux => ux.uid === b.userId)
    const name = (u?.displayName || '').toLowerCase()
    const email = (u?.email || '').toLowerCase()
    return name.includes(q) || email.includes(q) || b.date.includes(q) || (TIME_SLOT_MAP[b.timeSlot] || '').toLowerCase().includes(q)
  })

  const upcomingCount = bookings.filter(b => b.date >= todayStr && b.status === 'scheduled').length

  const cardStyle = { background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid #E2EBF5', padding: '1.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }
  const labelStyle = { fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }
  const thStyle = { fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 700, padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #E2EBF5' }
  const tdStyle = { fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#1a2332', padding: '0.75rem 1rem', borderBottom: '1px solid #f0f2f5' }
  const inputStyle = { width: '100%', padding: '0.65rem 0.8rem', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#1a2332', outline: 'none', boxSizing: 'border-box' }

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: SVG.dashboard },
    { id: 'users', label: 'Users', icon: SVG.users },
    { id: 'bookings', label: 'Bookings', icon: SVG.calendar },
  ]

  const switchTab = (tab) => { setActiveTab(tab); setSidebarOpen(false) }

  return (
    <>
      <style>{`
        @keyframes dashBgPan { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes dashGridSlide { from { background-position: 0 0; } to { background-position: 40px 40px; } }
        .admin-stat { transition: all 0.3s ease; }
        .admin-stat:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
        .admin-nav-item { display: flex; align-items: center; gap: 0.7rem; padding: 0.7rem 1rem; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s ease; font-family: var(--font-body); font-size: 0.88rem; font-weight: 500; color: #666; border: none; background: none; width: 100%; text-align: left; }
        .admin-nav-item:hover { background: rgba(1,69,168,0.05); color: ${DARK}; }
        .admin-nav-item-active { background: linear-gradient(135deg, rgba(1,69,168,0.08), rgba(253,188,1,0.05)); color: ${SKY_BLUE}; font-weight: 700; border-left: 3px solid ${GOLD}; }
        .admin-sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 998; }
        @media (max-width: 900px) {
          .admin-sidebar { position: fixed !important; left: -280px !important; z-index: 999; transition: left 0.3s ease !important; }
          .admin-sidebar-open { left: 0 !important; }
          .admin-sidebar-overlay-show { display: block !important; }
          .admin-main { margin-left: 0 !important; }
          .admin-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-table-wrap { overflow-x: auto; }
          .admin-grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F8FAFD', display: 'flex', flexDirection: 'column' }}>

        <header style={{ background: DARK, position: 'sticky', top: 0, zIndex: 100, padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>
              {sidebarOpen ? SVG.close : SVG.menu}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <img src="/driving-logo.png" alt="" style={{ height: '32px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#fff', fontWeight: 700 }}>Admin Panel</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#fff', margin: 0, fontWeight: 600 }}>{user?.displayName || 'Admin'}</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{user?.email}</p>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: DARK, flexShrink: 0 }}>{initials}</div>
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1 }}>

          <div className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-open' : ''}`} style={{ width: '260px', background: '#fff', borderRight: '1px solid #E2EBF5', padding: '1.5rem 0', position: 'sticky', top: '60px', height: 'calc(100vh - 60px)', overflowY: 'auto', flexShrink: 0, transition: 'left 0.3s ease' }}>
            <div style={{ textAlign: 'center', padding: '0 1.25rem 1.5rem', borderBottom: '1px solid #f0f2f5', marginBottom: '1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: '0 4px 16px rgba(200,150,12,0.25)' }}>
                {SVG.shield}
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: DARK, margin: 0, fontWeight: 700 }}>{user?.displayName || 'Admin'}</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD_DEEP, fontWeight: 700, marginTop: '0.2rem' }}>Administrator</p>
            </div>

            <nav style={{ padding: '0 0.75rem' }}>
              {navItems.map(item => (
                <button key={item.id} onClick={() => switchTab(item.id)} className={`admin-nav-item ${activeTab === item.id ? 'admin-nav-item-active' : ''}`}>
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            <div style={{ padding: '0 0.75rem', marginTop: 'auto', borderTop: '1px solid #f0f2f5', paddingTop: '1rem' }}>
              <button onClick={() => navigate('/dashboard')} className="admin-nav-item" style={{ color: '#8899aa', marginBottom: '0.25rem' }}>
                {SVG.home}
                Student Dashboard
              </button>
              <button onClick={handleLogout} className="admin-nav-item" style={{ color: '#DC2626' }}>
                {SVG.logout}
                Sign Out
              </button>
            </div>
          </div>

          <div className={`admin-sidebar-overlay ${sidebarOpen ? 'admin-sidebar-overlay-show' : ''}`} onClick={() => setSidebarOpen(false)} />

          <main className="admin-main" style={{ flex: 1, marginLeft: '0', minWidth: 0 }}>
            <div style={{ background: `linear-gradient(135deg, ${DARK} 0%, #1a0a3e 50%, ${DARK} 100%)`, backgroundSize: '300% 300%', animation: 'dashBgPan 12s ease-in-out infinite', padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(253,188,1,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(253,188,1,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', animation: 'dashGridSlide 8s linear infinite', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ width: '16px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD_DEEP, fontWeight: 700 }}>
                    {navItems.find(n => n.id === activeTab)?.label || 'Admin'}
                  </span>
                </div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: '#ffffff', lineHeight: 1.15, fontWeight: 800, margin: 0 }}>
                  Admin Dashboard
                </h1>
              </div>
            </div>

            <div style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

              {msg && (
                <div style={{ padding: '0.75rem 1rem', background: msg.includes('Failed') ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${msg.includes('Failed') ? '#FECACA' : '#BBF7D0'}`, borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: msg.includes('Failed') ? '#DC2626' : '#16A34A' }}>
                  {msg}
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div>
                  <div className="admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                      { num: stats.totalUsers, label: 'Total Users', color: SKY_BLUE },
                      { num: stats.totalBookings, label: 'Total Bookings', color: GOLD },
                      { num: stats.activeEnrollments, label: 'Active Enrollments', color: '#22C55E' },
                    ].map(s => (
                      <div key={s.label} className="admin-stat" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid #E2EBF5', textAlign: 'center', padding: '1.5rem 1rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '0.3rem' }}>{s.num}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="admin-grid-responsive">
                    <div style={cardStyle}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DARK, fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {SVG.users} Recent Users
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {users.slice(0, 5).map(u => (
                          <div key={u.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: '#f8fafd', borderRadius: 'var(--radius-sm)', border: '1px solid #f0f2f5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                {(u.displayName || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: DARK, fontWeight: 600, margin: 0 }}>{u.displayName || 'Unnamed'}</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: '#8899aa', margin: '0.1rem 0 0' }}>{u.email || 'No email'}</p>
                              </div>
                            </div>
                            {u.isAdmin && <span style={{ padding: '0.15rem 0.4rem', background: 'rgba(253,188,1,0.15)', color: GOLD_DEEP, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.45rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Admin</span>}
                          </div>
                        ))}
                        {users.length === 0 && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#8899aa', textAlign: 'center', padding: '1rem' }}>No users yet</p>}
                      </div>
                    </div>

                    <div style={cardStyle}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DARK, fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {SVG.calendar} Recent Bookings
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {bookings.slice(0, 5).map(b => {
                          const u = users.find(ux => ux.uid === b.userId)
                          const isPast = b.date < todayStr
                          return (
                            <div key={b._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: '#f8fafd', borderRadius: 'var(--radius-sm)', border: '1px solid #f0f2f5' }}>
                              <div>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: DARK, fontWeight: 600, margin: 0 }}>{u?.displayName || 'Unknown'}</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: '#8899aa', margin: '0.1rem 0 0' }}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {TIME_SLOT_MAP[b.timeSlot] || b.timeSlot}</p>
                              </div>
                              <span style={{ padding: '0.2rem 0.5rem', background: isPast ? 'rgba(136,153,170,0.1)' : 'rgba(34,197,94,0.1)', color: isPast ? '#8899aa' : '#22C55E', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.45rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{isPast ? 'Done' : 'Upcoming'}</span>
                            </div>
                          )
                        })}
                        {bookings.length === 0 && <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#8899aa', textAlign: 'center', padding: '1rem' }}>No bookings yet</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.users} All Users ({users.length})</h3>
                    <input type="text" placeholder="Search by name, email, phone..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} style={{ ...inputStyle, width: '280px' }} />
                  </div>
                  <div className="admin-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>User</th>
                          <th style={thStyle}>Email</th>
                          <th style={thStyle}>Phone</th>
                          <th style={thStyle}>Courses</th>
                          <th style={thStyle}>Role</th>
                          <th style={thStyle}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(u => (
                          <tr key={u.uid}>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                  {(u.displayName || u.email || '?')[0].toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 600 }}>{u.displayName || 'Unnamed'}</span>
                              </div>
                            </td>
                            <td style={tdStyle}>{u.email || '—'}</td>
                            <td style={tdStyle}>{u.phone || '—'}</td>
                            <td style={tdStyle}>
                              {u.courses && u.courses.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  {u.courses.map((c, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span style={{ padding: '0.15rem 0.4rem', background: 'rgba(34,197,94,0.1)', color: '#16A34A', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.45rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        {c.title || COURSE_MAP[c.id] || `Course ${c.id}`}
                                      </span>
                                      <button onClick={() => handleRemoveCourse(u.uid, c.id)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '0 0.2rem', fontSize: '0.7rem', lineHeight: 1 }} title="Remove course">&times;</button>
                                    </div>
                                  ))}
                                </div>
                              ) : <span style={{ color: '#8899aa' }}>—</span>}
                              {courseModal === u.uid ? (
                                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                  <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}>
                                    <option value="">Select course...</option>
                                    {Object.entries(COURSE_MAP).map(([id, name]) => (
                                      <option key={id} value={id}>{name}</option>
                                    ))}
                                  </select>
                                  <button onClick={() => handleAddCourse(u.uid)} disabled={!selectedCourseId} style={{ padding: '0.3rem 0.6rem', background: selectedCourseId ? SKY_BLUE : '#ccc', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.45rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: selectedCourseId ? 'pointer' : 'not-allowed' }}>Add</button>
                                  <button onClick={() => { setCourseModal(null); setSelectedCourseId('') }} style={{ padding: '0.3rem 0.6rem', background: 'none', border: '1px solid #ccc', color: '#8899aa', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.45rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => { setCourseModal(u.uid); setSelectedCourseId('') }} style={{ marginTop: '0.3rem', padding: '0.2rem 0.5rem', background: 'none', border: `1px dashed ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.45rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>+ Add</button>
                              )}
                            </td>
                            <td style={tdStyle}>
                              {u.isAdmin
                                ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(253,188,1,0.15)', color: GOLD_DEEP, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Admin</span>
                                : <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(136,153,170,0.1)', color: '#8899aa', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>User</span>}
                            </td>
                            <td style={tdStyle}>
                              <button onClick={() => handleToggleAdmin(u.uid, u.isAdmin)} style={{ background: 'none', border: `1.5px solid ${u.isAdmin ? '#DC2626' : SKY_BLUE}`, color: u.isAdmin ? '#DC2626' : SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#8899aa' }}>No users found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'bookings' && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.calendar} All Bookings ({bookings.length})</h3>
                    <input type="text" placeholder="Search by user, date, time..." value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} style={{ ...inputStyle, width: '280px' }} />
                  </div>
                  <div className="admin-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Student</th>
                          <th style={thStyle}>Date</th>
                          <th style={thStyle}>Time Slot</th>
                          <th style={thStyle}>Status</th>
                          <th style={thStyle}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map(b => {
                          const u = users.find(ux => ux.uid === b.userId)
                          const isPast = b.date < todayStr
                          return (
                            <tr key={b._id}>
                              <td style={tdStyle}>
                                <div>
                                  <p style={{ fontWeight: 600, margin: 0 }}>{u?.displayName || 'Unknown'}</p>
                                  <p style={{ fontSize: '0.72rem', color: '#8899aa', margin: '0.1rem 0 0' }}>{u?.email || b.userId}</p>
                                </div>
                              </td>
                              <td style={tdStyle}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                              <td style={tdStyle}>{TIME_SLOT_MAP[b.timeSlot] || b.timeSlot}</td>
                              <td style={tdStyle}>
                                <span style={{ padding: '0.2rem 0.5rem', background: isPast ? 'rgba(136,153,170,0.1)' : 'rgba(34,197,94,0.1)', color: isPast ? '#8899aa' : '#22C55E', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{isPast ? 'Completed' : 'Scheduled'}</span>
                              </td>
                              <td style={tdStyle}>
                                <button onClick={() => handleDeleteBooking(b._id)} style={{ background: 'none', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        {filteredBookings.length === 0 && (
                          <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#8899aa' }}>No bookings found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
