import { Link } from 'react-router-dom'
import CTABanner from '../components/CTABanner'
import { usePageMeta } from '../usePageMeta'
import { useSiteSettings } from '../useSiteSettings'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'
const DARK_MID = '#0d1f3c'

const SECTIONS = [
  {
    title: 'Information We Collect',
    body: 'We collect information you provide directly, such as your name, email address, phone number, mailing address, date of birth, and payment details when you register for lessons, book appointments, or contact us. We also automatically collect limited usage information, including device type, browser type, and pages visited, to help us understand how our website is used and to improve your experience.',
  },
  {
    title: 'How We Use Your Information',
    body: 'The information we collect is used to schedule and manage driving lessons, process payments, communicate with you about bookings and updates, respond to your inquiries, and comply with legal and regulatory obligations. We may also use aggregated, non-identifying information for internal analytics.',
  },
  {
    title: 'Information Sharing',
    body: 'We do not sell, rent, or trade your personal information to third parties. We only share information with trusted service providers who help us operate our business, such as payment processors and scheduling platforms, and only to the extent necessary to provide our services. We may disclose information where required by law or to protect the rights, property, or safety of our school, our students, or others.',
  },
  {
    title: 'Data Security',
    body: 'We take reasonable and appropriate measures, including encryption and secure storage practices, to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or method of electronic storage is 100% secure, and we cannot guarantee absolute security.',
  },
  {
    title: 'Cookies & Analytics',
    body: 'Our website may use cookies and similar technologies to remember your preferences, keep you signed in, and understand how visitors interact with the site. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. If you disable cookies, some features of the website may not function properly.',
  },
  {
    title: 'Your Rights & Choices',
    body: 'You may access, update, correct, or request deletion of your personal information at any time by logging into your student dashboard or by contacting us directly. You may also opt out of receiving promotional communications at any time. We will respond to your request within a reasonable timeframe and in accordance with applicable law.',
  },
  {
    title: 'Children\u2019s Privacy',
    body: 'Our services may be used by minors under the supervision of a parent or legal guardian. We do not knowingly collect personal information from children without parental consent. If you believe a child has provided us with personal information, please contact us and we will take steps to remove that information.',
  },
  {
    title: 'Third-Party Links',
    body: 'Our website may contain links to third-party websites, such as payment platforms or the DMV. We are not responsible for the privacy practices or content of those external sites. We encourage you to review the privacy policies of any third-party website you visit.',
  },
  {
    title: 'Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will post any changes on this page and update the effective date below. We encourage you to review this page periodically to stay informed about how we protect your information.',
  },
  {
    title: 'Contact Us',
    body: 'If you have any questions or concerns about this Privacy Policy or the handling of your personal information, please contact us and we will be happy to assist you.',
  },
]

const LAST_UPDATED = 'January 1, 2026'

export default function PrivacyPolicyPage() {
  usePageMeta(
    'Privacy Policy — A Precision Driving School',
    'Read the Privacy Policy for A Precision Driving School. Learn how we collect, use, and protect your personal information.'
  )
  const settings = useSiteSettings()

  return (
    <>
      <style>{`
        @keyframes legalFadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .legal-fade {
          animation: legalFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both;
        }
        @media (min-width: 900px) {
          .legal-sidebar { grid-template-columns: 260px 1fr !important; }
        }
      `}</style>

      {/* HERO */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${DARK} 0%, ${DARK_MID} 50%, ${DARK} 100%)`,
          paddingTop: '15rem',
          paddingBottom: '6rem',
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
          <div className="legal-fade">
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: GOLD_DEEP,
              fontWeight: 700,
              marginBottom: '1rem',
            }}>
              Last Updated: {LAST_UPDATED}
            </p>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              color: '#ffffff',
              lineHeight: 1.1,
              fontWeight: 800,
              marginBottom: '1.5rem',
            }}>
              Privacy <span style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_BRIGHT} 50%, ${GOLD} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Policy</span>
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7,
              maxWidth: '60ch',
              margin: '0 auto',
            }}>
              Your privacy matters to us. This policy explains how {settings.schoolName || 'A Precision Driving School'} collects, uses, and protects the personal information you share with us.
            </p>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ background: '#ffffff', paddingTop: '5rem', paddingBottom: '5rem' }}>
        <div className="container">
          <div className="legal-sidebar" style={{ display: 'grid', gap: '3rem' }}>

            {/* Sidebar nav */}
            <aside>
              <div style={{
                position: 'sticky',
                top: '8rem',
                border: '1px solid #E2EBF5',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                background: `linear-gradient(160deg, ${DARK} 0%, ${DARK_MID} 100%)`,
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: GOLD,
                  fontWeight: 700,
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                }}>
                  <span style={{ width: '20px', height: '2px', background: `linear-gradient(90deg, ${GOLD}, transparent)`, display: 'inline-block' }} />
                  On This Page
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {SECTIONS.map((s, i) => (
                    <li key={s.title}>
                      <a
                        href={`#pp-${i}`}
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.82rem',
                          color: 'rgba(255,255,255,0.6)',
                          textDecoration: 'none',
                          transition: 'color 0.3s ease',
                          padding: '0.35rem 0',
                          display: 'block',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = GOLD }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* Sections */}
            <div>
              {SECTIONS.map((s, i) => (
                <div key={s.title} id={`pp-${i}`} style={{
                  border: '1px solid #E2EBF5',
                  borderLeft: `3px solid ${GOLD}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.8rem 2rem',
                  marginBottom: '1.5rem',
                  scrollMarginTop: '8rem',
                  transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(1,69,168,0.08), 0 4px 16px rgba(253,188,1,0.06)'
                    e.currentTarget.style.transform = 'translateY(-3px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: '#ffffff',
                      background: `linear-gradient(135deg, ${SKY_BLUE}, ${DARK})`,
                      width: '28px',
                      height: '28px',
                      minWidth: '28px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h2 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.2rem',
                      color: SKY_BLUE,
                      fontWeight: 700,
                      margin: 0,
                      lineHeight: 1.3,
                    }}>
                      {s.title}
                    </h2>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.92rem',
                    color: '#364B6B',
                    lineHeight: 1.8,
                    margin: 0,
                    paddingLeft: '2.5rem',
                  }}>
                    {s.body}
                  </p>
                </div>
              ))}

              <div style={{
                border: '1px solid rgba(253,188,1,0.25)',
                background: 'rgba(253,188,1,0.05)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                textAlign: 'center',
                marginTop: '2rem',
              }}>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  color: '#364B6B',
                  lineHeight: 1.7,
                  marginBottom: '1.25rem',
                  margin: 0,
                }}>
                  Have questions about your privacy? We&rsquo;re here to help.
                </p>
                <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.25rem' }}>
                  <Link
                    to="/contact"
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
                      padding: '0.8rem 1.6rem',
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
                    Contact Us
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    to="/terms"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: SKY_BLUE,
                      background: 'transparent',
                      border: '1px solid rgba(1,69,168,0.3)',
                      padding: '0.8rem 1.6rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = GOLD
                      e.currentTarget.style.color = GOLD_DEEP
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(1,69,168,0.3)'
                      e.currentTarget.style.color = SKY_BLUE
                    }}
                  >
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
