import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRef, useCallback } from 'react'
import { signOut, updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { api, makeEmbedCode } from '../api'
import { DEFAULT_SOCIALS, SOCIAL_PLATFORMS, socialIcon, socialPlatformLabel } from '../socials'
import { usePageMeta } from '../usePageMeta'
import { DEFAULT_BOOKING_LOCATIONS, locationDistanceLabel } from '../locations'
import { AdminLiveSupportPanel } from '../components/LiveSupportPanels'
import AdminBlogPanel from '../components/AdminBlogPanel'
import AdminCouponsPanel from '../components/AdminCouponsPanel'
import AdminUserDetailsModal from '../components/AdminUserDetailsModal'
import PasswordInput from '../components/PasswordInput'
import AdminDeleteIconButton from '../components/AdminDeleteIconButton'
import ProfilePhotoUploader from '../components/ProfilePhotoUploader'

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

const BOOKING_STATUS_LABELS = {
  scheduled: 'Pending',
  confirmed: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

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

const bookingStudentName = (booking, account) => String(
  account ? adminUserName(account) : booking?.callerName || booking?.studentName || 'Phone caller'
).trim()

const bookingStudentContact = (booking, account) => String(
  account?.email || booking?.email || booking?.callerEmail || booking?.callerPhone || booking?.phone || 'No contact detail'
).trim()

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
  if (status === 'cancelled' || status === 'canceled') return { label: BOOKING_STATUS_LABELS.cancelled, color: '#B91C1C', background: '#FEF2F2', group: 'cancelled' }
  if (status === 'completed' || String(booking?.date || '') < today) return { label: BOOKING_STATUS_LABELS.completed, color: '#475569', background: '#F1F5F9', group: 'completed' }
  if (status === 'confirmed') return { label: BOOKING_STATUS_LABELS.confirmed, color: '#0755AE', background: '#EFF6FF', group: 'confirmed' }
  return { label: BOOKING_STATUS_LABELS.scheduled, color: '#9A6700', background: '#FFFBEB', group: 'scheduled' }
}

// Kept as inert compatibility values while the former manual calendar action is hidden.
const calendarOpenedBookings = []
const openBookingCalendar = () => {}

const courseStatusMeta = (course) => {
  const status = normalizeStatus(course?.status || 'enrolled')
  if (status === 'refund pending') return { label: 'Refund Pending', color: '#B45309', background: '#FFF7ED' }
  if (status === 'refunded') return { label: 'Refunded', color: '#7C3AED', background: '#F5F3FF' }
  if (status === 'cancelled' || status === 'canceled') return { label: 'Cancelled', color: '#B91C1C', background: '#FEF2F2' }
  if (status === 'completed') return { label: 'Completed', color: '#0755AE', background: '#EFF6FF' }
  return { label: course?.status || 'Enrolled', color: '#15803D', background: '#F0FDF4' }
}

const enrollmentStatusGroup = (course) => {
  const status = normalizeStatus(course?.status || 'enrolled')
  if (status === 'refund pending') return 'refund pending'
  if (status === 'refunded') return 'refunded'
  if (status === 'cancelled' || status === 'canceled') return 'cancelled'
  return 'active'
}

const courseEnrollmentFingerprint = (course) => String(
  course?.enrolledAt || course?.createdAt || course?.paymentRef || 'legacy-current-enrollment'
).trim().slice(0, 160)

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

const ADMIN_LESSON_TIMES = [
  '07:00 AM - 09:00 AM',
  '09:30 AM - 11:30 AM',
  '12:00 PM - 02:00 PM',
  '02:30 PM - 04:30 PM',
  '05:00 PM - 07:00 PM',
]

const isValidPlanAmount = (value) => {
  const raw = String(value || '').trim().replace(/[$,\s]/g, '')
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return false
  const amount = Number(raw)
  return Number.isFinite(amount) && amount >= 0 && amount <= 1_000_000
}
const normalizedCityKey = value => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

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
  coupon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 13.1 11.1 22.6a2 2 0 0 1-2.8 0L1.4 15.7a2 2 0 0 1 0-2.8L10.9 3.4A2 2 0 0 1 12.3 3H19a2 2 0 0 1 2 2v6.7a2 2 0 0 1-.4 1.4Z"/><circle cx="16" cy="8" r="1.5"/><path d="m7.5 15.5 7-7m-5.5 1h.01m4.99 5h.01"/></svg>,
  book: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="14" y2="11" /></svg>,
  map: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 20l-6 3V7l6-3 6 3 6-3v16l-6 3-6-3z" /><path d="M9 4v16M15 7v16" /></svg>,
  share: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>,
  refund: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>,
  star: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
}

function TablePager({ page, pages, total, label, onChange }) {
  const current = Math.min(Math.max(1, page), Math.max(1, pages))
  return <div className="admin-table-pager" aria-label={`${label} pagination`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginTop: '1rem' }}><span style={{ color: '#334155', fontSize: '.9rem' }}>Page {current} of {Math.max(1, pages)} · {total} {label}</span><div style={{ display: 'flex', gap: '.45rem' }}><button type="button" disabled={current <= 1} onClick={() => onChange(current - 1)} style={{ padding: '.5rem .8rem', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#fff', cursor: current <= 1 ? 'not-allowed' : 'pointer' }}>Previous</button><button type="button" disabled={current >= pages} onClick={() => onChange(current + 1)} style={{ padding: '.5rem .8rem', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#fff', cursor: current >= pages ? 'not-allowed' : 'pointer' }}>Next</button></div></div>
}

function AdminPhoneBookingModal({ users, onClose, onCreated }) {
  const [bookingFor, setBookingFor] = useState('registered')
  const [studentQuery, setStudentQuery] = useState('')
  const [studentId, setStudentId] = useState('')
  const [courseIndex, setCourseIndex] = useState('')
  const [callerName, setCallerName] = useState('')
  const [callerPhone, setCallerPhone] = useState('')
  const [callerEmail, setCallerEmail] = useState('')
  const [callerService, setCallerService] = useState('Phone booking — payment to confirm')
  const [date, setDate] = useState(localDateKey())
  const [timeSlot, setTimeSlot] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [availableTimes, setAvailableTimes] = useState([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const students = users.filter(account => account?.uid && account.isAdmin !== true)
  const query = studentQuery.trim().toLowerCase()
  const filteredStudents = students.filter(account => !query || [adminUserName(account), account.email, account.phone]
    .some(value => String(value || '').toLowerCase().includes(query)))
  const selectedStudent = students.find(account => account.uid === studentId)
  const activeCourses = (Array.isArray(selectedStudent?.courses) ? selectedStudent.courses : [])
    .filter(course => enrollmentStatusGroup(course) === 'active')
  const selectedCourse = courseIndex === '' ? null : activeCourses[Number(courseIndex)]

  useEffect(() => {
    let cancelled = false
    setAvailabilityLoading(true)
    setAvailabilityError('')
    api.getBookingAvailability(date)
      .then(result => {
        if (cancelled) return
        const nextTimes = Array.isArray(result?.availableTimes) ? result.availableTimes : []
        setAvailableTimes(nextTimes)
        setTimeSlot(current => nextTimes.includes(current) ? current : '')
      })
      .catch(loadError => {
        if (!cancelled) {
          setAvailableTimes([])
          setAvailabilityError(loadError?.message || 'Open lesson times could not be loaded.')
        }
      })
      .finally(() => { if (!cancelled) setAvailabilityLoading(false) })
    return () => { cancelled = true }
  }, [date])

  const submit = async event => {
    event.preventDefault()
    setError('')
    const isNewCaller = bookingFor === 'caller'
    if ((!isNewCaller && (!selectedStudent || !selectedCourse)) || (isNewCaller && (!callerName.trim() || !callerPhone.trim() || !callerService.trim())) || !date || !timeSlot) {
      setError(isNewCaller
        ? 'Enter the caller name, phone number, service, lesson date, and open lesson time.'
        : 'Choose a student, active course, lesson date, and open lesson time.')
      return
    }
    setSaving(true)
    try {
      const booking = await api.adminCreatePhoneBooking(isNewCaller
        ? {
            bookingFor: 'new-caller',
            callerName,
            callerPhone,
            callerEmail,
            callerService,
            date,
            timeSlot,
            adminNote,
          }
        : {
            userId: selectedStudent.uid,
            courseId: selectedCourse.id,
            enrollmentFingerprint: courseEnrollmentFingerprint(selectedCourse),
            date,
            timeSlot,
            adminNote,
          })
      onCreated(booking)
    } catch (saveError) {
      setError(saveError?.message || 'The phone booking could not be created.')
    } finally {
      setSaving(false)
    }
  }

  const fieldLabel = { display: 'block', marginBottom: '.35rem', color: '#334155', fontFamily: 'var(--font-mono)', fontSize: '.76rem', letterSpacing: '.09em', textTransform: 'uppercase', fontWeight: 800 }
  const field = { width: '100%', minHeight: '44px', boxSizing: 'border-box', padding: '.58rem .7rem', border: '1px solid #CBD5E1', borderRadius: '9px', background: '#fff', color: '#0F2747', fontFamily: 'var(--font-body)', fontSize: '.95rem' }
  return (
    <div className="admin-modal-backdrop" role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(10,22,40,.62)', backdropFilter: 'blur(10px)' }} onClick={event => { if (event.target === event.currentTarget && !saving) onClose() }}>
      <form role="dialog" aria-modal="true" aria-labelledby="phone-booking-title" onSubmit={submit} style={{ width: '100%', maxWidth: '710px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '18px', background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,.28)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.15rem' }}>
          <div><h3 id="phone-booking-title" style={{ margin: 0, color: DARK, fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>Create Phone Booking</h3><p style={{ margin: '.3rem 0 0', color: '#475569', lineHeight: 1.5 }}>Book an existing student or record a new caller who has not registered online yet.</p></div>
          <button type="button" aria-label="Close phone booking form" onClick={onClose} disabled={saving} style={{ border: 0, background: 'transparent', color: '#475569', fontSize: '1.8rem', lineHeight: 1, cursor: saving ? 'wait' : 'pointer' }}>&times;</button>
        </div>
        <div role="note" style={{ marginBottom: '1rem', padding: '.75rem .9rem', border: '1px solid #BFDBFE', borderRadius: '11px', background: '#EFF6FF', color: '#1E3A5F', lineHeight: 1.5, fontSize: '.9rem' }}><strong>Safe workflow:</strong> an existing student uses one lesson from their active course. A new phone caller creates a clearly marked <strong>Pending</strong> booking until staff confirms payment or registration. Both reserve the selected open time and sync to the connected school Google Calendar.</div>
        {error && <div role="alert" style={{ marginBottom: '1rem', padding: '.75rem .9rem', border: '1px solid #FECACA', borderRadius: '10px', background: '#FEF2F2', color: '#B91C1C', fontWeight: 750 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1rem' }}>
          <fieldset style={{ gridColumn: '1 / -1', margin: 0, padding: '.75rem', border: '1px solid #D7E4F2', borderRadius: '11px', background: '#F8FBFF' }}><legend style={{ padding: '0 .3rem', color: '#334155', fontFamily: 'var(--font-mono)', fontSize: '.76rem', letterSpacing: '.09em', textTransform: 'uppercase', fontWeight: 800 }}>Who is calling?</legend><div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap' }}><label style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem', color: '#173B67', fontWeight: 750, cursor: 'pointer' }}><input type="radio" name="phone-booking-for" checked={bookingFor === 'registered'} onChange={() => setBookingFor('registered')} /> Existing registered student</label><label style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem', color: '#173B67', fontWeight: 750, cursor: 'pointer' }}><input type="radio" name="phone-booking-for" checked={bookingFor === 'caller'} onChange={() => setBookingFor('caller')} /> New caller (no online account yet)</label></div></fieldset>
          {bookingFor === 'registered' ? <>
            <div style={{ gridColumn: '1 / -1' }}><label htmlFor="phone-booking-search" style={fieldLabel}>Find registered student</label><input id="phone-booking-search" value={studentQuery} onChange={event => setStudentQuery(event.target.value)} style={field} placeholder="Leave blank to see all students, or search by name, email, or phone" autoFocus /></div>
            <div><label htmlFor="phone-booking-student" style={fieldLabel}>Student *</label><select id="phone-booking-student" required value={studentId} onChange={event => { setStudentId(event.target.value); setCourseIndex('') }} style={field}><option value="">Choose a student</option>{filteredStudents.map(account => <option key={account.uid} value={account.uid}>{adminUserName(account)} — {account.email || account.phone || 'No contact detail'}</option>)}</select>{query && !filteredStudents.length && <p style={{ margin: '.35rem 0 0', color: '#B45309', fontSize: '.82rem' }}>No registered student matches that search. Clear the search to see everyone.</p>}</div>
            <div><label htmlFor="phone-booking-course" style={fieldLabel}>Active course *</label><select id="phone-booking-course" required value={courseIndex} disabled={!selectedStudent} onChange={event => setCourseIndex(event.target.value)} style={{ ...field, background: selectedStudent ? '#fff' : '#F8FAFC' }}><option value="">{selectedStudent ? 'Choose an active course' : 'Choose a student first'}</option>{activeCourses.map((course, index) => <option key={`${course.id}-${courseEnrollmentFingerprint(course)}-${index}`} value={index}>{course.title || course.planName || COURSE_MAP[course.id] || `Course ${course.id}`}</option>)}</select>{selectedStudent && !activeCourses.length && <p style={{ margin: '.35rem 0 0', color: '#B45309', fontSize: '.82rem' }}>This student has no active course that can receive a lesson.</p>}</div>
          </> : <>
            <div><label htmlFor="phone-caller-name" style={fieldLabel}>Caller full name *</label><input id="phone-caller-name" required value={callerName} onChange={event => setCallerName(event.target.value)} style={field} placeholder="Example: Maria Smith" autoFocus /></div>
            <div><label htmlFor="phone-caller-phone" style={fieldLabel}>Caller phone number *</label><input id="phone-caller-phone" required value={callerPhone} onChange={event => setCallerPhone(event.target.value)} style={field} placeholder="Example: +1 925 555 0100" /></div>
            <div><label htmlFor="phone-caller-email" style={fieldLabel}>Caller email (optional)</label><input id="phone-caller-email" type="email" value={callerEmail} onChange={event => setCallerEmail(event.target.value)} style={field} placeholder="Example: maria@email.com" /></div>
            <div><label htmlFor="phone-caller-service" style={fieldLabel}>Requested plan or service *</label><input id="phone-caller-service" required value={callerService} onChange={event => setCallerService(event.target.value)} style={field} placeholder="Example: Essential Plan" /></div>
          </>}
          <div><label htmlFor="phone-booking-date" style={fieldLabel}>Lesson date *</label><input id="phone-booking-date" required min={localDateKey()} type="date" value={date} onChange={event => setDate(event.target.value)} style={field} /></div>
          <div><label htmlFor="phone-booking-time" style={fieldLabel}>Open lesson time *</label><select id="phone-booking-time" required disabled={availabilityLoading || !availableTimes.length} value={timeSlot} onChange={event => setTimeSlot(event.target.value)} style={{ ...field, background: availabilityLoading ? '#F8FAFC' : '#fff' }}><option value="">{availabilityLoading ? 'Checking open times…' : availableTimes.length ? 'Choose an open time' : 'No open times'}</option>{availableTimes.map(time => <option key={time} value={time}>{time}</option>)}</select>{availabilityError && <p style={{ margin: '.35rem 0 0', color: '#B91C1C', fontSize: '.82rem' }}>{availabilityError}</p>}</div>
          <div style={{ gridColumn: '1 / -1' }}><label htmlFor="phone-booking-note" style={fieldLabel}>Internal note (optional)</label><textarea id="phone-booking-note" maxLength="500" value={adminNote} onChange={event => setAdminNote(event.target.value)} style={{ ...field, minHeight: '88px', resize: 'vertical' }} placeholder="Example: Called in by student; payment verified by staff." /></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.7rem', marginTop: '1.35rem' }}><button type="button" onClick={onClose} disabled={saving} style={{ minHeight: '42px', padding: '.6rem .9rem', border: '1px solid #CBD5E1', borderRadius: '9px', background: '#fff', color: '#334155', fontWeight: 800, cursor: saving ? 'wait' : 'pointer' }}>Cancel</button><button type="submit" disabled={saving || !timeSlot || (bookingFor === 'registered' ? !selectedStudent || !selectedCourse : !callerName.trim() || !callerPhone.trim() || !callerService.trim())} style={{ minHeight: '42px', padding: '.6rem 1rem', border: 0, borderRadius: '9px', background: saving || !timeSlot || (bookingFor === 'registered' ? !selectedStudent || !selectedCourse : !callerName.trim() || !callerPhone.trim() || !callerService.trim()) ? '#94A3B8' : `linear-gradient(135deg,${SKY_BLUE},#0A2A5E)`, color: '#fff', fontWeight: 900, cursor: saving || !timeSlot || (bookingFor === 'registered' ? !selectedStudent || !selectedCourse : !callerName.trim() || !callerPhone.trim() || !callerService.trim()) ? 'not-allowed' : 'pointer', boxShadow: '0 6px 17px rgba(1,69,168,.18)' }}>{saving ? 'Creating Booking…' : bookingFor === 'caller' ? 'Create Pending Phone Booking' : 'Create Upcoming Booking'}</button></div>
      </form>
    </div>
  )
}

function AdminReviewsPanel({ cardStyle, inputStyle, labelStyle, thStyle, tdStyle, requestConfirmation, setMessage }) {
  const emptyForm = { name: '', text: '', rating: 5, order: 0, published: true, imageUrl: '', imagePublicId: '' }
  const [reviews, setReviews] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [editingId, setEditingId] = useState('')
  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState('all')
  const [reviewPage, setReviewPage] = useState(1)
  const reviewLimit = 10
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadVersion, setLoadVersion] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    api.adminReviews()
      .then(data => { if (active) setReviews(Array.isArray(data) ? data : []) })
      .catch(loadError => { if (active) setError(loadError?.message || 'Reviews could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [loadVersion])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId('')
    setImageFile(null)
    setImagePreview('')
  }

  const chooseReviewImage = event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Choose a JPG, PNG, or WebP reviewer photo.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setMessage('Reviewer photo must be 4 MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImagePreview(String(reader.result || ''))
    reader.readAsDataURL(file)
    setImageFile(file)
  }

  const removeReviewImage = () => {
    setImageFile(null)
    setImagePreview('')
    setForm(current => ({ ...current, imageUrl: '', imagePublicId: '' }))
  }

  const saveReview = async event => {
    event.preventDefault()
    if (!form.name.trim() || !form.text.trim()) {
      setMessage('Reviewer name and review text are required.')
      return
    }
    setSaving(true)
    try {
      let uploadedImage = null
      if (imageFile) uploadedImage = await api.adminUploadReviewImage(imageFile)
      const payload = {
        ...form,
        ...(uploadedImage ? { imageUrl: uploadedImage.imageUrl, imagePublicId: uploadedImage.imagePublicId } : {}),
        name: form.name.trim(),
        text: form.text.trim(),
        rating: Number(form.rating),
        order: Number(form.order),
        published: Boolean(form.published),
      }
      if (editingId) await api.adminUpdateReview(editingId, payload)
      else await api.adminAddReview(payload)
      setMessage(editingId ? 'Customer review updated.' : 'Customer review added.')
      resetForm()
      setLoadVersion(value => value + 1)
    } catch (saveError) {
      setMessage(saveError?.message || 'Review could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = review => {
    setEditingId(String(review._id))
    setForm({ name: review.name || '', text: review.text || '', rating: Number(review.rating) || 5, order: Number(review.order) || 0, published: review.published !== false, imageUrl: review.imageUrl || '', imagePublicId: review.imagePublicId || '' })
    setImageFile(null)
    setImagePreview(review.imageUrl || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const togglePublished = async review => {
    try {
      await api.adminUpdateReview(review._id, { ...review, published: review.published === false })
      setMessage(review.published === false ? 'Review published on the Home page.' : 'Review hidden from the Home page.')
      setLoadVersion(value => value + 1)
    } catch (toggleError) {
      setMessage(toggleError?.message || 'Review visibility could not be changed.')
    }
  }

  const deleteReview = async review => {
    await api.adminDeleteReview(review._id)
    setMessage('Customer review deleted.')
    if (editingId === String(review._id)) resetForm()
    setLoadVersion(value => value + 1)
  }

  const matchedReviews = reviews.filter(review => {
    const query = search.trim().toLowerCase()
    return (!query || String(review.name || '').toLowerCase().includes(query) || String(review.text || '').toLowerCase().includes(query))
      && (visibility === 'all' || (visibility === 'published' ? review.published !== false : review.published === false))
  })
  const publishedCount = reviews.filter(review => review.published !== false).length
  const reviewPages = Math.max(1, Math.ceil(matchedReviews.length / reviewLimit))
  const safeReviewPage = Math.min(reviewPage, reviewPages)
  const filtered = matchedReviews.slice((safeReviewPage - 1) * reviewLimit, safeReviewPage * reviewLimit)

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <form onSubmit={saveReview} style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div><h2 style={{ margin: 0, color: DARK, fontFamily: 'var(--font-display)', fontSize: '1.35rem' }}>{editingId ? 'Edit Customer Review' : 'Add Customer Review'}</h2><p style={{ margin: '.35rem 0 0', color: '#334155' }}>Published reviews appear automatically in the Home page testimonial carousel.</p></div>
          <span style={{ padding: '.35rem .65rem', borderRadius: '999px', background: '#EFF6FF', color: '#0755AE', fontSize: '.8rem', fontWeight: 800 }}>{publishedCount} Published</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginBottom: '1rem', border: '1px solid #D9E4F2', borderRadius: '14px', background: 'linear-gradient(135deg,#F8FBFF,#FFFDF5)', flexWrap: 'wrap' }}>
          {imagePreview || form.imageUrl
            ? <img src={imagePreview || form.imageUrl} alt={`${form.name || 'Reviewer'} preview`} style={{ width: '78px', height: '78px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${GOLD}`, boxShadow: '0 8px 24px rgba(1,69,168,.14)' }} />
            : <div aria-label="Reviewer photo placeholder" style={{ width: '78px', height: '78px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#0755AE,#0A2A5E)', color: '#fff', border: `3px solid ${GOLD}`, fontSize: '1.2rem', fontWeight: 900 }}>{form.name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || '?'}</div>}
          <div style={{ flex: '1 1 260px' }}>
            <div style={{ ...labelStyle, marginBottom: '.3rem' }}>Reviewer Photo</div>
            <div style={{ color: '#475569', fontSize: '.9rem', lineHeight: 1.5 }}>Upload a clear square portrait. JPG, PNG or WebP, maximum 4 MB.</div>
            <div style={{ display: 'flex', gap: '.55rem', marginTop: '.65rem', flexWrap: 'wrap' }}>
              <label style={{ minHeight: '40px', padding: '.55rem .85rem', border: `1.5px solid ${SKY_BLUE}`, borderRadius: '9px', background: '#fff', color: SKY_BLUE, fontWeight: 850, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={chooseReviewImage} style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0 }} />{imagePreview || form.imageUrl ? 'Replace Photo' : 'Upload Photo'}</label>
              {(imagePreview || form.imageUrl) && <button type="button" onClick={removeReviewImage} style={{ minHeight: '40px', padding: '.55rem .85rem', border: '1px solid #FCA5A5', borderRadius: '9px', background: '#fff', color: '#B91C1C', fontWeight: 800, cursor: 'pointer' }}>Remove Photo</button>}
            </div>
          </div>
        </div>
        <div className="admin-grid-responsive" style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px', gap: '1rem' }}>
          <div><label htmlFor="review-name" style={labelStyle}>Reviewer Name</label><input id="review-name" maxLength={120} required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="Customer name" style={inputStyle} /></div>
          <div><label htmlFor="review-rating" style={labelStyle}>Rating</label><select id="review-rating" value={form.rating} onChange={event => setForm(current => ({ ...current, rating: Number(event.target.value) }))} style={inputStyle}>{[5,4,3,2,1].map(rating => <option key={rating} value={rating}>{rating} Star{rating === 1 ? '' : 's'}</option>)}</select></div>
          <div><label htmlFor="review-order" style={labelStyle}>Display Order</label><input id="review-order" type="number" min="0" max="10000" value={form.order} onChange={event => setForm(current => ({ ...current, order: event.target.value }))} style={inputStyle} /></div>
        </div>
        <div style={{ marginTop: '1rem' }}><label htmlFor="review-text" style={labelStyle}>Review Text</label><textarea id="review-text" required maxLength={1200} rows={5} value={form.text} onChange={event => setForm(current => ({ ...current, text: event.target.value }))} placeholder="Write the customer's testimonial…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} /><div style={{ textAlign: 'right', color: '#475569', fontSize: '.78rem', marginTop: '.25rem' }}>{form.text.length}/1200</div></div>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '.55rem', marginTop: '.75rem', color: '#334155', fontWeight: 800, cursor: 'pointer' }}><input type="checkbox" checked={form.published} onChange={event => setForm(current => ({ ...current, published: event.target.checked }))} />Publish on Home page</label>
        <div style={{ display: 'flex', gap: '.65rem', marginTop: '1.15rem', flexWrap: 'wrap' }}><button type="submit" disabled={saving} style={{ minHeight: '44px', padding: '.7rem 1.1rem', border: 0, borderRadius: '9px', background: `linear-gradient(135deg,${SKY_BLUE},#0A2A5E)`, color: '#fff', fontWeight: 850, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Review'}</button>{editingId && <button type="button" onClick={resetForm} style={{ minHeight: '44px', padding: '.7rem 1.1rem', border: '1px solid #CBD5E1', borderRadius: '9px', background: '#fff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Cancel Edit</button>}</div>
      </form>

      <div style={cardStyle}>
        <div className="admin-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}><h2 style={{ margin: 0, color: DARK, fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Customer Reviews ({filtered.length} of {reviews.length})</h2><div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}><input className="admin-toolbar-input" type="search" aria-label="Search reviews" placeholder="Search reviewer or text…" value={search} onChange={event => setSearch(event.target.value)} style={{ ...inputStyle, width: '240px' }} /><select aria-label="Filter review visibility" value={visibility} onChange={event => setVisibility(event.target.value)} style={{ ...inputStyle, width: '145px' }}><option value="all">All reviews</option><option value="published">Published</option><option value="draft">Draft</option></select></div></div>
        {error && <div role="alert" style={{ padding: '.85rem 1rem', marginBottom: '1rem', border: '1px solid #FECACA', borderRadius: '10px', background: '#FEF2F2', color: '#B91C1C', fontWeight: 750 }}>{error} <button type="button" onClick={() => setLoadVersion(value => value + 1)} style={{ marginLeft: '.6rem', border: 0, background: 'transparent', color: '#0755AE', fontWeight: 850, cursor: 'pointer' }}>Retry</button></div>}
        <div className="admin-table-wrap"><table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th scope="col" style={thStyle}>Display Order</th><th scope="col" style={thStyle}>Reviewer</th><th scope="col" style={thStyle}>Review Message</th><th scope="col" style={thStyle}>Star Rating</th><th scope="col" style={thStyle}>Website Visibility</th><th scope="col" className="admin-actions-cell" style={thStyle}>Manage Review</th></tr></thead><tbody>
          {filtered.map(review => <tr key={review._id}><td style={tdStyle}>{review.order ?? 0}</td><td style={{ ...tdStyle, fontWeight: 800, whiteSpace: 'nowrap' }}><div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>{review.imageUrl ? <img src={review.imageUrl} alt={`${review.name} reviewer`} loading="lazy" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #D9E4F2', boxShadow: '0 5px 14px rgba(15,45,87,.1)' }} /> : <span aria-hidden="true" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#0755AE,#0A2A5E)', color: '#fff', border: `2px solid ${GOLD}`, fontWeight: 900 }}>{String(review.name || '?').trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}</span>}<span>{review.name}</span></div></td><td style={{ ...tdStyle, minWidth: '280px', maxWidth: '520px', lineHeight: 1.5 }}>{review.text}</td><td style={{ ...tdStyle, whiteSpace: 'nowrap', color: GOLD_DEEP, fontWeight: 900 }}>{'★'.repeat(Number(review.rating) || 5)}<span style={{ color: '#CBD5E1' }}>{'★'.repeat(5 - (Number(review.rating) || 5))}</span></td><td style={tdStyle}><button type="button" onClick={() => togglePublished(review)} style={{ padding: '.3rem .6rem', border: `1px solid ${review.published !== false ? '#BBF7D0' : '#CBD5E1'}`, borderRadius: '999px', background: review.published !== false ? '#F0FDF4' : '#F8FAFC', color: review.published !== false ? '#15803D' : '#64748B', fontWeight: 800, cursor: 'pointer' }}>{review.published !== false ? 'Published' : 'Draft'}</button></td><td className="admin-actions-cell" style={tdStyle}><div style={{ display: 'flex', gap: '.4rem' }}><button type="button" onClick={() => startEdit(review)} style={{ padding: '.4rem .65rem', border: `1.5px solid ${SKY_BLUE}`, borderRadius: '8px', background: '#fff', color: SKY_BLUE, fontWeight: 800, cursor: 'pointer' }}>Edit</button><AdminDeleteIconButton label={`Delete customer review from ${review.name || 'customer'}`} title="Delete customer review" onClick={() => requestConfirmation('Delete customer review?', `${review.name}'s testimonial will be permanently removed.`, () => deleteReview(review))} /></div></td></tr>)}
          {!loading && !filtered.length && <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>{search || visibility !== 'all' ? 'No reviews match the selected filters.' : 'No customer reviews yet.'}</td></tr>}
          {loading && <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>Loading reviews…</td></tr>}
        </tbody></table></div><TablePager page={safeReviewPage} pages={reviewPages} total={matchedReviews.length} label="reviews" onChange={setReviewPage} />
      </div>
    </div>
  )
}

function AdminAvailabilityPanel({ cardStyle, inputStyle, thStyle, tdStyle, requestConfirmation, setMessage }) {
  const [dates, setDates] = useState([])
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [year, month] = localDateKey().split('-').map(Number)
    return new Date(year, month - 1, 1)
  })
  const [times, setTimes] = useState([])
  const [rows, setRows] = useState([])
  const [openDates, setOpenDates] = useState([])
  const [selected, setSelected] = useState([])
  const [bulkStatus, setBulkStatus] = useState('available')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState('10')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bookingLeadTimeDays, setBookingLeadTimeDays] = useState(0)
  const [leadTimeSaving, setLeadTimeSaving] = useState(false)
  const [loadVersion, setLoadVersion] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([
      api.adminAvailability({ page, limit, search, status }),
      api.adminBookingLeadTime(),
    ])
      .then(([data, leadTime]) => {
        if (!active) return
        setRows(Array.isArray(data?.items) ? data.items : [])
        setTotal(Number(data?.total) || 0)
        setPages(Math.max(1, Number(data?.pages) || 1))
        if (Number(data?.page) && Number(data.page) !== page) setPage(Number(data.page))
        setBookingLeadTimeDays(Number.isInteger(Number(leadTime?.days)) ? Number(leadTime.days) : 0)
        setSelected([])
      })
      .catch(loadError => { if (active) setError(loadError?.message || 'Availability could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, limit, search, status, loadVersion])

  const calendarYear = calendarMonth.getFullYear()
  const calendarMonthIndex = calendarMonth.getMonth()
  const calendarStartDay = new Date(calendarYear, calendarMonthIndex, 1).getDay()
  const calendarDayCount = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate()
  const todayKey = localDateKey()
  const [todayYear, todayMonth] = todayKey.split('-').map(Number)
  const currentMonthStart = new Date(todayYear, todayMonth - 1, 1)
  const openDateKeySet = new Set(openDates)
  const calendarDateKey = day => `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  useEffect(() => {
    let active = true
    const from = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-01`
    const to = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(calendarDayCount).padStart(2, '0')}`
    api.getAvailability({ from, to })
      .then(data => {
        if (!active) return
        const monthDates = data?.dates && typeof data.dates === 'object' ? data.dates : {}
        setOpenDates(Object.entries(monthDates)
          .filter(([, slots]) => Array.isArray(slots) && slots.some(slot => slot.status === 'available'))
          .map(([date]) => date))
      })
      .catch(() => { if (active) setOpenDates([]) })
    return () => { active = false }
  }, [calendarYear, calendarMonthIndex, calendarDayCount, loadVersion])

  const toggleDate = date => {
    if (date <= todayKey) return
    setDates(current => {
      if (current.includes(date)) return current.filter(item => item !== date)
      if (current.length >= 90) {
        setMessage('You can select up to 90 future dates at a time.')
        return current
      }
      return [...current, date].sort()
    })
  }
  const selectAvailableMonth = () => {
    const monthDates = Array.from({ length: calendarDayCount }, (_, index) => calendarDateKey(index + 1)).filter(date => date > todayKey)
    setDates(current => {
      const combined = [...new Set([...current, ...monthDates])].sort()
      if (combined.length > 90) setMessage('Only the first 90 future dates were selected. Save them before adding more.')
      return combined.slice(0, 90)
    })
  }

  const saveAvailability = async () => {
    if (!dates.length || !times.length) {
      setMessage('Select at least one future date and one lesson time.')
      return
    }
    setSaving(true)
    try {
      const result = await api.adminAddAvailability(dates, times)
      setMessage(`${result?.saved || dates.length * times.length} lesson slot${result?.saved === 1 ? '' : 's'} opened for student booking.`)
      setDates([])
      setTimes([])
      setPage(1)
      setLoadVersion(value => value + 1)
    } catch (saveError) {
      setMessage(saveError?.message || 'Availability could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const saveBookingLeadTime = async () => {
    const days = Number(bookingLeadTimeDays)
    if (!Number.isInteger(days) || days < 0 || days > 31) {
      setMessage('Choose a whole number from 0 to 31 days.')
      return
    }
    setLeadTimeSaving(true)
    try {
      const result = await api.adminUpdateBookingLeadTime(days)
      const savedDays = Number(result?.days) || 0
      setBookingLeadTimeDays(savedDays)
      setMessage(savedDays
        ? `Students cannot select lesson dates through ${result?.bookingBlockedThrough} (California time).`
        : 'Advance booking notice removed. Students can choose any available future date.')
    } catch (saveError) {
      setMessage(saveError?.message || 'Advance booking notice could not be saved.')
    } finally {
      setLeadTimeSaving(false)
    }
  }

  const updateSelected = async () => {
    if (!selected.length) {
      setMessage('Select at least one availability row first.')
      return
    }
    setSaving(true)
    try {
      await api.adminUpdateAvailabilityStatus(selected, bulkStatus)
      setMessage(bulkStatus === 'available'
        ? `${selected.length} selected slot${selected.length === 1 ? '' : 's'} opened for student booking.`
        : `${selected.length} selected slot${selected.length === 1 ? '' : 's'} blocked from student booking.`)
      setSelected([])
      setLoadVersion(value => value + 1)
    } catch (updateError) {
      setMessage(updateError?.message || 'Availability status could not be changed.')
    } finally {
      setSaving(false)
    }
  }

  const deleteSlot = async (row) => {
    await api.adminDeleteAvailability(row._id)
    setMessage('Lesson slot permanently removed from the availability calendar.')
    setLoadVersion(value => value + 1)
  }

  const statusStyle = (value) => ({
    available: { background: '#F0FDF4', color: '#15803D' },
    blocked: { background: '#FEF2F2', color: '#B91C1C' },
    held: { background: '#FFF7ED', color: '#B45309' },
    booked: { background: '#EFF6FF', color: '#0755AE' },
    expired: { background: '#F1F5F9', color: '#475569' },
    legacy: { background: '#FFF7ED', color: '#9A3412' },
  }[value] || { background: '#F1F5F9', color: '#475569' })
  const statusLabel = (value) => ({
    available: 'Available',
    blocked: 'Unavailable',
    held: 'Checkout in Progress',
    booked: 'Booked',
    expired: 'Past / Expired',
    legacy: 'Old Schedule — Remove',
  }[value] || value)
  const isManageable = (row) => row.date > localDateKey() && (row.status === 'available' || row.status === 'blocked')
  const isRemovable = (row) => isManageable(row) || (row.date > localDateKey() && row.status === 'legacy')
  const selectableRows = rows.filter(isManageable)
  const allSelected = selectableRows.length > 0 && selectableRows.every(row => selected.includes(String(row._id)))

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, color: DARK, fontFamily: 'var(--font-display)', fontSize: '1.35rem' }}>Open Lesson Availability</h2>
            <p style={{ margin: '.35rem 0 0', color: '#334155', lineHeight: 1.55 }}>Choose one or more future dates, select the lesson times, then save. Every lesson is 2 hours, followed by a protected 30-minute break.</p>
          </div>
          <span style={{ padding: '.35rem .65rem', borderRadius: '999px', background: '#EFF6FF', color: '#0755AE', fontWeight: 800, fontSize: '.8rem' }}>Pacific Time (California)</span>
        </div>
        <div className="admin-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,.8fr) minmax(320px,1.2fr)', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.6rem', marginBottom: '.55rem' }}>
              <span id="availability-calendar-label" style={{ fontWeight: 800, color: '#334155' }}>Select future dates</span>
              <span aria-live="polite" style={{ color: '#0755AE', fontSize: '.78rem', fontWeight: 800 }}>{dates.length} selected</span>
            </div>
            <div role="group" aria-labelledby="availability-calendar-label" style={{ padding: '.85rem', border: '1px solid #DCE6F2', borderRadius: '14px', background: 'linear-gradient(180deg,#F8FBFF,#fff)', boxShadow: '0 10px 28px rgba(15,35,70,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem', marginBottom: '.75rem' }}>
                <button type="button" aria-label="Previous month" disabled={calendarMonth <= currentMonthStart} onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))} style={{ width: '38px', height: '38px', border: '1px solid #D7E3F1', borderRadius: '10px', background: '#fff', color: DARK, fontSize: '1.25rem', cursor: calendarMonth <= currentMonthStart ? 'not-allowed' : 'pointer', opacity: calendarMonth <= currentMonthStart ? .4 : 1 }}>&lsaquo;</button>
                <strong style={{ color: DARK, fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
                <button type="button" aria-label="Next month" onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))} style={{ width: '38px', height: '38px', border: '1px solid #D7E3F1', borderRadius: '10px', background: '#fff', color: DARK, fontSize: '1.25rem', cursor: 'pointer' }}>&rsaquo;</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: '.3rem', textAlign: 'center' }}>
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(day => <span key={day} aria-hidden="true" style={{ padding: '.25rem 0', color: '#64748B', fontSize: '.68rem', fontWeight: 850 }}>{day.slice(0, 1)}</span>)}
                {Array.from({ length: calendarStartDay }, (_, index) => <span key={`blank-${index}`} />)}
                {Array.from({ length: calendarDayCount }, (_, index) => {
                  const day = index + 1
                  const date = calendarDateKey(day)
                  const alreadyOpen = openDateKeySet.has(date)
                  const disabled = date <= todayKey
                  const chosen = dates.includes(date)
                  const readableDate = new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                  return <button type="button" key={date} disabled={disabled} aria-pressed={chosen} aria-label={alreadyOpen ? `${chosen ? 'Remove' : 'Select'} ${readableDate}; already open for booking` : `${chosen ? 'Remove' : 'Select'} ${readableDate}`} title={alreadyOpen ? 'Already open for student booking' : undefined} onClick={() => toggleDate(date)} style={{ aspectRatio: '1', minWidth: 0, border: chosen ? `2px solid ${SKY_BLUE}` : alreadyOpen ? '1px solid #4ADE80' : '1px solid transparent', borderRadius: '10px', background: chosen ? 'linear-gradient(135deg,#0755AE,#2D7BE5)' : disabled ? 'transparent' : alreadyOpen ? '#DCFCE7' : '#fff', color: chosen ? '#fff' : disabled ? '#CBD5E1' : alreadyOpen ? '#15803D' : '#1E293B', fontWeight: chosen || alreadyOpen ? 900 : 750, cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: chosen ? '0 6px 14px rgba(7,85,174,.22)' : alreadyOpen ? 'inset 0 -3px 0 #BBF7D0' : disabled ? 'none' : '0 1px 4px rgba(15,35,70,.08)' }}>{day}</button>
                })}
              </div>
              <div aria-label="Calendar color guide" style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginTop: '.75rem', color: '#475569', fontSize: '.75rem', fontWeight: 750 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}><span aria-hidden="true" style={{ width: '13px', height: '13px', borderRadius: '4px', background: 'linear-gradient(135deg,#0755AE,#2D7BE5)' }} />Selected now</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem' }}><span aria-hidden="true" style={{ width: '13px', height: '13px', borderRadius: '4px', background: '#DCFCE7', border: '1px solid #4ADE80' }} />Already open</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', flexWrap: 'wrap', marginTop: '.8rem' }}>
                <button type="button" onClick={selectAvailableMonth} style={{ border: 0, background: 'transparent', color: '#0755AE', fontWeight: 850, cursor: 'pointer', padding: '.35rem' }}>Select all future dates this month</button>
                {!!dates.length && <button type="button" onClick={() => setDates([])} style={{ border: 0, background: 'transparent', color: '#B91C1C', fontWeight: 850, cursor: 'pointer', padding: '.35rem' }}>Clear all</button>}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.45rem', marginTop: '.75rem', minHeight: '32px' }}>
              {dates.map(date => <button type="button" key={date} onClick={() => setDates(current => current.filter(item => item !== date))} title="Remove date" style={{ border: '1px solid #BFDBFE', borderRadius: '999px', padding: '.35rem .6rem', background: '#EFF6FF', color: '#0755AE', fontWeight: 750, cursor: 'pointer' }}>{new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ×</button>)}
              {!dates.length && <span style={{ color: '#475569', fontSize: '.9rem' }}>No dates selected yet.</span>}
            </div>
          </div>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 800, color: '#334155', marginBottom: '.4rem' }}>Lesson times · 30-minute break between lessons</legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '.55rem' }}>
              {ADMIN_LESSON_TIMES.map(time => <label key={time} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.65rem .75rem', border: `1px solid ${times.includes(time) ? '#93C5FD' : '#E2E8F0'}`, borderRadius: '10px', background: times.includes(time) ? '#EFF6FF' : '#fff', color: '#1E293B', fontWeight: 700, cursor: 'pointer' }}><input type="checkbox" checked={times.includes(time)} onChange={() => setTimes(current => current.includes(time) ? current.filter(item => item !== time) : [...current, time])} />{time}</label>)}
            </div>
          </fieldset>
        </div>
        <section aria-labelledby="advance-booking-notice-heading" style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginTop: '1.25rem', padding: '1rem', border: '1px solid #FCD34D', borderRadius: '12px', background: 'linear-gradient(135deg,#FFFBEB,#FFF7ED)' }}>
          <div style={{ maxWidth: '650px' }}>
            <h3 id="advance-booking-notice-heading" style={{ margin: 0, color: '#92400E', fontSize: '1rem' }}>Minimum advance booking notice</h3>
            <p style={{ margin: '.35rem 0 0', color: '#78350F', lineHeight: 1.5, fontSize: '.9rem' }}>Choose how many calendar days from today students must wait before selecting a lesson date. For example, <strong>5</strong> blocks today and the next 5 California dates. Enter <strong>0</strong> to allow every available future date.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: '.6rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'grid', gap: '.35rem', color: '#78350F', fontWeight: 800, fontSize: '.8rem' }}>Days to block (0–31)
              <input aria-label="Days students must wait before booking" type="number" min="0" max="31" step="1" value={bookingLeadTimeDays} onChange={event => setBookingLeadTimeDays(event.target.value === '' ? '' : Number(event.target.value))} style={{ ...inputStyle, width: '150px', background: '#fff' }} />
            </label>
            <button type="button" disabled={leadTimeSaving} onClick={saveBookingLeadTime} style={{ minHeight: '44px', padding: '.7rem 1rem', border: 0, borderRadius: '9px', background: leadTimeSaving ? '#94A3B8' : '#B45309', color: '#fff', fontWeight: 850, cursor: leadTimeSaving ? 'wait' : 'pointer' }}>{leadTimeSaving ? 'Saving…' : 'Save Booking Notice'}</button>
          </div>
        </section>
        <div style={{ display: 'flex', gap: '.65rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button type="button" disabled={saving} onClick={saveAvailability} style={{ minHeight: '44px', padding: '.7rem 1.15rem', border: 0, borderRadius: '9px', background: `linear-gradient(135deg,${SKY_BLUE},#0A2A5E)`, color: '#fff', fontWeight: 850, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Opening Lesson Slots…' : 'Open Selected Dates & Times'}</button>
          <button type="button" disabled={saving} onClick={() => { setDates([]); setTimes([]) }} style={{ minHeight: '44px', padding: '.7rem 1.15rem', border: '1px solid #CBD5E1', borderRadius: '9px', background: '#fff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Reset</button>
        </div>
      </div>

      <div style={cardStyle}>
        <div className="admin-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div><h2 style={{ margin: 0, color: DARK, fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>Manage Lesson Slots ({total})</h2><p style={{ margin: '.25rem 0 0', color: '#334155', fontSize: '.9rem', lineHeight: 1.5 }}><strong>Available</strong> slots are visible to students. <strong>Unavailable</strong> closes an individual slot. Past, checkout-in-progress, and booked slots are read-only here.</p></div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <input className="admin-toolbar-input" type="search" aria-label="Search availability" placeholder="Search date or time…" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} style={{ ...inputStyle, width: '220px' }} />
            <select aria-label="Filter lesson slots by booking availability" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }} style={{ ...inputStyle, width: '225px' }}><option value="all">All Booking Availability Statuses</option><option value="manageable">Editable Future Slots</option><option value="available">Available</option><option value="blocked">Unavailable</option><option value="held">Checkout in Progress</option><option value="booked">Booked</option><option value="expired">Past / Expired</option><option value="legacy">Old Schedule — Remove</option></select>
            <select aria-label="Availability rows per page" value={limit} onChange={event => { setLimit(event.target.value); setPage(1) }} style={{ ...inputStyle, width: '90px' }}><option value="10">10 / page</option><option value="25">25 / page</option><option value="50">50 / page</option></select>
          </div>
        </div>
        <div aria-label="Bulk actions for selected lesson slots" style={{ padding: '.85rem', marginBottom: '1rem', border: '1px solid #D8E4F0', borderRadius: '12px', background: '#F8FBFF' }}>
          <div style={{ display: 'flex', gap: '.65rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'grid', gap: '.35rem' }}>
              <strong style={{ color: '#334155', fontSize: '.78rem' }}>1. Choose slots to open or close</strong>
              <button type="button" disabled={!selectableRows.length} onClick={() => setSelected(allSelected ? [] : selectableRows.map(row => String(row._id)))} style={{ minHeight: '42px', padding: '.6rem .9rem', border: '1px solid #93C5FD', borderRadius: '9px', background: allSelected ? '#EFF6FF' : '#fff', color: selectableRows.length ? '#0755AE' : '#94A3B8', fontWeight: 800, cursor: selectableRows.length ? 'pointer' : 'not-allowed' }}>{allSelected ? 'Clear Selected Slots' : `Select All Future Slots (${selectableRows.length})`}</button>
            </div>
            <div style={{ display: 'grid', gap: '.35rem' }}>
              <strong style={{ color: '#334155', fontSize: '.78rem' }}>2. Decide what students can do</strong>
              <select aria-label="Choose what students can do with selected lesson slots" value={bulkStatus} onChange={event => setBulkStatus(event.target.value)} style={{ ...inputStyle, width: '285px' }}><option value="available">Allow students to book</option><option value="blocked">Temporarily stop student booking</option></select>
            </div>
            <div style={{ display: 'grid', gap: '.35rem' }}>
              <strong style={{ color: '#334155', fontSize: '.78rem' }}>3. Save booking access</strong>
              <button type="button" disabled={saving || !selected.length} onClick={updateSelected} style={{ minHeight: '42px', padding: '.6rem .9rem', border: 0, borderRadius: '9px', background: selected.length ? SKY_BLUE : '#94A3B8', color: '#fff', fontWeight: 800, cursor: selected.length ? 'pointer' : 'not-allowed' }}>{saving ? 'Saving Booking Access…' : `Save Booking Access (${selected.length})`}</button>
            </div>
          </div>
          <p style={{ margin: '.65rem 0 0', color: selected.length ? '#166534' : '#64748B', fontSize: '.82rem', fontWeight: selected.length ? 800 : 600 }}>{selected.length ? `${selected.length} slot${selected.length === 1 ? '' : 's'} selected. Saving will only change whether students can book them.` : selectableRows.length ? 'Use this section only to allow or stop student booking. It does not change lesson dates or times.' : 'No editable slots are available on this page.'}</p>
          <p style={{ margin: '.35rem 0 0', color: '#475569', fontSize: '.8rem' }}><strong>Need to change a date or time?</strong> Remove the incorrect future slot, then create the correct slot in “Open Lesson Availability” above.</p>
        </div>
        {error && <div role="alert" style={{ padding: '.85rem 1rem', marginBottom: '1rem', border: '1px solid #FECACA', borderRadius: '10px', background: '#FEF2F2', color: '#B91C1C', fontWeight: 750 }}>{error} <button type="button" onClick={() => setLoadVersion(value => value + 1)} style={{ marginLeft: '.6rem', border: 0, background: 'transparent', color: '#0755AE', fontWeight: 850, cursor: 'pointer' }}>Retry</button></div>}
        <div className="admin-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th scope="col" style={{ ...thStyle, minWidth: '92px' }}><label style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem', cursor: selectableRows.length ? 'pointer' : 'not-allowed' }}><input aria-label="Select all editable lesson slots on this page" type="checkbox" disabled={!selectableRows.length} checked={allSelected} onChange={() => setSelected(allSelected ? [] : selectableRows.map(row => String(row._id)))} /><span>Select</span></label></th><th scope="col" style={thStyle}>Lesson Date</th><th scope="col" style={thStyle}>Lesson Time</th><th scope="col" style={thStyle}>Booking Availability Status</th><th scope="col" className="admin-actions-cell" style={thStyle}>Remove Slot</th></tr></thead>
            <tbody>
              {rows.map(row => { const meta = statusStyle(row.status); const manageable = isManageable(row); const removable = isRemovable(row); return <tr key={row._id}><td style={tdStyle}><input aria-label={`Select lesson slot on ${row.date} at ${row.time}`} type="checkbox" disabled={!manageable} checked={selected.includes(String(row._id))} onChange={() => setSelected(current => current.includes(String(row._id)) ? current.filter(id => id !== String(row._id)) : [...current, String(row._id)])} /></td><td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{new Date(`${row.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td><td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{row.time}</td><td style={tdStyle}><span style={{ ...meta, display: 'inline-flex', padding: '.25rem .55rem', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 800, whiteSpace: 'nowrap' }}>{statusLabel(row.status)}</span></td><td className="admin-actions-cell" style={tdStyle}><AdminDeleteIconButton disabled={!removable} label={`Remove lesson slot on ${row.date} at ${row.time}`} title={removable ? 'Remove this future lesson slot' : 'Past, checkout-in-progress, and booked slots cannot be removed'} onClick={() => requestConfirmation('Permanently remove this lesson slot?', `${row.date} at ${row.time} will be removed and will no longer appear in the student booking calendar.`, () => deleteSlot(row))} /></td></tr> })}
              {!loading && !rows.length && <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>{status === 'manageable' && !search ? 'No editable future slots yet. Create future availability above, or choose another status filter.' : search || status !== 'all' ? 'No availability matches the filters.' : 'No lesson availability has been created yet.'}</td></tr>}
              {loading && <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>Loading availability…</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginTop: '1rem' }}><span style={{ color: '#334155', fontSize: '.9rem' }}>Page {page} of {pages}</span><div style={{ display: 'flex', gap: '.45rem' }}><button type="button" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))} style={{ padding: '.5rem .8rem', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Previous</button><button type="button" disabled={page >= pages} onClick={() => setPage(value => Math.min(pages, value + 1))} style={{ padding: '.5rem .8rem', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#fff', cursor: page >= pages ? 'not-allowed' : 'pointer' }}>Next</button></div></div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  usePageMeta('Admin Panel — A Precision Driving School', 'A Precision Driving School admin panel.')
  const { user, refreshProfile, refreshAuthUser, authRevision } = useAuth()
  const navigate = useNavigate()
  const hasPasswordProvider = Boolean(user?.providerData?.some(provider => provider.providerId === 'password'))

  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState({ totalUsers: 0, totalBookings: 0, activeEnrollments: 0, upcomingBookings: 0, pendingContacts: 0, pendingRefunds: 0, unreadSupport: 0 })
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [contacts, setContacts] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [userDetailsDialog, setUserDetailsDialog] = useState(null)
  const [bookingSearch, setBookingSearch] = useState('')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')
  const bookingDataFilter = 'all'
  const [bookingPage, setBookingPage] = useState(1)
  const [bookingLimit, setBookingLimit] = useState('10')
  const [bookingStatusUpdating, setBookingStatusUpdating] = useState('')
  const [phoneBookingOpen, setPhoneBookingOpen] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [contactStatusFilter, setContactStatusFilter] = useState('all')
  const [contactPage, setContactPage] = useState(1)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [contactEdit, setContactEdit] = useState(null)
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', phone: '', email: '', comments: '', status: '' })
  const [settings, setSettings] = useState({ phone: '', email: '', address: '', subaddress: '', scheduleLabel: '', scheduleLink: '' })
  const [settingsMsg, setSettingsMsg] = useState('')
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [pricing, setPricing] = useState([])
  const [pricingSearch, setPricingSearch] = useState('')
  const [pricingUsageFilter, setPricingUsageFilter] = useState('all')
  const [pricingPage, setPricingPage] = useState(1)
  const [pricingEdit, setPricingEdit] = useState(null)
  const [pricingForm, setPricingForm] = useState({ planName: '', id: '', planPrice: '', planPriceTwo: '', option1: '', perm1: 'Select', option2: '', perm2: 'Select', option3: '', perm3: 'Select', option4: '', perm4: 'Select', option5: '', perm5: 'Select' })
  const [locations, setLocations] = useState(DEFAULT_BOOKING_LOCATIONS)
  const [locationEdit, setLocationEdit] = useState(null)
  const [locationForm, setLocationForm] = useState({ name: '', zipCode: '', distance: 'Near', order: 1 })
  const [locationSearch, setLocationSearch] = useState('')
  const [locationDistanceFilter, setLocationDistanceFilter] = useState('all')
  const [locationPage, setLocationPage] = useState(1)
  const [areas, setAreas] = useState([])
  const [areasEdit, setAreasEdit] = useState(null)
  const [areasForm, setAreasForm] = useState({ name: '', map: '', icon: '', order: 0 })
  const [copiedArea, setCopiedArea] = useState(null)
  const [areaSearch, setAreaSearch] = useState('')
  const [areaPage, setAreaPage] = useState(1)
  const [socials, setSocials] = useState([])
  const [socialsEdit, setSocialsEdit] = useState(null)
  const [socialsForm, setSocialsForm] = useState({ platform: 'facebook', url: '', order: 0 })
  const [socialSearch, setSocialSearch] = useState('')
  const [socialPage, setSocialPage] = useState(1)
  const [detailsDialog, setDetailsDialog] = useState(null)
  const [enrollPage, setEnrollPage] = useState(1)
  const [enrollLimit, setEnrollLimit] = useState('10')
  const [enrollSearch, setEnrollSearch] = useState('')
  const [enrollStatusFilter, setEnrollStatusFilter] = useState('all')
  const [refunds, setRefunds] = useState([])
  const [refundTotal, setRefundTotal] = useState(0)
  const [refundPage, setRefundPage] = useState(1)
  const [refundPages, setRefundPages] = useState(1)
  const [refundLimit, setRefundLimit] = useState('10')
  const [refundSearch, setRefundSearch] = useState('')
  const [refundStatusFilter, setRefundStatusFilter] = useState('all')
  const [refundStats, setRefundStats] = useState({ totalRequests: 0, totalRefunded: 0, totalAmount: 0, pending: 0 })
  const [refundLoading, setRefundLoading] = useState(false)
  const [refundError, setRefundError] = useState('')
  const [refundAttempt, setRefundAttempt] = useState(0)
  const [refundEdit, setRefundEdit] = useState(null)
  const [refundDetails, setRefundDetails] = useState(null)
  const [refundForm, setRefundForm] = useState({ Full_Name: '', Email: '', Phone: '', Course_Name: '', Amount: '', Reason: '', Status: 'pending' })
  const [accName, setAccName] = useState('')
  const [accPhoto, setAccPhoto] = useState('')
  const [accEmail, setAccEmail] = useState('')
  const [accPass, setAccPass] = useState('')
  const [accNewPass, setAccNewPass] = useState('')
  const [accMsg, setAccMsg] = useState('')
  const [accErr, setAccErr] = useState('')
  const [accLoading, setAccLoading] = useState(false)
  const [calendarIntegration, setCalendarIntegration] = useState({ configured: false, connected: false, connectedEmail: '', calendarId: 'primary', connectedAt: '', lastTestAt: '', lastError: '' })
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarMsg, setCalendarMsg] = useState('')
  const [calendarErr, setCalendarErr] = useState('')
  const [confirmDialog, setConfirmDialog] = useState(null)
  const previousFocusRef = useRef(null)
  const userDetailsRequestRef = useRef(0)

  const requestConfirmation = (title, message, action) => {
    setConfirmDialog({ title, message, action, busy: false })
  }
  const requestEditorClose = useCallback((label, close) => setConfirmDialog({ title: 'Discard unsaved changes?', message: `Close the ${label}? Any unsaved changes will be lost.`, action: close, busy: false }), [])

  const closeUserDetails = useCallback(() => {
    userDetailsRequestRef.current += 1
    setUserDetailsDialog(null)
  }, [])

  const openUserDetails = useCallback(async (account) => {
    if (!account?.uid) return
    const requestId = userDetailsRequestRef.current + 1
    userDetailsRequestRef.current = requestId
    setUserDetailsDialog({ user: account, data: null, loading: true, error: '' })
    try {
      const data = await api.adminUserDetails(account.uid)
      if (userDetailsRequestRef.current !== requestId) return
      setUserDetailsDialog({ user: account, data, loading: false, error: '' })
    } catch (error) {
      if (userDetailsRequestRef.current !== requestId) return
      setUserDetailsDialog({ user: account, data: null, loading: false, error: error?.message || 'The complete student profile could not be loaded.' })
    }
  }, [])

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
        const [s, u, b, c, st, p, l, a, so] = await Promise.all([
          api.adminStats(),
          api.adminUsers(),
          api.adminBookings(),
          api.adminContacts(),
          api.getSettings().catch(() => ({})),
          api.getPricing().catch(() => []),
          api.getLocations().catch(() => []),
          api.getAreas().catch(() => []),
          api.getSocials().catch(() => DEFAULT_SOCIALS),
        ])
        if (cancelled) return
        setStats(s || { totalUsers: 0, totalBookings: 0, activeEnrollments: 0, upcomingBookings: 0, pendingContacts: 0, pendingRefunds: 0, unreadSupport: 0 })
        setUsers(Array.isArray(u) ? u : [])
        setBookings(Array.isArray(b) ? b : [])
        setContacts(Array.isArray(c) ? c : [])
        setSettings(prev => ({ ...prev, ...st }))
        setPricing(Array.isArray(p) ? p : [])
        setLocations(Array.isArray(l) ? l : [])
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

  useEffect(() => {
    let cancelled = false
    const refreshNotificationCounts = () => {
      if (document.visibilityState === 'hidden') return
      api.adminStats()
        .then(nextStats => { if (!cancelled && nextStats) setStats(nextStats) })
        .catch(() => {})
    }
    const intervalId = window.setInterval(refreshNotificationCounts, 30_000)
    window.addEventListener('focus', refreshNotificationCounts)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshNotificationCounts)
    }
  }, [])

  const handleLogout = async () => { await signOut(auth); navigate('/') }

  useEffect(() => {
    if (user) {
      setAccName(user.displayName || '')
      setAccPhoto(user.photoURL || '')
      setAccEmail(user.email || '')
    }
  }, [user, authRevision])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'account' || params.has('calendar')) setActiveTab('account')
    if (params.get('calendar') === 'connected') setCalendarMsg('Google Calendar connected successfully. New active lessons will sync automatically.')
    if (params.get('calendar') === 'error') setCalendarErr(params.get('message') || 'Google Calendar connection failed. Please try again.')
    if (params.has('calendar') || params.has('tab')) {
      params.delete('calendar')
      params.delete('message')
      params.delete('tab')
      const query = params.toString()
      window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`)
    }
  }, [])

  const loadGoogleCalendar = useCallback(async () => {
    setCalendarLoading(true)
    setCalendarErr('')
    try {
      setCalendarIntegration(await api.adminGoogleCalendar())
    } catch (error) {
      setCalendarErr(error?.message || 'Google Calendar status could not be loaded.')
    } finally {
      setCalendarLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'account' || activeTab === 'bookings') loadGoogleCalendar()
  }, [activeTab, loadGoogleCalendar])

  const handleSaveProfile = async () => {
    setAccErr(''); setAccMsg(''); setAccLoading(true)
    try {
      const cur = auth.currentUser
      const displayName = accName.trim()
      if (!cur || !user?.uid) throw new Error('Your session has expired. Please sign in again.')
      if (!displayName) throw new Error('Display name is required.')
      const photoURL = accPhoto || cur.photoURL || ''
      await updateProfile(cur, { displayName })
      await api.saveUser(user.uid, {
        displayName,
        name: displayName,
        email: cur.email || accEmail.trim(),
        ...(photoURL ? { photoURL } : {}),
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

  const handleUploadProfilePhoto = async (file) => {
    setAccErr(''); setAccMsg(''); setAccLoading(true)
    try {
      if (!user?.uid) throw new Error('Your session has expired. Please sign in again.')
      const result = await api.uploadProfileImage(user.uid, file)
      const photoURL = result?.photoURL || ''
      if (!photoURL) throw new Error('The image service did not return a profile photo.')
      const refreshedUser = await refreshAuthUser()
      await refreshProfile(refreshedUser)
      setAccPhoto(photoURL)
      setUsers(previous => previous.map(account => account.uid === user.uid ? { ...account, photoURL } : account))
      setAccMsg('Profile photo uploaded successfully.')
      setTimeout(() => setAccMsg(''), 2500)
    } catch (error) {
      setAccErr(error?.message || 'The profile photo could not be uploaded.')
      throw error
    } finally {
      setAccLoading(false)
    }
  }

  const handleRemoveProfilePhoto = async () => {
    setAccErr(''); setAccMsg(''); setAccLoading(true)
    try {
      if (!user?.uid) throw new Error('Your session has expired. Please sign in again.')
      await api.removeProfileImage(user.uid)
      const refreshedUser = await refreshAuthUser()
      await refreshProfile(refreshedUser)
      setAccPhoto('')
      setUsers(previous => previous.map(account => account.uid === user.uid ? { ...account, photoURL: '' } : account))
      setAccMsg('Profile photo removed.')
      setTimeout(() => setAccMsg(''), 2500)
    } catch (error) {
      setAccErr(error?.message || 'The profile photo could not be removed.')
      throw error
    } finally {
      setAccLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setAccErr(''); setAccMsg(''); setAccLoading(true)
    try {
      const cur = auth.currentUser
      if (!cur || !user?.email) throw new Error('Your session has expired. Please sign in again.')
      if (!accPass) throw new Error('Current password is required.')
      if (accNewPass.length < 8) throw new Error('New password must be at least 8 characters.')
      if (accNewPass === accPass) throw new Error('New password must be different from your current password.')
      await reauthenticateWithCredential(cur, EmailAuthProvider.credential(cur.email, accPass))
      await updatePassword(cur, accNewPass)
      await refreshAuthUser()
      setAccPass(''); setAccNewPass('')
      setAccMsg('Password changed successfully. Use the new password the next time you sign in.')
      setTimeout(() => setAccMsg(''), 5000)
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') setAccErr('Password change failed: the current password is incorrect.')
      else if (e.code === 'auth/weak-password') setAccErr('Password change failed: the new password must be at least 8 characters.')
      else if (e.code === 'auth/requires-recent-login') setAccErr('Password change failed: please sign out, sign in again, and retry for security.')
      else if (e.code === 'auth/too-many-requests') setAccErr('Password change failed: too many attempts. Please wait a few minutes and try again.')
      else setAccErr(e.message ? `Password change failed: ${e.message}` : 'Password change failed. Please try again.')
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
      await cur.reload()
      if (String(cur.email || '').toLowerCase() !== nextEmail) {
        throw new Error('Firebase did not confirm the new email. Please try again.')
      }
      await cur.getIdToken(true)
      await api.saveUser(user.uid, { email: nextEmail })
      const refreshedUser = await refreshAuthUser()
      await refreshProfile(refreshedUser)
      setUsers(previous => previous.map(account => account.uid === user.uid
        ? { ...account, email: nextEmail }
        : account))
      setAccEmail(nextEmail)
      setAccPass('')
      setAccMsg(`Admin email changed successfully to ${nextEmail}. Use this address the next time you sign in.`)
      setTimeout(() => setAccMsg(''), 5000)
    } catch (e) {
      if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') setAccErr('Email change failed: the current password is incorrect.')
      else if (e.code === 'auth/email-already-in-use') setAccErr('Email change failed: this address is already in use.')
      else if (e.code === 'auth/invalid-email') setAccErr('Email change failed: enter a valid email address.')
      else if (e.code === 'auth/requires-recent-login') setAccErr('Email change failed: please sign out, sign in again, and retry for security.')
      else if (e.code === 'auth/operation-not-allowed') setAccErr('Email change failed: email changes are restricted by Firebase Authentication settings.')
      else if (e.code === 'auth/too-many-requests') setAccErr('Email change failed: too many attempts. Please wait a few minutes and try again.')
      else setAccErr(e.message ? `Email change failed: ${e.message}` : 'Email change failed. Please try again.')
    } finally {
      setAccLoading(false)
    }
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

  const handleEditUser = async (account) => {
    const currentName = adminUserName(account) || account.email || 'Student'
    const nextName = window.prompt('Edit the student display name', currentName)
    if (nextName === null) return
    const trimmedName = nextName.trim()
    if (!trimmedName) {
      setMsg('Display name cannot be empty.')
      setTimeout(() => setMsg(''), 2500)
      return
    }
    try {
      const payload = { displayName: trimmedName, name: trimmedName }
      if (account.email) payload.email = account.email
      if (account.phone) payload.phone = account.phone
      await api.adminUpdateUser(account.uid, payload)
      setUsers(previous => previous.map(item => item.uid === account.uid ? { ...item, ...payload } : item))
      setMsg('User profile updated.')
      setTimeout(() => setMsg(''), 2200)
    } catch (error) {
      setMsg(error?.message || 'User profile could not be updated.')
      setTimeout(() => setMsg(''), 2500)
    }
  }

  const handleDeleteUser = async (account) => {
    const name = adminUserName(account) || account.email || 'this student'
    requestConfirmation('Delete user account?', `Remove ${name} from the site records? This action also deletes the Firebase auth user and cannot be undone.`, async () => {
      await api.adminDeleteUser(account.uid)
      setUsers(previous => previous.filter(item => item.uid !== account.uid))
      setStats(previous => ({ ...previous, totalUsers: Math.max(0, previous.totalUsers - 1) }))
      setMsg('User account deleted.')
      setTimeout(() => setMsg(''), 2200)
    })
  }

  const handleEditEnrollment = async ({ account, course }) => {
    const currentTitle = course.title || COURSE_MAP[course.id] || 'Course'
    const nextTitle = window.prompt('Edit the enrolled course title', currentTitle)
    if (nextTitle === null) return
    const trimmedTitle = nextTitle.trim()
    if (!trimmedTitle) {
      setMsg('Course title cannot be empty.')
      setTimeout(() => setMsg(''), 2200)
      return
    }
    try {
      const enrollmentId = course.enrollmentId || course.id
      if (enrollmentId) {
        await api.adminUpdateEnrollment(enrollmentId, { title: trimmedTitle, status: course.status || 'active' })
      }
      setUsers(previous => previous.map(item => item.uid !== account.uid ? item : {
        ...item,
        courses: Array.isArray(item.courses)
          ? item.courses.map(entry => (entry.enrollmentId === course.enrollmentId || (entry.id === course.id && entry.enrolledAt === course.enrolledAt)) ? { ...entry, title: trimmedTitle } : entry)
          : item.courses,
      }))
      setMsg('Enrollment updated.')
      setTimeout(() => setMsg(''), 2200)
    } catch (error) {
      setMsg(error?.message || 'Enrollment could not be updated.')
      setTimeout(() => setMsg(''), 2500)
    }
  }

  const handleDeleteEnrollment = async ({ account, course }) => {
    const title = course.title || COURSE_MAP[course.id] || 'this course'
    const enrollmentId = course.enrollmentId || course.id
    requestConfirmation('Delete this enrollment?', `Remove ${adminUserName(account)}'s ${title} enrollment?`, async () => {
      if (enrollmentId) await api.adminDeleteEnrollment(enrollmentId)
      setUsers(previous => previous.map(item => item.uid !== account.uid ? item : {
        ...item,
        courses: Array.isArray(item.courses) ? item.courses.filter(entry => !(entry.enrollmentId === course.enrollmentId || (entry.id === course.id && entry.enrolledAt === course.enrolledAt))) : [],
      }))
      setMsg('Enrollment deleted.')
      setTimeout(() => setMsg(''), 2200)
    })
  }

  const updateBookingStatus = async (booking, status) => {
    const bookingId = String(booking?._id || '')
    if (!bookingId) return
    setBookingStatusUpdating(bookingId)
    try {
      const result = await api.adminUpdateBookingStatus(bookingId, status)
      setBookings(previous => previous.map(item => String(item._id) === bookingId
        ? { ...item, ...(result?.booking || {}), status }
        : item))
      const refreshedStats = await api.adminStats().catch(() => null)
      if (refreshedStats) setStats(refreshedStats)
      setMsg(`Booking status changed to “${BOOKING_STATUS_LABELS[status]}”.`)
    } catch (error) {
      setMsg(error?.message || 'Booking status could not be changed.')
    } finally {
      setBookingStatusUpdating('')
      setTimeout(() => setMsg(''), 3500)
    }
  }

  const handleBookingStatusChange = (booking, nextStatus) => {
    const current = bookingStatusMeta(booking, todayStr).group
    if (!nextStatus || nextStatus === current) return
    const linkedUser = users.find(item => item.uid === booking.userId)
    requestConfirmation(
      `Change status to “${BOOKING_STATUS_LABELS[nextStatus]}”?`,
      `${adminUserName(linkedUser)}’s lesson on ${booking.date || 'the selected date'} will be updated. ${nextStatus === 'cancelled' ? 'Cancelling is final and releases this lesson time for another student.' : nextStatus === 'completed' ? 'This records that the lesson has been completed.' : 'The lesson time remains reserved for this student.'}`,
      () => updateBookingStatus(booking, nextStatus),
    )
  }

  const handleConnectGoogleCalendar = async () => {
    setCalendarLoading(true)
    setCalendarErr('')
    setCalendarMsg('')
    try {
      const result = await api.adminConnectGoogleCalendar(calendarIntegration.connectedEmail || user?.email || 'info@aprecision.com')
      if (!result?.url) throw new Error('Google authorization link was not returned.')
      window.location.assign(result.url)
    } catch (error) {
      setCalendarErr(error?.message || 'Google Calendar connection could not be started.')
      setCalendarLoading(false)
    }
  }

  const handleTestGoogleCalendar = async () => {
    setCalendarLoading(true)
    setCalendarErr('')
    setCalendarMsg('')
    try {
      const result = await api.adminTestGoogleCalendar()
      setCalendarIntegration(previous => ({ ...previous, lastTestAt: result.testedAt, lastError: '' }))
      setCalendarMsg('Connection verified. Google Calendar is ready for new bookings.')
    } catch (error) {
      setCalendarErr(error?.message || 'Google Calendar connection test failed.')
      await loadGoogleCalendar()
    } finally {
      setCalendarLoading(false)
    }
  }

  const handleSyncUpcomingGoogleCalendar = async () => {
    setCalendarLoading(true)
    setCalendarErr('')
    setCalendarMsg('')
    try {
      const result = await api.adminSyncUpcomingGoogleCalendar()
      setCalendarMsg(`${result.count || 0} upcoming lesson${result.count === 1 ? '' : 's'} checked and synchronized. This also retries any previously failed event.`)
      await loadGoogleCalendar()
    } catch (error) {
      setCalendarErr(error?.message || 'Upcoming lessons could not be synchronized.')
    } finally {
      setCalendarLoading(false)
    }
  }

  const handleDisconnectGoogleCalendar = () => requestConfirmation(
    'Disconnect Google Calendar?',
    'New bookings will stop syncing. Existing events will remain in the Google Calendar and can still be managed there.',
    async () => {
      setCalendarLoading(true)
      setCalendarErr('')
      try {
        await api.adminDisconnectGoogleCalendar()
        setCalendarIntegration({ configured: true, connected: false, connectedEmail: '', calendarId: 'primary', connectedAt: '', lastTestAt: '', lastError: '' })
        setCalendarMsg('Google Calendar disconnected. Existing calendar events were kept.')
      } catch (error) {
        setCalendarErr(error?.message || 'Google Calendar could not be disconnected.')
      } finally {
        setCalendarLoading(false)
      }
    }
  )

  const handleSwitchGoogleCalendar = () => requestConfirmation(
    'Switch Google Calendar account?',
    'New bookings will sync to the newly approved account. Events already created in the current Google Calendar will remain there, so switch only when the client intentionally changes the school calendar.',
    handleConnectGoogleCalendar,
  )

  const handleDeleteBooking = (booking) => {
    const linkedUser = users.find(item => item.uid === booking.userId)
    requestConfirmation(
      'Delete booking?',
      `${linkedUser?.displayName || linkedUser?.email || 'This student'}'s ${booking.date || ''} ${TIME_SLOT_MAP[booking.timeSlot] || booking.timeSlot || ''} booking will be permanently removed and the package slot will become available again.`,
      () => deleteBooking(booking._id),
    )
  }

  const handlePhoneBookingCreated = async (booking) => {
    setBookings(previous => [booking, ...previous])
    setPhoneBookingOpen(false)
    setMsg(
      booking?.bookingSource === 'admin_phone_new_caller'
        ? 'Phone caller booking created as Pending. The time is reserved; confirm payment before changing it to Upcoming.'
        : 'Phone booking created as Upcoming. The lesson has been reserved and sent to the connected Google Calendar.'
    )
    setTimeout(() => setMsg(''), 4200)
    try {
      const nextStats = await api.adminStats()
      if (nextStats) setStats(nextStats)
    } catch {
      // The booking itself already succeeded. Dashboard counts will refresh on
      // the normal notification interval.
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

  const deletePricing = async (plan, enrolledCount = 0) => {
    try {
      await api.adminDeletePricing(plan._id, enrolledCount > 0)
      setPricing(prev => prev.filter(item => item._id !== plan._id))
      setMsg('Pricing plan deleted.')
    } catch (error) {
      setMsg(error?.message || 'Failed to delete pricing plan.')
    }
    setTimeout(() => setMsg(''), 2500)
  }

  const deleteRefund = async (id) => {
    const deletedRefund = refunds.find(item => String(item._id) === String(id))
    try {
      await api.adminDeleteRefund(id)
      setRefunds(prev => prev.filter(item => item._id !== id))
      setRefundTotal(prev => Math.max(0, prev - 1))
      if (normalizeStatus(deletedRefund?.Status || 'pending') === 'pending') {
        setRefundStats(previous => ({ ...previous, pending: Math.max(0, previous.pending - 1), totalRequests: Math.max(0, previous.totalRequests - 1) }))
        setStats(previous => ({ ...previous, pendingRefunds: Math.max(0, previous.pendingRefunds - 1) }))
      }
      setMsg('Refund record deleted.')
    } catch {
      setMsg('Failed to delete refund record.')
    }
    setTimeout(() => setMsg(''), 2500)
  }

  const persistRefund = async (doc) => {
    const result = await api.adminUpdateRefund(refundEdit, doc)
    if (result?.status === 'pending' && result?.providerStatus === 'PENDING') {
      setMsg('PayPal is processing the refund. Its status remains pending.')
    } else {
      setMsg(doc.Status === 'refunded' ? 'PayPal refund completed!' : doc.Status === 'denied' ? 'Refund request denied.' : 'Refund updated!')
    }
    setRefundEdit(null)
    setRefundAttempt(value => value + 1)
    setTimeout(() => setMsg(''), 4500)
  }

  const handleSaveRefund = async () => {
    if (!refundForm.Full_Name || !refundForm.Amount) {
      setMsg('Student Name and Amount are required.')
      setTimeout(() => setMsg(''), 2000)
      return
    }
    const doc = { ...refundForm, Status: refundEdit === 'new' ? 'pending' : refundForm.Status }
    try {
      if (refundEdit === 'new') {
        const result = await api.adminAddRefund(doc)
        if (result.ok) setRefunds(previous => [{ ...doc, _id: result._id }, ...previous])
        setRefundTotal(previous => previous + 1)
        setRefundStats(previous => ({ ...previous, pending: previous.pending + 1, totalRequests: previous.totalRequests + 1 }))
        setStats(previous => ({ ...previous, pendingRefunds: previous.pendingRefunds + 1 }))
        setRefundEdit(null)
        setMsg('Refund added!')
        setTimeout(() => setMsg(''), 3000)
        return
      }
      const current = refunds.find(refund => String(refund._id) === String(refundEdit))
      const currentStatus = normalizeStatus(current?.Status || 'pending')
      if (currentStatus === 'refunded' || currentStatus === 'denied') {
        setMsg(`This refund is already ${currentStatus} and can no longer be changed.`)
        return
      }
      if (doc.Status === 'refunded') {
        const reference = current?.PayPal_Reference || current?.PayPal_Capture_ID || 'Not available'
        requestConfirmation(
          'Issue PayPal refund?',
          `This will send ${doc.Amount || 'the approved amount'} through PayPal and cannot be undone here. PayPal reference: ${reference}.`,
          () => persistRefund(doc).catch(error => { setMsg(error?.message || 'PayPal refund could not be completed.'); setTimeout(() => setMsg(''), 4500) }),
        )
        return
      }
      if (doc.Status === 'denied') {
        requestConfirmation(
          'Deny refund request?',
          'This closes the refund request without returning funds. The decision cannot be changed from this dashboard.',
          () => persistRefund(doc).catch(error => { setMsg(error?.message || 'Refund decision could not be saved.'); setTimeout(() => setMsg(''), 4500) }),
        )
        return
      }
      await persistRefund(doc)
    } catch (error) {
      setMsg(error?.message || 'Failed to save refund.')
      setTimeout(() => setMsg(''), 4500)
    }
  }

  const deleteLocation = async (location, confirmedInUse = false) => {
    try {
      await api.adminDeleteLocation(location._id, confirmedInUse)
      setLocations(previous => previous.filter(item => item._id !== location._id))
      setMsg('Booking location deleted.')
    } catch (error) {
      setMsg(error?.message || 'Failed to delete booking location.')
    }
    setTimeout(() => setMsg(''), 2500)
  }

  const handleDeleteLocation = async (location) => {
    try {
      const usage = await api.adminLocationUsage(location._id)
      const total = Number(usage?.total || 0)
      const breakdown = [
        Number(usage?.enrollments || 0) ? `${usage.enrollments} enrollment${usage.enrollments === 1 ? '' : 's'}` : '',
        Number(usage?.carts || 0) ? `${usage.carts} saved cart selection${usage.carts === 1 ? '' : 's'}` : '',
        Number(usage?.bookings || 0) ? `${usage.bookings} booking${usage.bookings === 1 ? '' : 's'}` : '',
      ].filter(Boolean).join(', ')
      requestConfirmation(
        total > 0 ? 'Delete location currently in use?' : 'Delete booking location?',
        total > 0
          ? `${location.name} is referenced by ${breakdown || `${total} existing records`}. Historical records will keep the city name, but it will disappear from new booking selections. Confirm only if this is intentional.`
          : `${location.name || 'This city'} will no longer appear in new booking selections.`,
        () => deleteLocation(location, total > 0),
      )
    } catch (error) {
      setMsg(error?.message || 'Location usage could not be checked. Nothing was deleted.')
      setTimeout(() => setMsg(''), 3500)
    }
  }

  const deleteArea = async (id) => {
    try {
      await api.adminDeleteArea(id)
      setAreas(prev => prev.filter(item => item._id !== id))
      setMsg('Service area map deleted.')
    } catch {
      setMsg('Failed to delete service area map.')
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

  const activeDialogKey = confirmDialog ? 'confirmation'
    : userDetailsDialog ? 'user-details'
      : detailsDialog ? 'details'
    : contactEdit ? 'contact'
    : pricingEdit ? 'pricing'
      : locationEdit ? 'location'
        : areasEdit ? 'area'
          : socialsEdit ? 'social'
            : refundEdit ? 'refund'
              : refundDetails ? 'refund-details'
                : ''

  const closeActiveDialog = useCallback(() => {
    if (confirmDialog?.busy) return
    if (confirmDialog) setConfirmDialog(null)
    else if (userDetailsDialog) closeUserDetails()
    else if (detailsDialog) setDetailsDialog(null)
    else if (refundDetails) setRefundDetails(null)
    else if (refundEdit) requestEditorClose('refund editor', () => setRefundEdit(null))
    else if (socialsEdit) requestEditorClose('social link editor', () => setSocialsEdit(null))
    else if (areasEdit) requestEditorClose('map editor', () => setAreasEdit(null))
    else if (locationEdit) requestEditorClose('location editor', () => setLocationEdit(null))
    else if (pricingEdit) requestEditorClose('pricing editor', () => setPricingEdit(null))
    else if (contactEdit) requestEditorClose('contact editor', () => setContactEdit(null))
  }, [areasEdit, closeUserDetails, confirmDialog, contactEdit, detailsDialog, locationEdit, pricingEdit, refundDetails, refundEdit, requestEditorClose, socialsEdit, userDetailsDialog])

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
  const msgIsError = /failed|could not|cannot|required|invalid|blocked|no longer|unable|not found|no matching|select at least|please (enter|use|choose|select)/i.test(msg)
  const settingsMsgIsError = /failed|could not|cannot|required|invalid|please (enter|use)/i.test(settingsMsg)

  useEffect(() => {
    if (activeTab !== 'refunds') return
    let cancelled = false
    const load = async () => {
      setRefundLoading(true)
      setRefundError('')
      try {
        const params = { page: refundPage, limit: refundLimit }
        if (refundSearch) params.search = refundSearch
        if (refundStatusFilter !== 'all') params.status = refundStatusFilter
        const [list, stats] = await Promise.all([
          api.adminRefunds(params),
          api.adminRefundsStats(),
        ])
        if (cancelled) return
        setRefunds(Array.isArray(list.data) ? list.data : [])
        setRefundTotal(list.total || 0)
        setRefundPages(list.totalPages || 1)
        setRefundStats(stats || { totalRequests: 0, totalRefunded: 0, totalAmount: 0, pending: 0 })
        setStats(previous => ({ ...previous, pendingRefunds: Number(stats?.pending || 0) }))
      } catch (error) {
        if (!cancelled) setRefundError(error?.message || 'Refund records could not be loaded.')
      } finally {
        if (!cancelled) setRefundLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeTab, refundPage, refundLimit, refundSearch, refundStatusFilter, refundAttempt])

  const websiteUsers = users.filter(u => u.isAdmin !== true)
  const filteredUsers = websiteUsers.filter(u => {
    const q = userSearch.toLowerCase()
    return !q || adminUserName(u).toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').includes(q)
  })
  const userPages = Math.max(1, Math.ceil(filteredUsers.length / 10))
  const safeUserPage = Math.min(userPage, userPages)
  const visibleUsers = filteredUsers.slice((safeUserPage - 1) * 10, safeUserPage * 10)

  const enrollmentRows = websiteUsers.flatMap(account => (Array.isArray(account.courses) ? account.courses : [])
    .map((course, index) => ({
      account,
      course,
      key: course.enrollmentId || `${account.uid}-${course.id || 'course'}-${course.enrolledAt || index}`,
    })))
  const activeEnrollmentRows = enrollmentRows.filter(({ course }) => enrollmentStatusGroup(course) === 'active')
  const filteredPricing = pricing.filter(plan => {
    const query = pricingSearch.trim().toLowerCase()
    const usage = enrollmentRows.filter(({ course }) => String(course?.id || '') === String(plan.id || '')).length
    return (!query || [plan.id, plan.planName, plan.planPrice, plan.planPriceTwo, ...(plan.options || []).map(option => option?.text)].some(value => String(value || '').toLowerCase().includes(query)))
      && (pricingUsageFilter === 'all' || (pricingUsageFilter === 'used' ? usage > 0 : usage === 0))
  })
  const pricingPages = Math.max(1, Math.ceil(filteredPricing.length / 10))
  const safePricingPage = Math.min(pricingPage, pricingPages)
  const visiblePricing = filteredPricing.slice((safePricingPage - 1) * 10, safePricingPage * 10)
  const enrolledQuery = enrollSearch.trim().toLowerCase()
  const filteredEnrollmentRows = enrollmentRows.filter(({ account, course }) => {
    const matchesStatus = enrollStatusFilter === 'all' || enrollmentStatusGroup(course) === enrollStatusFilter
    const matchesSearch = !enrolledQuery || [
      adminUserName(account),
      account.email,
      account.phone,
      course.title,
      COURSE_MAP[course.id],
      course.city,
      course.status,
    ].some(value => String(value || '').toLowerCase().includes(enrolledQuery))
    return matchesStatus && matchesSearch
  })
  const enrollTotal = filteredEnrollmentRows.length
  const enrollPages = Math.max(1, Math.ceil(enrollTotal / Number(enrollLimit)))
  const safeEnrollPage = Math.min(enrollPage, enrollPages)
  const visibleEnrollmentRows = filteredEnrollmentRows.slice(
    (safeEnrollPage - 1) * Number(enrollLimit),
    safeEnrollPage * Number(enrollLimit),
  )
  const enrolledStudentCount = new Set(activeEnrollmentRows.map(row => row.account.uid)).size
  const enrolledPackageCount = new Set(activeEnrollmentRows.map(row => String(row.course.id || row.course.title || ''))).size

  const filteredBookings = bookings.filter(b => {
    const q = bookingSearch.toLowerCase()
    const u = users.find(ux => ux.uid === b.userId)
    const name = bookingStudentName(b, u).toLowerCase()
    const email = bookingStudentContact(b, u).toLowerCase()
    const course = String(COURSE_MAP[b.courseId] || b.courseTitle || b.courseId || '').toLowerCase()
    const matchesSearch = !q || name.includes(q) || email.includes(q) || course.includes(q) || String(b.date || '').toLowerCase().includes(q) || String(TIME_SLOT_MAP[b.timeSlot] || b.timeSlot || '').toLowerCase().includes(q)
    const group = bookingStatusMeta(b, todayStr).group
    const matchesStatus = bookingStatusFilter === 'all' || group === bookingStatusFilter
    return matchesSearch && matchesStatus
  }).sort((a, b) => bookingSortValue(a).localeCompare(bookingSortValue(b)))
  const bookingPages = Math.max(1, Math.ceil(filteredBookings.length / Number(bookingLimit)))
  const safeBookingPage = Math.min(bookingPage, bookingPages)
  const visibleBookings = filteredBookings.slice(
    (safeBookingPage - 1) * Number(bookingLimit),
    safeBookingPage * Number(bookingLimit),
  )

  const filteredContacts = contacts.filter(contact => {
    const q = contactSearch.trim().toLowerCase()
    const status = normalizeStatus(contact.status || 'new')
    const matchesSearch = !q || [contact.firstName, contact.lastName, contact.email, contact.phone, contact.comments]
      .some(value => String(value || '').toLowerCase().includes(q))
    const matchesStatus = contactStatusFilter === 'all' || status === contactStatusFilter
    return matchesSearch && matchesStatus
  })
  const contactPages = Math.max(1, Math.ceil(filteredContacts.length / 10))
  const safeContactPage = Math.min(contactPage, contactPages)
  const visibleContacts = filteredContacts.slice((safeContactPage - 1) * 10, safeContactPage * 10)

  const filteredLocations = [...locations]
    .filter(location => {
      const query = locationSearch.trim().toLowerCase()
      const distance = locationDistanceLabel(location.distance)
      return (!query || [location.name, location.zipCode].some(value => String(value || '').toLowerCase().includes(query)))
        && (locationDistanceFilter === 'all' || distance.toLowerCase() === locationDistanceFilter)
    })
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0) || String(a.name || '').localeCompare(String(b.name || '')))
  const locationPages = Math.max(1, Math.ceil(filteredLocations.length / 10))
  const safeLocationPage = Math.min(locationPage, locationPages)
  const visibleLocations = filteredLocations.slice((safeLocationPage - 1) * 10, safeLocationPage * 10)
  const filteredAreas = [...areas].filter(area => !areaSearch.trim() || [area.name, area.map].some(value => String(value || '').toLowerCase().includes(areaSearch.trim().toLowerCase())))
  const areaPages = Math.max(1, Math.ceil(filteredAreas.length / 10))
  const safeAreaPage = Math.min(areaPage, areaPages)
  const visibleAreas = filteredAreas.slice((safeAreaPage - 1) * 10, safeAreaPage * 10)
  const filteredSocials = [...socials].filter(item => !socialSearch.trim() || [socialPlatformLabel(item.platform), item.url].some(value => String(value || '').toLowerCase().includes(socialSearch.trim().toLowerCase())))
  const socialPages = Math.max(1, Math.ceil(filteredSocials.length / 10))
  const safeSocialPage = Math.min(socialPage, socialPages)
  const visibleSocials = filteredSocials.slice((safeSocialPage - 1) * 10, safeSocialPage * 10)

  const nearLocationCount = locations.filter(location => locationDistanceLabel(location.distance) === 'Near').length
  const longLocationCount = locations.filter(location => locationDistanceLabel(location.distance) === 'Long').length

  const recentBookings = [...bookings]
    .sort((a, b) => {
      const aUpcoming = ['scheduled', 'confirmed'].includes(bookingStatusMeta(a, todayStr).group)
      const bUpcoming = ['scheduled', 'confirmed'].includes(bookingStatusMeta(b, todayStr).group)
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
      return aUpcoming
        ? bookingSortValue(a).localeCompare(bookingSortValue(b))
        : bookingSortValue(b).localeCompare(bookingSortValue(a))
    })
    .slice(0, 5)


  const cardStyle = { background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid #E2EBF5', padding: '1.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }
  const labelStyle = { fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#334155', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }
  const thStyle = { fontFamily: 'var(--font-body)', fontSize: '0.95rem', letterSpacing: '0.01em', textTransform: 'none', lineHeight: 1.35, color: '#102F55', fontWeight: 900, padding: '1rem', textAlign: 'left', borderBottom: '1px solid #D8E4F0', WebkitFontSmoothing: 'antialiased' }
  const tdStyle = { fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#1a2332', padding: '0.75rem 1rem', borderBottom: '1px solid #f0f2f5' }
  const inputStyle = { width: '100%', padding: '0.65rem 0.8rem', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#1a2332', outline: 'none', boxSizing: 'border-box' }

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: SVG.dashboard },
    { id: 'users', label: 'Users', icon: SVG.users },
    { id: 'bookings', label: 'Bookings', icon: SVG.calendar },
    { id: 'calendar', label: 'Admin Calendar', icon: SVG.calendar },
    { id: 'contacts', label: 'Contacts', icon: SVG.mail },
    { id: 'live-support', label: 'Live Support', icon: SVG.mail, badge: stats.unreadSupport, badgeLabel: 'unread support message' },
    { id: 'enrolled', label: 'Enrolled Courses', icon: SVG.book },
    { id: 'refunds', label: 'Refunds', icon: SVG.refund, badge: stats.pendingRefunds, badgeLabel: 'pending refund request' },
    { id: 'reviews', label: 'Reviews', icon: SVG.star },
    { id: 'blogs', label: 'Blog', icon: SVG.book },
    { id: 'pricing', label: 'Pricing Plan', icon: SVG.dollar },
    { id: 'coupons', label: 'Coupon Codes', icon: SVG.coupon },
    { id: 'locations', label: 'Locations', icon: SVG.map },
    { id: 'maps', label: 'Maps', icon: SVG.map },
    { id: 'settings', label: 'Settings', icon: SVG.settings },
    { id: 'account', label: 'Admin Account', icon: SVG.shield },
  ]

  const switchTab = (tab) => { setActiveTab(tab); setSidebarOpen(false) }
  const handleSupportUnreadChange = useCallback(unread => {
    setStats(previous => previous.unreadSupport === unread ? previous : { ...previous, unreadSupport: unread })
  }, [])

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
        .admin-content-width { width:100%; max-width:1180px; margin-left:auto; margin-right:auto; }
        .admin-table-wrap { overflow:auto; border:1px solid #E2EBF5; border-radius:16px; background:#fff; box-shadow:0 10px 32px rgba(15,23,42,0.055); scrollbar-width:thin; scrollbar-color:#B8C8DC #F1F5F9; }
        .admin-table-wrap table { min-width:760px; }
        .admin-table-wrap thead th { position:sticky; top:0; z-index:3; background:linear-gradient(180deg,#F8FBFF 0%,#F1F6FC 100%); box-shadow:inset 0 -1px 0 #D8E4F0; white-space:nowrap; }
        .admin-table-wrap tbody tr { transition:background-color 0.18s ease,transform 0.18s ease; }
        .admin-table-wrap tbody tr:hover { background:#F8FBFF; }
        .admin-table-wrap tbody tr:last-child td { border-bottom:0 !important; }
        .admin-table-wrap button { min-height:34px; }
        .admin-actions-cell { position:sticky !important; right:0; z-index:2; background:#fff; box-shadow:-8px 0 14px rgba(15,23,42,.06); }
        thead .admin-actions-cell { z-index:5; background:#F7FAFE; }
        .admin-table-wrap tbody tr:hover .admin-actions-cell { background:#F8FBFF; }
        .refund-actions-cell { position:sticky !important; right:0; z-index:2; background:#fff; box-shadow:-8px 0 14px rgba(15,23,42,.06); }
        thead .refund-actions-cell { z-index:5; background:#F7FAFE; }
        .admin-table-wrap tbody tr:hover .refund-actions-cell { background:#F8FBFF; }
        .pricing-actions-cell { position:sticky !important; right:0; z-index:2; background:#fff; box-shadow:-8px 0 14px rgba(15,23,42,.06); }
        thead .pricing-actions-cell { z-index:5; background:#F7FAFE; }
        .admin-table-wrap tbody tr:hover .pricing-actions-cell { background:#F8FBFF; }
        .booking-actions-cell { position:sticky !important; right:0; z-index:2; background:#fff; box-shadow:-8px 0 14px rgba(15,23,42,.06); }
        thead .booking-actions-cell { z-index:5; background:#F7FAFE; }
        .admin-table-wrap tbody tr:hover .booking-actions-cell { background:#F8FBFF; }
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
        .admin-delete-icon-button:not(:disabled):hover { background:#FEF2F2 !important; color:#B91C1C !important; border-color:#B91C1C !important; box-shadow:0 7px 18px rgba(220,38,38,.14); transform:translateY(-1px); }
        .admin-main button:focus-visible,.admin-sidebar button:focus-visible { outline:3px solid rgba(253,188,1,.75); outline-offset:3px; }
        .admin-modal-backdrop button:focus-visible,.admin-confirm-dialog button:focus-visible { outline:3px solid rgba(1,69,168,.32); outline-offset:3px; }
        .admin-toolbar-input { width:min(100%,280px) !important; }
        .booking-toolbar-controls { flex-wrap:nowrap !important; flex:1 1 600px; min-width:0; }
        .booking-actions-cell button:disabled { display:none !important; }
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
          .booking-toolbar-controls { flex-wrap:wrap !important; }
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
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.88)', margin: 0 }}>{user?.email}</p>
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
                  <span style={{ display:'flex', alignItems:'center', gap:'.45rem' }}>{item.label}{item.badge > 0 && <span aria-label={`${item.badge} ${item.badgeLabel || 'notification'}${item.badge === 1 ? '' : 's'}`} title={`${item.badge} ${item.badgeLabel || 'notification'}${item.badge === 1 ? '' : 's'}`} style={{ minWidth:'20px', height:'20px', padding:'0 5px', display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:'999px', background:'#DC2626', color:'#fff', fontSize:'.68rem', fontWeight:900 }}>{item.badge > 99 ? '99+' : item.badge}</span>}</span>
                </button>
              ))}
            </nav>

            <div style={{ padding: '0.75rem', marginTop: 'auto' }}>
              <div className="admin-gold-line" />
              <button type="button" onClick={() => navigate('/dashboard?adminPreview=1')} aria-label="Preview the student portal while remaining signed in as administrator" className="admin-nav-item" style={{ marginBottom: '4px', marginTop: '0.5rem' }}>
                <div style={{ flexShrink: 0, width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{SVG.home}</div>
                <span>Preview Student Portal</span>
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
              <div className="admin-content-width">

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
                  <p style={{ margin: '0 auto 1.25rem', maxWidth: '540px', color: '#334155', lineHeight: 1.6 }}>{loadError}</p>
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
                      { num: stats.pendingContacts || 0, label: 'New Contact Messages', color: GOLD_DEEP, tab: 'contacts' },
                      { num: stats.pendingRefunds || 0, label: 'Pending Refunds', color: '#DC2626', tab: 'refunds' },
                    ].map(s => (
                      <button type="button" aria-label={`View ${s.label}`} onClick={() => switchTab(s.tab)} key={s.label} className="admin-stat" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid #E2EBF5', textAlign: 'center', padding: '1.5rem 1rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '0.3rem' }}>{s.num}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#334155', fontWeight: 600 }}>{s.label}</div>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="admin-grid-responsive">
                    <div style={cardStyle}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DARK, fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {SVG.users} Recent Users
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {websiteUsers.slice(0, 5).map(u => (
                          <div key={u.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: '#f8fafd', borderRadius: 'var(--radius-sm)', border: '1px solid #f0f2f5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                                {(adminUserName(u) || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: DARK, fontWeight: 600, margin: 0 }}>{adminUserName(u)}</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#334155', margin: '0.1rem 0 0' }}>{u.email || 'No email'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {websiteUsers.length === 0 && <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#334155', textAlign: 'center', padding: '1rem' }}>No users yet</p>}
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
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#334155', margin: '0.1rem 0 0' }}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {TIME_SLOT_MAP[b.timeSlot] || b.timeSlot}</p>
                              </div>
                              <span style={{ padding: '0.2rem 0.5rem', background: statusMeta.background, color: statusMeta.color, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{statusMeta.label}</span>
                            </div>
                          )
                        })}
                        {recentBookings.length === 0 && <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#334155', textAlign: 'center', padding: '1rem' }}>No bookings yet</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!loading && !loadError && activeTab === 'users' && (
                <div style={cardStyle}>
                  <div className="admin-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.users} Registered Users <span style={{ color: '#334155', fontSize: '.9rem', fontFamily: 'var(--font-body)', fontWeight: 700 }}>({filteredUsers.length} of {websiteUsers.length})</span></h3>
                      <p style={{ margin: '.35rem 0 0', color: '#334155', fontSize: '.9rem' }}>Every student account created on the website appears here.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <input className="admin-toolbar-input" aria-label="Search users" type="search" placeholder="Search by name, email, phone…" value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(1) }} style={{ ...inputStyle, width: '280px' }} />
                      {userSearch && <button type="button" onClick={() => setUserSearch('')} style={{ padding: '.58rem .75rem', border: '1px solid #CBD5E1', borderRadius: '9px', background: '#fff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Clear</button>}
                    </div>
                  </div>
                  <div className="admin-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th scope="col" style={thStyle}>Student Name</th>
                          <th scope="col" style={thStyle}>Login Email</th>
                          <th scope="col" style={thStyle}>Phone Number</th>
                          <th scope="col" style={thStyle}>Account Status</th>
                          <th scope="col" className="admin-actions-cell" style={thStyle}>User Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleUsers.map(u => (
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
                              <span style={{ display: 'inline-flex', padding: '.28rem .6rem', borderRadius: '999px', background: '#EFF6FF', color: '#0755AE', fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 800 }}>Registered</span>
                            </td>
                            <td className="admin-actions-cell" style={tdStyle}>
                              <div style={{ display: 'flex', gap: '.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <button type="button" onClick={() => openUserDetails(u)} aria-label={`View details for ${adminUserName(u)}`} style={{ minHeight: '40px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.48rem', padding: '.52rem .82rem', border: `1.5px solid ${SKY_BLUE}`, borderRadius: '9px', background: '#fff', color: SKY_BLUE, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 5px 14px rgba(1,69,168,.08)' }}>View Details <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
                                <button type="button" onClick={() => handleEditUser(u)} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                <AdminDeleteIconButton label={`Delete user ${adminUserName(u)}`} title="Delete user account" onClick={() => handleDeleteUser(u)} />
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>{userSearch ? 'No users match your search.' : 'No registered website users yet.'}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <TablePager page={safeUserPage} pages={userPages} total={filteredUsers.length} label="users" onChange={setUserPage} />
                </div>
              )}

              {!loading && !loadError && activeTab === 'bookings' && (
                <div style={cardStyle}>
                  <div className="admin-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.calendar} Bookings <span style={{ color: '#334155', fontSize: '.9rem', fontFamily: 'var(--font-body)', fontWeight: 700 }}>({filteredBookings.length} of {bookings.length})</span></h3>
                    <div className="booking-toolbar-controls" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setPhoneBookingOpen(true)} style={{ minHeight: '44px', flex: '0 0 auto', padding: '.58rem .82rem', border: 0, borderRadius: '9px', background: `linear-gradient(135deg,${SKY_BLUE},#0A2A5E)`, color: '#fff', fontWeight: 900, whiteSpace: 'nowrap', cursor: 'pointer', boxShadow: '0 5px 14px rgba(1,69,168,.18)' }}>+ Phone Booking</button>
                      <input className="admin-toolbar-input" aria-label="Search bookings" type="search" placeholder="Search student, plan, date, time…" value={bookingSearch} onChange={(e) => { setBookingSearch(e.target.value); setBookingPage(1) }} style={{ ...inputStyle, width: '260px', minWidth: '200px', flex: '1 1 260px' }} />
                      <select aria-label="Filter bookings by status" value={bookingStatusFilter} onChange={(event) => { setBookingStatusFilter(event.target.value); setBookingPage(1) }} style={{ ...inputStyle, width: '210px' }}>
                        <option value="all">All Booking Statuses</option>
                        <option value="scheduled">Pending</option>
                        <option value="confirmed">Upcoming</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <select aria-label="Booking rows per page" value={bookingLimit} onChange={event => { setBookingLimit(event.target.value); setBookingPage(1) }} style={{ ...inputStyle, width: '105px' }}><option value="10">10 / page</option><option value="25">25 / page</option><option value="50">50 / page</option></select>
                      {(bookingSearch || bookingStatusFilter !== 'all') && <button type="button" onClick={() => { setBookingSearch(''); setBookingStatusFilter('all'); setBookingPage(1) }} style={{ padding: '.58rem .75rem', border: '1px solid #CBD5E1', borderRadius: '9px', background: '#fff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Clear</button>}
                    </div>
                  </div>
                  <div role="note" aria-label="Booking status guide" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '.65rem', margin: '0 0 1rem', padding: '.85rem 1rem', border: '1px solid #D9E5F2', borderRadius: '13px', background: '#F8FBFF' }}>
                    {[
                      ['scheduled', 'Booking exists and is waiting for final confirmation.'],
                      ['confirmed', 'Lesson is confirmed, upcoming, and reserved.'],
                      ['completed', 'Lesson date has passed or the lesson is finished.'],
                      ['cancelled', 'Booking is closed and the lesson time is released.'],
                    ].map(([status, description]) => {
                      const meta = bookingStatusMeta({ status, date: status === 'completed' ? '2000-01-01' : '2999-01-01' }, todayStr)
                      return <div key={status} style={{ minWidth: 0 }}><span style={{ display: 'inline-flex', padding: '.28rem .62rem', borderRadius: '999px', color: meta.color, background: meta.background, fontSize: '.8rem', lineHeight: 1.25, fontWeight: 900, letterSpacing: '.035em', textTransform: 'uppercase' }}>{BOOKING_STATUS_LABELS[status]}</span><p style={{ margin: '.4rem 0 0', color: '#3F5874', fontSize: '.9rem', fontWeight: 600, lineHeight: 1.5 }}>{description}</p></div>
                    })}
                  </div>
                  <div role="note" style={{ display: 'flex', alignItems: 'flex-start', gap: '.85rem', margin: '0 0 1rem', padding: '1rem 1.1rem', borderRadius: '14px', border: '1px solid #BFDBFE', background: 'linear-gradient(135deg,#EFF6FF,#FFFFFF 62%,#FFFBEA)', color: '#1E3A5F' }}>
                    <div aria-hidden="true" style={{ width: '38px', height: '38px', display: 'grid', placeItems: 'center', flexShrink: 0, borderRadius: '11px', background: '#fff', border: '1px solid #D9E5F4', boxShadow: '0 5px 15px rgba(15,65,120,.1)' }}>
                      <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '1.25rem', fontWeight: 900, background: 'conic-gradient(from 10deg,#4285F4,#34A853,#FBBC05,#EA4335,#4285F4)', WebkitBackgroundClip: 'text', color: 'transparent' }}>G</span>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 900, color: '#0F3F79' }}>Automatic Google Calendar Sync</p>
                      <p style={{ margin: '.28rem 0 0', lineHeight: 1.55, fontSize: '.88rem' }}>{calendarIntegration.connected ? <>New bookings are added automatically to <strong>{calendarIntegration.connectedEmail}</strong>. Status changes update the event, while cancellation or deletion removes it.</> : <>Connect the school Google account once from <strong>Admin Account → Automatic Google Calendar Sync</strong>. No per-booking calendar button is required.</>}</p>
                    </div>
                  </div>
                  {bookingDataFilter === 'test' && <div role="note" style={{ margin: '0 0 1rem', padding: '.8rem 1rem', borderRadius: '12px', border: '1px solid #FED7AA', background: '#FFF7ED', color: '#9A3412', lineHeight: 1.55 }}><strong>Safe test-data review:</strong> these rows are potential admin, sandbox or example-account bookings. Verify each student and payment first, then use its individual Delete action; no bulk deletion is performed.</div>}
                  <div className="admin-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th scope="col" style={thStyle}>Student &amp; Plan</th>
                          <th scope="col" style={{ ...thStyle, minWidth: '190px', whiteSpace: 'nowrap' }}>Lesson Date</th>
                          <th scope="col" style={{ ...thStyle, minWidth: '190px', whiteSpace: 'nowrap' }}>Lesson Time</th>
                          <th scope="col" style={thStyle}>Booking Status</th>
                          <th scope="col" className="booking-actions-cell" style={{ ...thStyle, minWidth: '120px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleBookings.map(b => {
                          const u = users.find(ux => ux.uid === b.userId)
                          const statusMeta = bookingStatusMeta(b, todayStr)
                          const displayedTime = TIME_SLOT_MAP[b.timeSlot] || b.timeSlot || b.time || ''
                          const calendarUrl = ''
                          return (
                            <tr key={b._id}>
                              <td style={tdStyle}>
                                <div>
                                  <p style={{ fontWeight: 600, margin: 0 }}>{bookingStudentName(b, u)}{u?.isAdmin === true && <span style={{ marginLeft: '.45rem', padding: '.15rem .4rem', borderRadius: '999px', background: '#FFF7ED', color: '#B45309', fontFamily: 'var(--font-mono)', fontSize: '.62rem', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 900 }}>Admin/Test</span>}{b.bookingSource === 'admin_phone_new_caller' && <span style={{ marginLeft: '.45rem', padding: '.15rem .4rem', borderRadius: '999px', background: '#FFF7ED', color: '#B45309', fontFamily: 'var(--font-mono)', fontSize: '.62rem', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 900 }}>Phone Caller</span>}</p>
                                  <p style={{ fontSize: '0.95rem', color: '#334155', margin: '0.1rem 0 0' }}>{bookingStudentContact(b, u)}</p>
                                  <p style={{ fontSize: '0.85rem', color: SKY_BLUE, margin: '0.16rem 0 0', fontWeight: 700 }}>{COURSE_MAP[b.courseId] || b.courseTitle || (b.courseId ? `Plan ${b.courseId}` : 'Legacy / Unassigned')}</p>
                                </div>
                              </td>
                              <td style={{ ...tdStyle, minWidth: '190px', whiteSpace: 'nowrap' }}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                              <td style={{ ...tdStyle, minWidth: '190px', whiteSpace: 'nowrap' }}>{displayedTime}</td>
                              <td style={tdStyle}>
                                <select
                                  aria-label={`Change booking status for ${adminUserName(u)} on ${b.date || ''}`}
                                  title={statusMeta.group === 'cancelled' ? 'Cancelled is final because the lesson slot has been released.' : 'Change this booking status'}
                                  value={statusMeta.group}
                                  disabled={bookingStatusUpdating === String(b._id) || statusMeta.group === 'cancelled'}
                                  onChange={event => handleBookingStatusChange(b, event.target.value)}
                                  style={{ width: '100%', minWidth: '205px', minHeight: '44px', padding: '.52rem 2.15rem .52rem .75rem', border: `1px solid ${statusMeta.color}33`, borderRadius: '9px', background: statusMeta.background, color: statusMeta.color, fontFamily: 'var(--font-body)', fontSize: '.92rem', lineHeight: 1.35, fontWeight: 800, cursor: statusMeta.group === 'cancelled' ? 'not-allowed' : bookingStatusUpdating === String(b._id) ? 'wait' : 'pointer' }}
                                >
                                  <option value="scheduled">Pending</option>
                                  <option value="confirmed">Upcoming</option>
                                  <option value="completed" disabled={String(b.date || '') > todayStr}>Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="booking-actions-cell" style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'nowrap' }}>
                                  {calendarUrl ? (
                                    <button type="button" onClick={() => openBookingCalendar(b, calendarUrl)} aria-label={`Add ${b.date || ''} lesson for ${adminUserName(u) || u?.email || 'student'} to Google Calendar`} title={calendarOpenedBookings.includes(String(b._id || b.id || '')) ? 'This event was already opened on this browser. Opening again may create a duplicate.' : `Open the prefilled lesson in Google Calendar as ${user?.email || 'the school account'}`} style={{ minHeight: '36px', display: 'inline-flex', alignItems: 'center', gap: '.38rem', padding: '.38rem .68rem', borderRadius: '9px', border: '1px solid #93C5FD', background: calendarOpenedBookings.includes(String(b._id || b.id || '')) ? '#F8FAFC' : 'linear-gradient(135deg,#FFFFFF,#EFF6FF)', color: '#0755AE', fontFamily: 'var(--font-body)', fontSize: '.76rem', fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 3px 10px rgba(11,87,208,.08)', cursor: 'pointer' }}>
                                      <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4m8-4v4M3 10h18"/><path d="m9 15 2 2 4-4"/></svg>
                                      {calendarOpenedBookings.includes(String(b._id || b.id || '')) ? 'Open Again' : 'Add to Calendar'}
                                    </button>
                                  ) : (
                                    <button type="button" disabled aria-label={`Calendar action unavailable for ${statusMeta.label.toLowerCase()} booking`} title={`Calendar action is unavailable because this booking is ${statusMeta.label.toLowerCase()}.`} style={{ minHeight: '36px', display: 'inline-flex', alignItems: 'center', gap: '.38rem', padding: '.38rem .68rem', borderRadius: '9px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#94A3B8', fontSize: '.76rem', fontWeight: 800, cursor: 'not-allowed', whiteSpace: 'nowrap' }}>
                                      <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4m8-4v4M3 10h18"/></svg>
                                      Calendar unavailable
                                    </button>
                                  )}
                                  <AdminDeleteIconButton
                                    label={`Delete ${b.date || ''} booking for ${adminUserName(u) || u?.email || 'student'}`}
                                    title="Delete booking"
                                    onClick={() => handleDeleteBooking(b)}
                                    style={{ width: '38px', height: '38px', minWidth: '38px' }}
                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {filteredBookings.length === 0 && (
                          <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>{bookingSearch || bookingStatusFilter !== 'all' || bookingDataFilter !== 'all' ? 'No bookings match the selected filters.' : 'No bookings yet.'}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <TablePager page={safeBookingPage} pages={bookingPages} total={filteredBookings.length} label="bookings" onChange={setBookingPage} />
                </div>
              )}

              {!loading && !loadError && activeTab === 'calendar' && (
                <AdminAvailabilityPanel
                  cardStyle={cardStyle}
                  inputStyle={inputStyle}
                  thStyle={thStyle}
                  tdStyle={tdStyle}
                  requestConfirmation={requestConfirmation}
                  setMessage={message => { setMsg(message); window.setTimeout(() => setMsg(''), 3200) }}
                />
              )}

              {!loading && !loadError && activeTab === 'reviews' && (
                <AdminReviewsPanel
                  cardStyle={cardStyle}
                  inputStyle={inputStyle}
                  labelStyle={labelStyle}
                  thStyle={thStyle}
                  tdStyle={tdStyle}
                  requestConfirmation={requestConfirmation}
                  setMessage={message => { setMsg(message); window.setTimeout(() => setMsg(''), 3200) }}
                />
              )}

              {!loading && !loadError && activeTab === 'live-support' && <AdminLiveSupportPanel onUnreadChange={handleSupportUnreadChange} />}

              {!loading && !loadError && activeTab === 'blogs' && (
                <AdminBlogPanel
                  cardStyle={cardStyle}
                  inputStyle={inputStyle}
                  labelStyle={labelStyle}
                  thStyle={thStyle}
                  tdStyle={tdStyle}
                  requestConfirmation={requestConfirmation}
                  setMessage={message => { setMsg(message); window.setTimeout(() => setMsg(''), 3200) }}
                />
              )}

              {!loading && !loadError && activeTab === 'contacts' && (
                <div style={cardStyle}>
                  <div className="admin-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.mail} Contact Messages <span style={{ color: '#334155', fontSize: '.9rem', fontFamily: 'var(--font-body)', fontWeight: 700 }}>({filteredContacts.length} of {contacts.length})</span></h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <input className="admin-toolbar-input" aria-label="Search contact messages" type="search" placeholder="Search name, email, message…" value={contactSearch} onChange={(event) => { setContactSearch(event.target.value); setContactPage(1) }} style={{ ...inputStyle, width: '280px' }} />
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
                          <th scope="col" style={thStyle}>Contact Name</th>
                          <th scope="col" style={thStyle}>Phone Number</th>
                          <th scope="col" style={thStyle}>Email Address</th>
                          <th scope="col" style={thStyle}>Contact Message</th>
                          <th scope="col" style={thStyle}>Message Status</th>
                          <th scope="col" style={thStyle}>Received On</th>
                          <th scope="col" className="admin-actions-cell" style={thStyle}>Manage Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleContacts.map(c => (
                          <tr key={c._id}>
                            <td style={tdStyle}><span style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</span></td>
                            <td style={tdStyle}>{c.phone}</td>
                            <td style={tdStyle}>{c.email}</td>
                            <td style={{ ...tdStyle, maxWidth: '220px' }}><button type="button" aria-label={`View full message from ${c.firstName || ''} ${c.lastName || ''}`} onClick={() => setDetailsDialog({ title: 'Contact Message', subtitle: `${c.firstName || ''} ${c.lastName || ''}`.trim(), content: c.comments || '—' })} style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: 0, background: 'transparent', padding: 0, color: SKY_BLUE, textDecoration: 'underline', cursor: 'pointer', textAlign: 'left' }}>{c.comments || '—'}</button></td>
                            <td style={tdStyle}>
                              <span style={{ padding: '0.2rem 0.5rem', background: normalizeStatus(c.status || 'new') === 'new' ? '#EFF6FF' : normalizeStatus(c.status) === 'read' ? '#FFF7ED' : '#F0FDF4', color: normalizeStatus(c.status || 'new') === 'new' ? SKY_BLUE : normalizeStatus(c.status) === 'read' ? '#B45309' : '#15803D', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>{c.status || 'new'}</span>
                            </td>
                            <td style={tdStyle}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                            <td className="admin-actions-cell" style={tdStyle}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => handleEditContact(c)} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                <AdminDeleteIconButton label={`Delete contact message from ${c.firstName || ''} ${c.lastName || ''}`.trim()} title="Delete contact message" onClick={() => handleDeleteContact(c._id)} />
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredContacts.length === 0 && (
                          <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>{contactSearch || contactStatusFilter !== 'all' ? 'No messages match the selected filters.' : 'No contact messages yet.'}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <TablePager page={safeContactPage} pages={contactPages} total={filteredContacts.length} label="messages" onChange={setContactPage} />
                </div>
              )}

              {!loading && !loadError && activeTab === 'pricing' && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.dollar} Pricing Plan ({pricing.length})</h3>
                    <button onClick={() => { setPricingForm({ planName: '', id: '', planPrice: '', planPriceTwo: '', option1: '', perm1: 'Select', option2: '', perm2: 'Select', option3: '', perm3: 'Select', option4: '', perm4: 'Select', option5: '', perm5: 'Select' }); setPricingEdit('new') }} style={{ padding: '0.5rem 1rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>+ Add Pricing Plan</button>
                  </div>
                  <div role="note" style={{ marginBottom: '1.25rem', padding: '0.9rem 1rem', border: '1px solid #BFDBFE', background: '#EFF6FF', borderRadius: '12px', color: '#1E3A5F', lineHeight: 1.55 }}>
                    <strong>Location pricing:</strong> Near cities use the Near Price; Long cities use the Long Price. The server verifies the selected city and applies the matching price to the cart and invoice.
                  </div>
                  <div className="admin-toolbar" style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}><input type="search" aria-label="Search pricing plans" placeholder="Search plan, price or option…" value={pricingSearch} onChange={event => { setPricingSearch(event.target.value); setPricingPage(1) }} style={{ ...inputStyle, maxWidth: '300px' }} /><select aria-label="Filter pricing plans by usage" value={pricingUsageFilter} onChange={event => { setPricingUsageFilter(event.target.value); setPricingPage(1) }} style={{ ...inputStyle, width: '170px' }}><option value="all">All plans</option><option value="used">Enrolled plans</option><option value="unused">Unused plans</option></select></div>
                  <div className="admin-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th scope="col" style={thStyle}>Plan ID</th>
                          <th scope="col" style={thStyle}>Pricing Plan</th>
                          <th scope="col" style={thStyle}>Near-Area Price</th>
                          <th scope="col" style={thStyle}>Long-Distance Price</th>
                          <th scope="col" style={thStyle}>Included Feature 1</th>
                          <th scope="col" style={thStyle}>Included Feature 2</th>
                          <th scope="col" style={thStyle}>Included Feature 3</th>
                          <th scope="col" style={thStyle}>Included Feature 4</th>
                          <th scope="col" style={thStyle}>Included Feature 5</th>
                          <th scope="col" className="pricing-actions-cell" style={{ ...thStyle, minWidth: '150px' }}>Manage Plan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visiblePricing.map(t => {
                          const opts = t.options || []
                          const enrolledCount = enrollmentRows.filter(({ course }) => String(course?.id || '') === String(t.id || '')).length
                          return (
                            <tr key={t._id}>
                              <td style={tdStyle}><span style={{ padding: '0.15rem 0.4rem', background: 'rgba(1,69,168,0.08)', color: SKY_BLUE, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>{t.id}</span></td>
                              <td style={{ ...tdStyle, fontWeight: 600, maxWidth: '160px' }}><button type="button" aria-label={`View full pricing details for ${t.planName}`} onClick={() => setDetailsDialog({ title: t.planName || 'Pricing Plan', subtitle: `Near ${t.planPrice || '—'} · Long ${t.planPriceTwo || '—'}`, content: (opts.length ? opts.map((option, index) => `${index + 1}. ${option?.text || '—'} — ${option?.permission && option.permission !== 'Select' ? option.permission : '—'}`).join('\n') : 'No options recorded.') })} style={{ maxWidth: '145px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: 0, padding: 0, background: 'transparent', color: SKY_BLUE, textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}>{t.planName}</button></td>
                              <td style={tdStyle}>{t.planPrice}</td>
                              <td style={tdStyle}>{t.planPriceTwo}</td>
                              {[0,1,2,3,4].map(i => (
                                <td key={i} style={{ ...tdStyle, maxWidth: '140px', fontSize: '0.95rem', color: opts[i]?.permission === 'Included' ? '#16A34A' : opts[i]?.permission === 'Not Included' ? '#DC2626' : '#64748b' }}><button type="button" aria-label={`View option ${i + 1} for ${t.planName}`} onClick={() => setDetailsDialog({ title: `${t.planName || 'Plan'} — Option ${i + 1}`, content: opts[i]?.text ? `${opts[i].text}\n\nPermission: ${opts[i]?.permission && opts[i].permission !== 'Select' ? opts[i].permission : '—'}` : opts[i]?.permission && opts[i].permission !== 'Select' ? opts[i].permission : '—' })} style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: 0, padding: 0, background: 'transparent', color: 'inherit', textDecoration: opts[i]?.text ? 'underline' : 'none', cursor: opts[i]?.text ? 'pointer' : 'default' }}>{opts[i]?.text || (opts[i]?.permission && opts[i].permission !== 'Select' ? opts[i].permission : '—')}</button></td>
                              ))}
                              <td className="pricing-actions-cell" style={{ ...tdStyle, minWidth: '150px' }}>
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
                                  <AdminDeleteIconButton label={`Delete pricing plan ${t.planName || ''}`.trim()} title="Delete pricing plan" onClick={() => requestConfirmation(enrolledCount > 0 ? 'Delete enrolled pricing plan?' : 'Delete pricing plan?', enrolledCount > 0 ? `${t.planName || 'This plan'} is linked to ${enrolledCount} enrollment record${enrolledCount === 1 ? '' : 's'}. Deleting it removes the plan from new purchases; historical enrollments remain. Confirm only if this is intentional.` : `${t.planName || 'This plan'} will be permanently removed.`, () => deletePricing(t, enrolledCount))} />
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {filteredPricing.length === 0 && (
                          <tr><td colSpan={10} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>{pricingSearch || pricingUsageFilter !== 'all' ? 'No pricing plans match the selected filters.' : 'No pricing packages yet. Click "+ Add Pricing Plan" to create one.'}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <TablePager page={safePricingPage} pages={pricingPages} total={filteredPricing.length} label="plans" onChange={setPricingPage} />
                </div>
              )}

              {!loading && !loadError && activeTab === 'coupons' && (
                <AdminCouponsPanel cardStyle={cardStyle} inputStyle={inputStyle} labelStyle={labelStyle} thStyle={thStyle} tdStyle={tdStyle} requestConfirmation={requestConfirmation} />
              )}

              {!loading && !loadError && activeTab === 'enrolled' && (
                <div>
                  <div className="admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { num: enrolledStudentCount, label: 'Enrolled Students', color: SKY_BLUE },
                      { num: enrolledPackageCount, label: 'Active Packages', color: GOLD },
                      { num: enrollmentRows.length, label: 'Course Enrollments', color: '#22C55E' },
                    ].map(s => (
                      <div key={s.label} className="admin-stat" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid #E2EBF5', textAlign: 'center', padding: '1.5rem 1rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '0.3rem' }}>{s.num}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#334155', fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.book} Enrolled Users ({enrollTotal})</h3>
                        <p style={{ margin: '.35rem 0 0', color: '#334155', fontSize: '.9rem' }}>Students appear here automatically after completing a course enrollment.</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input aria-label="Search enrolled users" type="search" placeholder="Search student, email, plan, city…" value={enrollSearch} onChange={e => { setEnrollSearch(e.target.value); setEnrollPage(1) }} style={{ ...inputStyle, width: '280px' }} />
                        <select aria-label="Filter enrollments by status" value={enrollStatusFilter} onChange={e => { setEnrollStatusFilter(e.target.value); setEnrollPage(1) }} style={{ ...inputStyle, width: '170px', fontSize: '1.05rem' }}>
                          <option value="all">All statuses</option>
                          <option value="active">Active</option>
                          <option value="refund pending">Refund Pending</option>
                          <option value="refunded">Refunded</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <select aria-label="Enrollments per page" value={enrollLimit} onChange={e => { setEnrollLimit(e.target.value); setEnrollPage(1) }} style={{ ...inputStyle, width: '90px', fontSize: '1.05rem' }}>
                          <option value="10">10 / page</option>
                          <option value="20">20 / page</option>
                          <option value="50">50 / page</option>
                        </select>
                        {(enrollSearch || enrollStatusFilter !== 'all') && <button type="button" onClick={() => { setEnrollSearch(''); setEnrollStatusFilter('all'); setEnrollPage(1) }} style={{ padding: '.58rem .75rem', border: '1px solid #CBD5E1', borderRadius: '9px', background: '#fff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Clear</button>}
                      </div>
                    </div>

                    <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', minWidth: '1280px' }}>
                        <thead>
                          <tr>
                            <th scope="col" style={thStyle}>Student Name</th>
                            <th scope="col" style={thStyle}>Email Address</th>
                            <th scope="col" style={thStyle}>Phone Number</th>
                            <th scope="col" style={{ ...thStyle, minWidth: '240px', whiteSpace: 'nowrap' }}>Enrolled Course</th>
                            <th scope="col" style={thStyle}>Pickup Location</th>
                            <th scope="col" style={thStyle}>Paid Price</th>
                            <th scope="col" style={thStyle}>Lesson Slots</th>
                            <th scope="col" style={thStyle}>Enrollment Status</th>
                            <th scope="col" style={thStyle}>Enrollment Date</th>
                            <th scope="col" style={thStyle}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleEnrollmentRows.map(({ account, course, key }) => {
                            const statusMeta = courseStatusMeta(course)
                            const used = Number(course.slotAllowance?.used ?? course.slotUsage?.used ?? course.slotUsed ?? (Array.isArray(course.pickupSlots) ? course.pickupSlots.length : 0))
                            const maximum = Number(course.slotAllowance?.maximum ?? course.slotUsage?.maximum ?? course.slotMaximum)
                            const hasSlotRecord = Array.isArray(course.pickupSlots)
                              || course.slotAllowance?.used != null || course.slotUsage?.used != null || course.slotUsed != null
                              || course.slotAllowance?.maximum != null || course.slotUsage?.maximum != null || course.slotMaximum != null
                            const enrolledDate = course.enrolledAt ? new Date(course.enrolledAt) : null
                            return (
                              <tr key={key}>
                                <td style={tdStyle}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, flexShrink: 0 }}>{(adminUserName(account) || account.email || '?')[0].toUpperCase()}</div>
                                    <span style={{ fontWeight: 700 }}>{adminUserName(account)}</span>
                                  </div>
                                </td>
                                <td style={tdStyle}>{account.email || '—'}</td>
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{account.phone || 'Not recorded'}</td>
                                <td style={{ ...tdStyle, minWidth: '240px', whiteSpace: 'nowrap', fontWeight: 700 }}>{course.title || COURSE_MAP[course.id] || `Course ${course.id || ''}`}</td>
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{course.city ? <>{course.city}{course.cityZip ? `, CA ${course.cityZip}` : ''}</> : <span title="Legacy record" style={{ color: '#64748B' }}>Not recorded</span>}{course.cityDistance ? <span style={{ display: 'block', color: '#334155', fontSize: '.78rem' }}>{locationDistanceLabel(course.cityDistance)}</span> : null}</td>
                                <td style={{ ...tdStyle, fontWeight: 800 }}>{course.price || '—'}</td>
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{hasSlotRecord ? (Number.isFinite(used) && Number.isFinite(maximum) ? `${used} / ${maximum}` : Number.isFinite(used) ? used : 'Not recorded') : <span title="Legacy record" style={{ color: '#64748B' }}>Not recorded</span>}</td>
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}><span style={{ display: 'inline-flex', padding: '.25rem .55rem', borderRadius: '999px', background: statusMeta.background, color: statusMeta.color, fontFamily: 'var(--font-mono)', fontSize: '.7rem', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 800, whiteSpace: 'nowrap' }}>{statusMeta.label}</span></td>
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{enrolledDate && !Number.isNaN(enrolledDate.getTime()) ? enrolledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                                <td style={tdStyle}>
                                  <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                                    <button type="button" onClick={() => handleEditEnrollment({ account, course })} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                    <AdminDeleteIconButton label={`Delete enrollment for ${adminUserName(account)}`} title="Delete enrollment" onClick={() => handleDeleteEnrollment({ account, course })} />
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                          {!visibleEnrollmentRows.length && <tr><td colSpan={10} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>{enrollSearch || enrollStatusFilter !== 'all' ? 'No enrollments match the selected search or status.' : 'No website users have enrolled in a course yet.'}</td></tr>}
                        </tbody>
                      </table>
                    </div>

                    {enrollPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                        <button disabled={safeEnrollPage <= 1} onClick={() => setEnrollPage(prev => Math.max(1, prev - 1))} style={{ padding: '0.4rem 0.8rem', background: safeEnrollPage <= 1 ? '#f0f2f5' : '#fff', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: safeEnrollPage <= 1 ? '#ccc' : DARK, cursor: safeEnrollPage <= 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
                        {Array.from({ length: Math.min(enrollPages, 10) }, (_, i) => {
                          const start = Math.max(1, safeEnrollPage - 4)
                          const p = start + i
                          if (p > enrollPages) return null
                          return <button key={p} onClick={() => setEnrollPage(p)} style={{ padding: '0.4rem 0.7rem', background: p === safeEnrollPage ? SKY_BLUE : '#fff', border: `1px solid ${p === safeEnrollPage ? SKY_BLUE : '#E2EBF5'}`, borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: p === safeEnrollPage ? '#fff' : DARK, cursor: 'pointer' }}>{p}</button>
                        })}
                        <button disabled={safeEnrollPage >= enrollPages} onClick={() => setEnrollPage(prev => Math.min(enrollPages, prev + 1))} style={{ padding: '0.4rem 0.8rem', background: safeEnrollPage >= enrollPages ? '#f0f2f5' : '#fff', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: safeEnrollPage >= enrollPages ? '#ccc' : DARK, cursor: safeEnrollPage >= enrollPages ? 'not-allowed' : 'pointer' }}>Next</button>
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
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#334155', fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.refund} Refunds ({refundTotal})</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input className="admin-toolbar-input" aria-label="Search refund records" type="search" placeholder="Search by name, email, course…" value={refundSearch} onChange={e => { setRefundSearch(e.target.value); setRefundPage(1) }} style={{ ...inputStyle, width: '220px' }} />
                        <select aria-label="Filter refunds by status" value={refundStatusFilter} onChange={event => { setRefundStatusFilter(event.target.value); setRefundPage(1) }} style={{ ...inputStyle, width: '155px' }}>
                          <option value="all">All statuses</option>
                          <option value="pending">Pending</option>
                          <option value="refunded">Refunded</option>
                          <option value="denied">Denied</option>
                        </select>
                        <select aria-label="Refund records per page" value={refundLimit} onChange={e => { setRefundLimit(e.target.value); setRefundPage(1) }} style={{ ...inputStyle, width: '90px', fontSize: '1.05rem' }}>
                          <option value="10">10 / page</option>
                          <option value="20">20 / page</option>
                          <option value="50">50 / page</option>
                        </select>
                        {(refundSearch || refundStatusFilter !== 'all') && <button type="button" onClick={() => { setRefundSearch(''); setRefundStatusFilter('all'); setRefundPage(1) }} style={{ padding: '.58rem .75rem', border: '1px solid #CBD5E1', borderRadius: '9px', background: '#fff', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Clear</button>}
                        <button onClick={() => { setRefundForm({ Full_Name: '', Email: '', Phone: '', Course_Name: '', Amount: '', Reason: '', Status: 'pending' }); setRefundEdit('new') }} style={{ padding: '0.5rem 1rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>+ Add Refund</button>
                      </div>
                    </div>

                    <div role="note" style={{ marginBottom: '1rem', padding: '.8rem 1rem', border: '1px solid #BFDBFE', borderRadius: '12px', background: '#EFF6FF', color: '#1E3A8A', fontSize: '.9rem', lineHeight: 1.55 }}>
                      Refund requests stay pending until reviewed. Changing a PayPal-linked request to Refunded sends the refund through PayPal; Denied closes the request without returning funds.
                    </div>

                    <div className="admin-table-wrap">
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            <th scope="col" style={thStyle}>Student Name</th>
                            <th scope="col" style={thStyle}>Email Address</th>
                            <th scope="col" style={thStyle}>Phone Number</th>
                            <th scope="col" style={thStyle}>Refunded Course</th>
                            <th scope="col" style={thStyle}>Refund Amount</th>
                            <th scope="col" style={thStyle}>Request Reason</th>
                            <th scope="col" style={thStyle}>Refund Status</th>
                            <th scope="col" style={{ ...thStyle, minWidth: '138px', whiteSpace: 'nowrap' }}>Requested On</th>
                            <th scope="col" className="refund-actions-cell" style={{ ...thStyle, minWidth: '205px', whiteSpace: 'nowrap' }}>Review / Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {refundLoading ? (
                            <tr><td role="status" aria-live="polite" colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>Loading refund records…</td></tr>
                          ) : refundError ? (
                            <tr><td role="alert" colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#B91C1C' }}>
                              <p style={{ margin: '0 0 .75rem' }}>{refundError}</p>
                              <button type="button" onClick={() => setRefundAttempt(value => value + 1)} style={{ padding: '.55rem .9rem', border: '1px solid #FCA5A5', borderRadius: '9px', background: '#fff', color: '#B91C1C', fontWeight: 800, cursor: 'pointer' }}>Try Again</button>
                            </td></tr>
                          ) : refunds.length === 0 ? (
                            <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>{refundSearch || refundStatusFilter !== 'all' ? 'No refund records match the selected filters.' : 'No refunds found. Click "+ Add Refund" to create one.'}</td></tr>
                          ) : refunds.map(r => (
                            <tr key={r._id}>
                              <td style={{ ...tdStyle, fontWeight: 600 }}>{r.Full_Name || '—'}</td>
                              <td style={tdStyle}>{r.Email || '—'}</td>
                              <td style={tdStyle}>{r.Phone || '—'}</td>
                              <td style={{ ...tdStyle, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.Course_Name || '—'}</td>
                              <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 700 }}>{r.Amount || '—'}</td>
                              <td style={{ ...tdStyle, maxWidth: '180px', whiteSpace: 'nowrap' }}><button type="button" onClick={() => setRefundDetails(r)} aria-label={`View refund details for ${r.Full_Name || 'student'}`} style={{ maxWidth: '160px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: 0, minHeight: 0, border: 0, background: 'transparent', color: SKY_BLUE, textDecoration: 'underline', textUnderlineOffset: '3px', font: 'inherit', cursor: 'pointer' }}>{r.Reason || 'View details'}</button></td>
                              <td style={tdStyle}>
                                <span style={{ padding: '0.2rem 0.5rem', background: r.Status === 'refunded' ? 'rgba(34,197,94,0.1)' : r.Status === 'denied' ? 'rgba(220,38,38,0.1)' : 'rgba(253,188,1,0.15)', color: r.Status === 'refunded' ? '#16A34A' : r.Status === 'denied' ? '#DC2626' : GOLD_DEEP, borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>{r.Status || 'pending'}</span>
                              </td>
                              <td style={{ ...tdStyle, minWidth: '118px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{r.created_at ? r.created_at.slice(0, 10) : '—'}</td>
                              <td className="refund-actions-cell" style={{ ...tdStyle, minWidth: '205px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  {['refunded', 'denied'].includes(normalizeStatus(r.Status)) ? <><button type="button" onClick={() => setRefundDetails(r)} style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', color: '#475569', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Details</button><span title="Final decisions are read-only" style={{ display: 'inline-flex', alignItems: 'center', color: '#64748B', fontSize: '.75rem', fontWeight: 700 }}>Locked</span></> : <><button onClick={() => { setRefundForm({ Full_Name: r.Full_Name || '', Email: r.Email || '', Phone: r.Phone || '', Course_Name: r.Course_Name || '', Amount: r.Amount || '', Reason: r.Reason || '', Status: r.Status || 'pending' }); setRefundEdit(r._id) }} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button><AdminDeleteIconButton label={`Delete refund record for ${r.Full_Name || 'student'}`} title="Delete refund record" onClick={() => requestConfirmation('Delete refund record?', `${r.Full_Name || 'This record'} will be permanently removed. No funds are transferred by this action.`, () => deleteRefund(r._id))} /></>}
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
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#334155' }}>Page {refundPage} of {refundPages}</span>
                        <button disabled={refundPage >= refundPages} onClick={() => setRefundPage(prev => Math.min(refundPages, prev + 1))} style={{ padding: '0.4rem 0.8rem', background: refundPage >= refundPages ? '#f0f2f5' : '#fff', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: refundPage >= refundPages ? '#ccc' : DARK, cursor: refundPage >= refundPages ? 'not-allowed' : 'pointer' }}>Next</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!loading && !loadError && activeTab === 'locations' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div className="admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '1rem' }}>
                    {[
                      { label: 'Total Locations', value: locations.length, color: SKY_BLUE, background: '#EFF6FF' },
                      { label: 'Near Locations', value: nearLocationCount, color: '#15803D', background: '#F0FDF4' },
                      { label: 'Long Locations', value: longLocationCount, color: '#B45309', background: '#FFF7ED' },
                    ].map(item => (
                      <div key={item.label} className="admin-stat" style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', display: 'grid', placeItems: 'center', color: item.color, background: item.background }}>{SVG.map}</div>
                        <div>
                          <strong style={{ display: 'block', color: DARK, fontFamily: 'var(--font-display)', fontSize: '1.6rem', lineHeight: 1 }}>{item.value}</strong>
                          <span style={{ color: '#334155', fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700 }}>{item.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 .35rem' }}>{SVG.map} Booking Locations <span style={{ color: '#334155', fontSize: '.9rem', fontFamily: 'var(--font-body)' }}>({filteredLocations.length} of {locations.length})</span></h3>
                        <p style={{ margin: 0, color: '#334155', lineHeight: 1.6 }}>These cities appear in the booking city selector. Near/Long controls the location pricing group.</p>
                      </div>
                      <button type="button" onClick={() => { setLocationForm({ name: '', zipCode: '', distance: 'Near', order: locations.length + 1 }); setLocationEdit('new') }} style={{ padding: '0.65rem 1rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>+ Add Location</button>
                    </div>

                    <div role="note" style={{ marginBottom: '1rem', padding: '.85rem 1rem', border: '1px solid #BFDBFE', background: '#EFF6FF', borderRadius: '12px', color: '#1E3A5F', lineHeight: 1.55 }}>
Near and Long pricing is applied automatically from the selected city and verified by the server.
                    </div>

                    <div className="admin-toolbar" style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <input className="admin-toolbar-input" type="search" aria-label="Search booking locations" placeholder="Search city or ZIP code…" value={locationSearch} onChange={event => { setLocationSearch(event.target.value); setLocationPage(1) }} style={inputStyle} />
                      <select aria-label="Filter booking locations by distance" value={locationDistanceFilter} onChange={event => setLocationDistanceFilter(event.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '170px' }}>
                        <option value="all">All distances</option>
                        <option value="near">Near</option>
                        <option value="long">Long</option>
                      </select>
                    </div>

                    <div className="admin-table-wrap">
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
                        <thead>
                          <tr>
                            <th scope="col" style={thStyle}>Display Order</th>
                            <th scope="col" style={thStyle}>Service City</th>
                            <th scope="col" style={thStyle}>ZIP Code</th>
                            <th scope="col" style={thStyle}>Distance Type</th>
                            <th scope="col" style={thStyle}>Applied Pricing</th>
                            <th scope="col" className="admin-actions-cell" style={thStyle}>Manage Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleLocations.map((location, index) => {
                            const distance = locationDistanceLabel(location.distance)
                            const isNear = distance === 'Near'
                            return (
                              <tr key={location._id || `${location.name}-${index}`}>
                                <td style={{ ...tdStyle, fontVariantNumeric: 'tabular-nums', color: '#334155' }}>{Number(location.order) || index + 1}</td>
                                <td style={{ ...tdStyle, fontWeight: 800 }}>{location.name}</td>
                                <td style={{ ...tdStyle, whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>{location.zipCode || <span title="Legacy record" style={{ color: '#64748B' }}>Not recorded</span>}</td>
                                <td style={tdStyle}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '.35rem .65rem', borderRadius: '999px', background: isNear ? '#DCFCE7' : '#FFEDD5', color: isNear ? '#15803D' : '#B45309', border: `1px solid ${isNear ? '#BBF7D0' : '#FED7AA'}`, fontFamily: 'var(--font-mono)', fontSize: '.72rem', fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>{distance}</span>
                                </td>
                                <td style={{ ...tdStyle, color: '#334155' }}>{distance} pricing</td>
                                <td className="admin-actions-cell" style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', gap: '.45rem' }}>
                                    <button type="button" onClick={() => { setLocationForm({ name: location.name || '', zipCode: location.zipCode || '', distance, order: Number(location.order) || index + 1 }); setLocationEdit(location._id) }} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                    <AdminDeleteIconButton label={`Delete booking location ${location.name || ''}`.trim()} title="Delete booking location" onClick={() => handleDeleteLocation(location)} />
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                          {filteredLocations.length === 0 && (
                            <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', padding: '2.5rem', color: '#334155' }}>No booking locations match this filter.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <TablePager page={safeLocationPage} pages={locationPages} total={filteredLocations.length} label="locations" onChange={setLocationPage} />
                </div>
              )}

              {!loading && !loadError && activeTab === 'maps' && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.map} Service Area Maps ({areas.length})</h3>
                    <button onClick={() => { setAreasForm({ name: '', map: '', icon: '', order: 0 }); setAreasEdit('new') }} style={{ padding: '0.5rem 1rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>+ Add Map</button>
                  </div>
                  <div className="admin-toolbar" style={{ marginBottom: '1rem' }}><input type="search" aria-label="Search service area maps" placeholder="Search name or URL…" value={areaSearch} onChange={event => { setAreaSearch(event.target.value); setAreaPage(1) }} style={{ ...inputStyle, maxWidth: '320px' }} /></div>
                  <div className="admin-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th scope="col" style={thStyle}>Service Area</th>
                          <th scope="col" style={thStyle}>Google Maps URL</th>
                          <th scope="col" style={thStyle}>Website Embed</th>
                          <th scope="col" className="admin-actions-cell" style={thStyle}>Manage Map</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleAreas.map(a => (
                          <tr key={a._id}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{a.name}</td>
                            <td style={{ ...tdStyle, maxWidth: '280px' }}><button type="button" aria-label={`View full map URL for ${a.name}`} onClick={() => setDetailsDialog({ title: 'Map URL', subtitle: a.name, content: a.map || '—' })} style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: 0, background: 'transparent', padding: 0, color: SKY_BLUE, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>{a.map || '—'}</button></td>
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
                            <td className="admin-actions-cell" style={tdStyle}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => { setAreasForm({ name: a.name, map: a.map, icon: a.icon || '', order: Number(a.order) || 0 }); setAreasEdit(a._id) }} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                <AdminDeleteIconButton label={`Delete service area ${a.name || ''}`.trim()} title="Delete service area" onClick={() => requestConfirmation('Delete location?', `${a.name || 'This location'} will be permanently removed.`, () => deleteArea(a._id))} />
                              </div>
                            </td>
                          </tr>
                        ))}
                        {areas.length === 0 && (
                          <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>No locations yet. Click "+ Add Location" to create one.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <TablePager page={safeAreaPage} pages={areaPages} total={filteredAreas.length} label="maps" onChange={setAreaPage} />
                </div>
              )}

              {!loading && !loadError && activeTab === 'settings' && (
                <div style={{ ...cardStyle, marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>{SVG.share} Social Links Management ({socials.length})</h3>
                    <button onClick={() => { setSocialsForm({ platform: 'facebook', url: '', order: socials.length }); setSocialsEdit('new') }} style={{ padding: '0.5rem 1rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>+ Add Social Link</button>
                  </div>
                  <div className="admin-toolbar" style={{ marginBottom: '1rem' }}><input type="search" aria-label="Search social links" placeholder="Search platform or URL…" value={socialSearch} onChange={event => { setSocialSearch(event.target.value); setSocialPage(1) }} style={{ ...inputStyle, maxWidth: '320px' }} /></div>
                  <div className="admin-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th scope="col" style={thStyle}>Social Platform</th>
                          <th scope="col" style={thStyle}>Profile / Page URL</th>
                          <th scope="col" style={thStyle}>Display Order</th>
                          <th scope="col" className="admin-actions-cell" style={thStyle}>Manage Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleSocials.map(s => (
                          <tr key={s._id || s.platform}>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: SKY_BLUE }}>{socialIcon(s.platform, 16)}</span>
                                {socialPlatformLabel(s.platform)}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, maxWidth: '300px' }}><button type="button" aria-label={`View full ${socialPlatformLabel(s.platform)} URL`} onClick={() => setDetailsDialog({ title: 'Social Link URL', subtitle: socialPlatformLabel(s.platform), content: s.url || '—' })} style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: 0, background: 'transparent', padding: 0, color: SKY_BLUE, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>{s.url || '—'}</button></td>
                            <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{s.order ?? 0}</td>
                            <td className="admin-actions-cell" style={tdStyle}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button onClick={() => { setSocialsForm({ platform: s.platform || 'link', url: s.url || '', order: s.order ?? 0 }); setSocialsEdit(s._id) }} style={{ background: 'none', border: `1.5px solid ${SKY_BLUE}`, color: SKY_BLUE, borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>Edit</button>
                                <AdminDeleteIconButton label={`Delete ${socialPlatformLabel(s.platform)} social link`} title="Delete social link" onClick={() => requestConfirmation('Delete social link?', `${socialPlatformLabel(s.platform)} will be removed from the website.`, () => deleteSocial(s._id))} />
                              </div>
                            </td>
                          </tr>
                        ))}
                        {socials.length === 0 && (
                          <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#334155' }}>No social links yet. Click "+ Add Social Link" to create one.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <TablePager page={safeSocialPage} pages={socialPages} total={filteredSocials.length} label="links" onChange={setSocialPage} />
                </div>
              )}

              {!loading && !loadError && activeTab === 'settings' && (
                <div style={cardStyle}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>{SVG.settings} Site Information</h3>
                  {settingsMsg && (
                    <div role={settingsMsgIsError ? 'alert' : 'status'} aria-live="polite" style={{ padding: '0.75rem 1rem', background: settingsMsgIsError ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${settingsMsgIsError ? '#FECACA' : '#BBF7D0'}`, borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: settingsMsgIsError ? '#DC2626' : '#16A34A' }}>
                      {settingsMsg}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', maxWidth: '800px' }}>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Phone</label>
                      <input aria-label="Business phone" type="tel" autoComplete="tel" value={settings.phone} onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Email</label>
                      <input aria-label="Business email" type="email" autoComplete="email" value={settings.email} onChange={e => setSettings(prev => ({ ...prev, email: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Address</label>
                      <input aria-label="Street address" type="text" autoComplete="street-address" value={settings.address} onChange={e => setSettings(prev => ({ ...prev, address: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>City / State / ZIP</label>
                      <input aria-label="City, state, and ZIP code" type="text" value={settings.subaddress} onChange={e => setSettings(prev => ({ ...prev, subaddress: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Schedule Label</label>
                      <input aria-label="Schedule link label" type="text" value={settings.scheduleLabel} onChange={e => setSettings(prev => ({ ...prev, scheduleLabel: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Schedule Link</label>
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
                  {(accMsg || accErr) && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div role={accErr ? 'alert' : 'status'} aria-live="polite" style={{ padding: '0.85rem 1.1rem', background: accErr ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${accErr ? '#FECACA' : '#BBF7D0'}`, borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 700, color: accErr ? '#B91C1C' : '#15803D' }}>
                        {accErr || accMsg}
                      </div>
                    </div>
                  )}
                  <div style={cardStyle}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>{SVG.shield} Profile</h3>
                    <ProfilePhotoUploader photoURL={accPhoto} fallbackURL={DEFAULT_ADMIN_PHOTO_URL} name={accName || user?.displayName || 'Administrator'} initials={initials} onUpload={handleUploadProfilePhoto} onRemove={handleRemoveProfilePhoto} disabled={accLoading} />
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={labelStyle}>Display Name</label>
                      <input aria-label="Administrator display name" type="text" autoComplete="name" value={accName} onChange={e => setAccName(e.target.value)} style={inputStyle} />
                    </div>
                    <button type="button" onClick={handleSaveProfile} disabled={accLoading} style={{ padding: '0.75rem 2rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: accLoading ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)', opacity: accLoading ? 0.6 : 1 }}>
                      {accLoading ? 'Saving…' : 'Save Display Name'}
                    </button>
                  </div>

                  <div style={cardStyle}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>{SVG.settings} Email & Password</h3>
                    {hasPasswordProvider ? (
                      <>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#334155', margin: '0 0 1.25rem', lineHeight: 1.5 }}>Changing email or password requires your current password.</p>
                        <div style={{ marginBottom: '1.25rem' }}><label htmlFor="admin-account-email" style={labelStyle}>Admin Email</label><input id="admin-account-email" type="email" autoComplete="email" value={accEmail} onChange={e => setAccEmail(e.target.value)} style={inputStyle} /></div>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label htmlFor="admin-current-password" style={labelStyle}>Current Password</label>
                          <PasswordInput id="admin-current-password" visibilityLabel="current password" value={accPass} onChange={e => setAccPass(e.target.value)} style={inputStyle} autoComplete="current-password" aria-describedby="admin-password-help" />
                        </div>
                        <button type="button" onClick={handleChangeEmail} disabled={accLoading || !accPass} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg,#FDBC01,#FFD54F)', color: DARK, border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: accLoading ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(253,188,1,0.25)', opacity: accLoading || !accPass ? 0.6 : 1 }}>{accLoading ? 'Updating…' : 'Save Email'}</button>
                        <div style={{ borderTop: '1px solid #E2EBF5', margin: '1.5rem 0' }} />
                        <div style={{ marginBottom: '1.25rem' }}>
                          <label htmlFor="admin-new-password" style={labelStyle}>New Password</label>
                          <PasswordInput id="admin-new-password" visibilityLabel="new password" value={accNewPass} onChange={e => setAccNewPass(e.target.value)} style={inputStyle} autoComplete="new-password" minLength={8} aria-describedby="admin-password-help" placeholder="At least 8 characters" />
                          <p id="admin-password-help" style={{ margin: '.5rem 0 0', color: '#334155', fontSize: '.78rem', lineHeight: 1.5 }}>Use at least 8 characters. The new password must differ from the current password and is never displayed after reload.</p>
                        </div>
                        <button type="button" onClick={handleChangePassword} disabled={accLoading || !accPass || accNewPass.length < 8} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg,#FDBC01,#FFD54F)', color: DARK, border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: accLoading ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(253,188,1,0.25)', opacity: accLoading || !accPass || accNewPass.length < 8 ? 0.6 : 1 }}>{accLoading ? 'Updating…' : 'Change Password'}</button>
                        <div role="note" style={{ marginTop: '1.5rem', padding: '.9rem 1rem', border: '1px solid #BFDBFE', borderRadius: '12px', background: '#EFF6FF', color: '#1E3A5F', lineHeight: 1.55 }}><strong>Admin MFA:</strong> Multi-factor authentication is not enabled yet. It can be added later after client approval and Firebase MFA configuration.</div>
                      </>
                    ) : (
                      <div role="note" style={{ padding: '1.1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', color: '#1E3A5F' }}>
                        <p style={{ margin: '0 0 .35rem', fontWeight: 800 }}>Managed by Google</p>
                        <p style={{ margin: 0, lineHeight: 1.6 }}>This administrator signed in with Google. Email and password security must be managed from the connected Google account.</p>
                      </div>
                    )}
                  </div>

                  <section aria-labelledby="google-calendar-heading" style={{ ...cardStyle, gridColumn: '1 / -1', overflow: 'hidden', position: 'relative', border: '1px solid #BFDBFE', background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F7FF 58%, #FFF8DC 100%)' }}>
                    <div aria-hidden="true" style={{ position: 'absolute', width: '220px', height: '220px', right: '-80px', top: '-110px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(66,133,244,.18), rgba(253,188,1,0))' }} />
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.25rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: 0 }}>
                        <div aria-hidden="true" style={{ width: '52px', height: '52px', borderRadius: '15px', background: '#fff', border: '1px solid #D9E5F4', boxShadow: '0 8px 24px rgba(15,65,120,.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: 'Arial, sans-serif', fontSize: '1.7rem', fontWeight: 900, background: 'conic-gradient(from 10deg, #4285F4, #34A853, #FBBC05, #EA4335, #4285F4)', WebkitBackgroundClip: 'text', color: 'transparent' }}>G</span>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '.65rem' }}>
                            <h3 id="google-calendar-heading" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK }}>Automatic Google Calendar Sync</h3>
                            {calendarLoading ? (
                              <span role="status" style={{ color: '#475569', fontWeight: 700, fontSize: '.8rem' }}>Checking…</span>
                            ) : calendarIntegration.connected ? (
                              <span style={{ padding: '.28rem .6rem', borderRadius: '999px', color: '#166534', background: '#DCFCE7', border: '1px solid #BBF7D0', fontWeight: 800, fontSize: '.75rem' }}>● Connected</span>
                            ) : calendarIntegration.configured ? (
                              <span style={{ padding: '.28rem .6rem', borderRadius: '999px', color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', fontWeight: 800, fontSize: '.75rem' }}>Not connected</span>
                            ) : (
                              <span style={{ padding: '.28rem .6rem', borderRadius: '999px', color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A', fontWeight: 800, fontSize: '.75rem' }}>Setup required</span>
                            )}
                          </div>
                          <p style={{ margin: '.55rem 0 0', color: '#334155', lineHeight: 1.65, maxWidth: '760px' }}>Every new lesson is added to the connected school calendar automatically. Status changes update the event; cancellation or deletion removes it. Each event includes the student, plan, location, and reminders.</p>
                        </div>
                      </div>
                    </div>

                    {!calendarLoading && !calendarIntegration.configured && (
                      <div role="note" style={{ marginTop: '1.25rem', padding: '1rem 1.1rem', borderRadius: '14px', color: '#1E3A5F', background: '#EFF6FF', border: '1px solid #BFDBFE', lineHeight: 1.6 }}>
                        <strong>Google setup required:</strong> add the Google OAuth environment variables, redeploy, then return here and connect the Google account that should receive every booking automatically.
                      </div>
                    )}

                    {!calendarLoading && calendarIntegration.configured && calendarIntegration.connected && (
                      <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '.85rem' }}>
                        <div style={{ padding: '.9rem 1rem', background: 'rgba(255,255,255,.82)', border: '1px solid #DCE8F5', borderRadius: '13px' }}>
                          <span style={{ display: 'block', color: '#64748B', fontSize: '.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }}>Connected account</span>
                          <strong style={{ display: 'block', marginTop: '.3rem', color: '#0F3F79', overflowWrap: 'anywhere' }}>{calendarIntegration.connectedEmail || 'Google account'}</strong>
                        </div>
                        <div style={{ padding: '.9rem 1rem', background: 'rgba(255,255,255,.82)', border: '1px solid #DCE8F5', borderRadius: '13px' }}>
                          <span style={{ display: 'block', color: '#64748B', fontSize: '.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }}>Calendar</span>
                          <strong style={{ display: 'block', marginTop: '.3rem', color: '#0F3F79' }}>{calendarIntegration.calendarId === 'primary' ? 'Primary calendar' : calendarIntegration.calendarId}</strong>
                        </div>
                        <div style={{ padding: '.9rem 1rem', background: 'rgba(255,255,255,.82)', border: '1px solid #DCE8F5', borderRadius: '13px' }}>
                          <span style={{ display: 'block', color: '#64748B', fontSize: '.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em' }}>Last connection test</span>
                          <strong style={{ display: 'block', marginTop: '.3rem', color: '#0F3F79' }}>{calendarIntegration.lastTestAt ? new Date(calendarIntegration.lastTestAt).toLocaleString() : 'Not tested yet'}</strong>
                        </div>
                      </div>
                    )}

                    {(calendarMsg || calendarErr || calendarIntegration.lastError) && (
                      <div role={calendarErr || calendarIntegration.lastError ? 'alert' : 'status'} aria-live="polite" style={{ marginTop: '1rem', padding: '.8rem 1rem', borderRadius: '12px', fontWeight: 700, color: calendarErr || calendarIntegration.lastError ? '#B91C1C' : '#166534', background: calendarErr || calendarIntegration.lastError ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${calendarErr || calendarIntegration.lastError ? '#FECACA' : '#BBF7D0'}` }}>
                        {calendarErr || calendarIntegration.lastError || calendarMsg}
                      </div>
                    )}

                    <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '.75rem', marginTop: '1.25rem' }}>
                      {calendarIntegration.configured && !calendarIntegration.connected && (
                        <button type="button" onClick={handleConnectGoogleCalendar} disabled={calendarLoading} style={{ padding: '.78rem 1.15rem', borderRadius: '11px', border: 0, background: 'linear-gradient(135deg,#0B57D0,#4285F4)', color: '#fff', fontWeight: 800, cursor: calendarLoading ? 'wait' : 'pointer', opacity: calendarLoading ? .65 : 1 }}>Connect Google Calendar</button>
                      )}
                      {calendarIntegration.configured && calendarIntegration.connected && (
                        <>
                          <button type="button" onClick={handleTestGoogleCalendar} disabled={calendarLoading} style={{ padding: '.78rem 1.15rem', borderRadius: '11px', border: 0, background: 'linear-gradient(135deg,#0B57D0,#4285F4)', color: '#fff', fontWeight: 800, cursor: calendarLoading ? 'wait' : 'pointer', opacity: calendarLoading ? .65 : 1 }}>{calendarLoading ? 'Testing…' : 'Test connection'}</button>
                          <button type="button" onClick={handleSyncUpcomingGoogleCalendar} disabled={calendarLoading} style={{ padding: '.78rem 1.15rem', borderRadius: '11px', border: '1px solid #86EFAC', background: '#F0FDF4', color: '#166534', fontWeight: 800, cursor: calendarLoading ? 'wait' : 'pointer' }}>Sync upcoming lessons</button>
                          <button type="button" onClick={handleSwitchGoogleCalendar} disabled={calendarLoading} style={{ padding: '.78rem 1.15rem', borderRadius: '11px', border: '1px solid #93C5FD', background: '#fff', color: '#0755AE', fontWeight: 800, cursor: calendarLoading ? 'wait' : 'pointer' }}>Switch Google account</button>
                          <button type="button" onClick={handleDisconnectGoogleCalendar} disabled={calendarLoading} style={{ padding: '.78rem 1.15rem', borderRadius: '11px', border: '1px solid #FCA5A5', background: '#fff', color: '#B91C1C', fontWeight: 800, cursor: calendarLoading ? 'wait' : 'pointer' }}>Disconnect</button>
                        </>
                      )}
                    </div>
                    <p style={{ position: 'relative', margin: '1rem 0 0', color: '#475569', fontSize: '.8rem', lineHeight: 1.55 }}>{calendarIntegration.configured ? <>Changing the admin login email does not silently move bookings to another calendar. Use <strong>Switch Google account</strong> and approve the intended school account.</> : <>For testing, connect your own Google email first. Later use <strong>Switch Google account</strong> to connect the client’s school calendar without changing the admin login.</>}</p>
                  </section>

                </div>
              )}

              {contactEdit && (
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) requestEditorClose('contact editor', () => setContactEdit(null)) }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '500px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 id="contact-dialog-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>Edit Contact</h3>
                      <button type="button" aria-label="Close contact editor" onClick={() => setContactEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#334155', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>First Name</label>
                        <input autoFocus aria-label="Contact first name" type="text" value={contactForm.firstName} onChange={e => setContactForm(prev => ({ ...prev, firstName: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Last Name</label>
                        <input aria-label="Contact last name" type="text" value={contactForm.lastName} onChange={e => setContactForm(prev => ({ ...prev, lastName: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Phone</label>
                        <input aria-label="Contact phone" type="tel" value={contactForm.phone} onChange={e => setContactForm(prev => ({ ...prev, phone: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Email</label>
                        <input aria-label="Contact email" type="email" value={contactForm.email} onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Comments</label>
                      <textarea aria-label="Contact comments" rows="4" value={contactForm.comments} onChange={e => setContactForm(prev => ({ ...prev, comments: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Status</label>
                      <select aria-label="Contact status" value={contactForm.status} onChange={e => setContactForm(prev => ({ ...prev, status: e.target.value }))} style={inputStyle}>
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setContactEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={handleSaveContact} style={{ flex: 1, padding: '0.75rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>Save</button>
                    </div>
                  </div>
                </div>
              )}

              {pricingEdit && (
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) requestEditorClose('pricing editor', () => setPricingEdit(null)) }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="pricing-dialog-title" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 id="pricing-dialog-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>
                        {pricingEdit === 'new' ? 'Add Pricing Plan' : 'Edit Pricing Plan'}
                      </h3>
                      <button type="button" aria-label="Close pricing editor" onClick={() => setPricingEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#334155', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Plan Name *</label>
                        <input autoFocus aria-label="Plan name" type="text" value={pricingForm.planName} onChange={e => setPricingForm(prev => ({ ...prev, planName: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>ID *</label>
                        <input type="text" value={pricingForm.id} onChange={e => setPricingForm(prev => ({ ...prev, id: e.target.value }))} style={inputStyle} placeholder="e.g. 1, 2, 3..." />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Near Price *</label>
                        <input aria-label="Near location price" inputMode="decimal" type="text" value={pricingForm.planPrice} onChange={e => setPricingForm(prev => ({ ...prev, planPrice: e.target.value }))} style={inputStyle} placeholder="$210" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Long Price *</label>
                        <input aria-label="Long location price" inputMode="decimal" type="text" value={pricingForm.planPriceTwo} onChange={e => setPricingForm(prev => ({ ...prev, planPriceTwo: e.target.value }))} style={inputStyle} placeholder="$290" />
                      </div>
                    </div>

                    {[1,2,3,4,5].map(i => {
                      const optKey = `option${i}`
                      const permKey = `perm${i}`
                      return (
                        <div key={i} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-sm)' }}>
                          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
                            Package Option {i}
                          </label>
                          <input
                            type="text"
                            value={pricingForm[optKey]}
                            onChange={e => setPricingForm(prev => ({ ...prev, [optKey]: e.target.value }))}
                            style={{ ...inputStyle, marginBottom: '0.5rem' }}
                            placeholder={`Option ${i} text`}
                          />
                          <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>
                            Package Permission
                          </label>
                          <select
                            value={pricingForm[permKey]}
                            onChange={e => setPricingForm(prev => ({ ...prev, [permKey]: e.target.value }))}
                            style={inputStyle}
                          >
                            <option value="Select">—</option>
                            <option value="Included">Included</option>
                            <option value="Optional">Optional</option>
                            <option value="Not Included">Not Included</option>
                          </select>
                        </div>
                      )
                    })}

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setPricingEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={async () => {
                        if (!pricingForm.planName || !pricingForm.id || !pricingForm.planPrice || !pricingForm.planPriceTwo) { setMsg('Plan Name, ID, Near Price, and Long Price are required.'); setTimeout(() => setMsg(''), 2000); return }
                        if (!isValidPlanAmount(pricingForm.planPrice) || !isValidPlanAmount(pricingForm.planPriceTwo)) { setMsg('Near Price and Long Price must be valid dollar amounts with up to 2 decimal places.'); setTimeout(() => setMsg(''), 3500); return }
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
                        } catch (error) { setMsg(error?.message || 'Failed to save plan.'); setTimeout(() => setMsg(''), 3000) }
                      }} style={{ flex: 1, padding: '0.75rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>
                        {pricingEdit === 'new' ? 'Add Pricing Plan' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {locationEdit && (
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(event) => { if (event.target === event.currentTarget) requestEditorClose('location editor', () => setLocationEdit(null)) }}>
                  <form
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="booking-location-dialog-title"
                    style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '580px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}
                    onSubmit={async event => {
                      event.preventDefault()
                      const name = locationForm.name.trim().replace(/\s+/g, ' ')
                      const zipCode = locationForm.zipCode.trim()
                      if (!name) {
                        setMsg('City name is required.')
                        setTimeout(() => setMsg(''), 2500)
                        return
                      }
                      if (zipCode && !/^\d{5}(?:-\d{4})?$/.test(zipCode)) {
                        setMsg('Enter a valid US ZIP code, for example 94546 or 94546-1234.')
                        setTimeout(() => setMsg(''), 3000)
                        return
                      }
                      const duplicate = locations.some(location => String(location._id) !== String(locationEdit) && normalizedCityKey(location.name) === normalizedCityKey(name))
                      if (duplicate) {
                        setMsg('This city already exists. Capitalization does not create a different city.')
                        setTimeout(() => setMsg(''), 3000)
                        return
                      }
                      const doc = {
                        name,
                        zipCode,
                        distance: locationDistanceLabel(locationForm.distance),
                        order: Math.max(0, Number(locationForm.order) || 0),
                      }
                      try {
                        if (locationEdit === 'new') {
                          const result = await api.adminAddLocation(doc)
                          if (result?.location) setLocations(previous => [...previous, result.location])
                        } else {
                          const result = await api.adminUpdateLocation(locationEdit, doc)
                          setLocations(previous => previous.map(item => item._id === locationEdit ? (result?.location || { ...item, ...doc }) : item))
                        }
                        const wasNew = locationEdit === 'new'
                        setLocationEdit(null)
                        setMsg(wasNew ? 'Booking location added.' : 'Booking location updated.')
                        setTimeout(() => setMsg(''), 2500)
                      } catch (error) {
                        setMsg(error?.message || 'Failed to save booking location.')
                        setTimeout(() => setMsg(''), 3500)
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
                      <div>
                        <h3 id="booking-location-dialog-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: DARK, fontWeight: 800, margin: '0 0 .25rem' }}>{locationEdit === 'new' ? 'Add Booking Location' : 'Edit Booking Location'}</h3>
                        <p style={{ margin: 0, color: '#334155' }}>Assign this city to its Near or Long pricing group.</p>
                      </div>
                      <button type="button" aria-label="Close booking location editor" onClick={() => setLocationEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.6rem', color: '#334155', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(130px,.75fr) minmax(120px,.6fr)', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label htmlFor="admin-location-name" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>City Name *</label>
                        <input id="admin-location-name" autoFocus required type="text" maxLength="120" value={locationForm.name} onChange={event => setLocationForm(previous => ({ ...previous, name: event.target.value }))} style={inputStyle} placeholder="Fremont" />
                      </div>
                      <div>
                        <label htmlFor="admin-location-zip" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>ZIP Code</label>
                        <input id="admin-location-zip" type="text" inputMode="numeric" autoComplete="postal-code" maxLength="10" pattern="[0-9]{5}(-[0-9]{4})?" value={locationForm.zipCode} onChange={event => setLocationForm(previous => ({ ...previous, zipCode: event.target.value.replace(/[^0-9-]/g, '') }))} style={inputStyle} placeholder="94546" />
                      </div>
                      <div>
                        <label htmlFor="admin-location-order" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Display Order</label>
                        <input id="admin-location-order" type="number" min="0" max="10000" value={locationForm.order} onChange={event => setLocationForm(previous => ({ ...previous, order: event.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label htmlFor="admin-location-distance" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.35rem', fontWeight: 700 }}>Package Distance *</label>
                      <select id="admin-location-distance" required value={locationForm.distance} onChange={event => setLocationForm(previous => ({ ...previous, distance: event.target.value }))} style={inputStyle}>
                        <option value="Near">Near</option>
                        <option value="Long">Long</option>
                      </select>
                    </div>
                    <div role="note" style={{ padding: '.8rem 1rem', marginBottom: '1.5rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', color: '#475569', lineHeight: 1.55 }}>
                      Near cities use each plan's Near Price and Long cities use its Long Price. The server verifies the selected city and applies the matching current price to future carts and bookings.
                    </div>
                    <div style={{ display: 'flex', gap: '.75rem' }}>
                      <button type="button" onClick={() => setLocationEdit(null)} style={{ flex: 1, padding: '.8rem', background: '#fff', border: '1.5px solid #CBD5E1', borderRadius: 'var(--radius-sm)', color: '#475569', fontFamily: 'var(--font-mono)', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                      <button type="submit" style={{ flex: 1, padding: '.8rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, border: 'none', borderRadius: 'var(--radius-sm)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '.8rem', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(1,69,168,.2)' }}>{locationEdit === 'new' ? 'Add Location' : 'Save Changes'}</button>
                    </div>
                  </form>
                </div>
              )}

              {areasEdit && (
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) requestEditorClose('map editor', () => setAreasEdit(null)) }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="area-dialog-title" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 id="area-dialog-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>{areasEdit === 'new' ? 'Add Service Area Map' : 'Edit Service Area Map'}</h3>
                      <button type="button" aria-label="Close service area map editor" onClick={() => setAreasEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#334155', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Name *</label>
                        <input autoFocus aria-label="Location name" type="text" value={areasForm.name} onChange={e => setAreasForm(prev => ({ ...prev, name: e.target.value }))} style={inputStyle} placeholder="San Ramon" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Order</label>
                        <input type="number" value={areasForm.order} onChange={e => setAreasForm(prev => ({ ...prev, order: Number(e.target.value) }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Google Maps Embed URL *</label>
                      <textarea aria-label="Google Maps secure embed URL" rows="4" value={areasForm.map} onChange={e => setAreasForm(prev => ({ ...prev, map: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }} placeholder="https://www.google.com/maps/embed?pb=..." />
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#334155', margin: '0.4rem 0 0', lineHeight: 1.5 }}>
                        In Google Maps, choose Share → Embed a map, then paste only the secure <code>src="https://…"</code> URL here.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setAreasEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>Cancel</button>
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
                          setMsg(areasEdit === 'new' ? 'Service area map added.' : 'Service area map updated.')
                          setTimeout(() => setMsg(''), 2000)
                        } catch { setMsg('Failed to save service area map.'); setTimeout(() => setMsg(''), 2000) }
                      }} style={{ flex: 1, padding: '0.75rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>
                        {areasEdit === 'new' ? 'Add Map' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {socialsEdit && (
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) requestEditorClose('social link editor', () => setSocialsEdit(null)) }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="social-dialog-title" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '500px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 id="social-dialog-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>{socialsEdit === 'new' ? 'Add Social Link' : 'Edit Social Link'}</h3>
                      <button type="button" aria-label="Close social link editor" onClick={() => setSocialsEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#334155', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Platform *</label>
                        <select autoFocus aria-label="Social platform" value={socialsForm.platform} onChange={e => setSocialsForm(prev => ({ ...prev, platform: e.target.value }))} style={inputStyle}>
                          {SOCIAL_PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Order</label>
                        <input type="number" value={socialsForm.order} onChange={e => setSocialsForm(prev => ({ ...prev, order: Number(e.target.value) }))} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>URL *</label>
                      <input aria-label="Social profile HTTPS URL" type="url" inputMode="url" autoComplete="url" value={socialsForm.url} onChange={e => setSocialsForm(prev => ({ ...prev, url: e.target.value }))} style={inputStyle} placeholder="https://facebook.com/yourpage" />
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#334155', margin: '0.4rem 0 0', lineHeight: 1.5 }}>
                        Use the complete HTTPS address for this profile. Saving updates the website footer.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setSocialsEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>Cancel</button>
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

              {refundDetails && (
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={event => { if (event.target === event.currentTarget) setRefundDetails(null) }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="refund-details-title" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}><div><h3 id="refund-details-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: DARK, fontWeight: 800, margin: 0 }}>Refund Details</h3><p style={{ margin: '.3rem 0 0', color: '#475569' }}>{refundDetails.Full_Name || 'Student'} · {refundDetails.Course_Name || 'Course not recorded'}</p></div><button autoFocus type="button" aria-label="Close refund details" onClick={() => setRefundDetails(null)} style={{ background: 'none', border: 0, fontSize: '1.5rem', color: '#334155', cursor: 'pointer' }}>&times;</button></div>
                    <div style={{ padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#F8FAFC', marginBottom: '1rem' }}><div style={{ color: '#475569', fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 800, marginBottom: '.45rem' }}>Full reason</div><p style={{ margin: 0, color: '#1E293B', lineHeight: 1.7, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{refundDetails.Reason || 'No reason was recorded.'}</p></div>
                    <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(130px,.6fr) minmax(0,1.4fr)', gap: '.65rem 1rem', margin: 0, overflowWrap: 'anywhere' }}><dt style={{ color: '#64748B', fontWeight: 750 }}>Status</dt><dd style={{ margin: 0, fontWeight: 800, textTransform: 'capitalize' }}>{refundDetails.Status || 'pending'}</dd><dt style={{ color: '#64748B', fontWeight: 750 }}>Amount</dt><dd style={{ margin: 0 }}>{refundDetails.Amount || 'Not recorded'}</dd><dt style={{ color: '#64748B', fontWeight: 750 }}>PayPal reference</dt><dd style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '.85rem' }}>{refundDetails.PayPal_Reference || refundDetails.Provider_Refund_ID || refundDetails.Provider_Payment_Ref || 'Not available'}</dd><dt style={{ color: '#64748B', fontWeight: 750 }}>Capture ID</dt><dd style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '.85rem' }}>{refundDetails.PayPal_Capture_ID || refundDetails.Provider_Capture_ID || 'Not available'}</dd></dl>
                    <button type="button" onClick={() => setRefundDetails(null)} style={{ width: '100%', marginTop: '1.4rem', minHeight: '44px', border: 0, borderRadius: '10px', background: SKY_BLUE, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Close</button>
                  </div>
                </div>
              )}

              {refundEdit && (
                <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={(e) => { if (e.target === e.currentTarget) requestEditorClose('refund editor', () => setRefundEdit(null)) }}>
                  <div role="dialog" aria-modal="true" aria-labelledby="refund-dialog-title" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', padding: '2rem', animation: 'dashFadeIn 0.3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <h3 id="refund-dialog-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, margin: 0 }}>{refundEdit === 'new' ? 'Add Refund Record' : 'Edit Refund Record'}</h3>
                      <button type="button" aria-label="Close refund editor" onClick={() => setRefundEdit(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#334155', cursor: 'pointer' }}>&times;</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Student Name *</label>
                        <input autoFocus aria-label="Refund record student name" type="text" value={refundForm.Full_Name} onChange={e => setRefundForm(prev => ({ ...prev, Full_Name: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Amount *</label>
                        <input aria-label="Refund record amount" type="text" inputMode="decimal" value={refundForm.Amount} onChange={e => setRefundForm(prev => ({ ...prev, Amount: e.target.value }))} style={inputStyle} placeholder="$210" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Email</label>
                        <input aria-label="Refund record email" type="email" value={refundForm.Email} onChange={e => setRefundForm(prev => ({ ...prev, Email: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Phone</label>
                        <input aria-label="Refund record phone" type="tel" value={refundForm.Phone} onChange={e => setRefundForm(prev => ({ ...prev, Phone: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Course</label>
                        <input type="text" value={refundForm.Course_Name} onChange={e => setRefundForm(prev => ({ ...prev, Course_Name: e.target.value }))} style={inputStyle} placeholder="IDEAL FOR STUDENTS" />
                      </div>
                      <div>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Status</label>
                        <select aria-label="Refund status" disabled={refundEdit === 'new'} value={refundEdit === 'new' ? 'pending' : refundForm.Status} onChange={e => setRefundForm(prev => ({ ...prev, Status: e.target.value }))} style={{ ...inputStyle, cursor: refundEdit === 'new' ? 'not-allowed' : 'pointer', opacity: refundEdit === 'new' ? .75 : 1 }}>
                          <option value="pending">Pending</option>
                          <option value="refunded">Refunded</option>
                          <option value="denied">Denied</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>Reason</label>
                      <textarea rows="3" value={refundForm.Reason} onChange={e => setRefundForm(prev => ({ ...prev, Reason: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Why is this being refunded?" />
                    </div>
                    {refundEdit !== 'new' && refundForm.Status === 'refunded' && (
                      <div role="alert" style={{ marginBottom: '1.25rem', padding: '.85rem 1rem', border: '1px solid #FCD34D', borderRadius: '12px', background: '#FFFBEB', color: '#92400E', fontSize: '.9rem', lineHeight: 1.55, fontWeight: 650 }}>
                        Saving will open a final confirmation before PayPal is called. The confirmation includes the matched PayPal reference.
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button onClick={() => setRefundEdit(null)} style={{ flex: 1, padding: '0.75rem', background: 'none', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={handleSaveRefund} style={{ flex: 1, padding: '0.75rem', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(1,69,168,0.2)' }}>
                        {refundEdit === 'new' ? 'Add Refund' : refundForm.Status === 'refunded' ? 'Issue PayPal Refund' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {phoneBookingOpen && (
        <AdminPhoneBookingModal
          users={users}
          onClose={() => setPhoneBookingOpen(false)}
          onCreated={handlePhoneBookingCreated}
        />
      )}

      <AdminUserDetailsModal
        dialog={userDetailsDialog}
        onClose={closeUserDetails}
        onRetry={() => userDetailsDialog?.user && openUserDetails(userDetailsDialog.user)}
      />

      {confirmDialog && (
        <div role="presentation" style={{ position: 'fixed', inset: 0, zIndex: 15000, display: 'grid', placeItems: 'center', padding: '1rem', background: 'rgba(10,22,40,0.68)', backdropFilter: 'blur(10px)' }} onClick={(event) => { if (event.target === event.currentTarget && !confirmDialog.busy) setConfirmDialog(null) }}>
          <div className="admin-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-description" style={{ width: 'min(100%, 430px)', padding: '1.75rem', borderRadius: '18px', background: '#fff', border: '1px solid #E2EBF5', boxShadow: '0 30px 90px rgba(10,22,40,0.32)' }}>
            <div style={{ width: '46px', height: '46px', display: 'grid', placeItems: 'center', marginBottom: '1rem', borderRadius: '13px', background: '#FEF2F2', color: '#DC2626' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.7 2.4 17.4A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.6L13.7 3.7a2 2 0 0 0-3.4 0Z"/></svg>
            </div>
            <h2 id="admin-confirm-title" style={{ margin: '0 0 0.5rem', color: DARK, fontSize: '1.35rem', fontWeight: 800 }}>{confirmDialog.title}</h2>
            <p id="admin-confirm-description" style={{ margin: '0 0 1.4rem', color: '#334155', fontSize: '0.92rem' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button autoFocus disabled={confirmDialog.busy} onClick={() => setConfirmDialog(null)} style={{ minHeight: '44px', padding: '0.65rem 1rem', border: '1px solid #CBD5E1', borderRadius: '10px', color: '#475569', background: '#fff', fontWeight: 800 }}>Cancel</button>
              <button disabled={confirmDialog.busy} onClick={runConfirmedAction} style={{ minWidth: '126px', minHeight: '44px', padding: '0.65rem 1rem', borderRadius: '10px', color: '#fff', background: '#DC2626', fontWeight: 800, boxShadow: '0 8px 20px rgba(220,38,38,0.2)' }}>{confirmDialog.busy ? 'Processing…' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
      {detailsDialog && (
        <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 14000, display: 'grid', placeItems: 'center', padding: '1rem', background: 'rgba(10,22,40,.65)', backdropFilter: 'blur(10px)' }} onClick={event => { if (event.target === event.currentTarget) setDetailsDialog(null) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="admin-details-title" style={{ width: 'min(100%,620px)', maxHeight: '85vh', overflowY: 'auto', padding: '1.75rem', borderRadius: '18px', background: '#fff', boxShadow: '0 30px 90px rgba(10,22,40,.32)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}><div><h2 id="admin-details-title" style={{ margin: 0, color: DARK, fontSize: '1.3rem' }}>{detailsDialog.title}</h2>{detailsDialog.subtitle && <p style={{ margin: '.3rem 0 0', color: '#475569' }}>{detailsDialog.subtitle}</p>}</div><button autoFocus type="button" aria-label="Close details" onClick={() => setDetailsDialog(null)} style={{ border: 0, background: 'transparent', fontSize: '1.6rem', cursor: 'pointer' }}>&times;</button></div>
            <div style={{ marginTop: '1.2rem', padding: '1rem', border: '1px solid #E2E8F0', borderRadius: '12px', background: '#F8FAFC', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.7 }}>{detailsDialog.content}</div>
            <button type="button" onClick={() => setDetailsDialog(null)} style={{ width: '100%', minHeight: '44px', marginTop: '1.2rem', border: 0, borderRadius: '10px', background: SKY_BLUE, color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </>
  )
}
