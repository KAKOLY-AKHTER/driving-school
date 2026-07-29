import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth'
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
  '2': 'Basic Behind the Wheel (Package A - 2 Hours)',
  '12': 'Basic Behind the Wheel (Package D - 4 Hours)',
  '3': 'Essential Behind the Wheel (Package B - 6 Hours)',
  '8': 'Ideal BTW + Online Driver Ed (Package C - 6 Hours)',
  '4': 'Premier Behind the Wheel (Package E - 10 Hours)',
}
const COURSE_HOURS = { '2': 2, '12': 4, '3': 6, '8': 6, '4': 10 }
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
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [courseType, setCourseType] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [bookings, setBookings] = useState([])
  const [bookingDate, setBookingDate] = useState('')
  const [bookingSlot, setBookingSlot] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [completedModules, setCompletedModules] = useState([])
  const [activeModule, setActiveModule] = useState(null)
  const [moduleStep, setModuleStep] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [medications, setMedications] = useState('')
  const [permit, setPermit] = useState('')
  const [notes, setNotes] = useState('')
  const [submittedAt, setSubmittedAt] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [courses, setCourses] = useState([])
  const [payments, setPayments] = useState([])
  const [sUsername, setSUsername] = useState('')
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
  const showCourse = courseType === '1' || courseType === '8' || courses.some(c => c.id === '1' || c.id === '8')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [profile, bookingsData] = await Promise.all([api.getUser(user.uid), api.getBookings(user.uid)])
        if (profile) {
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
          setCourses(profile.courses || [])
          setPayments(profile.payments || [])
          setSUsername(profile.username || profile.displayName || '')
          setSPhone(profile.phone || '')
          setSAddress(profile.address || '')
          setSPermit(profile.permit || '')
          setSMedications(profile.medications || '')
          setSNotes(profile.notes || '')
          setSSubmittedAt(profile.submittedAt || '')
          setSIssueDate(profile.issueDate || '')
          setSExpiryDate(profile.expiryDate || '')
          if (profile.courses && profile.courses.length > 0) {
            const seen = new Map()
            for (const c of profile.courses) {
              if (!seen.has(c.id)) seen.set(c.id, c)
            }
            const deduped = Array.from(seen.values())
            if (deduped.length !== profile.courses.length) {
              setCourses(deduped)
              api.dedupCourses(user.uid)
            }
          }
        }
        setBookings(bookingsData)
      } catch {}
      setLoading(false)
    }
    load()
  }, [user])

  const handleLogout = async () => { await signOut(auth); navigate('/') }
  const [courseDetail, setCourseDetail] = useState(null)
  const [refundConfirm, setRefundConfirm] = useState(null)
  const [cancelConfirm, setCancelConfirm] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const handleBookLesson = async () => {
    if (!bookingDate || !bookingSlot) { setMsg('Please select a date and time slot.'); setTimeout(() => setMsg(''), 2000); return }
    setBookingLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const newBooking = await api.createBooking({ userId: user.uid, date: bookingDate, timeSlot: bookingSlot, status: bookingDate < today ? 'completed' : 'scheduled' })
      setBookings(prev => [newBooking, ...prev]); setBookingDate(''); setBookingSlot(''); setMsg('Lesson booked successfully!'); setTimeout(() => setMsg(''), 2000)
    } catch { setMsg('Failed to book lesson.') }
    setBookingLoading(false)
  }
  const handleCancelBooking = async (id) => {
    try { await api.deleteBooking(id); setBookings(prev => prev.filter(b => b._id !== id)); setMsg('Booking cancelled.'); setTimeout(() => setMsg(''), 2000) } catch { setMsg('Failed to cancel booking.') }
  }
  const handleCompleteQuiz = async (moduleId, correctCount) => {
    setQuizScore(correctCount); setQuizSubmitted(true)
    if (correctCount >= 2 && !completedModules.includes(moduleId)) {
      const updated = [...completedModules, moduleId]; setCompletedModules(updated); await api.saveUser(user.uid, { completedModules: updated })
    }
  }
  const openModule = (moduleId) => { setActiveModule(moduleId); setModuleStep(0); setQuizAnswers({}); setQuizSubmitted(false); setQuizScore(0) }

  const handleCancelCourse = async (courseId) => {
    try {
      const result = await api.removeCourse(user.uid, courseId)
      if (result.ok) {
        setCourses(result.courses || [])
        setCancelConfirm(null)
        setMsg('Course cancelled successfully.')
        setTimeout(() => setMsg(''), 2000)
      }
    } catch {
      setMsg('Failed to cancel course.')
      setTimeout(() => setMsg(''), 2000)
    }
  }

  const handleRefundCourse = async (courseId) => {
    try {
      const result = await api.removeCourse(user.uid, courseId)
      if (result.ok) {
        setCourses(result.courses || [])
        setRefundConfirm(null)
        setMsg('Refund request submitted. Course removed.')
        setTimeout(() => setMsg(''), 2000)
      }
    } catch {
      setMsg('Failed to process refund.')
      setTimeout(() => setMsg(''), 2000)
    }
  }

  const handleSaveSettings = async () => {
    setSSaving(true)
    try {
      const data = {
        username: sUsername,
        phone: sPhone,
        address: sAddress,
        permit: sPermit,
        medications: sMedications,
        notes: sNotes,
        submittedAt: sSubmittedAt,
        issueDate: sIssueDate,
        expiryDate: sExpiryDate,
      }
      await api.saveUser(user.uid, data)
      if (sUsername && sUsername !== user.displayName) {
        await updateProfile(user, { displayName: sUsername })
      }
      setPhone(sPhone)
      setAddress(sAddress)
      setPermit(sPermit)
      setMedications(sMedications)
      setNotes(sNotes)
      setSubmittedAt(sSubmittedAt)
      setIssueDate(sIssueDate)
      setExpiryDate(sExpiryDate)
      let pwMsg = ''
      if (sNewPass || sConfirmPass || sCurrentPass) {
        if (!sCurrentPass || !sNewPass || !sConfirmPass) {
          pwMsg = ' Fill all password fields.'
        } else if (sNewPass.length < 8) {
          pwMsg = ' New password must be 8+ chars.'
        } else if (sNewPass !== sConfirmPass) {
          pwMsg = ' Passwords do not match.'
        } else {
          const cred = EmailAuthProvider.credential(user.email, sCurrentPass)
          await reauthenticateWithCredential(user, cred)
          await updatePassword(user, sNewPass)
          pwMsg = ' Password updated.'
          setSCurrentPass(''); setSNewPass(''); setSConfirmPass('')
        }
      }
      setMsg('Settings saved successfully!' + pwMsg)
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      const msg = e.code === 'auth/wrong-password' ? 'Current password is incorrect.' : e.code === 'auth/weak-password' ? 'New password is too weak.' : 'Failed to save settings.'
      setMsg(msg)
      setTimeout(() => setMsg(''), 2500)
    }
    setSSaving(false)
  }

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user', content: chatInput.trim() }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)
    try {
      const result = await api.chat(newMessages.map(m => ({ role: m.role, content: m.content })))
      if (result.ok) {
        const updated = [...newMessages, { role: 'assistant', content: result.reply }]
        setChatMessages(updated)
        if (activeConvId) {
          await api.updateConversation(user.uid, activeConvId, { messages: updated })
        } else {
          const title = userMsg.content.slice(0, 50)
          const res2 = await api.createConversation(user.uid, title, updated)
          if (res2.ok) setActiveConvId(res2.conversation.id)
        }
        const allConvs = await api.getConversations(user.uid)
        setConversations(allConvs || [])
      } else {
        setChatMessages([...newMessages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
      }
    } catch {
      setChatMessages([...newMessages, { role: 'assistant', content: 'Sorry, I am temporarily unavailable. Please try again later or contact us at (925) 555-0123.' }])
    }
    setChatLoading(false)
  }

  const handleNewChat = () => {
    setChatMessages([])
    setActiveConvId(null)
    setChatInput('')
  }

  const handleSelectConv = async (convId) => {
    const conv = await api.getConversation(user.uid, convId)
    if (conv) {
      setChatMessages(conv.messages || [])
      setActiveConvId(convId)
    }
  }

  const handleDeleteConv = async (e, convId) => {
    e.stopPropagation()
    await api.deleteConversation(user.uid, convId)
    setConversations(prev => prev.filter(c => c.id !== convId))
    if (activeConvId === convId) {
      setChatMessages([])
      setActiveConvId(null)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const upcomingBookings = bookings.filter(b => b.date >= todayStr && b.status === 'scheduled')
  const pastBookings = bookings.filter(b => b.date < todayStr || b.status === 'completed')
  const hoursCompleted = pastBookings.length * 2
  const totalHours = COURSE_HOURS[courseType] || 0
  const progress = showCourse ? Math.round((completedModules.length / 3) * 100) : totalHours > 0 ? Math.min(Math.round((hoursCompleted / totalHours) * 100), 100) : 0
  const initials = user?.displayName ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : user?.email?.[0]?.toUpperCase() || '?'
  const activeMod = COURSE_MODULES.find(m => m.id === activeModule)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', sublabel: 'Profile & summary', icon: I.dashboard },
    { id: 'courses', label: 'Courses', sublabel: 'Your courses', icon: I.book },
    { id: 'payments', label: 'Payments', sublabel: 'Invoices', icon: I.profile },
    ...(showCourse ? [{ id: 'course', label: 'Driver Ed', sublabel: 'Online modules', icon: I.book }] : []),
    { id: 'settings', label: 'Settings', sublabel: 'Account', icon: I.shield },
    { id: 'support', label: 'Support', sublabel: 'AI assistant', icon: I.profile },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Panel', sublabel: 'Manage site', icon: I.shield, link: '/admin' }] : []),
  ]
  const switchTab = (tab) => { setActiveTab(tab); setSidebarOpen(false); setActiveModule(null); setModuleStep(0); setCourseDetail(null); setCancelConfirm(null); setRefundConfirm(null) }

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
        @keyframes dashBorderGlow { 0%,100% { border-color:rgba(253,188,1,0.12); } 50% { border-color:rgba(253,188,1,0.35); } }
        @keyframes dashCardHover { 0% { box-shadow:0 4px 16px rgba(0,0,0,0.04); } 100% { box-shadow:0 12px 48px rgba(1,69,168,0.12),0 0 0 1px rgba(1,69,168,0.06); } }
        .dash-anim { animation: dashFadeIn 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .dash-d1 { animation-delay:0.06s; } .dash-d2 { animation-delay:0.12s; } .dash-d3 { animation-delay:0.18s; } .dash-d4 { animation-delay:0.24s; } .dash-d5 { animation-delay:0.30s; } .dash-d6 { animation-delay:0.36s; } .dash-d7 { animation-delay:0.42s; }
        .dash-nav-item { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; border-radius:14px; cursor:pointer; transition:all 0.35s cubic-bezier(0.22,1,0.36,1); font-family:var(--font-body); font-size:0.88rem; font-weight:500; color:#64748B; border:none; background:none; width:100%; text-align:left; position:relative; overflow:hidden; }
        .dash-nav-item::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(1,69,168,0.06),rgba(253,188,1,0.04)); opacity:0; transition:opacity 0.3s; border-radius:14px; }
        .dash-nav-item:hover { color:#0F172A; transform:translateX(6px); }
        .dash-nav-item:hover::after { opacity:1; }
        .dash-nav-active { background:linear-gradient(135deg,rgba(1,69,168,0.08),rgba(1,69,168,0.03)) !important; color:#0145A8 !important; font-weight:700; box-shadow:0 4px 20px rgba(1,69,168,0.1); border:1px solid rgba(1,69,168,0.08); }
        .dash-nav-active::after { opacity:1 !important; }
        .dash-nav-active::before { content:''; position:absolute; left:0; top:8px; bottom:8px; width:3px; background:linear-gradient(180deg,#0145A8,#0145A8,${GOLD}); border-radius:0 4px 4px 0; box-shadow:0 0 12px rgba(1,69,168,0.3); }
        .dash-nav-active svg { stroke:#0145A8; filter:drop-shadow(0 0 4px rgba(1,69,168,0.25)); }
        .dash-slot { padding:1.1rem; border:1.5px solid #E8EDF4; border-radius:16px; text-align:center; cursor:pointer; transition:all 0.4s cubic-bezier(0.22,1,0.36,1); background:linear-gradient(145deg,#fff,#FAFBFE); position:relative; overflow:hidden; }
        .dash-slot::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(253,188,1,0.1),transparent 60%); opacity:0; transition:opacity 0.35s; }
        .dash-slot::after { content:''; position:absolute; top:-50%; left:-50%; width:200%; height:200%; background:radial-gradient(circle,rgba(253,188,1,0.06) 0%,transparent 60%); opacity:0; transition:opacity 0.4s; }
        .dash-slot:hover { border-color:rgba(253,188,1,0.5); transform:translateY(-4px) scale(1.01); box-shadow:0 12px 32px rgba(253,188,1,0.12),0 0 0 1px rgba(253,188,1,0.08); }
        .dash-slot:hover::before, .dash-slot:hover::after { opacity:1; }
        .dash-slot-sel { border-color:${GOLD} !important; background:linear-gradient(145deg,#FFFCF0,#FFF8E0) !important; box-shadow:0 12px 40px rgba(253,188,1,0.2),0 0 0 1px rgba(253,188,1,0.15),inset 0 1px 0 rgba(255,255,255,0.8) !important; transform:translateY(-4px) scale(1.01); animation:dashGlow 3s ease-in-out infinite; }
        .dash-slot-sel::before, .dash-slot-sel::after { opacity:1 !important; }
        .dash-mod { background:linear-gradient(160deg,rgba(255,255,255,0.95),rgba(250,251,253,0.98)); border:1.5px solid rgba(232,237,244,0.7); border-radius:20px; padding:1.75rem; cursor:pointer; transition:all 0.5s cubic-bezier(0.22,1,0.36,1); position:relative; overflow:hidden; backdrop-filter:blur(8px); }
        .dash-mod::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg,transparent,${GOLD},${GOLD_BRIGHT},${GOLD},transparent); opacity:0; transition:opacity 0.4s; }
        .dash-mod::after { content:''; position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:0; height:2px; background:linear-gradient(90deg,transparent,${SKY_BLUE},transparent); transition:width 0.5s cubic-bezier(0.22,1,0.36,1); }
        .dash-mod:hover { transform:translateY(-8px); box-shadow:0 24px 64px rgba(0,0,0,0.1),0 0 0 1px rgba(253,188,1,0.12); border-color:rgba(253,188,1,0.3); }
        .dash-mod:hover::before { opacity:1; }
        .dash-mod:hover::after { width:60%; }
        .dash-lesson { background:linear-gradient(145deg,#F8FAFD 0%,#F1F5F9 50%,#EDF2F7 100%); border:1px solid rgba(232,237,244,0.7); border-radius:18px; padding:1.75rem; position:relative; overflow:hidden; }
        .dash-lesson::before { content:''; position:absolute; top:0; left:0; bottom:0; width:3px; background:linear-gradient(180deg,${GOLD},${SKY_BLUE}); border-radius:0 2px 2px 0; }
        .dash-qopt { padding:1rem 1.25rem; border:1.5px solid rgba(232,237,244,0.7); border-radius:14px; cursor:pointer; transition:all 0.35s cubic-bezier(0.22,1,0.36,1); font-family:var(--font-body); font-size:0.9rem; color:#1a2332; background:linear-gradient(145deg,#fff,#FAFBFE); text-align:left; width:100%; position:relative; overflow:hidden; }
        .dash-qopt:hover { border-color:rgba(1,69,168,0.4); background:linear-gradient(145deg,#F0F6FF,#E8F0FE); transform:translateX(6px); box-shadow:0 8px 24px rgba(1,69,168,0.08),inset 0 1px 0 rgba(255,255,255,0.8); }
        .dash-qopt-sel { border-color:${SKY_BLUE} !important; background:linear-gradient(145deg,#E8F2FF,#D4E6FF) !important; box-shadow:0 8px 28px rgba(1,69,168,0.14),inset 0 1px 0 rgba(255,255,255,0.9) !important; transform:translateX(6px); }
        .dash-qopt-sel::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg,${SKY_BLUE},${GOLD}); border-radius:0 2px 2px 0; }
        .dash-gold-line { height:1px; background:linear-gradient(90deg,transparent,rgba(253,188,1,0.4),rgba(253,188,1,0.15),rgba(253,188,1,0.4),transparent); margin:0.5rem 0.75rem; }
        .dash-sidebar-overlay { display:none; position:fixed; inset:0; background:rgba(10,22,40,0.7); backdrop-filter:blur(12px) saturate(120%); z-index:998; }
        .dash-hamburger { display:none; }
        .dash-card-premium { background:linear-gradient(160deg,rgba(255,255,255,0.92),rgba(255,255,255,0.98)); border:1px solid rgba(226,235,245,0.5); border-radius:22px; padding:1.75rem; box-shadow:0 1px 2px rgba(0,0,0,0.02),0 8px 32px rgba(0,0,0,0.04),inset 0 1px 0 rgba(255,255,255,0.9); position:relative; overflow:hidden; transition:all 0.5s cubic-bezier(0.22,1,0.36,1); backdrop-filter:blur(8px); }
        .dash-card-premium::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.4),transparent 40%); pointer-events:none; border-radius:22px; }
        .dash-card-premium:hover { box-shadow:0 4px 8px rgba(0,0,0,0.03),0 16px 48px rgba(0,0,0,0.07),inset 0 1px 0 rgba(255,255,255,0.95); transform:translateY(-2px); }
        .dash-table-row { transition:all 0.3s cubic-bezier(0.22,1,0.36,1); }
        .dash-table-row:hover { background:linear-gradient(135deg,rgba(1,69,168,0.02),rgba(253,188,1,0.02)) !important; }
        .dash-input { width:100%; padding:0.9rem 1.2rem; border-radius:14px; border:1.5px solid #E8EDF4; outline:none; font-family:var(--font-body); font-size:0.9rem; color:#0F172A; box-sizing:border-box; background:linear-gradient(145deg,#FAFBFD,#fff); transition:all 0.35s cubic-bezier(0.22,1,0.36,1); }
        .dash-input:focus { border-color:rgba(1,69,168,0.35); box-shadow:0 0 0 3px rgba(1,69,168,0.06),0 4px 16px rgba(1,69,168,0.06); background:linear-gradient(145deg,#fff,#F8FAFD); }
        .dash-btn-primary { background:linear-gradient(135deg,${SKY_BLUE},#0a2a5e); color:#fff; padding:0.9rem 2rem; border-radius:14px; border:none; font-family:var(--font-body); fontSize:0.9rem; font-weight:600; cursor:pointer; transition:all 0.4s cubic-bezier(0.22,1,0.36,1); box-shadow:0 4px 16px rgba(1,69,168,0.2),inset 0 1px 0 rgba(255,255,255,0.1); position:relative; overflow:hidden; }
        .dash-btn-primary::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.15),transparent 50%); pointer-events:none; }
        .dash-btn-primary:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(1,69,168,0.3),inset 0 1px 0 rgba(255,255,255,0.15); }
        .dash-btn-gold { background:linear-gradient(135deg,${GOLD},${GOLD_BRIGHT}); color:${DARK}; padding:0.9rem 2rem; border-radius:14px; border:none; font-family:var(--font-mono); font-size:0.7rem; letter-spacing:0.12em; text-transform:uppercase; font-weight:700; cursor:pointer; transition:all 0.4s cubic-bezier(0.22,1,0.36,1); box-shadow:0 4px 20px rgba(253,188,1,0.25),inset 0 1px 0 rgba(255,255,255,0.4); position:relative; overflow:hidden; }
        .dash-btn-gold::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.3),transparent 50%); pointer-events:none; }
        .dash-btn-gold:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(253,188,1,0.35),inset 0 1px 0 rgba(255,255,255,0.5); }
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
        }
        @media (max-width:480px) { .dash-slot-grid { grid-template-columns:1fr !important; } }
        .dash-course-card { display:flex; align-items:center; background:linear-gradient(135deg,rgba(255,255,255,0.98),#FAFBFD); padding:1.25rem 1.5rem; border-radius:16px; border:1px solid #E8EDF4; gap:1.5rem; transition:all 0.4s cubic-bezier(0.22,1,0.36,1); position:relative; overflow:hidden; }
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

      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#F0F4FA 0%,#E8EEF6 25%,#F5F7FB 50%,#EDF1F7 75%,#F0F4FA 100%)', backgroundSize:'400% 400%', animation:'dashGradientMove 20s ease infinite', display:'flex', flexDirection:'column' }}>

        <header style={{ position:'sticky', top:0, zIndex:100, background:'linear-gradient(135deg,rgba(8,18,35,0.97),rgba(12,28,52,0.97))', backdropFilter:'blur(40px) saturate(200%)', boxShadow:'0 4px 30px rgba(0,0,0,0.35),0 1px 0 rgba(253,188,1,0.08),inset 0 -1px 0 rgba(253,188,1,0.06)' }}>
          <div style={{ height:'2.5px', background:`linear-gradient(90deg,transparent 5%,${GOLD} 20%,${GOLD_BRIGHT} 35%,#fff 50%,${GOLD_BRIGHT} 65%,${GOLD} 80%,transparent 95%)` }} />
          <div style={{ padding:'0 2rem', display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'1.25rem' }}>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="dash-hamburger" style={{ width:'40px', height:'40px', background:'rgba(253,188,1,0.08)', border:'1px solid rgba(253,188,1,0.15)', borderRadius:'10px', cursor:'pointer', alignItems:'center', justifyContent:'center', transition:'all 0.2s', flexShrink:0 }}>
                {sidebarOpen ? I.close : I.menu}
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:`linear-gradient(135deg,${GOLD},${GOLD_BRIGHT},${GOLD})`, backgroundSize:'200% 200%', animation:'dashGradientMove 4s ease infinite', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(253,188,1,0.4),inset 0 1px 0 rgba(255,255,255,0.3)', border:'1px solid rgba(253,188,1,0.3)' }}>
                  <img src="/driving-logo.png" alt="" style={{ height:'24px', width:'auto', filter:'brightness(0) invert(1)' }} />
                </div>
                <div>
                  <p style={{ fontFamily:'var(--font-display)', fontSize:'1.05rem', color:'#fff', margin:0, fontWeight:800, lineHeight:1.2, textShadow:'0 1px 2px rgba(0,0,0,0.2)' }}>Dashboard</p>
                  <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.15em', textTransform:'uppercase', color:GOLD_BRIGHT, margin:0, fontWeight:700, textShadow:'0 0 8px rgba(253,188,1,0.3)' }}>A Precision Driving School</p>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
              <button style={{ width:'42px', height:'42px', background:'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', transition:'all 0.35s cubic-bezier(0.22,1,0.36,1)', backdropFilter:'blur(8px)' }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
                {upcomingBookings.length > 0 && <div style={{ position:'absolute', top:'8px', right:'8px', width:'9px', height:'9px', borderRadius:'50%', background:'linear-gradient(135deg,#22C55E,#16A34A)', border:'2px solid rgba(12,28,52,0.97)', animation:'dashPulse 2s ease-in-out infinite', boxShadow:'0 0 8px rgba(34,197,94,0.5)' }} />}
              </button>
              <div style={{ width:'1px', height:'28px', background:'linear-gradient(180deg,transparent,rgba(253,188,1,0.2),transparent)' }} />
              <div style={{ position:'relative' }} onMouseEnter={() => setProfileMenuOpen(true)} onMouseLeave={() => setProfileMenuOpen(false)}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.45rem 0.85rem 0.45rem 0.55rem', background:profileMenuOpen ? 'linear-gradient(135deg,rgba(253,188,1,0.12),rgba(253,188,1,0.04))' : 'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))', border:`1px solid ${profileMenuOpen ? 'rgba(253,188,1,0.25)' : 'rgba(255,255,255,0.08)'}`, borderRadius:'14px', cursor:'pointer', transition:'all 0.35s cubic-bezier(0.22,1,0.36,1)', backdropFilter:'blur(8px)' }}>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontFamily:'var(--font-body)', fontSize:'0.82rem', color:'#fff', margin:0, fontWeight:600, lineHeight:1.2 }}>{user?.displayName || 'Student'}</p>
                    <p style={{ fontFamily:'var(--font-body)', fontSize:'0.65rem', color:'rgba(255,255,255,0.4)', margin:'0.1rem 0 0', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</p>
                  </div>
                  <div style={{ position:'relative' }}>
                    {user?.photoURL ? <img src={user.photoURL} alt="" style={{ width:'42px', height:'42px', borderRadius:'50%', objectFit:'cover', border:`2.5px solid ${GOLD}`, boxShadow:'0 0 20px rgba(253,188,1,0.3)' }} /> : <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:`linear-gradient(135deg,${GOLD},${GOLD_BRIGHT})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:800, color:DARK, border:`2.5px solid ${GOLD}`, boxShadow:'0 0 20px rgba(253,188,1,0.3)' }}>{initials}</div>}
                    <div style={{ position:'absolute', bottom:0, right:0, width:'11px', height:'11px', borderRadius:'50%', background:'linear-gradient(135deg,#22C55E,#16A34A)', border:'2.5px solid rgba(8,18,35,0.97)', boxShadow:'0 0 6px rgba(34,197,94,0.4)' }} />
                  </div>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" style={{ transition:'transform 0.25s', transform:profileMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }}><path d="M6 9l6 6 6-6" /></svg>
                </div>
                {profileMenuOpen && (
                  <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, width:'280px', background:'linear-gradient(160deg,rgba(12,28,52,0.97),rgba(8,18,35,0.98))', backdropFilter:'blur(40px) saturate(180%)', border:'1px solid rgba(253,188,1,0.12)', borderRadius:'18px', boxShadow:'0 24px 64px rgba(0,0,0,0.5),0 0 0 1px rgba(253,188,1,0.06)', overflow:'hidden', zIndex:200, animation:'dashFadeIn 0.25s cubic-bezier(0.22,1,0.36,1) both' }}>
                    <div style={{ padding:'1.25rem', borderBottom:'1px solid rgba(253,188,1,0.08)', background:'linear-gradient(135deg,rgba(253,188,1,0.06),rgba(1,69,168,0.03))' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        {user?.photoURL ? <img src={user.photoURL} alt="" style={{ width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', border:`2.5px solid ${GOLD}`, boxShadow:'0 0 16px rgba(253,188,1,0.25)' }} /> : <div style={{ width:'50px', height:'50px', borderRadius:'50%', background:`linear-gradient(135deg,${GOLD},${GOLD_BRIGHT})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', fontWeight:800, color:DARK, border:`2.5px solid ${GOLD}`, boxShadow:'0 0 16px rgba(253,188,1,0.25)' }}>{initials}</div>}
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontFamily:'var(--font-display)', fontSize:'0.95rem', color:'#fff', margin:0, fontWeight:700 }}>{user?.displayName || 'Student'}</p>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'0.72rem', color:'rgba(255,255,255,0.45)', margin:'0.2rem 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding:'0.5rem' }}>
                      {[
                        { label:'My Profile', icon:I.profile, action:() => { setProfileMenuOpen(false); switchTab('dashboard') } },
                        { label:'Book Lessons', icon:I.calendar, action:() => { setProfileMenuOpen(false); switchTab('bookings') } },
                        { label:'My Courses', icon:I.book, action:() => { setProfileMenuOpen(false); switchTab('courses') } },
                      ].map(item => (
                        <button key={item.label} onClick={item.action} style={{ display:'flex', alignItems:'center', gap:'0.7rem', padding:'0.65rem 0.8rem', width:'100%', fontFamily:'var(--font-body)', fontSize:'0.82rem', color:'rgba(255,255,255,0.7)', background:'none', border:'none', borderRadius:'10px', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ padding:'0.5rem', borderTop:'1px solid rgba(253,188,1,0.1)' }}>
                      <button onClick={async () => { setProfileMenuOpen(false); await signOut(auth); navigate('/') }} style={{ display:'flex', alignItems:'center', gap:'0.7rem', padding:'0.65rem 0.8rem', width:'100%', fontFamily:'var(--font-body)', fontSize:'0.82rem', color:'#EF4444', background:'none', border:'none', borderRadius:'10px', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                        {I.logout} Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div style={{ display:'flex', flex:1 }}>
          <div className={`dash-sidebar ${sidebarOpen ? 'dash-sidebar-open' : ''}`} style={{ width:'260px', background:'linear-gradient(180deg,#FFFFFF 0%,#FAFBFD 50%,#F5F7FB 100%)', padding:0, position:'sticky', top:'68px', height:'calc(100vh - 68px)', overflowY:'auto', flexShrink:0, transition:'left 0.4s', borderRight:'1px solid rgba(226,235,245,0.6)', display:'flex', flexDirection:'column', boxShadow:'inset -1px 0 0 rgba(255,255,255,0.8)' }}>
            <nav style={{ padding:'1.25rem 0.75rem' }}>
              {navItems.map(item => item.link ? (
                <a key={item.id} href={item.link} onClick={() => setSidebarOpen(false)} className="dash-nav-item" style={{ textDecoration:'none', marginBottom:'4px' }}>
                  <div style={{ flexShrink:0, width:'34px', height:'34px', borderRadius:'10px', background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', display:'flex', alignItems:'center', justifyContent:'center' }}>{item.icon}</div>
                  <div style={{ display:'flex', flexDirection:'column' }}><span>{item.label}</span>{item.sublabel && <span style={{ fontSize:'0.62rem', fontWeight:400, color:'#94A3B8', marginTop:'2px' }}>{item.sublabel}</span>}</div>
                </a>
              ) : (
                <button key={item.id} onClick={() => switchTab(item.id)} className={`dash-nav-item ${activeTab === item.id ? 'dash-nav-active' : ''}`} style={{ marginBottom:'4px' }}>
                  <div style={{ flexShrink:0, width:'34px', height:'34px', borderRadius:'10px', background:activeTab === item.id ? 'linear-gradient(135deg,rgba(1,69,168,0.12),rgba(1,69,168,0.06))' : 'linear-gradient(135deg,rgba(0,0,0,0.02),rgba(0,0,0,0.01))', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s' }}>{item.icon}</div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}><span>{item.label}</span>{item.sublabel && <span style={{ fontSize:'0.62rem', fontWeight:400, color:activeTab === item.id ? '#64748B' : '#94A3B8', marginTop:'2px' }}>{item.sublabel}</span>}</div>
                </button>
              ))}
            </nav>
            <div style={{ padding:'0.75rem', marginTop:'auto' }}>
              <div className="dash-gold-line" />
              <button onClick={() => navigate('/')} className="dash-nav-item" style={{ marginBottom:'4px', marginTop:'0.5rem' }}>
                <div style={{ flexShrink:0, width:'34px', height:'34px', borderRadius:'10px', background:'linear-gradient(135deg,rgba(0,0,0,0.02),rgba(0,0,0,0.01))', display:'flex', alignItems:'center', justifyContent:'center' }}>{I.home}</div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}><span>Back to Home</span></div>
              </button>
              <button onClick={handleLogout} className="dash-nav-item" style={{ marginBottom:'1rem' }}>
                <div style={{ flexShrink:0, width:'34px', height:'34px', borderRadius:'10px', background:'linear-gradient(135deg,rgba(220,38,38,0.04),rgba(220,38,38,0.02))', display:'flex', alignItems:'center', justifyContent:'center' }}>{I.logout}</div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start' }}><span>Logout</span><span style={{ fontSize:'0.62rem', fontWeight:400, color:'#94A3B8', marginTop:'2px' }}>Sign out</span></div>
              </button>
              <div style={{ padding:'0.85rem 1rem', background:'linear-gradient(145deg,rgba(1,69,168,0.04),rgba(253,188,1,0.02))', borderRadius:'14px', border:'1px solid rgba(1,69,168,0.06)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.8)' }}>
                <p style={{ fontFamily:'var(--font-display)', fontSize:'0.85rem', color:'#0F172A', margin:0, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.displayName || 'Student'}</p>
                <p style={{ fontFamily:'var(--font-body)', fontSize:'0.68rem', color:'#94A3B8', margin:'0.25rem 0 0' }}>Member since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month:'numeric', day:'numeric', year:'numeric' }) : 'recently'}</p>
              </div>
            </div>
          </div>

          <div className={`dash-sidebar-overlay ${sidebarOpen ? 'dash-sidebar-overlay-show' : ''}`} onClick={() => setSidebarOpen(false)} />

          <main className="dash-main" style={{ flex:1, marginLeft:0, minWidth:0 }}>
            {activeTab !== 'dashboard' && (
              <div style={{ padding:'2.5rem 2rem 0' }}>
                <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.5rem,3vw,2.2rem)', color:'#0F172A', lineHeight:1.15, fontWeight:800, margin:0, animation:'dashFadeIn 0.4s ease both' }}>{navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}</h1>
              </div>
            )}
            <div style={{ padding:'clamp(1.5rem,3vw,2.5rem)' }}>
              {msg && (
                <div className="dash-anim" style={{ padding:'0.85rem 1.25rem', background:msg.includes('Failed') ? 'linear-gradient(135deg,#FEF2F2,#FFF5F5)' : 'linear-gradient(135deg,#F0FDF4,#F5FFF8)', border:`1px solid ${msg.includes('Failed') ? 'rgba(220,38,38,0.15)' : 'rgba(34,197,94,0.15)'}`, borderRadius:'14px', marginBottom:'1.5rem', fontFamily:'var(--font-body)', fontSize:'0.85rem', color:msg.includes('Failed') ? '#DC2626' : '#16A34A', boxShadow:msg.includes('Failed') ? '0 4px 16px rgba(220,38,38,0.08)' : '0 4px 16px rgba(34,197,94,0.08)', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  {msg.includes('Failed') ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
                  {msg}
                </div>
              )}

              {activeTab === 'dashboard' && (
                <div>
                  <div style={{ marginBottom:'2.5rem' }}>
                    <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'#94A3B8', margin:'0 0 0.5rem', fontWeight:600 }}>Welcome back</p>
                    <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.8rem,3vw,2.4rem)', color:'#0F172A', margin:'0 0 0.5rem', fontWeight:800, lineHeight:1.1 }}>Dashboard</h2>
                    <p style={{ fontFamily:'var(--font-body)', fontSize:'0.95rem', color:'#94A3B8', margin:0 }}>Your profile details and quick summary</p>
                  </div>
                  <div className="dash-hero-grid" style={{ display:'grid', gridTemplateColumns:'repeat(12,1fr)', gap:'1.25rem' }}>
                    {/* Profile */}
                    <div className="dash-anim dash-card-premium" style={{ gridColumn:'span 7', display:'flex', gap:'1.5rem', alignItems:'center' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${SKY_BLUE},${GOLD_BRIGHT},${SKY_BLUE})`, backgroundSize:'200% 100%', animation:'dashShimmer 4s linear infinite' }} />
                      <div style={{ width:'90px', height:'90px', borderRadius:'22px', background:`linear-gradient(145deg,${DARK},#1a2f50 50%,${SKY_BLUE})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'2rem', fontWeight:800, fontFamily:'var(--font-display)', boxShadow:'0 12px 32px rgba(10,22,40,0.3),inset 0 1px 0 rgba(255,255,255,0.1)', flexShrink:0, position:'relative' }}>
                        {initials[0] || 'S'}
                        <div style={{ position:'absolute', bottom:'-3px', right:'-3px', width:'22px', height:'22px', borderRadius:'50%', background:'linear-gradient(135deg,#22C55E,#16A34A)', border:'3.5px solid #fff', boxShadow:'0 2px 12px rgba(34,197,94,0.4)' }} />
                      </div>
                      <div>
                        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.25rem', color:'#0F172A', fontWeight:800, margin:'0 0 0.5rem', lineHeight:1.2 }}>{user?.displayName || 'Student'}</h3>
                        <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#94A3B8', margin:'0 0 0.25rem', display:'flex', alignItems:'center', gap:'0.4rem' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg> {user?.email}</p>
                        <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#94A3B8', margin:'0 0 0.25rem', display:'flex', alignItems:'center', gap:'0.4rem' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg> {phone || '—'}</p>
                        <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#94A3B8', margin:0, display:'flex', alignItems:'center', gap:'0.4rem' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg> {address || '—'}</p>
                      </div>
                    </div>

                    {/* Medications */}
                    <div className="dash-anim dash-d1 dash-card-premium" style={{ gridColumn:'span 5' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#DC2626,#F97316)' }} />
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(220,38,38,0.08),rgba(220,38,38,0.03))', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg></div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#94A3B8', margin:0, fontWeight:600 }}>Medications</p>
                      </div>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', color:'#0F172A', margin:0, fontWeight:600 }}>{medications || '—'}</p>
                    </div>

                    {/* Permit */}
                    <div className="dash-anim dash-d2 dash-card-premium" style={{ gridColumn:'span 3' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${SKY_BLUE},#3B82F6)` }} />
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(1,69,168,0.08),rgba(1,69,168,0.03))', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg></div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#94A3B8', margin:0, fontWeight:600 }}>Permit</p>
                      </div>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', color:'#0F172A', margin:0, fontWeight:600 }}>{permit || '—'}</p>
                    </div>

                    {/* Submitted */}
                    <div className="dash-anim dash-d2 dash-card-premium" style={{ gridColumn:'span 4' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${GOLD},${GOLD_BRIGHT})` }} />
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(253,188,1,0.1),rgba(253,188,1,0.04))', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD_DEEP} strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg></div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#94A3B8', margin:0, fontWeight:600 }}>Submitted</p>
                      </div>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'0.95rem', color:'#0F172A', margin:0, fontWeight:600 }}>{submittedAt ? new Date(submittedAt + 'T12:00:00').toLocaleDateString('en-US', { month:'2-digit', day:'2-digit', year:'numeric' }) : '—'}</p>
                    </div>

                    {/* Notes */}
                    <div className="dash-anim dash-d3 dash-card-premium" style={{ gridColumn:'span 5', gridRow:'span 2' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#8B5CF6,#A78BFA)' }} />
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(139,92,246,0.08),rgba(139,92,246,0.03))', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#94A3B8', margin:0, fontWeight:600 }}>Notes</p>
                      </div>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'1rem', color:'#0F172A', margin:0, lineHeight:1.7, fontWeight:500 }}>{notes || '—'}</p>
                    </div>

                    {/* Issue Date */}
                    <div className="dash-anim dash-d4 dash-card-premium" style={{ gridColumn:'span 3' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#059669,#10B981)' }} />
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(5,150,105,0.08),rgba(5,150,105,0.03))', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#94A3B8', margin:0, fontWeight:600 }}>Issue Date</p>
                      </div>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'0.95rem', color:'#0F172A', margin:0, fontWeight:600 }}>{issueDate ? new Date(issueDate + 'T12:00:00').toLocaleDateString('en-US', { month:'2-digit', day:'2-digit', year:'numeric' }) : '—'}</p>
                    </div>

                    {/* Expiry */}
                    <div className="dash-anim dash-d5 dash-card-premium" style={{ gridColumn:'span 4' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#DC2626,#EF4444)' }} />
                      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.75rem' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(220,38,38,0.08),rgba(220,38,38,0.03))', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg></div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#94A3B8', margin:0, fontWeight:600 }}>Expiry</p>
                      </div>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'0.95rem', color:'#0F172A', margin:0, fontWeight:600 }}>{expiryDate ? new Date(expiryDate + 'T12:00:00').toLocaleDateString('en-US', { month:'2-digit', day:'2-digit', year:'numeric' }) : '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
                  <div className="dash-anim dash-card-premium" style={{ padding:'2.5rem' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${SKY_BLUE},${GOLD_BRIGHT},${SKY_BLUE})`, backgroundSize:'200% 100%', animation:'dashShimmer 5s linear infinite' }} />
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem', marginBottom:'0.5rem' }}>
                      <div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'#94A3B8', margin:'0 0 0.5rem', fontWeight:600, animation:'dashTextReveal 0.8s ease both' }}>COURSES</p>
                        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', color:'#0F172A', margin:0, fontWeight:800, textTransform:'uppercase' }}>YOUR ENROLLED COURSES</h2>
                      </div>
                      {courses.length > 0 && (
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', padding:'0.5rem 1rem', borderRadius:'12px', border:'1px solid rgba(1,69,168,0.08)' }}>
                          <span style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', fontWeight:800, color:SKY_BLUE }}>{courses.length}</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', fontWeight:600 }}>enrolled</span>
                        </div>
                      )}
                    </div>
                    <p style={{ fontFamily:'var(--font-body)', fontSize:'0.9rem', color:'#94A3B8', margin:'0 0 1.5rem' }}>Here are your currently enrolled courses... you can add more packages.</p>
                    <button onClick={() => navigate('/pricing')} className="dash-btn-primary" style={{ marginBottom:'2rem' }}>Add more packages</button>
                    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                      {courses.length === 0 && (
                        <div style={{ textAlign:'center', padding:'2.5rem 1rem' }}>
                          <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg></div>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#94A3B8', marginBottom:'1rem' }}>No courses enrolled yet.</p>
                          <button onClick={() => navigate('/pricing')} className="dash-btn-gold" style={{ fontSize:'0.65rem', padding:'0.7rem 1.5rem' }}>Browse Courses</button>
                        </div>
                      )}
                      {[...courses].sort((a, b) => {
                        const order = { 'Enrolled': 0, 'In Progress': 1, 'Paid': 0, 'Pending': 2, 'Completed': 3, 'Refunded': 4, 'Cancelled': 5 }
                        return (order[a.status] ?? 1) - (order[b.status] ?? 1)
                      }).map((course, i) => (
                        <div key={course.id || i} className="dash-course-card" style={{ animationDelay:`${i * 0.06}s` }}>
                          <div className="dash-course-icon" style={{ width:'52px', height:'52px', borderRadius:'14px', background:'linear-gradient(135deg,rgba(1,69,168,0.08),rgba(1,69,168,0.03))', color:SKY_BLUE, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:'0.95rem', fontWeight:800, flexShrink:0, border:'1px solid rgba(1,69,168,0.08)' }}>{course.id}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', marginBottom:'0.25rem' }}>
                              <h4 style={{ fontFamily:'var(--font-display)', fontSize:'0.95rem', color:'#0F172A', fontWeight:800, margin:0, textTransform:'uppercase' }}>{course.title}</h4>
                              <span style={{ padding:'0.15rem 0.5rem', borderRadius:'999px', fontFamily:'var(--font-mono)', fontSize:'0.45rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700, ...(course.status === 'Enrolled' || course.status === 'Paid' ? { background:'rgba(34,197,94,0.08)', color:'#16A34A' } : course.status === 'Completed' ? { background:'rgba(1,69,168,0.08)', color:SKY_BLUE } : course.status === 'Refunded' || course.status === 'Cancelled' ? { background:'rgba(220,38,38,0.06)', color:'#DC2626' } : { background:'rgba(234,179,8,0.08)', color:'#CA8A04' }) }}>{course.status}</span>
                            </div>
                            <p style={{ fontFamily:'var(--font-body)', fontSize:'0.8rem', color:'#94A3B8', margin:'0 0 0.5rem' }}>{course.price}</p>
                            <div style={{ height:'6px', background:'#E8EDF4', borderRadius:'3px', overflow:'hidden', marginBottom:'0.4rem', maxWidth:'300px' }}>
                              <div style={{ width:`${course.progress || 0}%`, height:'100%', background:`linear-gradient(90deg,${SKY_BLUE},#3B82F6)`, borderRadius:'3px', transition:'width 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
                            </div>
                            <p style={{ fontFamily:'var(--font-body)', fontSize:'0.75rem', color:'#94A3B8', margin:0 }}>{course.progress || 0}% complete</p>
                          </div>
                          <div style={{ display:'flex', gap:'0.5rem', flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end', alignItems:'center' }}>
                            <button onClick={() => setCourseDetail(course)} style={{ padding:'0.5rem 1rem', background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', color:SKY_BLUE, border:'1px solid rgba(1,69,168,0.1)', borderRadius:'8px', fontFamily:'var(--font-body)', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'0.4rem', transition:'all 0.2s' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg> Details
                            </button>
                            {course.status !== 'Refunded' && course.status !== 'Cancelled' && (
                              <>
                                <button onClick={() => setCancelConfirm(course.id)} style={{ padding:'0.5rem 1rem', background:'none', color:'#DC2626', border:'1px solid rgba(220,38,38,0.15)', borderRadius:'8px', fontFamily:'var(--font-body)', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background='rgba(220,38,38,0.04)'; e.currentTarget.style.borderColor='rgba(220,38,38,0.3)' }} onMouseLeave={(e) => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='rgba(220,38,38,0.15)' }}>
                                  Cancel
                                </button>
                                <button onClick={() => setRefundConfirm(course.id)} style={{ padding:'0.5rem 1rem', background:'none', color:'#CA8A04', border:'1px solid rgba(202,138,4,0.15)', borderRadius:'8px', fontFamily:'var(--font-body)', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background='rgba(202,138,4,0.04)'; e.currentTarget.style.borderColor='rgba(202,138,4,0.3)' }} onMouseLeave={(e) => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='rgba(202,138,4,0.15)' }}>
                                  Refund
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {courseDetail && (
                <div style={{ position:'fixed', inset:0, background:'rgba(10,22,40,0.6)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', animation:'dashFadeIn 0.3s ease' }} onClick={(e) => { if (e.target === e.currentTarget) setCourseDetail(null) }}>
                  <div style={{ background:'#fff', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:'440px', boxShadow:'0 24px 80px rgba(0,0,0,0.25)', animation:'dashSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)', overflow:'hidden' }}>
                    <div style={{ background:`linear-gradient(135deg,${DARK} 0%,#1a0a3e 50%,${DARK} 100%)`, padding:'2rem', position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(253,188,1,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(253,188,1,0.04) 1px, transparent 1px)', backgroundSize:'24px 24px', pointerEvents:'none' }} />
                      <button onClick={() => setCourseDetail(null)} style={{ position:'absolute', top:'1rem', right:'1rem', background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff', fontSize:'1.1rem', zIndex:2 }}>&times;</button>
                      <div style={{ position:'relative', zIndex:1 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem' }}>
                          <span style={{ width:'16px', height:'2px', background:`linear-gradient(90deg, transparent, ${GOLD})` }} />
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.2em', textTransform:'uppercase', color:GOLD_DEEP, fontWeight:700 }}>Course Details</span>
                        </div>
                        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', color:'#fff', fontWeight:800, margin:0 }}>{courseDetail.title}</h2>
                      </div>
                    </div>
                    <div style={{ padding:'1.5rem 2rem 2rem' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.25rem' }}>
                        <div style={{ background:'#F8FAFD', borderRadius:'12px', padding:'1rem', border:'1px solid #E8EDF4' }}>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', margin:'0 0 0.3rem', fontWeight:600 }}>Course ID</p>
                          <p style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:DARK, fontWeight:800, margin:0 }}>{courseDetail.id}</p>
                        </div>
                        <div style={{ background:'#F8FAFD', borderRadius:'12px', padding:'1rem', border:'1px solid #E8EDF4' }}>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', margin:'0 0 0.3rem', fontWeight:600 }}>Price</p>
                          <p style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:GOLD, fontWeight:800, margin:0 }}>{courseDetail.price}</p>
                        </div>
                        <div style={{ background:'#F8FAFD', borderRadius:'12px', padding:'1rem', border:'1px solid #E8EDF4' }}>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', margin:'0 0 0.3rem', fontWeight:600 }}>Status</p>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:courseDetail.status === 'Enrolled' || courseDetail.status === 'Paid' ? '#16A34A' : '#DC2626', fontWeight:700, margin:0 }}>{courseDetail.status}</p>
                        </div>
                        <div style={{ background:'#F8FAFD', borderRadius:'12px', padding:'1rem', border:'1px solid #E8EDF4' }}>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', margin:'0 0 0.3rem', fontWeight:600 }}>Progress</p>
                          <p style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:DARK, fontWeight:800, margin:0 }}>{courseDetail.progress || 0}%</p>
                        </div>
                      </div>
                      {courseDetail.enrolledAt && (
                        <div style={{ background:'#F8FAFD', borderRadius:'12px', padding:'1rem', border:'1px solid #E8EDF4', marginBottom:'1.25rem' }}>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', margin:'0 0 0.3rem', fontWeight:600 }}>Enrolled On</p>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:DARK, fontWeight:600, margin:0 }}>{new Date(courseDetail.enrolledAt).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</p>
                        </div>
                      )}
                      <button onClick={() => setCourseDetail(null)} style={{ width:'100%', padding:'0.85rem', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:700, color:'#fff', background:`linear-gradient(135deg,${SKY_BLUE},#0a2a5e)`, border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', boxShadow:'0 4px 16px rgba(1,69,168,0.2)' }}>Close</button>
                    </div>
                  </div>
                </div>
              )}

              {cancelConfirm && (
                <div style={{ position:'fixed', inset:0, background:'rgba(10,22,40,0.6)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', animation:'dashFadeIn 0.3s ease' }} onClick={(e) => { if (e.target === e.currentTarget) setCancelConfirm(null) }}>
                  <div style={{ background:'#fff', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:'400px', boxShadow:'0 24px 80px rgba(0,0,0,0.25)', animation:'dashSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)', overflow:'hidden' }}>
                    <div style={{ padding:'2rem 2rem 1.5rem', textAlign:'center' }}>
                      <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(220,38,38,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                      </div>
                      <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'#0F172A', fontWeight:800, margin:'0 0 0.5rem' }}>Cancel Enrollment</h3>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#94A3B8', margin:0, lineHeight:1.5 }}>Are you sure you want to cancel this course? This action cannot be undone.</p>
                    </div>
                    <div style={{ padding:'0 2rem 2rem', display:'flex', gap:'0.75rem' }}>
                      <button onClick={() => setCancelConfirm(null)} style={{ flex:1, padding:'0.75rem 1.5rem', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'#94A3B8', background:'transparent', border:'1.5px solid #E2EBF5', borderRadius:'var(--radius-sm)', cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor='#CBD5E0'; e.currentTarget.style.color='#0F172A' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor='#E2EBF5'; e.currentTarget.style.color='#94A3B8' }}>Keep Course</button>
                      <button onClick={() => handleCancelCourse(cancelConfirm)} style={{ flex:1, padding:'0.75rem 1.5rem', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'#fff', background:'linear-gradient(135deg,#DC2626,#B91C1C)', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', transition:'all 0.3s', boxShadow:'0 4px 16px rgba(220,38,38,0.25)' }} onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(220,38,38,0.35)' }} onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(220,38,38,0.25)' }}>Yes, Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {refundConfirm && (
                <div style={{ position:'fixed', inset:0, background:'rgba(10,22,40,0.6)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', animation:'dashFadeIn 0.3s ease' }} onClick={(e) => { if (e.target === e.currentTarget) setRefundConfirm(null) }}>
                  <div style={{ background:'#fff', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:'400px', boxShadow:'0 24px 80px rgba(0,0,0,0.25)', animation:'dashSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)', overflow:'hidden' }}>
                    <div style={{ padding:'2rem 2rem 1.5rem', textAlign:'center' }}>
                      <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(202,138,4,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></svg>
                      </div>
                      <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:'#0F172A', fontWeight:800, margin:'0 0 0.5rem' }}>Request Refund</h3>
                      <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#94A3B8', margin:0, lineHeight:1.5 }}>Are you sure you want to request a refund for this course? The course will be removed from your dashboard.</p>
                    </div>
                    <div style={{ padding:'0 2rem 2rem', display:'flex', gap:'0.75rem' }}>
                      <button onClick={() => setRefundConfirm(null)} style={{ flex:1, padding:'0.75rem 1.5rem', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'#94A3B8', background:'transparent', border:'1.5px solid #E2EBF5', borderRadius:'var(--radius-sm)', cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor='#CBD5E0'; e.currentTarget.style.color='#0F172A' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor='#E2EBF5'; e.currentTarget.style.color='#94A3B8' }}>Keep Course</button>
                      <button onClick={() => handleRefundCourse(refundConfirm)} style={{ flex:1, padding:'0.75rem 1.5rem', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, color:'#fff', background:'linear-gradient(135deg,#CA8A04,#A16207)', border:'none', borderRadius:'var(--radius-sm)', cursor:'pointer', transition:'all 0.3s', boxShadow:'0 4px 16px rgba(202,138,4,0.25)' }} onMouseEnter={(e) => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(202,138,4,0.35)' }} onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(202,138,4,0.25)' }}>Yes, Refund</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
                  <div className="dash-anim dash-card-premium" style={{ padding:'2.5rem' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${GOLD},${GOLD_BRIGHT},${GOLD})`, backgroundSize:'200% 100%', animation:'dashShimmer 5s linear infinite' }} />
                    <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'#94A3B8', margin:'0 0 0.5rem', fontWeight:600, animation:'dashTextReveal 0.8s ease both' }}>Billing</p>
                    <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', color:'#0F172A', margin:'0 0 1.5rem', fontWeight:800, textTransform:'uppercase' }}>PAYMENT HISTORY</h2>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
                      <div style={{ background:'linear-gradient(135deg,rgba(5,150,105,0.04),rgba(5,150,105,0.01))', border:'1px solid rgba(5,150,105,0.1)', borderRadius:'var(--radius-md)', padding:'1.25rem' }}>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#059669', margin:'0 0 0.25rem', fontWeight:600 }}>Total Paid</p>
                        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:'#059669', margin:0, fontWeight:800 }}>{payments.filter(p => p.status === 'Paid').length}</p>
                      </div>
                      <div style={{ background:'linear-gradient(135deg,rgba(234,179,8,0.04),rgba(234,179,8,0.01))', border:'1px solid rgba(234,179,8,0.1)', borderRadius:'var(--radius-md)', padding:'1.25rem' }}>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#CA8A04', margin:'0 0 0.25rem', fontWeight:600 }}>Pending</p>
                        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:'#CA8A04', margin:0, fontWeight:800 }}>{payments.filter(p => p.status !== 'Paid').length}</p>
                      </div>
                      <div style={{ background:'linear-gradient(135deg,rgba(1,69,168,0.04),rgba(1,69,168,0.01))', border:'1px solid rgba(1,69,168,0.1)', borderRadius:'var(--radius-md)', padding:'1.25rem' }}>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.1em', textTransform:'uppercase', color:SKY_BLUE, margin:'0 0 0.25rem', fontWeight:600 }}>Transactions</p>
                        <p style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:SKY_BLUE, margin:0, fontWeight:800 }}>{payments.length}</p>
                      </div>
                    </div>
                    <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:'0', minWidth:'700px' }}>
                      <thead>
                        <tr>
                          {['Date','Ref','Email','Item','Amount','Status','Receipt'].map((th, i) => (
                            <th key={th} style={{ textAlign:i===6?'center':'left', padding:'0.85rem 1rem', fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', fontWeight:700, borderBottom:'2px solid #E8EDF4', background:'linear-gradient(135deg,#FAFBFD,#F5F7FB)', ...(i===0?{borderTopLeftRadius:'10px',borderBottomLeftRadius:'10px'}:{}), ...(i===6?{borderTopRightRadius:'10px',borderBottomRightRadius:'10px'}:{}) }}>{th}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length === 0 && (
                          <tr>
                            <td colSpan="7" style={{ padding:'2.5rem 1rem', textAlign:'center' }}>
                              <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg></div>
                              <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#94A3B8', marginBottom:'1rem' }}>No payment history yet.</p>
                              <button onClick={() => navigate('/pricing')} className="dash-btn-gold" style={{ fontSize:'0.65rem', padding:'0.7rem 1.5rem' }}>Browse Courses</button>
                            </td>
                          </tr>
                        )}
                        {payments.map((p, i) => (
                          <tr key={i} className="dash-table-row" style={{ borderBottom:'1px solid #F1F5F9' }}>
                            <td style={{ padding:'1rem', fontFamily:'var(--font-body)', fontSize:'0.8rem', color:'#475569' }}>{p.date}</td>
                            <td style={{ padding:'1rem', fontFamily:'var(--font-mono)', fontSize:'0.75rem', color:'#475569', fontWeight:600 }}>{p.ref}</td>
                            <td style={{ padding:'1rem', fontFamily:'var(--font-body)', fontSize:'0.8rem', color:'#475569' }}>{p.email}</td>
                            <td style={{ padding:'1rem', fontFamily:'var(--font-body)', fontSize:'0.8rem', color:'#475569', fontWeight:600 }}>{p.item}</td>
                            <td style={{ padding:'1rem', fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#0F172A', fontWeight:700 }}>{p.amount}</td>
                            <td style={{ padding:'1rem' }}><span style={{ padding:'0.25rem 0.7rem', background:p.status==='Paid' ? 'rgba(5,150,105,0.06)' : 'rgba(220,38,38,0.04)', color:p.status==='Paid' ? '#059669' : '#DC2626', borderRadius:'999px', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:700 }}>{p.status}</span></td>
                            <td style={{ padding:'1rem', textAlign:'center' }}><button onClick={() => { const r = window.open('','_blank'); r.document.write(`<html><head><title>Receipt - ${p.ref}</title><style>body{font-family:sans-serif;padding:40px;color:#333}h1{font-size:20px;border-bottom:2px solid #0145A8;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:20px}td{padding:8px 12px;border-bottom:1px solid #eee}.lbl{color:#94A3B8;width:120px}</style></head><body><h1>A Precision Driving School</h1><p style="color:#94A3B8">Payment Receipt</p><table><tr><td class="lbl">Date</td><td>${p.date}</td></tr><tr><td class="lbl">Reference</td><td>${p.ref}</td></tr><tr><td class="lbl">Email</td><td>${p.email}</td></tr><tr><td class="lbl">Item</td><td>${p.item}</td></tr><tr><td class="lbl">Amount</td><td><strong>${p.amount}</strong></td></tr><tr><td class="lbl">Status</td><td>${p.status}</td></tr></table><p style="margin-top:40px;color:#94A3B8;font-size:12px">A Precision Driving School - San Ramon, CA</p></body></html>`); r.document.close(); r.print() }} style={{ background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', border:'none', color:SKY_BLUE, cursor:'pointer', padding:'0.35rem', borderRadius:'8px', display:'inline-flex' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
                  <div className="dash-anim dash-card-premium" style={{ padding:'2.5rem' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${SKY_BLUE},${GOLD_BRIGHT},${SKY_BLUE})`, backgroundSize:'200% 100%', animation:'dashShimmer 5s linear infinite' }} />
                    <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'#94A3B8', margin:'0 0 0.5rem', fontWeight:600 }}>Settings</p>
                    <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', color:'#0F172A', margin:'0 0 0.5rem', fontWeight:800, textTransform:'uppercase' }}>ACCOUNT SETTINGS</h2>
                    <p style={{ fontFamily:'var(--font-body)', fontSize:'0.9rem', color:'#94A3B8', margin:'0 0 2rem' }}>Quick access to profile and security settings.</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1rem' }}>
                      <div>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>Username</label>
                        <input type="text" value={sUsername} onChange={e => setSUsername(e.target.value)} className="dash-input" />
                      </div>
                      <div>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>Email</label>
                        <input type="email" value={user?.email || ''} readOnly className="dash-input" style={{ color:'#94A3B8', background:'linear-gradient(145deg,#F0F0F0,#e8e8e8)', cursor:'not-allowed' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>Phone</label>
                        <input type="tel" value={sPhone} onChange={e => setSPhone(e.target.value)} className="dash-input" />
                      </div>
                      <div>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>Permit</label>
                        <input type="text" value={sPermit} onChange={e => setSPermit(e.target.value)} className="dash-input" />
                      </div>
                      <div>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>Medications</label>
                        <input type="text" value={sMedications} onChange={e => setSMedications(e.target.value)} className="dash-input" />
                      </div>
                      <div style={{ gridColumn:'1 / 2' }}>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>Address</label>
                        <textarea value={sAddress} onChange={e => setSAddress(e.target.value)} rows="3" className="dash-input" style={{ resize:'vertical' }} />
                      </div>
                      <div style={{ gridColumn:'1 / 2' }}>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>Notes</label>
                        <textarea value={sNotes} onChange={e => setSNotes(e.target.value)} rows="3" className="dash-input" style={{ resize:'vertical' }} />
                      </div>
                      <div>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>Submitted Date</label>
                        <input type="date" value={sSubmittedAt} onChange={e => setSSubmittedAt(e.target.value)} className="dash-input" />
                      </div>
                      <div>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>Issue Date</label>
                        <input type="date" value={sIssueDate} onChange={e => setSIssueDate(e.target.value)} className="dash-input" />
                      </div>
                      <div>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>Expiry Date</label>
                        <input type="date" value={sExpiryDate} onChange={e => setSExpiryDate(e.target.value)} className="dash-input" />
                      </div>
                    </div>
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', color:'#64748B', margin:'0 0 1.5rem', fontWeight:700 }}>Change password (optional)</h3>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
                      <div>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>Current password</label>
                        <input type="password" placeholder="Enter current password" value={sCurrentPass} onChange={e => setSCurrentPass(e.target.value)} className="dash-input" />
                      </div>
                      <div>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>New password</label>
                        <input type="password" placeholder="Min 8 characters" value={sNewPass} onChange={e => setSNewPass(e.target.value)} className="dash-input" />
                      </div>
                      <div>
                        <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', marginBottom:'0.5rem', fontWeight:600 }}>Confirm new password</label>
                        <input type="password" placeholder="Repeat new password" value={sConfirmPass} onChange={e => setSConfirmPass(e.target.value)} className="dash-input" />
                      </div>
                    </div>
                    <button onClick={handleSaveSettings} disabled={sSaving} className="dash-btn-primary" style={{ boxShadow:sSaving ? 'none' : undefined }}>{sSaving ? 'Saving...' : 'Save changes'}</button>
                  </div>
                </div>
              )}

              {activeTab === 'support' && (
                <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', gap:'1rem', height:'650px' }}>
                  <div className="dash-anim" style={{ width:'260px', flexShrink:0, background:'linear-gradient(135deg,rgba(255,255,255,0.98),#FAFBFD)', borderRadius:'18px', border:'1px solid rgba(226,235,245,0.6)', boxShadow:'0 1px 3px rgba(0,0,0,0.02), 0 4px 16px rgba(0,0,0,0.03)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                    <div style={{ padding:'1rem', borderBottom:'1px solid #E8EDF4' }}>
                      <button onClick={handleNewChat} style={{ width:'100%', padding:'0.65rem', background: chatMessages.length === 0 && !activeConvId ? 'rgba(1,69,168,0.06)' : 'transparent', border:'1.5px solid rgba(1,69,168,0.1)', borderRadius:'10px', fontFamily:'var(--font-body)', fontSize:'0.8rem', fontWeight:600, color:SKY_BLUE, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', transition:'all 0.2s' }} onMouseEnter={(e) => { if (!(chatMessages.length === 0 && !activeConvId)) { e.currentTarget.style.background='rgba(1,69,168,0.04)'; e.currentTarget.style.borderColor='rgba(1,69,168,0.2)' } }} onMouseLeave={(e) => { if (!(chatMessages.length === 0 && !activeConvId)) { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(1,69,168,0.1)' } }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg> New Chat
                      </button>
                    </div>
                    <div style={{ flex:1, overflowY:'auto', padding:'0.5rem' }}>
                      {conversations.length === 0 ? (
                        <div style={{ textAlign:'center', padding:'2rem 1rem' }}>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'0.75rem', color:'#B0B8C4', margin:0 }}>No conversations yet.</p>
                        </div>
                      ) : (
                        conversations.map(conv => (
                          <div key={conv.id} onClick={() => handleSelectConv(conv.id)} style={{ padding:'0.6rem 0.75rem', borderRadius:'10px', cursor:'pointer', marginBottom:'0.2rem', background: activeConvId === conv.id ? 'rgba(1,69,168,0.06)' : 'transparent', border: activeConvId === conv.id ? '1px solid rgba(1,69,168,0.1)' : '1px solid transparent', transition:'all 0.15s', display:'flex', alignItems:'center', gap:'0.5rem', position:'relative' }} onMouseEnter={(e) => { if (activeConvId !== conv.id) e.currentTarget.style.background='rgba(0,0,0,0.02)' }} onMouseLeave={(e) => { if (activeConvId !== conv.id) e.currentTarget.style.background='transparent' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" style={{ flexShrink:0 }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                            <p style={{ fontFamily:'var(--font-body)', fontSize:'0.75rem', color: activeConvId === conv.id ? DARK : '#64748B', margin:0, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight: activeConvId === conv.id ? 600 : 400 }}>{conv.title}</p>
                            <button onClick={(e) => handleDeleteConv(e, conv.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:'2px', borderRadius:'4px', display:'flex', opacity:0.4, transition:'opacity 0.2s', flexShrink:0 }} onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(220,38,38,0.06)' }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.background = 'none' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="dash-anim dash-d1" style={{ flex:1, background:'linear-gradient(135deg,rgba(255,255,255,0.98),#fff)', borderRadius:'20px', border:'1px solid rgba(226,235,245,0.6)', boxShadow:'0 1px 3px rgba(0,0,0,0.02), 0 8px 32px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                    <div style={{ flex:1, overflowY:'auto', padding:'2rem', display:'flex', flexDirection:'column', gap:'1.5rem' }}>
                      {chatMessages.length === 0 && (
                        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1.25rem' }}>
                          <div style={{ width:'72px', height:'72px', borderRadius:'20px', background:`linear-gradient(135deg,${SKY_BLUE},#0a2a5e)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 32px rgba(1,69,168,0.2)' }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                          </div>
                          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', color:DARK, fontWeight:800, margin:0 }}>How can I help you today?</h3>
                          <p style={{ fontFamily:'var(--font-body)', fontSize:'0.9rem', color:'#94A3B8', margin:0, textAlign:'center', maxWidth:'400px', lineHeight:1.6 }}>Ask me anything about our driving courses, scheduling, payments, permits, or driving rules in California.</p>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem', marginTop:'0.5rem', maxWidth:'440px', width:'100%' }}>
                            {[{ q:'What courses do you offer?' }, { q:'How do I schedule a lesson?' }, { q:'What is the refund policy?' }, { q:'Do I need a permit first?' }].map((s, i) => (
                              <button key={i} onClick={() => setChatInput(s.q)} style={{ padding:'0.75rem 1rem', background:'linear-gradient(135deg,rgba(1,69,168,0.03),rgba(1,69,168,0.01))', border:'1px solid rgba(1,69,168,0.08)', borderRadius:'12px', fontFamily:'var(--font-body)', fontSize:'0.78rem', color:DARK, fontWeight:500, cursor:'pointer', textAlign:'left', transition:'all 0.2s', lineHeight:1.4 }} onMouseEnter={(e) => { e.currentTarget.style.borderColor='rgba(1,69,168,0.2)'; e.currentTarget.style.background='rgba(1,69,168,0.05)' }} onMouseLeave={(e) => { e.currentTarget.style.borderColor='rgba(1,69,168,0.08)'; e.currentTarget.style.background='linear-gradient(135deg,rgba(1,69,168,0.03),rgba(1,69,168,0.01))' }}>{s.q}</button>
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
                            <div style={{ padding:'0.85rem 1.15rem', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: m.role === 'user' ? `linear-gradient(135deg,${SKY_BLUE},#0a2a5e)` : 'linear-gradient(135deg,#F1F5F9,#E8EDF4)', color: m.role === 'user' ? '#fff' : DARK, fontFamily:'var(--font-body)', fontSize:'0.88rem', lineHeight:1.7, maxWidth:'85%', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                              {m.content}
                            </div>
                          </div>
                          {m.role === 'user' && (
                            <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'linear-gradient(135deg,rgba(253,188,1,0.15),rgba(253,188,1,0.05))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'2px' }}>
                              <span style={{ fontFamily:'var(--font-display)', fontSize:'0.8rem', fontWeight:800, color:GOLD_DEEP }}>{user?.displayName?.[0] || user?.email?.[0] || '?'}</span>
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
                            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#94A3B8', animation:'dashPulse 1.2s ease infinite' }} />
                            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#94A3B8', animation:'dashPulse 1.2s ease 0.2s infinite' }} />
                            <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#94A3B8', animation:'dashPulse 1.2s ease 0.4s infinite' }} />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #E8EDF4', background:'linear-gradient(135deg,#FAFBFD,#F5F7FB)', display:'flex', gap:'0.6rem', alignItems:'flex-end' }}>
                      <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat() } }} rows="1" placeholder="Ask about courses, scheduling, payments..." className="dash-input" style={{ flex:1, background:'#fff', borderRadius:'14px', padding:'0.75rem 1rem', fontSize:'0.88rem', resize:'none', minHeight:'44px', maxHeight:'100px' }} />
                      <button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} style={{ width:'44px', height:'44px', borderRadius:'14px', border:'none', background:(!chatInput.trim() || chatLoading) ? '#E2EBF5' : `linear-gradient(135deg,${SKY_BLUE},#0a2a5e)`, color:(!chatInput.trim() || chatLoading) ? '#94A3B8' : '#fff', cursor:(!chatInput.trim() || chatLoading) ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s', boxShadow:(!chatInput.trim() || chatLoading) ? 'none' : '0 4px 12px rgba(1,69,168,0.25)', flexShrink:0 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bookings' && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }} className="dash-grid">
                  <div className="dash-anim dash-card-premium">
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${GOLD},${GOLD_BRIGHT},${GOLD})`, backgroundSize:'200% 100%', animation:'dashShimmer 4s linear infinite' }} />
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.15rem', color:DARK, fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(253,188,1,0.1),rgba(253,188,1,0.04))', display:'flex', alignItems:'center', justifyContent:'center' }}>{I.calendar}</div>
                      Schedule a Lesson
                    </h3>
                    <div style={{ marginBottom:'1.25rem' }}>
                      <label style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'#94A3B8', fontWeight:600, display:'block', marginBottom:'0.35rem' }}>Select Date</label>
                      <input type="date" min={todayStr} value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="dash-input" />
                    </div>
                    <div style={{ marginBottom:'1.5rem' }}>
                      <label style={{ fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'#94A3B8', fontWeight:600, display:'block', marginBottom:'0.35rem' }}>Select Time Slot</label>
                      <div className="dash-slot-grid" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'0.75rem', marginTop:'0.4rem' }}>
                        {TIME_SLOTS.map(slot => (
                          <div key={slot.id} onClick={() => setBookingSlot(slot.id)} className={`dash-slot ${bookingSlot === slot.id ? 'dash-slot-sel' : ''}`}>
                            <div style={{ fontFamily:'var(--font-display)', fontSize:'0.85rem', color:bookingSlot === slot.id ? GOLD_DEEP : DARK, fontWeight:700, marginBottom:'0.2rem', position:'relative', zIndex:1 }}>{slot.label}</div>
                            <div style={{ fontFamily:'var(--font-body)', fontSize:'0.75rem', color:'#94A3B8', marginBottom:'0.15rem', position:'relative', zIndex:1 }}>{slot.time}</div>
                            <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.1em', textTransform:'uppercase', color:bookingSlot === slot.id ? GOLD_DEEP : '#aaa', fontWeight:600, position:'relative', zIndex:1 }}>{slot.hours} Hours</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={handleBookLesson} disabled={bookingLoading || !bookingDate || !bookingSlot} className={!bookingDate || !bookingSlot ? '' : 'dash-btn-gold'} style={{ width:'100%', padding:'0.9rem', background:(!bookingDate || !bookingSlot) ? 'linear-gradient(135deg,#ccc,#ddd)' : undefined, color:(!bookingDate || !bookingSlot) ? '#999' : undefined, borderRadius:'14px', border:'none', fontFamily:'var(--font-mono)', fontSize:'0.7rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, cursor:(!bookingDate || !bookingSlot) ? 'not-allowed' : 'pointer', transition:'all 0.4s cubic-bezier(0.22,1,0.36,1)', boxShadow:(!bookingDate || !bookingSlot) ? 'none' : undefined }}>{bookingLoading ? 'Booking...' : 'Book Lesson'}</button>
                  </div>
                  <div className="dash-anim dash-d1 dash-card-premium">
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${SKY_BLUE},${GOLD_BRIGHT},${SKY_BLUE})`, backgroundSize:'200% 100%', animation:'dashShimmer 5s linear infinite' }} />
                    <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.15rem', color:DARK, fontWeight:700, marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
                      <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'linear-gradient(135deg,rgba(1,69,168,0.08),rgba(1,69,168,0.03))', display:'flex', alignItems:'center', justifyContent:'center' }}>{I.book}</div>
                      My Bookings
                    </h3>
                    {bookings.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'2.5rem 1rem' }}>
                        <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
                        <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#94A3B8' }}>No bookings yet. Schedule your first lesson!</p>
                      </div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', maxHeight:'400px', overflowY:'auto' }}>
                        {upcomingBookings.length > 0 && <>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#94A3B8', fontWeight:600, margin:'0.25rem 0' }}>Upcoming</p>
                          {upcomingBookings.map(b => {
                            const slot = TIME_SLOTS.find(s => s.id === b.timeSlot)
                            return (
                              <div key={b._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.85rem 1rem', background:'linear-gradient(135deg,rgba(34,197,94,0.04),rgba(34,197,94,0.01))', borderRadius:'14px', border:'1px solid rgba(34,197,94,0.1)' }}>
                                <div>
                                  <p style={{ fontFamily:'var(--font-body)', fontSize:'0.9rem', color:DARK, fontWeight:600, margin:0 }}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</p>
                                  <p style={{ fontFamily:'var(--font-body)', fontSize:'0.78rem', color:'#94A3B8', margin:'0.15rem 0 0' }}>{slot?.time || b.timeSlot}</p>
                                </div>
                                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                                  <span style={{ padding:'0.25rem 0.7rem', background:'linear-gradient(135deg,rgba(34,197,94,0.12),rgba(34,197,94,0.06))', color:'#16A34A', borderRadius:'999px', fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700 }}>Scheduled</span>
                                  <button onClick={() => handleCancelBooking(b._id)} style={{ background:'none', border:'none', color:'#DC2626', cursor:'pointer', padding:'0.25rem', borderRadius:'6px' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
                                </div>
                              </div>
                            )
                          })}
                        </>}
                        {pastBookings.length > 0 && <>
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'#94A3B8', fontWeight:600, margin:'0.5rem 0 0.25rem' }}>Past</p>
                          {pastBookings.slice(0, 10).map(b => {
                            const slot = TIME_SLOTS.find(s => s.id === b.timeSlot)
                            return (
                              <div key={b._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.85rem 1rem', background:'#FAFBFD', borderRadius:'14px', border:'1px solid #F1F5F9', opacity:0.7 }}>
                                <div>
                                  <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#666', fontWeight:500, margin:0 }}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</p>
                                  <p style={{ fontFamily:'var(--font-body)', fontSize:'0.75rem', color:'#999', margin:'0.15rem 0 0' }}>{slot?.time || b.timeSlot}</p>
                                </div>
                                <span style={{ padding:'0.25rem 0.7rem', background:'rgba(136,153,170,0.08)', color:'#94A3B8', borderRadius:'999px', fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>Completed</span>
                              </div>
                            )
                          })}
                        </>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'course' && showCourse && (
                <div>
                  {activeMod && moduleStep > 0 ? (
                    <div>
                      <button onClick={() => { setActiveModule(null); setModuleStep(0); }} style={{ background:'none', border:'none', color:SKY_BLUE, fontFamily:'var(--font-mono)', fontSize:'0.65rem', letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg> Back to Modules
                      </button>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
                        {activeMod.lessons.map((_, i) => (<div key={i} style={{ flex:1, height:'4px', borderRadius:'2px', background:i < moduleStep-1 ? GOLD : i === moduleStep-1 ? SKY_BLUE : '#E8EDF4', transition:'all 0.3s' }} />))}
                        <div style={{ flex:1, height:'4px', borderRadius:'2px', background:moduleStep > activeMod.lessons.length ? GOLD : '#E8EDF4', transition:'all 0.3s' }} />
                      </div>
                      {moduleStep <= activeMod.lessons.length ? (
                        <div className="dash-anim" style={{ background:'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,255,255,1))', borderRadius:'20px', border:'1px solid rgba(226,235,245,0.6)', padding:'1.75rem', boxShadow:'0 1px 3px rgba(0,0,0,0.02), 0 8px 32px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden' }}>
                          <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${GOLD},${SKY_BLUE})` }} />
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.12em', textTransform:'uppercase', color:GOLD_DEEP, fontWeight:700, marginBottom:'0.5rem' }}>Lesson {moduleStep} of {activeMod.lessons.length}</p>
                          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.3rem', color:DARK, fontWeight:700, marginBottom:'1rem' }}>{activeMod.lessons[moduleStep-1].title}</h3>
                          <div className="dash-lesson"><p style={{ fontFamily:'var(--font-body)', fontSize:'0.92rem', color:'#333', lineHeight:1.8, margin:0 }}>{activeMod.lessons[moduleStep-1].content}</p></div>
                          <button onClick={() => setModuleStep(moduleStep+1)} style={{ marginTop:'1.25rem', padding:'0.85rem 2rem', background:`linear-gradient(135deg,${GOLD},${GOLD_BRIGHT})`, color:DARK, border:'none', borderRadius:'12px', fontFamily:'var(--font-mono)', fontSize:'0.7rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, cursor:'pointer', transition:'all 0.3s', boxShadow:'0 4px 16px rgba(253,188,1,0.2)' }}>{moduleStep < activeMod.lessons.length ? 'Next Lesson' : 'Take Quiz'}</button>
                        </div>
                      ) : (
                        <div className="dash-anim" style={{ background:'linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,255,255,1))', borderRadius:'20px', border:'1px solid rgba(226,235,245,0.6)', padding:'1.75rem', boxShadow:'0 1px 3px rgba(0,0,0,0.02), 0 8px 32px rgba(0,0,0,0.04)', position:'relative', overflow:'hidden' }}>
                          <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${GOLD},${SKY_BLUE})` }} />
                          <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.12em', textTransform:'uppercase', color:GOLD_DEEP, fontWeight:700, marginBottom:'0.5rem' }}>Module Quiz</p>
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
                              <button onClick={() => { let c=0; activeMod.quiz.forEach((q,qi) => { if(quizAnswers[qi]===q.correct) c++ }); handleCompleteQuiz(activeMod.id,c) }} disabled={Object.keys(quizAnswers).length < activeMod.quiz.length} style={{ padding:'0.85rem 2rem', background:Object.keys(quizAnswers).length < activeMod.quiz.length ? '#ccc' : `linear-gradient(135deg,${SKY_BLUE},#0a2a5e)`, color:'#fff', border:'none', borderRadius:'12px', fontFamily:'var(--font-mono)', fontSize:'0.7rem', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:700, cursor:Object.keys(quizAnswers).length < activeMod.quiz.length ? 'not-allowed' : 'pointer', transition:'all 0.3s', boxShadow:Object.keys(quizAnswers).length < activeMod.quiz.length ? 'none' : '0 4px 16px rgba(1,69,168,0.2)' }}>Submit Quiz</button>
                            </div>
                          ) : (
                            <div style={{ textAlign:'center', padding:'1.5rem 0' }}>
                              <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:quizScore >= 2 ? 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.2))' : 'linear-gradient(135deg,rgba(220,38,38,0.1),rgba(220,38,38,0.2))', border:`2px solid ${quizScore >= 2 ? '#22C55E' : '#DC2626'}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem' }}>
                                <span style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:800, color:quizScore >= 2 ? '#22C55E' : '#DC2626' }}>{quizScore}/{activeMod.quiz.length}</span>
                              </div>
                              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', color:DARK, fontWeight:700, marginBottom:'0.5rem' }}>{quizScore >= 2 ? 'Congratulations! Module Passed' : 'Not Passed'}</h3>
                              <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#94A3B8', marginBottom:'1.5rem' }}>{quizScore >= 2 ? 'You have successfully completed this module.' : 'You need at least 2 correct answers to pass.'}</p>
                              {quizScore < 2 && <button onClick={() => { setModuleStep(0); setQuizAnswers({}); setQuizSubmitted(false) }} style={{ padding:'0.7rem 1.5rem', background:SKY_BLUE, color:'#fff', border:'none', borderRadius:'10px', fontFamily:'var(--font-mono)', fontSize:'0.65rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, cursor:'pointer' }}>Review Lessons</button>}
                              {quizScore >= 2 && <button onClick={() => { setActiveModule(null); setModuleStep(0) }} style={{ padding:'0.7rem 1.5rem', background:GOLD, color:DARK, border:'none', borderRadius:'10px', fontFamily:'var(--font-mono)', fontSize:'0.65rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700, cursor:'pointer' }}>Back to Modules</button>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom:'1.5rem' }}>
                        <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.15rem', color:DARK, fontWeight:700, marginBottom:'0.5rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>{I.book} Online Driver Education</h3>
                        <p style={{ fontFamily:'var(--font-body)', fontSize:'0.85rem', color:'#94A3B8', margin:0 }}>Complete all 3 modules to finish your course.</p>
                        <div style={{ marginTop:'0.75rem', background:'#E8EDF4', borderRadius:'999px', height:'8px', overflow:'hidden' }}>
                          <div style={{ width:`${Math.round((completedModules.length/3)*100)}%`, height:'100%', background:`linear-gradient(90deg,${GOLD},${GOLD_BRIGHT})`, borderRadius:'999px', transition:'width 0.5s' }} />
                        </div>
                        <p style={{ fontFamily:'var(--font-mono)', fontSize:'0.55rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'#94A3B8', fontWeight:600, marginTop:'0.35rem' }}>{completedModules.length} of 3 modules completed</p>
                      </div>
                      <div className="dash-mod-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1.25rem' }}>
                        {COURSE_MODULES.map((mod, i) => {
                          const done = completedModules.includes(mod.id)
                          return (
                            <div key={mod.id} className="dash-mod" onClick={() => openModule(mod.id)}>
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
                                <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:done ? 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.2))' : `linear-gradient(135deg,rgba(1,69,168,0.08),rgba(253,188,1,0.08))`, border:`1.5px solid ${done ? '#22C55E' : '#E8EDF4'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  {done ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> : <span style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', fontWeight:800, color:SKY_BLUE }}>{i+1}</span>}
                                </div>
                                {done && <span style={{ padding:'0.2rem 0.5rem', background:'rgba(34,197,94,0.1)', color:'#22C55E', borderRadius:'999px', fontFamily:'var(--font-mono)', fontSize:'0.5rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:700 }}>Done</span>}
                              </div>
                              <h4 style={{ fontFamily:'var(--font-display)', fontSize:'1rem', color:DARK, fontWeight:700, marginBottom:'0.4rem' }}>{mod.title}</h4>
                              <p style={{ fontFamily:'var(--font-body)', fontSize:'0.8rem', color:'#94A3B8', margin:0, lineHeight:1.6 }}>{mod.description}</p>
                              <div style={{ marginTop:'1rem', display:'flex', alignItems:'center', gap:'0.4rem', color:done ? '#22C55E' : SKY_BLUE, fontFamily:'var(--font-mono)', fontSize:'0.6rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:700 }}>
                                {done ? 'Review Module' : 'Start Module'}
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </>
  )
}
