import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { DEFAULT_SOCIALS, socialIcon, socialPlatformLabel } from '../socials'
import { useSiteSettings, phoneHref } from '../useSiteSettings'
import { safeHttpUrl } from '../utils/urlSafety'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const DARK = '#0a1628'

function RoadCar({ color, delay = '0s' }) {
  return (
    <svg className="ft-road-car" style={{ animationDelay: delay }} width="104" height="44" viewBox="0 0 104 44" aria-hidden="true">
      <defs>
        <linearGradient id={`car-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor="#071426" />
        </linearGradient>
      </defs>
      <ellipse cx="52" cy="38" rx="44" ry="3" fill="rgba(0,0,0,.45)" />
      <path d="M9 29l5-10c1-2 3-3 5-3h15l9-10h27c4 0 7 2 10 5l7 7 8 3c3 1 5 4 5 7v6H7v-2c0-2 1-3 2-3z" fill={`url(#car-${color.replace('#', '')})`} stroke="rgba(255,255,255,.45)" strokeWidth="1" />
      <path d="M39 16l7-8h12v8H39zm22 0V8h8c3 0 5 1 7 4l4 4H61z" fill="#bfe2f6" opacity=".9" />
      <path d="M13 22h78" stroke="rgba(255,255,255,.2)" />
      <circle cx="28" cy="34" r="7" fill="#101820" stroke="#8e99a6" strokeWidth="2" /><circle cx="28" cy="34" r="2.5" fill="#dce4ea" />
      <circle cx="79" cy="34" r="7" fill="#101820" stroke="#8e99a6" strokeWidth="2" /><circle cx="79" cy="34" r="2.5" fill="#dce4ea" />
      <path d="M94 25h5v4h-5z" fill="#ffd75a" /><path d="M8 25h5v4H8z" fill="#ff4d4d" />
    </svg>
  )
}

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const settings = useSiteSettings()
  const [socials, setSocials] = useState(DEFAULT_SOCIALS)

  useEffect(() => {
    api.getSocials()
      .then(res => {
        if (Array.isArray(res) && res.length > 0) setSocials(res)
      })
      .catch(() => {})
  }, [])

  const safeSocials = socials
    .map(social => ({ ...social, safeUrl: safeHttpUrl(social.url) }))
    .filter(social => social.safeUrl)

  return (
    <>
      <style>{`
        .ft-link {
          color: rgba(255,255,255,0.88);
          font-family: var(--font-body);
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .ft-link:hover {
          color: ${GOLD};
          transform: translateX(4px);
        }
        .ft-link:focus-visible,.ft-social:focus-visible,.ft-contact-link:focus-visible,.ft-bottom a:focus-visible { outline:3px solid rgba(253,188,1,.72); outline-offset:3px; }
        .ft-link-gold {
          color: ${GOLD};
        }
        .ft-link-gold:hover {
          color: ${GOLD_BRIGHT};
        }
        .ft-social {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.88);
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          text-decoration: none;
        }
        .ft-social:hover {
          background: rgba(253,188,1,0.1);
          border-color: rgba(253,188,1,0.2);
          color: ${GOLD};
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(253,188,1,0.15);
        }
        .ft-col-title {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: ${GOLD_DEEP};
          font-weight: 700;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .ft-col-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(253,188,1,0.2), transparent);
        }
        .ft-bottom {
          border-top: 1px solid rgba(255,255,255,0.04);
          padding-top: 2rem;
        }
        .ft-road {
          height: 96px;
          position: relative;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: end;
          padding: 0 8vw 9px;
          background: linear-gradient(180deg, ${DARK} 0%, #060e1a 100%);
          border-bottom: 1px dashed rgba(255,255,255,0.35);
          box-sizing: border-box;
          overflow: hidden;
        }
        .ft-road-car {
          position: absolute;
          left: -120px;
          bottom: -2px;
          filter: drop-shadow(0 5px 5px rgba(0,0,0,0.45));
          animation: ftCarDrive 15s linear infinite;
        }
        @keyframes ftCarDrive {
          0% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(calc(50vw + 120px)) translateY(-2px); }
          100% { transform: translateX(calc(100vw + 240px)) translateY(0); }
        }
        @media (min-width: 768px) {
          .ft-grid { grid-template-columns: 1.5fr 1fr 1fr 1.2fr !important; }
          .ft-bottom { flex-direction: row !important; justify-content: space-between !important; text-align: left !important; }
        }
        @media (max-width: 600px) {
          .ft-road { height: 78px; padding-inline: 0.5rem; }
          .ft-road-car { width: 76px; height: auto; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ft-road-car { animation:none !important; }
          .ft-link,.ft-social { transition:none !important; }
        }
      `}</style>

      <footer style={{
        background: `linear-gradient(180deg, ${DARK} 0%, #060e1a 100%)`,
        borderTop: '1px solid rgba(253,188,1,0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="ft-road" aria-hidden="true">
          <RoadCar color="#0878d1" delay="0s" />
          <RoadCar color="#d8dde2" delay="5s" />
          <RoadCar color="#e54820" delay="10s" />
        </div>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 20%, rgba(1,69,168,0.04) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 80% 80%, rgba(253,188,1,0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '5rem', paddingBottom: '2rem' }}>

          <div className="ft-grid" style={{ display: 'grid', gap: '3rem', marginBottom: '4rem' }}>

            {/* Brand */}
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <img
                  src="/driving-logo.png"
                  alt="A Precision Driving School"
                  width="532"
                  height="532"
                  loading="lazy"
                  decoding="async"
                  style={{
                    height: '150px',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 22px rgba(255,255,255,1)) drop-shadow(0 6px 14px rgba(0,0,0,0.3))',
                  }}
                />
              </div>
              <p style={{
                fontFamily: 'var(--font-body)',
                color: 'rgba(255,255,255,0.88)',
                fontSize: '0.85rem',
                lineHeight: 1.7,
                maxWidth: '30ch',
                marginBottom: '1.5rem',
              }}>
                Complete, affordable driver education and behind-the-wheel training. Fully bonded, licensed, and insured.
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {safeSocials.map(s => (
                  <a key={s._id || s.platform} href={s.safeUrl} target="_blank" rel="noopener noreferrer" className="ft-social" aria-label={`Visit ${socialPlatformLabel(s.platform)} (opens in a new tab)`}>
                    {socialIcon(s.platform, 18)}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div className="ft-col-title">Quick Links</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', listStyle: 'none', padding: 0, margin: 0 }}>
                <li><Link to="/#programs" className="ft-link">Programs</Link></li>
                <li><Link to="/#pricing" className="ft-link">Pricing</Link></li>
                <li><Link to="/#route" className="ft-link">The Route</Link></li>
                <li><Link to="/blog" className="ft-link">Blog</Link></li>
                <li><Link to="/register" className="ft-link ft-link-gold">Online Drivers Ed</Link></li>
                <li><Link to="/login" className="ft-link">Student Login</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <div className="ft-col-title">Services</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', listStyle: 'none', padding: 0, margin: 0 }}>
                <li><Link to="/#program-teens" className="ft-link">Teenager Lessons</Link></li>
                <li><Link to="/#program-adults" className="ft-link">Adult Lessons</Link></li>
                <li><Link to="/#pricing" className="ft-link">Behind-the-Wheel</Link></li>
                <li><Link to="/register" className="ft-link">Online Drivers Ed</Link></li>
                <li><Link to="/#contact" className="ft-link">Free Pickup & Drop</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <div className="ft-col-title">Contact</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '32px', height: '32px', minWidth: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(253,188,1,0.06)',
                    border: '1px solid rgba(253,188,1,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: '2px',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.88)', fontSize: '0.82rem', lineHeight: 1.6, display: 'block', overflowWrap:'anywhere' }}>
                      {settings.address}<br/>{settings.subaddress}
                    </span>
                  </div>
                </li>
                <li style={{ display:'flex', gap:'.75rem', alignItems:'center', minWidth:0 }}>
                  <div aria-hidden="true" style={{ width:'32px', height:'32px', minWidth:'32px', borderRadius:'var(--radius-sm)', background:'rgba(253,188,1,0.06)', border:'1px solid rgba(253,188,1,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></div>
                  <a className="ft-contact-link" href={`mailto:${settings.email}`} style={{ color:'#fff', fontFamily:'var(--font-body)', fontSize:'.82rem', textDecoration:'none', overflowWrap:'anywhere', minWidth:0 }}>{settings.email}</a>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{
                    width: '32px', height: '32px', minWidth: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(253,188,1,0.06)',
                    border: '1px solid rgba(253,188,1,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.88)', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Text Only</span>
                    <a href={phoneHref(settings.phone)} style={{ fontFamily: 'var(--font-display)', color: '#ffffff', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', transition: 'color 0.3s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = GOLD }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#ffffff' }}
                    >
                      {settings.phone}
                    </a>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{
                    width: '32px', height: '32px', minWidth: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(253,188,1,0.06)',
                    border: '1px solid rgba(253,188,1,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.88)', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>DMV License</span>
                    <span style={{ fontFamily: 'var(--font-display)', color: GOLD, fontSize: '1rem', fontWeight: 700 }}>#E4566</span>
                  </div>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom */}
          <div className="ft-bottom" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'center',
            textAlign: 'center',
          }}>
              <p style={{
                fontFamily: 'var(--font-body)',
                color: 'rgba(255,255,255,0.88)',
                fontSize: '0.78rem',
              }}>
                &copy; {currentYear} A Precision Driving School. All rights reserved.
              </p>
              <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.88)', fontSize: '0.75rem', margin: 0 }}>
                Designed and developed by <a href="https://nexviya.com" target="_blank" rel="noopener noreferrer" style={{ color: GOLD, textDecoration: 'none', fontWeight: 600 }}>Nexviya.com</a>
              </p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <Link to="/privacy-policy" style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.88)', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.3s ease', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = GOLD }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.88)' }}
              >Privacy Policy</Link>
              <Link to="/terms" style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.88)', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.3s ease', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = GOLD }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.88)' }}
              >Terms of Service</Link>
            </div>
          </div>

        </div>
      </footer>
    </>
  )
}
