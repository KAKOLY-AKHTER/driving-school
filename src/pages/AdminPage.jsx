import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRef, useCallback } from 'react'
import { signOut, updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { api, makeEmbedCode } from '../api'
import { DEFAULT_SOCIALS, SOCIAL_PLATFORMS, socialIcon, socialPlatformLabel } from '../socials'
import { usePageMeta } from '../usePageMeta'
import { openPrintableDocument } from '../utils/printDocument'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'
const DEFAULT_ADMIN_PHOTO_URL = 'https://driving-school-dun-kappa.vercel.app/admin-img.png'

const localDateKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date)

const normalizeStatus = (value) => String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ')

const adminUserName = (account) => {
  const fullName = [account?.firstName, account?.middleName, account?.lastName]
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(' ')
  return String(
    account?.displayName
      || account?.name
      || account?.username
      || fullName
      || (account?.isAdmin ? 'Site Administrator' : 'Student')
  ).trim()
}

const formatUSD = (value) => {
  const amount = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    : '$0.00'
}

const bookingSortValue = (booking) => {
  const time = String(booking?.timeSlot || booking?.time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  let minutes = 0
  if (time) {
    let hour = Number(time[1]) % 12
    if (time[3].toUpperCase() === 'PM') hour += 12
    minutes = hour * 60 + Number(time[2])
  }
  return `${String(booking?.date || '')}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

const bookingStatusMeta = (booking, today = localDateKey()) => {
  const status = normalizeStatus(booking?.status)
  if (status === 'cancelled' || status === 'canceled') return { label: 'Cancelled', color: '#B91C1C', background: '#FEF2F2', group: 'cancelled' }
  if (status === 'completed') return { label: 'Completed', color: '#475569', background: '#F1F5F9', group: 'completed' }
  if (status === 'no show') return { label: 'No Show', color: '#B45309', background: '#FFF7ED', group: 'completed' }
  if (status === 'refunded') return { label: 'Refunded', color: '#7C3AED', background: '#F5F3FF', group: 'completed' }
  if (status === 'confirmed') return { label: 'Confirmed', color: '#0755AE', background: '#EFF6FF', group: String(booking?.date || '') >= today ? 'upcoming' : 'completed' }
  if (status === 'booked') return { label: 'Booked', color: '#15803D', background: '#F0FDF4', group: String(booking?.date || '') >= today ? 'upcoming' : 'completed' }
  const upcoming = String(booking?.date || '') >= today
  return { label: upcoming ? 'Scheduled' : 'Completed', color: upcoming ? '#15803D' : '#475569', background: upcoming ? '#F0FDF4' : '#F1F5F9', group: upcoming ? 'upcoming' : 'completed' }
}

const courseStatusMeta = (course) => {
  const status = normalizeStatus(course?.status || 'enrolled')
  if (status === 'refund pending') return { label: 'Refund Pending', color: '#B45309', background: '#FFF7ED' }
  if (status === 'refunded') return { label: 'Refunded', color: '#7C3AED', background: '#F5F3FF' }
  if (status === 'cancelled' || status === 'canceled') return { label: 'Cancelled', color: '#B91C1C', background: '#FEF2F2' }
  if (status === 'completed') return { label: 'Completed', color: '#0755AE', background: '#EFF6FF' }
  return { label: course?.status || 'Enrolled', color: '#15803D', background: '#F0FDF4' }
}

const GOOGLE_MAPS_HOSTS = ['google.com', 'googleusercontent.com']

function validateHttpsUrl(value, { required = true, googleMapsOnly = false } = {}) {
  const raw = String(value || '').trim()
  if (!raw) return required
    ? { error: 'Please enter a secure HTTPS URL.' }
    : { value: '' }

  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
      return { error: 'Only secure HTTPS URLs without embedded credentials are allowed.' }
    }
    if (googleMapsOnly) {
      const host = parsed.hostname.toLowerCase()
      const isGoogleMaps = GOOGLE_MAPS_HOSTS.some(domain => host === domain || host.endsWith(`.${domain}`))
      if (!isGoogleMaps) return { error: 'Please use a secure Google Maps embed URL.' }
    }
    return { value: parsed.toString() }
  } catch {
    return { error: 'Please enter a complete, valid URL beginning with https://.' }
  }
}

function showPopupBlockedMessage(setMessage) {
  setMessage('Your browser blocked the document window. Please allow pop-ups and try again.')
  window.setTimeout(() => setMessage(''), 3500)
}

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
  const { user, refreshProfile, refreshAuthUser, authRevision } = useAuth()
  const navigate = useNavigate()
  const hasPasswordProvider = Boolean(user?.providerData?.some(provider => provider.providerId === 'password'))

  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({ totalUsers: 0, totalBookings: 0, activeEnrollments: 0, upcomingBookings: 0, pendingContacts: 0, pendingRefunds: 0 })
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [contacts, setContacts] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [bookingSearch, setBookingSearch] = useState('')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')
  const [contactSearch, setContactSearch] = useState('')
  const [contactStatusFilter, setContactStatusFilter] = useState('all')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [courseModal, setCourseModal] = useState(null)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [contactEdit, setContactEdit] = useState(null)
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', phone: '', email: '', comments: '', status: '' })
  const [settings, setSettings] = useState({ phone: '', email: '', address: '', subaddress: '', scheduleLabel: '', scheduleLink: '' })
  const [settingsMsg, setSettingsMsg] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [pricing, setPricing] = useState([])
  const [pricingEdit, setPricingEdit] = useState(null)
  const [pricingForm, setPricingForm] = useState({ planName: '', id: '', planPrice: '', planPriceTwo: '', option1: '', perm1: 'Select', option2: '', perm2: 'Select', option3: '', perm3: 'Select', option4: '', perm4: 'Select', option5: '', perm5: 'Select' })
  const [areas, setAreas] = useState([])
  const [areasEdit, setAreasEdit] = useState(null)
  const [areasForm, setAreasForm] = useState({ name: '', map: '', icon: '', order: 0 })
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
  const [enrollError, setEnrollError] = useState('')
  const [enrollAttempt, setEnrollAttempt] = useState(0)
  const [refunds, setRefunds] = useState([])
  const [refundTotal, setRefundTotal] = useState(0)
  const [refundPage, setRefundPage] = useState(1)
  const [refundPages, setRefundPages] = useState(1)
  const [refundLimit, setRefundLimit] = useState('10')
  const [refundSearch, setRefundSearch] = useState('')
  const [refundStats, setRefundStats] = useState({ totalRequests: 0, totalRefunded: 0, totalAmount: 0, pending: 0 })
  const [refundLoading, setRefundLoading] = useState(false)
  const [refundError, setRefundError] = useState('')
  const [refundAttempt, setRefundAttempt] = useState(0)
  const [refundEdit, setRefundEdit] = useState(null)
  const [refundForm, setRefundForm] = useState({ Full_Name: '', Email: '', Phone: '', Course_Name: '', Amount: '', Reason: '', Status: 'pending' })
  const [accName, setAccName] = useState('')
  const [accPhoto, setAccPhoto] = useState('')
  const [accEmail, setAccEmail] = useState('')
  const [accPass, setAccPass] = useState('')
  const [accNewPass, setAccNewPass] = useState('')
  const [showAccPass, setShowAccPass] = useState(false)
  const [showAccNewPass, setShowAccNewPass] = useState(false)
  const [accMsg, setAccMsg] = useState('')
  const [accErr, setAccErr] = useState('')
  const [accLoading, setAccLoading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const previousFocusRef = useRef(null)

  const requestConfirmation = (title, message, action) => {
    setConfirmDialog({ title, message, action, busy: false })
  }

  const runConfirmedAction = async () => {
    if (!confirmDialog?.action || confirmDialog.busy) return
    setConfirmDialog(prev => ({ ...prev, busy: true }))
    try {
      await confirmDialog.action()
      setConfirmDialog(null)
    } catch {
      setConfirmDialog(null)
      setMsg('The action could not be completed. Please try again.')
      setTimeout(() => setMsg(''), 2500)
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError('')
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
        if (cancelled) return
        setStats(s || { totalUsers: 0, totalBookings: 0, activeEnrollments: 0, upcomingBookings: 0, pendingContacts: 0, pendingRefunds: 0 })
        setUsers(Array.isArray(u) ? u : [])
        setBookings(Array.isArray(b) ? b : [])
        setContacts(Array.isArray(c) ? c : [])
        setSettings(prev => ({ ...prev, ...st }))
        setPricing(Array.isArray(p) ? p : [])
        setAreas(Array.isArray(a) ? a : [])
        setSocials(Array.isArray(so) ? so : [])
      } catch (error) {
        if (!cancelled) setLoadError(error?.message || 'The admin dashboard could not be loaded. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [loadAttempt])

  useEffect(() => {
    if (activeTab !== 'dashboard' || loading || loadError) return undefined
    let cancelled = false
    api.adminStats()
      .then(nextStats => { if (!cancelled && nextStats) setStats(nextStats) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [activeTab, loading, loadError])

  const handleLogout = async () => { await signOut(auth); navigate('/') }

  useEffect(() => {
    if (user) {
      setAccName(user.displayName || '')
      setAccPhoto(user.photoURL || DEFAULT_ADMIN_PHOTO_URL)
      setAccEmail(user.email || '')
    }
  }, [user, authRevision])

  const handleSaveProfile = async () => {
    setAccErr(''); setAccMsg(''); setAccLoading(true)
    try {
      const cur = auth.currentUser
      const displayName = accName.trim()
      if (!cur || !user?.uid) throw new Error('Your session has expired. Please sign in again.')
      if (!displayName) throw new Error('Display name is required.')
      const photoResult = validateHttpsUrl(accPhoto, { required: false })
      if (photoResult.error) throw new Error(`Profile photo: ${photoResult.error}`)
      const photoURL = photoResult.value || DEFAULT_ADMIN_PHOTO_URL
      await updateProfile(cur, { displayName, photoURL })
      await api.saveUser(user.uid, {
        displayName,
        name: displayName,
        email: cur.email || accEmail.trim(),
        photoURL,
      })
      const refreshedUser = await refreshAuthUser()
      await refreshProfile(refreshedUser)
      setAccName(displayName)
      setAccPhoto(photoURL)
      setUsers(previous => previous.map(account => account.uid === user.uid
        ? { ...account, displayName, name: displayName, photoURL }
        : account))
      setAccMsg('Profile updated.')
      setTimeout(() => setAccMsg(''), 2500)
    } catch (e) {
      setAccErr(e.message || 'Failed to update profile.')
    } finally {
      setAccLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setAccErr(''); setAccMsg(''); setAccLoading(true)
    try {
      const cur = auth.currentUser
      if (!cur || !user?.email) throw new Error('Your session has expired. Please sign in again.')
      if (accNewPass.length < 6) throw new Error('New password must be at least 6 characters.')
      await reauthenticateWithCredential(cur, EmailAuthProvider.credential(cur.email, accPass))
      await updatePassword(cur, accNewPass)
      await reauthenticateWithCredential(cur, EmailAuthProvider.credential(cur.email, accNewPass))
      await refreshAuthUser()
      setAccPass(''); setAccNewPass('')
      setAccMsg('Password changed securely. Use the new password the next time you sign in.')
      setTimeout(() => setAccMsg(''), 2500)
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') setAccErr('Incorrect current password.')
      else if (e.code === 'auth/weak-password') setAccErr('New password must be at least 6 characters.')
      else if (e.code === 'auth/requires-recent-login') setAccErr('For security, please sign out, sign in again, and retry the password change.')
      else if (e.code === 'auth/too-many-requests') setAccErr('Too many attempts. Please wait a few minutes and try again.')
      else setAccErr(e.message || 'Failed to change password.')
    } finally {
      setAccLoading(false)
    }
  }

  const handleChangeEmail = async () => {
    setAccErr(''); setAccMsg(''); setAccLoading(true)
    try {
      const cur = auth.currentUser
      const nextEmail = accEmail.trim().toLowerCase()
      if (!cur || !user?.email) throw new Error('Your session has expired. Please sign in again.')
      if (!/^\S+@\S+\.\S+$/.test(nextEmail)) throw new Error('Please enter a valid email address.')
      if (nextEmail === String(cur.email || '').toLowerCase()) throw new Error('Enter a different email address to make a change.')
      await reauthenticateWithCredential(cur, EmailAuthProvider.credential(cur.email, accPass))
      await updateEmail(cur, nextEmail)
      await cur.getIdToken(true)
      await api.saveUser(user.uid, { email: nextEmail })
      const refreshedUser = await refreshAuthUser()
      await refreshProfile(refreshedUser)
      setUsers(previous => previous.map(account => account.uid === user.uid
        ? { ...account, email: nextEmail }
        : account))
      setAccEmail(nextEmail)
      setAccPass('')
      setAccMsg('Email updated.')
      setTimeout(() => setAccMsg(''), 2500)
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') setAccErr('Incorrect current password.')
      else if (e.code === 'auth/email-already-in-use') setAccErr('This email is already in use.')
      else if (e.code === 'auth/invalid-email') setAccErr('Invalid email address.')
      else if (e.code === 'auth/requires-recent-login') setAccErr('For security, please sign out, sign in again, and retry the email change.')
      else if (e.code === 'auth/operation-not-allowed') setAccErr('Email changes are currently restricted by Firebase Authentication settings.')
      else if (e.code === 'auth/too-many-requests') setAccErr('Too many attempts. Please wait a few minutes and try again.')
      else setAccErr(e.message || 'Failed to change email.')
    } finally {
      setAccLoading(false)
    }
  }

  const updateAdminRole = async (uid, currentIsAdmin) => {
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

  const handleToggleAdmin = (uid, currentIsAdmin) => {
    const target = users.find(item => item.uid === uid)
    const isCurrentUser = uid === user?.uid
    requestConfirmation(
      currentIsAdmin ? 'Remove administrator access?' : 'Grant administrator access?',
      currentIsAdmin
        ? `${target?.email || 'This user'} will lose administrator access.${isCurrentUser ? ' You may be signed out of this panel.' : ''}`
        : `${target?.email || 'This user'} will be able to view and change protected website data.`,
      () => updateAdminRole(uid, currentIsAdmin),
    )
  }

  const deleteBooking = async (id) => {
    try {
      await api.adminDeleteBooking(id)
      setBookings(prev => prev.filter(b => b._id !== id))
      setStats(prev => ({ ...prev, totalBookings: Math.max(0, prev.totalBookings - 1) }))
      setMsg('Booking deleted.')
      setTimeout(() => setMsg(''), 2000)
    } catch {
      setMsg('Failed to delete booking.')
      setTimeout(() => setMsg(''), 2000)
    }
  }

  const handleDeleteBooking = (booking) => {
    const linkedUser = users.find(item => item.uid === booking.userId)
    requestConfirmation(
      'Delete booking?',
      `${linkedUser?.displayName || linkedUser?.email || 'This student'}'s ${booking.date || ''} ${TIME_SLOT_MAP[booking.timeSlot] || booking.timeSlot || ''} booking will be permanently removed and the package slot will become available again.`,
      () => deleteBooking(booking._id),
    )
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

  const removeCourse = async (uid, courseId, enrollmentId = '') => {
    try {
      const result = await api.removeCourse(uid, courseId, enrollmentId)
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, courses: result.courses || [] } : u))
      setMsg('Course removed.')
      setTimeout(() => setMsg(''), 2500)
    } catch {
      setMsg('Failed to remove course.')
      setTimeout(() => setMsg(''), 2500)
    }
  }


  const handleRemoveCourse = (targetUser, course) => requestConfirmation(
    'Remove course enrollment?',
    `${course.title || COURSE_MAP[course.id] || 'This course'} will be removed from ${targetUser.displayName || targetUser.email || 'this student'}. Its linked future lessons will also be cancelled.`,
    () => removeCourse(targetUser.uid, course.id, course.enrollmentId || ''),
  )

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

  const deleteContact = async (id) => {
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


  const handleDeleteContact = (id) => requestConfirmation(
    'Delete contact message?',
    'This contact message will be permanently removed.',
    () => deleteContact(id),
  )

  const deletePricing = async (id) => {
    try {
      await api.adminDeletePricing(id)
      setPricing(prev => prev.filter(item => item._id !== id))
      setMsg('Pricing plan deleted.')
    } catch {
      setMsg('Failed to delete pricing plan.')
    }
    setTimeout(() => setMsg(''), 2500)
  }

  const deleteEnrollment = async (id) => {
    try {
      await api.adminDeleteEnrollment(id)
      setEnrollments(prev => prev.filter(item => item._id !== id))
      setEnrollTotal(prev => Math.max(0, prev - 1))
      setMsg('Enrollment deleted.')
    } catch {
      setMsg('Failed to delete enrollment.')
    }
    setTimeout(() => setMsg(''), 2500)
  }

  const deleteRefund = async (id) => {
    try {
      await api.adminDeleteRefund(id)
      setRefunds(prev => prev.filter(item => item._id !== id))
      setRefundTotal(prev => Math.max(0, prev - 1))
      setMsg('Refund record deleted.')
    } catch {
      setMsg('Failed to delete refund record.')
    }
    setTimeout(() => setMsg(''), 2500)
  }

  const deleteArea = async (id) => {
    try {
      await api.adminDeleteArea(id)
      setAreas(prev => prev.filter(item => item._id !== id))
      setMsg('Location deleted.')
    } catch {
      setMsg('Failed to delete location.')
    }
    setTimeout(() => setMsg(''), 2500)
  }

  const deleteSocial = async (id) => {
    try {
      await api.adminDeleteSocial(id)
      setSocials(prev => prev.filter(item => item._id !== id))
      setMsg('Social link deleted.')
    } catch {
      setMsg('Failed to delete social link.')
    }
    setTimeout(() => setMsg(''), 2500)
  }

  const openEnrollmentInvoice = (enrollment) => {
    const opened = openPrintableDocument({
      title: `Invoice - ${enrollment.ID || enrollment._id || 'Enrollment'}`,
      heading: 'A Precision Driving School',
      subtitle: 'Enrollment invoice',
      rows: Object.entries({
        ID: enrollment.ID,
        Student: enrollment.Full_Name,
        Email: enrollment.Email,
        Course: enrollment.Course_Name,
        Price: enrollment.Price,
        Total: enrollment.Total,
        Status: enrollment.Status,
        Date: enrollment.Applied_date,
      }).filter(([, value]) => value !== null && value !== undefined && value !== ''),
      autoPrint: true,
    })
    if (!opened) showPopupBlockedMessage(setMsg)
  }

  const openEnrollmentForm = (enrollment) => {
    const rows = Object.entries(enrollment)
      .filter(([key]) => !['_id', 'updatedAt', '__v'].includes(key))
      .map(([key, value]) => [key.replaceAll('_', ' '), value])
    const opened = openPrintableDocument({
      title: `Enrollment Form - ${enrollment.Full_Name || enrollment.ID || 'Student'}`,
      heading: 'A Precision Driving School',
      subtitle: 'Enrollment form',
      rows,
    })
    if (!opened) showPopupBlockedMessage(setMsg)
  }

  const activeDialogKey = contactEdit ? 'contact'
    : pricingEdit ? 'pricing'
      : areasEdit ? 'area'
        : socialsEdit ? 'social'
          : refundEdit ? 'refund'
            : enrollEdit ? 'enrollment'
              : confirmDialog ? 'confirmation'
                : ''

  const closeActiveDialog = useCallback(() => {
    if (confirmDialog?.busy) return
    if (confirmDialog) setConfirmDialog(null)
    else if (enrollEdit) setEnrollEdit(null)
    else if (refundEdit) setRefundEdit(null)
    else if (socialsEdit) setSocialsEdit(null)
    else if (areasEdit) setAreasEdit(null)
    else if (pricingEdit) setPricingEdit(null)
    else if (contactEdit) setContactEdit(null)
  }, [areasEdit, confirmDialog, contactEdit, enrollEdit, pricingEdit, refundEdit, socialsEdit])

  useEffect(() => {
    const dialogOpen = Boolean(activeDialogKey)
    if (!dialogOpen && !sidebarOpen) return undefined

    const previousOverflow = document.body.style.overflow
    if (dialogOpen) {
      document.body.style.overflow = 'hidden'
      previousFocusRef.current = document.activeElement
      window.requestAnimationFrame(() => {
        const dialog = document.querySelector('.admin-modal-backdrop [role="dialog"], .admin-confirm-dialog')
        const first = dialog?.querySelector('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')
        first?.focus()
      })
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (dialogOpen) closeActiveDialog()
        else setSidebarOpen(false)
        return
      }
      if (!dialogOpen || event.key !== 'Tab') return
      const dialog = document.querySelector('.admin-modal-backdrop [role="dialog"], .admin-confirm-dialog')
      if (!dialog) return
      const focusable = [...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (dialogOpen) previousFocusRef.current?.focus?.()
    }
  }, [activeDialogKey, closeActiveDialog, sidebarOpen])

  const todayStr = localDateKey()
  const initials = user?.displayName ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : user?.email?.[0]?.toUpperCase() || '?'
  const profilePhotoPreview = validateHttpsUrl(accPhoto, { required: false }).value || DEFAULT_ADMIN_PHOTO_URL
  const msgIsError = /failed|could not|cannot|required|invalid|blocked|only secure|please (enter|use)/i.test(msg)
  const settingsMsgIsError = /failed|could not|cannot|required|invalid|please (enter|use)/i.test(settingsMsg)

  useEffect(() => {
    if (activeTab !== 'enrolled') return
    let cancelled = false
    const load = async () => {
      setEnrollLoading(true)
      setEnrollError('')
      try {
        const params = { page: enrollPage, limit: enrollLimit }
        if (enrollSearch) params.search = enrollSearch
        if (enrollFrom) params.from = enrollFrom
        if (enrollTo) params.to = enrollTo
        const [list, stats] = await Promise.all([
          api.adminEnrollments(params),
          api.adminEnrollmentsStats(),
        ])
        if (cancelled) return
        setEnrollments(Array.isArray(list.data) ? list.data : [])
        setEnrollTotal(list.total || 0)
        setEnrollPages(list.totalPages || 1)
        setEnrollStats(stats || { totalStudents: 0, totalPackages: 0, totalEnrolled: 0 })
      } catch (error) {
        if (!cancelled) setEnrollError(error?.message || 'Enrollments could not be loaded.')
      } finally {
        if (!cancelled) setEnrollLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeTab, enrollPage, enrollLimit, enrollSearch, enrollFrom, enrollTo, enrollAttempt])

  useEffect(() => {
    if (activeTab !== 'refunds') return
    let cancelled = false
    const load = async () => {
      setRefundLoading(true)
      setRefundError('')
      try {
        const params = { page: refundPage, limit: refundLimit }
        if (refundSearch) params.search = refundSearch
        const [list, stats] = await Promise.all([
          api.adminRefunds(params),
          api.adminRefundsStats(),
        ])
        if (cancelled) return
        setRefunds(Array.isArray(list.data) ? list.data : [])
        setRefundTotal(list.total || 0)
        setRefundPages(list.totalPages || 1)
        setRefundStats(stats || { totalRequests: 0, totalRefunded: 0, totalAmount: 0, pending: 0 })
      } catch (error) {
        if (!cancelled) setRefundError(error?.message || 'Refund records could not be loaded.')
      } finally {
        if (!cancelled) setRefundLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeTab, refundPage, refundLimit, refundSearch, refundAttempt])

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase()
    const matchesSearch = !q || adminUserName(u).toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').includes(q)
    const matchesRole = userRoleFilter === 'all' || (userRoleFilter === 'admin' ? u.isAdmin === true : u.isAdmin !== true)
    return matchesSearch && matchesRole
  })

  const filteredBookings = bookings.filter(b => {
    const q = bookingSearch.toLowerCase()
    const u = users.find(ux => ux.uid === b.userId)
    const name = adminUserName(u).toLowerCase()
    const email = (u?.email || '').toLowerCase()
    const course = String(COURSE_MAP[b.courseId] || b.courseTitle || b.courseId || '').toLowerCase()
    const matchesSearch = !q || name.includes(q) || email.includes(q) || course.includes(q) || String(b.date || '').toLowerCase().includes(q) || String(TIME_SLOT_MAP[b.timeSlot] || b.timeSlot || '').toLowerCase().includes(q)
    const group = bookingStatusMeta(b, todayStr).group
    const matchesStatus = bookingStatusFilter === 'all' || group === bookingStatusFilter
    return matchesSearch && matchesStatus
  }).sort((a, b) => bookingSortValue(a).localeCompare(bookingSortValue(b)))

  const filteredContacts = contacts.filter(contact => {
    const q = contactSearch.trim().toLowerCase()
    const status = normalizeStatus(contact.status || 'new')
    const matchesSearch = !q || [contact.firstName, contact.lastName, contact.email, contact.phone, contact.comments]
      .some(value => String(value || '').toLowerCase().includes(q))
    const matchesStatus = contactStatusFilter === 'all' || status === contactStatusFilter
    return matchesSearch && matchesStatus
  })

  const recentBookings = [...bookings]
    .sort((a, b) => bookingSortValue(b).localeCompare(bookingSortValue(a)))
    .slice(0, 5)


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
    { id: 'account', label: 'Admin Account', icon: SVG.shield },
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
        .admin-main { background:radial-gradient(circle at 90% 0%,rgba(1,69,168,0.045),transparent 28rem),#F8FAFD; }
        .admin-table-wrap { overflow:auto; border:1px solid #E2EBF5; border-radius:16px; background:#fff; box-shadow:0 10px 32px rgba(15,23,42,0.055); scrollbar-width:thin; scrollbar-color:#B8C8DC #F1F5F9; }
        .admin-table-wrap table { min-width:760px; }
        .admin-table-wrap thead th { position:sticky; top:0; z-index:3; background:#F7FAFE; box-shadow:inset 0 -1px 0 #E2EBF5; white-space:nowrap; }
        .admin-table-wrap tbody tr { transition:background-color 0.18s ease,transform 0.18s ease; }
        .admin-table-wrap tbody tr:hover { background:#F8FBFF; }
        .admin-table-wrap tbody tr:last-child td { border-bottom:0 !important; }
        .admin-table-wrap button { min-height:34px; }
        .admin-main input,.admin-main select,.admin-main textarea { background:#fff; transition:border-color .2s ease,box-shadow .2s ease,background-color .2s ease; }
        .admin-main input:focus,.admin-main select:focus,.admin-main textarea:focus { border-color:#0145A8 !important; box-shadow:0 0 0 4px rgba(1,69,168,.09); background:#fff; }
        .admin-toast { position:fixed; top:92px; right:clamp(1rem,3vw,2rem); z-index:12000; width:min(390px,calc(100vw - 2rem)); display:flex; align-items:flex-start; gap:.75rem; padding:1rem 1.1rem; border-radius:14px; box-shadow:0 18px 50px rgba(15,23,42,.2); animation:adminToastIn .3s cubic-bezier(.22,1,.36,1); }
        .admin-toast::before { content:''; width:9px; height:9px; margin-top:.42rem; border-radius:50%; flex:0 0 auto; background:currentColor; box-shadow:0 0 0 5px color-mix(in srgb,currentColor 14%,transparent); }
        .admin-loading-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
        .admin-skeleton { min-height:120px; border:1px solid #E2EBF5; border-radius:16px; background:linear-gradient(100deg,#fff 20%,#F0F5FA 40%,#fff 60%); background-size:220% 100%; animation:adminSkeleton 1.2s linear infinite; }
        .admin-main div[style*="z-index: 10000"] > div { border:1px solid rgba(226,235,245,.9); box-shadow:0 30px 90px rgba(10,22,40,.28) !important; }
        .admin-modal-backdrop { animation:adminBackdropIn .2s ease both; }
        .admin-modal-backdrop > div { animation:adminModalIn .3s cubic-bezier(.22,1,.36,1) both !important; }
        .admin-main button { transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background-color .18s ease,color .18s ease; }
        .admin-main button:not(:disabled):active { transform:translateY(1px); }
        .admin-main button:focus-visible,.admin-sidebar button:focus-visible { outline:3px solid rgba(253,188,1,.75); outline-offset:3px; }
        .admin-modal-backdrop button:focus-visible,.admin-confirm-dialog button:focus-visible { outline:3px solid rgba(1,69,168,.32); outline-offset:3px; }
        .admin-toolbar-input { width:min(100%,280px) !important; }
        @keyframes adminBackdropIn { from { opacity:0; } to { opacity:1; } }
        @keyframes adminModalIn { from { opacity:0; transform:translateY(18px) scale(.98); } to { opacity:1; transform:none; } }
        @keyframes adminToastIn { from { opacity:0; transform:translate3d(20px,-8px,0); } to { opacity:1; transform:none; } }
        @keyframes adminSkeleton { to { background-position:-220% 0; } }
        @media (max-width: 900px) {
          .admin-hamburger { display: flex !important; }
          .admin-sidebar { position: fixed !important; left: -280px !important; z-index: 999; transition: left 0.3s ease !important; }
          .admin-sidebar-open { left: 0 !important; }
          .admin-sidebar-overlay-show { display: block !important; }
          .admin-main { margin-left: 0 !important; }
          .admin-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .admin-table-wrap { overflow-x: auto; }
          .admin-grid-responsive { grid-template-columns: 1fr !important; }
          .admin-loading-grid { grid-template-columns:1fr 1fr; }
          .admin-main > div { padding-left:1rem !important; padding-right:1rem !important; }
        }
        @media (max-width: 560px) {
          .admin-stat-grid,.admin-loading-grid { grid-template-columns:1fr !important; }
          .admin-toast { top:82px; right:1rem; }
          .admin-table-wrap { margin-inline:-.25rem; border-radius:12px; }
          .admin-modal-backdrop { align-items:flex-end !important; padding:0 !important; }
          .admin-modal-backdrop > div { width:100% !important; max-width:none !important; max-height:92vh !important; border-radius:20px 20px 0 0 !important; padding:1.25rem !important; }
          .admin-modal-backdrop > div div[style*="grid-template-columns"] { grid-template-columns:1fr !important; }
          .admin-brand-subtitle,.admin-user-copy { display:none !important; }
          .admin-header-inner { padding-inline:.75rem !important; }
          .admin-toolbar,.admin-toolbar > div { align-items:stretch !important; width:100%; }
          .admin-toolbar-input { width:100% !important; }
          .admin-toolbar input,.admin-toolbar select,.admin-toolbar button { max-width:100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-stat,.admin-nav-item,.admin-modal-backdrop,.admin-modal-backdrop > div,.admin-toast,.admin-skeleton { animation:none !important; transition:none !important; }
          .admin-stat:hover,.admin-nav-item:hover { transform:none !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F8FAFD', display: 'flex', flexDirection: 'column' }}>

        <header style={{ position: 'sticky', top: 0, zIndex: 100, background: '#0145A8', borderBottom: '1px solid rgba(253,188,1,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(253,188,1,0.08)' }}>
          <div style={{ height: '2.5px', background: `linear-gradient(90deg,transparent 5%,${GOLD} 20%,${GOLD_BRIGHT} 35%,#fff 50%,${GOLD_BRIGHT} 65%,${GOLD} 80%,transparent 95%)` }} />
          <div className="admin-header-inner" style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button type="button" className="admin-hamburger" aria-label={sidebarOpen ? 'Close admin menu' : 'Open admin menu'} aria-expanded={sidebarOpen} aria-controls="admin-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'rgba(253,188,1,0.08)', border: '1px solid rgba(253,188,1,0.15)', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.4rem', width: '40px', height: '40px', justifyContent: 'center' }}>
                {sidebarOpen ? SVG.close : SVG.menu}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <img src="/driving-logo.png" alt="A Precision Driving School Logo" style={{ height: '52px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.8))' }} />
                </Link>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: '#fff', margin: 0, fontWeight: 800, lineHeight: 1.2, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Admin Panel</p>
                  <p className="admin-brand-subtitle" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD_BRIGHT, margin: 0, fontWeight: 700, textShadow: '0 0 8px rgba(253,188,1,0.3)' }}>A Precision Driving School</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="admin-user-copy" style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: '#fff', margin: 0, fontWeight: 600 }}>{user?.displayName || 'Admin'}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', margin: 0 }}>{user?.email}</p>
              </div>
              <div style={{ position: 'relative' }}>
                {profilePhotoPreview ? <img src={profilePhotoPreview} alt={`${user?.displayName || 'Administrator'} profile`} style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #FDBC01', boxShadow: '0 0 20px rgba(253,188,1,0.3)', flexShrink: 0 }} /> : <div aria-label={`${user?.displayName || 'Administrator'} profile`} style={{ width: '42px', height: '42px', borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800, color: DARK, border: '2.5px solid #FDBC01', boxShadow: '0 0 20px rgba(253,188,1,0.3)', flexShrink: 0 }}>{initials}</div>}
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '11px', height: '11px', borderRadius: '50%', background: 'linear-gradient(135deg,#22C55E,#16A34A)', border: '2.5px solid #0145A8', boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
              </div>
            </div>
          </div>
        </header>

        <div style={{ display: 'flex', flex: 1 }}>

          <div id="admin-sidebar" className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-open' : ''}`} style={{ width: '260px', background: 'linear-gradient(180deg,#0c2a5e 0%,#0145A8 50%,#082048 100%)', padding: 0, position: 'sticky', top: '76px', height: 'calc(100vh - 76px)', overflowY: 'auto', flexShrink: 0, transition: 'left 0.4s', borderRight: '1px solid rgba(253,188,1,0.12)', display: 'flex', flexDirection: 'column', boxShadow: 'inset -1px 0 0 rgba(253,188,1,0.05)' }}>
            <div style={{ padding: '1.5rem 1rem 1.1rem', borderBottom: '1px solid rgba(253,188,1,0.12)', background: 'linear-gradient(135deg,rgba(253,188,1,0.07),transparent 65%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {profilePhotoPreview
                    ? <img src={profilePhotoPreview} alt={`${user?.displayName || 'Administrator'} profile`} style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #FDBC01', boxShadow: '0 0 20px rgba(253,188,1,0.35)', display: 'block' }} />
                    : <div aria-label={`${user?.displayName || 'Administrator'} profile`} style={{ width: '52px', height: '52px', borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2.5px solid #FDBC01', boxShadow: '0 0 20px rgba(253,188,1,0.35)', fontSize: '1rem', fontWeight: 800, color: DARK }}>{initials}</div>}
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '13px', height: '13px', borderRadius: '50%', background: 'linear-gradient(135deg,#22C55E,#16A34A)', border: '2.5px solid #0145A8', boxShadow: '0 0 6px rgba(34,197,94,0.4)' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: '#fff', margin: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName || 'Admin'}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(253,188,1,0.85)', fontWeight: 700, margin: '0.2rem 0 0' }}>Administrator</p>
                </div>
              </div>
            </div>

            <nav aria-label="Admin sections" style={{ padding: '1.25rem 0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.75rem 0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ width: '18px', height: '2px', background: 'linear-gradient(90deg,transparent,#FDBC01)', borderRadius: '2px' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(253,188,1,0.75)', fontWeight: 700 }}>Menu</span>
              </div>
              {navItems.map(item => (
                <button type="button" key={item.id} aria-current={activeTab === item.id ? 'page' : undefined} onClick={() => switchTab(item.id)} className={`admin-nav-item ${activeTab === item.id ? 'admin-nav-active' : ''}`} style={{ marginBottom: '4px' }}>
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

          <div role="presentation" aria-hidden="true" className={`admin-sidebar-overlay ${sidebarOpen ? 'admin-sidebar-overlay-show' : ''}`} onClick={() => setSidebarOpen(false)} />

          <div className="admin-main" style={{ flex: 1, marginLeft: '0', minWidth: 0 }}>
            <div style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem) 0' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: '#0F172A', lineHeight: 1.15, fontWeight: 800, margin: 0 }}>
                {navItems.find(n => n.id === activeTab)?.label || 'Admin Dashboard'}
              </h1>
            </div>

            <div style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>

              {msg && (
                <div role={msgIsError ? 'alert' : 'status'} aria-live="polite" className="admin-toast" style={{ background: msgIsError ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${msgIsError ? '#FECACA' : '#BBF7D0'}`, fontFamily: 'var(--font-body)', fontSize: '0.92rem', fontWeight: 700, color: msgIsError ? '#DC2626' : '#15803D' }}>
                  {msg}
                </div>
              )}

              {loading && (
                <div role="status" aria-label="Loading admin dashboard" className="admin-loading-grid" style={{ marginBottom: '1.5rem' }}>
                  <div className="admin-skeleton" /><div className="admin-skeleton" /><div className="admin-skeleton" />
                </div>
              )}

              {!loading && loadError && (
                <div role="alert" style={{ ...cardStyle, maxWidth: '720px', margin: '1rem auto', textAlign: 'center', borderColor: '#FECACA', background: '#FFFBFB' }}>
                  <div aria-hidden="true" style={{ width: '48px', height: '48px', display: 'grid', placeItems: 'center', margin: '0 auto 1rem', borderRadius: '14px', background: '#FEF2F2', color: '#DC2626' }}>{SVG.shield}</div>
                  <h2 style={{ margin: '0 0 .5rem', color: DARK, fontSize: '1.25rem' }}>Dashboard data is unavailable</h2>
                  <p style={{ margin: '0 auto 1.25rem', maxWidth: '540px', color: '#64748b', lineHeight: 1.6 }}>{loadError}</p>
                  <button type="button" onClick={() => setLoadAttempt(value => value + 1)} style={{ minHeight: '44px', padding: '.7rem 1.2rem', border: 0, borderRadius: '10px', background: `linear-gradient(135deg,${SKY_BLUE},#0a2a5e)`, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Try Again</button>
                </div>
              )}

              {!loading && !loadError && activeTab === 'dashboard' && (
                <div>
                  <div className="admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                      { num: stats.totalUsers, label: 'Total Users', color: SKY_BLUE, tab: 'users' },
                      { num: stats.totalBookings, label: 'Total Bookings', color: '#0F766E', tab: 'bookings' },
                      { num: stats.activeEnrollments, label: 'Active Enrollments', color: '#16A34A', tab: 'enrolled' },
                      { num: stats.upcomingBookings || 0, label: 'Upcoming Lessons', color: '#0755AE', tab: 'bookings' },
                      { num: stats.pendingContacts || 0, label: 'New Messages', color: GOLD_DEEP, tab: 'contacts' },
                      { num: stats.pendingRefunds || 0, label: 'Pending Refunds', color: '#DC2626', tab: 'refunds' },
                    ].map(s => (
                      <button type="button" aria-label={`View ${s.label}`} onClick={() => switchTab(s.tab)} key={s.label} className="admin-stat" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid #E2EBF5', textAlign: 'center', padding: '1.5rem 1rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '0.3rem' }}>{s.num}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                      </button>
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
                                {(adminUserName(u) || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: DARK, fontWeight: 600, margin: 0 }}>{adminUserName(u)}</p>
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
                        {recentBookings.map(b => {
                          const u = users.find(ux => ux.uid === b.userId)
                          const statusMeta = bookingStatusMeta(b, todayStr)
                          return (
                            <div key={b._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: '#f8fafd', borderRadius: 'var(--radius-sm)', border: '1px solid #f0f2f5' }}>
                              <div>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: DARK, fontWeight: 600, margin: 0 }}>{adminUserName(u)}</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#64748b', margin: '0.1rem 0 0' }}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {TIME_SLOT_MAP[b.timeSlot] || b.timeSlot}</p>
                              </div>
                              <span style={{ padding: '0.2rem 0.5rem', background: statusMeta.background, color: statusMeta.color, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{statusMeta.label}</span>
                            </div>
                          )
                        })}
                        {bookings.length === 0 && <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>No bookings yet</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!loading && !loadError && activeTab === 'users' && (
                <div style={cardStyle}>
                  <div className="admin-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.users} Users <span style={{ color: '#64748B', fontSize: '.9rem', fontFamily: 'var(--font-body)', fontWeight: 700 }}>({filteredUsers.length} of {users.length})</span></h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <input className="admin-toolbar-input" aria-label="Search users" type="search" placeholder="Search by name, email, phone…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} style={{ ...inputStyle, width: '280px' }} />
                      <select aria-label="Filter users by role" value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)} style={{ ...inputStyle, width: '140px' }}>
                        <option value="all">All roles</option>
                        <option value="admin">Administrators</option>
                        <option value="user">Students</option>
                      </select>
                      {(userSearch || userRoleFilter !== 'all') && <button type="button" onClick={() => { setUserSearch(''); setUserRoleFilter('all') }} style={{ padding: '.58rem .75rem', border: '1px solid #CBD5E1', borderRadius: '9px', background: '#fff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Clear</button>}
                    </div>
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
                                  {(adminUserName(u) || u.email || '?')[0].toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 600 }}>{adminUserName(u)}</span>
                              </div>
                            </td>
                            <td style={tdStyle}>{u.email || '—'}</td>
                            <td style={tdStyle}>{u.phone || '—'}</td>
                            <td style={tdStyle}>
                              {u.courses && u.courses.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  {u.courses.map((c, i) => {
                                    const courseMeta = courseStatusMeta(c)
                                    const used = Number(c.slotAllowance?.used ?? c.slotUsage?.used)
                                    const maximum = Number(c.slotAllowance?.maximum ?? c.slotUsage?.maximum)
                                    return (
                                      <div key={c.enrollmentId || `${c.id}-${c.enrolledAt || i}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span title={`${courseMeta.label}${Number.isFinite(used) && Number.isFinite(maximum) ? ` · ${used}/${maximum} slots used` : ''}`} style={{ padding: '0.15rem 0.4rem', background: courseMeta.background, color: courseMeta.color, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                          {c.title || COURSE_MAP[c.id] || `Course ${c.id}`}{Number.isFinite(used) && Number.isFinite(maximum) ? ` · ${used}/${maximum}` : ''}
                                        </span>
                                        <button type="button" aria-label={`Remove ${c.title || COURSE_MAP[c.id] || 'course'} from ${adminUserName(u) || u.email || 'user'}`} onClick={() => handleRemoveCourse(u, c)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '0 0.2rem', fontSize: '0.95rem', lineHeight: 1 }} title="Remove course enrollment">&times;</button>
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : <span style={{ color: '#64748b' }}>—</span>}
                              {courseModal === u.uid ? (
                                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                  <select aria-label={`Select a course for ${adminUserName(u) || u.email || 'user'}`} value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: 1, padding: '0.3rem 0.5rem', fontSize: '1.05rem' }}>
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
                              <button aria-label={`${u.isAdmin ? 'Remove administrator access from' : 'Grant administrator access to'} ${adminUserName(u) || u.email || 'user'}`} onClick={() => handleToggleAdmin(u.uid, u.isAdmin)} style={{ background: 'none', border: `1.5px solid ${u.isAdmin ? '#DC2626' : SKY_BLUE}`, color: u.isAdmin ? '#DC2626' : SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
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

              {!loading && !loadError && activeTab === 'bookings' && (
                <div style={cardStyle}>
                  <div className="admin-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.calendar} Bookings <span style={{ color: '#64748B', fontSize: '.9rem', fontFamily: 'var(--font-body)', fontWeight: 700 }}>({filteredBookings.length} of {bookings.length})</span></h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <input className="admin-toolbar-input" aria-label="Search bookings" type="search" placeholder="Search student, plan, date, time…" value={bookingSearch} onChange={(e) => setBookingSearch(e.target.value)} style={{ ...inputStyle, width: '280px' }} />
                      <select aria-label="Filter bookings by status" value={bookingStatusFilter} onChange={(event) => setBookingStatusFilter(event.target.value)} style={{ ...inputStyle, width: '145px' }}>
                        <option value="all">All statuses</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      {(bookingSearch || bookingStatusFilter !== 'all') && <button type="button" onClick={() => { setBookingSearch(''); setBookingStatusFilter('all') }} style={{ padding: '.58rem .75rem', border: '1px solid #CBD5E1', borderRadius: '9px', background: '#fff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Clear</button>}
                    </div>
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
                          const statusMeta = bookingStatusMeta(b, todayStr)
                          return (
                            <tr key={b._id}>
                              <td style={tdStyle}>
                                <div>
                                  <p style={{ fontWeight: 600, margin: 0 }}>{adminUserName(u)}</p>
                                  <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '0.1rem 0 0' }}>{u?.email || b.userId}</p>
                                  <p style={{ fontSize: '0.85rem', color: SKY_BLUE, margin: '0.16rem 0 0', fontWeight: 700 }}>{COURSE_MAP[b.courseId] || b.courseTitle || `Plan ${b.courseId || '—'}`}</p>
                                </div>
                              </td>
                              <td style={tdStyle}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                              <td style={tdStyle}>{TIME_SLOT_MAP[b.timeSlot] || b.timeSlot}</td>
                              <td style={tdStyle}>
                                <span style={{ padding: '0.2rem 0.5rem', background: statusMeta.background, color: statusMeta.color, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{statusMeta.label}</span>
                              </td>
                              <td style={tdStyle}>
                                <button type="button" aria-label={`Delete ${b.date || ''} booking for ${adminUserName(u) || u?.email || 'student'}`} onClick={() => handleDeleteBooking(b)} style={{ background: 'none', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        {filteredBookings.length === 0 && (
                          <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>{bookingSearch || bookingStatusFilter !== 'all' ? 'No bookings match the selected filters.' : 'No bookings yet.'}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!loading && !loadError && activeTab === 'contacts' && (
                <div style={cardStyle}>
                  <div className="admin-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.mail} Contact Messages <span style={{ color: '#64748B', fontSize: '.9rem', fontFamily: 'var(--font-body)', fontWeight: 700 }}>({filteredContacts.length} of {contacts.length})</span></h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <input className="admin-toolbar-input" aria-label="Search contact messages" type="search" placeholder="Search name, email, message…" value={contactSearch} onChange={(event) => setContactSearch(event.target.value)} style={{ ...inputStyle, width: '280px' }} />
                      <select aria-label="Filter contact messages by status" value={contactStatusFilter} onChange={(event) => setContactStatusFilter(event.target.value)} style={{ ...inputStyle, width: '145px' }}>
                        <option value="all">All statuses</option>
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                      </select>
                      {(contactSearch || contactStatusFilter !== 'all') && <button type="button" onClick={() => { setContactSearch(''); setContactStatusFilter('all') }} style={{ padding: '.58rem .75rem', border: '1px solid #CBD5E1', borderRadius: '9px', background: '#fff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Clear</button>}
                    </div>
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
                        {filteredContacts.map(c => (
                          <tr key={c._id}>
                            <td style={tdStyle}><span style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</span></td>
                            <td style={tdStyle}>{c.phone}</td>
                            <td style={tdStyle}>{c.email}</td>
                            <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.comments}</td>
                            <td style={tdStyle}>
                              <span style={{ padding: '0.2rem 0.5rem', background: normalizeStatus(c.status || 'new') === 'new' ? '#EFF6FF' : normalizeStatus(c.status) === 'read' ? '#FFF7ED' : '#F0FDF4', color: normalizeStatus(c.status || 'new') === 'new' ? SKY_BLUE : normalizeStatus(c.status) === 'read' ? '#B45309' : '#15803D', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{c.status || 'new'}</span>
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
                        {filteredContacts.length === 0 && (
                          <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>{contactSearch || contactStatusFilter !== 'all' ? 'No messages match the selected filters.' : 'No contact messages yet.'}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!loading && !loadError && activeTab === 'pricing' && (
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
                                  <button onClick={() => requestConfirmation('Delete pricing plan?', `${t.planName || 'This plan'} will be permanently removed.`, () => deletePricing(t._id))} style={{ background: 'none', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
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

              {!loading && !loadError && activeTab === 'enrolled' && (
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
                        <input aria-label="Enrollment start date" type="date" value={enrollFrom} onChange={e => { setEnrollFrom(e.target.value); setEnrollPage(1) }} style={{ ...inputStyle, width: '140px', fontSize: '1.05rem' }} title="From" />
                        <span style={{ color: '#64748b', fontSize: '1.05rem' }}>to</span>
                        <input aria-label="Enrollment end date" type="date" value={enrollTo} onChange={e => { setEnrollTo(e.target.value); setEnrollPage(1) }} style={{ ...inputStyle, width: '140px', fontSize: '1.05rem' }} title="To" />
                        <input aria-label="Search enrollments" type="search" placeholder="Search enrollments…" value={enrollSearch} onChange={e => { setEnrollSearch(e.target.value); setEnrollPage(1) }} style={{ ...inputStyle, width: '160px' }} />
                        <select aria-label="Enrollments per page" value={enrollLimit} onChange={e => { setEnrollLimit(e.target.value); setEnrollPage(1) }} style={{ ...inputStyle, width: '90px', fontSize: '1.05rem' }}>
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
                            <tr><td role="status" aria-live="polite" colSpan={25} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading enrollments…</td></tr>
                          ) : enrollError ? (
                            <tr><td role="alert" colSpan={25} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#B91C1C' }}>
                              <p style={{ margin: '0 0 .75rem' }}>{enrollError}</p>
                              <button type="button" onClick={() => setEnrollAttempt(value => value + 1)} style={{ padding: '.55rem .9rem', border: '1px solid #FCA5A5', borderRadius: '9px', background: '#fff', color: '#B91C1C', fontWeight: 800, cursor: 'pointer' }}>Try Again</button>
                            </td></tr>
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
                                  <button type="button" aria-label={`Open invoice for ${e.Full_Name || e.ID || 'student'}`} title="Open invoice" onClick={() => openEnrollmentInvoice(e)} style={{ background:'none', border:'none', color:SKY_BLUE, cursor:'pointer', padding:'0.15rem', fontSize: '1.05rem', lineHeight:1, textDecoration:'underline' }}>Invoice</button>
                                  <button type="button" aria-label={`Open enrollment form for ${e.Full_Name || e.ID || 'student'}`} title="Open enrollment form" onClick={() => openEnrollmentForm(e)} style={{ background:'none', border:'none', color:GOLD_DEEP, cursor:'pointer', padding:'0.15rem', fontSize: '1.05rem', lineHeight:1, textDecoration:'underline' }}>Form</button>
                                  <button onClick={() => { setEnrollForm({ ID: e.ID || '', Status: e.Status || 'pending', Full_Name: e.Full_Name || '', Email: e.Email || '', 'Student Phone': e['Student Phone'] || '', Gender: e.Gender || '', Date_of_Birth: e.Date_of_Birth || '', Address: e.Address || '', City: e.City || '', State: e.State || '', Zip: e.Zip || '', Permit: e.Permit || '', Issue_Date: e.Issue_Date || '', Expire_Date: e.Expire_Date || '', Parent_Phone: e.Parent_Phone || '', Pickup_Address: e.Pickup_Address || '', Course_Name: e.Course_Name || '', Booking_Date: e.Booking_Date || '', Meds: e.Meds || '', Notes: e.Notes || '', Calender_booking_Id: e.Calender_booking_Id || '', Price: e.Price || '', Total: e.Total || '' }); setEnrollEdit(e._id) }} style={{ background:'none', border:'none', color:SKY_BLUE, cursor:'pointer', padding:'0.15rem', fontSize: '1.05rem', lineHeight:1, textDecoration:'underline' }}>Edit</button>
                                  <button onClick={() => requestConfirmation('Delete enrollment?', `${e.Full_Name || 'This enrollment'} will be permanently removed.`, () => deleteEnrollment(e._id))} style={{ background:'none', border:'none', color:'#DC2626', cursor:'pointer', padding:'0.15rem', fontSize: '1.05rem', lineHeight:1, textDecoration:'underline' }}>Delete</button>
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

              {!loading && !loadError && activeTab === 'refunds' && (
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
                        <input className="admin-toolbar-input" aria-label="Search refund records" type="search" placeholder="Search by name, email, course…" value={refundSearch} onChange={e => { setRefundSearch(e.target.value); setRefundPage(1) }} style={{ ...inputStyle, width: '220px' }} />
                        <select aria-label="Refund records per page" value={refundLimit} onChange={e => { setRefundLimit(e.target.value); setRefundPage(1) }} style={{ ...inputStyle, width: '90px', fontSize: '1.05rem' }}>
                          <option value="10">10 / page</option>
                          <option value="20">20 / page</option>
                          <option value="50">50 / page</option>
                        </select>
                        <button onClick={() => { setRefundForm({ Full_Name: '', Email: '', Phone: '', Course_Name: '', Amount: '', Reason: '', Status: 'pending' }); setRefundEdit('new') }} style={{ padding: '0.5rem 1rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>+ Add Refund</button>
                      </div>
                    </div>

                    <div role="note" style={{ marginBottom: '1rem', padding: '.8rem 1rem', border: '1px solid #BFDBFE', borderRadius: '12px', background: '#EFF6FF', color: '#1E3A8A', fontSize: '.9rem', lineHeight: 1.55 }}>
                      These are administrative records only. This dashboard does not transfer or return funds; payment processing will be connected separately.
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
                            <th style={{ ...thStyle, minWidth: '118px', whiteSpace: 'nowrap' }}>Date</th>
                            <th style={{ ...thStyle, minWidth: '150px', whiteSpace: 'nowrap' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {refundLoading ? (
                            <tr><td role="status" aria-live="polite" colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading refund records…</td></tr>
                          ) : refundError ? (
                            <tr><td role="alert" colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#B91C1C' }}>
                              <p style={{ margin: '0 0 .75rem' }}>{refundError}</p>
                              <button type="button" onClick={() => setRefundAttempt(value => value + 1)} style={{ padding: '.55rem .9rem', border: '1px solid #FCA5A5', borderRadius: '9px', background: '#fff', color: '#B91C1C', fontWeight: 800, cursor: 'pointer' }}>Try Again</button>
                            </td></tr>
                          ) : refunds.length === 0 ? (
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
                              <td style={{ ...tdStyle, minWidth: '118px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{r.created_at ? r.created_at.slice(0, 10) : '—'}</td>
                              <td style={{ ...tdStyle, minWidth: '150px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button onClick={() => { setRefundForm({ Full_Name: r.Full_Name || '', Email: r.Email || '', Phone: r.Phone || '', Course_Name: r.Course_Name || '', Amount: r.Amount || '', Reason: r.Reason || '', Status: r.Status || 'pending' }); setRefundEdit(r._id) }} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                  <button onClick={() => requestConfirmation('Delete refund record?', `${r.Full_Name || 'This record'} will be permanently removed. No funds are transferred by this action.`, () => deleteRefund(r._id))} style={{ background: 'none', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
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

              {!loading && !loadError && activeTab === 'maps' && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.map} Maps / Locations ({areas.length})</h3>
                    <button onClick={() => { setAreasForm({ name: '', map: '', icon: '', order: 0 }); setAreasEdit('new') }} style={{ padding: '0.5rem 1rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>+ Add Location</button>
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
                                  const mapResult = validateHttpsUrl(a.map, { googleMapsOnly: true })
                                  if (mapResult.error) {
                                    setMsg(`Cannot copy embed code: ${mapResult.error}`)
                                    setTimeout(() => setMsg(''), 3000)
                                    return
                                  }
                                  const code = makeEmbedCode(mapResult.value)
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
                                <button onClick={() => { setAreasForm({ name: a.name, map: a.map, icon: a.icon || '', order: Number(a.order) || 0 }); setAreasEdit(a._id) }} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                <button onClick={() => requestConfirmation('Delete location?', `${a.name || 'This location'} will be permanently removed.`, () => deleteArea(a._id))} style={{ background: 'none', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
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

              {!loading && !loadError && activeTab === 'socials' && (
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
                                <button onClick={() => requestConfirmation('Delete social link?', `${socialPlatformLabel(s.platform)} will be removed from the website.`, () => deleteSocial(s._id))} style={{ background: 'none', border: '1.5px solid #DC2626', color: '#DC2626', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
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

              {!loading && !loadError && activeTab === 'settings' && (
                <div style={cardStyle}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>{SVG.settings} Contact Information</h3>
                  {settingsMsg && (
                    <div role={settingsMsgIsError ? 'alert' : 'status'} aria-live="polite" style={{ padding: '0.75rem 1rem', background: settingsMsgIsError ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${settingsMsgIsError ? '#FECACA' : '#BBF7D0'}`, borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: settingsMsgIsError ? '#DC2626' : '#16A34A' }}>
                      {settingsMsg}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', maxWidth: '800px' }}>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Phone</label>
                      <input aria-label="Business phone" type="tel" autoComplete="tel" value={settings.phone} onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Email</label>
                      <input aria-label="Business email" type="email" autoComplete="email" value={settings.email} onChange={e => setSettings(prev => ({ ...prev, email: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Address</label>
                      <input aria-label="Street address" type="text" autoComplete="street-address" value={settings.address} onChange={e => setSettings(prev => ({ ...prev, address: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>City / State / ZIP</label>
                      <input aria-label="City, state, and ZIP code" type="text" value={settings.subaddress} onChange={e => setSettings(prev => ({ ...prev, subaddress: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Schedule Label</label>
                      <input aria-label="Schedule link label" type="text" value={settings.scheduleLabel} onChange={e => setSettings(prev => ({ ...prev, scheduleLabel: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Schedule Link</label>
                      <input aria-label="Schedule HTTPS URL" type="url" inputMode="url" autoComplete="url" value={settings.scheduleLink} onChange={e => setSettings(prev => ({ ...prev, scheduleLink: e.target.value }))} style={inputStyle} placeholder="https://example.com/schedule" />
                    </div>
                  </div>
                  <div style={{ marginTop: '1.5rem' }}>
                    <button disabled={settingsSaving} onClick={async () => {
                      const scheduleResult = validateHttpsUrl(settings.scheduleLink, { required: false })
                      if (scheduleResult.error) {
                        setSettingsMsg(`Failed: Schedule link — ${scheduleResult.error}`)
                        setTimeout(() => setSettingsMsg(''), 3500)
                        return
                      }
                      const email = String(settings.email || '').trim().toLowerCase()
                      if (email && !/^\S+@\S+\.\S+$/.test(email)) {
                        setSettingsMsg('Failed: Please enter a valid business email address.')
                        setTimeout(() => setSettingsMsg(''), 3500)
                        return
                      }
                      setSettingsSaving(true)
                      try {
                        const nextSettings = { ...settings, email, scheduleLink: scheduleResult.value }
                        await api.adminUpdateSettings(nextSettings)
                        setSettings(nextSettings)
                        setSettingsMsg('Settings saved.')
                        setTimeout(() => setSettingsMsg(''), 2000)
                      } catch {
                        setSettingsMsg('Failed to save settings.')
                        setTimeout(() => setSettingsMsg(''), 2000)
                      } finally {
                        setSettingsSaving(false)
                      }
                    }} style={{ padding: '0.75rem 2rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: settingsSaving ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)', opacity: settingsSaving ? .7 : 1 }}>
                      {settingsSaving ? 'Saving…' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              )}

              {!loading && !loadError && activeTab === 'account' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="admin-grid-responsive">
                  <div style={cardStyle}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>{SVG.shield} Profile</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                      {profilePhotoPreview ? <img src={profilePhotoPreview} alt="Profile preview" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #FDBC01', boxShadow: '0 0 20px rgba(253,188,1,0.35)', flexShrink: 0 }} /> : <div aria-label="Profile preview" style={{ width: '72px', height: '72px', borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, color: DARK, border: '2.5px solid #FDBC01', flexShrink: 0 }}>{initials}</div>}
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>Use a direct HTTPS image URL. The saved photo will appear in both the navbar and sidebar.</p>
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={labelStyle}>Display Name</label>
                      <input aria-label="Administrator display name" type="text" autoComplete="name" value={accName} onChange={e => setAccName(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label htmlFor="admin-profile-photo-url" style={labelStyle}>Secure Profile Image URL</label>
                      <input id="admin-profile-photo-url" type="url" inputMode="url" autoComplete="url" value={accPhoto} onChange={e => setAccPhoto(e.target.value)} style={inputStyle} placeholder={DEFAULT_ADMIN_PHOTO_URL} />
                      <p style={{ margin: '.45rem 0 0', color: '#64748B', fontSize: '.78rem', lineHeight: 1.5 }}>Leave this blank to use the default administrator image. Only HTTPS links are accepted.</p>
                    </div>
                    <button type="button" onClick={handleSaveProfile} disabled={accLoading} style={{ padding: '0.75rem 2rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: accLoading ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)', opacity: accLoading ? 0.6 : 1 }}>
                      {accLoading ? 'Saving…' : 'Save Profile'}
                    </button>
                  </div>

                  <div style={cardStyle}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>{SVG.settings} Email & Password</h3>
                    {hasPasswordProvider ? (
                      <>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem', lineHeight: 1.5 }}>Changing email or password requires your current password.</p>
                        <div style={{ marginBottom: '1.25rem' }}><label htmlFor="admin-account-email" style={labelStyle}>Admin Email</label><input id="admin-account-email" type="email" autoComplete="email" value={accEmail} onChange={e => setAccEmail(e.target.value)} style={inputStyle} /></div>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label htmlFor="admin-current-password" style={labelStyle}>Current Password</label>
                          <div style={{ position: 'relative' }}>
                            <input id="admin-current-password" type={showAccPass ? 'text' : 'password'} value={accPass} onChange={e => setAccPass(e.target.value)} style={{ ...inputStyle, paddingRight: '3rem' }} autoComplete="current-password" />
                            <button type="button" onClick={() => setShowAccPass(!showAccPass)} aria-label={showAccPass ? 'Hide current password' : 'Show current password'} style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', color: '#64748B' }}>{showAccPass ? 'Hide' : 'Show'}</button>
                          </div>
                        </div>
                        <button type="button" onClick={handleChangeEmail} disabled={accLoading || !accPass} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg,#FDBC01,#FFD54F)', color: DARK, border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(253,188,1,0.25)', opacity: accLoading || !accPass ? 0.6 : 1 }}>Save Email</button>
                        <div style={{ borderTop: '1px solid #E2EBF5', margin: '1.5rem 0' }} />
                        <div style={{ marginBottom: '1.25rem' }}>
                          <label htmlFor="admin-new-password" style={labelStyle}>New Password</label>
                          <div style={{ position: 'relative' }}>
                            <input id="admin-new-password" type={showAccNewPass ? 'text' : 'password'} value={accNewPass} onChange={e => setAccNewPass(e.target.value)} style={{ ...inputStyle, paddingRight: '3rem' }} autoComplete="new-password" placeholder="At least 6 characters" />
                            <button type="button" onClick={() => setShowAccNewPass(!showAccNewPass)} aria-label={showAccNewPass ? 'Hide new password' : 'Show new password'} style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', color: '#64748B' }}>{showAccNewPass ? 'Hide' : 'Show'}</button>
                          </div>
                          <p style={{ margin: '.5rem 0 0', color: '#64748B', fontSize: '.78rem', lineHeight: 1.5 }}>For security, your saved password is never displayed and this field will be empty after a reload.</p>
                        </div>
                        <button type="button" onClick={handleChangePassword} disabled={accLoading || !accPass || !accNewPass} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg,#FDBC01,#FFD54F)', color: DARK, border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(253,188,1,0.25)', opacity: accLoading || !accPass || !accNewPass ? 0.6 : 1 }}>Change Password</button>
                      </>
                    ) : (
                      <div role="note" style={{ padding: '1.1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', color: '#1E3A5F' }}>
                        <p style={{ margin: '0 0 .35rem', fontWeight: 800 }}>Managed by Google</p>
                        <p style={{ margin: 0, lineHeight: 1.6 }}>This administrator signed in with Google. Email and password security must be managed from the connected Google account.</p>
                      </div>
                    )}
                  </div>

                  {(accMsg || accErr) && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ padding: '0.85rem 1.1rem', background: accErr ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${accErr ? '#FECACA' : '#BBF7D0'}`, borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: accErr ? '#DC2626' : '#16A34A' }}>
                        {accErr || accMsg}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {contactEdit && (
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setContactEdit(null) }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '500px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 id="contact-dialog-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>Edit Contact</h3>
                      <button type="button" aria-label="Close contact editor" onClick={() => setContactEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>First Name</label>
                        <input autoFocus aria-label="Contact first name" type="text" value={contactForm.firstName} onChange={e => setContactForm(prev => ({ ...prev, firstName: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Last Name</label>
                        <input aria-label="Contact last name" type="text" value={contactForm.lastName} onChange={e => setContactForm(prev => ({ ...prev, lastName: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Phone</label>
                        <input aria-label="Contact phone" type="tel" value={contactForm.phone} onChange={e => setContactForm(prev => ({ ...prev, phone: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Email</label>
                        <input aria-label="Contact email" type="email" value={contactForm.email} onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Comments</label>
                      <textarea aria-label="Contact comments" rows="4" value={contactForm.comments} onChange={e => setContactForm(prev => ({ ...prev, comments: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Status</label>
                      <select aria-label="Contact status" value={contactForm.status} onChange={e => setContactForm(prev => ({ ...prev, status: e.target.value }))} style={inputStyle}>
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
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setPricingEdit(null) }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="pricing-dialog-title" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 id="pricing-dialog-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>
                        {pricingEdit === 'new' ? 'Add Pricing Plan' : 'Edit Pricing Plan'}
                      </h3>
                      <button type="button" aria-label="Close pricing editor" onClick={() => setPricingEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Plan Name *</label>
                        <input autoFocus aria-label="Plan name" type="text" value={pricingForm.planName} onChange={e => setPricingForm(prev => ({ ...prev, planName: e.target.value }))} style={inputStyle} />
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
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setAreasEdit(null) }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="area-dialog-title" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 id="area-dialog-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>{areasEdit === 'new' ? 'Add Location' : 'Edit Location'}</h3>
                      <button type="button" aria-label="Close location editor" onClick={() => setAreasEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Name *</label>
                        <input autoFocus aria-label="Location name" type="text" value={areasForm.name} onChange={e => setAreasForm(prev => ({ ...prev, name: e.target.value }))} style={inputStyle} placeholder="San Ramon" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Order</label>
                        <input type="number" value={areasForm.order} onChange={e => setAreasForm(prev => ({ ...prev, order: Number(e.target.value) }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Google Maps Embed URL *</label>
                      <textarea aria-label="Google Maps secure embed URL" rows="4" value={areasForm.map} onChange={e => setAreasForm(prev => ({ ...prev, map: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }} placeholder="https://www.google.com/maps/embed?pb=..." />
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#64748b', margin: '0.4rem 0 0', lineHeight: 1.5 }}>
                        In Google Maps, choose Share → Embed a map, then paste only the secure <code>src="https://…"</code> URL here.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setAreasEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={async () => {
                        if (!areasForm.name || !areasForm.map) { setMsg('Name and Map URL are required.'); setTimeout(() => setMsg(''), 2000); return }
                        const mapResult = validateHttpsUrl(areasForm.map, { googleMapsOnly: true })
                        if (mapResult.error) { setMsg(mapResult.error); setTimeout(() => setMsg(''), 3500); return }
                        const doc = { name: areasForm.name.trim(), map: mapResult.value, icon: areasForm.icon || '', order: areasForm.order || 0 }
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
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setSocialsEdit(null) }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="social-dialog-title" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '500px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 id="social-dialog-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>{socialsEdit === 'new' ? 'Add Social Link' : 'Edit Social Link'}</h3>
                      <button type="button" aria-label="Close social link editor" onClick={() => setSocialsEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Platform *</label>
                        <select autoFocus aria-label="Social platform" value={socialsForm.platform} onChange={e => setSocialsForm(prev => ({ ...prev, platform: e.target.value }))} style={inputStyle}>
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
                      <input aria-label="Social profile HTTPS URL" type="url" inputMode="url" autoComplete="url" value={socialsForm.url} onChange={e => setSocialsForm(prev => ({ ...prev, url: e.target.value }))} style={inputStyle} placeholder="https://facebook.com/yourpage" />
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#64748b', margin: '0.4rem 0 0', lineHeight: 1.5 }}>
                        Use the complete HTTPS address for this profile. Saving updates the website footer.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setSocialsEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={async () => {
                        if (!socialsForm.url) { setMsg('URL is required.'); setTimeout(() => setMsg(''), 2000); return }
                        const urlResult = validateHttpsUrl(socialsForm.url)
                        if (urlResult.error) { setMsg(urlResult.error); setTimeout(() => setMsg(''), 3500); return }
                        const doc = { platform: socialsForm.platform, url: urlResult.value, order: Number(socialsForm.order) || 0 }
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
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setRefundEdit(null) }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="refund-dialog-title" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 id="refund-dialog-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>{refundEdit === 'new' ? 'Add Refund Record' : 'Edit Refund Record'}</h3>
                      <button type="button" aria-label="Close refund editor" onClick={() => setRefundEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Student Name *</label>
                        <input autoFocus aria-label="Refund record student name" type="text" value={refundForm.Full_Name} onChange={e => setRefundForm(prev => ({ ...prev, Full_Name: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Amount *</label>
                        <input aria-label="Refund record amount" type="text" inputMode="decimal" value={refundForm.Amount} onChange={e => setRefundForm(prev => ({ ...prev, Amount: e.target.value }))} style={inputStyle} placeholder="$210" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Email</label>
                        <input aria-label="Refund record email" type="email" value={refundForm.Email} onChange={e => setRefundForm(prev => ({ ...prev, Email: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Phone</label>
                        <input aria-label="Refund record phone" type="tel" value={refundForm.Phone} onChange={e => setRefundForm(prev => ({ ...prev, Phone: e.target.value }))} style={inputStyle} />
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
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) setEnrollEdit(null) }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="enrollment-dialog-title" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 id="enrollment-dialog-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>{enrollEdit === 'new' ? 'Add Enrollment' : 'Edit Enrollment'}</h3>
                      <button type="button" aria-label="Close enrollment editor" onClick={() => setEnrollEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}>&times;</button>
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
                            <select aria-label={label.replace(' *', '')} value={enrollForm[k] || ''} onChange={e => setEnrollForm(prev => ({ ...prev, [k]: e.target.value }))} style={inputStyle}>
                              {opts.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input autoFocus={k === 'Full_Name'} aria-label={label.replace(' *', '')} type={type || 'text'} value={enrollForm[k] || ''} onChange={e => setEnrollForm(prev => ({ ...prev, [k]: e.target.value }))} style={inputStyle} placeholder={ph || ''} />
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
          </div>
        </div>
      </div>

      {confirmDialog && (
        <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 15000, display: 'grid', placeItems: 'center', padding: '1rem', background: 'rgba(10,22,40,0.68)', backdropFilter: 'blur(10px)' }} onClick={(event) => { if (event.target === event.currentTarget && !confirmDialog.busy) setConfirmDialog(null) }}>
          <div className="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-description" style={{ width: 'min(100%, 430px)', padding: '1.75rem', borderRadius: '18px', background: '#fff', border: '1px solid #E2EBF5', boxShadow: '0 30px 90px rgba(10,22,40,0.32)' }}>
            <div style={{ width: '46px', height: '46px', display: 'grid', placeItems: 'center', marginBottom: '1rem', borderRadius: '13px', background: '#FEF2F2', color: '#DC2626' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.7 2.4 17.4A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.6L13.7 3.7a2 2 0 0 0-3.4 0Z"/></svg>
            </div>
            <h2 id="admin-confirm-title" style={{ margin: '0 0 0.5rem', color: DARK, fontSize: '1.35rem', fontWeight: 800 }}>{confirmDialog.title}</h2>
            <p id="admin-confirm-description" style={{ margin: '0 0 1.4rem', color: '#64748b', fontSize: '0.92rem' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button autoFocus disabled={confirmDialog.busy} onClick={() => setConfirmDialog(null)} style={{ minHeight: '44px', padding: '0.65rem 1rem', border: '1px solid #CBD5E1', borderRadius: '10px', color: '#475569', background: '#fff', fontWeight: 800 }}>Cancel</button>
              <button disabled={confirmDialog.busy} onClick={runConfirmedAction} style={{ minWidth: '126px', minHeight: '44px', padding: '0.65rem 1rem', borderRadius: '10px', color: '#fff', background: '#DC2626', fontWeight: 800, boxShadow: '0 8px 20px rgba(220,38,38,0.2)' }}>{confirmDialog.busy ? 'Processing…' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
