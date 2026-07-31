import { Link } from 'react-router-dom'
import { useSiteSettings } from '../useSiteSettings'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'
const DARK_MID = '#0d1f3c'

export default function About() {
  const settings = useSiteSettings()
  return (
    <>
      <style>{`
        @keyframes abFadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes abFadeLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes abFadeRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes abPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(253,188,1,0.3); }
          50% { box-shadow: 0 0 0 12px rgba(253,188,1,0); }
        }
        @keyframes abShine {
          0% { left: -50%; }
          100% { left: 110%; }
        }
        .ab-split-left {
          animation: abFadeLeft 0.8s cubic-bezier(0.22,1,0.36,1) both;
        }
        .ab-split-right {
          animation: abFadeRight 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s both;
        }
        .ab-card-hover {
          transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .ab-card-hover:hover {
          transform: translateY(-8px);
        }
        .ab-feature-card {
          position: relative;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 2rem 1.5rem;
          text-align: center;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .ab-feature-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(253,188,1,0.2);
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }
        .ab-feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, ${SKY_BLUE}, ${GOLD});
        }
        .ab-shine {
          position: relative;
          overflow: hidden;
        }
        .ab-shine::after {
          content: '';
          position: absolute;
          top: 0;
          left: -50%;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          animation: abShine 4s ease-in-out infinite;
          pointer-events: none;
        }
        .ab-img-wrap {
          position: relative;
          overflow: hidden;
          border-radius: var(--radius-md);
        }
        .ab-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.6s ease;
        }
        .ab-img-wrap:hover img {
          transform: scale(1.05);
        }
        .ab-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
        }
        .ab-step-num {
          width: 36px;
          height: 36px;
          min-width: 36px;
          background: linear-gradient(135deg, ${SKY_BLUE}, ${DARK});
          color: #ffffff;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(1,69,168,0.3);
        }
        @media (max-width: 900px) {
          .ab-split-grid {
            grid-template-columns: 1fr !important;
          }
          .ab-split-left {
            order: 2;
          }
          .ab-split-right {
            order: 1;
          }
          .ab-img-wrap {
            min-height: 280px !important;
          }
        }
      `}</style>

      {/* SECTION 1: Split Hero — Instructor Image + School Intro */}
      <section
        style={{
          background: `linear-gradient(135deg, ${DARK} 0%, ${DARK_MID} 50%, ${DARK} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 40%, rgba(1,69,168,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 80% 60%, rgba(253,188,1,0.04) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ padding: '0' }}>
          <div
            className="ab-split-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              minHeight: '600px',
            }}
          >
            {/* Left — Instructor Image */}
            <div className="ab-split-left" style={{ position: 'relative' }}>
              <div className="ab-img-wrap" style={{ height: '100%', minHeight: '500px' }}>
                <img
                  src="/instructor.png"
                  alt="Professional driving instructor teaching student"
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to right, rgba(10,22,40,0.5) 0%, transparent 40%, rgba(10,22,40,0.8) 100%)',
                  pointerEvents: 'none',
                }} />
              </div>

              {/* Floating badge on image */}
              <div style={{
                position: 'absolute',
                bottom: '2rem',
                left: '2rem',
                background: 'rgba(10,22,40,0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(253,188,1,0.2)',
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  animation: 'abPulse 2s ease-in-out infinite',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={DARK}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#ffffff', fontWeight: 800, lineHeight: 1 }}>
                    35+ Years
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: '0.2rem' }}>
                    Teaching Experience
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Content */}
            <div className="ab-split-right" style={{
              padding: 'clamp(3rem, 5vw, 5rem)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <div className="ab-badge" style={{ background: SKY_BLUE, color: '#ffffff', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(1,69,168,0.3)', width: 'fit-content' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                DMV Approved — License #E4566
              </div>

              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                color: '#ffffff',
                lineHeight: 1.1,
                marginBottom: '1.5rem',
                fontWeight: 800,
              }}>
                A Precision
                <br />
                <span style={{ color: GOLD }}>Driving School</span>
              </h2>

              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(0.95rem, 1.3vw, 1.05rem)',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.8,
                marginBottom: '2rem',
                maxWidth: '44ch',
              }}>
                Guaranteed low prices for professional training. We are fully Bonded, Licensed and Insured. Free Pickup and drop off from student's location — home OR school.
              </p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginBottom: '2.5rem',
              }}>
                {[
                  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', text: 'Fully Bonded, Licensed & Insured' },
                  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', text: 'Background-Checked Instructors' },
                  { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', text: 'Free Pickup & Drop-Off' },
                ].map((item) => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(253,188,1,0.1)',
                      border: '1px solid rgba(253,188,1,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.icon} />
                      </svg>
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <Link
                  to="/schedule"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: DARK,
                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
                    padding: '0.85rem 1.8rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
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
                  Book Lessons
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '0.85rem 1.8rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = GOLD
                    e.currentTarget.style.color = GOLD
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                >
                  Online Drivers Ed
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: 4 Feature Cards — Glassmorphism */}
      <section style={{
        background: `linear-gradient(180deg, ${DARK} 0%, ${DARK_MID} 100%)`,
        position: 'relative',
      }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            padding: '5rem 0',
          }}>
            {[
              { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', label: 'WHO WE ARE', text: 'Very friendly, patient, polite and professional looking instructors.' },
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'OUR MISSION', text: 'Cars with Dual control system for students safety.' },
              { icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', label: 'OUR VISION', text: 'Guaranteed low prices for professional training.' },
              { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'OUR PROGRAMS', text: 'Online courses and behind the wheel training.' },
            ].map((f, i) => (
              <div key={f.label} className="ab-feature-card ab-card-hover" style={{ animationDelay: `${i * 0.1}s` }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 1.25rem',
                  background: 'rgba(253,188,1,0.08)',
                  border: '1px solid rgba(253,188,1,0.15)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={f.icon} />
                  </svg>
                </div>
                <h4 style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: GOLD,
                  marginBottom: '0.75rem',
                  fontWeight: 700,
                }}>{f.label}</h4>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '0.88rem',
                  lineHeight: 1.7,
                  margin: 0,
                }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: Dual Control Car — Safety Highlight */}
      <section style={{
        background: `linear-gradient(135deg, ${DARK_MID} 0%, ${DARK} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 70% 50%, rgba(253,188,1,0.03) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div
            className="ab-split-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '3rem',
              alignItems: 'center',
              padding: '5rem 0',
            }}
          >
            {/* Left — Content */}
            <div style={{ order: 1 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: GOLD_DEEP,
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}>
                <span style={{ width: '20px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD})`, display: 'inline-block' }} />
                Student Safety
              </span>

              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                color: '#ffffff',
                lineHeight: 1.15,
                marginBottom: '1.5rem',
                fontWeight: 800,
              }}>
                Dual Control
                <br />
                <span style={{ color: GOLD }}>Vehicles</span>
              </h2>

              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.8,
                marginBottom: '1.5rem',
                maxWidth: '40ch',
              }}>
                Our cars are equipped with <strong style={{ color: '#ffffff' }}>Dual Control systems</strong> — a safety feature that no other local school offers. The instructor can take control of the vehicle at any time, ensuring maximum safety during lessons.
              </p>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'rgba(253,188,1,0.06)',
                border: '1px solid rgba(253,188,1,0.12)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={DARK}>
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>
                    100% Safety Guaranteed
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                    No other local school has this
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Image */}
            <div style={{ order: 2 }}>
              <div className="ab-img-wrap ab-shine" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid rgba(253,188,1,0.1)' }}>
                <img
                  src="/dual-car.png"
                  alt="Dual control car interior"
                  style={{ height: '380px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Scheduling */}
      <section style={{
        background: `linear-gradient(180deg, ${DARK} 0%, ${DARK_MID} 100%)`,
        position: 'relative',
        paddingTop: '5rem',
        paddingBottom: '5rem',
      }}>
        <div className="container">
          <div className="ab-card-hover" style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: 'clamp(2.5rem, 4vw, 3.5rem)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: '4px',
              background: `linear-gradient(180deg, ${SKY_BLUE}, ${GOLD})`,
            }} />

            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              color: '#ffffff',
              marginBottom: '1rem',
              fontWeight: 800,
            }}>
              Scheduling An <span style={{ color: GOLD }}>Appointment</span>
            </h3>

            <p style={{
              fontFamily: 'var(--font-body)',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.8,
              marginBottom: '1.5rem',
              fontSize: '0.95rem',
              maxWidth: '60ch',
            }}>
              To schedule the appointment for 6hrs we recommend to have space in between the lessons so the students can practice.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '2rem' }}>
              {[
                { num: '1', title: 'Basics & Defensive Driving', desc: 'Fundamentals of safe driving on real streets.' },
                { num: '2', title: 'All Kinds of Parking', desc: 'Parallel, perpendicular, hill parking and more.' },
                { num: '3', title: 'Freeway Driving', desc: 'Highway merging, lane changes, and high-speed confidence.' },
              ].map((step) => (
                <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.75rem 0' }}>
                  <div className="ab-step-num">{step.num}</div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}>{step.title}</span>
                    <span style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}> — {step.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/schedule"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: DARK,
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
                padding: '0.85rem 1.8rem',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.3s ease',
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
              Schedule Your Lessons Now
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 5: Student Pass — Success Story + Teenagers/Adults */}
      <section style={{
        background: `linear-gradient(135deg, ${DARK_MID} 0%, ${DARK} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        paddingTop: '5rem',
        paddingBottom: '5rem',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(253,188,1,0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

            {/* Teenagers */}
            <div className="ab-card-hover ab-shine" style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${SKY_BLUE}, ${GOLD})` }} />
              <div style={{ padding: '2rem' }}>
                <div className="ab-badge" style={{ background: SKY_BLUE, color: '#ffffff', marginBottom: '1.25rem', width: 'fit-content' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  Teenagers
                </div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#ffffff', marginBottom: '1rem', fontWeight: 800 }}>
                  6 Hours <span style={{ color: GOLD }}>Required</span>
                </h4>
                <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.8, marginBottom: '0.75rem' }}>
                  Divided into <strong style={{ color: GOLD }}>3 lessons</strong> of 2 hrs each. After taking one 2hr lesson our instructor will sign off the permit and student can legally drive with Parents.
                </p>
                <div style={{
                  background: 'rgba(182,59,59,0.08)',
                  border: '1px solid rgba(182,59,59,0.15)',
                  borderLeft: '3px solid #B23B3B',
                  padding: '1rem 1.25rem',
                  marginTop: '1rem',
                }}>
                  <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.65, margin: 0 }}>
                    <strong style={{ color: '#E57373' }}>Please note:</strong> Permit must be carried at every lesson. Otherwise there will be a <strong>$60 charge</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Success Image */}
            <div className="ab-card-hover" style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(253,188,1,0.1)',
            }}>
              <img
                src="/student-pass.png"
                alt="Student passing driving test"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  minHeight: '300px',
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(10,22,40,0.9) 0%, transparent 50%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: '1.5rem',
                right: '1.5rem',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: GOLD,
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                }}>
                  Success Story
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.1rem',
                  color: '#ffffff',
                  fontWeight: 700,
                }}>
                  99% First-Attempt Pass Rate
                </div>
              </div>
            </div>

            {/* Adults */}
            <div className="ab-card-hover ab-shine" style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${GOLD}, ${SKY_BLUE})` }} />
              <div style={{ padding: '2rem' }}>
                <div className="ab-badge" style={{ background: GOLD, color: DARK, marginBottom: '1.25rem', width: 'fit-content' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  Adults
                </div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#ffffff', marginBottom: '1rem', fontWeight: 800 }}>
                  Own License <span style={{ color: GOLD }}>Required</span>
                </h4>
                <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.8, marginBottom: '0.75rem' }}>
                  Adults can take a driving lesson with their own country License — only if it's valid. They have to bring it to the driving lesson.
                </p>
                <div style={{
                  background: 'rgba(1,69,168,0.1)',
                  border: '1px solid rgba(1,69,168,0.15)',
                  borderLeft: `3px solid ${SKY_BLUE}`,
                  padding: '1rem 1.25rem',
                  marginTop: '1rem',
                }}>
                  <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.65, margin: 0 }}>
                    Text us at <strong style={{ color: GOLD }}>{settings.phone}</strong> or email <strong style={{ color: GOLD }}>{settings.email}</strong>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
