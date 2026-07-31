import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import { api } from '../api'
import { usePageMeta } from '../usePageMeta'

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
  { value: '1', label: 'Online Driver Ed — $39.99' },
  { value: '7', label: 'Duplicate Certificate 400C — $15' },
  { value: '2', label: 'Basic BTW (Package A - 2 Hours) — $210' },
  { value: '12', label: 'Basic BTW (Package D - 4 Hours) — $399' },
  { value: '3', label: 'Essential BTW (Package B - 6 Hours) — $599' },
  { value: '8', label: 'Ideal BTW + Online Ed (Package C - 6 Hours) — $615' },
  { value: '4', label: 'Premier BTW (Package E - 10 Hours) — $999' },
]

const STEPS = [
  { label: 'Personal', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { label: 'Course', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { label: 'Payment', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Confirm', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
]

export default function RegisterPage() {
  usePageMeta(
    'Register — A Precision Driving School | Online Drivers Ed & Lessons',
    'Register with A Precision Driving School for online drivers ed, behind-the-wheel training and DMV test prep in San Ramon, CA. 99% first-time pass rate.'
  )
  const [step, setStep] = useState(0)
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({
    firstName: '', middleName: '', lastName: '', dob: '', phone: '', email: '',
    address1: '', address2: '', city: '', state: 'California', zipCode: '',
    courseType: '1',
    username: '', password: '', confirmPassword: '',
    ccType: '', ccMonth: '', ccYear: '', ccNumber: '', ccCvv: '',
    sameBilling: true,
    billFirstName: '', billLastName: '', billAddress1: '', billAddress2: '',
    billCity: '', billState: 'California', billZip: '', billPhone: '', billEmail: '',
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
  }

  const handleSameBilling = (e) => {
    const checked = e.target.checked
    setForm(prev => ({
      ...prev,
      sameBilling: checked,
      ...(checked ? {
        billFirstName: prev.firstName, billLastName: prev.lastName,
        billAddress1: prev.address1, billAddress2: prev.address2,
        billCity: prev.city, billState: prev.state, billZip: prev.zipCode,
        billPhone: prev.phone, billEmail: prev.email,
      } : {
        billFirstName: '', billLastName: '', billAddress1: '', billAddress2: '',
        billCity: '', billState: 'California', billZip: '', billPhone: '', billEmail: '',
      }),
    }))
  }

  const handleSubmit = async () => {
    if (form.disclaimer !== '1') {
      alert('Please accept the disclaimer to proceed.')
      return
    }
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

      navigate('/dashboard')
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

  const next = () => setStep(s => Math.min(s + 1, 3))
  const prev = () => setStep(s => Math.max(s - 1, 0))

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    background: '#ffffff',
    border: '1.5px solid #D1DFEE',
    borderRadius: '10px',
    color: '#0a1628',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
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
          box-shadow: 0 0 0 3px rgba(1,69,168,0.1) !important;
        }
        .rw-input::placeholder { color: #A0B3C6; }
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
          background: #F8FAFD;
          border: 1px solid #E2EBF5;
          border-radius: var(--radius-lg);
          padding: clamp(1.5rem, 3vw, 2.5rem);
          animation: rwFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
          position: relative;
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
          color: SKY_BLUE;
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
        .rw-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .rw-form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .rw-form-grid-2fr1fr { display: grid; grid-template-columns: 2fr 1fr; gap: 0.75rem; }
        .rw-step-bar { display: flex; gap: 0; }
        @media (max-width: 768px) {
          .rw-form-grid, .rw-form-grid-3 { grid-template-columns: 1fr !important; }
          .rw-form-grid-2fr1fr { grid-template-columns: 1fr !important; }
          .rw-step-bar { gap: 0.25rem; }
          .rw-step-bar .rw-step-line { display: none !important; }
          .rw-step-bar .rw-step { padding: 0.4rem 0.3rem; }
        }
        @media (max-width: 480px) {
          .rw-step-bar { flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
          .rw-step-bar .rw-step { flex: 0 0 auto; min-width: 60px; padding: 0.5rem 0.4rem; }
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
            fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.45)',
            fontSize: 'clamp(0.85rem, 1.3vw, 1rem)', maxWidth: '36ch',
            marginInline: 'auto', lineHeight: 1.7,
          }}>Register and pay via credit card to get started today.</p>
        </div>
      </section>

      {/* ═══ Stepper + Form ═══ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: 'clamp(1.5rem, 4vw, 3rem) 0 4rem',
        marginTop: '-1rem',
      }}>
        <div className="container" style={{ maxWidth: '48rem', position: 'relative', zIndex: 1 }}>

          {/* Progress Steps */}
          <div className="rw-step-bar" style={{
            display: 'flex', justifyContent: 'center', marginBottom: '2rem',
            padding: '1.5rem 2rem', background: '#ffffff',
            border: '1px solid #E2EBF5', borderRadius: '14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}>
            {STEPS.map((s, i) => (
              <div key={s.label} className={`rw-step ${i === step ? 'rw-step-active' : ''} ${i < step ? 'rw-step-done' : ''}`}>
                {i < STEPS.length - 1 && <div className="rw-step-line" style={{ animation: i < step ? 'rwStepFill 0.5s ease both' : undefined }} />}
                <div className="rw-step-dot">
                  {i < step ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={i === step ? DARK : '#A0B3C6'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
                  )}
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em',
                  textTransform: 'uppercase', fontWeight: 600,
                  color: i <= step ? SKY_BLUE : '#A0B3C6',
                }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="rw-card">

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
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#8899aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Step 1 of 4</p>
                  </div>
                </div>

                <div className="rw-form-grid">
                  <Field label="First Name" required><input name="firstName" value={form.firstName} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                  <Field label="Middle Name"><input name="middleName" value={form.middleName} onChange={handleChange} className="rw-input" style={inputStyle} /></Field>
                  <Field label="Last Name" required><input name="lastName" value={form.lastName} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                  <Field label="Date of Birth" required><input name="dob" value={form.dob} onChange={handleChange} required placeholder="MM-DD-YYYY" className="rw-input" style={inputStyle} /></Field>
                  <Field label="Phone Number" required><input name="phone" value={form.phone} onChange={handleChange} required placeholder="999-999-9999" className="rw-input" style={inputStyle} /></Field>
                  <Field label="Email" required><input name="email" type="email" value={form.email} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                </div>

                <div className="rw-form-grid" style={{ marginTop: '1rem' }}>
                  <Field label="Address" required><input name="address1" value={form.address1} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                  <Field label="Apt / Suite"><input name="address2" value={form.address2} onChange={handleChange} className="rw-input" style={inputStyle} /></Field>
                  <Field label="City" required><input name="city" value={form.city} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                  <div className="rw-form-grid-2fr1fr">
                    <Field label="State" required>
                      <select name="state" value={form.state} onChange={handleChange} required className="rw-input rw-select" style={inputStyle}>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Zip" required><input name="zipCode" value={form.zipCode} onChange={handleChange} required maxLength={5} className="rw-input" style={inputStyle} /></Field>
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
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#8899aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Step 2 of 4</p>
                  </div>
                </div>

                <div style={{
                  background: '#ffffff', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-md)',
                  padding: '1.5rem', marginBottom: '1.5rem',
                }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#8899aa', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.75rem' }}>Selected Course</p>
                  {COURSE_TYPES.map(c => (
                    <label key={c.value} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem',
                      border: form.courseType === c.value ? `2px solid ${GOLD}` : '1.5px solid #E2EBF5',
                      borderRadius: '10px', cursor: 'pointer', marginBottom: '0.5rem',
                      background: form.courseType === c.value ? 'rgba(253,188,1,0.04)' : '#ffffff',
                      transition: 'all 0.25s ease',
                    }}>
                      <input type="radio" name="courseType" value={c.value} checked={form.courseType === c.value} onChange={handleChange} style={{ accentColor: GOLD, width: '18px', height: '18px' }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: DARK, fontWeight: 600 }}>{c.label}</span>
                    </label>
                  ))}
                </div>

                <div style={{
                  background: '#ffffff', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#8899aa', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Create Account</p>
                  <div className="rw-form-grid-3">
                    <Field label="Username" required><input name="username" value={form.username} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                    <Field label="Password" required><input name="password" type="password" value={form.password} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                    <Field label="Confirm Password" required><input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
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
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DARK, fontWeight: 700, margin: 0 }}>Payment Details</h2>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#8899aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Step 3 of 4</p>
                  </div>
                </div>

                <div style={{
                  background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                  textAlign: 'left'
                }}>
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>⚠️</span>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#B45309', fontWeight: 700, margin: '0 0 0.25rem 0' }}>Demo Mode Active</h4>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.78rem', color: '#D97706', margin: 0, lineHeight: 1.5 }}>
                      This system is in demonstration mode. Please do NOT input real credit card credentials. You may use simulated inputs to complete the registration. No payment is processed and no card info is stored.
                    </p>
                  </div>
                </div>

                <div style={{
                  background: '#ffffff', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-md)',
                  padding: '1.5rem', marginBottom: '1.25rem',
                }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#8899aa', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Card Information</p>
                  <div className="rw-form-grid">
                    <Field label="Card Type" required>
                      <select name="ccType" value={form.ccType} onChange={handleChange} required className="rw-input rw-select" style={inputStyle}>
                        <option value="">Select...</option>
                        <option value="Visa">Visa</option>
                        <option value="MasterCard">MasterCard</option>
                        <option value="Discover">Discover</option>
                        <option value="Amex">American Express</option>
                      </select>
                    </Field>
                    <Field label="Card Number" required><input name="ccNumber" value={form.ccNumber} onChange={handleChange} required maxLength={16} placeholder="XXXX XXXX XXXX XXXX" className="rw-input" style={inputStyle} /></Field>
                    <Field label="Exp Month" required>
                      <select name="ccMonth" value={form.ccMonth} onChange={handleChange} required className="rw-input rw-select" style={inputStyle}>
                        <option value="">Month</option>
                        {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Exp Year" required>
                      <select name="ccYear" value={form.ccYear} onChange={handleChange} required className="rw-input rw-select" style={inputStyle}>
                        <option value="">Year</option>
                        {Array.from({ length: 16 }, (_, i) => 26 + i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="CVV" required><input name="ccCvv" value={form.ccCvv} onChange={handleChange} required maxLength={4} placeholder="3-4 digits" className="rw-input" style={inputStyle} /></Field>
                  </div>
                </div>

                {/* Billing */}
                <div style={{
                  background: '#ffffff', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#8899aa', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>Billing Address</p>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.sameBilling} onChange={handleSameBilling} style={{ accentColor: SKY_BLUE, width: '16px', height: '16px' }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: SKY_BLUE, fontWeight: 600 }}>Same as mailing</span>
                    </label>
                  </div>
                  {!form.sameBilling && (
                    <div className="rw-form-grid">
                      <Field label="First Name" required><input name="billFirstName" value={form.billFirstName} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                      <Field label="Last Name" required><input name="billLastName" value={form.billLastName} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                      <Field label="Address" required><input name="billAddress1" value={form.billAddress1} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                      <Field label="City" required><input name="billCity" value={form.billCity} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                      <div className="rw-form-grid-2fr1fr">
                        <Field label="State" required>
                          <select name="billState" value={form.billState} onChange={handleChange} required className="rw-input rw-select" style={inputStyle}>
                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </Field>
                        <Field label="Zip" required><input name="billZip" value={form.billZip} onChange={handleChange} required maxLength={5} className="rw-input" style={inputStyle} /></Field>
                      </div>
                      <Field label="Phone" required><input name="billPhone" value={form.billPhone} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                      <Field label="Email" required><input name="billEmail" type="email" value={form.billEmail} onChange={handleChange} required className="rw-input" style={inputStyle} /></Field>
                    </div>
                  )}
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
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#8899aa', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Step 4 of 4</p>
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
                    <SumLine label="Course" value={COURSE_TYPES.find(c => c.value === form.courseType)?.label || '—'} />
                    <SumLine label="Username" value={form.username || '—'} />
                  </SummaryCard>
                  <SummaryCard title="Address">
                    <SumLine label="Street" value={form.address1 || '—'} />
                    <SumLine label="City" value={`${form.city}, ${form.state} ${form.zipCode}` || '—'} />
                  </SummaryCard>
                  <SummaryCard title="Payment">
                    <SumLine label="Card" value={form.ccType ? `${form.ccType} ****${form.ccNumber.slice(-4)}` : '—'} />
                    <SumLine label="Expires" value={form.ccMonth && form.ccYear ? `${form.ccMonth}/${form.ccYear}` : '—'} />
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
                </div>
              </div>
            )}

            {/* Navigation */}
            <div style={{
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

          </div>
        </div>
      </section>
    </>
  )
}

function Field({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{
        fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 700,
        color: '#364B6B', letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>{label}{required && <span style={{ color: '#B23B3B' }}> *</span>}</label>
      {children}
    </div>
  )
}

function SummaryCard({ title, children }) {
  return (
    <div style={{
      background: '#ffffff', border: '1.5px solid #E2EBF5', borderRadius: '10px',
      padding: '1rem 1.25rem',
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
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#8899aa' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: DARK, fontWeight: 600 }}>{value}</span>
    </div>
  )
}
