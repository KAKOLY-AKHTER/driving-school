import ServiceAreas from '../components/ServiceAreas'

export default function ContactPage() {
  return (
    <div style={{ paddingTop: '8rem' }}>
      <div className="container" style={{ marginBottom: '4rem' }}>
        <div className="reveal" style={{ textAlign: 'center' }}>
          <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
            <span className="gold-bar" style={{ width: '20px' }} />
            Get In Touch
            <span className="gold-bar" style={{ width: '20px' }} />
          </p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--color-paper)', marginBottom: '2rem' }}>
            Contact Us
          </h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', maxWidth: '30rem', margin: '0 auto', background: 'var(--color-ink-surface)', padding: '3rem', border: '1px solid var(--color-ink-line)' }}>
            <div>
              <p className="eyebrow" style={{ color: 'var(--color-steel-light)', marginBottom: '0.5rem' }}>Text Only Please</p>
              <a href="tel:+19253291736" style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '2rem', 
                fontWeight: 700, 
                color: 'var(--color-gold)',
                letterSpacing: '-0.02em'
              }}>
                +1 925 329 1736
              </a>
            </div>
            
            <div className="hairline" style={{ width: '100%' }} />
            
            <div>
              <p className="eyebrow" style={{ color: 'var(--color-steel-light)', marginBottom: '0.5rem' }}>Office Address</p>
              <p style={{ color: 'var(--color-paper-muted)', fontSize: '1.1rem' }}>
                2001 Omega Rd, Ste 205<br/>
                San Ramon, CA 94583
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <ServiceAreas />
    </div>
  )
}
