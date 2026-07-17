const STEPS = [
  {
    mile: '01',
    title: 'Online Driver\'s Ed',
    desc: 'State-approved coursework, paced on your schedule. Finish it from any device before you ever touch a wheel.',
    cta: 'Sign up for online ed',
    href: 'https://www.aprecisiondrivingschool.com/script/register.php',
  },
  {
    mile: '02',
    title: 'Pass the DMV Written Test',
    desc: 'Walk into the DMV prepared, not hopeful. Our course is built around exactly what the written test covers.',
    cta: 'Visit dmv.ca.gov',
    href: 'https://www.dmv.ca.gov/',
  },
  {
    mile: '03',
    title: 'Behind-the-Wheel Training',
    desc: 'Three lessons, one instructor, real streets. Lesson 1 is fundamentals & defensive driving, lesson 2 is parking in every form, lesson 3 is the freeway.',
    cta: 'Schedule your lessons',
    href: 'https://www.aprecisiondrivingschool.com/schedule/cart_home.html',
  },
]

export default function TheRoute() {
  return (
    <section id="route" className="section-pad" style={{ backgroundColor: 'var(--color-ink-soft)' }}>
      <div className="container">
        
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
            <span className="gold-bar" style={{ width: '20px' }} />
            The Route
            <span className="gold-bar" style={{ width: '20px' }} />
          </p>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', color: 'var(--color-paper)' }}>
            Three lessons.<br />
            <span style={{ color: 'var(--color-gold)' }}>One straight line to licensed.</span>
          </h2>
        </div>

        <div style={{ position: 'relative' }}>
          {/* Desktop road-line connector */}
          <div className="hidden md:block road-line" style={{
            display: 'none',
            position: 'absolute', top: '3rem', left: '15%', right: '15%',
          }} aria-hidden="true" />

          <div style={{ display: 'grid', gap: '2rem' }} className="route-grid">
            {STEPS.map((step, i) => (
              <div key={step.mile} className={`reveal reveal-delay-${i + 1}`} style={{ position: 'relative', zIndex: 1 }}>
                
                {/* Milestone Node */}
                <div style={{
                  width: '6rem', height: '6rem',
                  margin: '0 auto 2rem',
                  background: 'var(--color-ink-surface)',
                  border: '1px solid var(--color-gold-deep)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transform: 'rotate(45deg)',
                  boxShadow: '0 0 20px rgba(201,162,75,0.05)',
                }}>
                  <div style={{ transform: 'rotate(-45deg)', textAlign: 'center' }}>
                    <div className="eyebrow" style={{ fontSize: '0.5rem', color: 'var(--color-steel-light)' }}>MILE</div>
                    <div className="mono-stat" style={{ fontSize: '1.5rem', color: 'var(--color-gold)' }}>{step.mile}</div>
                  </div>
                </div>

                <div style={{
                  background: 'var(--color-ink)',
                  border: '1px solid var(--color-ink-line)',
                  padding: '2.5rem 2rem',
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--color-paper)', marginBottom: '1rem' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--color-paper-muted)', fontSize: '0.95rem', marginBottom: '2rem', flexGrow: 1 }}>
                    {step.desc}
                  </p>
                  <a href={step.href} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ alignSelf: 'center', fontSize: '0.6rem', padding: '0.6rem 1.25rem' }}>
                    {step.cta}
                  </a>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .route-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .md\\:block { display: block !important; }
        }
      `}</style>
    </section>
  )
}
