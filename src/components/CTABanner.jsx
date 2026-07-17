export default function CTABanner() {
  return (
    <section className="section-pad" style={{ 
      background: 'linear-gradient(135deg, var(--color-ink) 0%, var(--color-ink-soft) 100%)',
      borderTop: '1px solid var(--color-ink-line)'
    }}>
      <div className="container">
        <div className="reveal" style={{ 
          maxWidth: '48rem', 
          margin: '0 auto', 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          
          <h2 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
            color: 'var(--color-paper)', 
            marginBottom: '1.5rem',
            lineHeight: 1.1
          }}>
            Ready to get behind<br/>
            <span style={{ color: 'var(--color-gold)' }}>the wheel?</span>
          </h2>

          <p style={{ 
            color: 'var(--color-paper-muted)', 
            fontSize: '1.1rem',
            marginBottom: '3rem',
            maxWidth: '36ch'
          }}>
            Book your lessons today and start driving with confidence.
          </p>

          <a 
            href="https://www.aprecisiondrivingschool.com/schedule/cart_home.html" 
            className="btn-gold"
            target="_blank" 
            rel="noopener noreferrer"
            style={{ fontSize: '0.8rem', padding: '1rem 3rem' }}
          >
            Book Driving Lessons
          </a>

          <div className="hairline" style={{ width: '100%', marginBlock: '3rem' }} />

          <p className="eyebrow" style={{ color: 'var(--color-steel-light)', marginBottom: '0.5rem' }}>Or contact us directly</p>
          <a href="tel:+19253291736" style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '2rem', 
            fontWeight: 700, 
            color: 'var(--color-paper)',
            letterSpacing: '-0.02em'
          }}>
            +1 925 329 1736
          </a>
          <p style={{ color: 'var(--color-signal)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Text only please</p>

        </div>
      </div>
    </section>
  )
}
