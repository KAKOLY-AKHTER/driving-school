const LOCATIONS = [
  { name: 'San Ramon', map: 'https://www.google.com/maps/embed/v1/place?q=SAN+RAMON+CA&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8' },
  { name: 'Danville', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100863.97399194786!2d-122.04184640146435!3d37.813488021706846!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808ff31209500587%3A0x185b7b97f3832fd5!2sDanville%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1714387044634!5m2!1sen!2sin' },
  { name: 'Livermore', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d101045.39924703917!2d-121.85476100892504!3d37.68049120011074!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fe586385a2071%3A0x98d32231cb6bd871!2sLivermore%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1714386912208!5m2!1sen!2sin' },
  { name: 'Pleasanton', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d202142.65679680137!2d-122.1723057097092!3d37.66145075852708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fe9a261ba755f%3A0xb3ab6847e1ea7d16!2sPleasanton%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1714386614013!5m2!1sen!2sin' },
  { name: 'Dublin', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100989.52971764698!2d-121.99252020662772!3d37.7214898142999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fe65cd6892231%3A0x3b327c848ef64057!2sDublin%2C%20CA%2094568%2C%20USA!5e0!3m2!1sen!2sin!4v1715787261489!5m2!1sen!2sin' }
]

export default function ServiceAreas() {
  return (
    <section id="contact" className="section-pad" style={{ backgroundColor: 'var(--color-ink-surface)' }}>
      <div className="container">
        
        <div className="reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '4rem' }}>
          <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
            <span className="gold-bar" style={{ width: '20px' }} />
            Locations
            <span className="gold-bar" style={{ width: '20px' }} />
          </p>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', color: 'var(--color-paper)' }}>
            Pick-up & Drop-off Areas
          </h2>
        </div>

        <div className="areas-grid" style={{ display: 'grid', gap: '1.5rem' }}>
          {LOCATIONS.map((loc, i) => (
            <div key={loc.name} className={`reveal reveal-delay-${i + 1}`} style={{
              background: 'var(--color-ink)',
              border: '1px solid var(--color-ink-line)',
              padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--color-paper)' }}>{loc.name}</h3>
                <div style={{ width: '8px', height: '8px', background: 'var(--color-gold)', transform: 'rotate(45deg)' }} />
              </div>
              <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: 'var(--color-ink-soft)', border: '1px solid var(--color-ink-line)' }}>
                <iframe 
                  src={loc.map} 
                  style={{ width: '100%', height: '100%', border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${loc.name} map`}
                />
              </div>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @media (min-width: 768px) {
          .areas-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .areas-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </section>
  )
}
