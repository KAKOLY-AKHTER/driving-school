import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const AWARDS = [
  '/award1.png',
  '/award2.png',
  '/award3.png',
  '/award4.png',
]

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'

export default function Awards() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const total = AWARDS.length

  useEffect(() => {
    if (isPaused) return
    const tick = () => setCurrent((c) => (c + 1) % total)
    const timer = setInterval(tick, 3000)
    return () => clearInterval(timer)
  }, [total, isPaused])

  const prev = (current - 1 + total) % total
  const next = (current + 1) % total

  const handleKey = (e) => {
    if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + total) % total)
    if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % total)
  }

  return (
    <>
      <style>{`
        @keyframes awardSlide {
          0% { opacity: 0; transform: scale(0.92) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes awardGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(253,188,1,0.15); }
          50% { box-shadow: 0 0 40px rgba(253,188,1,0.3); }
        }
        @keyframes awardPulseRing {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes awardShine {
          0% { left: -60%; }
          100% { left: 120%; }
        }
        @keyframes awardFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .award-img-slide {
          animation: awardSlide 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        .award-shine-card {
          position: relative;
          overflow: hidden;
        }
        .award-shine-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: -60%;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          animation: awardShine 3s ease-in-out infinite;
          pointer-events: none;
        }
        .award-side-img {
          opacity: 0.35;
          filter: grayscale(0.5) blur(0.5px);
          transform: scale(0.75);
          transition: all 0.6s cubic-bezier(0.22,1,0.36,1);
        }
        .award-center-img {
          opacity: 1;
          filter: none;
          transform: scale(1);
          transition: all 0.6s cubic-bezier(0.22,1,0.36,1);
        }
        @media (max-width: 768px) {
          .award-side-wrap {
            display: none !important;
          }
          .award-center-wrap {
            flex: 0 0 100% !important;
          }
        }
      `}</style>

      <section
        id="awards"
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 40%, #0a1628 100%)',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: '5rem',
          paddingBottom: '5rem',
        }}

      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 50%, rgba(253,188,1,0.04) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 70% 50%, rgba(1,69,168,0.06) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid' }} className="awards-grid-premium">
            {/* Left: Award Carousel + Info */}
            <div
              style={{
                padding: 'clamp(2.5rem, 4vw, 4rem)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '1px solid rgba(253,188,1,0.08)',
              }}
            >
              {/* Carousel Section */}
              <div
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onKeyDown={handleKey}
                tabIndex={0}
                role="region"
                aria-label="Awards carousel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.8rem',
                  width: '100%',
                  marginBottom: '2.5rem',
                  outline: 'none',
                }}
              >
                {/* Left side image */}
                <div className="award-side-wrap" style={{ flex: '0 0 22%', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={AWARDS[prev]}
                    alt="Award"
                    className="award-side-img"
                    style={{
                      width: '100%',
                      maxWidth: '130px',
                      height: 'auto',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                </div>

                {/* Center image */}
                <div
                  className="award-center-wrap award-shine-card"
                  style={{
                    flex: '0 0 50%',
                    position: 'relative',
                  }}
                >
                  <div
                    key={current}
                    className="award-img-slide"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #fefce8 50%, #f0f7ff 100%)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.5rem',
                      border: '1px solid rgba(253,188,1,0.2)',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 2px 10px rgba(253,188,1,0.1)',
                      animation: 'awardGlow 3s ease-in-out infinite',
                    }}
                  >
                    <img
                      src={AWARDS[current]}
                      alt="Best of San Ramon Award"
                      style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: 'auto',
                        display: 'block',
                        margin: '0 auto',
                      }}
                    />
                  </div>

                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '-6px',
                      right: '-6px',
                      bottom: '-6px',
                      border: '1px solid rgba(253,188,1,0.1)',
                      borderRadius: 'var(--radius-lg)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>

                {/* Right side image */}
                <div className="award-side-wrap" style={{ flex: '0 0 22%', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={AWARDS[next]}
                    alt="Award"
                    className="award-side-img"
                    style={{
                      width: '100%',
                      maxWidth: '130px',
                      height: 'auto',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                </div>
              </div>

              {/* Dots */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {AWARDS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    style={{
                      width: current === i ? '28px' : '14px',
                      height: '14px',
                      borderRadius: '7px',
                      background: current === i ? GOLD : 'rgba(253,188,1,0.2)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
                      padding: 0,
                    }}
                    aria-label={`Go to award ${i + 1}`}
                  />
                ))}
              </div>

              {/* Title + Description */}
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                  color: '#ffffff',
                  fontWeight: 800,
                  marginBottom: '1rem',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <span style={{ color: GOLD }}>Awards</span>
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(0.85rem, 1.3vw, 0.95rem)',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.7,
                  textAlign: 'center',
                  maxWidth: '38ch',
                }}
              >
                It is our pleasure to inform you that A Precision Driving School has been selected for the <strong style={{ color: GOLD }}>4th consecutive year</strong> Best of San Ramon Awards in the category of Driving School.
              </p>
            </div>

            {/* Right: About Content */}
            <div
              style={{
                padding: 'clamp(2.5rem, 4vw, 4rem)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ marginBottom: '0.6rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: GOLD_DEEP,
                    fontWeight: 700,
                    marginBottom: '1rem',
                  }}
                >
                  <span style={{ width: '20px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD})`, display: 'inline-block' }} />
                  Since 1989
                </span>
              </div>

              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
                  color: '#ffffff',
                  lineHeight: 1.2,
                  marginBottom: '1.5rem',
                  fontWeight: 800,
                }}
              >
                Instructor since 1989.
                <br />
                <span style={{ color: GOLD }}>Open 7 days a week.</span>
              </h2>

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(0.9rem, 1.3vw, 1rem)',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.75,
                  marginBottom: '1rem',
                  maxWidth: '44ch',
                }}
              >
                Very friendly, patient, polite and professional instructors. Free pickup and drop off from home, work and school. Open 7 days a week.
              </p>

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'clamp(0.9rem, 1.3vw, 1rem)',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.75,
                  marginBottom: '2rem',
                  maxWidth: '44ch',
                }}
              >
                Cars with <strong style={{ color: GOLD }}>Dual Control system</strong> for students safety which no one else have in local schools.
              </p>

              <div>
                <Link
                  to="/about"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#0a1628',
                    background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_BRIGHT} 100%)`,
                    padding: '0.9rem 2rem',
                    borderRadius: '4px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(253,188,1,0.35)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  READ MORE
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (min-width: 900px) {
            .awards-grid-premium {
              grid-template-columns: 1fr 1fr !important;
            }
          }
        `}</style>
      </section>
    </>
  )
}
