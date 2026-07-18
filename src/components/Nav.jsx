import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Home', href: '/', external: false },
  { label: 'Packages And Pricing', href: '/pricing', external: false },
  { label: 'Contact Us', href: '/contact', external: false },
  { label: 'Register For Online Drivers Ed', href: '/register', external: false },
  { label: 'Register For Driving Lessons', href: '/schedule', external: false },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
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
        backgroundColor: solidBg ? 'rgba(1, 69, 168, 0.85)' : 'transparent',
        borderBottom: solidBg ? '1px solid rgba(253, 188, 1, 0.2)' : 'none',
        backdropFilter: solidBg ? 'blur(24px) saturate(180%)' : 'none',
        WebkitBackdropFilter: solidBg ? 'blur(24px) saturate(180%)' : 'none',
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
        <div className="container" style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', fontWeight: '600' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#0a1628', transform: 'rotate(90deg)' }}>📞</span> +1 925 329 1736
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#0a1628' }}>✉️</span> aprecisiondrivingschool@gmail.com
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Desktop Links */}
            <ul role="list" className="hidden lg:flex" style={{ gap: '1rem', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
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

            {/* Mobile Hamburger */}
            <button
              className="lg:hidden"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              aria-expanded={open}
              style={{
                width: '40px', height: '40px',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center',
                gap: '6px',
                color: 'var(--color-paper)',
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
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--color-paper)',
                    }}
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    to={l.href}
                    onClick={() => setOpen(false)}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: location.pathname === l.href ? 'var(--color-gold)' : 'var(--color-paper)',
                    }}
                  >
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        .nav-link-desktop {
          font-family: var(--font-body);
          font-size: 0.9rem;
          font-weight: 700;
          color: #ffffff;
          position: relative;
          padding: 0.5rem 1rem;
          border-radius: 6px;
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
      `}</style>
    </header>
  )
}