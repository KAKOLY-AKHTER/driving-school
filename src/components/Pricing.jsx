const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'
const DARK_MID = '#0d1f3c'

const DEFAULT_TIERS = [
  { id: '1', planName: 'TEEN ONLINE DRIVERS ED', planPrice: '$24.99', planPriceTwo: '$24.99', options: [
    { text: 'CA DMV- Approved For Permit', permission: 'Included' },
    { text: 'Guaranteed to Pass!', permission: 'Included' },
    { text: 'Complete in Section, Easy & Convenient', permission: 'Included' },
    { text: 'Get Certificate of Completion', permission: 'Included' },
    { text: 'Fast Certificate Processing..', permission: 'Included' },
  ], order: 0 },
  { id: '2', planName: 'BASIC PLAN', planPrice: '$156', planPriceTwo: '$195', options: [
    { text: 'Online Course', permission: 'Included' },
    { text: '2 hours professional Training only', permission: 'Included' },
    { text: '2 Hours Behind-the-Wheel', permission: 'Included' },
    { text: '6-Hour Behind-the-Wheel-Training', permission: 'Not Included' },
    { text: '10-Hour Behind-the-Wheel-Training', permission: 'Not Included' },
  ], order: 1 },
  { id: '3', planName: 'ESSENTIAL PLAN', planPrice: '$445', planPriceTwo: '$499', options: [
    { text: 'Online Course', permission: 'Included' },
    { text: 'Behind the wheel only', permission: 'Included' },
    { text: '2 Hours Behind-the-Wheel', permission: 'Not Included' },
    { text: '6-Hour Behind-the-Wheel-Training', permission: 'Included' },
    { text: 'We will provide the required DL 400D certificate. (Teens Only)', permission: 'Included' },
  ], order: 2 },
  { id: '4', planName: 'IDEAL FOR STUDENTS', planPrice: '$475', planPriceTwo: '$575', options: [
    { text: 'Online Course', permission: 'Included' },
    { text: 'Everything you need to get licensed! Our most popular package!', permission: 'Included' },
    { text: 'Will provide a DL 400C certificate for the online course.', permission: 'Included' },
    { text: '6-Hour Behind-the-Wheel-Training', permission: 'Included' },
    { text: "You'll receive the DL 400D certificate (Teens Only)", permission: 'Included' },
  ], order: 3 },
  { id: '5', planName: 'PREMIER PLAN', planPrice: '$749', planPriceTwo: '$890', options: [
    { text: 'Online Course', permission: 'Included' },
    { text: '6 Hours Behind-the-Wheel', permission: 'Included' },
    { text: 'Plus 4 Extra hours!', permission: 'Included' },
    { text: '10-Hour Training', permission: 'Included' },
    { text: '', permission: 'Select' },
  ], order: 4 },
  { id: '6', planName: 'DMV Drive Test Car Rental', planPrice: '$225', planPriceTwo: '$290', options: [
    { text: 'DMV Drive Test Car Rental with 30 minutes practice', permission: 'Included' },
    { text: "Use the school's car for DMV Drive Test.", permission: 'Included' },
    { text: 'Instructor accompanies you to the DMV.', permission: 'Included' },
    { text: '', permission: 'Select' },
    { text: '', permission: 'Select' },
  ], order: 5 },
  { id: '7', planName: 'DMV Drive Test Car Rental.', planPrice: '$249', planPriceTwo: '$320', options: [
    { text: 'DMV Drive Test Car Rental with 1 hour practice', permission: 'Included' },
    { text: "Use the school's car for DMV Drive Test.", permission: 'Included' },
    { text: 'Instructor accompanies you to the DMV.', permission: 'Included' },
    { text: '', permission: 'Select' },
    { text: '', permission: 'Select' },
  ], order: 6 },
  { id: '8', planName: 'Freeway Focused Course', planPrice: '$200', planPriceTwo: '$249', options: [
    { text: '2-hour special training', permission: 'Included' },
    { text: 'Designed to help drivers feel confident on the freeway', permission: 'Included' },
    { text: 'Designed to teach merging', permission: 'Included' },
    { text: 'Exiting, lane changing, highway laws', permission: 'Included' },
    { text: 'Using dual-control vehicles.', permission: 'Included' },
  ], order: 7 },
]

const priceNumber = (value) => {
  const n = parseFloat(String(value || '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export default function Pricing({ light = false, onEnroll = null, tiers: propTiers = null }) {
  const TIERS = propTiers && propTiers.length ? propTiers : DEFAULT_TIERS
  return (
    <>
      <style>{`
        @keyframes priceCardIn {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes priceGlow {
          0%, 100% { box-shadow: 0 0 30px rgba(253,188,1,0.08), 0 10px 40px rgba(0,0,0,0.2); }
          50% { box-shadow: 0 0 50px rgba(253,188,1,0.15), 0 10px 40px rgba(0,0,0,0.2); }
        }
        @keyframes priceGlowLight {
          0%, 100% { box-shadow: 0 0 20px rgba(253,188,1,0.06), 0 4px 20px rgba(0,0,0,0.06); }
          50% { box-shadow: 0 0 40px rgba(253,188,1,0.12), 0 4px 20px rgba(0,0,0,0.06); }
        }
        @keyframes priceBadgePulse {
          0%, 100% { box-shadow: 0 2px 10px rgba(253,188,1,0.3); }
          50% { box-shadow: 0 4px 20px rgba(253,188,1,0.5); }
        }
        .price-card {
          background: #ffffff;
          border: 1.5px solid #E2EBF5;
          border-radius: var(--radius-lg);
          padding: 2.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
          animation: priceCardIn 0.6s cubic-bezier(0.22,1,0.36,1) both;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }
        .price-card:hover {
          transform: translateY(-10px);
          background: #ffffff;
          border-color: ${GOLD};
          box-shadow: 0 20px 50px rgba(0,0,0,0.08);
        }
        .price-card:nth-child(1) { animation-delay: 0.05s; }
        .price-card:nth-child(2) { animation-delay: 0.1s; }
        .price-card:nth-child(3) { animation-delay: 0.15s; }
        .price-card:nth-child(4) { animation-delay: 0.2s; }
        .price-card:nth-child(5) { animation-delay: 0.25s; }
        .price-card:nth-child(6) { animation-delay: 0.3s; }
        .price-card:nth-child(7) { animation-delay: 0.35s; }
        .price-card:nth-child(8) { animation-delay: 0.4s; }
        .price-card-highlight {
          background: #ffffff !important;
          border: 2px solid ${GOLD} !important;
          border-radius: var(--radius-lg);
          animation: priceCardIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.2s both, priceGlow 3s ease-in-out infinite !important;
          z-index: 2;
          box-shadow: 0 8px 32px rgba(253,188,1,0.12);
        }
        .price-card-highlight:hover {
          border-color: ${GOLD} !important;
          box-shadow: 0 24px 60px rgba(253,188,1,0.15), 0 8px 24px rgba(0,0,0,0.06) !important;
        }
        .price-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, ${SKY_BLUE}, ${GOLD}, transparent);
          transition: background 0.3s ease;
        }
        .price-card:hover::before {
          background: linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT});
        }
        .price-card-highlight::before {
          background: linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT}) !important;
          height: 4px;
        }
        .price-card-light {
          background: #ffffff;
          border: 1px solid #E2EBF5;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .price-card-light:hover {
          background: #ffffff;
          border-color: rgba(253,188,1,0.3);
          box-shadow: 0 16px 48px rgba(0,0,0,0.1);
          transform: translateY(-10px);
        }
        .price-card-light .price-card-highlight {
          background: linear-gradient(135deg, rgba(253,188,1,0.05) 0%, rgba(1,69,168,0.04) 100%) !important;
          border: 1px solid rgba(253,188,1,0.25) !important;
          animation: priceCardIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.2s both, priceGlowLight 3s ease-in-out infinite !important;
        }
        .price-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT});
          padding: 0.3rem 0.8rem;
          font-family: var(--font-mono);
          font-size: 0.55rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${DARK};
          font-weight: 700;
          animation: priceBadgePulse 2s ease-in-out infinite;
        }
        .price-scroll {
          display: flex;
          gap: 1rem;
          width: max-content;
          padding-bottom: 0.5rem;
        }
        .price-scroll::-webkit-scrollbar { display: none; }
        .price-scroll { scrollbar-width: none; }
        .price-scroll-hint {
          display: none;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(10,22,40,0.35);
          animation: priceScrollHint 2s ease-in-out infinite;
        }
        @keyframes priceScrollHint {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @media (min-width: 768px) {
          .price-scroll {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            width: 100%;
            gap: 0;
          }
          .price-card {
            border-radius: 0;
            border-right: 1px solid rgba(255,255,255,0.04);
          }
          .price-card:last-child { border-right: none; }
        }
        @media (max-width: 767px) {
          .price-scroll {
            width: max-content;
          }
          .price-card {
            min-width: 280px;
            flex-shrink: 0;
          }
          .price-scroll-hint {
            display: flex !important;
          }
        }
      `}</style>

      <section
        id="pricing"
        className="section-pad"
        style={{
          background: light ? '#ffffff' : `linear-gradient(180deg, ${DARK_MID} 0%, ${DARK} 50%, ${DARK_MID} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: light ? 'none' : 'radial-gradient(ellipse at 50% 30%, rgba(253,188,1,0.03) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
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
              Pricing
              <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, ${GOLD}, transparent)`, display: 'inline-block' }} />
            </p>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              color: light ? '#0a1628' : '#ffffff',
              marginBottom: '0.5rem',
              fontWeight: 800,
            }}>
              Simple, transparent <span style={{ color: GOLD }}>pricing.</span>
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
              color: light ? 'rgba(10,22,40,0.6)' : 'rgba(255,255,255,0.65)',
              maxWidth: '32rem',
              marginInline: 'auto',
            }}>
              All packages include free online driver's education
            </p>
          </div>

          {/* Cards */}
          <div style={{ overflow: 'auto', marginInline: '-1rem', paddingInline: '1rem' }}>
            <div className="price-scroll">
              {TIERS.map((tier) => (
                <div key={tier.id} className={`price-card${light ? ' price-card-light' : ''}${tier.planName === 'IDEAL FOR STUDENTS' ? ' price-card-highlight' : ''}`}>
                  {/* Plan Name */}
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.15rem',
                    color: '#0a1628',
                    marginBottom: '1rem',
                    fontWeight: 700,
                    minHeight: '2.8rem',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {tier.planName}
                  </h3>

                  {/* Prices */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    <div>
                      <span style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.55rem',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#64748B',
                        fontWeight: 600,
                        display: 'block',
                        marginBottom: '0.15rem',
                      }}>
                        Today's Price
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '2rem',
                        color: GOLD,
                        fontWeight: 800,
                        lineHeight: 1,
                      }}>
                        {tier.planPrice}
                      </span>
                    </div>
                    {tier.planPriceTwo && tier.planPriceTwo !== tier.planPrice && (
                      <div style={{ paddingTop: '0.9rem' }}>
                        <span style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1rem',
                          color: '#94A3B8',
                          fontWeight: 600,
                          lineHeight: 1,
                          textDecoration: 'line-through',
                        }}>
                          {tier.planPriceTwo}
                        </span>
                        {priceNumber(tier.planPriceTwo) > priceNumber(tier.planPrice) && (
                          <span style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            color: '#16A34A',
                            background: 'rgba(34,197,94,0.1)',
                            border: '1px solid rgba(34,197,94,0.2)',
                            borderRadius: '999px',
                            padding: '0.15rem 0.45rem',
                            display: 'block',
                            marginTop: '0.3rem',
                            width: 'fit-content',
                            letterSpacing: '0.03em',
                          }}>
                            Save ${priceNumber(tier.planPriceTwo) - priceNumber(tier.planPrice)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{
                    width: '100%',
                    height: '1px',
                    background: 'rgba(10,22,40,0.08)',
                    marginBottom: '1.25rem',
                  }} />

                  {/* Options */}
                  <ul style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.7rem',
                    flexGrow: 1,
                    marginBottom: '2rem',
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 2rem 0',
                  }}>
                    {tier.options.map((opt, i) => (
                      <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                        {opt.permission === 'Included' ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '3px' }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : opt.permission === 'Not Included' ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '3px' }}>
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '3px' }}>
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        )}
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          color: opt.permission === 'Included' ? 'rgba(10,22,40,0.75)' : opt.permission === 'Not Included' ? 'rgba(10,22,40,0.45)' : 'rgba(10,22,40,0.4)',
                          fontSize: '0.85rem',
                          lineHeight: 1.5,
                          textDecoration: opt.permission === 'Not Included' ? 'line-through' : 'none',
                        }}>
                          {opt.text}
                          {!opt.text && (
                            <span style={{ fontStyle: 'italic', fontSize: '0.7rem' }}>{opt.permission}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {onEnroll ? (
                    <button
                      onClick={() => onEnroll(tier)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.85rem 1.5rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.65rem',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        border: 'none',
                        cursor: 'pointer',
                        color: DARK,
                        background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
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
                      Enroll Now
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="price-scroll-hint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Swipe to see more
          </div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'rgba(10,22,40,0.35)',
            marginTop: '2.5rem',
            textAlign: 'center',
          }}>
            *Advanced driving upon instructor's discretion.
          </p>
        </div>
      </section>
    </>
  )
}
