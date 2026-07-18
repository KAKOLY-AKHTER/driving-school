const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <>
      <style>{`
        .ft-link {
          color: rgba(255,255,255,0.45);
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
        .ft-link-gold {
          color: ${GOLD};
        }
        .ft-link-gold:hover {
          color: ${GOLD_BRIGHT};
        }
        .ft-social {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.4);
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
        @media (min-width: 768px) {
          .ft-grid { grid-template-columns: 1.5fr 1fr 1fr 1.2fr !important; }
          .ft-bottom { flex-direction: row !important; justify-content: space-between !important; text-align: left !important; }
        }
      `}</style>

      <footer style={{
        background: `linear-gradient(180deg, ${DARK} 0%, #060e1a 100%)`,
        borderTop: '1px solid rgba(253,188,1,0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}>
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
                  alt="A Precision Driving School Logo"
                  style={{
                    height: '130px',
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.95)) drop-shadow(0 0 6px rgba(255,255,255,0.8))',
                  }}
                />
              </div>
              <p style={{
                fontFamily: 'var(--font-body)',
                color: 'rgba(255,255,255,0.35)',
                fontSize: '0.85rem',
                lineHeight: 1.7,
                maxWidth: '30ch',
                marginBottom: '1.5rem',
              }}>
                Most complete and affordable way to do all in one package. Fully Bonded, Licensed and Insured.
              </p>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <a href="https://www.facebook.com/people/A-Precision-Driving-School/61561300479300/" target="_blank" rel="noopener noreferrer" className="ft-social" aria-label="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/aprecisiondrivingschool/" target="_blank" rel="noopener noreferrer" className="ft-social" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/@aprecisiondrivingschool" target="_blank" rel="noopener noreferrer" className="ft-social" aria-label="YouTube">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div className="ft-col-title">Quick Links</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', listStyle: 'none', padding: 0, margin: 0 }}>
                <li><a href="#programs" className="ft-link">Programs</a></li>
                <li><a href="#pricing" className="ft-link">Pricing</a></li>
                <li><a href="#route" className="ft-link">The Route</a></li>
                <li><a href="https://www.aprecisiondrivingschool.com/script/register.php" target="_blank" rel="noopener noreferrer" className="ft-link ft-link-gold">Online Drivers Ed</a></li>
                <li><a href="https://aprecisiondrivingschool.com/schedule/my_account.html" target="_blank" rel="noopener noreferrer" className="ft-link">Student Login</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <div className="ft-col-title">Services</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', listStyle: 'none', padding: 0, margin: 0 }}>
                <li><a href="#programs" className="ft-link">Teenager Lessons</a></li>
                <li><a href="#programs" className="ft-link">Adult Lessons</a></li>
                <li><a href="#pricing" className="ft-link">Behind-the-Wheel</a></li>
                <li><a href="https://www.aprecisiondrivingschool.com/script/register.php" target="_blank" rel="noopener noreferrer" className="ft-link">Online Drivers Ed</a></li>
                <li><a href="#contact" className="ft-link">Free Pickup & Drop</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <div className="ft-col-title">Contact</div>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '32px', height: '32px', minWidth: '32px',
                    borderRadius: '8px',
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
                    <span style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.6, display: 'block' }}>
                      2001 Omega Rd, Ste 205<br/>San Ramon, CA 94583
                    </span>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{
                    width: '32px', height: '32px', minWidth: '32px',
                    borderRadius: '8px',
                    background: 'rgba(253,188,1,0.06)',
                    border: '1px solid rgba(253,188,1,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>Text Only</span>
                    <a href="tel:+19253291736" style={{ fontFamily: 'var(--font-display)', color: '#ffffff', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', transition: 'color 0.3s ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = GOLD }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#ffffff' }}
                    >
                      +1 925-329-1736
                    </a>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{
                    width: '32px', height: '32px', minWidth: '32px',
                    borderRadius: '8px',
                    background: 'rgba(253,188,1,0.06)',
                    border: '1px solid rgba(253,188,1,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontWeight: 600, display: 'block', marginBottom: '0.15rem' }}>DMV License</span>
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
              color: 'rgba(255,255,255,0.25)',
              fontSize: '0.78rem',
            }}>
              &copy; {currentYear} A Precision Driving School. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="#" style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.3s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}
              >Privacy Policy</a>
              <a href="#" style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', textDecoration: 'none', transition: 'color 0.3s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}
              >Terms of Service</a>
            </div>
          </div>

        </div>
      </footer>
    </>
  )
}
