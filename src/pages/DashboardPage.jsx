import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, updateProfile } from 'firebase/auth'
import {
  doc, getDoc, setDoc, collection, addDoc, query, where, getDocs,
  deleteDoc, orderBy, updateDoc, increment, arrayUnion, serverTimestamp
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, db, storage } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

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
  {
    id: 'mod1', title: 'Traffic Signs & Signals',
    description: 'Learn to identify and understand all major traffic signs and signals.',
    lessons: [
      { title: 'Regulatory Signs', content: 'Regulatory signs tell you what to do. They are typically rectangular or square with black text on a white background. Stop signs are red octagons, yield signs are red and white triangles. Speed limit signs show the maximum legal speed in white rectangles with black numbers.' },
      { title: 'Warning Signs', content: 'Warning signs are diamond-shaped with a yellow background and black symbols. They alert you to potential hazards ahead such as curves, merges, school zones, and pedestrian crossings. Orange diamond signs indicate construction zones.' },
      { title: 'Traffic Signals', content: 'Traffic lights control the flow of traffic at intersections. Green means go, yellow means prepare to stop, red means stop. Green arrows indicate protected turns. Flashing red means treat as a stop sign; flashing yellow means slow down and proceed with caution.' },
    ],
    quiz: [
      { question: 'What shape is a standard stop sign?', options: ['Square', 'Triangle', 'Octagon', 'Circle'], correct: 2 },
      { question: 'A yellow diamond-shaped sign indicates:', options: ['Speed limit', 'Warning', 'Regulatory', 'Construction only'], correct: 1 },
      { question: 'A flashing yellow traffic light means:', options: ['Stop immediately', 'Proceed with caution', 'Turn left only', 'Speed up'], correct: 1 },
    ],
  },
  {
    id: 'mod2', title: 'Right of Way & Intersections',
    description: 'Master the rules of right of way at intersections and crosswalks.',
    lessons: [
      { title: 'Four-Way Stops', content: 'At a four-way stop, the first vehicle to arrive and come to a complete stop has the right of way. If two vehicles arrive simultaneously, the vehicle on the right goes first. If facing each other, the vehicle going straight has right of way over the one turning.' },
      { title: 'Roundabouts', content: 'When entering a roundabout, always yield to traffic already inside. Travel counterclockwise and use your turn signal when exiting. Do not stop inside the roundabout. Choose your lane before entering based on your intended exit.' },
      { title: 'Pedestrian Crosswalks', content: 'Always stop for pedestrians in marked crosswalks. In California, you must stop at least 15 feet from a crosswalk when a pedestrian is present. Yield to pedestrians at unmarked crosswalks as well. Watch for pedestrians when turning at intersections.' },
    ],
    quiz: [
      { question: 'At a four-way stop, who goes first?', options: ['The largest vehicle', 'The first to arrive and stop', 'The vehicle on the left', 'The vehicle going straight'], correct: 1 },
      { question: 'When entering a roundabout, you must:', options: ['Stop and wait for a gap', 'Yield to traffic already inside', 'Speed through quickly', 'Use your horn'], correct: 1 },
      { question: 'You must stop at least ___ feet from a crosswalk for a pedestrian.', options: ['5 feet', '10 feet', '15 feet', '20 feet'], correct: 2 },
    ],
  },
  {
    id: 'mod3', title: 'Defensive Driving & Safety',
    description: 'Develop defensive driving habits for a lifetime of safe driving.',
    lessons: [
      { title: 'Safe Following Distance', content: 'Maintain at least a 3-second following distance under normal conditions. In rain, double it to 6 seconds. At night or in fog, increase further. Count "one-thousand-one, one-thousand-two, one-thousand-three" after the car ahead passes a fixed object.' },
      { title: 'Blind Spots & Mirror Checks', content: 'Every vehicle has blind spots where other cars cannot be seen in mirrors. Before changing lanes, check your rearview mirror, side mirror, then look over your shoulder into the blind spot. Use the SMOG technique: Signal, Mirror, Over-the-shoulder, Go.' },
      { title: 'Adverse Weather Driving', content: 'Reduce speed in rain, fog, or ice. Turn on headlights in poor visibility. Avoid sudden braking or sharp turns. Increase following distance significantly. If visibility becomes extremely low, pull off the road to a safe location and turn on hazard lights.' },
    ],
    quiz: [
      { question: 'The recommended minimum following distance is:', options: ['1 second', '2 seconds', '3 seconds', '5 seconds'], correct: 2 },
      { question: 'What does SMOG stand for in lane changing?', options: ['Signal, Move, Obey, Go', 'Signal, Mirror, Over-shoulder, Go', 'Slow, Mirror, Obey, Go', 'Signal, Merge, Obey, Go'], correct: 1 },
      { question: 'In heavy rain, you should:', options: ['Maintain highway speed', 'Turn off headlights', 'Reduce speed and increase following distance', 'Use cruise control'], correct: 2 },
    ],
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [courseType, setCourseType] = useState('')
  const [editName, setEditName] = useState(false)
  const [editPhone, setEditPhone] = useState(false)
  const [editAddress, setEditAddress] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
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

  const showCourse = courseType === '1' || courseType === '8'

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const d = snap.data()
          setPhone(d.phone || '')
          setAddress(d.address || '')
          setCourseType(d.courseType || '')
          setCompletedModules(d.completedModules || [])
          if (d.displayName && !user.displayName) setDisplayName(d.displayName)
        }
        const q = query(collection(db, 'bookings'), where('userId', '==', user.uid), orderBy('date', 'desc'))
        const bSnap = await getDocs(q)
        setBookings(bSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch {}
      setLoading(false)
    }
    load()
  }, [user])

  const saveField = async (field, value) => {
    try {
      await setDoc(doc(db, 'users', user.uid), { [field]: value }, { merge: true })
      if (field === 'displayName') {
        await updateProfile(user, { displayName: value })
        setEditName(false)
      }
      if (field === 'phone') setEditPhone(false)
      if (field === 'address') setEditAddress(false)
      setMsg(`${field === 'displayName' ? 'Name' : field === 'phone' ? 'Phone' : 'Address'} updated!`)
      setTimeout(() => setMsg(''), 2000)
    } catch {
      setMsg('Failed to update.')
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      await updateProfile(user, { photoURL: url })
      await setDoc(doc(db, 'users', user.uid), { photoURL: url }, { merge: true })
      setMsg('Profile photo updated!')
      setTimeout(() => setMsg(''), 2000)
    } catch {
      setMsg('Failed to upload photo.')
    }
    setUploading(false)
  }

  const handleBookLesson = async () => {
    if (!bookingDate || !bookingSlot) {
      setMsg('Please select a date and time slot.')
      setTimeout(() => setMsg(''), 2000)
      return
    }
    setBookingLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const isPast = bookingDate < today
      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        date: bookingDate,
        timeSlot: bookingSlot,
        hours: 2,
        status: isPast ? 'completed' : 'scheduled',
        createdAt: serverTimestamp(),
      })
      const q = query(collection(db, 'bookings'), where('userId', '==', user.uid), orderBy('date', 'desc'))
      const bSnap = await getDocs(q)
      setBookings(bSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setBookingDate('')
      setBookingSlot('')
      setMsg('Lesson booked successfully!')
      setTimeout(() => setMsg(''), 2000)
    } catch {
      setMsg('Failed to book lesson.')
    }
    setBookingLoading(false)
  }

  const handleCancelBooking = async (bookingId) => {
    try {
      await deleteDoc(doc(db, 'bookings', bookingId))
      setBookings(prev => prev.filter(b => b.id !== bookingId))
      setMsg('Booking cancelled.')
      setTimeout(() => setMsg(''), 2000)
    } catch {
      setMsg('Failed to cancel booking.')
    }
  }

  const handleCompleteQuiz = async (moduleId, correctCount) => {
    const passed = correctCount >= 2
    setQuizScore(correctCount)
    setQuizSubmitted(true)
    if (passed && !completedModules.includes(moduleId)) {
      const updated = [...completedModules, moduleId]
      setCompletedModules(updated)
      await setDoc(doc(db, 'users', user.uid), { completedModules: updated }, { merge: true })
    }
  }

  const openModule = (moduleId) => {
    setActiveModule(moduleId)
    setModuleStep(0)
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizScore(0)
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const upcomingBookings = bookings.filter(b => b.date >= todayStr && b.status === 'scheduled')
  const pastBookings = bookings.filter(b => b.date < todayStr || b.status === 'completed')

  const completedLessonCount = bookings.filter(b => b.date < todayStr || b.status === 'completed').length
  const hoursCompleted = completedLessonCount * 2
  const totalHours = COURSE_HOURS[courseType] || 0
  const progress = showCourse
    ? Math.round((completedModules.length / 3) * 100)
    : totalHours > 0 ? Math.min(Math.round((hoursCompleted / totalHours) * 100), 100) : 0

  const initials = user?.displayName
    ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'
  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'
  const lastLogin = user?.metadata?.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  const cardStyle = {
    background: '#ffffff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid #E2EBF5',
    padding: '1.75rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
  }
  const labelStyle = { fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }
  const valueStyle = { fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#1a2332', fontWeight: 500 }
  const inputStyle = { flex: 1, padding: '0.6rem 0.8rem', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#1a2332', outline: 'none' }
  const editBtnStyle = { background: 'none', border: 'none', color: SKY_BLUE, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700 }
  const saveBtnStyle = { padding: '0.6rem 1rem', background: SKY_BLUE, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700 }
  const cancelBtnStyle = { padding: '0.6rem 1rem', background: 'transparent', color: '#8899aa', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'bookings', label: 'Book Lessons' },
    ...(showCourse ? [{ id: 'course', label: 'Online Course' }] : []),
  ]

  const activeMod = COURSE_MODULES.find(m => m.id === activeModule)

  return (
    <>
      <style>{`
        @keyframes dashBgPan { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes dashGridSlide { from { background-position: 0 0; } to { background-position: 40px 40px; } }
        .dash-stat { transition: all 0.3s ease; }
        .dash-stat:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
        .dash-tab { padding: 0.75rem 1.5rem; background: transparent; border: none; border-bottom: 2px solid transparent; font-family: var(--font-mono); font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: #8899aa; cursor: pointer; transition: all 0.3s ease; font-weight: 600; }
        .dash-tab:hover { color: ${DARK}; }
        .dash-tab-active { color: ${SKY_BLUE}; border-bottom-color: ${GOLD}; font-weight: 700; }
        .dash-slot { padding: 1rem; border: 1.5px solid #E2EBF5; border-radius: var(--radius-md); text-align: center; cursor: pointer; transition: all 0.3s ease; background: #fff; }
        .dash-slot:hover { border-color: ${GOLD}; background: #FFFBF0; }
        .dash-slot-selected { border-color: ${GOLD}; background: linear-gradient(135deg, #FFFBF0, #FFF8E1); box-shadow: 0 4px 16px rgba(253,188,1,0.15); }
        .dash-module-card { background: #fff; border: 1px solid #E2EBF5; border-radius: var(--radius-lg); padding: 1.5rem; cursor: pointer; transition: all 0.3s ease; }
        .dash-module-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); border-color: ${GOLD}; }
        .dash-lesson-card { background: #f8fafd; border: 1px solid #f0f2f5; border-radius: var(--radius-md); padding: 1.25rem; }
        .dash-quiz-option { padding: 0.85rem 1rem; border: 1.5px solid #E2EBF5; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.3s ease; font-family: var(--font-body); font-size: 0.9rem; color: #1a2332; background: #fff; text-align: left; width: 100%; }
        .dash-quiz-option:hover { border-color: ${SKY_BLUE}; background: #f0f6ff; }
        .dash-quiz-option-quizselected { border-color: ${SKY_BLUE}; background: #EBF5FF; }
        .dash-quiz-option-correct { border-color: #22C55E; background: #F0FDF4; }
        .dash-quiz-option-wrong { border-color: #DC2626; background: #FEF2F2; }
        @media (max-width: 900px) {
          .dash-hero { padding-top: 14rem !important; padding-bottom: 3rem !important; min-height: auto !important; }
          .dash-grid { grid-template-columns: 1fr !important; }
          .dash-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-tabs { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .dash-slot-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .dash-module-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .dash-slot-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <section className="dash-hero" style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #0a2a5e 25%, ${DARK} 50%, #0c2040 75%, ${DARK} 100%)`,
        backgroundSize: '300% 300%', animation: 'dashBgPan 12s ease-in-out infinite',
        position: 'relative', overflow: 'hidden', paddingTop: '12rem', paddingBottom: '4rem', minHeight: '420px',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(253,188,1,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(253,188,1,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', animation: 'dashGridSlide 8s linear infinite', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <img src="/driving-logo.png" alt="A Precision Driving School" style={{ height: 'clamp(70px, 10vw, 120px)', width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto 1rem', filter: 'drop-shadow(0 8px 40px rgba(255,255,255,0.85)) drop-shadow(0 0 35px rgba(255,255,255,0.6))' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
            <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD_DEEP, fontWeight: 700 }}>My Dashboard</span>
            <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#ffffff', lineHeight: 1.15, fontWeight: 800, marginBottom: '0.75rem' }}>
            Welcome{user?.displayName ? `, ${user.displayName}` : ''}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(0.85rem, 1.4vw, 1rem)', maxWidth: '50ch', marginInline: 'auto', lineHeight: 1.7 }}>
            {user?.email}
          </p>
        </div>
      </section>

      <section style={{ background: '#F8FAFD', padding: 'clamp(2rem, 5vw, 4rem) 0', marginTop: '-1rem' }}>
        <div className="container" style={{ maxWidth: '72rem', position: 'relative', zIndex: 1 }}>

          <div className="dash-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { num: bookings.length || '0', label: 'Lessons Booked', color: SKY_BLUE },
              { num: `${hoursCompleted}h`, label: 'Hours Completed', color: GOLD },
              { num: `${progress}%`, label: 'Progress', color: '#22C55E' },
              { num: 'Active', label: 'Account Status', color: SKY_BLUE },
            ].map((s) => (
              <div key={s.label} className="dash-stat" style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid #E2EBF5', textAlign: 'center', padding: '1.25rem 0.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '0.25rem' }}>{s.num}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="dash-tabs" style={{ display: 'flex', borderBottom: '1px solid #E2EBF5', marginBottom: '1.5rem', gap: 0, overflowX: 'auto' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`dash-tab ${activeTab === t.id ? 'dash-tab-active' : ''}`}>
                {t.label}
              </button>
            ))}
          </div>

          {msg && (
            <div style={{ padding: '0.75rem 1rem', background: msg.includes('Failed') ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${msg.includes('Failed') ? '#FECACA' : '#BBF7D0'}`, borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: msg.includes('Failed') ? '#DC2626' : '#16A34A', transition: 'all 0.3s ease' }}>
              {msg}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={cardStyle}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Profile
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafd', borderRadius: 'var(--radius-md)', border: '1px solid #f0f2f5' }}>
                  <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: '#fff', boxShadow: '0 4px 16px rgba(1,69,168,0.25)' }}>
                        {initials}
                      </div>
                    )}
                    <label style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '26px', height: '26px', borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.2s ease' }} title="Upload photo">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: DARK, margin: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || 'Student'}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#8899aa', margin: '0.15rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                    {uploading && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: GOLD_DEEP, margin: '0.25rem 0 0', fontWeight: 600 }}>Uploading...</p>}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Full Name</label>
                  {editName ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
                      <button onClick={() => saveField('displayName', displayName)} style={saveBtnStyle}>Save</button>
                      <button onClick={() => setEditName(false)} style={cancelBtnStyle}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={valueStyle}>{user?.displayName || 'Not set'}</span>
                      <button onClick={() => setEditName(true)} style={editBtnStyle}>Edit</button>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Email</label>
                  <span style={valueStyle}>{user?.email}</span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Phone</label>
                  {editPhone ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(925) 000-0000" style={inputStyle} />
                      <button onClick={() => saveField('phone', phone)} style={saveBtnStyle}>Save</button>
                      <button onClick={() => setEditPhone(false)} style={cancelBtnStyle}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={valueStyle}>{phone || 'Not set'}</span>
                      <button onClick={() => setEditPhone(true)} style={editBtnStyle}>{phone ? 'Edit' : 'Add'}</button>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Address</label>
                  {editAddress ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="San Ramon, CA" style={inputStyle} />
                      <button onClick={() => saveField('address', address)} style={saveBtnStyle}>Save</button>
                      <button onClick={() => setEditAddress(false)} style={cancelBtnStyle}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={valueStyle}>{address || 'Not set'}</span>
                      <button onClick={() => setEditAddress(true)} style={editBtnStyle}>{address ? 'Edit' : 'Add'}</button>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={cardStyle}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    My Enrollments
                  </h3>
                  <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                    {courseType ? (
                      <>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.2))', border: '1.5px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: DARK, fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                          {COURSE_MAP[courseType] || 'Special Package / Course'}
                        </p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#22C55E', fontWeight: 700, marginBottom: '1.25rem' }}>Active Enrollment</p>
                        <a href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: SKY_BLUE, color: '#fff', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                          Contact Instructor
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </a>
                      </>
                    ) : (
                      <>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(1,69,168,0.06), rgba(253,188,1,0.06))', border: '1.5px solid #E2EBF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8899aa" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#8899aa', marginBottom: '1rem' }}>No active enrollments yet</p>
                        <a href="/schedule" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: DARK, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                          Browse Packages
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div style={cardStyle}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Account Info
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #f0f2f5' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600 }}>Member Since</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#1a2332', fontWeight: 500 }}>{memberSince}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #f0f2f5' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600 }}>Last Login</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#1a2332', fontWeight: 500 }}>{lastLogin}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600 }}>Provider</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#1a2332', fontWeight: 500 }}>{user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ ...cardStyle, textAlign: 'center' }}>
                  <button onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 2rem', background: 'transparent', color: '#DC2626', border: '1.5px solid #FECACA', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="dash-grid">
              <div style={cardStyle}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Schedule a Lesson
                </h3>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>Select Date</label>
                  <input type="date" min={todayStr} value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} style={{ width: '100%', padding: '0.7rem 0.8rem', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#1a2332', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Select Time Slot</label>
                  <div className="dash-slot-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.4rem' }}>
                    {TIME_SLOTS.map(slot => (
                      <div key={slot.id} onClick={() => setBookingSlot(slot.id)} className={`dash-slot ${bookingSlot === slot.id ? 'dash-slot-selected' : ''}`}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: bookingSlot === slot.id ? GOLD_DEEP : DARK, fontWeight: 700, marginBottom: '0.2rem' }}>{slot.label}</div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#8899aa', marginBottom: '0.15rem' }}>{slot.time}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: bookingSlot === slot.id ? GOLD_DEEP : '#aaa', fontWeight: 600 }}>{slot.hours} Hours</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleBookLesson} disabled={bookingLoading || !bookingDate || !bookingSlot} style={{ width: '100%', padding: '0.85rem', background: (!bookingDate || !bookingSlot) ? '#ccc' : `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: DARK, border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: (!bookingDate || !bookingSlot) ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease' }}>
                  {bookingLoading ? 'Booking...' : 'Book Lesson'}
                </button>
              </div>

              <div style={cardStyle}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>
                  My Bookings
                </h3>

                {bookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(1,69,168,0.06), rgba(253,188,1,0.06))', border: '1.5px solid #E2EBF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8899aa" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /></svg>
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#8899aa' }}>No bookings yet. Schedule your first lesson!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {upcomingBookings.length > 0 && (
                      <>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, margin: '0.25rem 0' }}>Upcoming</p>
                        {upcomingBookings.map(b => {
                          const slot = TIME_SLOTS.find(s => s.id === b.timeSlot)
                          return (
                            <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#f8fafd', borderRadius: 'var(--radius-md)', border: '1px solid #f0f2f5' }}>
                              <div>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: DARK, fontWeight: 600, margin: 0 }}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#8899aa', margin: '0.15rem 0 0' }}>{slot?.time || b.timeSlot}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(34,197,94,0.1)', color: '#22C55E', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Scheduled</span>
                                <button onClick={() => handleCancelBooking(b.id)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '0.25rem' }} title="Cancel booking">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )}

                    {pastBookings.length > 0 && (
                      <>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, margin: '0.5rem 0 0.25rem' }}>Past</p>
                        {pastBookings.slice(0, 10).map(b => {
                          const slot = TIME_SLOTS.find(s => s.id === b.timeSlot)
                          return (
                            <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#fafbfc', borderRadius: 'var(--radius-md)', border: '1px solid #f0f2f5', opacity: 0.7 }}>
                              <div>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#666', fontWeight: 500, margin: 0 }}>{new Date(b.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#999', margin: '0.15rem 0 0' }}>{slot?.time || b.timeSlot}</p>
                              </div>
                              <span style={{ padding: '0.25rem 0.6rem', background: 'rgba(136,153,170,0.1)', color: '#8899aa', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Completed</span>
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'course' && showCourse && (
            <div>
              {activeMod && moduleStep > 0 ? (
                <div>
                  <button onClick={() => { setActiveModule(null); setModuleStep(0); }} style={{ background: 'none', border: 'none', color: SKY_BLUE, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back to Modules
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {activeMod.lessons.map((_, i) => (
                      <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < moduleStep - 1 ? GOLD : i === moduleStep - 1 ? SKY_BLUE : '#E2EBF5', transition: 'all 0.3s ease' }} />
                    ))}
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: moduleStep > activeMod.lessons.length ? GOLD : '#E2EBF5', transition: 'all 0.3s ease' }} />
                  </div>

                  {moduleStep <= activeMod.lessons.length ? (
                    <div style={cardStyle}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD_DEEP, fontWeight: 700, marginBottom: '0.5rem' }}>Lesson {moduleStep} of {activeMod.lessons.length}</p>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: DARK, fontWeight: 700, marginBottom: '1rem' }}>{activeMod.lessons[moduleStep - 1].title}</h3>
                      <div className="dash-lesson-card">
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', color: '#333', lineHeight: 1.8, margin: 0 }}>{activeMod.lessons[moduleStep - 1].content}</p>
                      </div>
                      <button onClick={() => setModuleStep(moduleStep + 1)} style={{ marginTop: '1.25rem', padding: '0.8rem 2rem', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: DARK, border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>
                        {moduleStep < activeMod.lessons.length ? 'Next Lesson' : 'Take Quiz'}
                      </button>
                    </div>
                  ) : (
                    <div style={cardStyle}>
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD_DEEP, fontWeight: 700, marginBottom: '0.5rem' }}>Module Quiz</p>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: DARK, fontWeight: 700, marginBottom: '1.5rem' }}>{activeMod.title}</h3>

                      {!quizSubmitted ? (
                        <div>
                          {activeMod.quiz.map((q, qi) => (
                            <div key={qi} style={{ marginBottom: '1.5rem' }}>
                              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: DARK, fontWeight: 600, marginBottom: '0.75rem' }}>{qi + 1}. {q.question}</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {q.options.map((opt, oi) => (
                                  <button key={oi} onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))} className={`dash-quiz-option ${quizAnswers[qi] === oi ? 'dash-quiz-option-quizselected' : ''}`}>
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              let correct = 0
                              activeMod.quiz.forEach((q, qi) => {
                                if (quizAnswers[qi] === q.correct) correct++
                              })
                              handleCompleteQuiz(activeMod.id, correct)
                            }}
                            disabled={Object.keys(quizAnswers).length < activeMod.quiz.length}
                            style={{
                              padding: '0.8rem 2rem',
                              background: Object.keys(quizAnswers).length < activeMod.quiz.length ? '#ccc' : `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`,
                              color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                              fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.12em',
                              textTransform: 'uppercase', fontWeight: 700,
                              cursor: Object.keys(quizAnswers).length < activeMod.quiz.length ? 'not-allowed' : 'pointer',
                            }}
                          >
                            Submit Quiz
                          </button>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: quizScore >= 2 ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.2))' : 'linear-gradient(135deg, rgba(220,38,38,0.1), rgba(220,38,38,0.2))', border: `2px solid ${quizScore >= 2 ? '#22C55E' : '#DC2626'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: quizScore >= 2 ? '#22C55E' : '#DC2626' }}>{quizScore}/{activeMod.quiz.length}</span>
                          </div>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: DARK, fontWeight: 700, marginBottom: '0.5rem' }}>
                            {quizScore >= 2 ? 'Congratulations! Module Passed' : 'Not Passed'}
                          </h3>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#8899aa', marginBottom: '1.5rem' }}>
                            {quizScore >= 2 ? 'You have successfully completed this module.' : 'You need at least 2 correct answers to pass. Review the lessons and try again.'}
                          </p>
                          {quizScore < 2 && (
                            <button onClick={() => { setModuleStep(0); setQuizAnswers({}); setQuizSubmitted(false); }} style={{ padding: '0.7rem 1.5rem', background: SKY_BLUE, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>
                              Review Lessons
                            </button>
                          )}
                          {quizScore >= 2 && (
                            <button onClick={() => { setActiveModule(null); setModuleStep(0); }} style={{ padding: '0.7rem 1.5rem', background: GOLD, color: DARK, border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>
                              Back to Modules
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>
                      Online Driver Education
                    </h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#8899aa', margin: 0 }}>Complete all 3 modules to finish your online driver ed course.</p>
                    <div style={{ marginTop: '0.75rem', background: '#E2EBF5', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round((completedModules.length / 3) * 100)}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT})`, borderRadius: '999px', transition: 'width 0.5s ease' }} />
                    </div>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, marginTop: '0.35rem' }}>{completedModules.length} of 3 modules completed</p>
                  </div>

                  <div className="dash-module-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                    {COURSE_MODULES.map((mod, i) => {
                      const isComplete = completedModules.includes(mod.id)
                      return (
                        <div key={mod.id} className="dash-module-card" onClick={() => openModule(mod.id)}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: isComplete ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.2))' : `linear-gradient(135deg, rgba(1,69,168,0.08), rgba(253,188,1,0.08))`, border: `1.5px solid ${isComplete ? '#22C55E' : '#E2EBF5'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isComplete ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                              ) : (
                                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: SKY_BLUE }}>{i + 1}</span>
                              )}
                            </div>
                            {isComplete && (
                              <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(34,197,94,0.1)', color: '#22C55E', borderRadius: '999px', fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>Done</span>
                            )}
                          </div>
                          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: DARK, fontWeight: 700, marginBottom: '0.4rem' }}>{mod.title}</h4>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#8899aa', margin: 0, lineHeight: 1.6 }}>{mod.description}</p>
                          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: isComplete ? '#22C55E' : SKY_BLUE, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>
                            {isComplete ? 'Review Module' : 'Start Module'}
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
      </section>
    </>
  )
}
