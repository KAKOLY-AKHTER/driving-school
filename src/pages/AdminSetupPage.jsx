import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import { api } from '../api'
import { usePageMeta } from '../usePageMeta'

const GOLD = '#FDBC01'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

const DEFAULT_PHOTO = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDBC01"/><stop offset="1" stop-color="#C8960C"/></linearGradient></defs><rect width="200" height="200" fill="#0a1628"/><circle cx="100" cy="76" r="36" fill="url(#g)"/><path d="M100 202c-40 0-72-22-88-52 12-30 44-46 88-46s76 16 88 46c-16 30-48 52-88 52z" fill="url(#g)"/></svg>`
)

export default function AdminSetupPage() {
  usePageMeta('Admin Setup — A Precision Driving School', 'Create the admin account for A Precision Driving School.')
  const [name, setName] = useState('Site Administrator')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [photo, setPhoto] = useState(DEFAULT_PHOTO)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(false)
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: name, photoURL: photo })
      await api.saveUser(cred.user.uid, { name, email, photoURL: photo })
      await sendEmailVerification(cred.user)
      await signOut(auth)
      setCreated(true)
    } catch (err) {
      if (auth.currentUser) await signOut(auth).catch(() => {})
      if (err.code === 'auth/email-already-in-use') setError('An account with this email already exists. Go to Admin Login to sign in.')
      else if (err.code === 'auth/weak-password') setError('Password must be at least 6 characters.')
      else if (err.code === 'auth/invalid-email') setError('Invalid email address.')
      else setError('Setup failed. Please try again.')
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

  if (created) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0c2a5e 0%,#0145A8 50%,#082048 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', padding: '2.5rem', maxWidth: '440px', textAlign: 'center', boxShadow: '0 16px 64px rgba(0,0,0,0.4)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: DARK, margin: 0, fontWeight: 800 }}>Verify your admin email</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#334155', margin: '0.75rem 0 1.5rem', lineHeight: 1.6 }}>We sent a verification link to <strong>{email}</strong>. Open it, then sign in. Admin access is only granted to the verified address configured on the server.</p>
          <Link to="/admin/login" style={{ display: 'inline-flex', padding: '0.8rem 1.15rem', borderRadius: 'var(--radius-sm)', background: SKY_BLUE, color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.72rem' }}>Go to Admin Login</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .admst-input:focus {
          border-color: ${SKY_BLUE} !important;
          box-shadow: 0 0 0 3px rgba(1,69,168,0.1) !important;
          background: #ffffff !important;
        }
        .admst-btn-gold {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 0.9rem;
          background: linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT});
          color: ${DARK}; font-family: var(--font-mono); font-size: 0.72rem;
          font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;
          border: none; border-radius: var(--radius-sm); cursor: pointer;
          transition: all 0.3s ease; text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .admst-btn-gold:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(253,188,1,0.3); }
        .admst-btn-gold:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#0c2a5e 0%,#0145A8 50%,#082048 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', boxSizing: 'border-box' }}>
        <div style={{ height: '2.5px', width: '100%', background: `linear-gradient(90deg,transparent 5%,${GOLD} 20%,${GOLD_BRIGHT} 35%,#fff 50%,${GOLD_BRIGHT} 65%,${GOLD} 80%,transparent 95%)`, position: 'absolute', top: 0, left: 0 }} />

        <div style={{ width: '100%', maxWidth: '460px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#fff', margin: 0, fontWeight: 800, lineHeight: 1.2, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>Create Admin Account</h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD_BRIGHT, margin: '0.4rem 0 0', fontWeight: 700, textShadow: '0 0 8px rgba(253,188,1,0.3)' }}>A Precision Driving School</p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(253,188,1,0.2)', padding: '2.5rem', boxShadow: '0 16px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              {photo ? <img src={photo} alt="Admin" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #FDBC01', boxShadow: '0 0 20px rgba(253,188,1,0.35)', flexShrink: 0 }} /> : <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 800, color: DARK, border: '2.5px solid #FDBC01', flexShrink: 0 }}>A</div>}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#334155', margin: 0, lineHeight: 1.5 }}>This will be the administrator account. You can change name, photo and password anytime from the Admin Panel → Admin Account tab.</p>
            </div>

            {error && (
              <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#DC2626' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, marginBottom: '0.4rem' }}>Display Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="admst-input" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, marginBottom: '0.4rem' }}>Admin Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="admst-input" style={inputStyle} autoComplete="username" />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, marginBottom: '0.4rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="admst-input" style={{ ...inputStyle, paddingRight: '3rem' }} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'} title={showPass ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '0.4rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8899aa', transition: 'color 0.2s' }}>
                    {showPass ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, marginBottom: '0.4rem' }}>Profile Photo URL</label>
                <input type="text" value={photo} onChange={(e) => setPhoto(e.target.value)} className="admst-input" style={inputStyle} placeholder="https://... or leave as default avatar" />
              </div>

              <button type="submit" disabled={loading} className="admst-btn-gold">
                {loading ? 'Creating...' : 'Create Admin Account'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
            <Link to="/admin/login" style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: GOLD_BRIGHT, textDecoration: 'none', fontWeight: 600 }}>
              Already have an admin account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
