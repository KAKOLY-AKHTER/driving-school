import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { usePageMeta } from '../usePageMeta'
import PasswordInput from '../components/PasswordInput'

const loginErrorMessage = error => {
  if (error?.code === 'auth/invalid-email') return 'Please enter a valid email address.'
  if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(error?.code)) {
    return 'The email or password is incorrect.'
  }
  if (error?.code === 'auth/too-many-requests') return 'Too many attempts. Please wait and try again.'
  return 'Login failed. Please try again.'
}

export default function OnlineEducationLoginPage() {
  usePageMeta('Online Education Student Login — A Precision Driving School', 'Student login for the 30 Hour Drivers Ed curriculum.', { noIndex: true })
  const { user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate('/online-drivers-ed/course', { replace: true })
  }, [navigate, user])

  const handleLogin = async event => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      await signInWithEmailAndPassword(auth, email.trim(), password)
      navigate('/online-drivers-ed/course', { replace: true })
    } catch (loginError) {
      setError(loginErrorMessage(loginError))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email address first, then select Forgot Password.')
      return
    }
    setError('')
    setMessage('')
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setMessage('A password reset link has been sent to your email.')
    } catch (resetError) {
      setError(loginErrorMessage(resetError))
    }
  }

  return (
    <div className="oe-login-page">
      <style>{`
        .oe-login-page{min-height:100vh;padding:2.2rem 1rem;background:linear-gradient(145deg,#f8fbff 0%,#eef4fb 55%,#fff9e7 100%);color:#0a1628;font-family:var(--font-body)}
        .oe-login-shell{width:min(980px,100%);margin:auto;text-align:center}.oe-login-logo{display:block;width:190px;height:auto;margin:0 auto 1rem;filter:drop-shadow(0 10px 24px rgba(1,69,168,.14))}
        .oe-login-title{margin:.25rem 0;font-family:var(--font-display);font-size:clamp(1.7rem,4vw,2.55rem);color:#071b34}.oe-login-notice{max-width:800px;margin:1rem auto 2rem;color:#d52432;font-size:clamp(.92rem,2vw,1.08rem);line-height:1.7}.oe-login-notice span{display:block;margin-top:.35rem;color:#52657e}
        .oe-login-card{width:min(430px,100%);margin:auto;padding:clamp(1.4rem,4vw,2.35rem);background:#fff;border:1px solid #d9e4f0;border-top:5px solid #0145a8;border-radius:16px;box-shadow:0 20px 55px rgba(8,35,73,.12);text-align:left}.oe-login-card h1{margin:0 0 1.5rem;font-family:var(--font-display);font-size:1.8rem}
        .oe-field{display:grid;gap:.4rem;margin-bottom:1rem}.oe-field label{font-family:var(--font-mono);font-size:.64rem;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:#52657e}.oe-input{width:100%;box-sizing:border-box;padding:.88rem 1rem;border:1.5px solid #cbd9e8;border-radius:8px;background:#f8fbff;color:#0a1628;font:500 .92rem var(--font-body);outline:none}.oe-input:focus{border-color:#0145a8;box-shadow:0 0 0 3px rgba(1,69,168,.1);background:#fff}
        .oe-remember{display:flex;align-items:center;gap:.55rem;margin:.2rem 0 1.35rem;color:#334155;font-size:.86rem}.oe-remember input{width:17px;height:17px;accent-color:#0145a8}.oe-actions{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}.oe-login-btn,.oe-cancel-btn{min-height:47px;border-radius:8px;font:800 .68rem var(--font-mono);letter-spacing:.12em;text-transform:uppercase;cursor:pointer}.oe-login-btn{border:0;background:linear-gradient(135deg,#fdbc01,#ffd54f);color:#0145a8}.oe-cancel-btn{border:1.5px solid #0145a8;background:#fff;color:#0145a8}.oe-login-btn:disabled{opacity:.65;cursor:wait}
        .oe-login-links{display:flex;justify-content:center;flex-wrap:wrap;gap:.55rem 1.1rem;margin-top:1.35rem}.oe-link-btn,.oe-login-links a{padding:0;border:0;background:none;color:#0145a8;font:700 .82rem var(--font-body);text-decoration:none;cursor:pointer}.oe-alert{padding:.75rem .9rem;margin-bottom:1rem;border-radius:7px;font-size:.82rem;line-height:1.5}.oe-alert.error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c}.oe-alert.success{background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d}.oe-login-footer{margin:2.2rem auto 0;color:#637892;font-size:.76rem;line-height:1.6}
        @media(max-width:520px){.oe-login-page{padding-top:1.2rem}.oe-login-logo{width:150px}.oe-login-notice{margin-bottom:1.25rem}.oe-actions{grid-template-columns:1fr}}
      `}</style>
      <main className="oe-login-shell">
        <img className="oe-login-logo" src="/driving-logo.png" alt="A Precision Driving School" />
        <h2 className="oe-login-title">30 Hour Drivers Ed Curriculum</h2>
        <p className="oe-login-notice">
          Students registered before May 5, 2024 should contact the school for old-course access.
          <span>Otherwise, proceed with the new course below.</span>
        </p>

        <section className="oe-login-card" aria-labelledby="online-course-login-title">
          <h1 id="online-course-login-title">Please login</h1>
          <form onSubmit={handleLogin}>
            <div className="oe-field">
              <label htmlFor="online-course-email">Email address</label>
              <input id="online-course-email" className="oe-input" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
            </div>
            <div className="oe-field">
              <label htmlFor="online-course-password">Password</label>
              <PasswordInput id="online-course-password" className="oe-input" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
            </div>
            <label className="oe-remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> Remember me</label>
            {error && <div className="oe-alert error" role="alert">{error}</div>}
            {message && <div className="oe-alert success" role="status">{message}</div>}
            <div className="oe-actions">
              <button className="oe-login-btn" type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
              <button className="oe-cancel-btn" type="button" onClick={() => navigate('/')}>Cancel</button>
            </div>
          </form>
          <div className="oe-login-links">
            <button className="oe-link-btn" type="button" onClick={handleResetPassword}>Forgot Password?</button>
            <Link to="/online-drivers-ed/register?course=1">Register</Link>
          </div>
        </section>
        <p className="oe-login-footer">30 Hour Drivers Ed Curriculum · A Precision Driving School<br />DMV License #E4566</p>
      </main>
    </div>
  )
}
