import { cloneElement, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import { api } from '../api'
import { usePageMeta } from '../usePageMeta'
import { consumeBookingReturn } from '../utils/bookingStorage'
import PasswordInput from '../components/PasswordInput'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

const STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','District Of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois',
  'Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana',
  'Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York',
  'North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Puerto Rico','Rhode Island','South Carolina','South Dakota','Tennessee',
  'Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

const COURSE_TYPES = [
  { value: '1', name: 'Online Driver Ed', detail: '30-hour online course', price: '$39.99' },
  { value: '7', name: 'Duplicate Certificate 400C', detail: 'Replacement certificate', price: '$15' },
  { value: '2', name: 'Basic BTW', detail: 'Package A · 2 Hours', price: '$210' },
  { value: '12', name: 'Basic BTW', detail: 'Package D · 4 Hours', price: '$399' },
  { value: '3', name: 'Essential BTW', detail: 'Package B · 6 Hours', price: '$599' },
  { value: '8', name: 'Ideal BTW + Online Ed', detail: 'Package C · 6 Hours', price: '$615' },
  { value: '4', name: 'Premier BTW', detail: 'Package E · 10 Hours', price: '$999' },
]

const STEPS = [
  { label: 'Personal', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { label: 'Course', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { label: 'Enrollment', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Confirm', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
]

export default function RegisterPage() {
  usePageMeta(
    'Register — A Precision Driving School | Online Drivers Ed & Lessons',
    'Register with A Precision Driving School for online drivers ed, behind-the-wheel training and DMV test prep in San Ramon, CA. 99% first-time pass rate.'
  )
  const [step, setStep] = useState(0)
  const [regError, setRegError] = useState('')
  const [stepError, setStepError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [regLoading, setRegLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({
    firstName: '', middleName: '', lastName: '', dob: '', phone: '', email: '',
    address1: '', address2: '', city: '', state: 'California', zipCode: '',
    courseType: '1',
    username: '', password: '', confirmPassword: '',
    disclaimer: '',
  })

  useEffect(() => {
    if (location.state?.packageId) {
      const pkgIdStr = String(location.state.packageId)
      if (COURSE_TYPES.some(c => c.value === pkgIdStr)) {
        setForm(prev => ({ ...prev, courseType: pkgIdStr }))
      }
    }
  }, [location.state])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setFieldErrors(prev => {
      if (!prev[name]) return prev
      const nextErrors = { ...prev }
      delete nextErrors[name]
      return nextErrors
    })
    setStepError('')
    setRegError('')
  }

  const validateStep = (currentStep) => {
    const errors = {}
    if (currentStep === 0) {
      const requiredFields = {
        firstName: 'Enter the student’s first name.',
        lastName: 'Enter the student’s last name.',
        dob: 'Enter the student’s date of birth.',
        phone: 'Enter a phone number.',
        email: 'Enter an email address.',
        address1: 'Enter the home address.',
        city: 'Enter the city.',
        state: 'Select a state.',
        zipCode: 'Enter the ZIP code.',
      }
      Object.entries(requiredFields).forEach(([name, message]) => {
        if (!String(form[name] || '').trim()) errors[name] = message
      })
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.'
      if (form.phone && form.phone.replace(/\D/g, '').length < 10) errors.phone = 'Enter a valid phone number with at least 10 digits.'
      if (form.zipCode && !/^\d{5}$/.test(form.zipCode.trim())) errors.zipCode = 'Enter a valid 5-digit ZIP code.'
    }
    if (currentStep === 1) {
      if (form.username.trim().length < 3) errors.username = 'Username must contain at least 3 characters.'
      if (form.password.length < 6) errors.password = 'Password must contain at least 6 characters.'
      if (!form.confirmPassword) errors.confirmPassword = 'Confirm your password.'
      else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.'
    }
    if (currentStep === 3 && form.disclaimer !== '1') {
      errors.disclaimer = 'Accept the enrollment disclaimer to complete registration.'
    }
    setFieldErrors(errors)
    const firstInvalid = Object.keys(errors)[0]
    if (firstInvalid) {
      setStepError('Please review the highlighted information before continuing.')
      window.requestAnimationFrame(() => document.querySelector(`[name="${firstInvalid}"]`)?.focus())
      return false
    }
    setStepError('')
    return true
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return
    if (form.password !== form.confirmPassword) {
      setRegError('Passwords do not match.')
      return
    }
    setRegError('')
    setRegLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
      const user = userCredential.user

      const fullName = `${form.firstName} ${form.lastName}`.trim()

      // Update firebase authentication user profile
      await updateProfile(user, { displayName: fullName })

      const profileData = {
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        displayName: fullName,
        dob: form.dob,
        phone: form.phone,
        email: form.email,
        address: `${form.address1} ${form.address2}`.trim(),
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        courseType: form.courseType,
        completedModules: [],
        createdAt: new Date().toISOString(),
      }
      await api.saveUser(user.uid, profileData)

      const requestedReturn = location.state?.from === '/cart' ? '/cart' : ''
      navigate(requestedReturn || consumeBookingReturn() || '/dashboard', { replace: true })
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setRegError('An account with this email already exists.')
      else if (err.code === 'auth/weak-password') setRegError('Password must be at least 6 characters.')
      else if (err.code === 'auth/invalid-email') setRegError('Invalid email address.')
      else {
        console.error(err)
        setRegError('Registration failed. Please try again.')
      }
    }
    setRegLoading(false)
  }

  const next = () => {
    if (!validateStep(step)) return
    setStep(s => Math.min(s + 1, 3))
  }
  const prev = () => {
    setStepError('')
    setFieldErrors({})
    setStep(s => Math.max(s - 1, 0))
  }

  const inputStyle = {
    width: '100%',
    minHeight: '52px',
    padding: '0.9rem 1rem',
    background: '#ffffff',
    border: '1.5px solid #B9C8DA',
    borderRadius: '12px',
    color: '#0a1628',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    fontWeight: 500,
    outline: 'none',
    boxShadow: '0 1px 2px rgba(10,22,40,0.03)',
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease',
  }

  return (
    <>
      <style>{`
        @keyframes rwFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rwShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes rwStepFill {
          from { width: 0; }
        }
        @keyframes rwStarFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-18px) rotate(180deg); opacity: 0.45; }
        }
        @keyframes rwBgPan {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes rwOrbit {
          0% { transform: translate(0,0) scale(1); opacity: 0.10; }
          25% { transform: translate(30px,-20px) scale(1.05); opacity: 0.16; }
          50% { transform: translate(-10px,-40px) scale(1.1); opacity: 0.10; }
          75% { transform: translate(-30px,-10px) scale(1.05); opacity: 0.16; }
          100% { transform: translate(0,0) scale(1); opacity: 0.10; }
        }
        @keyframes rwGridSlide {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes rwLineGrow {
          0% { width: 0; opacity: 0; }
          50% { opacity: 0.15; }
          100% { width: 100%; opacity: 0; }
        }
        @keyframes rwRingPulse {
          0% { transform: scale(0.8); opacity: 0.2; border-color: rgba(253,188,1,0.15); }
          50% { transform: scale(1.2); opacity: 0.08; border-color: rgba(1,69,168,0.2); }
          100% { transform: scale(0.8); opacity: 0.2; border-color: rgba(253,188,1,0.15); }
        }
        .rw-input:focus {
          border-color: ${SKY_BLUE} !important;
          box-shadow: 0 0 0 4px rgba(1,69,168,0.11), 0 6px 18px rgba(10,22,40,0.06) !important;
        }
        .rw-input::placeholder { color: #64748B; }
        .rw-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%230145A8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L1 4h14z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-color: #ffffff;
        }
        .rw-step {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          z-index: 2;
        }
        .rw-step-dot {
          width: 40px; height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #D1DFEE;
          background: #ffffff;
          transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
          position: relative;
          z-index: 2;
        }
        .rw-step-active .rw-step-dot {
          border-color: ${GOLD};
          background: linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT});
          box-shadow: 0 4px 16px rgba(253,188,1,0.35);
          transform: scale(1.1);
        }
        .rw-step-done .rw-step-dot {
          border-color: ${SKY_BLUE};
          background: ${SKY_BLUE};
        }
        .rw-step-line {
          position: absolute;
          top: 20px;
          left: 50%;
          right: -50%;
          height: 2px;
          background: #D1DFEE;
          z-index: 1;
        }
        .rw-step:last-child .rw-step-line { display: none; }
        .rw-step-active .rw-step-line,
        .rw-step-done .rw-step-line {
          background: ${SKY_BLUE};
        }
        .rw-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.12;
          animation: rwOrbit 10s ease-in-out infinite;
        }
        .rw-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: rwStarFloat ease-in-out infinite;
        }
        .rw-hero-title { animation: rwFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both; }
        .rw-hero-sub { animation: rwFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        .rw-card {
          background: #ffffff;
          border: 1px solid #D9E4F0;
          border-radius: 22px;
          padding: clamp(1.5rem, 3vw, 3rem);
          animation: rwFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
          position: relative;
          box-shadow: 0 24px 70px rgba(8,35,73,0.11), 0 3px 12px rgba(8,35,73,0.05);
          overflow: hidden;
        }
        .rw-card::before {
          content: '';
          position: absolute;
          inset: 0 0 auto;
          height: 4px;
          background: linear-gradient(90deg, ${SKY_BLUE}, ${GOLD}, ${SKY_BLUE});
        }
        .rw-form-section {
          background:
            radial-gradient(circle at 12% 10%, rgba(1,69,168,0.08), transparent 26rem),
            radial-gradient(circle at 88% 82%, rgba(253,188,1,0.09), transparent 24rem),
            #F5F8FC;
        }
        .rw-progress-shell {
          position: relative;
          overflow: hidden;
        }
        .rw-progress-shell::before {
          content: '';
          position: absolute;
          inset: 0 0 auto;
          height: 3px;
          background: linear-gradient(90deg, ${SKY_BLUE}, ${GOLD});
        }
        .rw-course-options {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
        .rw-course-option {
          min-height: 92px;
        }
        .rw-course-option:hover {
          border-color: rgba(1,69,168,0.45) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(8,35,73,0.08);
        }
        .rw-trust-strip {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .rw-trust-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          min-height: 44px;
          padding: 0.65rem 0.75rem;
          color: #334155;
          background: #F7FAFD;
          border: 1px solid #DFE8F2;
          border-radius: 10px;
          font-family: var(--font-body);
          font-size: 0.75rem;
          font-weight: 700;
          text-align: center;
        }
        .rw-cta-gold {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 0.9rem 2.5rem;
          background: linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT});
          color: ${DARK};
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 4px 16px rgba(253,188,1,0.3);
        }
        .rw-cta-gold:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(253,188,1,0.4);
        }
        .rw-cta-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.9rem 2rem;
          background: transparent;
          color: ${SKY_BLUE};
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 700;
          border: 1.5px solid rgba(1,69,168,0.2);
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .rw-cta-ghost:hover {
          border-color: ${SKY_BLUE};
          background: rgba(1,69,168,0.04);
        }
        .rw-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.1rem; }
        .rw-form-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.1rem; }
        .rw-form-grid-2fr1fr { display: grid; grid-template-columns: 2fr 1fr; gap: 0.75rem; }
        .rw-step-bar { display: flex; gap: 0; }
        @media (max-width: 768px) {
          .rw-form-grid, .rw-form-grid-3 { grid-template-columns: 1fr !important; }
          .rw-form-grid-2fr1fr { grid-template-columns: 1fr !important; }
          .rw-course-options { grid-template-columns: 1fr; }
          .rw-trust-strip { grid-template-columns: 1fr; }
          .rw-step-bar { gap: 0.25rem; }
          .rw-step-bar .rw-step-line { display: none !important; }
          .rw-step-bar .rw-step { padding: 0.4rem 0.3rem; }
        }
        @media (max-width: 480px) {
          .rw-step-bar { flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
          .rw-step-bar .rw-step { flex: 0 0 auto; min-width: 60px; padding: 0.5rem 0.4rem; }
          .rw-card { border-radius: 16px; padding: 1.25rem; }
          .rw-registration-actions { align-items: stretch !important; gap: 0.75rem; }
          .rw-registration-actions > div { width: 100%; }
          .rw-registration-actions button { width: 100%; }
        }
        @media (max-width: 600px) {
          .rw-hero { padding-top: 14rem !important; }
        }
      `}</style>

      {/* ═══ Hero ═══ */}
      <section className="rw-hero" style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #0a2a5e 25%, ${DARK} 50%, #0c2040 75%, ${DARK} 100%)`,
        backgroundSize: '300% 300%',
        animation: 'rwBgPan 12s ease-in-out infinite',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: '12rem',
        paddingBottom: '6rem',
        minHeight: '600px',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(253,188,1,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(253,188,1,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'rwGridSlide 8s linear infinite',
          pointerEvents: 'none',
        }} />
        {[...Array(3)].map((_, i) => (
          <div key={`line-${i}`} style={{
            position: 'absolute',
            top: `${25 + i * 20}%`, left: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${i % 2 === 0 ? GOLD : SKY_BLUE}, transparent)`,
            animation: `rwLineGrow ${4 + i}s ease-in-out ${i * 1.5}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}
        {[...Array(2)].map((_, i) => (
          <div key={`ring-${i}`} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: `${200 + i * 160}px`, height: `${200 + i * 160}px`,
            border: '1px solid rgba(253,188,1,0.08)',
            borderRadius: '50%',
            transform: 'translate(-50%,-50%)',
            animation: `rwRingPulse ${5 + i * 2}s ease-in-out ${i * 0.8}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}
        <div className="rw-glow" style={{ top: '-100px', left: '10%', background: SKY_BLUE, width: '350px', height: '350px' }} />
        <div className="rw-glow" style={{ bottom: '-80px', right: '15%', background: GOLD, width: '280px', height: '280px', animationDelay: '3s' }} />
        <div className="rw-glow" style={{ top: '40%', left: '60%', background: SKY_BLUE, width: '200px', height: '200px', opacity: 0.06, animationDelay: '5s' }} />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="rw-particle" aria-hidden="true" style={{
            width: `${2 + i * 1}px`, height: `${2 + i * 1}px`,
            background: i % 3 === 0 ? GOLD : i % 3 === 1 ? 'rgba(1,69,168,0.5)' : 'rgba(255,255,255,0.12)',
            top: `${10 + i * 9}%`, left: `${8 + i * 10}%`,
            animationDuration: `${3 + i * 0.5}s`, animationDelay: `${i * 0.2}s`,
          }} />
        ))}
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <img src="/driving-logo.png" alt="A Precision Driving School" style={{
            height: 'clamp(100px, 15vw, 160px)', width: 'auto', objectFit: 'contain',
            display: 'block', margin: '0 auto 1.25rem',
            filter: 'drop-shadow(0 8px 40px rgba(255,255,255,0.85)) drop-shadow(0 0 35px rgba(255,255,255,0.6)) drop-shadow(0 0 60px rgba(255,255,255,0.3))',
          }} />
          <div className="rw-hero-title" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem',
          }}>
            <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.3em',
              textTransform: 'uppercase', color: GOLD_DEEP, fontWeight: 700,
            }}>Online Registration</span>
            <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          </div>
          <h1 className="rw-hero-title" style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            color: '#ffffff', lineHeight: 1.15, fontWeight: 800, marginBottom: '0.75rem',
          }}>
            30 Hour{' '}
            <span style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_BRIGHT} 50%, ${GOLD} 100%)`,
              backgroundSize: '200% auto', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              animation: 'rwShimmer 3s linear infinite',
            }}>Drivers Ed</span>
          </h1>
          <p className="rw-hero-sub" style={{
            fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.88)',
            fontSize: 'clamp(0.85rem, 1.3vw, 1rem)', maxWidth: '36ch',
            marginInline: 'auto', lineHeight: 1.7,
          }}>Create your account and complete your enrollment to get started today.</p>
        </div>
      </section>

      {/* ═══ Stepper + Form ═══ */}
      <section className="rw-form-section" style={{
        position: 'relative', overflow: 'hidden',
        padding: 'clamp(2rem, 5vw, 4.5rem) 0 5rem',
        marginTop: '-1rem',
      }}>
        <div className="container" style={{ maxWidth: '68rem', position: 'relative', zIndex: 1 }}>

          {/* Progress Steps */}
          <div className="rw-step-bar rw-progress-shell" style={{
            display: 'flex', justifyContent: 'center', marginBottom: '1.25rem',
            padding: '1.75rem 2.5rem 1.5rem', background: '#ffffff',
            border: '1px solid #D9E4F0', borderRadius: '18px',
            boxShadow: '0 12px 36px rgba(8,35,73,0.08)',
          }}>
            {STEPS.map((s, i) => (
              <div key={s.label} className={`rw-step ${i === step ? 'rw-step-active' : ''} ${i < step ? 'rw-step-done' : ''}`}>
                {i < STEPS.length - 1 && <div className="rw-step-line" style={{ animation: i < step ? 'rwStepFill 0.5s ease both' : undefined }} />}
                <div className="rw-step-dot">
                  {i < step ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={i === step ? DARK : '#64748B'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
                  )}
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em',
                  textTransform: 'uppercase', fontWeight: 600,
                  color: i <= step ? SKY_BLUE : '#64748B',
                }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="rw-card">

            {stepError && (
              <div role="alert" aria-live="assertive" style={{ display:'flex', alignItems:'flex-start', gap:'.7rem', margin:'0 0 1.35rem', padding:'.9rem 1rem', border:'1px solid #FECACA', borderRadius:'12px', background:'#FFF7F7', color:'#B91C1C', fontFamily:'var(--font-body)', fontSize:'.88rem', fontWeight:700, lineHeight:1.5 }}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink:0, marginTop:'1px' }}><circle cx="12" cy="12" r="9" /><path d="M12 8v5m0 3h.01" /></svg>
                {stepError}
              </div>
            )}

            {/* ═══ STEP 0 — Personal Info ═══ */}
            {step === 0 && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  marginBottom: '1.75rem',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(1,69,168,0.06), rgba(253,188,1,0.06))',
                    border: '1px solid rgba(1,69,168,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={STEPS[0].icon} />
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DARK, fontWeight: 700, margin: 0 }}>Personal Information</h2>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Step 1 of 4 · Tell us about the student</p>
                  </div>
                </div>

                <div className="rw-form-grid">
                  <Field label="First Name" required error={fieldErrors.firstName}><input name="firstName" value={form.firstName} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                  <Field label="Middle Name"><input name="middleName" value={form.middleName} onChange={handleChange} className="rw-input" style={inputStyle} /></Field>
                  <Field label="Last Name" required error={fieldErrors.lastName}><input name="lastName" value={form.lastName} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                  <Field label="Date of Birth" required error={fieldErrors.dob}><input name="dob" value={form.dob} onChange={handleChange} required placeholder="MM-DD-YYYY" className="rw-input" style={inputStyle} /></Field>
                  <Field label="Phone Number" required error={fieldErrors.phone}><input name="phone" value={form.phone} onChange={handleChange} required placeholder="999-999-9999" className="rw-input" style={inputStyle} /></Field>
                  <Field label="Email" required error={fieldErrors.email}><input name="email" type="email" value={form.email} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                </div>

                <div className="rw-form-grid" style={{ marginTop: '1rem' }}>
                  <Field label="Address" required error={fieldErrors.address1}><input name="address1" value={form.address1} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                  <Field label="Apt / Suite"><input name="address2" value={form.address2} onChange={handleChange} className="rw-input" style={inputStyle} /></Field>
                  <Field label="City" required error={fieldErrors.city}><input name="city" value={form.city} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                  <div className="rw-form-grid-2fr1fr">
                    <Field label="State" required error={fieldErrors.state}>
                      <select name="state" value={form.state} onChange={handleChange} required className="rw-input rw-select" style={inputStyle}>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Zip" required error={fieldErrors.zipCode}><input name="zipCode" value={form.zipCode} onChange={handleChange} required maxLength={5} inputMode="numeric" className="rw-input" style={inputStyle} /></Field>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 1 — Course Selection ═══ */}
            {step === 1 && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  marginBottom: '1.75rem',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(1,69,168,0.06), rgba(253,188,1,0.06))',
                    border: '1px solid rgba(1,69,168,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={STEPS[1].icon} />
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DARK, fontWeight: 700, margin: 0 }}>Course & Account</h2>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Step 2 of 4 · Choose the right program</p>
                  </div>
                </div>

                <div style={{
                  background: '#ffffff', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-md)',
                  padding: '1.5rem', marginBottom: '1.5rem',
                }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.9rem' }}>Select a course</p>
                  <div className="rw-course-options">
                  {COURSE_TYPES.map(c => (
                    <label key={c.value} className="rw-course-option" style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                      border: form.courseType === c.value ? `2px solid ${GOLD}` : '1.5px solid #E2EBF5',
                      borderRadius: '12px', cursor: 'pointer',
                      background: form.courseType === c.value ? 'linear-gradient(135deg, rgba(253,188,1,0.10), rgba(253,188,1,0.025))' : '#ffffff',
                      transition: 'all 0.25s ease', position: 'relative',
                    }}>
                      <input type="radio" name="courseType" value={c.value} checked={form.courseType === c.value} onChange={handleChange} style={{ accentColor: GOLD, width: '18px', height: '18px' }} />
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: DARK, fontWeight: 800, lineHeight: 1.35 }}>{c.name}</strong>
                        <span style={{ display: 'block', marginTop: '0.2rem', fontFamily: 'var(--font-body)', fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>{c.detail}</span>
                      </span>
                      <strong style={{ color: SKY_BLUE, fontSize: '0.92rem', whiteSpace: 'nowrap' }}>{c.price}</strong>
                    </label>
                  ))}
                  </div>
                </div>

                <div style={{
                  background: '#ffffff', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: '1rem' }}>Create your secure account</p>
                  <div className="rw-form-grid-3">
                    <Field label="Username" required error={fieldErrors.username}><input name="username" value={form.username} onChange={handleChange} required autoComplete="username" className="rw-input" style={inputStyle} /></Field>
                    <Field label="Password" required error={fieldErrors.password}><PasswordInput name="password" value={form.password} onChange={handleChange} required autoComplete="new-password" className="rw-input" style={inputStyle} /></Field>
                    <Field label="Confirm Password" required error={fieldErrors.confirmPassword}><PasswordInput name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required autoComplete="new-password" className="rw-input" style={inputStyle} /></Field>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 2 — Payment ═══ */}
            {step === 2 && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  marginBottom: '1.75rem',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(1,69,168,0.06), rgba(253,188,1,0.06))',
                    border: '1px solid rgba(1,69,168,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={STEPS[2].icon} />
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DARK, fontWeight: 700, margin: 0 }}>Enrollment Details</h2>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Step 3 of 4 · Enrollment status</p>
                  </div>
                </div>

                <div style={{
                  background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)',
                  padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                  textAlign: 'left'
                }}>
                  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#063B82', fontWeight: 700, margin: '0 0 0.35rem 0' }}>No payment details required</h4>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#365A84', margin: 0, lineHeight: 1.6 }}>
                      Online payment will be enabled after the secure payment provider is connected. You can complete your account registration now without entering any card information.
                    </p>
                  </div>
                </div>

                <div className="rw-form-grid">
                  <SummaryCard title="Selected program">
                    <SumLine label="Course" value={COURSE_TYPES.find(c => c.value === form.courseType)?.name || '—'} />
                    <SumLine label="Tuition" value={COURSE_TYPES.find(c => c.value === form.courseType)?.price || '—'} />
                  </SummaryCard>
                  <SummaryCard title="What happens next">
                    <SumLine label="Account" value="Created securely" />
                    <SumLine label="Access" value="Student dashboard" />
                  </SummaryCard>
                </div>

              </div>
            )}

            {/* ═══ STEP 3 — Confirm ═══ */}
            {step === 3 && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  marginBottom: '1.75rem',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, rgba(1,69,168,0.06), rgba(253,188,1,0.06))',
                    border: '1px solid rgba(1,69,168,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={STEPS[3].icon} />
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DARK, fontWeight: 700, margin: 0 }}>Review & Confirm</h2>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Step 4 of 4 · Verify before submitting</p>
                  </div>
                </div>

                {/* Summary cards */}
                <div className="rw-form-grid" style={{ marginBottom: '1.25rem' }}>
                  <SummaryCard title="Personal">
                    <SumLine label="Name" value={`${form.firstName} ${form.middleName} ${form.lastName}`.trim() || '—'} />
                    <SumLine label="Phone" value={form.phone || '—'} />
                    <SumLine label="Email" value={form.email || '—'} />
                    <SumLine label="DOB" value={form.dob || '—'} />
                  </SummaryCard>
                  <SummaryCard title="Course">
                    <SumLine label="Course" value={COURSE_TYPES.find(c => c.value === form.courseType)?.name || '—'} />
                    <SumLine label="Tuition" value={COURSE_TYPES.find(c => c.value === form.courseType)?.price || '—'} />
                    <SumLine label="Username" value={form.username || '—'} />
                  </SummaryCard>
                  <SummaryCard title="Address">
                    <SumLine label="Street" value={form.address1 || '—'} />
                    <SumLine label="City" value={form.city || form.state || form.zipCode ? `${form.city}, ${form.state} ${form.zipCode}` : '—'} />
                  </SummaryCard>
                  <SummaryCard title="Enrollment">
                    <SumLine label="Account" value="Ready to create" />
                    <SumLine label="Payment" value="Not required at registration" />
                  </SummaryCard>
                </div>

                {/* Disclaimer */}
                <div style={{
                  background: '#F0F4F8', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-md)',
                  padding: '1.25rem', marginBottom: '1rem',
                }}>
                  <p style={{ color: '#364B6B', fontSize: '0.82rem', lineHeight: 1.7, marginBottom: '1rem' }}>
                    Aprecision Driving School is not affiliated with the DMV, and the department shall not be responsible
                    for distributed materials, advertisements, etc.
                  </p>
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: SKY_BLUE, fontWeight: 600, fontSize: '0.85rem' }}>
                      <input type="radio" name="disclaimer" value="1" checked={form.disclaimer === '1'} onChange={handleChange} style={{ accentColor: SKY_BLUE, width: '18px', height: '18px' }} />
                      I Agree
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: SKY_BLUE, fontWeight: 600, fontSize: '0.85rem' }}>
                      <input type="radio" name="disclaimer" value="0" checked={form.disclaimer === '0'} onChange={handleChange} style={{ accentColor: SKY_BLUE, width: '18px', height: '18px' }} />
                      I Disagree
                    </label>
                  </div>
                  {fieldErrors.disclaimer && <p id="registration-disclaimer-error" role="alert" style={{ margin:'.8rem 0 0', color:'#B91C1C', fontFamily:'var(--font-body)', fontSize:'.78rem', fontWeight:700 }}>{fieldErrors.disclaimer}</p>}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="rw-registration-actions" style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E2EBF5',
            }}>
              <div>
                {step > 0 && (
                  <button type="button" onClick={prev} className="rw-cta-ghost">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                    Back
                  </button>
                )}
              </div>
              <div>
                {step < 3 ? (
                  <button type="button" onClick={next} className="rw-cta-gold">
                    Continue
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                ) : (
                  <>
                    {regError && (
                      <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#DC2626', width: '100%' }}>
                        {regError}
                      </div>
                    )}
                    <button type="button" onClick={handleSubmit} disabled={regLoading} className="rw-cta-gold" style={{ opacity: regLoading ? 0.6 : 1 }}>
                      {regLoading ? 'Creating Account...' : 'Register & Pay'}
                      {!regLoading && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="rw-trust-strip" aria-label="Registration assurances">
              {['Secure account creation', 'Privacy protected', 'No card details stored'].map((item) => (
                <div className="rw-trust-item" key={item}>
                  <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  {item}
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>
    </>
  )
}

function Field({ label, required, error, children }) {
  const controlId = children.props.id || `registration-${children.props.name}`
  const errorId = `${controlId}-error`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <label htmlFor={controlId} style={{
        fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 700,
        color: '#253B5C', letterSpacing: '0.07em', textTransform: 'uppercase',
      }}>{label}{required && <span style={{ color: '#B23B3B' }}> *</span>}</label>
      {cloneElement(children, {
        id: controlId,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': error ? errorId : children.props['aria-describedby'],
        style: error
          ? { ...children.props.style, borderColor:'#DC2626', background:'#FFF9F9', boxShadow:'0 0 0 3px rgba(220,38,38,.07)' }
          : children.props.style,
      })}
      {error && <span id={errorId} role="alert" style={{ color:'#B91C1C', fontFamily:'var(--font-body)', fontSize:'.74rem', fontWeight:700, lineHeight:1.4 }}>{error}</span>}
    </div>
  )
}

function SummaryCard({ title, children }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #ffffff, #F8FBFE)', border: '1.5px solid #D9E4F0', borderRadius: '12px',
      padding: '1.15rem 1.25rem', boxShadow: '0 6px 18px rgba(8,35,73,0.045)',
    }}>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: GOLD_DEEP,
        letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
        marginBottom: '0.6rem', margin: '0 0 0.6rem 0',
      }}>{title}</p>
      {children}
    </div>
  )
}

function SumLine({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.25rem 0' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: DARK, fontWeight: 700, textAlign: 'right' }}>{value}</span>
    </div>
  )
}
