import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useCallback } from 'react'
import { signOut, updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { api } from '../api'
import { usePageMeta } from '../usePageMeta'
import { openPrintableDocument } from '../utils/printDocument'
import { ONLINE_COURSE_CURRICULUM } from '../data/onlineCourseCurriculum'
import { UserLiveSupportPanel } from '../components/LiveSupportPanels'
import PasswordInput from '../components/PasswordInput'
import ChatMessageContent from '../components/ChatMessageContent'
import ProfilePhotoUploader from '../components/ProfilePhotoUploader'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

const localDateKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date)

const formatUSD = (value) => {
  const amount = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''))

  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    : '$0.00'
}

const moneyValue = (value) => {
  const amount = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

const refundedPaymentAmount = (payment) => Math.max(0, moneyValue(payment?.refundedAmount))
const netPaymentAmount = (payment) => Math.max(0, moneyValue(payment?.amount) - refundedPaymentAmount(payment))

const paymentStatusColors = (status) => {
  const normalized = normalizeStatus(status)
  if (normalized === 'paid') return { background:'rgba(5,150,105,0.06)', color:'#047857' }
  if (normalized === 'refunded' || normalized === 'partially refunded') return { background:'rgba(202,138,4,0.09)', color:'#A16207' }
  if (normalized === 'pending') return { background:'rgba(234,179,8,0.08)', color:'#A16207' }
  return { background:'rgba(220,38,38,0.06)', color:'#B91C1C' }
}

const normalizeStatus = (status) => String(status || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ')

const slotLimitForCourse = (course) => {
  const id = String(course?.id || '')
  const name = String(course?.title || course?.planName || '').toUpperCase()
  if (id === '2' || name.includes('BASIC PLAN')) return 1
  if (id === '5' || name.includes('PREMIER')) return 5
  if (id === '3' || name.includes('ESSENTIAL')) return 3
  if (id === '4' || name.includes('IDEAL FOR STUDENTS')) return 3
  if (['6', '7', '8'].includes(id) || name.includes('DMV DRIVE TEST CAR RENTAL') || name.includes('FREEWAY FOCUSED COURSE')) return 1
  return 3
}

const courseSlotUsage = (course) => {
  const maximum = Number(course?.slotAllowance?.maximum ?? course?.slotUsage?.maximum ?? course?.slotLimit) || slotLimitForCourse(course)
  const selected = Array.isArray(course?.pickupSlots) ? course.pickupSlots.length : 0
  const used = Math.min(maximum, Number(course?.slotAllowance?.used ?? course?.slotUsage?.used ?? selected) || 0)
  const remaining = Math.max(0, Number(course?.slotAllowance?.remaining ?? (maximum - used)) || 0)
  return { used, maximum, remaining }
}

const bookingSortValue = (booking) => {
  const date = String(booking?.date || '')
  const time = String(booking?.timeSlot || booking?.time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  let minutes = 0
  if (time) {
    let hour = Number(time[1]) % 12
    if (time[3].toUpperCase() === 'PM') hour += 12
    minutes = hour * 60 + Number(time[2])
  }
  return `${date}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

const profileTabs = new Set(['dashboard', 'courses', 'payments', 'settings', 'course'])
const dashboardTabs = new Set(['dashboard', 'courses', 'bookings', 'payments', 'course', 'settings', 'live-support', 'support'])

const dashboardLoadMessage = (result, label) => {
  if (result.status !== 'rejected') return ''
  if (result.reason?.status === 401) {
    return 'We could not verify your account session. Please refresh the page or sign in again.'
  }
  if (result.reason?.status === 403) {
    return `You do not have permission to load your ${label.toLowerCase()}.`
  }
  return `${label} could not be loaded. Please check your connection and retry.`
}

const TIME_SLOTS = [
  { id: 'slot1', label: 'Morning 1', time: '9:00 AM - 11:00 AM', hours: 2 },
  { id: 'slot2', label: 'Morning 2', time: '11:00 AM - 1:00 PM', hours: 2 },
  { id: 'slot3', label: 'Afternoon 1', time: '2:00 PM - 4:00 PM', hours: 2 },
  { id: 'slot4', label: 'Afternoon 2', time: '4:00 PM - 6:00 PM', hours: 2 },
]
const COURSE_MODULES = [
  { id: 'mod1', title: 'Traffic Signs & Signals', description: 'Learn to identify and understand all major traffic signs and signals.', lessons: [{ title: 'Regulatory Signs', content: 'Regulatory signs tell you what to do. They are typically rectangular or square with black text on a white background. Stop signs are red octagons, yield signs are red and white triangles. Speed limit signs show the maximum legal speed in white rectangles with black numbers.' }, { title: 'Warning Signs', content: 'Warning signs are diamond-shaped with a yellow background and black symbols. They alert you to potential hazards ahead such as curves, merges, school zones, and pedestrian crossings. Orange diamond signs indicate construction zones.' }, { title: 'Traffic Signals', content: 'Traffic lights control the flow of traffic at intersections. Green means go, yellow means prepare to stop, red means stop. Green arrows indicate protected turns. Flashing red means treat as a stop sign; flashing yellow means slow down and proceed with caution.' }], quiz: [{ question: 'What shape is a standard stop sign?', options: ['Square', 'Triangle', 'Octagon', 'Circle'], correct: 2 }, { question: 'A yellow diamond-shaped sign indicates:', options: ['Speed limit', 'Warning', 'Regulatory', 'Construction only'], correct: 1 }, { question: 'A flashing yellow traffic light means:', options: ['Stop immediately', 'Proceed with caution', 'Turn left only', 'Speed up'], correct: 1 }] },
  { id: 'mod2', title: 'Right of Way & Intersections', description: 'Master the rules of right of way at intersections and crosswalks.', lessons: [{ title: 'Four-Way Stops', content: 'At a four-way stop, the first vehicle to arrive and come to a complete stop has the right of way. If two vehicles arrive simultaneously, the vehicle on the right goes first. If facing each other, the vehicle going straight has right of way over the one turning.' }, { title: 'Roundabouts', content: 'When entering a roundabout, always yield to traffic already inside. Travel counterclockwise and use your turn signal when exiting. Do not stop inside the roundabout. Choose your lane before entering based on your intended exit.' }, { title: 'Pedestrian Crosswalks', content: 'Always stop for pedestrians in marked crosswalks. In California, you must stop at least 15 feet from a crosswalk when a pedestrian is present. Yield to pedestrians at unmarked crosswalks as well. Watch for pedestrians when turning at intersections.' }], quiz: [{ question: 'At a four-way stop, who goes first?', options: ['The largest vehicle', 'The first to arrive and stop', 'The vehicle on the left', 'The vehicle going straight'], correct: 1 }, { question: 'When entering a roundabout, you must:', options: ['Stop and wait for a gap', 'Yield to traffic already inside', 'Speed through quickly', 'Use your horn'], correct: 1 }, { question: 'You must stop at least ___ feet from a crosswalk for a pedestrian.', options: ['5 feet', '10 feet', '15 feet', '20 feet'], correct: 2 }] },
  { id: 'mod3', title: 'Defensive Driving & Safety', description: 'Develop defensive driving habits for a lifetime of safe driving.', lessons: [{ title: 'Safe Following Distance', content: 'Maintain at least a 3-second following distance under normal conditions. In rain, double it to 6 seconds. At night or in fog, increase further. Count "one-thousand-one, one-thousand-two, one-thousand-three" after the car ahead passes a fixed object.' }, { title: 'Blind Spots & Mirror Checks', content: 'Every vehicle has blind spots where other cars cannot be seen in mirrors. Before changing lanes, check your rearview mirror, side mirror, then look over your shoulder into the blind spot. Use the SMOG technique: Signal, Mirror, Over-the-shoulder, Go.' }, { title: 'Adverse Weather Driving', content: 'Reduce speed in rain, fog, or ice. Turn on headlights in poor visibility. Avoid sudden braking or sharp turns. Increase following distance significantly. If visibility becomes extremely low, pull off the road to a safe location and turn on hazard lights.' }], quiz: [{ question: 'The recommended minimum following distance is:', options: ['1 second', '2 seconds', '3 seconds', '5 seconds'], correct: 2 }, { question: 'What does SMOG stand for in lane changing?', options: ['Signal, Move, Obey, Go', 'Signal, Mirror, Over-shoulder, Go', 'Slow, Mirror, Obey, Go', 'Signal, Merge, Obey, Go'], correct: 1 }, { question: 'In heavy rain, you should:', options: ['Maintain highway speed', 'Turn off headlights', 'Reduce speed and increase following distance', 'Use cruise control'], correct: 2 }] },
]

const I = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>,
  book: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  profile: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>,
  menu: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  close: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
}

export default function DashboardPage() {
  usePageMeta('Student Dashboard — A Precision Driving School', 'Manage your driving courses, lesson bookings, profile and support with A Precision Driving School.')
  const { user, isAdmin, refreshProfile, refreshAuthUser } = useAuth()
  const { count: cartCount } = useCart()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [courseType, setCourseType] = useState('')
  const [notice, setNotice] = useState({ text: '', type: 'success' })
  const [loading, setLoading] = useState(true)
  const [loadErrors, setLoadErrors] = useState({ profile: '', bookings: '' })
  const [loadVersion, setLoadVersion] = useState(0)
  const requestedTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(dashboardTabs.has(requestedTab) ? requestedTab : 'dashboard')
  const [bookings, setBookings] = useState([])
  const [completedModules, setCompletedModules] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [moduleStep, setModuleStep] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [medications, setMedications] = useState('')
  const [permit, setPermit] = useState('')
  const [notes, setNotes] = useState('')
  const [submittedAt, setSubmittedAt] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [courses, setCourses] = useState([])
  const [payments, setPayments] = useState([])
  const [courseSearch, setCourseSearch] = useState('')
  const [courseStatusFilter, setCourseStatusFilter] = useState('all')
  const [coursePage, setCoursePage] = useState(1)
  const [paymentSearch, setPaymentSearch] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [paymentPage, setPaymentPage] = useState(1)
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [supportUnread, setSupportUnread] = useState(0)
  const [sUsername, setSUsername] = useState('')
  const [sPhotoURL, setSPhotoURL] = useState(user?.photoURL || '')
  const [sPhone, setSPhone] = useState('')
  const [sAddress, setSAddress] = useState('')
  const [sPermit, setSPermit] = useState('')
  const [sMedications, setSMedications] = useState('')
  const [sNotes, setSNotes] = useState('')
  const [sSubmittedAt, setSSubmittedAt] = useState('')
  const [sIssueDate, setSIssueDate] = useState('')
  const [sExpiryDate, setSExpiryDate] = useState('')
  const [sSaving, setSSaving] = useState(false)
  const [sCurrentPass, setSCurrentPass] = useState('')
  const [sNewPass, setSNewPass] = useState('')
  const [sConfirmPass, setSConfirmPass] = useState('')
  const [savedSettings, setSavedSettings] = useState(null)
  const showCourse = courseType === '1' || courses.some(c => c.id === '1')
  const currentSettings = {
    username: sUsername, phone: sPhone, address: sAddress, permit: sPermit,
    medications: sMedications, notes: sNotes, submittedAt: sSubmittedAt,
    issueDate: sIssueDate, expiryDate: sExpiryDate,
  }
  const settingsDirty = Boolean(savedSettings) && (
    JSON.stringify(currentSettings) !== JSON.stringify(savedSettings)
    || Boolean(sNewPass || sConfirmPass)
  )

  const noticeTimerRef = useRef(null)
  const modalRef = useRef(null)
  const profileMenuRef = useRef(null)
  const showNotice = (text, type = 'success', duration = 3000) => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
    setNotice({ text, type })
    noticeTimerRef.current = setTimeout(() => setNotice({ text: '', type: 'success' }), duration)
  }

  useEffect(() => () => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current)
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    const nextTab = dashboardTabs.has(tab) ? tab : 'dashboard'
    setActiveTab(current => current === nextTab ? current : nextTab)
  }, [searchParams])

  useEffect(() => {
    const warnBeforeLeaving = (event) => {
      if (!settingsDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [settingsDirty])

  useEffect(() => {
    if (!user) return
    let active = true
    const load = async () => {
      setLoading(true)
      setLoadErrors({ profile: '', bookings: '' })
      try {
        const [profileResult, bookingsResult] = await Promise.allSettled([api.getUser(user.uid), api.getBookings(user.uid)])
        if (!active) return
        const profile = profileResult.status === 'fulfilled' ? profileResult.value : null
        if (profile && typeof profile === 'object') {
          setPhone(profile.phone || '')
          setAddress(profile.address || '')
          setCourseType(profile.courseType || '')
          setCompletedModules(profile.completedModules || [])
          setMedications(profile.medications || '')
          setPermit(profile.permit || '')
          setNotes(profile.notes || '')
          setSubmittedAt(profile.submittedAt || '')
          setIssueDate(profile.issueDate || '')
          setExpiryDate(profile.expiryDate || '')
          setCourses(Array.isArray(profile.courses) ? profile.courses : [])
          setPayments(Array.isArray(profile.payments) ? profile.payments : [])
          setSupportUnread((Array.isArray(profile.messages) ? profile.messages : []).filter(thread => thread?.unreadByUser).length)
          setSUsername(profile.username || profile.displayName || '')
          setSPhotoURL(profile.photoURL || user.photoURL || '')
          setSPhone(profile.phone || '')
          setSAddress(profile.address || '')
          setSPermit(profile.permit || '')
          setSMedications(profile.medications || '')
          setSNotes(profile.notes || '')
          setSSubmittedAt(profile.submittedAt || '')
          setSIssueDate(profile.issueDate || '')
          setSExpiryDate(profile.expiryDate || '')
          setSavedSettings({
            username: profile.username || profile.displayName || '', phone: profile.phone || '',
            address: profile.address || '', permit: profile.permit || '', medications: profile.medications || '',
            notes: profile.notes || '', submittedAt: profile.submittedAt || '', issueDate: profile.issueDate || '',
            expiryDate: profile.expiryDate || '',
          })
        }
        if (bookingsResult.status === 'fulfilled' && Array.isArray(bookingsResult.value)) {
          setBookings(bookingsResult.value)
        }
        setLoadErrors({
          profile: dashboardLoadMessage(profileResult, 'Account information'),
          bookings: dashboardLoadMessage(bookingsResult, 'Lesson bookings'),
        })
      } catch {
        if (active) {
          setLoadErrors({
            profile: 'Account information could not be loaded. Please check your connection and retry.',
            bookings: 'Lesson bookings could not be loaded. Please check your connection and retry.',
          })
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [user, loadVersion])

  const handleLogout = async () => {
    if (logoutLoading) return
    if (settingsDirty) {
      setUnsavedConfirm({ action: 'logout' })
      return
    }
    await performLogout()
  }

  const performLogout = async () => {
    setLogoutLoading(true)
    try {
      await signOut(auth)
      navigate('/', { replace: true })
    } catch {
      showNotice('Sign out failed. Please check your connection and try again.', 'error')
      setLogoutLoading(false)
    }
  }
  const [courseDetail, setCourseDetail] = useState(null)
  const [refundConfirm, setRefundConfirm] = useState(null)
  const [cancelConfirm, setCancelConfirm] = useState(null)
  const [refundReason, setRefundReason] = useState('')
  const [courseActionLoading, setCourseActionLoading] = useState('')
  const [courseActionError, setCourseActionError] = useState('')
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [quizSaving, setQuizSaving] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [conversationLoading, setConversationLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [conversationActionId, setConversationActionId] = useState('')
  const [conversationDeleteConfirm, setConversationDeleteConfirm] = useState(null)
  const [conversationError, setConversationError] = useState('')
  const [conversationVersion, setConversationVersion] = useState(0)
  const [conversationSearch, setConversationSearch] = useState('')
  const [conversationPage, setConversationPage] = useState(1)
  const [unsavedConfirm, setUnsavedConfirm] = useState(null)
  const [textDetails, setTextDetails] = useState(null)

  const openModalKey = unsavedConfirm ? 'unsaved-settings'
    : textDetails ? 'text-details'
    : courseDetail ? 'course-detail'
    : cancelConfirm ? 'cancel-course'
      : refundConfirm ? 'refund-course'
        : conversationDeleteConfirm ? 'delete-conversation'
          : ''

  const closeActiveModal = useCallback(() => {
    if (courseActionLoading || conversationActionId) return
    setCourseDetail(null)
    setCancelConfirm(null)
    setRefundConfirm(null)
    setRefundReason('')
    setCourseActionError('')
    setBookingCancelConfirm(null)
    setBookingCancelError('')
    setConversationDeleteConfirm(null)
    setUnsavedConfirm(null)
    setTextDetails(null)
  }, [courseActionLoading, conversationActionId])

  useEffect(() => {
    if (!openModalKey || !modalRef.current) return undefined
    const previouslyFocused = document.activeElement
    const modal = modalRef.current
    const selector = 'button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
    const focusable = () => Array.from(modal.querySelectorAll(selector)).filter(element => !element.hasAttribute('hidden'))
    focusable()[0]?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeActiveModal()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [openModalKey, closeActiveModal])

  useEffect(() => {
    const closeMenus = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false)
        setSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', closeMenus)
    return () => document.removeEventListener('keydown', closeMenus)
  }, [])

  useEffect(() => {
    if (!user || activeTab !== 'support') return
    let active = true
    const loadConversations = async () => {
      setConversationLoading(true)
      setConversationError('')
      try {
        const data = await api.getConversations(user.uid)
        if (active) setConversations(Array.isArray(data) ? data : [])
      } catch {
        if (active) {
          setConversationError('Support history could not be loaded. You can still start a new conversation or retry.')
        }
      } finally {
        if (active) setConversationLoading(false)
      }
    }
    loadConversations()
    return () => { active = false }
  }, [activeTab, user, conversationVersion])
  const handleCompleteQuiz = async (moduleId, correctCount) => {
    setQuizScore(correctCount); setQuizSubmitted(true)
    if (correctCount >= 2 && !completedModules.includes(moduleId)) {
      const updated = [...completedModules, moduleId]
      setQuizSaving(true)
      try {
        const onlineCourse = [...courses].reverse().find(course => String(course.id) === '1' && !['refund pending', 'refunded', 'cancelled', 'canceled'].includes(normalizeStatus(course.status)))
        const result = onlineCourse
          ? await api.saveCourseProgress(user.uid, onlineCourse.enrollmentId || onlineCourse.id, updated)
          : await api.saveUser(user.uid, { completedModules: updated })
        const savedModules = Array.isArray(result?.completedModules) ? result.completedModules : updated
        setCompletedModules(savedModules)
        if (result?.course) {
          setCourses(previous => previous.map(course => {
            const sameEnrollment = result.course.enrollmentId && course.enrollmentId === result.course.enrollmentId
            const legacyMatch = !result.course.enrollmentId && course === onlineCourse
            return sameEnrollment || legacyMatch ? result.course : course
          }))
        }
      } catch (error) {
        showNotice(error.message || 'Your quiz result could not be saved. Please try again.', 'error')
      } finally {
        setQuizSaving(false)
      }
    }
  }
  const openModule = (moduleId) => { setActiveModule(moduleId); setModuleStep(0); setQuizAnswers({}); setQuizSubmitted(false); setQuizScore(0) }

  const handleCancelCourse = async (courseRef) => {
    if (courseActionLoading) return
    const courseId = courseRef?.courseId || courseRef
    const enrollmentId = courseRef?.enrollmentId || ''
    setCourseActionLoading('cancel')
    setCourseActionError('')
    try {
      const result = await api.removeCourse(user.uid, courseId, enrollmentId)
      if (!result?.ok) throw new Error('The course could not be cancelled.')
      setCourses(Array.isArray(result.courses)
        ? result.courses
        : prev => prev.filter(course => enrollmentId ? String(course.enrollmentId) !== String(enrollmentId) : String(course.id) !== String(courseId)))
      try {
        const refreshedBookings = await api.getBookings(user.uid)
        if (Array.isArray(refreshedBookings)) setBookings(refreshedBookings)
      } catch {
        setLoadErrors(prev => ({ ...prev, bookings: 'Lesson bookings changed, but the latest list could not be loaded. Please retry.' }))
      }
      setCancelConfirm(null)
      showNotice(result.unlinkedBookings > 0
        ? `Course cancelled. Please review ${result.unlinkedBookings} older unlinked lesson booking${result.unlinkedBookings === 1 ? '' : 's'} on the Lessons page.`
        : 'Course and its linked lesson bookings were cancelled successfully.', 'success', result.unlinkedBookings > 0 ? 5000 : 3000)
    } catch (error) {
      setCourseActionError(error.message || 'The course could not be cancelled. Please try again.')
    } finally {
      setCourseActionLoading('')
    }
  }

  const handleRefundCourse = async (courseRef) => {
    if (courseActionLoading) return
    const courseId = courseRef?.courseId || courseRef
    const enrollmentId = courseRef?.enrollmentId || ''
    setCourseActionLoading('refund')
    setCourseActionError('')
    try {
      const result = await api.requestCourseRefund(user.uid, courseId, refundReason.trim(), enrollmentId)
      if (!result?.ok) throw new Error('The refund request could not be submitted.')
      setCourses(Array.isArray(result.courses)
        ? result.courses
        : prev => prev.map(course => (enrollmentId ? String(course.enrollmentId) === String(enrollmentId) : String(course.id) === String(courseId)) ? { ...course, status: 'Refund Pending' } : course))
      try {
        const refreshedBookings = await api.getBookings(user.uid)
        if (Array.isArray(refreshedBookings)) setBookings(refreshedBookings)
      } catch {
        setLoadErrors(prev => ({ ...prev, bookings: 'Lesson bookings changed, but the latest list could not be loaded. Please retry.' }))
      }
      setRefundConfirm(null)
      setRefundReason('')
      showNotice(result.duplicate
        ? 'Your refund request is already pending.'
        : result.unlinkedBookings > 0
          ? `Refund request submitted. Please review ${result.unlinkedBookings} older unlinked lesson booking${result.unlinkedBookings === 1 ? '' : 's'} on the Lessons page.`
          : 'Refund request submitted for review. Linked future lessons were cancelled.', 'success', result.unlinkedBookings > 0 ? 5000 : 3000)
    } catch (error) {
      setCourseActionError(error.message || 'The refund request could not be submitted. Please try again.')
    } finally {
      setCourseActionLoading('')
    }
  }

  const handleSaveSettings = async () => {
    if (!sUsername.trim()) {
      showNotice('Please enter your name before saving.', 'error')
      return
    }
    if (sPhone && !/^[+()\d\s.-]{7,30}$/.test(sPhone)) {
      showNotice('Please enter a valid phone number.', 'error')
      return
    }
    if (sSubmittedAt && sSubmittedAt > localDateKey()) {
      showNotice('Submitted date cannot be in the future.', 'error')
      return
    }
    if (sIssueDate && sExpiryDate && sExpiryDate <= sIssueDate) {
      showNotice('Expiry date must be later than the issue date.', 'error')
      return
    }
    const changingPassword = hasPasswordProvider && Boolean(sNewPass || sConfirmPass)
    if (changingPassword && (!sCurrentPass || !sNewPass || !sConfirmPass)) {
      showNotice('Please complete all password fields.', 'error')
      return
    }
    if (changingPassword && sNewPass.length < 8) {
      showNotice('New password must contain at least 8 characters.', 'error')
      return
    }
    if (changingPassword && sNewPass !== sConfirmPass) {
      showNotice('New passwords do not match.', 'error')
      return
    }
    setSSaving(true)
    let passwordUpdated = false
    try {
      if (changingPassword) {
        const credential = EmailAuthProvider.credential(user.email, sCurrentPass)
        await reauthenticateWithCredential(user, credential)
        await updatePassword(user, sNewPass)
        passwordUpdated = true
        setSCurrentPass('')
        setSNewPass('')
        setSConfirmPass('')
      }
      const data = {
        username: sUsername.trim(),
        phone: sPhone.trim(),
        address: sAddress.trim(),
        permit: sPermit.trim(),
        medications: sMedications.trim(),
        notes: sNotes.trim(),
        submittedAt: sSubmittedAt,
        issueDate: sIssueDate,
        expiryDate: sExpiryDate,
      }
      await api.saveUser(user.uid, data)
      if (data.username !== user.displayName) {
        await updateProfile(user, { displayName: data.username })
      }
      setSUsername(data.username)
      setSPhone(data.phone)
      setSAddress(data.address)
      setSPermit(data.permit)
      setSMedications(data.medications)
      setSNotes(data.notes)
      setPhone(data.phone)
      setAddress(data.address)
      setPermit(data.permit)
      setMedications(data.medications)
      setNotes(data.notes)
      setSubmittedAt(sSubmittedAt)
      setIssueDate(sIssueDate)
      setExpiryDate(sExpiryDate)
      setSavedSettings(data)
      showNotice(passwordUpdated ? 'Settings and password updated successfully.' : 'Settings saved successfully!')
    } catch (e) {
      const authCode = String(e.code || '')
      const message = ['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(authCode)
        ? 'Current password is incorrect.'
        : authCode === 'auth/weak-password'
          ? 'New password is too weak.'
          : authCode === 'auth/requires-recent-login'
            ? 'Please sign out, sign in again, and retry the password change.'
            : passwordUpdated
              ? 'Your password was updated, but the profile changes could not be saved. Please retry.'
              : e.message || 'Failed to save settings.'
      showNotice(message, 'error')
    } finally {
      setSSaving(false)
    }
  }

  const handleUploadProfilePhoto = async (file) => {
    setSSaving(true)
    try {
      if (!user?.uid) throw new Error('Your session has expired. Please sign in again.')
      const result = await api.uploadProfileImage(user.uid, file)
      const photoURL = result?.photoURL || ''
      if (!photoURL) throw new Error('The image service did not return a profile photo.')
      const refreshedUser = await refreshAuthUser()
      await refreshProfile(refreshedUser)
      setSPhotoURL(photoURL)
      showNotice('Profile photo uploaded successfully.')
    } catch (error) {
      showNotice(error?.message || 'The profile photo could not be uploaded.', 'error')
      throw error
    } finally {
      setSSaving(false)
    }
  }

  const handleRemoveProfilePhoto = async () => {
    setSSaving(true)
    try {
      if (!user?.uid) throw new Error('Your session has expired. Please sign in again.')
      await api.removeProfileImage(user.uid)
      const refreshedUser = await refreshAuthUser()
      await refreshProfile(refreshedUser)
      setSPhotoURL('')
      showNotice('Profile photo removed.')
    } catch (error) {
      showNotice(error?.message || 'The profile photo could not be removed.', 'error')
      throw error
    } finally {
      setSSaving(false)
    }
  }

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading || conversationLoading) return
    const userMsg = { role: 'user', content: chatInput.trim() }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)
    try {
      const result = await api.chat(newMessages.map(m => ({ role: m.role, content: m.content })))
      if (!result?.ok || !result.reply) throw new Error('The assistant did not return an answer.')
      const updated = [...newMessages, { role: 'assistant', content: result.reply }]
      setChatMessages(updated)
      try {
        if (activeConvId) {
          await api.updateConversation(user.uid, activeConvId, { messages: updated })
        } else {
          const title = userMsg.content.slice(0, 50)
          const res2 = await api.createConversation(user.uid, title, updated)
          if (res2.ok) setActiveConvId(res2.conversation.id)
        }
        const allConvs = await api.getConversations(user.uid)
        setConversations(Array.isArray(allConvs) ? allConvs : [])
      } catch {
        showNotice('Your answer is visible, but the conversation history could not be saved.', 'error', 3500)
      }
    } catch {
      setChatMessages([...newMessages, { role: 'assistant', content: 'Sorry, the assistant is temporarily unavailable. Please try again later or contact us at +1 925 329 1736.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleNewChat = () => {
    if (chatLoading || conversationLoading || conversationActionId) return
    setChatMessages([])
    setActiveConvId(null)
    setChatInput('')
  }

  const handleSelectConv = async (convId) => {
    if (chatLoading || conversationLoading || conversationActionId || convId === activeConvId) return
    setConversationLoading(true)
    try {
      const conv = await api.getConversation(user.uid, convId)
      if (conv) {
        setChatMessages(Array.isArray(conv.messages) ? conv.messages : [])
        setActiveConvId(convId)
      }
    } catch {
      showNotice('The conversation could not be loaded. Please try again.', 'error')
    } finally {
      setConversationLoading(false)
    }
  }

  const handleDeleteConv = (e, convId) => {
    e.stopPropagation()
    if (chatLoading || conversationLoading || conversationActionId) return
    setConversationDeleteConfirm(convId)
  }

  const confirmDeleteConversation = async () => {
    const convId = conversationDeleteConfirm
    if (!convId || chatLoading || conversationLoading || conversationActionId) return
    setConversationActionId(convId)
    try {
      await api.deleteConversation(user.uid, convId)
      setConversations(prev => prev.filter(c => c.id !== convId))
      if (activeConvId === convId) {
        setChatMessages([])
        setActiveConvId(null)
      }
      setConversationDeleteConfirm(null)
      showNotice('Conversation deleted.')
    } catch {
      showNotice('The conversation could not be deleted. Please try again.', 'error')
    } finally {
      setConversationActionId('')
    }
  }

  const handlePrintPayment = (payment) => {
    const refunded = refundedPaymentAmount(payment)
    const net = netPaymentAmount(payment)
    const opened = openPrintableDocument({
      title: `Invoice - ${payment.ref || 'Booking'}`,
      heading: 'A Precision Driving School',
      subtitle: 'Booking invoice',
      rows: [
        ['Date', payment.date],
        ['Reference', payment.ref],
        ['Email', payment.email],
        ['Item', payment.item],
        ['Amount', formatUSD(payment.amount)],
        ...(refunded > 0 ? [['Refunded', formatUSD(refunded)], ['Net paid', formatUSD(net)]] : []),
        ['Status', payment.status],
      ],
      autoPrint: true,
    })
    if (!opened) {
      showNotice('Please allow pop-ups to print this invoice.', 'error')
    }
  }

  const todayStr = localDateKey()
  const terminalBookingStatuses = new Set(['completed', 'cancelled', 'canceled', 'refunded', 'no show'])
  const upcomingBookingStatuses = new Set(['scheduled', 'confirmed', 'booked'])
  const upcomingBookings = bookings
    .filter(booking => String(booking?.date || '') >= todayStr && upcomingBookingStatuses.has(normalizeStatus(booking?.status)))
    .sort((a, b) => bookingSortValue(a).localeCompare(bookingSortValue(b)))
  const pastBookings = bookings
    .filter(booking => String(booking?.date || '') < todayStr || terminalBookingStatuses.has(normalizeStatus(booking?.status)))
    .sort((a, b) => bookingSortValue(b).localeCompare(bookingSortValue(a)))
  const nextBooking = upcomingBookings[0] || null
  const totalPaid = payments
    .filter(payment => ['paid', 'refunded', 'partially refunded'].includes(normalizeStatus(payment.status)))
    .reduce((sum, payment) => sum + netPaymentAmount(payment), 0)
  const pendingRefunds = courses.filter(course => normalizeStatus(course.status) === 'refund pending').length
  const activeCourses = courses.filter(course => !['refund pending', 'refunded', 'cancelled', 'canceled'].includes(normalizeStatus(course.status)))
  const matchedCourses = [...courses].filter(course => {
    const query = courseSearch.trim().toLowerCase()
    const status = normalizeStatus(course.status || 'enrolled')
    const matchesStatus = courseStatusFilter === 'all'
      || status === courseStatusFilter
      || (courseStatusFilter === 'cancelled' && status === 'canceled')
    return (!query || [course.title, course.id, course.status, course.price, course.city, course.cityZip].some(value => String(value || '').toLowerCase().includes(query)))
      && matchesStatus
  }).sort((a, b) => {
    const order = { enrolled: 0, paid: 0, 'in progress': 1, pending: 2, 'refund pending': 3, completed: 4, refunded: 5, cancelled: 6, canceled: 6 }
    return (order[normalizeStatus(a.status)] ?? 1) - (order[normalizeStatus(b.status)] ?? 1)
  })
  const coursePages = Math.max(1, Math.ceil(matchedCourses.length / 10))
  const safeCoursePage = Math.min(coursePage, coursePages)
  const visibleCourses = matchedCourses.slice((safeCoursePage - 1) * 10, safeCoursePage * 10)
  const matchedPayments = payments.filter(payment => {
    const query = paymentSearch.trim().toLowerCase()
    const status = normalizeStatus(payment.status)
    return (!query || [payment.ref, payment.email, payment.item, payment.date, payment.amount].some(value => String(value || '').toLowerCase().includes(query)))
      && (paymentStatusFilter === 'all' || status === paymentStatusFilter)
  })
  const paymentPages = Math.max(1, Math.ceil(matchedPayments.length / 10))
  const safePaymentPage = Math.min(paymentPage, paymentPages)
  const visiblePayments = matchedPayments.slice((safePaymentPage - 1) * 10, safePaymentPage * 10)
  const courseDetailPayment = courseDetail && [...payments].reverse().find(payment =>
    (courseDetail.paymentRef && String(payment?.ref || '') === String(courseDetail.paymentRef))
    || (courseDetail.enrollmentId && (Array.isArray(payment?.enrollmentIds) && payment.enrollmentIds.some(id => String(id) === String(courseDetail.enrollmentId))
      || Array.isArray(payment?.courseBreakdown) && payment.courseBreakdown.some(item => String(item?.enrollmentId || '') === String(courseDetail.enrollmentId))))
  )
  const coursePaymentStatus = courseDetailPayment?.status || courseDetail?.paymentStatus || (['refund pending', 'refunded'].includes(normalizeStatus(courseDetail?.status)) ? courseDetail.status : 'Paid')
  const paymentStatusForBooking = (booking) => {
    const payment = [...payments].reverse().find(candidate =>
      (booking?.enrollmentId && (Array.isArray(candidate?.enrollmentIds) && candidate.enrollmentIds.some(id => String(id) === String(booking.enrollmentId))
        || Array.isArray(candidate?.courseBreakdown) && candidate.courseBreakdown.some(item => String(item?.enrollmentId || '') === String(booking.enrollmentId))))
      || (booking?.courseId && Array.isArray(candidate?.courseBreakdown) && candidate.courseBreakdown.some(item => String(item?.id || item?.courseId || '') === String(booking.courseId)))
    )
    return payment?.status || (normalizeStatus(booking?.status) === 'refunded' ? 'Refunded' : 'Paid')
  }
  const upcomingPages = Math.max(1, Math.ceil(upcomingBookings.length / 10))
  const safeUpcomingPage = Math.min(upcomingPage, upcomingPages)
  const visibleUpcomingBookings = upcomingBookings.slice((safeUpcomingPage - 1) * 10, safeUpcomingPage * 10)
  const matchedConversations = conversations.filter(conversation => !conversationSearch.trim() || String(conversation.title || '').toLowerCase().includes(conversationSearch.trim().toLowerCase()))
  const conversationPages = Math.max(1, Math.ceil(matchedConversations.length / 10))
  const safeConversationPage = Math.min(conversationPage, conversationPages)
  const visibleConversations = matchedConversations.slice((safeConversationPage - 1) * 10, safeConversationPage * 10)
  const totalSlotUsage = activeCourses.reduce((summary, course) => {
    const usage = courseSlotUsage(course)
    return { used: summary.used + usage.used, maximum: summary.maximum + usage.maximum, remaining: summary.remaining + usage.remaining }
  }, { used: 0, maximum: 0, remaining: 0 })
  const initials = user?.displayName ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : user?.email?.[0]?.toUpperCase() || '?'
  const activeMod = COURSE_MODULES.find(m => m.id === activeModule)
  const hasPasswordProvider = (user?.providerData || []).some(p => p.providerId === 'password')
  const supportBusy = chatLoading || conversationLoading || Boolean(conversationActionId)
  const interactiveProgress = Math.round((completedModules.filter(id => COURSE_MODULES.some(module => module.id === id)).length / COURSE_MODULES.length) * 100)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', sublabel: 'Profile & summary', icon: I.dashboard },
    { id: 'courses', label: 'Courses', sublabel: 'Your courses', icon: I.book },
    { id: 'bookings', label: 'Lessons', sublabel: 'Your bookings', icon: I.calendar },
    { id: 'payments', label: 'Payments', sublabel: 'Invoices', icon: I.profile },
    ...(showCourse ? [{ id: 'course', label: 'Driver Ed', sublabel: 'Online modules', icon: I.book }] : []),
    { id: 'settings', label: 'Settings', sublabel: 'Account', icon: I.shield },
    { id: 'live-support', label: 'Live Support', sublabel: 'School team', icon: I.profile, badge: supportUnread },
    { id: 'support', label: 'Support', sublabel: 'AI assistant', icon: I.profile },
  ]
  const visibleLoadError = activeTab === 'bookings'
    ? loadErrors.bookings
    : profileTabs.has(activeTab) ? loadErrors.profile : ''
  const completeTabSwitch = (tab) => {
    setActiveTab(tab)
    const next = new URLSearchParams(searchParams)
    if (tab === 'dashboard') next.delete('tab')
    else next.set('tab', tab)
    setSearchParams(next, { replace: false })
    setSidebarOpen(false)
    setActiveModule(null)
    setModuleStep(0)
    setCourseDetail(null)
    setCancelConfirm(null)
    setRefundConfirm(null)
    setRefundReason('')
    setCourseActionError('')
    setBookingCancelConfirm(null)
    setBookingCancelError('')
    setShowAllHistory(false)
  }
  const switchTab = (tab) => {
    if (activeTab === 'settings' && tab !== 'settings' && settingsDirty) {
      setUnsavedConfirm({ action: 'tab', tab })
      return
    }
    completeTabSwitch(tab)
  }
  const requestHomeNavigation = () => {
    if (settingsDirty) {
      setUnsavedConfirm({ action: 'home' })
      return
    }
    navigate('/')
  }
  const confirmUnsavedAction = async () => {
    const request = unsavedConfirm
    setUnsavedConfirm(null)
    if (!request) return
    if (request.action === 'logout') {
      await performLogout()
      return
    }
    if (request.action === 'home') {
      navigate('/')
      return
    }
    if (request.action === 'tab' && request.tab) completeTabSwitch(request.tab)
  }

  return (
    <>
      <style>{`
        @keyframes dashFadeIn { from { opacity:0; transform:translateY(20px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes dashSlideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dashPulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.15); } }
        @keyframes dashShimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        @keyframes dashGlow { 0%,100% { box-shadow:0 4px 20px rgba(253,188,1,0.08); } 50% { box-shadow:0 8px 40px rgba(253,188,1,0.18); } }
        @keyframes dashFloat { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-3px); } }
        @keyframes dashBarFill { from { width:0; } }
        @keyframes dashGradientMove { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
        @keyframes dashIconSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes dashTextReveal { from { opacity:0; transform:translateY(8px); letter-spacing:0.2em; } to { opacity:1; transform:translateY(0); letter-spacing:0.14em; } }
        @keyframes dashToastIn { from { opacity:0; transform:translate3d(24px,-8px,0) scale(.96); } to { opacity:1; transform:translate3d(0,0,0) scale(1); } }
        @keyframes dashSkeleton { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
        @keyframes dashBorderGlow { 0%,100% { border-color:rgba(253,188,1,0.12); } 50% { border-color:rgba(253,188,1,0.35); } }
        @keyframes dashCardHover { 0% { box-shadow:0 4px 16px rgba(0,0,0,0.04); } 100% { box-shadow:0 12px 48px rgba(1,69,168,0.12),0 0 0 1px rgba(1,69,168,0.06); } }
        .dash-anim { animation: dashFadeIn 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .dash-d1 { animation-delay:0.06s; } .dash-d2 { animation-delay:0.12s; } .dash-d3 { animation-delay:0.18s; } .dash-d4 { animation-delay:0.24s; } .dash-d5 { animation-delay:0.30s; } .dash-d6 { animation-delay:0.36s; } .dash-d7 { animation-delay:0.42s; }
        .dash-nav-item { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; border-radius:14px; cursor:pointer; transition:all 0.35s cubic-bezier(0.22,1,0.36,1); font-family:var(--font-body); font-size:0.88rem; font-weight:500; color:rgba(255,255,255,0.85); border:none; background:none; width:100%; text-align:left; position:relative; overflow:hidden; }
        .dash-nav-item::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(253,188,1,0.10),rgba(255,255,255,0.03)); opacity:0; transition:opacity 0.3s; border-radius:14px; }
        .dash-nav-item:hover { color:#FFFFFF; transform:translateX(6px); }
        .dash-nav-item:not(.dash-logout-item):hover svg { stroke:#FDBC01; }
        .dash-nav-item:hover::after { opacity:1; }
        .dash-nav-active { background:linear-gradient(135deg,rgba(253,188,1,0.16),rgba(253,188,1,0.05)) !important; color:#FDBC01 !important; font-weight:700; box-shadow:0 4px 20px rgba(253,188,1,0.15); border:1px solid rgba(253,188,1,0.25); }
        .dash-nav-active::after { opacity:1 !important; }
        .dash-nav-active::before { content:''; position:absolute; left:0; top:8px; bottom:8px; width:3px; background:linear-gradient(180deg,#FDBC01,#FFD54F,#FDBC01); border-radius:0 4px 4px 0; box-shadow:0 0 12px rgba(253,188,1,0.5); }
        .dash-nav-active svg { stroke:#FDBC01; filter:drop-shadow(0 0 4px rgba(253,188,1,0.35)); }
        .dash-slot { padding:1.1rem; border:1.5px solid #E8EDF4; border-radius:16px; text-align:center; cursor:pointer; transition:all 0.4s cubic-bezier(0.22,1,0.36,1); background:linear-gradient(145deg,#fff,#FAFBFE); position:relative; overflow:hidden; }
        .dash-slot::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(253,188,1,0.1),transparent 60%); opacity:0; transition:opacity 0.35s; }
        .dash-slot::after { content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; background:radial-gradient(circle,rgba(253,188,1,0.06) 0%,transparent 60%); opacity:0; transition:opacity 0.4s; }
        .dash-slot:hover { border-color:rgba(253,188,1,0.5); transform:translateY(-4px) scale(1.01); box-shadow:0 12px 32px rgba(253,188,1,0.12),0 0 0 1px rgba(253,188,1,0.08); }
        .dash-slot:hover::before, .dash-slot:hover::after { opacity:1; }
        .dash-slot-sel { border-color:${GOLD} !important; background:linear-gradient(145deg,#FFFCF0,#FFF8E0) !important; box-shadow:0 12px 40px rgba(253,188,1,0.2),0 0 0 1px rgba(253,188,1,0.15),inset 0 1px 0 rgba(255,255,255,0.8) !important; transform:translateY(-4px) scale(1.01); animation:dashGlow 3s ease-in-out infinite; }
        .dash-slot-sel::before, .dash-slot-sel::after { opacity:1 !important; }
        .dash-mod { background:#ffffff; border:1.5px solid #E8EDF4; border-radius:20px; padding:1.75rem; cursor:pointer; transition:all 0.5s cubic-bezier(0.22,1,0.36,1); position:relative; overflow:hidden; }
        .dash-mod::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,transparent,${GOLD},${GOLD_BRIGHT},${GOLD},transparent); opacity:0; transition:opacity 0.4s; }
        .dash-mod::after { content:''; position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:0; height:2px; background:linear-gradient(90deg,transparent,${SKY_BLUE},transparent); transition:width 0.5s cubic-bezier(0.22,1,0.36,1); }
        .dash-mod:hover { transform:translateY(-8px); box-shadow:0 24px 64px rgba(0,0,0,0.1),0 0 0 1px rgba(253,188,1,0.12); border-color:rgba(253,188,1,0.3); }
        .dash-mod:hover::before { opacity:1; }
        .dash-mod:hover::after { width:60%; }
        .dash-lesson { background:linear-gradient(145deg,#F8FAFD 0%,#F1F5F9 50%,#EDF2F7 100%); border:1px solid #E8EDF4; border-radius:18px; padding:1.75rem; position:relative; overflow:hidden; }
        .dash-lesson::before { content:''; position:absolute; top:0; left:0; bottom:0; width:3px; background:linear-gradient(180deg,${GOLD},${SKY_BLUE}); border-radius:0 2px 2px 0; }
        .dash-qopt { padding:1rem 1.25rem; border:1.5px solid #E8EDF4; border-radius:14px; cursor:pointer; transition:all 0.35s cubic-bezier(0.22,1,0.36,1); font-family:var(--font-body); font-size:0.9rem; color:#1a2332; background:linear-gradient(145deg,#fff,#FAFBFE); text-align:left; width:100%; position:relative; overflow:hidden; }
        .dash-qopt:hover { border-color:rgba(1,69,168,0.4); background:linear-gradient(145deg,#F0F6FF,#E8F0FE); transform:translateX(6px); box-shadow:0 8px 24px rgba(1,69,168,0.08),inset 0 1px 0 rgba(255,255,255,0.8); }
        .dash-qopt-sel { border-color:${SKY_BLUE} !important; background:linear-gradient(145deg,#E8F2FF,#D4E6FF) !important; box-shadow:0 8px 28px rgba(1,69,168,0.14),inset 0 1px 0 rgba(255,255,255,0.9) !important; transform:translateX(6px); }
        .dash-qopt-sel::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,${SKY_BLUE},${GOLD}); border-radius:0 2px 2px 0; }
        .dash-gold-line { height:1px; background:linear-gradient(90deg,transparent,rgba(253,188,1,0.4),rgba(253,188,1,0.15),rgba(253,188,1,0.4),transparent); margin:0.5rem 0.75rem; }
        .dash-sidebar-overlay { display:none; position:fixed; inset:0; background:rgba(10,22,40,0.7); backdrop-filter:blur(12px) saturate(120%); z-index:998; }
        .dash-hamburger { display:none; }
        .dash-card-premium { background:#ffffff; border:1px solid #E2EBF5; border-radius:22px; padding:1.75rem; box-shadow:0 4px 16px rgba(0,0,0,0.04); position:relative; overflow:hidden; transition:all 0.5s cubic-bezier(0.22,1,0.36,1); }
        .dash-card-premium:hover { box-shadow:0 4px 8px rgba(0,0,0,0.03),0 16px 48px rgba(0,0,0,0.07); transform:translateY(-2px); }
        .dash-table-row { transition:all 0.3s cubic-bezier(0.22,1,0.36,1); }
        .dash-table-row:hover { background:linear-gradient(135deg,rgba(1,69,168,0.02),rgba(253,188,1,0.02)) !important; }
        .dash-input { width:100%; padding:0.9rem 1.2rem; border-radius:14px; border:1.5px solid #E8EDF4; outline:none; font-family:var(--font-body); font-size:1.05rem; color:#0F172A; box-sizing:border-box; background:#ffffff; transition:all 0.35s cubic-bezier(0.22,1,0.36,1); }
        .dash-input:focus { border-color:rgba(1,69,168,0.35); box-shadow:0 0 0 3px rgba(1,69,168,0.06),0 4px 16px rgba(1,69,168,0.06); background:#ffffff; }
        .dash-btn-primary { background:linear-gradient(135deg,${SKY_BLUE},#0a2a5e); color:#fff; padding:0.9rem 2rem; border-radius:14px; border:none; font-family:var(--font-body); fontSize:0.9rem; font-weight:600; cursor:pointer; transition:all 0.4s cubic-bezier(0.22,1,0.36,1); box-shadow:0 4px 16px rgba(1,69,168,0.2),inset 0 1px 0 rgba(255,255,255,0.1); position:relative; overflow:hidden; }
        .dash-btn-primary::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.15),transparent 50%); pointer-events:none; }
        .dash-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(1,69,168,0.3),inset 0 1px 0 rgba(255,255,255,0.15); }
        .dash-btn-gold { background:linear-gradient(135deg,${GOLD},${GOLD_BRIGHT}); color:${DARK}; padding:0.9rem 2rem; border-radius:14px; border:none; font-family:var(--font-mono); font-size:0.7rem; letter-spacing:0.12em; text-transform:uppercase; font-weight:700; cursor:pointer; transition:all 0.4s cubic-bezier(0.22,1,0.36,1); box-shadow:0 4px 20px rgba(253,188,1,0.25),inset 0 1px 0 rgba(255,255,255,0.65); position:relative; overflow:hidden; }
        .dash-btn-gold::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.3),transparent 50%); pointer-events:none; }
        .dash-btn-gold:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(253,188,1,0.35),inset 0 1px 0 rgba(255,255,255,0.75); }
        .dash-main { background:radial-gradient(circle at 85% 2%,rgba(1,69,168,.055),transparent 28%),linear-gradient(180deg,#F8FAFD 0%,#F4F7FB 100%); }
        .dash-content-width { width:100%; max-width:1180px; margin-left:auto; margin-right:auto; }
        .dash-overview-page { display:grid; gap:1.25rem; }
        .dash-overview-header { position:relative; isolation:isolate; overflow:hidden; display:flex; align-items:center; justify-content:space-between; gap:2rem; padding:2rem 2.25rem; border:1px solid rgba(255,255,255,.14); border-radius:26px; background:linear-gradient(135deg,#061A37 0%,#073A7F 54%,#0759C7 100%); color:#fff; box-shadow:0 24px 60px rgba(6,31,70,.22); }
        .dash-overview-header::before { content:''; position:absolute; right:-110px; bottom:-190px; width:420px; height:420px; border-radius:50%; background:radial-gradient(circle,rgba(255,194,12,.34),rgba(255,194,12,0) 70%); z-index:-1; }
        .dash-overview-header::after { content:''; position:absolute; inset:0; background:linear-gradient(120deg,transparent 0 54%,rgba(255,255,255,.07) 54% 54.8%,transparent 54.8% 100%); z-index:-1; pointer-events:none; }
        .dash-overview-header-copy { position:relative; z-index:1; max-width:660px; }
        .dash-overview-kicker { margin:0 0 .6rem; font-family:var(--font-mono); font-size:.76rem; font-weight:800; letter-spacing:.2em; text-transform:uppercase; color:#FFD249; }
        .dash-overview-header h2 { margin:0 0 .55rem; font-family:var(--font-display); font-size:clamp(2rem,4vw,3.25rem); font-weight:800; line-height:1.02; color:#fff; }
        .dash-overview-header-copy > p:last-child { margin:0; max-width:590px; font-family:var(--font-body); font-size:1.05rem; line-height:1.65; color:rgba(255,255,255,.82); }
        .dash-overview-header-actions { position:relative; z-index:1; display:flex; align-items:stretch; gap:.75rem; flex-shrink:0; }
        .dash-overview-package-count { min-width:128px; padding:.78rem 1rem; border:1px solid rgba(255,255,255,.2); border-radius:16px; background:rgba(255,255,255,.1); box-shadow:inset 0 1px 0 rgba(255,255,255,.13); backdrop-filter:blur(8px); }
        .dash-overview-package-count strong { display:block; font-family:var(--font-display); font-size:1.65rem; line-height:1; color:#fff; }
        .dash-overview-package-count span { display:block; margin-top:.35rem; font-family:var(--font-mono); font-size:.65rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:rgba(255,255,255,.76); }
        .dash-overview-header-button { min-height:100%; padding:.8rem 1.15rem; border:1px solid #FFD249; border-radius:16px; background:linear-gradient(135deg,#FFD249,#FDBE16); color:#071A36; font-family:var(--font-mono); font-size:.7rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; box-shadow:0 10px 26px rgba(253,190,22,.2); transition:transform .25s ease,box-shadow .25s ease; }
        .dash-overview-header-button:hover { transform:translateY(-2px); box-shadow:0 14px 32px rgba(253,190,22,.3); }
        .dash-overview-profile-card { min-height:194px; }
        .dash-overview-profile-card > div:last-child { min-width:0; }
        .dash-overview-profile-card p { overflow-wrap:anywhere; }
        .dash-overview-next-card { min-height:194px; display:flex; flex-direction:column; }
        .dash-overview-next-card .dash-overview-inline-action { margin-top:auto; padding-top:1rem; }
        .dash-overview-stat-card { min-height:168px; }
        .dash-overview-progress { width:100%; height:7px; margin:.9rem 0 .8rem; overflow:hidden; border-radius:999px; background:#E8EEF6; }
        .dash-overview-progress span { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#F8B500,#FFD249); transition:width .5s ease; }
        .dash-overview-inline-action { display:inline-flex; align-items:center; gap:.4rem; width:max-content; border:0; padding:0; background:none; color:#0759C7; font-family:var(--font-body); font-size:.94rem; font-weight:800; cursor:pointer; }
        .dash-overview-section-title { grid-column:1/-1; display:flex; align-items:flex-end; justify-content:space-between; gap:1rem; padding:.55rem .15rem 0; }
        .dash-overview-section-title span { display:block; margin-bottom:.25rem; font-family:var(--font-mono); font-size:.72rem; font-weight:800; letter-spacing:.18em; text-transform:uppercase; color:#0759C7; }
        .dash-overview-section-title p { margin:0; color:#475569; font-family:var(--font-body); font-size:.96rem; }
        .dash-overview-section-title button { display:inline-flex; align-items:center; gap:.45rem; flex-shrink:0; padding:.65rem .9rem; border:1px solid #D7E3F1; border-radius:11px; background:#fff; color:#0759C7; font-family:var(--font-body); font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(15,46,85,.05); }
        .dash-overview-detail-card { min-height:142px; }
        .dash-overview-detail-card > p:last-child { overflow-wrap:anywhere; }
        .dash-toast { position:fixed; top:92px; right:clamp(1rem,3vw,2rem); z-index:1200; width:min(390px,calc(100vw - 2rem)); animation:dashToastIn .35s cubic-bezier(.22,1,.36,1) both; }
        .dash-skeleton-wrap { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; margin-bottom:1.25rem; }
        .dash-skeleton { height:96px; border-radius:18px; background:linear-gradient(100deg,#e9eef5 25%,#f8fafc 40%,#e9eef5 55%); background-size:200% 100%; animation:dashSkeleton 1.25s linear infinite; border:1px solid #e2e8f0; }
        .dash-modal-backdrop { animation:dashFadeIn .2s ease both; }
        .dash-confirm-card { animation:dashSlideUp .3s cubic-bezier(.22,1,.36,1) both; }
        .dash-table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:thin; }
        .dash-payment-actions { position:sticky; right:0; z-index:2; background:#fff !important; box-shadow:-8px 0 14px rgba(15,23,42,.06); }
        .dash-table-scroll thead th { position:sticky; top:0; z-index:2; }
        .dash-main button:focus-visible,.dash-main a:focus-visible,.dash-sidebar button:focus-visible,.dash-sidebar a:focus-visible { outline:3px solid rgba(253,188,1,.55); outline-offset:3px; }
        @media (max-width:900px) {
          .dash-hamburger { display:flex; }
          .dash-sidebar { position:fixed !important; left:-280px !important; z-index:999; transition:left 0.4s cubic-bezier(0.22,1,0.36,1) !important; box-shadow:8px 0 40px rgba(0,0,0,0.2) !important; }
          .dash-sidebar-open { left:0 !important; }
          .dash-sidebar-overlay-show { display:block !important; }
          .dash-main { margin-left:0 !important; }
          .dash-slot-grid { grid-template-columns:repeat(2,1fr) !important; }
          .dash-mod-grid { grid-template-columns:1fr !important; }
          .dash-hero-grid { grid-template-columns:1fr !important; }
          .dash-hero-grid > * { grid-column:span 1 !important; }
          .dash-overview-header { align-items:flex-start; flex-direction:column; padding:1.5rem; }
          .dash-overview-header-actions { width:100%; justify-content:flex-start; }
          .dash-overview-section-title { align-items:flex-start; flex-direction:column; }
        }
        @media (max-width:480px) { .dash-slot-grid { grid-template-columns:1fr !important; } }
        @media (max-width:900px) {
          .dash-grid { grid-template-columns:1fr !important; }
          .dash-chat-wrap { flex-direction:column !important; height:auto !important; }
          .dash-chat-list { width:100% !important; max-height:240px !important; }
          .dash-chat-box { min-height:440px !important; }
          .dash-hero-grid > * { grid-row:auto !important; }
          .dash-skeleton-wrap { grid-template-columns:1fr; }
        }
        @media (max-width:600px) {
          .dash-bell, .dash-header-divider { display:none !important; }
          .dash-profile-text { display:none !important; }
          .dash-profile-card { flex-wrap:wrap !important; }
          .dash-overview-header { padding:1.25rem; border-radius:20px; }
          .dash-overview-header-actions { display:grid; grid-template-columns:1fr; }
          .dash-overview-package-count,.dash-overview-header-button { width:100%; }
          .dash-overview-profile-card { align-items:flex-start !important; flex-direction:column; }
          .dash-stat-grid { grid-template-columns:1fr !important; }
          .dash-form-grid { grid-template-columns:1fr !important; }
          .dash-modal-grid { grid-template-columns:1fr !important; }
          .dash-chat-sugg { grid-template-columns:1fr !important; }
          .dash-course-card { flex-wrap:wrap !important; padding:1rem !important; gap:1rem !important; }
          .dash-course-card .dash-course-icon { width:44px !important; height:44px !important; font-size:0.8rem !important; }
          .dash-header-inner { padding-inline:.55rem !important; }
          .dash-header-left,.dash-header-actions { gap:.45rem !important; min-width:0; }
          .dash-brand-copy { display:none !important; }
          .dash-header-logo { height:42px !important; max-width:72px; }
          .dash-profile-trigger { padding:.3rem !important; gap:.3rem !important; }
          .dash-profile-trigger svg { display:none; }
          .dash-cart-link { width:38px !important; height:38px !important; }
        }
        .dash-course-card { display:flex; align-items:center; background:#ffffff; padding:1.25rem 1.5rem; border-radius:16px; border:1px solid #E8EDF4; gap:1.5rem; transition:all 0.4s cubic-bezier(0.22,1,0.36,1); position:relative; overflow:hidden; }
        .dash-course-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(1,69,168,0.02),rgba(253,188,1,0.02)); opacity:0; transition:opacity 0.4s; border-radius:16px; pointer-events:none; }
        .dash-course-card::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,${GOLD},${SKY_BLUE},transparent); opacity:0; transition:opacity 0.4s; }
        .dash-course-card:hover { transform:translateY(-4px); box-shadow:0 16px 48px rgba(1,69,168,0.1),0 0 0 1px rgba(253,188,1,0.08); border-color:rgba(253,188,1,0.3); }
        .dash-course-card:hover::before { opacity:1; }
        .dash-course-card:hover::after { opacity:1; }
        .dash-course-card:hover .dash-course-icon { transform:scale(1.08); box-shadow:0 8px 24px rgba(1,69,168,0.15); }
        .dash-course-icon { transition:all 0.4s cubic-bezier(0.22,1,0.36,1); }
        @keyframes dashCourseSlideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
        .dash-course-card { animation: dashCourseSlideIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#F8FAFD', display:'flex', flexDirection:'column' }}>

        <header style={{ position:'sticky', top:0, zIndex:100, background:'#0145A8', borderBottom:'1px solid rgba(253,188,1,0.2)', boxShadow:'0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(253,188,1,0.08)' }}>
          <div style={{ height:'2.5px', background:`linear-gradient(90deg,transparent 5%,${GOLD} 20%,${GOLD_BRIGHT} 35%,#fff 50%,${GOLD_BRIGHT} 65%,${GOLD} 80%,transparent 95%)` }} />
          <div className="dash-header-inner" style={{ padding:'0 clamp(0.75rem,3vw,2rem)', display:'flex', alignItems:'center', justifyContent:'space-between', height:'72px' }}>
            <div className="dash-header-left" style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
              <button type="button" aria-label={sidebarOpen ? 'Close dashboard navigation' : 'Open dashboard navigation'} aria-expanded={sidebarOpen} aria-controls="dashboard-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)} className="dash-hamburger" style={{ width:'40px', height:'40px', background:'rgba(253,188,1,0.08)', border:'1px solid rgba(253,188,1,0.15)', borderRadius:'10px', cursor:'pointer', alignItems:'center', justifyContent:'center', transition:'all 0.2s', flexShrink:0 }}>
                {sidebarOpen ? I.close : I.menu}
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
                <Link to="/" style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
                  <img className="dash-header-logo" src="/driving-logo.png" alt="A Precision Driving School Logo" style={{ height:'52px', width:'auto', objectFit:'contain', filter:'drop-shadow(0 0 18px rgba(255,255,255,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.8))' }} />
                </Link>
                <div className="dash-brand-copy">
                  <p style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', color:'#fff', margin:0, fontWeight:800, lineHeight:1.2, textShadow:'0 1px 2px rgba(0,0,0,0.2)' }}>{isAdmin ? 'Student Portal Preview' : 'Dashboard'}</p>
                  <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.65rem', letterSpacing:'0.15em', textTransform:'uppercase', color:GOLD_BRIGHT, margin:0, fontWeight:700, textShadow:'0 0 8px rgba(253,188,1,0.3)' }}>A Precision Driving School</p>
                </div>
              </div>
            </div>
            <div className="dash-header-actions" style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
              <Link className="dash-cart-link" to="/cart" aria-label={cartCount > 0 ? `My cart, ${cartCount} ${cartCount === 1 ? 'course' : 'courses'}` : 'My cart, empty'} title={cartCount > 0 ? `${cartCount} ${cartCount === 1 ? 'course' : 'courses'} in cart` : 'Cart is empty'} style={{ width:'42px', height:'42px', background:'linear-gradient(135deg,rgba(253,188,1,0.18),rgba(253,188,1,0.08))', border:'1px solid rgba(253,188,1,0.28)', borderRadius:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', transition:'all 0.35s cubic-bezier(0.22,1,0.36,1)', backdropFilter:'blur(8px)', boxShadow:'0 2px 10px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.15)', textDecoration:'none', color:'#FDBC01' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
                {cartCount > 0 && <div aria-hidden="true" style={{ position:'absolute', zIndex:2, top:'-9px', right:'-9px', minWidth:'25px', height:'25px', padding:'0 7px', border:'2px solid #fff', borderRadius:'999px', background:'linear-gradient(135deg,#F43F5E,#C8102E)', color:'#fff', fontFamily:'var(--font-mono)', fontSize:'0.76rem', lineHeight:1, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', textShadow:'0 1px 2px rgba(0,0,0,0.25)', boxShadow:'0 5px 14px rgba(127,16,35,0.5)' }}>{cartCount}</div>}
              </Link>
              <div className="dash-header-divider" style={{ width:'1px', height:'28px', background:'linear-gradient(180deg,transparent,rgba(253,188,1,0.2),transparent)' }} />
              <div ref={profileMenuRef} style={{ position:'relative' }} onMouseEnter={() => setProfileMenuOpen(true)} onMouseLeave={() => setProfileMenuOpen(false)}>
                <button type="button" className="dash-profile-trigger" aria-label="Open account menu" aria-haspopup="menu" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen(open => !open)} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.45rem 0.85rem 0.45rem 0.55rem', background:profileMenuOpen ? 'linear-gradient(135deg,rgba(253,188,1,0.18),rgba(253,188,1,0.08))' : 'linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))', border:`1px solid ${profileMenuOpen ? 'rgba(253,188,1,0.35)' : 'rgba(255,255,255,0.28)'}`, borderRadius:'14px', cursor:'pointer', transition:'all 0.35s cubic-bezier(0.22,1,0.36,1)', backdropFilter:'blur(8px)', boxShadow:profileMenuOpen ? '0 2px 12px rgba(253,188,1,0.2)' : '0 2px 10px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.15)' }}>
                  <div className="dash-profile-text" style={{ textAlign:'right' }}>
                    <p style={{ fontFamily:'var(--font-body)', fontSize:'0.95rem', color:'#fff', margin:0, fontWeight:600, lineHeight:1.2 }}>{user?.displayName || 'Student'}</p>
                    <p style={{ fontFamily:'var(--font-body)', fontSize:'0.8rem', color:'rgba(255,255,255,0.88)', margin:'0.1rem 0 0', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</p>
                  </div>
                  <div style={{ position:'relative' }}>
                    {sPhotoURL ? <img src={sPhotoURL} alt="" style={{ width:'42px', height:'42px', borderRadius:'50%', objectFit:'cover', border:`2.5px solid ${GOLD}`, boxShadow:'0 0 20px rgba(253,188,1,0.3)' }} /> : <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:`linear-gradient(135deg,${GOLD},${GOLD_BRIGHT})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.95rem', fontWeight:800, color:DARK, border:`2.5px solid ${GOLD}`, boxShadow:'0 0 20px rgba(253,188,1,0.3)' }}>{initials}</div>}
                    <div style={{ position:'absolute', bottom:0, right:0, width:'11px', height:'11px', borderRadius:'50%', background:'linear-gradient(135deg,#22C55E,#16A34A)', border:'2.5px solid #0145A8', boxShadow:'0 0 6px rgba(34,197,94,0.4)' }} />
                  </div>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" style={{ transition:'transform 0.25s', transform:profileMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }}><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {profileMenuOpen && (
                  <div role="menu" aria-label="Account options" style={{ position:'absolute', top:'100%', right:0, width:'280px', background:'#FFFFFF', border:'2px solid #0145A8', borderRadius:'18px', boxShadow:'0 24px 64px rgba(1,69,168,0.25),0 0 0 1px rgba(1,69,168,0.08)', overflow:'hidden', zIndex:200, animation:'dashFadeIn 0.25s cubic-bezier(0.22,1,0.36,1) both' }}>
                    <div style={{ padding:'1.25rem', borderBottom:'1px solid rgba(1,69,168,0.15)', background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(253,188,1,0.04))' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        {sPhotoURL ? <img src={sPhotoURL} alt="" style={{ width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', border:`2.5px solid ${GOLD}`, boxShadow:'0 0 16px rgba(253,188,1,0.25)' }} /> : <div style={{ width:'50px', height:'50px', borderRadius:'50%', background:`linear-gradient(135deg,${GOLD},${GOLD_BRIGHT})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', fontWeight:800, color:DARK, border:`2.5px solid ${GOLD}`, boxShadow:'0 0 16px rgba(253,188,1,0.25)' }}>{initials}</div>}
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontFamily:'var(--font-display)', fontSize:'0.95rem', color:'#0F172A', margin:0, fontWeight:700 }}>{user?.displayName || 'Student'}</p>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#475569', margin:'0.2rem 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding:'0.5rem' }}>
                      {[
                        { label:'My Profile', icon:I.profile, action:() => { setProfileMenuOpen(false); switchTab('dashboard') } },
                        { label:'Book Lessons', icon:I.calendar, action:() => { setProfileMenuOpen(false); switchTab('bookings') } },
                        { label:'My Courses', icon:I.book, action:() => { setProfileMenuOpen(false); switchTab('courses') } },
                      ].map(item => (
                        <button type="button" role="menuitem" key={item.label} onClick={item.action} style={{ display:'flex', alignItems:'center', gap:'0.7rem', padding:'0.65rem 0.8rem', width:'100%', fontFamily:'var(--font-body)', fontSize:'0.95rem', color:'#334155', background:'none', border:'none', borderRadius:'10px', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ padding:'0.5rem', borderTop:'1px solid rgba(1,69,168,0.1)' }}>
                      <button type="button" disabled={logoutLoading} onClick={() => { setProfileMenuOpen(false); handleLogout() }} style={{ display:'flex', alignItems:'center', gap:'0.7rem', padding:'0.65rem 0.8rem', width:'100%', fontFamily:'var(--font-body)', fontSize:'0.95rem', color:'#DC2626', background:'none', border:'none', borderRadius:'10px', cursor:logoutLoading ? 'wait' : 'pointer', textAlign:'left', transition:'all 0.2s', opacity:logoutLoading ? 0.65 : 1 }}>
                        {I.logout} {logoutLoading ? 'Signing Out…' : 'Sign Out'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div style={{ display:'flex', flex:1 }}>
          <div id="dashboard-sidebar" className={`dash-sidebar ${sidebarOpen ? 'dash-sidebar-open' : ''}`} style={{ width:'260px', background:'linear-gradient(180deg,#0c2a5e 0%,#0145A8 50%,#082048 100%)', padding:0, position:'sticky', top:'76px', height:'calc(100vh - 76px)', overflowY:'auto', flexShrink:0, transition:'left 0.4s', borderRight:'1px solid rgba(253,188,1,0.12)', display:'flex', flexDirection:'column', boxShadow:'inset -1px 0 0 rgba(253,188,1,0.05)' }}>
            <div style={{ padding:'1.5rem 1rem 1.1rem', borderBottom:'1px solid rgba(253,188,1,0.12)', background:'linear-gradient(135deg,rgba(253,188,1,0.07),transparent 65%)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
                <div style={{ position:'relative', flexShrink:0 }}>
                  {sPhotoURL ? <img src={sPhotoURL} alt="" style={{ width:'52px', height:'52px', borderRadius:'50%', objectFit:'cover', border:'2.5px solid #FDBC01', boxShadow:'0 0 20px rgba(253,188,1,0.35)' }} /> : <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:'linear-gradient(135deg,#FDBC01,#FFD54F)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', fontWeight:800, color:'#0a1628', border:'2.5px solid #FDBC01', boxShadow:'0 0 20px rgba(253,188,1,0.35)' }}>{initials}</div>}
                  <div style={{ position:'absolute', bottom:0, right:0, width:'13px', height:'13px', borderRadius:'50%', background:'linear-gradient(135deg,#22C55E,#16A34A)', border:'2.5px solid #0145A8', boxShadow:'0 0 6px rgba(34,197,94,0.4)' }} />
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:'0.95rem', color:'#fff', margin:0, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.displayName || 'Student'}</p>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'rgba(255,255,255,0.88)', margin:'0.2rem 0 0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.email}</p>
                  {isAdmin && <p style={{ fontFamily:'var(--font-mono)', fontSize:'.62rem', letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(253,188,1,.95)', margin:'.3rem 0 0', fontWeight:800 }}>Administrator preview</p>}
                </div>
              </div>
            </div>
            <nav style={{ padding:'1.25rem 0.75rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0 0.75rem 0.75rem', marginBottom:'0.5rem' }}>
                <span style={{ width:'18px', height:'2px', background:'linear-gradient(90deg,transparent,#FDBC01)', borderRadius:'2px' }} />
                <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.7rem', letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(253,188,1,0.75)', fontWeight:700 }}>Menu</span>
              </div>
              {navItems.map(item => item.link ? (
                <a key={item.id} href={item.link} onClick={() => setSidebarOpen(false)} className="dash-nav-item" style={{ textDecoration:'none', marginBottom:'4px' }}>
                  <div style={{ flexShrink:0, width:'34px', height:'34px', borderRadius:'10px', background:'linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))', display:'flex', alignItems:'center', justifyContent:'center' }}>{item.icon}</div>
                  <div style={{ display:'flex', flexDirection:'column' }}><span>{item.label}</span>{item.sublabel && <span style={{ fontSize:'0.75rem', fontWeight:400, color:'rgba(255,255,255,0.88)', marginTop:'2px' }}>{item.sublabel}</span>}</div>
                </a>
              ) : (
                <button key={item.id} onClick={() => switchTab(item.id)} className={`dash-nav-item ${activeTab === item.id ? 'dash-nav-active' : ''}`} style={{ marginBottom:'4px' }}>
                  <div style={{ flexShrink:0, width:'34px', height:'34px', borderRadius:'10px', background:activeTab === item.id ? 'linear-gradient(135deg,rgba(253,188,1,0.25),rgba(253,188,1,0.10))' : 'linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s' }}>{item.icon}</div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', minWidth:0 }}><span style={{ display:'flex', alignItems:'center', gap:'.45rem' }}>{item.label}{item.badge > 0 && <span aria-label={`${item.badge} unread support ${item.badge === 1 ? 'reply' : 'replies'}`} style={{ minWidth:'20px', height:'20px', padding:'0 5px', display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:'999px', background:'#DC2626', color:'#fff', fontSize:'.68rem', fontWeight:900 }}>{item.badge}</span>}</span>{item.sublabel && <span style={{ fontSize:'0.85rem', fontWeight:500, color:activeTab === item.id ? 'rgba(255,213,79,0.96)' : 'rgba(255,255,255,0.88)', marginTop:'2px' }}>{item.sublabel}</span>}</div>
                </button>
              ))}
            </nav>
            <div style={{ padding:'0.75rem', marginTop:'auto' }}>
              <div className="dash-gold-line" />
              <button type="button" onClick={requestHomeNavigation} className="dash-nav-item" style={{ marginBottom:'4px', marginTop:'0.5rem' }}>
                <div style={{ flexShrink:0, width:'34px', height:'34px', borderRadius:'10px', background:'linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))', display:'flex', alignItems:'center', justifyContent:'center' }}>{I.home}</div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}><span>Back to Home</span></div>
              </button>
              <button type="button" disabled={logoutLoading} onClick={handleLogout} className="dash-nav-item dash-logout-item" style={{ marginBottom:'1rem', background:'linear-gradient(135deg,rgba(220,38,38,0.22),rgba(220,38,38,0.10))', border:'1px solid rgba(220,38,38,0.35)', color:'#FCA5A5', cursor:logoutLoading ? 'wait' : 'pointer', opacity:logoutLoading ? 0.7 : 1 }}>
                <div style={{ flexShrink:0, width:'34px', height:'34px', borderRadius:'10px', background:'linear-gradient(135deg,#DC2626,#B91C1C)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(220,38,38,0.35)' }}>{I.logout}</div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}><span>{logoutLoading ? 'Signing out…' : 'Logout'}</span><span style={{ fontSize:'0.85rem', fontWeight:400, color:'rgba(252,165,165,0.75)', marginTop:'2px' }}>Sign out</span></div>
              </button>
              <div style={{ padding:'0.85rem 1rem', background:'linear-gradient(145deg,rgba(253,188,1,0.10),rgba(255,255,255,0.03))', borderRadius:'14px', border:'1px solid rgba(253,188,1,0.2)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
                <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(253,188,1,0.85)', margin:0, fontWeight:700 }}>Member Since</p>
                <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', color:'#FFFFFF', margin:'0.3rem 0 0', fontWeight:600 }}>{user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) : 'Recently'}</p>
              </div>
            </div>
          </div>

          <div className={`dash-sidebar-overlay ${sidebarOpen ? 'dash-sidebar-overlay-show' : ''}`} onClick={() => setSidebarOpen(false)} />

          <div className="dash-main" style={{ flex:1, marginLeft:0, minWidth:0 }}>
            {activeTab !== 'dashboard' && (
              <div style={{ padding:'clamp(1.5rem,4vw,2.5rem) clamp(1rem,3vw,2rem) 0' }}>
                <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.5rem,3vw,2.2rem)', color:'#0F172A', lineHeight:1.15, fontWeight:800, margin:0, animation:'dashFadeIn 0.4s ease both' }}>{navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}</h1>
              </div>
            )}
            <div style={{ padding:'clamp(1rem,3vw,2.5rem)' }}>
              {isAdmin && (
                <div role="status" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap', padding:'.85rem 1rem', marginBottom:'1rem', border:'1px solid #BFDBFE', borderRadius:'14px', background:'linear-gradient(135deg,#EFF6FF,#F8FBFF)', color:'#174A8B', fontFamily:'var(--font-body)', lineHeight:1.45 }}>
                  <span><strong>Administrator preview:</strong> You are viewing the student portal layout. Your account is still an administrator account and its permissions have not changed.</span>
                  <button type="button" onClick={() => navigate('/admin')} style={{ padding:'.55rem .85rem', border:'1px solid #0759C7', borderRadius:'9px', background:'#0759C7', color:'#fff', fontWeight:850, cursor:'pointer', whiteSpace:'nowrap' }}>Return to Admin Dashboard</button>
                </div>
              )}
              {visibleLoadError && (
                <div role="alert" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap', padding:'0.9rem 1rem', marginBottom:'1rem', border:'1px solid #FECACA', borderRadius:'12px', background:'#FEF2F2', color:'#B91C1C', fontFamily:'var(--font-body)' }}>
                  <span>{visibleLoadError}</span>
                  <button type="button" onClick={() => setLoadVersion(version => version + 1)} disabled={loading} style={{ padding:'0.45rem 0.8rem', border:'1px solid #FCA5A5', borderRadius:'8px', background:'#fff', color:'#B91C1C', fontWeight:800, cursor:loading ? 'wait' : 'pointer' }}>{loading ? 'Retrying...' : 'Retry'}</button>
                </div>
              )}
              {notice.text && (
                <div className="dash-toast" role={notice.type === 'error' ? 'alert' : 'status'} aria-live={notice.type === 'error' ? 'assertive' : 'polite'} style={{ padding:'0.95rem 1.2rem', background:notice.type === 'error' ? '#FFF7F7' : '#F3FFF7', border:`1px solid ${notice.type === 'error' ? 'rgba(220,38,38,0.22)' : 'rgba(34,197,94,0.22)'}`, borderRadius:'14px', fontFamily:'var(--font-body)', fontSize:'1rem', color:notice.type === 'error' ? '#B91C1C' : '#15803D', boxShadow:'0 18px 50px rgba(15,23,42,.18)', display:'flex', alignItems:'center', gap:'0.65rem' }}>
                  {notice.type === 'error' ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
                  {notice.text}
                </div>
              )}

              {loading && <div className="dash-skeleton-wrap" role="status" aria-label="Loading dashboard"><div className="dash-skeleton" /><div className="dash-skeleton" /><div className="dash-skeleton" /></div>}

              {!loading && <>
              {activeTab === 'dashboard' && (
                <div className="dash-content-width dash-overview-page">
                  <div className="dash-overview-header">
                    <div className="dash-overview-header-copy">
                      <p className="dash-overview-kicker">{isAdmin ? 'Administrator preview · Student portal' : 'Student dashboard'}</p>
                      <h2>Welcome back, {(user?.displayName || 'Student').trim().split(/\s+/)[0]}</h2>
                      <p>Everything you need for your courses, lessons, and account—in one place.</p>
                    </div>
                    <div className="dash-overview-header-actions">
                      <div className="dash-overview-package-count">
                        <strong>{activeCourses.length}</strong>
                        <span>Active {activeCourses.length === 1 ? 'package' : 'packages'}</span>
                      </div>
                      <button type="button" className="dash-overview-header-button" onClick={() => switchTab('courses')}>
                        View courses <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                  <div className="dash-hero-grid" style={{ display:'grid', gridTemplateColumns:'repeat(12,1fr)', gap:'1.25rem' }}>
                    {/* Profile */}
                    <div className="dash-anim dash-card-premium dash-profile-card dash-overview-profile-card" style={{ gridColumn:'span 8', display:'flex', gap:'1.5rem', alignItems:'center' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${SKY_BLUE},${GOLD_BRIGHT},${SKY_BLUE})`, backgroundSize:'200% 100%', animation:'dashShimmer 4s linear infinite' }} />
                      <div style={{ width:'90px', height:'90px', borderRadius:'22px', background:`linear-gradient(145deg,${DARK},#1a2f50 50%,${SKY_BLUE})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'2rem', fontWeight:800, fontFamily:'var(--font-display)', boxShadow:'0 12px 32px rgba(10,22,40,0.3),inset 0 1px 0 rgba(255,255,255,0.1)', flexShrink:0, position:'relative' }}>
                        {initials[0] || 'S'}
                        <div style={{ position:'absolute', bottom:'-3px', right:'-3px', width:'22px', height:'22px', borderRadius:'50%', background:'linear-gradient(135deg,#22C55E,#16A34A)', border:'3.5px solid #fff', boxShadow:'0 2px 12px rgba(34,197,94,0.4)' }} />
                      </div>
                      <div>
                        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.25rem', color:'#0F172A', fontWeight:800, margin:'0 0 0.5rem', lineHeight:1.2 }}>{user?.displayName || 'Student'}</h3>
                        <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569', margin:'0 0 0.25rem', display:'flex', alignItems:'center', gap:'0.4rem' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg> {user?.email}</p>
                        <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569', margin:'0 0 0.25rem', display:'flex', alignItems:'center', gap:'0.4rem' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg> {phone || '—'}</p>
                        <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569', margin:0, display:'flex', alignItems:'center', gap:'0.4rem' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> {address || '—'}</p>
                      </div>
                    </div>

                    {/* Actionable summary */}
                    <div className="dash-anim dash-d1 dash-card-premium dash-overview-next-card" style={{ gridColumn:'span 4' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${SKY_BLUE},#3B82F6)` }} />
                      <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#475569', margin:'0 0 .55rem', fontWeight:700 }}>Next Lesson</p>
                      {nextBooking ? <><p style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', color:DARK, margin:'0 0 .25rem', fontWeight:800 }}>{nextBooking.date}</p><p style={{ margin:0, color:'#475569', fontFamily:'var(--font-body)' }}>{nextBooking.timeSlot || nextBooking.time || 'Time to be confirmed'}</p></> : <p style={{ margin:0, color:'#475569', fontFamily:'var(--font-body)' }}>No upcoming lesson</p>}
                      <button type="button" className="dash-overview-inline-action" onClick={() => switchTab('bookings')}>
                        View lesson schedule <span aria-hidden="true">&rarr;</span>
                      </button>
                    </div>
                    <div className="dash-anim dash-d2 dash-card-premium dash-overview-stat-card" style={{ gridColumn:'span 6' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${GOLD},${GOLD_BRIGHT})` }} />
                      <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#475569', margin:'0 0 .55rem', fontWeight:700 }}>Lesson Slots</p>
                      {activeCourses.length > 0 ? (
                        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.25rem', color:DARK, margin:'0 0 .25rem', fontWeight:800 }}>{totalSlotUsage.used} used · {totalSlotUsage.remaining} remaining</p>
                      ) : pendingRefunds > 0 ? (
                        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', color:'#A16207', margin:'0 0 .25rem', fontWeight:800 }}>Unavailable during refund review</p>
                      ) : (
                        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', color:'#475569', margin:'0 0 .25rem', fontWeight:800 }}>No active package</p>
                      )}
                      {activeCourses.length > 0 && (
                        <div
                          className="dash-overview-progress"
                          role="progressbar"
                          aria-label="Lesson slot usage"
                          aria-valuemin={0}
                          aria-valuemax={totalSlotUsage.maximum || 1}
                          aria-valuenow={totalSlotUsage.used}
                        >
                          <span style={{ width:`${totalSlotUsage.maximum ? Math.min(100, (totalSlotUsage.used / totalSlotUsage.maximum) * 100) : 0}%` }} />
                        </div>
                      )}
                      <button type="button" className="dash-overview-inline-action" onClick={() => switchTab('courses')}>
                        View plan limits <span aria-hidden="true">&rarr;</span>
                      </button>
                    </div>
                    <div className="dash-anim dash-d3 dash-card-premium dash-overview-stat-card" style={{ gridColumn:'span 6' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#CA8A04,#F59E0B)' }} />
                      <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.82rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#475569', margin:'0 0 .55rem', fontWeight:700 }}>Refund Review</p>
                      <p style={{ fontFamily:'var(--font-display)', fontSize:'1.25rem', color:DARK, margin:'0 0 .25rem', fontWeight:800 }}>{pendingRefunds}</p>
                      <p style={{ margin:0, color:'#475569', fontFamily:'var(--font-body)' }}>{pendingRefunds === 1 ? 'request pending' : 'requests pending'}</p>
                    </div>

                    <div className="dash-overview-section-title">
                      <div>
                        <span>Student information</span>
                        <p>Important account and permit details at a glance.</p>
                      </div>
                      <button type="button" onClick={() => switchTab('settings')}>
                        Edit information <span aria-hidden="true">&rarr;</span>
                      </button>
                    </div>

                    {/* Medications */}
                    <div className="dash-anim dash-d1 dash-card-premium dash-overview-detail-card" style={{ gridColumn:'span 4' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#DC2626,#F97316)' }} />
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(220,38,38,0.08),rgba(220,38,38,0.03))', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg></div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#475569', margin:0, fontWeight:600 }}>Medications</p>
                      </div>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', color:'#0F172A', margin:0, fontWeight:600 }}>{medications || '—'}</p>
                    </div>

                    {/* Permit */}
                    <div className="dash-anim dash-d2 dash-card-premium dash-overview-detail-card" style={{ gridColumn:'span 4' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${SKY_BLUE},#3B82F6)` }} />
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(1,69,168,0.08),rgba(1,69,168,0.03))', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg></div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#475569', margin:0, fontWeight:600 }}>Permit</p>
                      </div>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', color:'#0F172A', margin:0, fontWeight:600 }}>{permit || '—'}</p>
                    </div>

                    {/* Submitted */}
                    <div className="dash-anim dash-d2 dash-card-premium dash-overview-detail-card" style={{ gridColumn:'span 4' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${GOLD},${GOLD_BRIGHT})` }} />
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(253,188,1,0.1),rgba(253,188,1,0.04))', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD_DEEP} strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg></div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#475569', margin:0, fontWeight:600 }}>Submitted</p>
                      </div>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#0F172A', margin:0, fontWeight:600 }}>{submittedAt ? new Date(submittedAt + 'T12:00:00').toLocaleDateString('en-US', { month:'2-digit', day:'2-digit', year:'numeric' }) : '—'}</p>
                    </div>

                    {/* Notes */}
                    <div className="dash-anim dash-d3 dash-card-premium dash-overview-detail-card" style={{ gridColumn:'span 4' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#8B5CF6,#A78BFA)' }} />
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(139,92,246,0.03))', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#475569', margin:0, fontWeight:600 }}>Notes</p>
                      </div>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', color:'#0F172A', margin:0, lineHeight:1.7, fontWeight:500 }}>{notes || '—'}</p>
                    </div>

                    {/* Issue Date */}
                    <div className="dash-anim dash-d4 dash-card-premium dash-overview-detail-card" style={{ gridColumn:'span 4' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#059669,#10B981)' }} />
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(5,150,105,0.08),rgba(5,150,105,0.03))', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#475569', margin:0, fontWeight:600 }}>Issue Date</p>
                      </div>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#0F172A', margin:0, fontWeight:600 }}>{issueDate ? new Date(issueDate + 'T12:00:00').toLocaleDateString('en-US', { month:'2-digit', day:'2-digit', year:'numeric' }) : '—'}</p>
                    </div>

                    {/* Expiry */}
                    <div className="dash-anim dash-d5 dash-card-premium dash-overview-detail-card" style={{ gridColumn:'span 4' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#DC2626,#EF4444)' }} />
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(220,38,38,0.08),rgba(220,38,38,0.03))', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#475569', margin:0, fontWeight:600 }}>Expiry</p>
                      </div>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#0F172A', margin:0, fontWeight:600 }}>{expiryDate ? new Date(expiryDate + 'T12:00:00').toLocaleDateString('en-US', { month:'2-digit', day:'2-digit', year:'numeric' }) : '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="dash-content-width">
                  <div className="dash-anim dash-card-premium" style={{ padding:'2.5rem' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${SKY_BLUE},${GOLD_BRIGHT},${SKY_BLUE})`, backgroundSize:'200% 100%', animation:'dashShimmer 5s linear infinite' }} />
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem', marginBottom:'0.5rem' }}>
                      <div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'#475569', margin:'0 0 0.5rem', fontWeight:600, animation:'dashTextReveal 0.8s ease both' }}>COURSES</p>
                        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', color:'#0F172A', margin:0, fontWeight:800, textTransform:'uppercase' }}>YOUR ENROLLED COURSES</h2>
                      </div>
                      {activeCourses.length > 0 && (
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', padding:'0.5rem 1rem', borderRadius:'12px', border:'1px solid rgba(1,69,168,0.08)' }}>
                          <span style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:800, color:SKY_BLUE }}>{activeCourses.length}</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', fontWeight:600 }}>active</span>
                        </div>
                      )}
                    </div>
                    <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569', margin:'0 0 1.5rem' }}>Here are your currently enrolled courses... you can add more packages.</p>
                    <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap', marginBottom:'1rem' }}><input type="search" aria-label="Search enrolled courses" placeholder="Search course, city or price…" value={courseSearch} onChange={event => { setCourseSearch(event.target.value); setCoursePage(1) }} className="dash-input" style={{ flex:'1 1 240px' }} /><select aria-label="Filter courses by status" value={courseStatusFilter} onChange={event => { setCourseStatusFilter(event.target.value); setCoursePage(1) }} className="dash-input" style={{ width:'180px' }}><option value="all">All statuses</option><option value="active">Active</option><option value="enrolled">Enrolled</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="in progress">In Progress</option><option value="completed">Completed</option><option value="refund pending">Refund Pending</option><option value="refunded">Refunded</option><option value="cancelled">Cancelled</option></select></div>
                    <button onClick={() => navigate('/pricing')} className="dash-btn-primary" style={{ marginBottom:'2rem' }}>Add more packages</button>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                      {courses.length === 0 && (
                        <div style={{ textAlign:'center', padding:'2.5rem 1rem' }}>
                          <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg></div>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569', marginBottom:'1rem' }}>No courses enrolled yet.</p>
                          <button onClick={() => navigate('/pricing')} className="dash-btn-gold" style={{ fontSize:'0.9rem', padding:'0.7rem 1.5rem' }}>Browse Courses</button>
                        </div>
                      )}
                      {visibleCourses.map((course, i) => {
                        const status = String(course.status || 'Enrolled')
                        const normalizedStatus = normalizeStatus(status)
                        const canRequestAction = !['refund pending', 'refunded', 'cancelled'].includes(normalizedStatus)
                        const usage = courseSlotUsage(course)
                        const courseProgress = String(course.id) === '1' ? Math.max(Number(course.progress) || 0, interactiveProgress) : Number(course.progress) || 0
                        const enrollmentKey = course.enrollmentId || course._id || `${course.id}-${course.enrolledAt || course.date || i}`
                        return (
                        <div key={enrollmentKey} className="dash-course-card" style={{ animationDelay:`${i * 0.06}s` }}>
                          <div className="dash-course-icon" style={{ width:'52px', height:'52px', borderRadius:'14px', background:'linear-gradient(135deg,rgba(1,69,168,0.08),rgba(1,69,168,0.03))', color:SKY_BLUE, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:'1.05rem', fontWeight:800, flexShrink:0, border:'1px solid rgba(1,69,168,0.08)' }}>{course.id}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.25rem' }}>
                              <h4 style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', color:'#0F172A', fontWeight:800, margin:0, textTransform:'uppercase' }}>{course.title}</h4>
                              <span style={{ padding:'0.15rem 0.5rem', borderRadius:'999px', fontFamily:'var(--font-mono)', fontSize:'0.7rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700, ...(normalizedStatus === 'enrolled' || normalizedStatus === 'paid' ? { background:'rgba(34,197,94,0.08)', color:'#16A34A' } : normalizedStatus === 'completed' ? { background:'rgba(1,69,168,0.08)', color:SKY_BLUE } : normalizedStatus === 'refunded' || normalizedStatus === 'cancelled' ? { background:'rgba(220,38,38,0.06)', color:'#DC2626' } : { background:'rgba(234,179,8,0.08)', color:'#CA8A04' }) }}>{status}</span>
                            </div>
                            <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', color:'#475569', margin:'0 0 0.5rem' }}>{course.price}</p>
                            <div style={{ height:'6px', background:'#E8EDF4', borderRadius:'3px', overflow:'hidden', marginBottom:'0.4rem', maxWidth:'300px' }}>
                              <div style={{ width:`${courseProgress}%`, height:'100%', background:`linear-gradient(90deg,${SKY_BLUE},#3B82F6)`, borderRadius:'3px', transition:'width 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
                            </div>
                            <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', color:'#475569', margin:0 }}>{normalizedStatus === 'refund pending' ? 'Lesson access paused while the refund is reviewed' : normalizedStatus === 'refunded' ? 'Refund completed · enrollment closed' : `${courseProgress}% study progress · ${usage.used}/${usage.maximum} lesson slots used`}</p>
                          </div>
                          <div style={{ display:'flex', gap:'0.5rem', flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end', alignItems:'center' }}>
                            {canRequestAction && course.canBookMore !== false && usage.remaining > 0 && <button type="button" onClick={() => navigate(`/pricing?plan=${encodeURIComponent(course.id)}&continue=1${course.enrollmentId ? `&enrollmentId=${encodeURIComponent(course.enrollmentId)}` : ''}`)} style={{ padding:'0.5rem 1rem', background:'linear-gradient(135deg,rgba(253,188,1,.16),rgba(253,188,1,.06))', color:'#7A5600', border:'1px solid rgba(253,188,1,.35)', borderRadius:'8px', fontFamily:'var(--font-body)', fontSize:'1rem', fontWeight:800, cursor:'pointer' }}>Book {usage.remaining} Remaining</button>}
                            <button type="button" onClick={() => setCourseDetail(course)} style={{ padding:'0.5rem 1rem', background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', color:SKY_BLUE, border:'1px solid rgba(1,69,168,0.1)', borderRadius:'8px', fontFamily:'var(--font-body)', fontSize:'1rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'0.4rem', transition:'all 0.2s' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg> Details
                            </button>
                            {canRequestAction && (
                              <>
                                <button type="button" onClick={() => { setCourseActionError(''); setCancelConfirm({ courseId: course.id, enrollmentId: course.enrollmentId || '' }) }} style={{ padding:'0.5rem 1rem', background:'none', color:'#DC2626', border:'1px solid rgba(220,38,38,0.15)', borderRadius:'8px', fontFamily:'var(--font-body)', fontSize:'1rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background='rgba(220,38,38,0.04)'; e.currentTarget.style.borderColor='rgba(220,38,38,0.3)' }} onMouseLeave={(e) => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='rgba(220,38,38,0.15)' }}>
                                  Cancel
                                </button>
                                <button type="button" onClick={() => { setCourseActionError(''); setRefundReason(''); setRefundConfirm({ courseId: course.id, enrollmentId: course.enrollmentId || '' }) }} style={{ padding:'0.5rem 1rem', background:'none', color:'#CA8A04', border:'1px solid rgba(202,138,4,0.15)', borderRadius:'8px', fontFamily:'var(--font-body)', fontSize:'1rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background='rgba(202,138,4,0.04)'; e.currentTarget.style.borderColor='rgba(202,138,4,0.3)' }} onMouseLeave={(e) => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='rgba(202,138,4,0.15)' }}>
                                  Refund
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        )
                      })}
                      {courses.length > 0 && matchedCourses.length === 0 && <p style={{ textAlign:'center', color:'#475569', padding:'1.5rem' }}>No courses match the selected filters.</p>}
                      {matchedCourses.length > 0 && <div aria-label="Course pagination" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.75rem', flexWrap:'wrap', paddingTop:'.75rem' }}><span style={{ color:'#475569' }}>Page {safeCoursePage} of {coursePages} · {matchedCourses.length} courses</span><div style={{ display:'flex', gap:'.45rem' }}><button type="button" disabled={safeCoursePage <= 1} onClick={() => setCoursePage(page => Math.max(1, page - 1))}>Previous</button><button type="button" disabled={safeCoursePage >= coursePages} onClick={() => setCoursePage(page => Math.min(coursePages, page + 1))}>Next</button></div></div>}
                    </div>
                  </div>
                </div>
              )}

              {courseDetail && (
                <div style={{ position:'fixed', inset:0, background:'rgba(10,22,40,0.6)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', animation:'dashFadeIn 0.3s ease' }} onClick={(e) => { if (e.target === e.currentTarget) setCourseDetail(null) }}>
                  <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="course-details-title" style={{ background:'#fff', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:'440px', boxShadow:'0 24px 80px rgba(0,0,0,0.25)', animation:'dashSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)', overflow:'hidden' }}>
                    <div style={{ background:`linear-gradient(135deg,#0145A8 0%,#0a2a5e 50%,#0145A8 100%)`, padding:'2rem', position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(253,188,1,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(253,188,1,0.04) 1px, transparent 1px)', backgroundSize:'24px 24px', pointerEvents:'none' }} />
                      <button onClick={() => setCourseDetail(null)} style={{ position:'absolute', top:'1rem', right:'1rem', background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', fontSize:'1.1rem', zIndex:2 }}>&times;</button>
                      <div style={{ position:'relative', zIndex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem' }}>
                          <span style={{ width:'16px', height:'2px', background:`linear-gradient(90deg, transparent, ${GOLD})` }} />
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.2em', textTransform:'uppercase', color:GOLD_DEEP, fontWeight:700 }}>Course Details</span>
                        </div>
                        <h2 id="course-details-title" style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', color:'#fff', fontWeight:800, margin:0 }}>{courseDetail.title}</h2>
                      </div>
                    </div>
                    <div style={{ padding:'1.5rem 2rem 2rem' }}>
                      <div className="dash-modal-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                        <div style={{ background:'#F8FAFD', borderRadius:'12px', padding:'1rem', border:'1px solid #E8EDF4' }}>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', margin:'0 0 0.3rem', fontWeight:600 }}>Course ID</p>
                          <p style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:DARK, fontWeight:800, margin:0 }}>{courseDetail.id}</p>
                        </div>
                        <div style={{ background:'#F8FAFD', borderRadius:'12px', padding:'1rem', border:'1px solid #E8EDF4' }}>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', margin:'0 0 0.3rem', fontWeight:600 }}>Price</p>
                          <p style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:GOLD, fontWeight:800, margin:0 }}>{courseDetail.price}</p>
                        </div>
                        <div style={{ background:'#F8FAFD', borderRadius:'12px', padding:'1rem', border:'1px solid #E8EDF4' }}>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', margin:'0 0 0.3rem', fontWeight:600 }}>Payment Status</p>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:paymentStatusColors(coursePaymentStatus).color, fontWeight:700, margin:0 }}>{coursePaymentStatus}</p>
                        </div>
                        <div style={{ background:'#F8FAFD', borderRadius:'12px', padding:'1rem', border:'1px solid #E8EDF4' }}>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', margin:'0 0 0.3rem', fontWeight:600 }}>Progress</p>
                          <p style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:DARK, fontWeight:800, margin:0 }}>{courseDetail.progress || 0}%</p>
                        </div>
                        <div style={{ background:'#F8FAFD', borderRadius:'12px', padding:'1rem', border:'1px solid #E8EDF4', gridColumn:'1 / -1' }}>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', margin:'0 0 0.3rem', fontWeight:600 }}>Location</p>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:DARK, fontWeight:700, margin:0 }}>{courseDetail.city ? `${courseDetail.city}${courseDetail.cityZip ? `, CA ${courseDetail.cityZip}` : ''}` : 'Not recorded · Legacy record'}</p>
                        </div>
                      </div>
                      {courseDetail.enrolledAt && (
                        <div style={{ background:'#F8FAFD', borderRadius:'12px', padding:'1rem', border:'1px solid #E8EDF4', marginBottom:'1.25rem' }}>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', margin:'0 0 0.3rem', fontWeight:600 }}>Enrolled On</p>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:DARK, fontWeight:600, margin:0 }}>{new Date(courseDetail.enrolledAt).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</p>
                        </div>
                      )}
                      <button onClick={() => setCourseDetail(null)} style={{ width:'100%', padding:'0.85rem', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:700, color:'#fff', background:`linear-gradient(135deg,${SKY_BLUE},#0a2a5e)`, border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', boxShadow:'0 4px 16px rgba(1,69,168,0.2)' }}>Close</button>
                    </div>
                  </div>
                </div>
              )}

              {cancelConfirm !== null && (
                <div style={{ position:'fixed', inset:0, background:'rgba(10,22,40,0.6)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', animation:'dashFadeIn 0.3s ease' }} onClick={(e) => { if (e.target === e.currentTarget && !courseActionLoading) { setCancelConfirm(null); setCourseActionError('') } }}>
                  <div ref={modalRef} role="alertdialog" aria-modal="true" aria-labelledby="cancel-course-title" aria-describedby="cancel-course-copy" style={{ background:'#fff', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:'400px', boxShadow:'0 24px 80px rgba(0,0,0,0.25)', animation:'dashSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)', overflow:'hidden' }}>
                    <div style={{ padding:'2rem 2rem 1.5rem', textAlign:'center' }}>
                      <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(220,38,38,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                      </div>
                      <h3 id="cancel-course-title" style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'#0F172A', fontWeight:800, margin:'0 0 0.5rem' }}>Cancel Enrollment</h3>
                      <p id="cancel-course-copy" style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569', margin:0, lineHeight:1.5 }}>Are you sure you want to cancel this course? Its linked future lessons will also be cancelled. Older unlinked lessons remain available on the Lessons page for review. This action cannot be undone.</p>
                      <p style={{ margin:'0.8rem 0 0', padding:'0.7rem 0.8rem', borderRadius:'10px', background:'#FFF7ED', border:'1px solid #FED7AA', color:'#9A3412', fontFamily:'var(--font-body)', fontSize:'0.9rem', lineHeight:1.45, textAlign:'left' }}>If you added a lesson to Google, Apple, Outlook, or your device calendar, remove that external calendar event manually after cancellation.</p>
                      {courseActionError && <p role="alert" style={{ margin:'1rem 0 0', padding:'0.7rem 0.8rem', borderRadius:'10px', background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', fontFamily:'var(--font-body)', fontSize:'0.92rem', textAlign:'left' }}>{courseActionError}</p>}
                    </div>
                    <div style={{ padding:'0 2rem 2rem', display:'flex', gap:'0.75rem' }}>
                      <button type="button" disabled={Boolean(courseActionLoading)} onClick={() => { setCancelConfirm(null); setCourseActionError('') }} style={{ flex:1, padding:'0.75rem 1.5rem', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'#475569', background:'transparent', border:'1.5px solid #E2EBF5', borderRadius:'var(--radius-sm)', cursor:courseActionLoading ? 'wait' : 'pointer', transition:'all 0.2s', opacity:courseActionLoading ? 0.65 : 1 }} onMouseEnter={(e) => { e.currentTarget.style.borderColor='#CBD5E0'; e.currentTarget.style.color='#0F172A' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor='#E2EBF5'; e.currentTarget.style.color='#475569' }}>Keep Course</button>
                      <button type="button" disabled={Boolean(courseActionLoading)} onClick={() => handleCancelCourse(cancelConfirm)} style={{ flex:1, padding:'0.75rem 1.5rem', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'#fff', background:'linear-gradient(135deg,#DC2626,#B91C1C)', border:'none', borderRadius:'var(--radius-sm)', cursor:courseActionLoading ? 'wait' : 'pointer', transition:'all 0.3s', boxShadow:'0 4px 16px rgba(220,38,38,0.25)', opacity:courseActionLoading ? 0.72 : 1 }} onMouseEnter={(e) => { if (!courseActionLoading) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(220,38,38,0.35)' } }} onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(220,38,38,0.25)' }}>{courseActionLoading === 'cancel' ? 'Cancelling…' : 'Yes, Cancel'}</button>
                    </div>
                  </div>
                </div>
              )}

              {refundConfirm !== null && (
                <div style={{ position:'fixed', inset:0, background:'rgba(10,22,40,0.6)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', animation:'dashFadeIn 0.3s ease' }} onClick={(e) => { if (e.target === e.currentTarget && !courseActionLoading) { setRefundConfirm(null); setRefundReason(''); setCourseActionError('') } }}>
                  <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="refund-course-title" aria-describedby="refund-course-copy" style={{ background:'#fff', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:'440px', boxShadow:'0 24px 80px rgba(0,0,0,0.25)', animation:'dashSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)', overflow:'hidden' }}>
                    <div style={{ padding:'2rem 2rem 1.5rem', textAlign:'center' }}>
                      <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(202,138,4,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
                      </div>
                      <h3 id="refund-course-title" style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'#0F172A', fontWeight:800, margin:'0 0 0.5rem' }}>Request Refund</h3>
                      <p id="refund-course-copy" style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569', margin:0, lineHeight:1.5 }}>Submit this course for review. It will stay visible as “Refund Pending” while the school reviews your request, and linked future lessons will be cancelled. Older unlinked lessons can be reviewed on the Lessons page.</p>
                      <p style={{ margin:'0.8rem 0 0', padding:'0.7rem 0.8rem', borderRadius:'10px', background:'#FFF7ED', border:'1px solid #FED7AA', color:'#9A3412', fontFamily:'var(--font-body)', fontSize:'0.9rem', lineHeight:1.45, textAlign:'left' }}>Calendar events already saved to Google, Apple, Outlook, or your device are not removed automatically. Please delete them manually.</p>
                      <label htmlFor="refund-reason" style={{ display:'block', textAlign:'left', margin:'1rem 0 0.4rem', fontFamily:'var(--font-body)', fontSize:'0.9rem', fontWeight:700, color:'#334155' }}>Reason (optional)</label>
                      <textarea id="refund-reason" value={refundReason} maxLength={1000} disabled={Boolean(courseActionLoading)} onChange={(event) => setRefundReason(event.target.value)} rows="3" placeholder="Briefly tell us why you are requesting a refund" className="dash-input" style={{ resize:'vertical', minHeight:'82px', textAlign:'left' }} />
                      {courseActionError && <p role="alert" style={{ margin:'1rem 0 0', padding:'0.7rem 0.8rem', borderRadius:'10px', background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', fontFamily:'var(--font-body)', fontSize:'0.92rem', textAlign:'left' }}>{courseActionError}</p>}
                    </div>
                    <div style={{ padding:'0 2rem 2rem', display:'flex', gap:'0.75rem' }}>
                      <button type="button" disabled={Boolean(courseActionLoading)} onClick={() => { setRefundConfirm(null); setRefundReason(''); setCourseActionError('') }} style={{ flex:1, padding:'0.75rem 1.5rem', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'#475569', background:'transparent', border:'1.5px solid #E2EBF5', borderRadius:'var(--radius-sm)', cursor:courseActionLoading ? 'wait' : 'pointer', transition:'all 0.2s', opacity:courseActionLoading ? 0.65 : 1 }} onMouseEnter={(e) => { e.currentTarget.style.borderColor='#CBD5E0'; e.currentTarget.style.color='#0F172A' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor='#E2EBF5'; e.currentTarget.style.color='#475569' }}>Keep Course</button>
                      <button type="button" disabled={Boolean(courseActionLoading)} onClick={() => handleRefundCourse(refundConfirm)} style={{ flex:1, padding:'0.75rem 1.5rem', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'#fff', background:'linear-gradient(135deg,#CA8A04,#A16207)', border:'none', borderRadius:'var(--radius-sm)', cursor:courseActionLoading ? 'wait' : 'pointer', transition:'all 0.3s', boxShadow:'0 4px 16px rgba(202,138,4,0.25)', opacity:courseActionLoading ? 0.72 : 1 }} onMouseEnter={(e) => { if (!courseActionLoading) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(202,138,4,0.35)' } }} onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(202,138,4,0.25)' }}>{courseActionLoading === 'refund' ? 'Submitting…' : 'Submit Request'}</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="dash-content-width">
                  <div className="dash-anim dash-card-premium" style={{ padding:'clamp(1.25rem,2.5vw,2.5rem)' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${GOLD},${GOLD_BRIGHT},${GOLD})`, backgroundSize:'200% 100%', animation:'dashShimmer 5s linear infinite' }} />
                    <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'#475569', margin:'0 0 0.5rem', fontWeight:600, animation:'dashTextReveal 0.8s ease both' }}>Billing</p>
                    <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', color:'#0F172A', margin:'0 0 1.5rem', fontWeight:800, textTransform:'uppercase' }}>PAYMENT HISTORY</h2>
                    <div style={{ display:'flex', gap:'.6rem', flexWrap:'wrap', marginBottom:'1rem' }}><input type="search" aria-label="Search payments" placeholder="Search reference, item or email…" value={paymentSearch} onChange={event => { setPaymentSearch(event.target.value); setPaymentPage(1) }} className="dash-input" style={{ flex:'1 1 260px' }} /><select aria-label="Filter payments by status" value={paymentStatusFilter} onChange={event => { setPaymentStatusFilter(event.target.value); setPaymentPage(1) }} className="dash-input" style={{ width:'180px' }}><option value="all">All statuses</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="refunded">Refunded</option><option value="partially refunded">Partially Refunded</option></select></div>
                    <div className="dash-stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
                      <div style={{ background:'linear-gradient(135deg,rgba(5,150,105,0.04),rgba(5,150,105,0.01))', border:'1px solid rgba(5,150,105,0.1)', borderRadius:'var(--radius-md)', padding:'1.25rem' }}>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#059669', margin:'0 0 0.25rem', fontWeight:600 }}>Total Paid</p>
                        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:'#059669', margin:0, fontWeight:800 }}>{formatUSD(totalPaid)}</p>
                      </div>
                      <div style={{ background:'linear-gradient(135deg,rgba(234,179,8,0.04),rgba(234,179,8,0.01))', border:'1px solid rgba(234,179,8,0.1)', borderRadius:'var(--radius-md)', padding:'1.25rem' }}>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#CA8A04', margin:'0 0 0.25rem', fontWeight:600 }}>Pending</p>
                        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:'#CA8A04', margin:0, fontWeight:800 }}>{payments.filter(payment => normalizeStatus(payment.status) === 'pending').length}</p>
                      </div>
                      <div style={{ background:'linear-gradient(135deg,rgba(1,69,168,0.04),rgba(1,69,168,0.01))', border:'1px solid rgba(1,69,168,0.1)', borderRadius:'var(--radius-md)', padding:'1.25rem' }}>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', color:SKY_BLUE, margin:'0 0 0.25rem', fontWeight:600 }}>Transactions</p>
                        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:SKY_BLUE, margin:0, fontWeight:800 }}>{payments.length}</p>
                      </div>
                    </div>
                    {matchedPayments.length > 0 && <div aria-label="Payment pagination" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.75rem', flexWrap:'wrap', margin:'0 0 1rem' }}><span style={{ color:'#475569' }}>Page {safePaymentPage} of {paymentPages} · {matchedPayments.length} payments</span><div style={{ display:'flex', gap:'.45rem' }}><button type="button" disabled={safePaymentPage <= 1} onClick={() => setPaymentPage(page => Math.max(1, page - 1))}>Previous</button><button type="button" disabled={safePaymentPage >= paymentPages} onClick={() => setPaymentPage(page => Math.min(paymentPages, page + 1))}>Next</button></div></div>}
                    <div className="dash-table-scroll">
                    <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0', minWidth:'700px' }}>
                      <thead>
                        <tr>
                          {['Date','Ref','Email','Item','Amount','Payment Status','Receipt'].map((th, i) => (
                            <th key={th} className={i===6?'dash-payment-actions':''} style={{ textAlign:i===6?'center':'left', padding:'0.85rem 1rem', fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', fontWeight:700, borderBottom:'2px solid #E8EDF4', background:'linear-gradient(135deg,#FAFBFD,#F5F7FB)', ...(i===0?{borderTopLeftRadius:'10px',borderBottomLeftRadius:'10px'}:{}), ...(i===6?{borderTopRightRadius:'10px',borderBottomRightRadius:'10px'}:{}) }}>{th}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length === 0 && (
                          <tr>
                            <td colSpan="7" style={{ padding:'2.5rem 1rem', textAlign:'center' }}>
                              <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg></div>
                              <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569', marginBottom:'1rem' }}>No payment history yet.</p>
                              <button onClick={() => navigate('/pricing')} className="dash-btn-gold" style={{ fontSize:'0.9rem', padding:'0.7rem 1.5rem' }}>Browse Courses</button>
                            </td>
                          </tr>
                        )}
                        {visiblePayments.map((p, i) => {
                          const refunded = refundedPaymentAmount(p)
                          const statusColors = paymentStatusColors(p.status)
                          return <tr key={p.ref || p._id || `${p.date}-${p.item}-${i}`} className="dash-table-row" style={{ borderBottom:'1px solid #F1F5F9' }}>
                            <td style={{ padding:'1rem', fontFamily:'var(--font-body)', fontSize:'1rem', color:'#475569' }}>{p.date}</td>
                            <td style={{ padding:'1rem', maxWidth:'170px' }}><button type="button" aria-label={`View full payment reference ${p.ref || ''}`} onClick={() => setTextDetails({ title:'Payment Reference', content:p.ref || 'Not recorded' })} style={{ maxWidth:'150px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', border:0, padding:0, background:'transparent', color:SKY_BLUE, textDecoration:'underline', cursor:'pointer', fontFamily:'var(--font-mono)', fontWeight:700 }}>{p.ref || '—'}</button></td>
                            <td style={{ padding:'1rem', maxWidth:'220px' }}><button type="button" aria-label="View full payment email" onClick={() => setTextDetails({ title:'Payment Email', content:p.email || 'Not recorded' })} style={{ maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', border:0, padding:0, background:'transparent', color:SKY_BLUE, textDecoration:'underline', cursor:'pointer' }}>{p.email || '—'}</button></td>
                            <td style={{ padding:'1rem', maxWidth:'240px' }}><button type="button" aria-label="View full payment item" onClick={() => setTextDetails({ title:'Payment Item', content:p.item || 'Not recorded' })} style={{ maxWidth:'220px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', border:0, padding:0, background:'transparent', color:SKY_BLUE, textDecoration:'underline', cursor:'pointer', fontWeight:700 }}>{p.item || '—'}</button></td>
                            <td style={{ padding:'1rem', fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#0F172A', fontWeight:700 }}>{refunded > 0 ? <><span style={{ display:'block' }}>{formatUSD(netPaymentAmount(p))} net</span><span style={{ display:'block', color:'#A16207', fontSize:'0.82rem', fontWeight:700 }}>{formatUSD(refunded)} refunded</span></> : formatUSD(p.amount)}</td>
                            <td style={{ padding:'1rem' }}><span style={{ padding:'0.25rem 0.7rem', ...statusColors, borderRadius:'999px', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:700 }}>{p.status}</span></td>
                            <td className="dash-payment-actions" style={{ padding:'1rem', textAlign:'center' }}><button type="button" aria-label={`Print invoice ${p.ref || ''}`} title="Print invoice" onClick={() => handlePrintPayment(p)} style={{ background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', border:'none', color:SKY_BLUE, cursor:'pointer', padding:'0.35rem', borderRadius:'8px', display:'inline-flex' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg></button></td>
                          </tr>
                        })}
                      </tbody>
                    </table>
                    </div>
                    {payments.length > 0 && matchedPayments.length === 0 && <p style={{ textAlign:'center', color:'#475569', padding:'1.25rem' }}>No payments match the selected filters.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="dash-content-width">
                  <div className="dash-anim dash-card-premium" style={{ padding:'2.5rem' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${SKY_BLUE},${GOLD_BRIGHT},${SKY_BLUE})`, backgroundSize:'200% 100%', animation:'dashShimmer 5s linear infinite' }} />
                    <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'#475569', margin:'0 0 0.5rem', fontWeight:600 }}>Settings</p>
                    <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', color:'#0F172A', margin:'0 0 0.5rem', fontWeight:800, textTransform:'uppercase' }}>ACCOUNT SETTINGS</h2>
                    <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569', margin:'0 0 2rem' }}>Quick access to profile and security settings.</p>
                    <ProfilePhotoUploader
                      photoURL={sPhotoURL}
                      name={sUsername || user?.displayName || 'Student'}
                      initials={initials}
                      onUpload={handleUploadProfilePhoto}
                      onRemove={handleRemoveProfilePhoto}
                      disabled={sSaving}
                    />
                    <div className="dash-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1rem' }}>
                      <div>
                        <label htmlFor="settings-name" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>Full Name</label>
                        <input id="settings-name" name="name" type="text" autoComplete="name" maxLength="120" value={sUsername} onChange={e => setSUsername(e.target.value)} className="dash-input" />
                      </div>
                      <div>
                        <label htmlFor="settings-email" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>Email</label>
                        <input id="settings-email" name="email" type="email" autoComplete="email" value={user?.email || ''} readOnly className="dash-input" style={{ color:'#475569', background:'linear-gradient(145deg,#F0F0F0,#e8e8e8)', cursor:'not-allowed' }} />
                      </div>
                      <div>
                        <label htmlFor="settings-phone" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>Phone</label>
                        <input id="settings-phone" name="tel" type="tel" autoComplete="tel" maxLength="30" value={sPhone} onChange={e => setSPhone(e.target.value)} className="dash-input" />
                      </div>
                      <div>
                        <label htmlFor="settings-permit" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>Permit Number</label>
                        <input id="settings-permit" type="text" maxLength="80" value={sPermit} onChange={e => setSPermit(e.target.value)} className="dash-input" />
                      </div>
                      <div>
                        <label htmlFor="settings-medications" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>Medications</label>
                        <input id="settings-medications" type="text" maxLength="500" value={sMedications} onChange={e => setSMedications(e.target.value)} className="dash-input" />
                      </div>
                      <div style={{ gridColumn:'1 / -1' }}>
                        <label htmlFor="settings-address" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>Address</label>
                        <textarea id="settings-address" name="street-address" autoComplete="street-address" maxLength="500" value={sAddress} onChange={e => setSAddress(e.target.value)} rows="3" className="dash-input" style={{ resize:'vertical' }} />
                      </div>
                      <div style={{ gridColumn:'1 / -1' }}>
                        <label htmlFor="settings-notes" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>Notes</label>
                        <textarea id="settings-notes" maxLength="2000" value={sNotes} onChange={e => setSNotes(e.target.value)} rows="3" className="dash-input" style={{ resize:'vertical' }} />
                      </div>
                      <div>
                        <label htmlFor="settings-submitted" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>Submitted Date</label>
                        <input id="settings-submitted" type="date" max={localDateKey()} value={sSubmittedAt} onChange={e => setSSubmittedAt(e.target.value)} className="dash-input" />
                      </div>
                      <div>
                        <label htmlFor="settings-issued" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>Issue Date</label>
                        <input id="settings-issued" type="date" value={sIssueDate} onChange={e => setSIssueDate(e.target.value)} className="dash-input" />
                      </div>
                      <div>
                        <label htmlFor="settings-expiry" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>Expiry Date</label>
                        <input id="settings-expiry" type="date" min={sIssueDate || undefined} value={sExpiryDate} onChange={e => setSExpiryDate(e.target.value)} className="dash-input" />
                      </div>
                    </div>
                    {hasPasswordProvider ? (
                      <>
                        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', color:'#475569', margin:'0 0 0.35rem', fontWeight:700 }}>Change password (optional)</h3>
                        <p id="password-help" style={{ fontFamily:'var(--font-body)', fontSize:'0.95rem', color:'#334155', margin:'0 0 1.5rem' }}>Use at least 8 characters. Complete all three fields only when changing your password.</p>
                        <div className="dash-form-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
                          <div>
                            <label htmlFor="settings-current-password" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>Current password</label>
                            <PasswordInput id="settings-current-password" autoComplete="current-password" maxLength="128" aria-describedby="password-help" placeholder="Enter current password" value={sCurrentPass} onChange={e => setSCurrentPass(e.target.value)} className="dash-input" />
                          </div>
                          <div>
                            <label htmlFor="settings-new-password" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>New password</label>
                            <PasswordInput id="settings-new-password" autoComplete="new-password" minLength="8" maxLength="128" aria-describedby="password-help" placeholder="Min 8 characters" value={sNewPass} onChange={e => setSNewPass(e.target.value)} className="dash-input" />
                          </div>
                          <div>
                            <label htmlFor="settings-confirm-password" style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', marginBottom:'0.5rem', fontWeight:600 }}>Confirm new password</label>
                            <PasswordInput id="settings-confirm-password" autoComplete="new-password" minLength="8" maxLength="128" aria-describedby="password-help" placeholder="Repeat new password" value={sConfirmPass} onChange={e => setSConfirmPass(e.target.value)} className="dash-input" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ display:'flex', alignItems:'flex-start', gap:'0.9rem', padding:'1.1rem 1.25rem', background:'linear-gradient(135deg,rgba(1,69,168,0.05),rgba(1,69,168,0.02))', border:'1px solid rgba(1,69,168,0.12)', borderRadius:'14px', marginBottom:'1.5rem' }}>
                        <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,rgba(1,69,168,0.1),rgba(1,69,168,0.04))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                        </div>
                        <div>
                          <p style={{ fontFamily:'var(--font-display)', fontSize:'0.95rem', color:DARK, fontWeight:700, margin:0 }}>Password managed by Google</p>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', color:'#475569', margin:'0.3rem 0 0', lineHeight:1.6 }}>You signed in with Google, so there is no site password to change. Your account security is handled by your Google account.</p>
                        </div>
                      </div>
                    )}
                    <button type="button" onClick={handleSaveSettings} disabled={sSaving} className="dash-btn-primary" style={{ boxShadow:sSaving ? 'none' : undefined, cursor:sSaving ? 'wait' : 'pointer', opacity:sSaving ? .7 : 1 }}>{sSaving ? 'Saving…' : 'Save changes'}</button>
                  </div>
                </div>
              )}

              {activeTab === 'live-support' && <UserLiveSupportPanel user={user} onUnreadChange={setSupportUnread} />}

              {activeTab === 'support' && (
                <div className="dash-chat-wrap dash-content-width" style={{ display:'flex', gap:'1rem', height:'clamp(500px,70vh,650px)' }}>
                  <div className="dash-anim dash-chat-list" style={{ width:'260px', flexShrink:0, background:'#ffffff', borderRadius:'18px', border:'1px solid rgba(226,235,245,0.6)', boxShadow:'0 1px 3px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.03)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                    <div style={{ padding:'1rem', borderBottom:'1px solid #E8EDF4' }}>
                      <button type="button" disabled={supportBusy} onClick={handleNewChat} style={{ width:'100%', padding:'0.65rem', background: chatMessages.length === 0 && !activeConvId ? 'rgba(1,69,168,0.06)' : 'transparent', border:'1.5px solid rgba(1,69,168,0.1)', borderRadius:'10px', fontFamily:'var(--font-body)', fontSize:'1rem', fontWeight:600, color:SKY_BLUE, cursor:supportBusy ? 'wait' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', transition:'all 0.2s', opacity:supportBusy ? .65 : 1 }} onMouseEnter={(e) => { if (!supportBusy && !(chatMessages.length === 0 && !activeConvId)) { e.currentTarget.style.background='rgba(1,69,168,0.04)'; e.currentTarget.style.borderColor='rgba(1,69,168,0.2)' } }} onMouseLeave={(e) => { if (!(chatMessages.length === 0 && !activeConvId)) { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(1,69,168,0.1)' } }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg> {supportBusy ? 'Please wait…' : 'New Chat'}
                      </button>
                      <input type="search" aria-label="Search support conversations" placeholder="Search conversations…" value={conversationSearch} onChange={event => { setConversationSearch(event.target.value); setConversationPage(1) }} className="dash-input" style={{ marginTop:'.6rem', width:'100%', padding:'.55rem .65rem' }} />
                    </div>
                    <div style={{ flex:1, overflowY:'auto', padding:'0.5rem' }}>
                      {conversationLoading ? (
                        <div role="status" aria-live="polite" style={{ textAlign:'center', padding:'2rem 1rem', color:'#334155', fontFamily:'var(--font-body)' }}>Loading conversations...</div>
                      ) : conversationError ? (
                        <div role="alert" style={{ textAlign:'center', padding:'1.25rem .75rem', color:'#B91C1C', fontFamily:'var(--font-body)' }}>
                          <p style={{ margin:'0 0 .8rem', lineHeight:1.5 }}>{conversationError}</p>
                          <button type="button" onClick={() => setConversationVersion(version => version + 1)} style={{ padding:'.5rem .75rem', border:'1px solid #FCA5A5', borderRadius:'8px', background:'#fff', color:'#B91C1C', fontWeight:800, cursor:'pointer' }}>Retry</button>
                        </div>
                      ) : conversations.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'2rem 1rem' }}>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#B0B8C4', margin:0 }}>No conversations yet.</p>
                        </div>
                      ) : (
                        visibleConversations.map(conv => (
                          <div key={conv.id} role="button" tabIndex={0} aria-pressed={activeConvId === conv.id} onClick={() => handleSelectConv(conv.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleSelectConv(conv.id) } }} style={{ padding:'0.6rem 0.75rem', borderRadius:'10px', cursor:'pointer', marginBottom:'0.2rem', background: activeConvId === conv.id ? 'rgba(1,69,168,0.06)' : 'transparent', border: activeConvId === conv.id ? '1px solid rgba(1,69,168,0.1)' : '1px solid transparent', transition:'all 0.15s', display:'flex', alignItems:'center', gap:'0.5rem', position:'relative' }} onMouseEnter={(e) => { if (activeConvId !== conv.id) e.currentTarget.style.background='rgba(0,0,0,0.02)' }} onMouseLeave={(e) => { if (activeConvId !== conv.id) e.currentTarget.style.background='transparent' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" style={{ flexShrink:0 }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                            <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color: activeConvId === conv.id ? DARK : '#475569', margin:0, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight: activeConvId === conv.id ? 600 : 400 }}>{conv.title}</p>
                            <button type="button" disabled={supportBusy} aria-label={`${conversationActionId === conv.id ? 'Deleting' : 'Delete'} conversation ${conv.title || ''}`} title="Delete conversation" onClick={(e) => handleDeleteConv(e, conv.id)} onKeyDown={(e) => e.stopPropagation()} style={{ background:'none', border:'none', cursor:supportBusy ? 'wait' : 'pointer', padding:'2px', borderRadius:'4px', display:'flex', opacity:conversationActionId === conv.id ? 1 : 0.4, transition:'opacity 0.2s', flexShrink:0 }} onMouseEnter={(e) => { if (!supportBusy) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(220,38,38,0.06)' } }} onMouseLeave={(e) => { e.currentTarget.style.opacity = conversationActionId === conv.id ? '1' : '0.4'; e.currentTarget.style.background = 'none' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                            </button>
                          </div>
                        ))
                      )}
                      {!conversationLoading && !conversationError && conversations.length > 0 && matchedConversations.length === 0 && <p style={{ textAlign:'center', color:'#475569', padding:'1rem' }}>No conversations match your search.</p>}
                      {matchedConversations.length > 10 && <div aria-label="Conversation pagination" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.35rem', padding:'.5rem' }}><button type="button" disabled={safeConversationPage <= 1} onClick={() => setConversationPage(page => Math.max(1, page - 1))}>Previous</button><span style={{ color:'#475569', fontSize:'.78rem' }}>{safeConversationPage}/{conversationPages}</span><button type="button" disabled={safeConversationPage >= conversationPages} onClick={() => setConversationPage(page => Math.min(conversationPages, page + 1))}>Next</button></div>}
                    </div>
                  </div>
                  <div className="dash-anim dash-d1 dash-chat-box" style={{ flex:1, background:'#ffffff', borderRadius:'20px', border:'1px solid rgba(226,235,245,0.6)', boxShadow:'0 1px 3px rgba(0,0,0,0.02), 0 8px 32px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                    <div style={{ flex:1, overflowY:'auto', padding:'2rem', display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                      {chatMessages.length === 0 && (
                        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1.25rem' }}>
                          <div style={{ width:'72px', height:'72px', borderRadius:'20px', background:`linear-gradient(135deg,${SKY_BLUE},#0a2a5e)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(1,69,168,0.2)' }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                          </div>
                          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', color:DARK, fontWeight:800, margin:0 }}>How can I help you today?</h3>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569', margin:0, textAlign:'center', maxWidth:'400px', lineHeight:1.6 }}>Ask me anything about our driving courses, scheduling, payments, permits, or driving rules in California.</p>
                          <div className="dash-chat-sugg" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem', marginTop:'0.5rem', maxWidth:'440px', width:'100%' }}>
                            {[{ q:'What courses do you offer?' }, { q:'How do I schedule a lesson?' }, { q:'What is the refund policy?' }, { q:'Do I need a permit first?' }].map((s, i) => (
                              <button key={i} onClick={() => setChatInput(s.q)} style={{ padding:'0.75rem 1rem', background:'linear-gradient(135deg,rgba(1,69,168,0.03),rgba(1,69,168,0.01))', border:'1px solid rgba(1,69,168,0.08)', borderRadius:'12px', fontFamily:'var(--font-body)', fontSize:'1rem', color:DARK, fontWeight:500, cursor:'pointer', textAlign:'left', transition:'all 0.2s', lineHeight:1.4 }} onMouseEnter={(e) => { e.currentTarget.style.borderColor='rgba(1,69,168,0.2)'; e.currentTarget.style.background='rgba(1,69,168,0.05)' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor='rgba(1,69,168,0.08)'; e.currentTarget.style.background='linear-gradient(135deg,rgba(1,69,168,0.03),rgba(1,69,168,0.01))' }}>{s.q}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {chatMessages.map((m, i) => (
                        <div key={i} style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start', animation:'dashFadeIn 0.3s ease' }}>
                          {m.role === 'assistant' && (
                            <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:`linear-gradient(135deg,${SKY_BLUE},#0a2a5e)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'2px' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                            </div>
                          )}
                          <div style={{ flex:1, maxWidth: m.role === 'assistant' ? 'calc(100% - 40px)' : '100%', display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                            <div style={{ padding:'0.85rem 1.15rem', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.role === 'user' ? `linear-gradient(135deg,${SKY_BLUE},#0a2a5e)` : 'linear-gradient(135deg,#F1F5F9,#E8EDF4)', color: m.role === 'user' ? '#fff' : DARK, fontFamily:'var(--font-body)', fontSize:'1.05rem', lineHeight:1.7, maxWidth:'85%', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                              {m.role === 'assistant'
                                ? <ChatMessageContent content={m.content} />
                                : m.content}
                            </div>
                          </div>
                          {m.role === 'user' && (
                            <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'linear-gradient(135deg,rgba(253,188,1,0.15),rgba(253,188,1,0.05))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'2px' }}>
                              <span style={{ fontFamily:'var(--font-display)', fontSize:'1rem', fontWeight:800, color:GOLD_DEEP }}>{user?.displayName?.[0] || user?.email?.[0] || '?'}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {chatLoading && (
                        <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start', animation:'dashFadeIn 0.3s ease' }}>
                          <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:`linear-gradient(135deg,${SKY_BLUE},#0a2a5e)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/></svg>
                          </div>
                          <div style={{ padding:'0.85rem 1.15rem', borderRadius:'16px 16px 16px 4px', background:'linear-gradient(135deg,#F1F5F9,#E8EDF4)', display:'flex', gap:'0.35rem', alignItems:'center' }}>
                            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#475569', animation:'dashPulse 1.2s ease infinite' }} />
                            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#475569', animation:'dashPulse 1.2s ease 0.2s infinite' }} />
                            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#475569', animation:'dashPulse 1.2s ease 0.4s infinite' }} />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #E8EDF4', background:'linear-gradient(135deg,#FAFBFD,#F5F7FB)', display:'flex', gap:'0.6rem', alignItems:'flex-end' }}>
                      <textarea aria-label="Message the support assistant" maxLength={4000} disabled={conversationLoading} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat() } }} rows="1" placeholder="Ask about courses, scheduling, payments..." className="dash-input" style={{ flex:1, background:'#fff', borderRadius:'14px', padding:'0.75rem 1rem', fontSize:'1.05rem', resize:'none', minHeight:'44px', maxHeight:'100px', opacity:conversationLoading ? .65 : 1 }} />
                      <button type="button" aria-label="Send message" onClick={handleChat} disabled={chatLoading || conversationLoading || !chatInput.trim()} style={{ width:'44px', height:'44px', borderRadius:'14px', border:'none', background:(!chatInput.trim() || chatLoading || conversationLoading) ? '#E2EBF5' : `linear-gradient(135deg,${SKY_BLUE},#0a2a5e)`, color:(!chatInput.trim() || chatLoading || conversationLoading) ? '#475569' : '#fff', cursor:(!chatInput.trim() || chatLoading || conversationLoading) ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s', boxShadow:(!chatInput.trim() || chatLoading || conversationLoading) ? 'none' : '0 4px 12px rgba(1,69,168,0.25)', flexShrink:0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bookings' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }} className="dash-grid dash-content-width">
                  <div className="dash-anim dash-card-premium">
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${GOLD},${GOLD_BRIGHT},${GOLD})`, backgroundSize:'200% 100%', animation:'dashShimmer 4s linear infinite' }} />
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.15rem', color:DARK, fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(253,188,1,0.1),rgba(253,188,1,0.04))', display:'flex', alignItems:'center', justifyContent:'center' }}>{I.calendar}</div>
                      Book More Lessons
                    </h3>
                    <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', lineHeight:1.7, color:'#475569', margin:'0 0 1rem' }}>Lesson dates and times are reserved while you select a package. You may book from one lesson up to the package's maximum slot allowance.</p>
                    <div style={{ padding:'1rem', marginBottom:'1.25rem', border:'1px solid #DBEAFE', borderRadius:'12px', background:'#EFF6FF', color:'#1E3A8A', fontFamily:'var(--font-body)', fontSize:'0.92rem', lineHeight:1.6 }}>
                      To add or replace lessons, choose a package and complete its date and time selection. Existing confirmed bookings appear beside this panel.
                    </div>
                    <button type="button" onClick={() => navigate('/pricing')} className="dash-btn-gold" style={{ width:'100%', padding:'0.9rem', borderRadius:'14px', border:'none', fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, cursor:'pointer' }}>View Packages &amp; Times</button>
                  </div>
                  <div className="dash-anim dash-d1 dash-card-premium">
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${SKY_BLUE},${GOLD_BRIGHT},${SKY_BLUE})`, backgroundSize:'200% 100%', animation:'dashShimmer 5s linear infinite' }} />
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.15rem', color:DARK, fontWeight:700, marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(1,69,168,0.08),rgba(1,69,168,0.03))', display:'flex', alignItems:'center', justifyContent:'center' }}>{I.book}</div>
                      My Bookings
                    </h3>
                    {upcomingBookings.length === 0 && pastBookings.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'2.5rem 1rem' }}>
                        <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
                        <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569' }}>No bookings yet. Choose a package to reserve your lesson times.</p>
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', maxHeight:'400px', overflowY:'auto' }}>
                        {upcomingBookings.length > 0 && <>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#475569', fontWeight:600, margin:'0.25rem 0' }}>Upcoming</p>
                          {visibleUpcomingBookings.map(b => {
                            const slot = TIME_SLOTS.find(s => s.id === b.timeSlot)
                            const displayedTime = slot?.time || b.timeSlot || b.time || ''
                            const paymentStatus = paymentStatusForBooking(b)
                            const paymentColors = paymentStatusColors(paymentStatus)
                            return (
                              <div key={b._id || `${b.date}-${b.timeSlot || b.time}-${b.enrollmentId || ''}`} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'.85rem', flexWrap:'wrap', padding:'0.9rem 1rem', background:'linear-gradient(135deg,rgba(34,197,94,0.055),rgba(34,197,94,0.015))', borderRadius:'14px', border:'1px solid rgba(34,197,94,0.14)' }}>
                                <div style={{ minWidth:'150px', flex:'1 1 170px' }}>
                                  <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:DARK, fontWeight:600, margin:0 }}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</p>
                                  <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', color:'#334155', margin:'0.15rem 0 0' }}>{displayedTime}</p>
                                </div>
                                <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'0.45rem', flexWrap:'wrap', flex:'1 1 260px' }}>
                                  <span title="Payment status" style={{ padding:'0.25rem 0.7rem', background:paymentColors.background, color:paymentColors.color, borderRadius:'999px', fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700 }}>Payment: {paymentStatus}</span>
                                </div>
                              </div>
                            )
                          })}
                          {upcomingBookings.length > 10 && <div aria-label="Upcoming booking pagination" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'.6rem', flexWrap:'wrap' }}><span style={{ color:'#475569', fontSize:'.85rem' }}>Page {safeUpcomingPage} of {upcomingPages}</span><div style={{ display:'flex', gap:'.4rem' }}><button type="button" disabled={safeUpcomingPage <= 1} onClick={() => setUpcomingPage(page => Math.max(1, page - 1))}>Previous</button><button type="button" disabled={safeUpcomingPage >= upcomingPages} onClick={() => setUpcomingPage(page => Math.min(upcomingPages, page + 1))}>Next</button></div></div>}
                        </>}
                        {pastBookings.length > 0 && <>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#475569', fontWeight:600, margin:'0.5rem 0 0.25rem' }}>Past</p>
                          {pastBookings.slice(0, showAllHistory ? pastBookings.length : 10).map(b => {
                            const slot = TIME_SLOTS.find(s => s.id === b.timeSlot)
                            const paymentStatus = paymentStatusForBooking(b)
                            const paymentColors = paymentStatusColors(paymentStatus)
                            return (
                              <div key={b._id || `${b.date}-${b.timeSlot || b.time}-${b.enrollmentId || ''}`} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.85rem 1rem', background:'#FAFBFD', borderRadius:'14px', border:'1px solid #F1F5F9', opacity:0.7 }}>
                                <div>
                                  <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#666', fontWeight:500, margin:0 }}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</p>
                                  <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#999', margin:'0.15rem 0 0' }}>{slot?.time || b.timeSlot}</p>
                                </div>
                                <span title="Payment status" style={{ padding:'0.25rem 0.7rem', background:paymentColors.background, color:paymentColors.color, borderRadius:'999px', fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>Payment: {paymentStatus}</span>
                              </div>
                            )
                          })}
                          {pastBookings.length > 10 && <button type="button" onClick={() => setShowAllHistory(show => !show)} style={{ alignSelf:'center', padding:'.55rem 1rem', border:'1px solid #CBD5E1', borderRadius:'9px', background:'#fff', color:SKY_BLUE, fontWeight:800, cursor:'pointer' }}>{showAllHistory ? 'Show Recent 10' : `View All ${pastBookings.length}`}</button>}
                        </>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'course' && showCourse && (
                <div className="dash-content-width">
                  {activeMod && moduleStep > 0 ? (
                    <div>
                      <button onClick={() => { setActiveModule(null); setModuleStep(0); }} style={{ background:'none', border:'none', color:SKY_BLUE, fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg> Back to Modules
                      </button>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
                        {activeMod.lessons.map((_, i) => (<div key={i} style={{ flex:1, height:'4px', borderRadius:'2px', background:i < moduleStep-1 ? GOLD : i === moduleStep-1 ? SKY_BLUE : '#E8EDF4', transition:'all 0.3s' }} />))}
                        <div style={{ flex:1, height:'4px', borderRadius:'2px', background:moduleStep > activeMod.lessons.length ? GOLD : '#E8EDF4', transition:'all 0.3s' }} />
                      </div>
                      {moduleStep <= activeMod.lessons.length ? (
                        <div className="dash-anim" style={{ background:'#ffffff', borderRadius:'20px', border:'1px solid rgba(226,235,245,0.6)', padding:'1.75rem', boxShadow:'0 1px 3px rgba(0,0,0,0.02), 0 8px 32px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden' }}>
                          <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${GOLD},${SKY_BLUE})` }} />
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.12em', textTransform:'uppercase', color:GOLD_DEEP, fontWeight:700, marginBottom:'0.5rem' }}>Lesson {moduleStep} of {activeMod.lessons.length}</p>
                          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', color:DARK, fontWeight:700, marginBottom:'1rem' }}>{activeMod.lessons[moduleStep-1].title}</h3>
                          <div className="dash-lesson"><p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#333', lineHeight:1.8, margin:0 }}>{activeMod.lessons[moduleStep-1].content}</p></div>
                          <button onClick={() => setModuleStep(moduleStep+1)} style={{ marginTop:'1.25rem', padding:'0.85rem 2rem', background:`linear-gradient(135deg,${GOLD},${GOLD_BRIGHT})`, color:DARK, border:'none', borderRadius:'12px', fontFamily:'var(--font-mono)', fontSize:'0.95rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, cursor:'pointer', transition:'all 0.3s', boxShadow:'0 4px 16px rgba(253,188,1,0.2)' }}>{moduleStep < activeMod.lessons.length ? 'Next Lesson' : 'Take Quiz'}</button>
                        </div>
                      ) : (
                        <div className="dash-anim" style={{ background:'#ffffff', borderRadius:'20px', border:'1px solid rgba(226,235,245,0.6)', padding:'1.75rem', boxShadow:'0 1px 3px rgba(0,0,0,0.02), 0 8px 32px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden' }}>
                          <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${GOLD},${SKY_BLUE})` }} />
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.12em', textTransform:'uppercase', color:GOLD_DEEP, fontWeight:700, marginBottom:'0.5rem' }}>Module Quiz</p>
                          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', color:DARK, fontWeight:700, marginBottom:'1.5rem' }}>{activeMod.title}</h3>
                          {!quizSubmitted ? (
                            <div>
                              {activeMod.quiz.map((q, qi) => (
                                <div key={qi} style={{ marginBottom:'1.5rem' }}>
                                  <p style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:DARK, fontWeight:600, marginBottom:'0.75rem' }}>{qi+1}. {q.question}</p>
                                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                                    {q.options.map((opt, oi) => (<button key={oi} onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]:oi }))} className={`dash-qopt ${quizAnswers[qi]===oi ? 'dash-qopt-sel' : ''}`}>{opt}</button>))}
                                  </div>
                                </div>
                              ))}
                              <button onClick={() => { let c=0; activeMod.quiz.forEach((q,qi) => { if(quizAnswers[qi]===q.correct) c++ }); handleCompleteQuiz(activeMod.id,c) }} disabled={Object.keys(quizAnswers).length < activeMod.quiz.length} style={{ padding:'0.85rem 2rem', background:Object.keys(quizAnswers).length < activeMod.quiz.length ? '#ccc' : `linear-gradient(135deg,${SKY_BLUE},#0a2a5e)`, color:'#fff', border:'none', borderRadius:'12px', fontFamily:'var(--font-mono)', fontSize:'0.95rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, cursor:Object.keys(quizAnswers).length < activeMod.quiz.length ? 'not-allowed' : 'pointer', transition:'all 0.3s', boxShadow:Object.keys(quizAnswers).length < activeMod.quiz.length ? 'none' : '0 4px 16px rgba(1,69,168,0.2)' }}>Submit Quiz</button>
                            </div>
                          ) : (
                            <div style={{ textAlign:'center', padding:'1.5rem 0' }}>
                              <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:quizScore >= 2 ? 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.2))' : 'linear-gradient(135deg,rgba(220,38,38,0.1),rgba(220,38,38,0.2))', border:`2px solid ${quizScore >= 2 ? '#22C55E' : '#DC2626'}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                                <span style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:800, color:quizScore >= 2 ? '#22C55E' : '#DC2626' }}>{quizScore}/{activeMod.quiz.length}</span>
                              </div>
                              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:DARK, fontWeight:700, marginBottom:'0.5rem' }}>{quizScore >= 2 ? 'Congratulations! Module Passed' : 'Not Passed'}</h3>
                              <p role={quizSaving ? 'status' : undefined} aria-live="polite" style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569', marginBottom:'1.5rem' }}>{quizSaving ? 'Saving your progress…' : quizScore >= 2 ? 'You have successfully completed this module.' : 'You need at least 2 correct answers to pass.'}</p>
                              {quizScore < 2 && <button type="button" onClick={() => { setModuleStep(0); setQuizAnswers({}); setQuizSubmitted(false) }} style={{ padding:'0.7rem 1.5rem', background:SKY_BLUE, color:'#fff', border:'none', borderRadius:'10px', fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, cursor:'pointer' }}>Review Lessons</button>}
                              {quizScore >= 2 && <button type="button" disabled={quizSaving} onClick={() => { setActiveModule(null); setModuleStep(0) }} style={{ padding:'0.7rem 1.5rem', background:GOLD, color:DARK, border:'none', borderRadius:'10px', fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, cursor:quizSaving ? 'wait' : 'pointer', opacity:quizSaving ? .65 : 1 }}>{quizSaving ? 'Saving…' : 'Back to Modules'}</button>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom:'1.5rem' }}>
                        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.15rem', color:DARK, fontWeight:700, marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>{I.book} Online Driver Education</h3>
                        <p style={{ fontFamily:'var(--font-body)', fontSize:'1.05rem', color:'#475569', margin:0 }}>Work through the 3 interactive study modules below. Your enrolled course includes the 15-topic curriculum overview shown here.</p>
                        <div style={{ marginTop:'0.75rem', background:'#E8EDF4', borderRadius:'999px', height:'8px', overflow:'hidden' }}>
                          <div style={{ width:`${Math.round((completedModules.length/3)*100)}%`, height:'100%', background:`linear-gradient(90deg,${GOLD},${GOLD_BRIGHT})`, borderRadius:'999px', transition:'width 0.5s' }} />
                        </div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.9rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#475569', fontWeight:600, marginTop:'0.35rem' }}>{completedModules.filter(id => COURSE_MODULES.some(module => module.id === id)).length} of 3 interactive modules completed</p>
                      </div>
                      <section aria-labelledby="dashboard-curriculum-title" style={{ marginBottom:'1.75rem' }}>
                        <h4 id="dashboard-curriculum-title" style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', color:DARK, margin:'0 0 .8rem' }}>15-topic curriculum overview</h4>
                        <ol style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'.55rem', margin:0, padding:0, listStyle:'none' }}>
                          {ONLINE_COURSE_CURRICULUM.map((lesson, index) => <li key={lesson} style={{ display:'flex', gap:'.65rem', alignItems:'flex-start', padding:'.7rem .8rem', border:'1px solid #E2E8F0', borderRadius:'10px', background:'#F8FAFC', color:'#334155', fontFamily:'var(--font-body)', lineHeight:1.4 }}><span aria-hidden="true" style={{ color:SKY_BLUE, fontFamily:'var(--font-mono)', fontWeight:800 }}>{String(index + 1).padStart(2, '0')}</span><span>{lesson}</span></li>)}
                        </ol>
                      </section>
                      <h4 style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', color:DARK, margin:'0 0 .8rem' }}>Interactive study modules</h4>
                      <div className="dash-mod-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem' }}>
                        {COURSE_MODULES.map((mod, i) => {
                          const done = completedModules.includes(mod.id)
                          return (
                            <button type="button" key={mod.id} className="dash-mod" onClick={() => openModule(mod.id)} style={{ textAlign:'left' }}>
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                                <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:done ? 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.2))' : `linear-gradient(135deg,rgba(1,69,168,0.08),rgba(253,188,1,0.08))`, border:`1.5px solid ${done ? '#22C55E' : '#E8EDF4'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  {done ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> : <span style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:800, color:SKY_BLUE }}>{i+1}</span>}
                                </div>
                                {done && <span style={{ padding:'0.2rem 0.5rem', background:'rgba(34,197,94,0.1)', color:'#22C55E', borderRadius:'999px', fontFamily:'var(--font-mono)', fontSize:'0.75rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700 }}>Done</span>}
                              </div>
                              <h4 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:DARK, fontWeight:700, marginBottom:'0.4rem' }}>{mod.title}</h4>
                              <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', color:'#475569', margin:0, lineHeight:1.6 }}>{mod.description}</p>
                              <div style={{ marginTop:'1rem', display:'flex', alignItems:'center', gap:'0.4rem', color:done ? '#22C55E' : SKY_BLUE, fontFamily:'var(--font-mono)', fontSize:'0.85rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700 }}>
                                {done ? 'Review Module' : 'Start Module'}
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              </>}

            </div>

            {textDetails && (
              <div className="dash-modal-backdrop" role="presentation" style={{ position:'fixed', inset:0, background:'rgba(10,22,40,.68)', backdropFilter:'blur(10px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={event => { if (event.target === event.currentTarget) setTextDetails(null) }}>
                <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="text-details-title" style={{ width:'100%', maxWidth:'560px', maxHeight:'85vh', overflowY:'auto', background:'#fff', borderRadius:'22px', boxShadow:'0 28px 90px rgba(2,12,27,.35)', padding:'2rem' }}><div style={{ display:'flex', justifyContent:'space-between', gap:'1rem' }}><h2 id="text-details-title" style={{ margin:0, color:DARK }}>{textDetails.title}</h2><button autoFocus type="button" aria-label="Close details" onClick={() => setTextDetails(null)} style={{ border:0, background:'transparent', fontSize:'1.6rem', cursor:'pointer' }}>&times;</button></div><div style={{ marginTop:'1.2rem', padding:'1rem', border:'1px solid #E2E8F0', borderRadius:'12px', background:'#F8FAFC', whiteSpace:'pre-wrap', overflowWrap:'anywhere', lineHeight:1.7 }}>{textDetails.content}</div><button type="button" onClick={() => setTextDetails(null)} className="dash-btn-primary" style={{ width:'100%', marginTop:'1.2rem' }}>Close</button></div>
              </div>
            )}

            {unsavedConfirm && (
              <div className="dash-modal-backdrop" role="presentation" style={{ position:'fixed', inset:0, background:'rgba(10,22,40,.68)', backdropFilter:'blur(10px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={(event) => { if (event.target === event.currentTarget) setUnsavedConfirm(null) }}>
                <div ref={modalRef} className="dash-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="unsaved-settings-title" aria-describedby="unsaved-settings-copy" style={{ width:'100%', maxWidth:'430px', background:'#fff', borderRadius:'22px', boxShadow:'0 28px 90px rgba(2,12,27,.35)', padding:'2rem', border:'1px solid rgba(253,188,1,.3)' }}>
                  <div style={{ width:'58px', height:'58px', borderRadius:'18px', background:'rgba(253,188,1,.12)', color:'#9A7000', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.2rem' }}>
                    <svg aria-hidden="true" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.6 2.4 17.3A1.8 1.8 0 0 0 4 20h16a1.8 1.8 0 0 0 1.6-2.7L13.7 3.6a2 2 0 0 0-3.4 0Z" /></svg>
                  </div>
                  <p style={{ margin:'0 0 .4rem', fontFamily:'var(--font-mono)', fontSize:'.7rem', letterSpacing:'.14em', textTransform:'uppercase', color:'#8A6500', fontWeight:800 }}>Unsaved changes</p>
                  <h2 id="unsaved-settings-title" style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:DARK, margin:'0 0 .55rem' }}>Leave without saving?</h2>
                  <p id="unsaved-settings-copy" style={{ fontFamily:'var(--font-body)', fontSize:'1rem', lineHeight:1.65, color:'#475569', margin:'0 0 1.5rem' }}>Your latest account settings have not been saved. Stay on this page to keep editing, or leave and discard those changes.</p>
                  <div style={{ display:'flex', gap:'.75rem', justifyContent:'flex-end', flexWrap:'wrap' }}>
                    <button type="button" onClick={() => setUnsavedConfirm(null)} style={{ padding:'.82rem 1.15rem', border:'1px solid #CBD5E1', borderRadius:'11px', background:'#fff', color:'#334155', fontWeight:800, cursor:'pointer' }}>Keep Editing</button>
                    <button type="button" onClick={confirmUnsavedAction} style={{ padding:'.82rem 1.15rem', border:0, borderRadius:'11px', background:'linear-gradient(135deg,#FDBC01,#FFD54F)', color:DARK, fontWeight:900, cursor:'pointer', boxShadow:'0 8px 20px rgba(253,188,1,.25)' }}>Leave Without Saving</button>
                  </div>
                </div>
              </div>
            )}

            {conversationDeleteConfirm && (
              <div className="dash-modal-backdrop" role="presentation" style={{ position:'fixed', inset:0, background:'rgba(10,22,40,.68)', backdropFilter:'blur(10px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={(event) => { if (event.target === event.currentTarget && !conversationActionId) setConversationDeleteConfirm(null) }}>
                <div ref={modalRef} className="dash-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-conversation-title" aria-describedby="delete-conversation-copy" style={{ width:'100%', maxWidth:'410px', background:'#fff', borderRadius:'22px', boxShadow:'0 28px 90px rgba(2,12,27,.35)', padding:'2rem' }}>
                  <div style={{ width:'58px', height:'58px', borderRadius:'18px', background:'rgba(220,38,38,.08)', color:'#DC2626', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.2rem' }}><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4h8v2m-9 0 1 15h8l1-15M10 10v7m4-7v7" /></svg></div>
                  <h2 id="delete-conversation-title" style={{ fontFamily:'var(--font-display)', fontSize:'1.35rem', color:DARK, margin:'0 0 .55rem' }}>Delete conversation?</h2>
                  <p id="delete-conversation-copy" style={{ fontFamily:'var(--font-body)', fontSize:'1rem', lineHeight:1.65, color:'#475569', margin:'0 0 1.5rem' }}>This support conversation will be permanently removed. This action cannot be undone.</p>
                  <div style={{ display:'flex', gap:'.75rem', justifyContent:'flex-end', flexWrap:'wrap' }}>
                    <button type="button" disabled={Boolean(conversationActionId)} onClick={() => setConversationDeleteConfirm(null)} style={{ padding:'.8rem 1.15rem', border:'1px solid #CBD5E1', borderRadius:'11px', background:'#fff', color:'#334155', fontWeight:700, cursor:conversationActionId ? 'wait' : 'pointer' }}>Keep Conversation</button>
                    <button type="button" disabled={Boolean(conversationActionId)} onClick={confirmDeleteConversation} style={{ padding:'.8rem 1.15rem', border:0, borderRadius:'11px', background:'linear-gradient(135deg,#DC2626,#B91C1C)', color:'#fff', fontWeight:700, cursor:conversationActionId ? 'wait' : 'pointer', opacity:conversationActionId ? .72 : 1 }}>{conversationActionId ? 'Deleting…' : 'Yes, Delete'}</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
