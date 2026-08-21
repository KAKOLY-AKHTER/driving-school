import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useSiteSettings } from '../useSiteSettings'

const NAV_LINKS = [
  { label: 'Home', href: '/', external: false },
  { label: 'Packages And Pricing', href: '/pricing', external: false },
  { label: 'Contact Us', href: '/contact', external: false },
  { label: 'Blog', href: '/blog', external: false },
  { label: 'Register For Online Drivers Ed', href: '/register', external: false },
  { label: 'Register For Driving Lessons', href: '/schedule', external: false },
]

export default function Nav() {
  const { user } = useAuth()
  const { count: cartCount } = useCart()
  const settings = useSiteSettings()
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const isOnlineCourse = location.pathname.startsWith('/online-drivers-ed')
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
        background: isOnlineCourse
          ? '#ffffff'
          : solidBg
            ? '#0145A8'
            : 'linear-gradient(180deg, rgba(3, 28, 66, 0.68) 0%, rgba(3, 28, 66, 0.28) 76%, rgba(3, 28, 66, 0) 100%)',
        borderBottom: isOnlineCourse ? '1px solid #e2e8f0' : 'none',
        boxShadow: isOnlineCourse ? '0 4px 18px rgba(15,40,75,0.08)' : solidBg
          ? '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(253,188,1,0.08)'
          : '0 8px 28px rgba(3,18,39,0.08)',
        transition: 'all 0.4s ease',
      }}
    >
      {/* Top Contact Bar */}
      <div style={{
        backgroundColor: '#fecb30',
        padding: '0.4rem 0',
        color: '#0a1628',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        display: isOnlineCourse || scrolled ? 'none' : 'block'
      }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: '600' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92z" />
            </svg>
            {settings.phone}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{settings.email}</span>
          </div>
        </div>
      </div>

      <div className="container">
        <nav
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: isOnlineCourse ? '7rem' : scrolled ? '5.25rem' : '9rem',
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
                height: isOnlineCourse ? '106px' : scrolled ? '92px' : '156px',
                width: 'auto',
                objectFit: 'contain',
                imageRendering: 'auto',
                backfaceVisibility: 'hidden',
                transition: 'height 0.3s ease, filter 0.3s ease',
                filter: isOnlineCourse
                  ? 'contrast(1.08) saturate(1.08) drop-shadow(0 5px 12px rgba(10,22,40,0.16))'
                  : scrolled
                    ? 'brightness(1.08) contrast(1.16) saturate(1.12) drop-shadow(0 0 8px rgba(255,255,255,0.72)) drop-shadow(0 5px 6px rgba(255,255,255,0.38)) drop-shadow(0 5px 8px rgba(7,21,41,0.32))'
                    : 'brightness(1.05) contrast(1.1) drop-shadow(0 0 11px rgba(255,255,255,0.72)) drop-shadow(0 6px 7px rgba(255,255,255,0.48)) drop-shadow(0 5px 10px rgba(10,22,40,0.28))'
              }}
            />
          </Link>

          {/* Right Actions & Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Desktop Links */}
            {!isOnlineCourse && <ul role="list" className="hidden lg:flex" style={{ gap: '0.5rem', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
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
            </ul>}

            {/* Auth - Desktop */}
            {user ? (
              <>
                <Link
                  to="/cart"
                  className={`hidden lg:flex nav-premium-action nav-cart-action ${isOnlineCourse ? 'on-light' : ''}`}
                  aria-label={cartCount > 0 ? `My cart, ${cartCount} ${cartCount === 1 ? 'course' : 'courses'}` : 'My cart, empty'}
                  title={cartCount > 0 ? `${cartCount} ${cartCount === 1 ? 'course' : 'courses'} in cart` : 'Cart is empty'}
                >
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
                  {cartCount > 0 && <span className="nav-cart-badge" aria-hidden="true">{cartCount}</span>}
                </Link>
                <div style={{ position: 'relative' }} className="hidden lg:block">
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`nav-premium-action nav-profile-action ${isOnlineCourse ? 'on-light' : ''}`}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  <div className="nav-profile-avatar">
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
              </>
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
                  border: '2px solid rgba(253,188,1,0.82)',
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
                display: isOnlineCourse ? 'none' : 'flex', flexDirection: 'column',
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
                <Link to="/cart" onClick={() => setOpen(false)} className="nav-mobile-link" style={{ color: '#FDBC01', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>My Cart</span>
                  {cartCount > 0 && <span style={{ background: 'linear-gradient(135deg,#F43F5E,#C8102E)', color: '#fff', border: '2px solid #fff', borderRadius: '999px', minWidth: '26px', height: '26px', padding: '0 7px', fontSize: '0.8rem', lineHeight: 1, fontFamily: 'var(--font-mono)', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(153,27,27,0.42)' }}>{cartCount}</span>}
                </Link>
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
        .nav-premium-action {
          position: relative;
          color: #ffd239;
          background: transparent;
          border: 2px solid rgba(253,188,1,0.82);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.16),
            0 8px 20px rgba(0,12,32,0.3),
            0 0 16px rgba(253,188,1,0.08);
          text-decoration: none;
          overflow: hidden;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
        }
        .nav-premium-action::before {
          content: '';
          position: absolute;
          top: 0;
          left: 12%;
          right: 12%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
          pointer-events: none;
        }
        .nav-premium-action:hover,
        .nav-premium-action[aria-expanded='true'] {
          transform: translateY(-2px);
          color: #ffe06a;
          border-color: rgba(255,216,74,0.95);
          background: transparent;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.22),
            0 11px 25px rgba(0,12,32,0.38),
            0 0 20px rgba(253,188,1,0.2);
        }
        .nav-premium-action:focus-visible {
          outline: 3px solid rgba(255,216,74,0.82);
          outline-offset: 3px;
        }
        .nav-premium-action.on-light {
          color: #9a6900;
          background: transparent;
          box-shadow: inset 0 1px 0 #ffffff, 0 8px 20px rgba(6,43,97,0.14);
        }
        .nav-premium-action.on-light:hover,
        .nav-premium-action.on-light[aria-expanded='true'] {
          color: #063e86;
          background: transparent;
        }
        .nav-cart-action {
          width: 48px;
          height: 48px;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 14px;
          overflow: visible;
        }
        .nav-cart-action svg {
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.22));
        }
        .nav-cart-badge {
          position: absolute;
          z-index: 3;
          top: -10px;
          right: -10px;
          min-width: 26px;
          height: 26px;
          padding: 0 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          background: linear-gradient(135deg, #f43f5e, #c8102e);
          border: 2px solid #ffffff;
          border-radius: 999px;
          box-shadow: 0 5px 14px rgba(127, 16, 35, 0.5), 0 0 0 1px rgba(220, 38, 38, 0.12);
          font-family: var(--font-mono);
          font-size: 0.78rem;
          font-weight: 800;
          line-height: 1;
          letter-spacing: 0;
          text-shadow: 0 1px 2px rgba(0,0,0,0.25);
          pointer-events: none;
        }
        .nav-profile-action {
          min-height: 48px;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.48rem 1.05rem;
          border-radius: 14px;
          cursor: pointer;
          font-family: var(--font-mono);
          font-size: 0.67rem;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          font-weight: 800;
          white-space: nowrap;
        }
        .nav-profile-avatar {
          position: relative;
          z-index: 1;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #ffffff;
          background: linear-gradient(145deg, #1970d4, #073d88);
          border: 1px solid rgba(255,255,255,0.35);
          box-shadow: 0 0 0 2px rgba(253,188,1,0.18), 0 4px 8px rgba(0,16,43,0.28);
          font-size: 0.72rem;
          font-weight: 800;
        }
        .oc-page, .cd-page, .cp-page, .pp-page, .dl-page {
          padding-top: 7rem !important;
          color: #0a223f;
          font-size: 16px;
          line-height: 1.65;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }
        .oc-page p, .cd-page p, .cp-page p, .pp-page p, .dl-page p {
          color: #4b607c;
          line-height: 1.75;
        }
        .oc-page h1, .oc-page h2, .oc-page h3,
        .cd-page h1, .cd-page h2, .cd-page h3,
        .cp-page h1, .cp-page h2, .cp-page h3,
        .pp-page h1, .pp-page h2, .pp-page h3,
        .dl-page h1, .dl-page h2, .dl-page h3 {
          color: #062b61;
          letter-spacing: -0.015em;
          line-height: 1.2;
        }
        .oc-subnav a, .cd-nav a, .cp-nav a, .pp-nav a, .dl-nav a {
          font-size: 0.84rem !important;
          letter-spacing: 0.015em;
          line-height: 1.25;
        }
        .oc-page button, .oc-page a,
        .cd-page button, .cd-page a,
        .cp-page button, .cp-page a,
        .pp-page button, .pp-page a,
        .dl-page button, .dl-page a {
          font-weight: 700;
        }
        .oc-page :focus-visible, .cd-page :focus-visible, .cp-page :focus-visible,
        .pp-page :focus-visible, .dl-page :focus-visible {
          outline: 3px solid rgba(253,188,1,.75);
          outline-offset: 3px;
        }
        .oc-subnav, .cd-nav, .cp-nav, .pp-nav, .dl-nav {
          margin-top: 0 !important;
        }
        body:has(.oc-page, .cd-page, .cp-page, .pp-page, .dl-page) .oc-subnav,
        body:has(.oc-page, .cd-page, .cp-page, .pp-page, .dl-page) .cd-nav,
        body:has(.oc-page, .cd-page, .cp-page, .pp-page, .dl-page) .cp-nav,
        body:has(.oc-page, .cd-page, .cp-page, .pp-page, .dl-page) .pp-nav,
        body:has(.oc-page, .cd-page, .cp-page, .pp-page, .dl-page) .dl-nav {
          top: 7rem !important;
        }
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
          text-shadow: 0 2px 3px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.35);
        }
        .nav-link-desktop:hover {
          color: #0145A8;
          background-color: #FDBC01;
          text-shadow: none;
        }
        .nav-link-desktop.active {
          color: #FDBC01;
          text-shadow: 0 2px 4px rgba(0,0,0,0.75);
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
