import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import { api, readableErrorMessage } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { usePageMeta } from '../usePageMeta'
import { consumeBookingReturn } from '../utils/bookingStorage'
import PasswordInput from '../components/PasswordInput'

const GOLD = '#FDBC01'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

function Label({ children }) {
  return <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#637892', fontWeight: 700, marginBottom: '0.45rem' }}>{children}</label>
}

export default function SignupPage() {
  usePageMeta('Create Account — A Precision Driving School', 'Create a student account to book driving lessons and manage your courses.')
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const requestedReturn = location.state?.from === '/cart' ? '/cart' : ''
  const returnPathRef = useRef('')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const finishSignup = () => {
    if (!returnPathRef.current) returnPathRef.current = requestedReturn || consumeBookingReturn() || '/dashboard'
    navigate(returnPathRef.current, { replace: true })
  }

  useEffect(() => {
    if (user) finishSignup()
    // The destination depends only on the initial route state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (user) return null

  const setField = (field) => (event) => setForm(current => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const firstName = form.firstName.trim()
    const lastName = form.lastName.trim()
    const email = form.email.trim().toLowerCase()
    const displayName = `${firstName} ${lastName}`.trim()

    if (!firstName || !lastName) return setError('Please enter your first and last name.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')

    setLoading(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, form.password)
      await updateProfile(credential.user, { displayName })
      try {
        await api.saveUser(credential.user.uid, {
          firstName,
          lastName,
          displayName,
          email,
          phone: form.phone.trim(),
          createdAt: new Date().toISOString(),
        })
      } catch (profileError) {
        // The Firebase account is valid even when a slow profile request needs a retry.
        console.warn('Student profile save will retry on next sign-in:', profileError)
      }
      finishSignup()
    } catch (signupError) {
      if (signupError?.code === 'auth/email-already-in-use') setError('An account already exists with this email. Please sign in instead.')
      else if (signupError?.code === 'auth/invalid-email') setError('Please enter a valid email address.')
      else if (signupError?.code === 'auth/weak-password') setError('Password must be at least 8 characters.')
      else setError(readableErrorMessage(signupError, 'We could not create your account. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.85rem 1rem', boxSizing: 'border-box',
    fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#1a2332',
    background: '#f8fafd', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', outline: 'none',
  }

  return (
    <>
      <style>{`
        .signup-section { padding: clamp(10rem, 15vw, 14rem) 0 5rem; min-height: 80vh; background: #F8FAFD; }
        .signup-input:focus { border-color: ${SKY_BLUE} !important; box-shadow: 0 0 0 3px rgba(1,69,168,.10) !important; background: #fff !important; }
        .signup-button { width: 100%; padding: .95rem; border: 0; border-radius: var(--radius-sm); background: linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT}); color: ${DARK}; font-family: var(--font-mono); font-weight: 800; font-size: .72rem; letter-spacing: .15em; text-transform: uppercase; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease; }
        .signup-button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(253,188,1,.3); }
        .signup-button:disabled { opacity: .6; cursor: not-allowed; }
        @media (max-width: 520px) { .signup-card { padding: 1.5rem !important; } .signup-fields { grid-template-columns: 1fr !important; } }
      `}</style>
      <section className="signup-section">
        <div className="container" style={{ maxWidth: '560px' }}>
          <div className="signup-card" style={{ background: '#fff', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-lg)', padding: '2.5rem', boxShadow: '0 8px 32px rgba(0,0,0,.06)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span style={{ display: 'inline-grid', placeItems: 'center', width: 48, height: 48, borderRadius: 16, color: SKY_BLUE, background: '#edf5ff', fontSize: '1.35rem', marginBottom: '.85rem' }}>✦</span>
              <h1 style={{ margin: 0, color: DARK, fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 2.6rem)' }}>Create your account</h1>
              <p style={{ margin: '.55rem 0 0', color: '#637892', fontSize: '.95rem' }}>Register once to book lessons and manage your driving course.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="signup-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><Label>First name</Label><input className="signup-input" required value={form.firstName} onChange={setField('firstName')} autoComplete="given-name" style={inputStyle} /></div>
                <div><Label>Last name</Label><input className="signup-input" required value={form.lastName} onChange={setField('lastName')} autoComplete="family-name" style={inputStyle} /></div>
              </div>
              <div style={{ marginTop: '1rem' }}><Label>Email address</Label><input className="signup-input" required type="email" value={form.email} onChange={setField('email')} autoComplete="email" placeholder="you@example.com" style={inputStyle} /></div>
              <div style={{ marginTop: '1rem' }}><Label>Phone number <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>(optional)</span></Label><input className="signup-input" type="tel" value={form.phone} onChange={setField('phone')} autoComplete="tel" placeholder="925-555-0123" style={inputStyle} /></div>
              <div className="signup-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div><Label>Password</Label><PasswordInput className="signup-input" required minLength="8" value={form.password} onChange={setField('password')} autoComplete="new-password" placeholder="At least 8 characters" style={inputStyle} /></div>
                <div><Label>Confirm password</Label><PasswordInput className="signup-input" required minLength="8" value={form.confirmPassword} onChange={setField('confirmPassword')} autoComplete="new-password" placeholder="Repeat password" style={inputStyle} /></div>
              </div>
              <p style={{ margin: '.75rem 0 1.25rem', color: '#637892', fontSize: '.78rem', lineHeight: 1.55 }}>Use at least 8 characters. Your details are protected and you can complete your profile later.</p>
              {error && <div role="alert" style={{ padding: '.8rem 1rem', marginBottom: '1.25rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', color: '#DC2626', fontSize: '.85rem' }}>{error}</div>}
              <button className="signup-button" type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</button>
            </form>
            <p style={{ margin: '1.5rem 0 0', textAlign: 'center', color: '#637892', fontSize: '.9rem' }}>Already have an account? <Link to="/login" style={{ color: SKY_BLUE, fontWeight: 700, textDecoration: 'none' }}>Sign in</Link></p>
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #E2EBF5', textAlign: 'center', fontSize: '.85rem', color: '#637892' }}>Looking for the 30-Hour Drivers Ed program? <Link to="/online-drivers-ed" style={{ color: SKY_BLUE, fontWeight: 700, textDecoration: 'none' }}>View Online Drivers Ed</Link></div>
          </div>
        </div>
      </section>
    </>
  )
}
