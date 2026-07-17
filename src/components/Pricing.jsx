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
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="section-pad" style={{ backgroundColor: 'var(--color-ink-soft)' }}>
      <div className="container">
        
        <div className="reveal" style={{ marginBottom: '4rem', textAlign: 'center' }}>
          <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
            <span className="gold-bar" style={{ width: '20px' }} />
            Pricing
            <span className="gold-bar" style={{ width: '20px' }} />
          </p>
          <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', color: 'var(--color-paper)' }}>
            Simple, transparent pricing.
          </h2>
          <p style={{ color: 'var(--color-paper-muted)', marginTop: '1rem' }}>
            All packages include free online driver's education.
          </p>
        </div>

        {/* Desktop Grid / Mobile Scroll */}
        <div className="pricing-container">
          <div className="pricing-scroll-area">
            {TIERS.map((tier, i) => (
              <div key={tier.name} className={`pricing-card reveal reveal-delay-${i + 1} ${tier.highlight ? 'pricing-highlight' : ''}`}>
                
                {tier.badge && (
                  <div style={{ position: 'absolute', top: '-1px', left: '1.5rem', background: 'var(--color-ink)', padding: '0.2rem 1rem', border: '1px solid var(--color-gold-deep)', borderTop: 'none' }}>
                    <span className="shimmer-badge">{tier.badge}</span>
                  </div>
                )}

                <div className="eyebrow" style={{ color: 'var(--color-steel-light)', marginTop: tier.badge ? '1.5rem' : '0' }}>{tier.tagline}</div>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--color-paper)', marginBlock: '0.5rem 1.5rem' }}>{tier.name}</h3>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '2rem' }}>
                  <span className="mono-stat" style={{ fontSize: '2.5rem', color: tier.highlight ? 'var(--color-gold-bright)' : 'var(--color-gold)' }}>
                    {tier.price}
                  </span>
                  {tier.period && <span className="eyebrow" style={{ color: 'var(--color-paper-muted)' }}>/{tier.period}</span>}
                </div>

                <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1, marginBottom: '2.5rem' }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '4px' }}>
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span style={{ color: 'var(--color-paper-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <a href={tier.href} target="_blank" rel="noopener noreferrer" className={tier.highlight ? 'btn-gold' : 'btn-ghost'} style={{ width: '100%', justifyContent: 'center' }}>
                  {tier.cta}
                </a>

              </div>
            ))}
          </div>
        </div>

        <p className="eyebrow" style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--color-paper-muted)' }}>
          *Advanced driving upon instructor's discretion.
        </p>

      </div>

      <style>{`
        .pricing-container {
          margin-inline: -1.25rem;
          padding-inline: 1.25rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .pricing-container::-webkit-scrollbar { display: none; }
        
        .pricing-scroll-area {
          display: flex;
          gap: 1rem;
          width: max-content;
        }
        
        .pricing-card {
          width: 280px;
          background: var(--color-ink);
          border: 1px solid var(--color-ink-line);
          padding: 2.5rem 1.5rem;
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 768px) {
          .pricing-container { margin-inline: 0; padding-inline: 0; overflow-x: visible; }
          .pricing-scroll-area { display: grid; grid-template-columns: repeat(2, 1fr); width: 100%; }
          .pricing-card { width: auto; }
        }
        
        @media (min-width: 1200px) {
          .pricing-scroll-area { grid-template-columns: repeat(5, 1fr); gap: 0; border: 1px solid var(--color-ink-line); }
          .pricing-card { border: none; border-right: 1px solid var(--color-ink-line); }
          .pricing-card:last-child { border-right: none; }
          .pricing-highlight { margin-inline: -1px; z-index: 2; }
        }
      `}</style>
    </section>
  )
}
