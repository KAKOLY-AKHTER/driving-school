const GOLD = '#FDBC01'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

export default function CTABanner() {
  return (
    <>
      <style>{`
        @keyframes ctaFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes ctaPulseRing {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes ctaShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ctaGradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ctaStarFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }
        .cta-main-card {
          position: relative;
          background: linear-gradient(135deg, ${DARK} 0%, #0d1f3c 50%, ${DARK} 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: clamp(3rem, 6vw, 5rem) clamp(2rem, 4vw, 4rem);
          overflow: hidden;
        }
        .cta-main-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${GOLD}, ${SKY_BLUE}, ${GOLD}, transparent);
          animation: ctaGradientMove 4s ease-in-out infinite;
          background-size: 200% 100%;
        }
        .cta-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.15;
        }
        .cta-phone-ring {
          position: relative;
          display: inline-flex;
        }
        .cta-phone-ring::before,
        .cta-phone-ring::after {
          content: '';
          position: absolute;
          inset: -8px;
          border: 1px solid rgba(253,188,1,0.2);
          border-radius: 50%;
          animation: ctaPulseRing 2.5s ease-out infinite;
          pointer-events: none;
        }
        .cta-phone-ring::after {
          animation-delay: 1.25s;
        }
      `}</style>

      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(4rem, 8vw, 7rem) 0',
        }}
      >
        {/* Ambient glows */}
        <div className="cta-glow" style={{ top: '-100px', left: '10%', background: SKY_BLUE }} />
        <div className="cta-glow" style={{ bottom: '-100px', right: '10%', background: GOLD }} />
        <div className="cta-glow" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px', background: SKY_BLUE, opacity: 0.06 }} />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: `${4 + i * 2}px`,
              height: `${4 + i * 2}px`,
              borderRadius: '50%',
              background: i % 2 === 0 ? GOLD : 'rgba(255,255,255,0.15)',
              top: `${15 + i * 12}%`,
              left: `${10 + i * 14}%`,
              animation: `ctaStarFloat ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
              pointerEvents: 'none',
            }}
          />
        ))}

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="cta-main-card" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>

            {/* Decorative quotes */}
            <div aria-hidden="true" style={{
              position: 'absolute',
              top: '-20px',
              right: '30px',
              fontFamily: 'var(--font-display)',
              fontSize: '10rem',
              lineHeight: 1,
              color: 'rgba(253,188,1,0.04)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}>
              &ldquo;
            </div>

            {/* Heading */}
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: '1rem',
              fontWeight: 800,
            }}>
              Ready to get behind
              <br />
              <span style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_BRIGHT} 50%, ${GOLD} 100%)`,
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'ctaShimmer 3s linear infinite',
              }}>
                the wheel?
              </span>
            </h2>

            <p style={{
              fontFamily: 'var(--font-body)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
              marginBottom: '2.5rem',
              maxWidth: '32ch',
              marginInline: 'auto',
              lineHeight: 1.7,
            }}>
              Book your lessons today and start driving with confidence.
            </p>

            {/* CTA Button */}
            <a
              href="https://www.aprecisiondrivingschool.com/schedule/cart_home.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: DARK,
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`,
                padding: '1rem 2.5rem',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
                boxShadow: '0 4px 20px rgba(253,188,1,0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(253,188,1,0.45)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(253,188,1,0.3)'
              }}
            >
              Book Driving Lessons
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>

            {/* Divider */}
            <div style={{
              width: '80px',
              height: '1px',
              background: `linear-gradient(90deg, transparent, rgba(253,188,1,0.3), transparent)`,
              margin: '2.5rem auto',
            }} />

            {/* Contact */}
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.3)',
              fontWeight: 600,
              marginBottom: '1rem',
            }}>
              Or contact us directly
            </p>

            <div className="cta-phone-ring" style={{ display: 'inline-flex', marginBottom: '0.5rem' }}>
              <a
                href="tel:+19253291736"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = GOLD }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#ffffff' }}
              >
                +1 925 329 1736
              </a>
            </div>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: '#E57373',
              marginTop: '0.25rem',
            }}>
              Text only please
            </p>

          </div>
        </div>
      </section>
    </>
  )
}
