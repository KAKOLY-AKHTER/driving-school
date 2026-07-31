import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useSiteSettings } from '../useSiteSettings'

const NAV_LINKS = [
  { label: 'Home', href: '/', external: false },
  { label: 'Packages And Pricing', href: '/pricing', external: false },
  { label: 'Contact Us', href: '/contact', external: false },
  { label: 'Register For Online Drivers Ed', href: '/register', external: false },
  { label: 'Register For Driving Lessons', href: '/schedule', external: false },
]

export default function Nav() {
  const { user, isAdmin } = useAuth()
  const settings = useSiteSettings()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  // On non-home pages navbar always has solid dark bg
  const solidBg = !isHome || scrolled

  return (
    <header
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 50,
        backgroundColor: 'transparent',
        background: solidBg ? '#0145A8' : 'transparent',
        borderBottom: solidBg ? '1px solid rgba(253, 188, 1, 0.2)' : 'none',
        boxShadow: solidBg
          ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(253,188,1,0.08)'
          : 'none',
        transition: 'all 0.4s ease',
      }}
    >
      {/* Top Contact Bar */}
      <div style={{
        backgroundColor: '#fecb30',
        padding: '0.4rem 0',
        color: '#0a1628',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        display: scrolled ? 'none' : 'block'
      }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: '600' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#0a1628', transform: 'rotate(90deg)' }}>📞</span> {settings.phone}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
            <span style={{ color: '#0a1628', flexShrink: 0 }}>✉️</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{settings.email}</span>
          </div>
        </div>
      </div>

      <div className="container">
        <nav
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: scrolled ? '4.5rem' : '9rem',
            transition: 'height 0.3s ease',
          }}
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-label="A Precision Driving School">
            <img
              src="/driving-logo.png"
              alt="A Precision Driving School Logo"
              style={{
                height: scrolled ? '60px' : '140px',
                width: 'auto',
                objectFit: 'contain',
                transition: 'height 0.3s ease',
                filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.8))'
              }}
            />
          </Link>

          {/* Right Actions & Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Desktop Links */}
            <ul role="list" className="hidden lg:flex" style={{ gap: '0.5rem', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
              {NAV_LINKS.map(l => (
                <li key={l.label}>
                  {l.external ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="nav-link-desktop">
                      {l.label}
                    </a>
                  ) : (
                    <Link to={l.href} className={`nav-link-desktop ${location.pathname === l.href ? 'active' : ''}`}>
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {/* Auth - Desktop */}
            {user ? (
              <div style={{ position: 'relative' }} className="hidden lg:block">
                <button onClick={() => setProfileOpen(!profileOpen)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.45rem 1rem',
                  background: profileOpen ? 'rgba(253,188,1,0.18)' : 'rgba(253,188,1,0.12)',
                  color: '#FDBC01', border: '1px solid rgba(253,188,1,0.25)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                  letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700,
                  transition: 'all 0.3s ease',
                }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #0145A8, #0a2a5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff' }}>
                    {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
                  </div>
                  {user.displayName || user.email?.split('@')[0]}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                {profileOpen && (
                  <>
                    <div onClick={() => setProfileOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                      background: '#ffffff', borderRadius: 'var(--radius-md)',
                      border: '1px solid #E2EBF5', boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                      minWidth: '240px', zIndex: 99, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0f2f5' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: '#1a2332', fontWeight: 700, margin: 0 }}>{user.displayName || 'Student'}</p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: '#8899aa', margin: '0.2rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                      </div>
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#1a2332', textDecoration: 'none', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafd'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0145A8" strokeWidth="1.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        My Dashboard
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#C8960C', textDecoration: 'none', transition: 'background 0.15s', fontWeight: 600 }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#FFFBF0'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                          Admin Panel
                        </Link>
                      )}
                      <button onClick={async () => { setProfileOpen(false); await signOut(auth); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', width: '100%', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#DC2626', background: 'none', border: 'none', borderTop: '1px solid #f0f2f5', cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex" style={{ gap: '0.75rem', alignItems: 'center' }}>
                <Link to="/login" style={{
                  padding: '0.5rem 1.2rem',
                  background: 'transparent',
                  color: '#FDBC01',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(253,188,1,0.3)',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}>
                  Login
                </Link>
                <Link to="/register" style={{
                  padding: '0.5rem 1.2rem',
                  background: 'linear-gradient(135deg, #FDBC01, #FFD54F)',
                  color: '#0a1628',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                }}>
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              className="lg:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
              style={{
                width: '44px', height: '44px',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center',
                gap: '6px',
                color: '#ffffff',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.2s',
              }}
            >
              <span style={{ display: 'block', width: '24px', height: '2px', backgroundColor: 'currentColor', transition: 'all 0.3s ease', transform: open ? 'rotate(45deg) translate(5px, 6px)' : 'none' }} />
              <span style={{ display: 'block', width: '24px', height: '2px', backgroundColor: 'currentColor', transition: 'all 0.3s ease', opacity: open ? 0 : 1 }} />
              <span style={{ display: 'block', width: '24px', height: '2px', backgroundColor: 'currentColor', transition: 'all 0.3s ease', transform: open ? 'rotate(-45deg) translate(5px, -6px)' : 'none' }} />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--color-ink)',
          borderBottom: open ? '1px solid var(--color-ink-line)' : 'none',
          overflow: 'hidden',
          maxHeight: open ? '100vh' : 0,
          transition: 'max-height 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div className="container" style={{ paddingBlock: '2rem' }}>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {NAV_LINKS.map(l => (
              <li key={l.label}>
                {l.external ? (
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="nav-mobile-link"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    to={l.href}
                    onClick={() => setOpen(false)}
                    className="nav-mobile-link"
                    style={{
                      color: location.pathname === l.href ? 'var(--color-gold)' : undefined,
                    }}
                  >
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #0145A8, #0a2a5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#ffffff', margin: 0, fontWeight: 600 }}>{user.displayName || 'Student'}</p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                  </div>
                </div>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="nav-mobile-link" style={{ color: '#FDBC01' }}>My Dashboard</Link>
                {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="nav-mobile-link" style={{ color: '#C8960C', fontWeight: 700 }}>Admin Panel</Link>}
                <button onClick={async () => { setOpen(false); await signOut(auth); }} className="nav-mobile-link" style={{ color: '#DC2626', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%' }}>Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="nav-mobile-link" style={{ color: '#FDBC01', border: '1px solid rgba(253,188,1,0.3)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>Login</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="nav-mobile-link" style={{ background: 'linear-gradient(135deg, #FDBC01, #FFD54F)', color: '#0a1628', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontWeight: 700 }}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .nav-link-desktop {
          font-family: var(--font-body);
          font-size: 0.9rem;
          font-weight: 700;
          color: #ffffff;
          position: relative;
          padding: 0.4rem 0.7rem;
          border-radius: var(--radius-sm);
          transition: all 0.25s ease;
          white-space: nowrap;
          text-shadow: 0 1px 6px rgba(0,0,0,0.8);
        }
        .nav-link-desktop:hover {
          color: #0145A8;
          background-color: #FDBC01;
          text-shadow: none;
        }
        .nav-link-desktop.active {
          color: #FDBC01;
          text-shadow: 0 0 12px rgba(253,188,1,0.6);
        }

        @media (min-width: 1024px) {
          .lg\\:hidden { display: none !important; }
          .lg\\:flex { display: flex !important; }
        }
        .nav-mobile-link {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-paper);
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          transition: background 0.2s, color 0.2s;
          display: block;
        }
        .nav-mobile-link:hover {
          background: rgba(253,188,1,0.12);
          color: #FDBC01;
        }
      `}</style>
    </header>
  )
}