import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { api, makeEmbedCode } from '../api'
import { DEFAULT_SOCIALS, SOCIAL_PLATFORMS, socialIcon, socialPlatformLabel } from '../socials'
import { usePageMeta } from '../usePageMeta'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

const COURSE_MAP = {
  '1': 'TEEN ONLINE DRIVERS ED',
  '2': 'BASIC PLAN',
  '3': 'ESSENTIAL PLAN',
  '4': 'IDEAL FOR STUDENTS',
  '5': 'PREMIER PLAN',
  '6': 'DMV Drive Test Car Rental',
  '7': 'DMV Drive Test Car Rental.',
  '8': 'Freeway Focused Course',
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
  mail: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>,
  dollar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
  book: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="14" y2="11" /></svg>,
  map: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 20l-6 3V7l6-3 6 3 6-3v16l-6 3-6-3z" /><path d="M9 4v16M15 7v16" /></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>,
  refund: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>,
}

export default function AdminPage() {
  usePageMeta('Admin Panel — A Precision Driving School', 'A Precision Driving School admin panel.')
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({ totalUsers: 0, totalBookings: 0, activeEnrollments: 0 })
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [contacts, setContacts] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [bookingSearch, setBookingSearch] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [courseModal, setCourseModal] = useState(null)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [contactEdit, setContactEdit] = useState(null)
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', phone: '', email: '', comments: '', status: '' })
  const [settings, setSettings] = useState({ phone: '', email: '', address: '', subaddress: '', scheduleLabel: '', scheduleLink: '' })
  const [settingsMsg, setSettingsMsg] = useState('')
  const [pricing, setPricing] = useState([])
  const [pricingEdit, setPricingEdit] = useState(null)
  const [pricingForm, setPricingForm] = useState({ planName: '', id: '', planPrice: '', planPriceTwo: '', option1: '', perm1: 'Select', option2: '', perm2: 'Select', option3: '', perm3: 'Select', option4: '', perm4: 'Select', option5: '', perm5: 'Select' })
  const [areas, setAreas] = useState([])
  const [areasEdit, setAreasEdit] = useState(null)
  const [areasForm, setAreasForm] = useState({ name: '', map: '', icon: '' })
  const [copiedArea, setCopiedArea] = useState(null)
  const [socials, setSocials] = useState([])
  const [socialsEdit, setSocialsEdit] = useState(null)
  const [socialsForm, setSocialsForm] = useState({ platform: 'facebook', url: '', order: 0 })
  const [enrollments, setEnrollments] = useState([])
  const [enrollTotal, setEnrollTotal] = useState(0)
  const [enrollPage, setEnrollPage] = useState(1)
  const [enrollPages, setEnrollPages] = useState(1)
  const [enrollLimit, setEnrollLimit] = useState('10')
  const [enrollSearch, setEnrollSearch] = useState('')
  const [enrollFrom, setEnrollFrom] = useState('')
  const [enrollTo, setEnrollTo] = useState('')
  const [enrollStats, setEnrollStats] = useState({ totalStudents: 0, totalPackages: 0, totalEnrolled: 0 })
  const [enrollEdit, setEnrollEdit] = useState(null)
  const [enrollForm, setEnrollForm] = useState({
    ID: '', Status: 'pending', Full_Name: '', Email: '', 'Student Phone': '', Gender: '',
    Date_of_Birth: '', Address: '', City: '', State: '', Zip: '', Permit: '',
    Issue_Date: '', Expire_Date: '', Parent_Phone: '', Pickup_Address: '', Course_Name: '',
    Booking_Date: '', Meds: '', Notes: '', Calender_booking_Id: '', Price: '', Total: '',
  })
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollSearchTimer, setEnrollSearchTimer] = useState(null)
  const [refunds, setRefunds] = useState([])
  const [refundTotal, setRefundTotal] = useState(0)
  const [refundPage, setRefundPage] = useState(1)
  const [refundPages, setRefundPages] = useState(1)
  const [refundLimit, setRefundLimit] = useState('10')
  const [refundSearch, setRefundSearch] = useState('')
  const [refundStats, setRefundStats] = useState({ totalRequests: 0, totalRefunded: 0, totalAmount: 0, pending: 0 })
  const [refundEdit, setRefundEdit] = useState(null)
  const [refundForm, setRefundForm] = useState({ Full_Name: '', Email: '', Phone: '', Course_Name: '', Amount: '', Reason: '', Status: 'pending' })

  useEffect(() => {
    const load = async () => {
      try {
        const [s, u, b, c, st, p, a, so] = await Promise.all([
          api.adminStats(),
          api.adminUsers(),
          api.adminBookings(),
          api.adminContacts(),
          api.getSettings().catch(() => ({})),
          api.getPricing().catch(() => []),
          api.getAreas().catch(() => []),
          api.getSocials().catch(() => DEFAULT_SOCIALS),
        ])
        setStats(s)
        setUsers(u)
        setBookings(b)
        setContacts(c)
        setSettings(prev => ({ ...prev, ...st }))
        setPricing(Array.isArray(p) ? p : [])
        setAreas(Array.isArray(a) ? a : [])
        setSocials(Array.isArray(so) ? so : [])
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
    const targetUser = users.find(u => u.uid === uid)
    const course = { id: selectedCourseId, title: courseName, status: 'Enrolled', progress: 0, enrolledAt: new Date().toISOString(), email: targetUser?.email || '' }
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

  const handleEditContact = (contact) => {
    setContactForm({ firstName: contact.firstName || '', lastName: contact.lastName || '', phone: contact.phone || '', email: contact.email || '', comments: contact.comments || '', status: contact.status || 'new' })
    setContactEdit(contact._id)
  }

  const handleSaveContact = async () => {
    try {
      await api.adminUpdateContact(contactEdit, contactForm)
      setContacts(prev => prev.map(c => c._id === contactEdit ? { ...c, ...contactForm } : c))
      setContactEdit(null)
      setMsg('Contact updated.')
      setTimeout(() => setMsg(''), 2000)
    } catch {
      setMsg('Failed to update contact.')
      setTimeout(() => setMsg(''), 2000)
    }
  }

  const handleDeleteContact = async (id) => {
    try {
      await api.adminDeleteContact(id)
      setContacts(prev => prev.filter(c => c._id !== id))
      setMsg('Contact deleted.')
      setTimeout(() => setMsg(''), 2000)
    } catch {
      setMsg('Failed to delete contact.')
      setTimeout(() => setMsg(''), 2000)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const initials = user?.displayName ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : user?.email?.[0]?.toUpperCase() || '?'

  useEffect(() => {
    if (activeTab !== 'enrolled') return
    const load = async () => {
      setEnrollLoading(true)
      try {
        const params = { page: enrollPage, limit: enrollLimit }
        if (enrollSearch) params.search = enrollSearch
        if (enrollFrom) params.from = enrollFrom
        if (enrollTo) params.to = enrollTo
        const [list, stats] = await Promise.all([
          api.adminEnrollments(params),
          api.adminEnrollmentsStats(),
        ])
        setEnrollments(list.data || [])
        setEnrollTotal(list.total || 0)
        setEnrollPages(list.totalPages || 1)
        setEnrollStats(stats)
      } catch {}
      setEnrollLoading(false)
    }
    load()
  }, [activeTab, enrollPage, enrollLimit, enrollSearch, enrollFrom, enrollTo])

  useEffect(() => {
    if (activeTab !== 'refunds') return
    const load = async () => {
      try {
        const params = { page: refundPage, limit: refundLimit }
        if (refundSearch) params.search = refundSearch
        const [list, stats] = await Promise.all([
          api.adminRefunds(params),
          api.adminRefundsStats(),
        ])
        setRefunds(list.data || [])
        setRefundTotal(list.total || 0)
        setRefundPages(list.totalPages || 1)
        setRefundStats(stats)
      } catch {}
    }
    load()
  }, [activeTab, refundPage, refundLimit, refundSearch])

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
  const labelStyle = { fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }
  const thStyle = { fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, padding: '0.75rem 1rem', textAlign: 'left', borderBottom: '1px solid #E2EBF5' }
  const tdStyle = { fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#1a2332', padding: '0.75rem 1rem', borderBottom: '1px solid #f0f2f5' }
  const inputStyle = { width: '100%', padding: '0.65rem 0.8rem', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#1a2332', outline: 'none', boxSizing: 'border-box' }

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: SVG.dashboard },
    { id: 'users', label: 'Users', icon: SVG.users },
    { id: 'bookings', label: 'Bookings', icon: SVG.calendar },
    { id: 'contacts', label: 'Contacts', icon: SVG.mail },
    { id: 'enrolled', label: 'Enrolled Courses', icon: SVG.book },
    { id: 'refunds', label: 'Refunds', icon: SVG.refund },
    { id: 'pricing', label: 'Pricing', icon: SVG.dollar },
    { id: 'maps', label: 'Maps', icon: SVG.map },
    { id: 'socials', label: 'Social Links', icon: SVG.share },
    { id: 'settings', label: 'Site Settings', icon: SVG.settings },
  ]

  const switchTab = (tab) => { setActiveTab(tab); setSidebarOpen(false) }

  return (
    <>
      <style>{`
        @keyframes dashBgPan { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes dashGridSlide { from { background-position: 0 0; } to { background-position: 40px 40px; } }
        .admin-stat { transition: all 0.3s ease; }
        .admin-stat:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
        .admin-nav-item { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; border-radius:14px; cursor:pointer; transition:all 0.35s cubic-bezier(0.22,1,0.36,1); font-family:var(--font-body); font-size:0.88rem; font-weight:500; color:rgba(255,255,255,0.85); border:none; background:none; width:100%; text-align:left; position:relative; overflow:hidden; }
        .admin-nav-item::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(253,188,1,0.10),rgba(255,255,255,0.03)); opacity:0; transition:opacity 0.3s; border-radius:14px; }
        .admin-nav-item:hover { color:#FFFFFF; transform:translateX(6px); }
        .admin-nav-item:not(.admin-logout-item):hover svg { stroke:#FDBC01; }
        .admin-nav-item:hover::after { opacity:1; }
        .admin-nav-active { background:linear-gradient(135deg,rgba(253,188,1,0.16),rgba(253,188,1,0.05)) !important; color:#FDBC01 !important; font-weight:700; box-shadow:0 4px 20px rgba(253,188,1,0.15); border:1px solid rgba(253,188,1,0.25); }
        .admin-nav-active::after { opacity:1 !important; }
        .admin-nav-active::before { content:''; position:absolute; left:0; top:8px; bottom:8px; width:3px; background:linear-gradient(180deg,#FDBC01,#FFD54F,#FDBC01); border-radius:0 4px 4px 0; box-shadow:0 0 12px rgba(253,188,1,0.5); }
        .admin-nav-active svg { stroke:#FDBC01; filter:drop-shadow(0 0 4px rgba(253,188,1,0.35)); }
        .admin-gold-line { height:1px; background:linear-gradient(90deg,transparent,rgba(253,188,1,0.4),rgba(253,188,1,0.15),rgba(253,188,1,0.4),transparent); margin:0.5rem 0.75rem; }
        .admin-sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(10,22,40,0.7); backdrop-filter: blur(12px) saturate(120%); z-index: 998; }
        .admin-hamburger { display: none !important; }
        @media (max-width: 900px) {
          .admin-hamburger { display: flex !important; }
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

        <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0145A8', borderBottom: '1px solid rgba(253,188,1,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(253,188,1,0.08)' }}>
          <div style={{ height: '2.5px', background: `linear-gradient(90deg,transparent 5%,${GOLD} 20%,${GOLD_BRIGHT} 35%,#fff 50%,${GOLD_BRIGHT} 65%,${GOLD} 80%,transparent 95%)` }} />
          <div style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button className="admin-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'rgba(253,188,1,0.08)', border: '1px solid rgba(253,188,1,0.15)', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.4rem', width: '40px', height: '40px', justifyContent: 'center' }}>
                {sidebarOpen ? SVG.close : SVG.menu}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <img src="/driving-logo.png" alt="A Precision Driving School Logo" style={{ height: '52px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.8))' }} />
                </Link>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: '#fff', margin: 0, fontWeight: 800, lineHeight: 1.2, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Admin Panel</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD_BRIGHT, margin: 0, fontWeight: 700, textShadow: '0 0 8px rgba(253,188,1,0.3)' }}>A Precision Driving School</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: '#fff', margin: 0, fontWeight: 600 }}>{user?.displayName || 'Admin'}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', margin: 0 }}>{user?.email}</p>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800, color: DARK, border: '2.5px solid #FDBC01', boxShadow: '0 0 20px rgba(253,188,1,0.3)', flexShrink: 0 }}>{initials}</div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '11px', height: '11px', borderRadius: '50%', background: 'linear-gradient(135deg,#22C55E,#16A34A)', border: '2.5px solid #0145A8', boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
              </div>
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1 }}>

          <div className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-open' : ''}`} style={{ width: '260px', background: 'linear-gradient(180deg,#0c2a5e 0%,#0145A8 50%,#082048 100%)', padding: 0, position: 'sticky', top: '76px', height: 'calc(100vh - 76px)', overflowY: 'auto', flexShrink: 0, transition: 'left 0.4s', borderRight: '1px solid rgba(253,188,1,0.12)', display: 'flex', flexDirection: 'column', boxShadow: 'inset -1px 0 0 rgba(253,188,1,0.05)' }}>
            <div style={{ padding: '1.5rem 1rem 1.1rem', borderBottom: '1px solid rgba(253,188,1,0.12)', background: 'linear-gradient(135deg,rgba(253,188,1,0.07),transparent 65%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid #FDBC01', boxShadow: '0 0 20px rgba(253,188,1,0.35)' }}>{SVG.shield}</div>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '13px', height: '13px', borderRadius: '50%', background: 'linear-gradient(135deg,#22C55E,#16A34A)', border: '2.5px solid #0145A8', boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: '#fff', margin: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName || 'Admin'}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(253,188,1,0.85)', fontWeight: 700, margin: '0.2rem 0 0' }}>Administrator</p>
                </div>
              </div>
            </div>

            <nav style={{ padding: '1.25rem 0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.75rem 0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ width: '18px', height: '2px', background: 'linear-gradient(90deg,transparent,#FDBC01)', borderRadius: '2px' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(253,188,1,0.75)', fontWeight: 700 }}>Menu</span>
              </div>
              {navItems.map(item => (
                <button key={item.id} onClick={() => switchTab(item.id)} className={`admin-nav-item ${activeTab === item.id ? 'admin-nav-active' : ''}`} style={{ marginBottom: '4px' }}>
                  <div style={{ flexShrink: 0, width: '34px', height: '34px', borderRadius: '10px', background: activeTab === item.id ? 'linear-gradient(135deg,rgba(253,188,1,0.25),rgba(253,188,1,0.10))' : 'linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>{item.icon}</div>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div style={{ padding: '0.75rem', marginTop: 'auto' }}>
              <div className="admin-gold-line" />
              <button onClick={() => navigate('/dashboard')} className="admin-nav-item" style={{ marginBottom: '4px', marginTop: '0.5rem' }}>
                <div style={{ flexShrink: 0, width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{SVG.home}</div>
                <span>Student Dashboard</span>
              </button>
              <button onClick={handleLogout} className="admin-nav-item admin-logout-item" style={{ marginBottom: '1rem', background: 'linear-gradient(135deg,rgba(220,38,38,0.22),rgba(220,38,38,0.10))', border: '1px solid rgba(220,38,38,0.35)', color: '#FCA5A5' }}>
                <div style={{ flexShrink: 0, width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#DC2626,#B91C1C)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(220,38,38,0.35)' }}>{SVG.logout}</div>
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          <div className={`admin-sidebar-overlay ${sidebarOpen ? 'admin-sidebar-overlay-show' : ''}`} onClick={() => setSidebarOpen(false)} />

          <main className="admin-main" style={{ flex: 1, marginLeft: '0', minWidth: 0 }}>
            <div style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem) 0' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: '#0F172A', lineHeight: 1.15, fontWeight: 800, margin: 0 }}>
                {navItems.find(n => n.id === activeTab)?.label || 'Admin Dashboard'}
              </h1>
            </div>

            <div style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

              {msg && (
                <div style={{ padding: '0.75rem 1rem', background: msg.includes('Failed') ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${msg.includes('Failed') ? '#FECACA' : '#BBF7D0'}`, borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: msg.includes('Failed') ? '#DC2626' : '#16A34A' }}>
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
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
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
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                {(u.displayName || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: DARK, fontWeight: 600, margin: 0 }}>{u.displayName || 'Unnamed'}</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#64748b', margin: '0.1rem 0 0' }}>{u.email || 'No email'}</p>
                              </div>
                            </div>
                            {u.isAdmin && <span style={{ padding: '0.15rem 0.4rem', background: 'rgba(253,188,1,0.15)', color: GOLD_DEEP, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Admin</span>}
                          </div>
                        ))}
                        {users.length === 0 && <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>No users yet</p>}
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
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: DARK, fontWeight: 600, margin: 0 }}>{u?.displayName || 'Unknown'}</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#64748b', margin: '0.1rem 0 0' }}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {TIME_SLOT_MAP[b.timeSlot] || b.timeSlot}</p>
                              </div>
                              <span style={{ padding: '0.2rem 0.5rem', background: isPast ? 'rgba(136,153,170,0.1)' : 'rgba(34,197,94,0.1)', color: isPast ? '#64748b' : '#22C55E', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{isPast ? 'Done' : 'Upcoming'}</span>
                            </div>
                          )
                        })}
                        {bookings.length === 0 && <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>No bookings yet</p>}
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
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
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
                                      <span style={{ padding: '0.15rem 0.4rem', background: 'rgba(34,197,94,0.1)', color: '#16A34A', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        {c.title || COURSE_MAP[c.id] || `Course ${c.id}`}
                                      </span>
                                      <button onClick={() => handleRemoveCourse(u.uid, c.id)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '0 0.2rem', fontSize: '0.95rem', lineHeight: 1 }} title="Remove course">&times;</button>
                                    </div>
                                  ))}
                                </div>
                              ) : <span style={{ color: '#64748b' }}>—</span>}
                              {courseModal === u.uid ? (
                                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                  <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: 1, padding: '0.3rem 0.5rem', fontSize: '1.05rem' }}>
                                    <option value="">Select course...</option>
                                    {Object.entries(COURSE_MAP).map(([id, name]) => (
                                      <option key={id} value={id}>{name}</option>
                                    ))}
                                  </select>
                                  <button onClick={() => handleAddCourse(u.uid)} disabled={!selectedCourseId} style={{ padding: '0.3rem 0.6rem', background: selectedCourseId ? SKY_BLUE : '#ccc', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: selectedCourseId ? 'pointer' : 'not-allowed' }}>Add</button>
                                  <button onClick={() => { setCourseModal(null); setSelectedCourseId('') }} style={{ padding: '0.3rem 0.6rem', background: 'none', border: '1px solid #ccc', color: '#64748b', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => { setCourseModal(u.uid); setSelectedCourseId('') }} style={{ marginTop: '0.3rem', padding: '0.2rem 0.5rem', background: 'none', border: `1px dashed ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>+ Add</button>
                              )}
                            </td>
                            <td style={tdStyle}>
                              {u.isAdmin
                                ? <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(253,188,1,0.15)', color: GOLD_DEEP, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Admin</span>
                                : <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(136,153,170,0.1)', color: '#64748b', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>User</span>}
                            </td>
                            <td style={tdStyle}>
                              <button onClick={() => handleToggleAdmin(u.uid, u.isAdmin)} style={{ background: 'none', border: `1.5px solid ${u.isAdmin ? '#DC2626' : SKY_BLUE}`, color: u.isAdmin ? '#DC2626' : SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>No users found</td></tr>
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
                                  <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '0.1rem 0 0' }}>{u?.email || b.userId}</p>
                                </div>
                              </td>
                              <td style={tdStyle}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                              <td style={tdStyle}>{TIME_SLOT_MAP[b.timeSlot] || b.timeSlot}</td>
                              <td style={tdStyle}>
                                <span style={{ padding: '0.2rem 0.5rem', background: isPast ? 'rgba(136,153,170,0.1)' : 'rgba(34,197,94,0.1)', color: isPast ? '#64748b' : '#22C55E', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{isPast ? 'Completed' : 'Scheduled'}</span>
                              </td>
                              <td style={tdStyle}>
                                <button onClick={() => handleDeleteBooking(b._id)} style={{ background: 'none', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        {filteredBookings.length === 0 && (
                          <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>No bookings found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'contacts' && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.mail} Contact Messages ({contacts.length})</h3>
                  </div>
                  <div className="admin-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Name</th>
                          <th style={thStyle}>Phone</th>
                          <th style={thStyle}>Email</th>
                          <th style={thStyle}>Comments</th>
                          <th style={thStyle}>Status</th>
                          <th style={thStyle}>Date</th>
                          <th style={thStyle}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map(c => (
                          <tr key={c._id}>
                            <td style={tdStyle}><span style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</span></td>
                            <td style={tdStyle}>{c.phone}</td>
                            <td style={tdStyle}>{c.email}</td>
                            <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.comments}</td>
                            <td style={tdStyle}>
                              <span style={{ padding: '0.2rem 0.5rem', background: c.status === 'new' ? 'rgba(1,69,168,0.08)' : 'rgba(34,197,94,0.1)', color: c.status === 'new' ? SKY_BLUE : '#16A34A', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{c.status || 'new'}</span>
                            </td>
                            <td style={tdStyle}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => handleEditContact(c)} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                <button onClick={() => handleDeleteContact(c._id)} style={{ background: 'none', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {contacts.length === 0 && (
                          <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>No contact messages yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.dollar} Pricing Plan ({pricing.length})</h3>
                    <button onClick={() => { setPricingForm({ planName: '', id: '', planPrice: '', planPriceTwo: '', option1: '', perm1: 'Select', option2: '', perm2: 'Select', option3: '', perm3: 'Select', option4: '', perm4: 'Select', option5: '', perm5: 'Select' }); setPricingEdit('new') }} style={{ padding: '0.5rem 1rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>+ Add Pricing Plan</button>
                  </div>
                  <div className="admin-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>ID</th>
                          <th style={thStyle}>Plan Name</th>
                          <th style={thStyle}>Price</th>
                          <th style={thStyle}>Original Price</th>
                          <th style={thStyle}>Option 1</th>
                          <th style={thStyle}>Option 2</th>
                          <th style={thStyle}>Option 3</th>
                          <th style={thStyle}>Option 4</th>
                          <th style={thStyle}>Option 5</th>
                          <th style={thStyle}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricing.map(t => {
                          const opts = t.options || []
                          return (
                            <tr key={t._id}>
                              <td style={tdStyle}><span style={{ padding: '0.15rem 0.4rem', background: 'rgba(1,69,168,0.08)', color: SKY_BLUE, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>{t.id}</span></td>
                              <td style={{ ...tdStyle, fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.planName}</td>
                              <td style={tdStyle}>{t.planPrice}</td>
                              <td style={tdStyle}>{t.planPriceTwo}</td>
                              {[0,1,2,3,4].map(i => (
                                <td key={i} style={{ ...tdStyle, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.95rem', color: opts[i]?.permission === 'Included' ? '#16A34A' : opts[i]?.permission === 'Not Included' ? '#DC2626' : '#64748b' }}>
                                  {opts[i]?.text ? `${opts[i].text.slice(0, 30)}${opts[i].text.length > 30 ? '...' : ''}` : opts[i]?.permission || 'Select'}
                                </td>
                              ))}
                              <td style={tdStyle}>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button onClick={() => {
                                    const opts = t.options || []
                                    setPricingForm({
                                      planName: t.planName || '', id: t.id || '',
                                      planPrice: t.planPrice || '', planPriceTwo: t.planPriceTwo || '',
                                      option1: opts[0]?.text || '', perm1: opts[0]?.permission || 'Select',
                                      option2: opts[1]?.text || '', perm2: opts[1]?.permission || 'Select',
                                      option3: opts[2]?.text || '', perm3: opts[2]?.permission || 'Select',
                                      option4: opts[3]?.text || '', perm4: opts[3]?.permission || 'Select',
                                      option5: opts[4]?.text || '', perm5: opts[4]?.permission || 'Select',
                                    }); setPricingEdit(t._id)
                                  }} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                  <button onClick={async () => { if (!confirm('Delete this package?')) return; try { await api.adminDeletePricing(t._id); setPricing(prev => prev.filter(x => x._id !== t._id)); setMsg('Package deleted.'); setTimeout(() => setMsg(''), 2000) } catch { setMsg('Failed to delete.'); setTimeout(() => setMsg(''), 2000) } }} style={{ background: 'none', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {pricing.length === 0 && (
                          <tr><td colSpan={10} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>No pricing packages yet. Click "+ Add Pricing Plan" to create one.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'enrolled' && (
                <div>
                  <div className="admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { num: enrollStats.totalStudents, label: 'Total Students', color: SKY_BLUE },
                      { num: enrollStats.totalPackages, label: 'Total Packages', color: GOLD },
                      { num: enrollStats.totalEnrolled, label: 'Enrolled Course', color: '#22C55E' },
                    ].map(s => (
                      <div key={s.label} className="admin-stat" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid #E2EBF5', textAlign: 'center', padding: '1.5rem 1rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '0.3rem' }}>{s.num}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.book} Enrolled Courses ({enrollTotal})</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="date" value={enrollFrom} onChange={e => { setEnrollFrom(e.target.value); setEnrollPage(1) }} style={{ ...inputStyle, width: '140px', fontSize: '1.05rem' }} title="From" />
                        <span style={{ color: '#64748b', fontSize: '1.05rem' }}>to</span>
                        <input type="date" value={enrollTo} onChange={e => { setEnrollTo(e.target.value); setEnrollPage(1) }} style={{ ...inputStyle, width: '140px', fontSize: '1.05rem' }} title="To" />
                        <input type="text" placeholder="Search..." value={enrollSearch} onChange={e => { setEnrollSearch(e.target.value); setEnrollPage(1) }} style={{ ...inputStyle, width: '160px' }} />
                        <select value={enrollLimit} onChange={e => { setEnrollLimit(e.target.value); setEnrollPage(1) }} style={{ ...inputStyle, width: '90px', fontSize: '1.05rem' }}>
                          <option value="10">10 / page</option>
                          <option value="20">20 / page</option>
                          <option value="50">50 / page</option>
                          <option value="100">100 / page</option>
                        </select>
                        <button onClick={() => { setEnrollForm({ ID: '', Status: 'pending', Full_Name: '', Email: '', 'Student Phone': '', Gender: '', Date_of_Birth: '', Address: '', City: '', State: '', Zip: '', Permit: '', Issue_Date: '', Expire_Date: '', Parent_Phone: '', Pickup_Address: '', Course_Name: '', Booking_Date: '', Meds: '', Notes: '', Calender_booking_Id: '', Price: '', Total: '' }); setEnrollEdit('new') }} style={{ padding: '0.5rem 1rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Add</button>
                      </div>
                    </div>

                    <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', minWidth: '2000px' }}>
                        <thead>
                          <tr>
                            {['ID','Status','Action','Applied_date','Price','Total','Full_Name','Email','Student Phone','Gender','Date_of_Birth','Address','City','State','Zip','Permit','Issue_Date','Expire_Date','Parent_Phone','Pickup_Address','Course_Name','Booking_Date','Meds','Notes','Calender_booking_Id'].map(h => (
                              <th key={h} style={thStyle}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {enrollLoading ? (
                            <tr><td colSpan={25} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading...</td></tr>
                          ) : enrollments.length === 0 ? (
                            <tr><td colSpan={25} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>No enrollments found</td></tr>
                          ) : enrollments.map(e => (
                            <tr key={e._id}>
                              <td style={tdStyle}>{e.ID || '—'}</td>
                              <td style={tdStyle}>
                                <span style={{ padding: '0.15rem 0.4rem', background: e.Status === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(253,188,1,0.1)', color: e.Status === 'success' ? '#16A34A' : GOLD_DEEP, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>{e.Status || 'pending'}</span>
                              </td>
                              <td style={tdStyle}>
                                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'nowrap' }}>
                                  <button title="Invoice" onClick={() => { const w = window.open('','_blank'); w.document.write(`<html><head><title>Invoice - ${e.ID || e._id}</title><style>body{font-family:sans-serif;padding:40px}h1{font-size:20px;border-bottom:2px solid #0145A8;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:20px}td{padding:6px 10px;border-bottom:1px solid #eee;font-size:13px}.lbl{color:#64748b;width:140px}</style></head><body><h1>A Precision Driving School</h1><p style="color:#64748b">Invoice</p><table>${Object.entries({ID:e.ID,Student:e.Full_Name,Email:e.Email,Course:e.Course_Name,Price:e.Price,Total:e.Total,Status:e.Status,Date:e.Applied_date}).filter(([k,v])=>v).map(([k,v])=>`<tr><td class="lbl">${k}</td><td>${v}</td></tr>`).join('')}</table></body></html>`); w.document.close(); w.print() }} style={{ background:'none', border:'none', color:SKY_BLUE, cursor:'pointer', padding:'0.15rem', fontSize: '1.05rem', lineHeight:1, textDecoration:'underline' }}>Invoice</button>
                                  <button title="Form" onClick={() => { const w = window.open('','_blank'); w.document.write(`<html><head><title>Enrollment Form - ${e.Full_Name || e.ID}</title><style>body{font-family:sans-serif;padding:40px}h1{font-size:18px;border-bottom:2px solid #FDBC01;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:20px}td{padding:5px 8px;border:1px solid #ddd;font-size:12px;vertical-align:top}.lbl{background:#f5f7fa;font-weight:600;width:160px;color:#1a2332}</style></head><body><h1>A Precision Driving School - Enrollment Form</h1><table>${Object.entries(e).filter(([k])=>k!=='_id'&&k!=='updatedAt'&&k!='__v').map(([k,v])=>`<tr><td class="lbl">${k}</td><td>${v||'—'}</td></tr>`).join('')}</table></body></html>`); w.document.close() }} style={{ background:'none', border:'none', color:GOLD_DEEP, cursor:'pointer', padding:'0.15rem', fontSize: '1.05rem', lineHeight:1, textDecoration:'underline' }}>Form</button>
                                  <button onClick={() => { setEnrollForm({ ID: e.ID || '', Status: e.Status || 'pending', Full_Name: e.Full_Name || '', Email: e.Email || '', 'Student Phone': e['Student Phone'] || '', Gender: e.Gender || '', Date_of_Birth: e.Date_of_Birth || '', Address: e.Address || '', City: e.City || '', State: e.State || '', Zip: e.Zip || '', Permit: e.Permit || '', Issue_Date: e.Issue_Date || '', Expire_Date: e.Expire_Date || '', Parent_Phone: e.Parent_Phone || '', Pickup_Address: e.Pickup_Address || '', Course_Name: e.Course_Name || '', Booking_Date: e.Booking_Date || '', Meds: e.Meds || '', Notes: e.Notes || '', Calender_booking_Id: e.Calender_booking_Id || '', Price: e.Price || '', Total: e.Total || '' }); setEnrollEdit(e._id) }} style={{ background:'none', border:'none', color:SKY_BLUE, cursor:'pointer', padding:'0.15rem', fontSize: '1.05rem', lineHeight:1, textDecoration:'underline' }}>Edit</button>
                                  <button onClick={async () => { if (!confirm('Delete this enrollment?')) return; try { await api.adminDeleteEnrollment(e._id); setEnrollments(prev => prev.filter(x => x._id !== e._id)); setEnrollTotal(prev => prev - 1) } catch {} }} style={{ background:'none', border:'none', color:'#DC2626', cursor:'pointer', padding:'0.15rem', fontSize: '1.05rem', lineHeight:1, textDecoration:'underline' }}>Delete</button>
                                </div>
                              </td>
                              <td style={tdStyle}>{e.Applied_date ? new Date(e.Applied_date).toLocaleString() : '—'}</td>
                              <td style={tdStyle}>{e.Price || '—'}</td>
                              <td style={tdStyle}>{e.Total || '—'}</td>
                              <td style={{ ...tdStyle, fontWeight: 600 }}>{e.Full_Name || '—'}</td>
                              <td style={tdStyle}>{e.Email || '—'}</td>
                              <td style={tdStyle}>{e['Student Phone'] || '—'}</td>
                              <td style={tdStyle}>{e.Gender || '—'}</td>
                              <td style={tdStyle}>{e.Date_of_Birth || '—'}</td>
                              <td style={tdStyle}>{e.Address || '—'}</td>
                              <td style={tdStyle}>{e.City || '—'}</td>
                              <td style={tdStyle}>{e.State || '—'}</td>
                              <td style={tdStyle}>{e.Zip || '—'}</td>
                              <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{e.Permit || '—'}</td>
                              <td style={tdStyle}>{e.Issue_Date || '—'}</td>
                              <td style={tdStyle}>{e.Expire_Date || '—'}</td>
                              <td style={tdStyle}>{e.Parent_Phone || '—'}</td>
                              <td style={tdStyle}>{e.Pickup_Address || '—'}</td>
                              <td style={{ ...tdStyle, fontWeight: 600 }}>{e.Course_Name || '—'}</td>
                              <td style={tdStyle}>{e.Booking_Date || '—'}</td>
                              <td style={tdStyle}>{e.Meds || '—'}</td>
                              <td style={{ ...tdStyle, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.Notes || '—'}</td>
                              <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{e.Calender_booking_Id || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {enrollPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                        <button disabled={enrollPage <= 1} onClick={() => setEnrollPage(prev => Math.max(1, prev - 1))} style={{ padding: '0.4rem 0.8rem', background: enrollPage <= 1 ? '#f0f2f5' : '#fff', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: enrollPage <= 1 ? '#ccc' : DARK, cursor: enrollPage <= 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                        {Array.from({ length: Math.min(enrollPages, 10) }, (_, i) => {
                          const start = Math.max(1, enrollPage - 4)
                          const p = start + i
                          if (p > enrollPages) return null
                          return <button key={p} onClick={() => setEnrollPage(p)} style={{ padding: '0.4rem 0.7rem', background: p === enrollPage ? SKY_BLUE : '#fff', border: `1px solid ${p === enrollPage ? SKY_BLUE : '#E2EBF5'}`, borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: p === enrollPage ? '#fff' : DARK, cursor: 'pointer' }}>{p}</button>
                        })}
                        <button disabled={enrollPage >= enrollPages} onClick={() => setEnrollPage(prev => Math.min(enrollPages, prev + 1))} style={{ padding: '0.4rem 0.8rem', background: enrollPage >= enrollPages ? '#f0f2f5' : '#fff', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: enrollPage >= enrollPages ? '#ccc' : DARK, cursor: enrollPage >= enrollPages ? 'not-allowed' : 'pointer' }}>Next</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'refunds' && (
                <div>
                  <div className="admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { num: refundStats.totalRequests, label: 'Total Requests', color: SKY_BLUE },
                      { num: refundStats.totalRefunded, label: 'Refunded', color: '#22C55E' },
                      { num: refundStats.pending, label: 'Pending', color: GOLD },
                      { num: `$${(refundStats.totalAmount || 0).toFixed(2)}`, label: 'Total Refunded', color: '#DC2626' },
                    ].map(s => (
                      <div key={s.label} className="admin-stat" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid #E2EBF5', textAlign: 'center', padding: '1.5rem 1rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '0.3rem' }}>{s.num}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.refund} Refunds ({refundTotal})</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input type="text" placeholder="Search by name, email, course..." value={refundSearch} onChange={e => { setRefundSearch(e.target.value); setRefundPage(1) }} style={{ ...inputStyle, width: '220px' }} />
                        <select value={refundLimit} onChange={e => { setRefundLimit(e.target.value); setRefundPage(1) }} style={{ ...inputStyle, width: '90px', fontSize: '1.05rem' }}>
                          <option value="10">10 / page</option>
                          <option value="20">20 / page</option>
                          <option value="50">50 / page</option>
                        </select>
                        <button onClick={() => { setRefundForm({ Full_Name: '', Email: '', Phone: '', Course_Name: '', Amount: '', Reason: '', Status: 'pending' }); setRefundEdit('new') }} style={{ padding: '0.5rem 1rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>+ Add Refund</button>
                      </div>
                    </div>

                    <div className="admin-table-wrap">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Student</th>
                            <th style={thStyle}>Email</th>
                            <th style={thStyle}>Phone</th>
                            <th style={thStyle}>Course</th>
                            <th style={thStyle}>Amount</th>
                            <th style={thStyle}>Reason</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>Date</th>
                            <th style={thStyle}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {refunds.length === 0 ? (
                            <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>No refunds found. Click "+ Add Refund" to create one.</td></tr>
                          ) : refunds.map(r => (
                            <tr key={r._id}>
                              <td style={{ ...tdStyle, fontWeight: 600 }}>{r.Full_Name || '—'}</td>
                              <td style={tdStyle}>{r.Email || '—'}</td>
                              <td style={tdStyle}>{r.Phone || '—'}</td>
                              <td style={{ ...tdStyle, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.Course_Name || '—'}</td>
                              <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700 }}>{r.Amount || '—'}</td>
                              <td style={{ ...tdStyle, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.Reason}>{r.Reason || '—'}</td>
                              <td style={tdStyle}>
                                <span style={{ padding: '0.2rem 0.5rem', background: r.Status === 'refunded' ? 'rgba(34,197,94,0.1)' : r.Status === 'denied' ? 'rgba(220,38,38,0.1)' : 'rgba(253,188,1,0.15)', color: r.Status === 'refunded' ? '#16A34A' : r.Status === 'denied' ? '#DC2626' : GOLD_DEEP, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>{r.Status || 'pending'}</span>
                              </td>
                              <td style={tdStyle}>{r.created_at ? r.created_at.slice(0, 10) : '—'}</td>
                              <td style={tdStyle}>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button onClick={() => { setRefundForm({ Full_Name: r.Full_Name || '', Email: r.Email || '', Phone: r.Phone || '', Course_Name: r.Course_Name || '', Amount: r.Amount || '', Reason: r.Reason || '', Status: r.Status || 'pending' }); setRefundEdit(r._id) }} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                  <button onClick={async () => { if (!confirm('Delete this refund?')) return; try { await api.adminDeleteRefund(r._id); setRefunds(prev => prev.filter(x => x._id !== r._id)); setRefundTotal(prev => prev - 1); setMsg('Refund deleted.'); setTimeout(() => setMsg(''), 2000) } catch { setMsg('Failed to delete refund.'); setTimeout(() => setMsg(''), 2000) } }} style={{ background: 'none', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {refundPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                        <button disabled={refundPage <= 1} onClick={() => setRefundPage(prev => Math.max(1, prev - 1))} style={{ padding: '0.4rem 0.8rem', background: refundPage <= 1 ? '#f0f2f5' : '#fff', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: refundPage <= 1 ? '#ccc' : DARK, cursor: refundPage <= 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#64748b' }}>Page {refundPage} of {refundPages}</span>
                        <button disabled={refundPage >= refundPages} onClick={() => setRefundPage(prev => Math.min(refundPages, prev + 1))} style={{ padding: '0.4rem 0.8rem', background: refundPage >= refundPages ? '#f0f2f5' : '#fff', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: refundPage >= refundPages ? '#ccc' : DARK, cursor: refundPage >= refundPages ? 'not-allowed' : 'pointer' }}>Next</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'maps' && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.map} Maps / Locations ({areas.length})</h3>
                    <button onClick={() => { setAreasForm({ name: '', map: '', icon: '' }); setAreasEdit('new') }} style={{ padding: '0.5rem 1rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>+ Add Location</button>
                  </div>
                  <div className="admin-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Name</th>
                          <th style={thStyle}>Map URL</th>
                          <th style={thStyle}>Embed Code</th>
                          <th style={thStyle}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {areas.map(a => (
                          <tr key={a._id}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{a.name}</td>
                            <td style={{ ...tdStyle, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#64748b' }} title={a.map}>{a.map}</td>
                            <td style={tdStyle}>
                              <button
                                onClick={async () => {
                                  const code = makeEmbedCode(a.map)
                                  try {
                                    await navigator.clipboard.writeText(code)
                                  } catch {
                                    const ta = document.createElement('textarea')
                                    ta.value = code
                                    document.body.appendChild(ta)
                                    ta.select()
                                    document.execCommand('copy')
                                    document.body.removeChild(ta)
                                  }
                                  setCopiedArea(a._id)
                                  setTimeout(() => setCopiedArea(null), 2000)
                                }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', background: copiedArea === a._id ? 'rgba(34,197,94,0.1)' : 'rgba(1,69,168,0.06)', border: `1px solid ${copiedArea === a._id ? 'rgba(34,197,94,0.3)' : 'rgba(1,69,168,0.2)'}`, borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, color: copiedArea === a._id ? '#16A34A' : SKY_BLUE, cursor: 'pointer', transition: 'all 0.2s' }}
                              >
                                {copiedArea === a._id ? 'Copied!' : 'Copy Embed'}
                              </button>
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => { setAreasForm({ name: a.name, map: a.map, icon: a.icon || '' }); setAreasEdit(a._id) }} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                <button onClick={async () => { if (!confirm('Delete this location?')) return; try { await api.adminDeleteArea(a._id); setAreas(prev => prev.filter(x => x._id !== a._id)); setMsg('Location deleted.'); setTimeout(() => setMsg(''), 2000) } catch { setMsg('Failed to delete.'); setTimeout(() => setMsg(''), 2000) } }} style={{ background: 'none', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {areas.length === 0 && (
                          <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>No locations yet. Click "+ Add Location" to create one.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'socials' && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.share} Social Links ({socials.length})</h3>
                    <button onClick={() => { setSocialsForm({ platform: 'facebook', url: '', order: socials.length }); setSocialsEdit('new') }} style={{ padding: '0.5rem 1rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>+ Add Social Link</button>
                  </div>
                  <div className="admin-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Platform</th>
                          <th style={thStyle}>URL</th>
                          <th style={thStyle}>Order</th>
                          <th style={thStyle}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {socials.map(s => (
                          <tr key={s._id || s.platform}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: SKY_BLUE }}>{socialIcon(s.platform, 16)}</span>
                                {socialPlatformLabel(s.platform)}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#64748b' }} title={s.url}>{s.url || '—'}</td>
                            <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{s.order ?? 0}</td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => { setSocialsForm({ platform: s.platform || 'link', url: s.url || '', order: s.order ?? 0 }); setSocialsEdit(s._id) }} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                <button onClick={async () => { if (!confirm('Delete this social link?')) return; try { await api.adminDeleteSocial(s._id); setSocials(prev => prev.filter(x => x._id !== s._id)); setMsg('Social link deleted.'); setTimeout(() => setMsg(''), 2000) } catch { setMsg('Failed to delete.'); setTimeout(() => setMsg(''), 2000) } }} style={{ background: 'none', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {socials.length === 0 && (
                          <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>No social links yet. Click "+ Add Social Link" to create one.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div style={cardStyle}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>{SVG.settings} Contact Information</h3>
                  {settingsMsg && (
                    <div style={{ padding: '0.75rem 1rem', background: settingsMsg.includes('Failed') ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${settingsMsg.includes('Failed') ? '#FECACA' : '#BBF7D0'}`, borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: settingsMsg.includes('Failed') ? '#DC2626' : '#16A34A' }}>
                      {settingsMsg}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', maxWidth: '800px' }}>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Phone</label>
                      <input type="text" value={settings.phone} onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Email</label>
                      <input type="text" value={settings.email} onChange={e => setSettings(prev => ({ ...prev, email: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Address</label>
                      <input type="text" value={settings.address} onChange={e => setSettings(prev => ({ ...prev, address: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>City / State / ZIP</label>
                      <input type="text" value={settings.subaddress} onChange={e => setSettings(prev => ({ ...prev, subaddress: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Schedule Label</label>
                      <input type="text" value={settings.scheduleLabel} onChange={e => setSettings(prev => ({ ...prev, scheduleLabel: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Schedule Link</label>
                      <input type="text" value={settings.scheduleLink} onChange={e => setSettings(prev => ({ ...prev, scheduleLink: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <button onClick={async () => {
                      try {
                        await api.adminUpdateSettings(settings)
                        setSettingsMsg('Settings saved!')
                        setTimeout(() => setSettingsMsg(''), 2000)
                      } catch {
                        setSettingsMsg('Failed to save settings.')
                        setTimeout(() => setSettingsMsg(''), 2000)
                      }
                    }} style={{ padding: '0.75rem 2rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>
                      Save Settings
                    </button>
                  </div>
                </div>
              )}

              {contactEdit && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setContactEdit(null) }}>
                  <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '500px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>Edit Contact</h3>
                      <button onClick={() => setContactEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>First Name</label>
                        <input type="text" value={contactForm.firstName} onChange={e => setContactForm(prev => ({ ...prev, firstName: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Last Name</label>
                        <input type="text" value={contactForm.lastName} onChange={e => setContactForm(prev => ({ ...prev, lastName: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Phone</label>
                        <input type="text" value={contactForm.phone} onChange={e => setContactForm(prev => ({ ...prev, phone: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Email</label>
                        <input type="text" value={contactForm.email} onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Comments</label>
                      <textarea rows="4" value={contactForm.comments} onChange={e => setContactForm(prev => ({ ...prev, comments: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Status</label>
                      <select value={contactForm.status} onChange={e => setContactForm(prev => ({ ...prev, status: e.target.value }))} style={inputStyle}>
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setContactEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={handleSaveContact} style={{ flex: 1, padding: '0.75rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>Save</button>
                    </div>
                  </div>
                </div>
              )}

              {pricingEdit && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setPricingEdit(null) }}>
                  <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>
                        {pricingEdit === 'new' ? 'Add Pricing Plan' : 'Edit Pricing Plan'}
                      </h3>
                      <button onClick={() => setPricingEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Plan Name *</label>
                        <input type="text" value={pricingForm.planName} onChange={e => setPricingForm(prev => ({ ...prev, planName: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>ID *</label>
                        <input type="text" value={pricingForm.id} onChange={e => setPricingForm(prev => ({ ...prev, id: e.target.value }))} style={inputStyle} placeholder="e.g. 1, 2, 3..." />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Plan Price *</label>
                        <input type="text" value={pricingForm.planPrice} onChange={e => setPricingForm(prev => ({ ...prev, planPrice: e.target.value }))} style={inputStyle} placeholder="$24.99" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Original Price (strikethrough) *</label>
                        <input type="text" value={pricingForm.planPriceTwo} onChange={e => setPricingForm(prev => ({ ...prev, planPriceTwo: e.target.value }))} style={inputStyle} placeholder="$24.99" />
                      </div>
                    </div>

                    {[1,2,3,4,5].map(i => {
                      const optKey = `option${i}`
                      const permKey = `perm${i}`
                      return (
                        <div key={i} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-sm)' }}>
                          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                            Package Option {i}
                          </label>
                          <input
                            type="text"
                            value={pricingForm[optKey]}
                            onChange={e => setPricingForm(prev => ({ ...prev, [optKey]: e.target.value }))}
                            style={{ ...inputStyle, marginBottom: '0.5rem' }}
                            placeholder={`Option ${i} text`}
                          />
                          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>
                            Package Permission
                          </label>
                          <select
                            value={pricingForm[permKey]}
                            onChange={e => setPricingForm(prev => ({ ...prev, [permKey]: e.target.value }))}
                            style={inputStyle}
                          >
                            <option value="Select">Select</option>
                            <option value="Included">Included</option>
                            <option value="Optional">Optional</option>
                            <option value="Not Included">Not Included</option>
                          </select>
                        </div>
                      )
                    })}

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setPricingEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={async () => {
                        if (!pricingForm.planName || !pricingForm.id || !pricingForm.planPrice || !pricingForm.planPriceTwo) { setMsg('Plan Name, ID, Plan Price, and Plan Price Two are required.'); setTimeout(() => setMsg(''), 2000); return }
                        const options = [1,2,3,4,5].map(i => ({
                          text: pricingForm[`option${i}`] || '',
                          permission: pricingForm[`perm${i}`] || 'Select',
                        }))
                        const doc = { planName: pricingForm.planName, id: pricingForm.id, planPrice: pricingForm.planPrice, planPriceTwo: pricingForm.planPriceTwo, options }
                        try {
                          if (pricingEdit === 'new') {
                            const r = await api.adminAddPricing(doc)
                            if (r.ok) { doc._id = r._id; setPricing(prev => [...prev, doc]) }
                          } else {
                            await api.adminUpdatePricing(pricingEdit, doc)
                            setPricing(prev => prev.map(x => x._id === pricingEdit ? { ...x, ...doc } : x))
                          }
                          setPricingEdit(null)
                          setMsg(pricingEdit === 'new' ? 'Plan added!' : 'Plan updated!')
                          setTimeout(() => setMsg(''), 2000)
                        } catch { setMsg('Failed to save plan.'); setTimeout(() => setMsg(''), 2000) }
                      }} style={{ flex: 1, padding: '0.75rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>
                        {pricingEdit === 'new' ? 'Add Pricing Plan' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {areasEdit && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setAreasEdit(null) }}>
                  <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>{areasEdit === 'new' ? 'Add Location' : 'Edit Location'}</h3>
                      <button onClick={() => setAreasEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Name *</label>
                        <input type="text" value={areasForm.name} onChange={e => setAreasForm(prev => ({ ...prev, name: e.target.value }))} style={inputStyle} placeholder="San Ramon" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Order</label>
                        <input type="number" value={areasForm.order} onChange={e => setAreasForm(prev => ({ ...prev, order: Number(e.target.value) }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Google Maps Embed URL *</label>
                      <textarea rows="4" value={areasForm.map} onChange={e => setAreasForm(prev => ({ ...prev, map: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }} placeholder="https://www.google.com/maps/embed?pb=..." />
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#64748b', margin: '0.4rem 0 0', lineHeight: 1.5 }}>
                        Google Maps te location search kore "Share" â†’ "Embed a map" â†’ iframe er <code>src="..."</code> value ta ekhane paste korun.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setAreasEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={async () => {
                        if (!areasForm.name || !areasForm.map) { setMsg('Name and Map URL are required.'); setTimeout(() => setMsg(''), 2000); return }
                        const doc = { name: areasForm.name, map: areasForm.map, icon: areasForm.icon || '', order: areasForm.order || 0 }
                        try {
                          if (areasEdit === 'new') {
                            const r = await api.adminAddArea(doc)
                            if (r.ok) { doc._id = r._id; setAreas(prev => [...prev, doc]) }
                          } else {
                            await api.adminUpdateArea(areasEdit, doc)
                            setAreas(prev => prev.map(x => x._id === areasEdit ? { ...x, ...doc } : x))
                          }
                          setAreasEdit(null)
                          setMsg(areasEdit === 'new' ? 'Location added!' : 'Location updated!')
                          setTimeout(() => setMsg(''), 2000)
                        } catch { setMsg('Failed to save location.'); setTimeout(() => setMsg(''), 2000) }
                      }} style={{ flex: 1, padding: '0.75rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>
                        {areasEdit === 'new' ? 'Add Location' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {socialsEdit && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setSocialsEdit(null) }}>
                  <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '500px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>{socialsEdit === 'new' ? 'Add Social Link' : 'Edit Social Link'}</h3>
                      <button onClick={() => setSocialsEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Platform *</label>
                        <select value={socialsForm.platform} onChange={e => setSocialsForm(prev => ({ ...prev, platform: e.target.value }))} style={inputStyle}>
                          {SOCIAL_PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Order</label>
                        <input type="number" value={socialsForm.order} onChange={e => setSocialsForm(prev => ({ ...prev, order: Number(e.target.value) }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>URL *</label>
                      <input type="text" value={socialsForm.url} onChange={e => setSocialsForm(prev => ({ ...prev, url: e.target.value }))} style={inputStyle} placeholder="https://facebook.com/yourpage" />
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#64748b', margin: '0.4rem 0 0', lineHeight: 1.5 }}>
                        Link nosto hoye gele ekhane notun link diye save korlei footer e update hoye jabe.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setSocialsEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={async () => {
                        if (!socialsForm.url) { setMsg('URL is required.'); setTimeout(() => setMsg(''), 2000); return }
                        const doc = { platform: socialsForm.platform, url: socialsForm.url, order: Number(socialsForm.order) || 0 }
                        try {
                          if (socialsEdit === 'new') {
                            const r = await api.adminAddSocial(doc)
                            if (r.ok) { doc._id = r._id; setSocials(prev => [...prev, doc]) }
                          } else {
                            await api.adminUpdateSocial(socialsEdit, doc)
                            setSocials(prev => prev.map(x => x._id === socialsEdit ? { ...x, ...doc } : x))
                          }
                          setSocialsEdit(null)
                          setMsg(socialsEdit === 'new' ? 'Social link added!' : 'Social link updated!')
                          setTimeout(() => setMsg(''), 2000)
                        } catch { setMsg('Failed to save social link.'); setTimeout(() => setMsg(''), 2000) }
                      }} style={{ flex: 1, padding: '0.75rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>
                        {socialsEdit === 'new' ? 'Add Social Link' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {refundEdit && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setRefundEdit(null) }}>
                  <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>{refundEdit === 'new' ? 'Add Refund' : 'Edit Refund'}</h3>
                      <button onClick={() => setRefundEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Student Name *</label>
                        <input type="text" value={refundForm.Full_Name} onChange={e => setRefundForm(prev => ({ ...prev, Full_Name: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Amount *</label>
                        <input type="text" value={refundForm.Amount} onChange={e => setRefundForm(prev => ({ ...prev, Amount: e.target.value }))} style={inputStyle} placeholder="$210" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Email</label>
                        <input type="text" value={refundForm.Email} onChange={e => setRefundForm(prev => ({ ...prev, Email: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Phone</label>
                        <input type="text" value={refundForm.Phone} onChange={e => setRefundForm(prev => ({ ...prev, Phone: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Course</label>
                        <input type="text" value={refundForm.Course_Name} onChange={e => setRefundForm(prev => ({ ...prev, Course_Name: e.target.value }))} style={inputStyle} placeholder="IDEAL FOR STUDENTS" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Status</label>
                        <select value={refundForm.Status} onChange={e => setRefundForm(prev => ({ ...prev, Status: e.target.value }))} style={inputStyle}>
                          <option value="pending">Pending</option>
                          <option value="refunded">Refunded</option>
                          <option value="denied">Denied</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Reason</label>
                      <textarea rows="3" value={refundForm.Reason} onChange={e => setRefundForm(prev => ({ ...prev, Reason: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Why is this being refunded?" />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setRefundEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={async () => {
                        if (!refundForm.Full_Name || !refundForm.Amount) { setMsg('Student Name and Amount are required.'); setTimeout(() => setMsg(''), 2000); return }
                        const doc = { ...refundForm }
                        try {
                          if (refundEdit === 'new') {
                            const r = await api.adminAddRefund(doc)
                            if (r.ok) { doc._id = r._id; setRefunds(prev => [doc, ...prev]); setRefundTotal(prev => prev + 1) }
                          } else {
                            await api.adminUpdateRefund(refundEdit, doc)
                            setRefunds(prev => prev.map(x => x._id === refundEdit ? { ...x, ...doc } : x))
                          }
                          setRefundEdit(null)
                          setMsg(refundEdit === 'new' ? 'Refund added!' : 'Refund updated!')
                          setTimeout(() => setMsg(''), 2000)
                        } catch { setMsg('Failed to save refund.'); setTimeout(() => setMsg(''), 2000) }
                      }} style={{ flex: 1, padding: '0.75rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>
                        {refundEdit === 'new' ? 'Add Refund' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {enrollEdit && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setEnrollEdit(null) }}>
                  <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>{enrollEdit === 'new' ? 'Add Enrollment' : 'Edit Enrollment'}</h3>
                      <button onClick={() => setEnrollEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      {[
                        { k: 'ID', label: 'ID', ph: 'Auto or manual' },
                        { k: 'Status', label: 'Status', type: 'select', opts: ['pending', 'success', 'failed'] },
                        { k: 'Full_Name', label: 'Full Name *' },
                        { k: 'Email', label: 'Email' },
                        { k: 'Student Phone', label: 'Student Phone' },
                        { k: 'Gender', label: 'Gender', type: 'select', opts: ['Male', 'Female', 'Other'] },
                        { k: 'Date_of_Birth', label: 'Date of Birth', type: 'date' },
                        { k: 'Course_Name', label: 'Course Name' },
                        { k: 'Price', label: 'Price', ph: '$249' },
                        { k: 'Total', label: 'Total', ph: '$249' },
                        { k: 'Permit', label: 'Permit #' },
                        { k: 'Issue_Date', label: 'Issue Date', type: 'date' },
                        { k: 'Expire_Date', label: 'Expire Date', type: 'date' },
                        { k: 'Parent_Phone', label: 'Parent Phone' },
                        { k: 'Calender_booking_Id', label: 'Booking ID' },
                        { k: 'Booking_Date', label: 'Booking Date' },
                      ].map(({ k, label, type, opts, ph }) => (
                        <div key={k}>
                          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>{label}</label>
                          {type === 'select' ? (
                            <select value={enrollForm[k] || ''} onChange={e => setEnrollForm(prev => ({ ...prev, [k]: e.target.value }))} style={inputStyle}>
                              {opts.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input type={type || 'text'} value={enrollForm[k] || ''} onChange={e => setEnrollForm(prev => ({ ...prev, [k]: e.target.value }))} style={inputStyle} placeholder={ph || ''} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>Address</label>
                        <input type="text" value={enrollForm.Address || ''} onChange={e => setEnrollForm(prev => ({ ...prev, Address: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>Pickup Address</label>
                        <input type="text" value={enrollForm.Pickup_Address || ''} onChange={e => setEnrollForm(prev => ({ ...prev, Pickup_Address: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>City</label>
                        <input type="text" value={enrollForm.City || ''} onChange={e => setEnrollForm(prev => ({ ...prev, City: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>State</label>
                        <input type="text" value={enrollForm.State || ''} onChange={e => setEnrollForm(prev => ({ ...prev, State: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>Zip</label>
                        <input type="text" value={enrollForm.Zip || ''} onChange={e => setEnrollForm(prev => ({ ...prev, Zip: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>Meds</label>
                        <input type="text" value={enrollForm.Meds || ''} onChange={e => setEnrollForm(prev => ({ ...prev, Meds: e.target.value }))} style={inputStyle} placeholder="N/A" />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>Notes</label>
                      <textarea rows="3" value={enrollForm.Notes || ''} onChange={e => setEnrollForm(prev => ({ ...prev, Notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setEnrollEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={async () => {
                        if (!enrollForm.Full_Name) { setMsg('Full Name is required.'); setTimeout(() => setMsg(''), 2000); return }
                        try {
                          if (enrollEdit === 'new') {
                            const r = await api.adminAddEnrollment(enrollForm)
                            if (r.ok) { enrollForm._id = r._id; setEnrollments(prev => [enrollForm, ...prev]); setEnrollTotal(prev => prev + 1) }
                          } else {
                            await api.adminUpdateEnrollment(enrollEdit, enrollForm)
                            setEnrollments(prev => prev.map(x => x._id === enrollEdit ? { ...x, ...enrollForm } : x))
                          }
                          setEnrollEdit(null)
                          setMsg(enrollEdit === 'new' ? 'Enrollment added!' : 'Enrollment updated!')
                          setTimeout(() => setMsg(''), 2000)
                        } catch { setMsg('Failed to save enrollment.'); setTimeout(() => setMsg(''), 2000) }
                      }} style={{ flex: 1, padding: '0.75rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>
                        {enrollEdit === 'new' ? 'Add Enrollment' : 'Save Changes'}
                      </button>
                    </div>
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
