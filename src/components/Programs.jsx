import { useState } from 'react'
import { useSiteSettings } from '../useSiteSettings'

const progCSS = `
  .prog-card {
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.3s ease;
  }
  .prog-card:hover {
    box-shadow: 0 16px 48px rgba(1,69,168,0.1);
  }
  .prog-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
  }
  .prog-img-wrap {
    width: 100%;
    height: 300px;
    overflow: hidden;
    position: relative;
  }
  .prog-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform 0.5s ease;
    background: #F0F4F8;
  }
  .prog-card:hover .prog-img-wrap img {
    transform: scale(1.04);
  }
  .prog-img-overlay {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 50%;
    background: linear-gradient(to top, rgba(1,69,168,0.9), transparent);
  }
  .prog-img-badge {
    position: absolute;
    bottom: 1rem;
    left: 1.5rem;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 0.9rem;
    font-family: var(--font-mono);
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 700;
  }
  .prog-bullet {
    display: flex;
    gap: 0.8rem;
    align-items: flex-start;
  }
  .prog-dot {
    width: 7px; height: 7px;
    background: #FDBC01;
    transform: rotate(45deg);
    margin-top: 0.5rem;
    flex-shrink: 0;
  }
  .prog-accordion-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    padding: 0;
  }
`

function buildPrograms(settings) {
  return [
  {
    id: 'teens',
    label: 'Teenagers',
    title: 'Six hours. Three lessons. One permit sign-off.',
    img: '/teenager-car.png',
    imgFallback: '/teenager-car.png',
    bullets: [
      'Six hours with an instructor, split into three 2-hour lessons',
      'We recommend spacing between each so students can practice',
      'Instructor signs off permit after 1st lesson (can then legally drive with parent)',
    ],
    policyTitle: 'Important Requirements & Fees',
    policy: 'The permit must come to every lesson — it\'s the student\'s responsibility to bring it. A missed permit or late cancellation carries a $60 fee; a flat $60 processing fee applies to any refund.',
    cta: 'Book Teen Lessons',
    href: settings.scheduleLink,
    gradient: 'linear-gradient(90deg, #0145A8, #0145A8)',
    tagBg: '#0145A8',
    tagColor: '#ffffff',
  },
  {
    id: 'adults',
    label: 'Adults',
    title: 'Bring a valid license. Leave with confidence.',
    img: '/prog-adult.png',
    imgFallback: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&h=400&fit=crop',
    bullets: [
      'Adults may train with a valid license from their own country',
      'Must bring license to every lesson',
      'To hold a CA license, adults first need a Learner\'s Permit from the DMV',
    ],
    policyTitle: 'Communication Policy',
    policy: 'Questions go to text only — please don\'t call or leave a voicemail. We reply by text or email, usually the same day.',
    cta: 'Book Adult Lessons',
    href: settings.scheduleLink,
    gradient: 'linear-gradient(90deg, #FDBC01, #FDBC01)',
    tagBg: '#FDBC01',
    tagColor: '#0145A8',
  }
]
}

export default function Programs() {
  const [openId, setOpenId] = useState(null)
  const settings = useSiteSettings()
  const PROGRAMS = buildPrograms(settings)

  return (
    <section id="programs" className="section-pad" style={{ backgroundColor: '#ffffff' }}>
      <style>{progCSS}</style>
      <div className="container">

        <div className="reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', color: '#0145A8' }}>
            <span style={{ width: '20px', height: '2px', background: '#FDBC01', display: 'inline-block' }} />
            Programs
            <span style={{ width: '20px', height: '2px', background: '#FDBC01', display: 'inline-block' }} />
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', color: '#0145A8', marginBottom: '0.75rem' }}>
            The right track for where you are.
          </h2>
          <div style={{ width: '60px', height: '2px', background: 'linear-gradient(90deg, #0145A8, #FDBC01)', margin: '0 auto' }} />
        </div>

        <div className="programs-grid" style={{ display: 'grid' }}>
          {PROGRAMS.map((prog, idx) => (
            <div key={prog.id} className={`prog-card reveal reveal-delay-${idx + 1}`} style={{
              backgroundColor: '#F8FAFD',
              borderBottom: idx === 0 ? '1px solid #E2EBF5' : 'none',
              borderRight: 'none',
            }}>

              {/* IMAGE */}
              <div className="prog-img-wrap">
                <img
                  src={prog.img}
                  alt={prog.label}
                  onError={(e) => { e.target.src = prog.imgFallback }}
                />
                <div className="prog-img-overlay" />
                <div className="prog-img-badge" style={{ background: prog.tagBg, color: prog.tagColor }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  {prog.label}
                </div>
              </div>

              <div style={{ padding: 'clamp(2rem, 3vw, 2.5rem)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)', color: '#0145A8', marginBottom: '2rem', lineHeight: 1.2 }}>
                  {prog.title}
                </h3>

                <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  {prog.bullets.map((b, i) => (
                    <li key={i} className="prog-bullet">
                      <div className="prog-dot" />
                      <span style={{ color: '#364B6B', fontSize: '0.9rem', lineHeight: 1.7 }}>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* Accordion Policy */}
                <div style={{ borderTop: '1px solid #E2EBF5', paddingTop: '1.25rem', marginBottom: '2rem' }}>
                  <button
                    className="prog-accordion-btn"
                    onClick={() => setOpenId(openId === prog.id ? null : prog.id)}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0145A8', fontWeight: 700 }}>
                      {prog.policyTitle}
                    </span>
                    <span style={{
                      color: '#FDBC01',
                      fontSize: '0.7rem',
                      transform: openId === prog.id ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.3s ease',
                    }}>▼</span>
                  </button>
                  <div className={`accordion-body ${openId === prog.id ? 'open' : ''}`}>
                    <p style={{ color: '#8B3A3A', fontSize: '0.82rem', marginTop: '0.75rem', padding: '0.85rem 1rem', lineHeight: 1.65, background: 'rgba(182,59,59,0.04)', borderLeft: '3px solid #B23B3B' }}>
                      {prog.policy}
                    </p>
                  </div>
                </div>

                <a href={prog.href} target="_blank" rel="noopener noreferrer" className="btn-gold" style={{ display: 'inline-flex' }}>
                  {prog.cta}
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>

      <style>{`
        @media (min-width: 1024px) {
          .programs-grid { grid-template-columns: 1fr 1fr !important; }
          .programs-grid > div:first-child {
            border-bottom: none !important;
            border-right: 1px solid #E2EBF5 !important;
          }
        }
      `}</style>
    </section>
  )
}
