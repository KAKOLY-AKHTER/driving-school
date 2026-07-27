import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [editName, setEditName] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [editPhone, setEditPhone] = useState(false)
  const [editAddress, setEditAddress] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const d = snap.data()
          setPhone(d.phone || '')
          setAddress(d.address || '')
          if (d.displayName && !user.displayName) {
            setDisplayName(d.displayName)
          }
        }
      } catch {}
      setLoading(false)
    }
    fetchProfile()
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

  const cardStyle = {
    background: '#ffffff',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid #E2EBF5',
    padding: '1.75rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
    transition: 'all 0.3s ease',
  }

  const labelStyle = { fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }
  const valueStyle = { fontFamily: 'var(--font-body)', fontSize: '0.95rem', color: '#1a2332', fontWeight: 500 }
  const inputStyle = { flex: 1, padding: '0.6rem 0.8rem', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#1a2332', outline: 'none' }
  const editBtnStyle = { background: 'none', border: 'none', color: SKY_BLUE, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700 }
  const saveBtnStyle = { padding: '0.6rem 1rem', background: SKY_BLUE, color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700 }
  const cancelBtnStyle = { padding: '0.6rem 1rem', background: 'transparent', color: '#8899aa', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }

  const initials = user?.displayName ? user.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : user?.email?.[0]?.toUpperCase() || '?'
  const memberSince = user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'
  const lastLogin = user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'

  return (
    <>
      <style>{`
        @keyframes dashBgPan { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes dashGridSlide { from { background-position: 0 0; } to { background-position: 40px 40px; } }
        .dash-stat { transition: all 0.3s ease; }
        .dash-stat:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
        @media (max-width: 900px) {
          .dash-hero { padding-top: 14rem !important; padding-bottom: 3rem !important; min-height: auto !important; }
          .dash-grid { grid-template-columns: 1fr !important; }
          .dash-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Hero */}
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

      {/* Content */}
      <section style={{ background: '#F8FAFD', padding: 'clamp(2rem, 5vw, 4rem) 0', marginTop: '-1rem' }}>
        <div className="container" style={{ maxWidth: '72rem', position: 'relative', zIndex: 1 }}>

          {/* Stats */}
          <div className="dash-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { num: '—', label: 'Lessons Booked', color: SKY_BLUE },
              { num: '—', label: 'Hours Completed', color: GOLD },
              { num: '0%', label: 'Progress', color: '#22C55E' },
              { num: 'Active', label: 'Account Status', color: SKY_BLUE },
            ].map((s) => (
              <div key={s.label} className="dash-stat" style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid #E2EBF5', textAlign: 'center', padding: '1.25rem 0.75rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '0.25rem' }}>{s.num}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* Profile Card */}
            <div style={cardStyle}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Profile
              </h3>

              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafd', borderRadius: 'var(--radius-md)', border: '1px solid #f0f2f5' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `linear-gradient(135deg, ${SKY_BLUE}, #0a2a5e)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 4px 16px rgba(1,69,168,0.25)' }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: DARK, margin: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || 'Student'}</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#8899aa', margin: '0.15rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                </div>
              </div>

              {/* Name */}
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

              {/* Email (read-only) */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Email</label>
                <span style={valueStyle}>{user?.email}</span>
              </div>

              {/* Phone */}
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

              {/* Address */}
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

              {msg && (
                <div style={{ padding: '0.6rem 1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: '#16A34A' }}>{msg}</div>
              )}
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Enrollments */}
              <div style={cardStyle}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: DARK, fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  My Enrollments
                </h3>
                <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(1,69,168,0.06), rgba(253,188,1,0.06))', border: '1.5px solid #E2EBF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8899aa" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#8899aa', marginBottom: '1rem' }}>No active enrollments yet</p>
                  <a href="/schedule" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, color: DARK, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                    Browse Packages
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </a>
                </div>
              </div>

              {/* Account Info */}
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

              {/* Sign Out */}
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <button onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 2rem', background: 'transparent', color: '#DC2626', border: '1.5px solid #FECACA', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s ease' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                  Sign Out
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>
    </>
  )
}
