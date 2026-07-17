import { useState } from 'react'

const PROGRAMS = [
  {
    id: 'teens',
    label: 'Teenagers',
    title: 'Six hours. Three lessons. One permit sign-off.',
    bullets: [
      'Six hours with an instructor, split into three 2-hour lessons',
      'We recommend spacing between each so students can practice',
      'Instructor signs off permit after 1st lesson (can then legally drive with parent)',
    ],
    policyTitle: 'Important Requirements & Fees',
    policy: 'The permit must come to every lesson — it\'s the student\'s responsibility to bring it. A missed permit or late cancellation carries a $60 fee; a flat $60 processing fee applies to any refund.',
    cta: 'Book Teen Lessons',
    href: 'https://www.aprecisiondrivingschool.com/schedule/cart_home.html'
  },
  {
    id: 'adults',
    label: 'Adults',
    title: 'Bring a valid license. Leave with confidence.',
    bullets: [
      'Adults may train with a valid license from their own country',
      'Must bring license to every lesson',
      'To hold a CA license, adults first need a Learner\'s Permit from the DMV',
    ],
    policyTitle: 'Communication Policy',
    policy: 'Questions go to text only — please don\'t call or leave a voicemail. We reply by text or email, usually the same day.',
    cta: 'Book Adult Lessons',
    href: 'https://www.aprecisiondrivingschool.com/schedule/cart_home.html'
  }
]

export default function Programs() {
  const [openId, setOpenId] = useState(null)

  return (
    <section id="programs" className="section-pad">
      <div className="container">
        
        <div className="reveal" style={{ marginBottom: '4rem' }}>
          <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
            <span className="gold-bar" />
            Programs
          </p>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', color: 'var(--color-paper)' }}>
            The right track for where you are.
          </h2>
        </div>

        <div className="programs-grid" style={{ display: 'grid', border: '1px solid var(--color-ink-line)' }}>
          {PROGRAMS.map((prog, idx) => (
            <div key={prog.id} className={`reveal reveal-delay-${idx + 1}`} style={{
              padding: 'clamp(2rem, 4vw, 4rem)',
              backgroundColor: idx === 0 ? 'var(--color-ink-surface)' : 'var(--color-ink)',
              borderBottom: idx === 0 ? '1px solid var(--color-ink-line)' : 'none',
              borderRight: 'none', // handled in media query
            }}>
              
              <div className="eyebrow-gold" style={{ marginBottom: '1.5rem' }}>{prog.label}</div>
              
              <h3 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', color: 'var(--color-paper)', marginBottom: '2.5rem', maxWidth: '18ch' }}>
                {prog.title}
              </h3>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
                {prog.bullets.map((b, i) => (
                  <li key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-gold)', transform: 'rotate(45deg)', marginTop: '0.5rem', flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-paper-muted)', lineHeight: 1.6 }}>{b}</span>
                  </li>
                ))}
              </ul>

              {/* Accordion Policy */}
              <div style={{ borderTop: '1px solid var(--color-ink-line)', paddingTop: '1.5rem', marginBottom: '2.5rem' }}>
                <button 
                  onClick={() => setOpenId(openId === prog.id ? null : prog.id)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-paper)', textAlign: 'left' }}
                >
                  <span className="eyebrow" style={{ color: 'var(--color-steel-light)' }}>{prog.policyTitle}</span>
                  <span style={{ color: 'var(--color-gold)', transform: openId === prog.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>▼</span>
                </button>
                <div className={`accordion-body ${openId === prog.id ? 'open' : ''}`}>
                  <p style={{ color: 'var(--color-signal)', fontSize: '0.85rem', marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(178,59,59,0.05)', borderLeft: '2px solid var(--color-signal)' }}>
                    {prog.policy}
                  </p>
                </div>
              </div>

              <a href={prog.href} target="_blank" rel="noopener noreferrer" className={idx === 0 ? 'btn-gold' : 'btn-ghost'}>
                {prog.cta}
              </a>

            </div>
          ))}
        </div>

      </div>

      <style>{`
        @media (min-width: 1024px) {
          .programs-grid { grid-template-columns: 1fr 1fr !important; }
          .programs-grid > div:first-child { 
            border-bottom: none !important; 
            border-right: 1px solid var(--color-ink-line) !important;
          }
        }
      `}</style>
    </section>
  )
}
