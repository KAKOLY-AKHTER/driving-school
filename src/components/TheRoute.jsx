const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'

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
    <>
      <style>{`
        @keyframes routeFadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes routeDiamondPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(253,188,1,0.2); }
          50% { box-shadow: 0 0 40px rgba(253,188,1,0.45), 0 0 60px rgba(253,188,1,0.15); }
        }
        @keyframes routeDash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes routeGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .route-step {
          position: relative;
          z-index: 1;
          animation: routeFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        .route-step:nth-child(1) { animation-delay: 0.1s; }
        .route-step:nth-child(2) { animation-delay: 0.3s; }
        .route-step:nth-child(3) { animation-delay: 0.5s; }
        .route-card {
          background: #ffffff;
          border: 1px solid #E2EBF5;
          border-left: 3px solid ${SKY_BLUE};
          padding: 2rem 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .route-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(1,69,168,0.1), 0 4px 16px rgba(253,188,1,0.06);
          border-color: ${GOLD};
        }
        .route-diamond {
          width: 6rem;
          height: 6rem;
          margin: 0 auto 2rem;
          background: linear-gradient(135deg, ${SKY_BLUE}, #023080);
          border: 3px solid ${GOLD};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transform: rotate(45deg);
          animation: routeDiamondPulse 2.5s ease-in-out infinite;
          transition: all 0.4s ease;
        }
        .route-card:hover ~ .route-diamond,
        .route-step:hover .route-diamond {
          transform: rotate(45deg) scale(1.1);
          border-color: ${GOLD_BRIGHT};
        }
        .route-img-wrap {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 1rem;
          border: 3px solid #E2EBF5;
          transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
          position: relative;
        }
        .route-img-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
          transition: border-color 0.4s ease;
          pointer-events: none;
        }
        .route-card:hover .route-img-wrap {
          border-color: ${GOLD};
          transform: scale(1.08);
          box-shadow: 0 12px 30px rgba(1,69,168,0.12);
        }
        .route-card:hover .route-img-wrap::after {
          border-color: rgba(253,188,1,0.3);
        }
        .route-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .route-card:hover .route-img-wrap img {
          transform: scale(1.1);
        }
        .route-cta {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.65rem 1.5rem;
          background: ${GOLD};
          color: ${SKY_BLUE};
          font-weight: 700;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .route-cta:hover {
          background: ${GOLD_BRIGHT};
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(253,188,1,0.3);
        }
        .route-road-desktop {
          position: absolute;
          top: 3rem;
          left: 15%;
          right: 15%;
          height: 3px;
          pointer-events: none;
          z-index: 0;
        }
        .route-road-desktop svg {
          width: 100%;
          height: 20px;
          overflow: visible;
        }
        .route-road-desktop line {
          stroke: #E2EBF5;
          stroke-width: 3;
          stroke-dasharray: 12 8;
          stroke-dashoffset: 600;
          animation: routeDash 2s ease-out 0.5s forwards;
        }
        .route-road-desktop .road-glow {
          stroke: rgba(253,188,1,0.15);
          stroke-width: 8;
          stroke-dasharray: 12 8;
          stroke-dashoffset: 600;
          animation: routeDash 2s ease-out 0.5s forwards, routeGlow 3s ease-in-out 2.5s infinite;
          filter: blur(3px);
        }
        @media (min-width: 768px) {
          .route-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .route-road-desktop { display: none; }
        }
      `}</style>

      <section id="route" className="section-pad" style={{ backgroundColor: '#ffffff' }}>
        <div className="container" style={{ position: 'relative' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: GOLD_DEEP,
              fontWeight: 700,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.8rem',
            }}>
              <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD})`, display: 'inline-block' }} />
              The Route
              <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, ${GOLD}, transparent)`, display: 'inline-block' }} />
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              color: SKY_BLUE,
              lineHeight: 1.15,
              fontWeight: 800,
            }}>
              Three lessons.<br />
              <span style={{ color: GOLD }}>One straight line to licensed.</span>
            </h2>
          </div>

          {/* Road line + Steps */}
          <div style={{ position: 'relative' }}>

            {/* Animated Road Line (desktop) */}
            <div className="route-road-desktop" aria-hidden="true">
              <svg viewBox="0 0 1000 20" preserveAspectRatio="none">
                <line className="road-glow" x1="0" y1="10" x2="1000" y2="10" />
                <line x1="0" y1="10" x2="1000" y2="10" />
              </svg>
            </div>

            {/* Steps Grid */}
            <div style={{ display: 'grid', gap: '2rem' }} className="route-grid">
              {STEPS.map((step) => (
                <div key={step.mile} className="route-step" style={{ position: 'relative', zIndex: 1 }}>

                  {/* Milestone Diamond */}
                  <div className="route-diamond">
                    <div style={{ transform: 'rotate(-45deg)', textAlign: 'center' }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.5rem',
                        color: 'rgba(255,255,255,0.7)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}>MILE</div>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.5rem',
                        color: GOLD,
                        fontWeight: 800,
                        lineHeight: 1,
                      }}>{step.mile}</div>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="route-card">
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.25rem',
                      color: SKY_BLUE,
                      marginBottom: '0.75rem',
                      fontWeight: 700,
                    }}>
                      {step.title}
                    </h3>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      color: '#364B6B',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      marginBottom: '1.25rem',
                    }}>
                      {step.desc}
                    </p>

                    {/* Image */}
                    <div className="route-img-wrap">
                      <img src={step.img} alt={step.title} />
                    </div>

                    {/* CTA */}
                    <a href={step.href} target="_blank" rel="noopener noreferrer" className="route-cta">
                      {step.cta}
                    </a>
                  </div>

                </div>
              ))}
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
