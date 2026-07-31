import { Link } from 'react-router-dom'
import CTABanner from '../components/CTABanner'
import { usePageMeta } from '../usePageMeta'
import { useSiteSettings, phoneHref } from '../useSiteSettings'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'
const DARK_MID = '#0d1f3c'

const PILLARS = [
  {
    title: 'Who We Are',
    desc: 'Very friendly, patient, polite and professional looking instructors.',
    icon: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  },
  {
    title: 'Our Mission',
    desc: 'Cars with Dual Control system for students safety.',
    icon: 'M12 3a9 9 0 100 18 9 9 0 000-18z M12 8v4l3 3',
  },
  {
    title: 'Our Vision',
    desc: 'Guaranteed low prices for professional training.',
    icon: 'M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5L8 13.8 2 9.2h7.6L12 2z',
  },
  {
    title: 'Our Programs',
    desc: 'Online courses and behind the wheel training.',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
]

const SERVICES = [
  {
    title: 'Best Time Training',
    desc: 'Free pickup and drop off from home, work and school. Open 7 days a week.',
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'We Train All Ages',
    desc: 'We take into account the age of individual needs. Cars with Dual Control system for students safety.',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  {
    title: 'Calm Instructor',
    desc: 'We take into account the age of individual needs. Cars with Dual Control system for students safety.',
    icon: 'M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4 8.8h6.1L12 3z',
  },
  {
    title: 'Professional Training',
    desc: 'Very friendly, patient, polite and professional looking instructors. Instructor since 1989.',
    icon: 'M12 3v12m0 0a3 3 0 100 6 3 3 0 000-6zm0-4v4M5 5h14l-1.5 4h-11L5 5z',
  },
]

const TRUST = [
  { num: '1989', label: 'Instructing Since' },
  { num: '99%', label: 'DMV Pass Rate' },
  { num: '5K+', label: 'Students Trained' },
  { num: '100%', label: 'Background Checked' },
]

export default function AboutPage() {
  usePageMeta(
    'About Us — A Precision Driving School San Ramon CA',
    'A Precision Driving School is DMV-licensed (License #E4566), fully bonded, licensed and insured. Free pickup & drop from home or school, dual-control cars for safety, professional instructors since 1989.'
  )
  const settings = useSiteSettings()

  return (
    <>
      <style>{`
        @keyframes aboutFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes aboutFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .ab-page-fade {
          animation: aboutFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        .ab-page-fade:nth-child(2) { animation-delay: 0.15s; }
        .ab-page-fade:nth-child(3) { animation-delay: 0.3s; }
        .ab-page-fade:nth-child(4) { animation-delay: 0.45s; }
        @media (min-width: 900px) {
          .ab-pillars-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ab-services-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* HERO */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${DARK} 0%, ${DARK_MID} 50%, ${DARK} 100%)`,
          paddingTop: '7rem',
          paddingBottom: '7rem',
          textAlign: 'center',
        }}
      >
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 30% 20%, rgba(253,188,1,0.07) 0%, transparent 55%)',
          pointerEvents: 'none',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 75% 80%, rgba(1,69,168,0.12) 0%, transparent 55%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="ab-page-fade">
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: GOLD_DEEP,
              fontWeight: 700,
              marginBottom: '1rem',
            }}>
              DMV Licensed &bull; License #E4566
            </p>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
              color: '#ffffff',
              lineHeight: 1.1,
              fontWeight: 800,
              marginBottom: '1.5rem',
            }}>
              A Precision<br />
              <span style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_BRIGHT} 50%, ${GOLD} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Driving School
              </span>
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7,
              maxWidth: '60ch',
              margin: '0 auto 1.5rem',
            }}>
              Approved by the DMV. License #E4566. Guaranteed low prices for professional training.
              We are fully <strong style={{ color: GOLD }}>Bonded, Licensed and Insured</strong>.
              Free pickup and drop off from students&rsquo; location home OR school.
              Our instructors have gone through a full background check.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
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
              <a
                href={phoneHref(settings.phone)}
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
                {settings.phone}
              </a>
            </div>
          </div>

          {/* Trust strip */}
          <div className="ab-page-fade" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '1rem',
            border: '1px solid rgba(253,188,1,0.12)',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem 1rem',
          }}>
            {TRUST.map(t => (
              <div key={t.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: GOLD,
                  lineHeight: 1,
                }}>
                  {t.num}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '0.4rem',
                  fontWeight: 600,
                }}>
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PILLARS: Who We Are / Mission / Vision / Programs */}
      <section style={{ background: '#ffffff', paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: GOLD_DEEP,
              fontWeight: 700,
              marginBottom: '1rem',
            }}>
              What We Stand For
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              color: SKY_BLUE,
              fontWeight: 800,
              lineHeight: 1.15,
            }}>
              Our School in <span style={{ color: GOLD_DEEP }}>Four Pillars</span>
            </h2>
          </div>

          <div className="ab-pillars-grid" style={{ display: 'grid', gap: '1.5rem' }}>
            {PILLARS.map(p => (
              <div
                key={p.title}
                style={{
                  background: `linear-gradient(160deg, ${DARK} 0%, ${DARK_MID} 100%)`,
                  border: '1px solid rgba(253,188,1,0.12)',
                  borderLeft: `3px solid ${GOLD}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '2rem',
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'flex-start',
                  transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(1,69,168,0.12), 0 4px 16px rgba(253,188,1,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  minWidth: '52px',
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(253,188,1,0.1)',
                  border: '1px solid rgba(253,188,1,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={p.icon} />
                  </svg>
                </div>
                <div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.15rem',
                    color: '#ffffff',
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                  }}>
                    {p.title}
                  </h3>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.92rem',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.7,
                    margin: 0,
                  }}>
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(180deg, ${DARK_MID} 0%, ${DARK} 100%)`,
          paddingTop: '5rem',
          paddingBottom: '5rem',
        }}
      >
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 20% 20%, rgba(253,188,1,0.05) 0%, transparent 55%)',
          pointerEvents: 'none',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: GOLD_DEEP,
              fontWeight: 700,
              marginBottom: '1rem',
            }}>
              Our Services
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
              color: '#ffffff',
              fontWeight: 800,
              lineHeight: 1.15,
            }}>
              Training That <span style={{ color: GOLD }}>Fits Your Life</span>
            </h2>
          </div>

          <div className="ab-services-grid" style={{ display: 'grid', gap: '1.5rem' }}>
            {SERVICES.map((s, i) => (
              <div
                key={s.title}
                className="ab-page-fade"
                style={{
                  background: '#ffffff',
                  border: '1px solid #E2EBF5',
                  borderRadius: 'var(--radius-md)',
                  padding: '2rem',
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'flex-start',
                  animationDelay: `${0.1 + i * 0.1}s`,
                  transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1), 0 4px 16px rgba(253,188,1,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  minWidth: '52px',
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-sm)',
                  background: `linear-gradient(135deg, ${SKY_BLUE}, ${DARK})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.icon} />
                  </svg>
                </div>
                <div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.15rem',
                    color: SKY_BLUE,
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                  }}>
                    {s.title}
                  </h3>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.92rem',
                    color: '#364B6B',
                    lineHeight: 1.7,
                    margin: 0,
                  }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BADGES */}
      <section style={{ background: '#ffffff', paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { label: 'Fully Bonded, Licensed & Insured', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { label: 'Approved by the DMV', icon: 'M12 3l1.9 5.8H20l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8L4 8.8h6.1L12 3z' },
              { label: 'Dual Control Cars for Safety', icon: 'M9 3v3m6-3v3M5 9h14M7 21l-2-6a4 4 0 018 0l-2 6m6-6l-2 6' },
              { label: 'Background Checked Instructors', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            ].map(b => (
              <div
                key={b.label}
                style={{
                  border: '1px solid #E2EBF5',
                  borderTop: `3px solid ${GOLD}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  background: 'rgba(1,69,168,0.08)',
                  border: '1px solid rgba(1,69,168,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={b.icon} />
                  </svg>
                </div>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#364B6B',
                  lineHeight: 1.5,
                  display: 'block',
                }}>
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
