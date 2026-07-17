export default function Awards() {
  return (
    <section id="awards" style={{ borderTop: '1px solid var(--color-ink-line)', borderBottom: '1px solid var(--color-ink-line)' }}>
      <div className="container" style={{ padding: 0 }}>
        <div style={{ display: 'grid' }} className="awards-grid">
          
          {/* Left: Graphic */}
          <div className="reveal" style={{
            background: 'linear-gradient(135deg, var(--color-ink-surface), var(--color-ink))',
            padding: '4rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background texture */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at center, rgba(201,162,75,0.08) 0%, transparent 60%)',
              pointerEvents: 'none'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <div style={{
                width: '120px', height: '120px',
                margin: '0 auto 1.5rem',
                border: '1px solid var(--color-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transform: 'rotate(45deg)',
              }}>
                <div style={{ transform: 'rotate(-45deg)' }}>
                  <div className="mono-stat" style={{ fontSize: '3rem', lineHeight: 1 }}>4×</div>
                </div>
              </div>
              <div className="eyebrow-gold">Best of San Ramon</div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="reveal reveal-delay-2" style={{
            padding: 'clamp(3rem, 5vw, 5rem)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <span className="gold-bar" style={{ width: '20px' }} />
              Recognized Excellence
            </p>
            <h2 style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', color: 'var(--color-paper)', marginBottom: '1.5rem' }}>
              Award-Winning Instruction
            </h2>
            <p style={{ color: 'var(--color-paper-muted)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '42ch', marginBottom: '2rem' }}>
              It is our pleasure to inform you that A Precision Driving School has been selected for the <strong>4th consecutive year</strong> for the Best of San Ramon Awards in the category of Driving School.
            </p>
            <p style={{ color: 'var(--color-paper-muted)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '42ch' }}>
              Very friendly, patient, polite, and professional instructors. Open 7 days a week. Cars equipped with Dual-Control systems for student safety—a standard not held by all local schools.
            </p>
          </div>

        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .awards-grid { grid-template-columns: 0.8fr 1.2fr !important; }
          .awards-grid > div:first-child { border-right: 1px solid var(--color-ink-line); }
        }
      `}</style>
    </section>
  )
}
