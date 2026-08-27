import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { api, readableErrorMessage } from '../api'
import { usePageMeta } from '../usePageMeta'
import PasswordInput from '../components/PasswordInput'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

function adminLoginErrorMessage(error) {
  const code = typeof error?.code === 'string' ? error.code : ''
  if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(code)) {
    return 'Incorrect email or password.'
  }
  if (code === 'auth/invalid-email') return 'Enter a valid email address.'
  if (code === 'auth/user-disabled') return 'This account has been disabled. Contact the site administrator.'
  if (code === 'auth/too-many-requests') return 'Too many sign-in attempts. Wait a few minutes and try again.'
  if (code === 'auth/network-request-failed') return 'The sign-in service could not be reached. Check your connection and try again.'

  return readableErrorMessage(error, 'Admin sign-in failed. Please try again.')
}

export default function AdminLoginPage() {
  usePageMeta('Admin Login — A Precision Driving School', 'Admin login for A Precision Driving School.')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, isAdmin, refreshProfile } = useAuth()

  useEffect(() => {
    if (user && isAdmin) navigate('/admin', { replace: true })
  }, [user, isAdmin, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      let profile = await api.getUser(cred.user.uid)
      if (!profile?.isAdmin) {
        await api.saveUser(cred.user.uid, {
          name: cred.user.displayName || 'Site Administrator',
          email: cred.user.email || email,
          photoURL: cred.user.photoURL || '',
          isAdmin: true,
        })
        profile = await refreshProfile(cred.user)
      } else {
        await refreshProfile(cred.user)
      }
      if (!profile?.isAdmin) {
        await signOut(auth)
        setError('This account does not have administrator access.')
        return
      }
      navigate('/admin', { replace: true })
    } catch (err) {
      if (auth.currentUser) await signOut(auth).catch(() => {})
      setError(adminLoginErrorMessage(err))
    } finally {
      setLoading(false)
    }
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
        .adml-input:focus {
          border-color: ${SKY_BLUE} !important;
          box-shadow: 0 0 0 3px rgba(1,69,168,0.1) !important;
          background: #ffffff !important;
        }
        .adml-btn-gold {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 0.9rem;
          background: linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT});
          color: ${DARK}; font-family: var(--font-mono); font-size: 0.72rem;
          font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
          border: none; border-radius: var(--radius-sm); cursor: pointer;
          transition: all 0.3s ease; text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .adml-btn-gold:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(253,188,1,0.3); }
        .adml-btn-gold:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0c2a5e 0%,#0145A8 50%,#082048 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', boxSizing: 'border-box' }}>
        <div style={{ height: '2.5px', width: '100%', background: `linear-gradient(90deg,transparent 5%,${GOLD} 20%,${GOLD_BRIGHT} 35%,#fff 50%,${GOLD_BRIGHT} 65%,${GOLD} 80%,transparent 95%)`, position: 'absolute', top: 0, left: 0 }} />

        <div style={{ width: '100%', maxWidth: '440px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DEEP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '2.5px solid #FDBC01', boxShadow: '0 0 28px rgba(253,188,1,0.4)' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={DARK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#fff', margin: 0, fontWeight: 800, lineHeight: 1.2, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Admin Panel</h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD_BRIGHT, margin: '0.4rem 0 0', fontWeight: 700, textShadow: '0 0 8px rgba(253,188,1,0.3)' }}>A Precision Driving School</p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(253,188,1,0.2)', padding: '2.5rem', boxShadow: '0 16px 64px rgba(0,0,0,0.4)' }}>
            {user && !isAdmin && !loading && (
              <div style={{ padding: '0.75rem 1rem', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#C2410C' }}>
                Signed in as {user.email}. Enter administrator credentials to continue.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, marginBottom: '0.4rem' }}>Admin Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="adml-input" style={inputStyle} placeholder="admin@example.com" autoComplete="username" />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, marginBottom: '0.4rem' }}>Password</label>
                <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} className="adml-input" style={inputStyle} placeholder="Enter your password" autoComplete="current-password" />
              </div>

              {error && (
                <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#DC2626' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="adml-btn-gold">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.75rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link to="/" style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.88)', textDecoration: 'none', fontWeight: 600 }}>
              ← Back to website
            </Link>
            <Link to="/login" style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: GOLD_BRIGHT, textDecoration: 'none', fontWeight: 600 }}>
              Student login
            </Link>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.88)' }}>
            First time?{' '}
            <Link to="/admin/setup" style={{ color: '#fff', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid rgba(253,188,1,0.5)' }}>
              Create admin account
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
