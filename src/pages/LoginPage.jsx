import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { usePageMeta } from '../usePageMeta'

const GOLD = '#FDBC01'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

export default function LoginPage() {
  usePageMeta('Login — A Precision Driving School', 'Log in to your A Precision Driving School student account to manage lessons, courses and payments.')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first to reset your password.')
      return
    }
    setError('')
    setSuccessMsg('')
    try {
      await sendPasswordResetEmail(auth, email)
      setSuccessMsg('Password reset link sent to your email!')
    } catch (err) {
      if (err.code === 'auth/user-not-found') setError('No account found with this email.')
      else if (err.code === 'auth/invalid-email') setError('Invalid email address.')
      else setError('Failed to send reset email. Please try again.')
    }
  }
  const { user } = useAuth()

  if (user) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/dashboard')
    } catch (err) {
      if (err.code === 'auth/user-not-found') setError('No account found with this email.')
      else if (err.code === 'auth/wrong-password') setError('Incorrect password.')
      else if (err.code === 'auth/invalid-email') setError('Invalid email address.')
      else setError('Login failed. Please try again.')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/dashboard')
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google login failed. Please try again.')
      }
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    color: '#1a2332',
    background: '#f8fafd',
    border: '1.5px solid #E2EBF5',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  }

  return (
    <>
      <style>{`
        .lg-form-section {
          padding-top: 10rem;
          background: #F8FAFD;
          min-height: 80vh;
        }
        .lg-input:focus {
          border-color: ${SKY_BLUE} !important;
          box-shadow: 0 0 0 3px rgba(1,69,168,0.1) !important;
          background: #ffffff !important;
        }
        .lg-btn-gold {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 0.9rem;
          background: linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT});
          color: ${DARK}; font-family: var(--font-mono); font-size: 0.72rem;
          font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
          border: none; border-radius: var(--radius-sm); cursor: pointer;
          transition: all 0.3s ease; text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .lg-btn-gold:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(253,188,1,0.3); }
        .lg-btn-gold:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .lg-btn-google {
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          width: 100%; padding: 0.85rem;
          background: #ffffff; color: #333; font-family: var(--font-body);
          font-size: 0.9rem; font-weight: 600;
          border: 1.5px solid #E2EBF5; border-radius: var(--radius-sm);
          cursor: pointer; transition: all 0.3s ease;
        }
        .lg-btn-google:hover { border-color: #bbb; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .lg-btn-google:disabled { opacity: 0.6; cursor: not-allowed; }
        .lg-divider {
          display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0;
          font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: #8899aa;
        }
        .lg-divider::before, .lg-divider::after {
          content: ''; flex: 1; height: 1px; background: #E2EBF5;
        }
        @media (max-width: 600px) {
          .lg-form-section { padding-top: 10rem !important; }
        }
      `}</style>

      <section className="lg-form-section" style={{
        background: '#F8FAFD',
        padding: 'clamp(10rem, 15vw, 14rem) 0 5rem',
        minHeight: '80vh',
      }}>
        <div className="container" style={{ maxWidth: '480px', position: 'relative', zIndex: 1 }}>
          <div style={{
            background: '#ffffff', borderRadius: 'var(--radius-lg)',
            border: '1px solid #E2EBF5', padding: '2.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          }}>
            <form onSubmit={handleEmailLogin}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, marginBottom: '0.4rem' }}>Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="lg-input" style={inputStyle} placeholder="you@example.com" />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600 }}>Password</label>
                  <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: SKY_BLUE, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700 }}>Forgot?</button>
                </div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="lg-input" style={inputStyle} placeholder="Enter your password" />
              </div>

              {error && (
                <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#DC2626' }}>
                  {error}
                </div>
              )}

              {successMsg && (
                <div style={{ padding: '0.75rem 1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#16A34A' }}>
                  {successMsg}
                </div>
              )}

              <button type="submit" disabled={loading} className="lg-btn-gold">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="lg-divider">or</div>

            <button onClick={handleGoogleLogin} disabled={loading} className="lg-btn-google">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p style={{ textAlign: 'center', marginTop: '2rem', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#8899aa' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: SKY_BLUE, fontWeight: 600, textDecoration: 'none' }}>Register now</Link>
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
