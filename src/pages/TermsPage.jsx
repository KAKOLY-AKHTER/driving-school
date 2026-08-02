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
    title: 'Acceptance of Terms',
    body: 'By accessing or using our website and booking our driving instruction services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree with any part of these terms, please do not use our website or services.',
  },
  {
    title: 'Services',
    body: 'A Precision Driving School provides driver education programs, including online drivers education, behind-the-wheel training, and related services. We are a DMV-licensed driving school (License #E4566) and are fully bonded, licensed, and insured. Program details, pricing, and scheduling are subject to availability and may change at our discretion.',
  },
  {
    title: 'Registrations & Accounts',
    body: 'To enroll in our programs, you must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 16 years of age or have parental consent to use our services.',
  },
  {
    title: 'Pricing & Payments',
    body: 'All prices are displayed in U.S. Dollars. Tuition and lesson fees are due at the time of booking or as otherwise agreed. We accept payment through our secure checkout. Refunds are governed by our refund policy, and no refund is issued once a course or lesson package has been substantially completed. Any applicable taxes or fees will be shown at checkout.',
  },
  {
    title: 'Cancellations & Rescheduling',
    body: 'Lessons may be rescheduled or cancelled subject to reasonable advance notice. Failure to attend a scheduled lesson without notice may result in a forfeited lesson. We understand that unexpected events happen and will work with you to accommodate reasonable requests.',
  },
  {
    title: 'Student Conduct',
    body: 'Students and their parents agree to behave respectfully toward instructors and staff and to follow all safety instructions during training. We reserve the right to dismiss any student whose behavior endangers themselves, our instructors, or others, without refund.',
  },
  {
    title: 'Intellectual Property',
    body: 'All content on our website, including text, graphics, logos, course materials, and software, is the property of A Precision Driving School or its licensors and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works from our content without prior written permission.',
  },
  {
    title: 'Disclaimer of Warranties',
    body: 'Our website and services are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. While we strive for accuracy, we do not warrant that our website will be uninterrupted, error-free, or free of harmful components. DMV test results depend on the individual student and are not guaranteed.',
  },
  {
    title: 'Limitation of Liability',
    body: 'To the maximum extent permitted by law, A Precision Driving School shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of our website or services. Our total liability shall not exceed the amount you paid for the specific service giving rise to the claim.',
  },
  {
    title: 'Governing Law',
    body: 'These Terms of Service shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts located in Contra Costa County, California.',
  },
  {
    title: 'Changes to These Terms',
    body: 'We may revise these Terms of Service at any time by updating this page. Changes become effective immediately upon posting. Your continued use of our website or services after changes are posted constitutes your acceptance of the revised terms. We encourage you to review this page periodically.',
  },
  {
    title: 'Contact Us',
    body: 'If you have any questions about these Terms of Service, please contact us and we will be happy to assist you.',
  },
]

const LAST_UPDATED = 'January 1, 2026'

export default function TermsPage() {
  usePageMeta(
    'Terms of Service — A Precision Driving School',
    'Read the Terms of Service for A Precision Driving School. Understand the terms that govern your use of our website and services.'
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
          paddingTop: '12rem',
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
              Terms of <span style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_BRIGHT} 50%, ${GOLD} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Service</span>
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7,
              maxWidth: '60ch',
              margin: '0 auto',
            }}>
              Please read these terms carefully before using our website or enrolling in our driving programs with {settings.schoolName || 'A Precision Driving School'}.
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
                        href={`#tos-${i}`}
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
                <div key={s.title} id={`tos-${i}`} style={{
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
                  margin: 0,
                }}>
                  Have questions about our terms? We&rsquo;re here to help.
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
                    to="/privacy-policy"
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
                    Privacy Policy
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
