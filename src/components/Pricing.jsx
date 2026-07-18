const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'
const DARK_MID = '#0d1f3c'

const TIERS = [
  {
    name: 'Online Driver\'s Ed',
    price: '$39.99',
    period: 'one-time',
    tagline: 'DMV Test Only · Online Only',
    features: [
      'Fully online state-approved course',
      '1 lesson or DMV Test Only',
    ],
    cta: 'Get Started',
    href: 'https://www.aprecisiondrivingschool.com/script/register.php',
    highlight: false,
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    name: 'Basic',
    price: '$210',
    period: null,
    tagline: 'DMV Test Only',
    features: [
      'Online course included',
      '2 hrs professional training',
      '2 Hours Behind-the-Wheel',
    ],
    cta: 'Choose Basic',
    href: 'https://www.aprecisiondrivingschool.com/schedule/cart_home.html',
    highlight: false,
    icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  },
  {
    name: 'Essential',
    price: '$599',
    period: null,
    tagline: 'Test Included',
    features: [
      'Online course included',
      'Behind-the-wheel only',
      '6-Hour Behind-the-Wheel Training',
    ],
    cta: 'Choose Essential',
    href: 'https://www.aprecisiondrivingschool.com/schedule/cart_home.html',
    highlight: false,
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    name: 'Ideal for Students',
    badge: 'Most Popular',
    price: '$615',
    period: null,
    tagline: 'DMV Test Included',
    features: [
      'Online course included',
      'Everything needed to get licensed',
      '6-Hour Behind-the-Wheel Training',
    ],
    cta: 'Choose Ideal',
    href: 'https://www.aprecisiondrivingschool.com/schedule/cart_home.html',
    highlight: true,
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  },
  {
    name: 'Premier',
    price: '$999',
    period: null,
    tagline: 'Advanced Track',
    features: [
      'Online course included',
      '6 hrs behind-the-wheel + 4 extra hrs',
      '10-Hour Behind-the-Wheel Training*',
    ],
    cta: 'Choose Premier',
    href: 'https://www.aprecisiondrivingschool.com/schedule/cart_home.html',
    highlight: false,
    icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  },
]

export default function Pricing({ light = false }) {
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
          border-radius: 16px;
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
        .price-card-highlight {
          background: #ffffff !important;
          border: 2px solid ${GOLD} !important;
          border-radius: 16px;
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
        @media (min-width: 768px) {
          .price-scroll {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
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
            min-width: 260px;
            flex-shrink: 0;
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
              color: light ? 'rgba(10,22,40,0.45)' : 'rgba(255,255,255,0.45)',
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
                <div key={tier.name} className={`price-card${light ? ' price-card-light' : ''}${tier.highlight ? ' price-card-highlight' : ''}`}>

                  {tier.badge && (
                    <div className="price-badge">{tier.badge}</div>
                  )}

                  {/* Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: tier.highlight ? 'rgba(253,188,1,0.1)' : 'rgba(1,69,168,0.06)',
                    border: `1px solid ${tier.highlight ? 'rgba(253,188,1,0.2)' : 'rgba(1,69,168,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem',
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={tier.highlight ? GOLD : SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={tier.icon} />
                    </svg>
                  </div>

                  {/* Tagline */}
                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'rgba(10,22,40,0.4)',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                  }}>
                    {tier.tagline}
                  </p>

                  {/* Name */}
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.15rem',
                    color: '#0a1628',
                    marginBottom: '1rem',
                    fontWeight: 700,
                  }}>
                    {tier.name}
                  </h3>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '1.5rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '2.2rem',
                      color: tier.highlight ? GOLD_BRIGHT : GOLD,
                      fontWeight: 800,
                      lineHeight: 1,
                    }}>
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.6rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'rgba(10,22,40,0.35)',
                      }}>
                        /{tier.period}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{
                    width: '100%',
                    height: '1px',
                    background: tier.highlight ? 'rgba(253,188,1,0.15)' : 'rgba(10,22,40,0.08)',
                    marginBottom: '1.5rem',
                  }} />

                  {/* Features */}
                  <ul style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    flexGrow: 1,
                    marginBottom: '2rem',
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 2rem 0',
                  }}>
                    {tier.features.map((f) => (
                      <li key={f} style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={tier.highlight ? GOLD : SKY_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '3px' }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span style={{
                          fontFamily: 'var(--font-body)',
                          color: 'rgba(10,22,40,0.6)',
                          fontSize: '0.85rem',
                          lineHeight: 1.5,
                        }}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <a
                    href={tier.href}
                    target="_blank"
                    rel="noopener noreferrer"
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
                      ...(tier.highlight
                        ? {
                            color: DARK,
                            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
                          }
                        : {
                            color: SKY_BLUE,
                            background: 'transparent',
                            border: '1px solid rgba(1,69,168,0.2)',
                          }),
                    }}
                    onMouseEnter={(e) => {
                      if (tier.highlight) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(253,188,1,0.35)'
                      } else {
                        e.currentTarget.style.borderColor = GOLD
                        e.currentTarget.style.color = GOLD
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (tier.highlight) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      } else {
                        e.currentTarget.style.borderColor = 'rgba(1,69,168,0.2)'
                        e.currentTarget.style.color = SKY_BLUE
                      }
                    }}
                  >
                    {tier.cta}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Footnote */}
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
