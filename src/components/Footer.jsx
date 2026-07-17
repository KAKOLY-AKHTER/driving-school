export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer style={{ 
      backgroundColor: 'var(--color-ink)', 
      borderTop: '1px solid var(--color-ink-line)',
      paddingTop: '5rem',
      paddingBottom: '2rem'
    }}>
      <div className="container">
        
        <div className="footer-grid" style={{ 
          display: 'grid', 
          gap: '3rem', 
          marginBottom: '5rem' 
        }}>
          
          {/* Brand Col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img 
                src="/driving-logo.png" 
                alt="A Precision Driving School Logo" 
                style={{ height: '120px', width: 'auto', objectFit: 'contain' }} 
              />
            </div>
            <p style={{ color: 'var(--color-paper-muted)', fontSize: '0.9rem', maxWidth: '32ch' }}>
              Most complete and affordable way to do all in one package. By signing up in our starter package, you get the course.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <a href="https://www.facebook.com/people/A-Precision-Driving-School/61561300479300/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-steel-light)' }} aria-label="Facebook">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-steel-light)' }} aria-label="Instagram">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <div className="eyebrow" style={{ color: 'var(--color-paper)', marginBottom: '1.5rem' }}>Quick Links</div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li><a href="#programs" className="footer-link">Programs</a></li>
              <li><a href="#pricing" className="footer-link">Pricing</a></li>
              <li><a href="#route" className="footer-link">The Route</a></li>
              <li><a href="https://www.aprecisiondrivingschool.com/script/register.php" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ color: 'var(--color-gold)' }}>Online Drivers Ed</a></li>
              <li><a href="https://aprecisiondrivingschool.com/schedule/my_account.html" target="_blank" rel="noopener noreferrer" className="footer-link">Student Login</a></li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div>
            <div className="eyebrow" style={{ color: 'var(--color-paper)', marginBottom: '1.5rem' }}>Contact</div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--color-paper-muted)', fontSize: '0.9rem' }}>
              <li>
                <span style={{ display: 'block', color: 'var(--color-steel-light)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Office Address</span>
                2001 Omega Rd, Ste 205<br/>San Ramon, CA 94583
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                <span style={{ display: 'block', color: 'var(--color-steel-light)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Phone (Text Only)</span>
                <a href="tel:+19253291736" style={{ color: 'var(--color-paper)' }}>+1 925-329-1736</a>
              </li>
              <li style={{ marginTop: '0.5rem' }}>
                <span style={{ display: 'block', color: 'var(--color-steel-light)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>DMV License</span>
                <span className="mono-stat" style={{ fontSize: '1rem' }}>#E4566</span>
              </li>
            </ul>
          </div>

        </div>

        <div style={{ 
          borderTop: '1px solid var(--color-ink-line)', 
          paddingTop: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          alignItems: 'center',
          textAlign: 'center'
        }} className="footer-bottom">
          <p className="eyebrow" style={{ color: 'var(--color-steel-light)' }}>
            © {currentYear} A Precision Driving School. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" className="eyebrow" style={{ color: 'var(--color-ink-muted)' }}>Privacy Policy</a>
            <a href="#" className="eyebrow" style={{ color: 'var(--color-ink-muted)' }}>Terms of Service</a>
          </div>
        </div>

      </div>

      <style>{`
        .footer-link {
          color: var(--color-paper-muted);
          font-size: 0.95rem;
          transition: color 0.2s ease;
        }
        .footer-link:hover {
          color: var(--color-paper);
        }

        @media (min-width: 768px) {
          .footer-grid { grid-template-columns: 2fr 1fr 1fr; }
          .footer-bottom { flexDirection: 'row', justifyContent: 'space-between', textAlign: 'left' }
        }
      `}</style>
    </footer>
  )
}
