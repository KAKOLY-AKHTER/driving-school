const STEPS = [
  {
    mile: '01',
    title: 'Online Driver\'s Ed',
    desc: 'State-approved coursework, paced on your schedule. Finish it from any device before you ever touch a wheel.',
    cta: 'Sign up for online ed',
    href: 'https://www.aprecisiondrivingschool.com/script/register.php',
    img: '/card1.png',
  },
  {
    mile: '02',
    title: 'Pass the DMV Written Test',
    desc: 'Walk into the DMV prepared, not hopeful. Our course is built around exactly what the written test covers.',
    cta: 'Visit dmv.ca.gov',
    href: 'https://www.dmv.ca.gov/',
    img: '/card2.png',
  },
  {
    mile: '03',
    title: 'Behind-the-Wheel Training',
    desc: 'Three lessons, one instructor, real streets. Lesson 1 is fundamentals & defensive driving, lesson 2 is parking in every form, lesson 3 is the freeway.',
    cta: 'Schedule your lessons',
    href: 'https://www.aprecisiondrivingschool.com/schedule/cart_home.html',
    img: '/card3.png',
  },
]

export default function TheRoute() {
  return (
    <section id="route" className="section-pad" style={{ backgroundColor: '#ffffff' }}>
      <div className="container">
        
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', color: '#0145A8' }}>
            <span style={{ width: '20px', height: '2px', background: '#FDBC01', display: 'inline-block' }} />
            The Route
            <span style={{ width: '20px', height: '2px', background: '#FDBC01', display: 'inline-block' }} />
          </p>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', color: '#0145A8' }}>
            Three lessons.<br />
            <span style={{ color: '#FDBC01' }}>One straight line to licensed.</span>
          </h2>
        </div>

        <div style={{ position: 'relative' }}>
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
                  background: '#0145A8',
                  border: '3px solid #FDBC01',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transform: 'rotate(45deg)',
                  boxShadow: '0 0 24px rgba(1,69,168,0.2)',
                }}>
                  <div style={{ transform: 'rotate(-45deg)', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>MILE</div>
                    <div className="mono-stat" style={{ fontSize: '1.5rem', color: '#FDBC01' }}>{step.mile}</div>
                  </div>
                </div>

                <div style={{
                  background: '#F8FAFD',
                  border: '1px solid #E2EBF5',
                  borderLeft: '3px solid #0145A8',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#0145A8', marginBottom: '0.75rem' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: '#364B6B', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {step.desc}
                  </p>
                  <img
                    src={step.img}
                    alt={step.title}
                    style={{
                      width: '180px',
                      height: '180px',
                      objectFit: 'cover',
                      borderRadius: '50%',
                      marginBottom: '1rem',
                      border: '2px solid #E2EBF5',
                    }}
                  />
                  <a href={step.href} target="_blank" rel="noopener noreferrer" style={{
                    alignSelf: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '0.65rem 1.5rem',
                    background: '#FDBC01',
                    color: '#0145A8',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}>
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
