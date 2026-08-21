import { useNavigate, Link } from 'react-router-dom'
import { useSiteSettings } from '../useSiteSettings'
import { usePageMeta } from '../usePageMeta'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'


const PACKAGES = [
  {
    id: 2, name: 'Basic', subtitle: 'Package A', hours: '2 Hours',
    detail: 'Behind the Wheel', price: '$210', desc: '2 Hrs Professional Training',
    highlight: false, icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    id: 12, name: 'Basic', subtitle: 'Package D', hours: '4 Hours',
    detail: 'Behind the Wheel', price: '$399', desc: '4 Hrs Professional Training',
    highlight: false, icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  },
  {
    id: 3, name: 'Essential', subtitle: 'Package B', hours: '6 Hours',
    detail: 'Behind the Wheel', price: '$599', desc: 'Behind The Wheel Only',
    highlight: false, icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    id: 8, name: 'Ideal', subtitle: 'Package C', hours: '6 Hours',
    detail: 'BTW + Online Driver Ed', price: '$615', desc: '6 Hrs BTW + Online Driver Ed',
    highlight: true, icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  },
  {
    id: 4, name: 'Premier', subtitle: 'Package E', hours: '10 Hours',
    detail: 'Behind the Wheel', price: '$999', desc: '6 Hours + 4 Extra Hours',
    highlight: false, icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  },
]

export default function SchedulePage() {
  usePageMeta(
    'Book Driving Lessons — A Precision Driving School',
    'Book your behind-the-wheel driving lessons in San Ramon, CA. Choose from basic, essential, ideal and premier packages. Free pickup & drop, DMV-licensed instructors.'
  )
  const navigate = useNavigate()
  const settings = useSiteSettings()
  return (
    <>
      <style>{`
        @keyframes schFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes schShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes schStarFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-18px) rotate(180deg); opacity: 0.45; }
        }
        @keyframes schGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(253,188,1,0.06), 0 8px 32px rgba(0,0,0,0.15); }
          50% { box-shadow: 0 0 40px rgba(253,188,1,0.12), 0 8px 32px rgba(0,0,0,0.15); }
        }
        @keyframes schPulseRing {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .sch-hero-title { animation: schFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both; }
        .sch-hero-sub { animation: schFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        .sch-hero-trust { animation: schFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both; }

        .sch-pkg-card {
          background: #ffffff;
          border: 2px solid rgba(1,69,168,0.12);
          border-radius: var(--radius-xl);
          padding: 2.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.22,1,0.36,1);
          animation: schFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
          box-shadow: 0 10px 40px rgba(1,69,168,0.08), 0 4px 12px rgba(0,0,0,0.04);
        }
        .sch-pkg-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, transparent, ${SKY_BLUE}, ${GOLD}, transparent);
          opacity: 1;
          transition: opacity 0.4s ease;
        }
        .sch-pkg-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(1,69,168,0.02) 0%, rgba(253,188,1,0.02) 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }
        .sch-pkg-card:hover::before { opacity: 1; }
        .sch-pkg-card:hover::after { opacity: 1; }
        .sch-pkg-card:hover {
          transform: translateY(-12px) scale(1.03);
          box-shadow: 0 28px 70px rgba(1,69,168,0.18), 0 10px 28px rgba(253,188,1,0.1);
          border-color: ${GOLD};
        }
        .sch-pkg-card:nth-child(1) { animation-delay: 0.1s; }
        .sch-pkg-card:nth-child(2) { animation-delay: 0.2s; }
        .sch-pkg-card:nth-child(3) { animation-delay: 0.3s; }
        .sch-pkg-card:nth-child(4) { animation-delay: 0.4s; }
        .sch-pkg-card:nth-child(5) { animation-delay: 0.5s; }

        .sch-pkg-highlight {
          border: 2.5px solid ${GOLD} !important;
          background: linear-gradient(135deg, rgba(253,188,1,0.08) 0%, rgba(1,69,168,0.05) 100%) !important;
          animation: schFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.4s both, schGlow 3s ease-in-out infinite !important;
          z-index: 2;
          box-shadow: 0 14px 50px rgba(253,188,1,0.18), 0 6px 20px rgba(0,0,0,0.06) !important;
        }
        .sch-pkg-highlight:hover {
          box-shadow: 0 36px 80px rgba(253,188,1,0.25), 0 14px 32px rgba(0,0,0,0.08) !important;
          transform: translateY(-14px) scale(1.04) !important;
        }
        .sch-pkg-highlight::before {
          background: linear-gradient(90deg, transparent, ${GOLD}, ${GOLD_BRIGHT}, ${GOLD}, transparent) !important;
          opacity: 1 !important;
          height: 5px;
        }
        .sch-badge {
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT});
          padding: 0.35rem 1.25rem;
          font-family: var(--font-mono);
          font-size: 0.55rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${DARK};
          font-weight: 700;
          border-radius: 0 0 8px 8px;
        }

        .sch-icon-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 60px; height: 60px;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, rgba(1,69,168,0.08), rgba(253,188,1,0.08));
          border: 1.5px solid rgba(1,69,168,0.12);
          margin-bottom: 1.25rem;
          transition: all 0.4s ease;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }
        .sch-pkg-card:hover .sch-icon-wrap {
          border-color: ${GOLD};
          background: linear-gradient(135deg, rgba(253,188,1,0.12), rgba(1,69,168,0.12));
          transform: scale(1.1);
          box-shadow: 0 8px 24px rgba(253,188,1,0.12);
        }
        .sch-icon-wrap::before, .sch-icon-wrap::after {
          content: '';
          position: absolute;
          inset: -6px;
          border: 1px solid rgba(253,188,1,0.12);
          border-radius: 50%;
          animation: schPulseRing 3s ease-out infinite;
          pointer-events: none;
        }
        .sch-icon-wrap::after { animation-delay: 1.5s; }
        .sch-pkg-card:hover .sch-icon-wrap::before,
        .sch-pkg-card:hover .sch-icon-wrap::after {
          border-color: rgba(253,188,1,0.25);
        }

        .sch-cta-gold {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.85rem 1.5rem;
          background: linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT});
          color: ${DARK};
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 4px 16px rgba(253,188,1,0.3);
          margin-top: auto;
        }
        .sch-cta-gold:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(253,188,1,0.4);
        }
        .sch-cta-ghost {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.85rem 1.5rem;
          background: transparent;
          color: ${SKY_BLUE};
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 700;
          border: 1.5px solid rgba(1,69,168,0.2);
          text-decoration: none;
          transition: all 0.3s ease;
          margin-top: auto;
        }
        .sch-cta-ghost:hover {
          border-color: ${GOLD};
          color: ${DARK};
          background: rgba(253,188,1,0.06);
          transform: translateY(-2px);
        }

        .sch-login-card {
          background: #ffffff;
          border: 1.5px solid rgba(1,69,168,0.15);
          border-radius: var(--radius-lg);
          padding: 2.5rem 2rem;
          text-align: center;
          transition: all 0.3s ease;
          animation: schFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.6s both;
          box-shadow: 0 8px 32px rgba(0,0,0,0.06);
        }
        .sch-login-card:hover {
          box-shadow: 0 16px 48px rgba(1,69,168,0.1);
          border-color: ${GOLD};
          transform: translateY(-4px);
        }

        @keyframes schBgPan {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes schOrbit {
          0% { transform: translate(0,0) scale(1); opacity: 0.10; }
          25% { transform: translate(30px,-20px) scale(1.05); opacity: 0.16; }
          50% { transform: translate(-10px,-40px) scale(1.1); opacity: 0.10; }
          75% { transform: translate(-30px,-10px) scale(1.05); opacity: 0.16; }
          100% { transform: translate(0,0) scale(1); opacity: 0.10; }
        }
        @keyframes schGridSlide {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes schLineGrow {
          0% { width: 0; opacity: 0; }
          50% { opacity: 0.15; }
          100% { width: 100%; opacity: 0; }
        }
        @keyframes schRingPulse {
          0% { transform: scale(0.8); opacity: 0.2; border-color: rgba(253,188,1,0.15); }
          50% { transform: scale(1.2); opacity: 0.08; border-color: rgba(1,69,168,0.2); }
          100% { transform: scale(0.8); opacity: 0.2; border-color: rgba(253,188,1,0.15); }
        }

        .sch-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.12;
          animation: schOrbit 10s ease-in-out infinite;
        }
        .sch-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: schStarFloat ease-in-out infinite;
        }

        @media (min-width: 768px) {
          .sch-pkg-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .sch-pkg-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (min-width: 1200px) {
          .sch-pkg-grid { grid-template-columns: repeat(5, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .sch-hero { padding-top: 14rem !important; }
        }
      `}</style>

      {/* ═══ Hero ═══ */}
      <section className="sch-hero" style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #0a2a5e 25%, ${DARK} 50%, #0c2040 75%, ${DARK} 100%)`,
        backgroundSize: '300% 300%',
        animation: 'schBgPan 12s ease-in-out infinite',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: '12rem',
        paddingBottom: '3rem',
        minHeight: '400px',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(253,188,1,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(253,188,1,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'schGridSlide 8s linear infinite',
          pointerEvents: 'none',
        }} />
        {[...Array(3)].map((_, i) => (
          <div key={`line-${i}`} style={{
            position: 'absolute',
            top: `${25 + i * 20}%`, left: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${i % 2 === 0 ? GOLD : SKY_BLUE}, transparent)`,
            animation: `schLineGrow ${4 + i}s ease-in-out ${i * 1.5}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}
        {[...Array(2)].map((_, i) => (
          <div key={`ring-${i}`} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: `${200 + i * 160}px`, height: `${200 + i * 160}px`,
            border: '1px solid rgba(253,188,1,0.08)',
            borderRadius: '50%',
            transform: 'translate(-50%,-50%)',
            animation: `schRingPulse ${5 + i * 2}s ease-in-out ${i * 0.8}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}
        <div className="sch-glow" style={{ top: '-100px', left: '10%', background: SKY_BLUE, width: '350px', height: '350px' }} />
        <div className="sch-glow" style={{ bottom: '-80px', right: '15%', background: GOLD, width: '280px', height: '280px', animationDelay: '3s' }} />
        <div className="sch-glow" style={{ top: '40%', left: '60%', background: SKY_BLUE, width: '200px', height: '200px', opacity: 0.06, animationDelay: '5s' }} />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="sch-particle" aria-hidden="true" style={{
            width: `${2 + i * 1}px`, height: `${2 + i * 1}px`,
            background: i % 3 === 0 ? GOLD : i % 3 === 1 ? 'rgba(1,69,168,0.5)' : 'rgba(255,255,255,0.12)',
            top: `${10 + i * 9}%`, left: `${8 + i * 10}%`,
            animationDuration: `${3 + i * 0.5}s`, animationDelay: `${i * 0.2}s`,
          }} />
        ))}

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <img src="/driving-logo.png" alt="A Precision Driving School" width="532" height="532" decoding="async" style={{
            height: 'clamp(100px, 15vw, 160px)', width: 'auto', objectFit: 'contain',
            display: 'block', margin: '0 auto 1.25rem',
            filter: 'drop-shadow(0 8px 40px rgba(255,255,255,0.85)) drop-shadow(0 0 35px rgba(255,255,255,0.6)) drop-shadow(0 0 60px rgba(255,255,255,0.3))',
          }} />

          <div className="sch-hero-title" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem',
          }}>
            <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.3em',
              textTransform: 'uppercase', color: GOLD_DEEP, fontWeight: 700,
            }}>Behind-the-Wheel Training</span>
            <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          </div>

          <h1 className="sch-hero-title" style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            color: '#ffffff', lineHeight: 1.15, fontWeight: 800, marginBottom: '1rem',
          }}>
            Schedule{' '}
            <span style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_BRIGHT} 50%, ${GOLD} 100%)`,
              backgroundSize: '200% auto', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              animation: 'schShimmer 3s linear infinite',
            }}>Appointments</span>
          </h1>

          <p className="sch-hero-sub" style={{
            fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.88)',
            fontSize: 'clamp(0.9rem, 1.4vw, 1.1rem)', maxWidth: '42ch',
            marginInline: 'auto', lineHeight: 1.7, marginBottom: '2rem',
          }}>
            Choose a package and register online. For assistance, text{' '}
            <span style={{ color: GOLD, fontWeight: 700 }}>{settings.phone.replace('+1 ', '')}</span> between 9 a.m. and 5 p.m.
          </p>

          {/* Trust Stats */}
          <div className="sch-hero-trust" style={{
            display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
            gap: 'clamp(1.5rem, 3vw, 3rem)',
          }}>
            {[
              { num: '99%', label: 'Pass Rate' },
              { num: 'Free', label: 'Pickup & Drop' },
              { num: 'DMV', label: 'Approved' },
            ].map((t) => (
              <div key={t.label} style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
                  color: GOLD, fontWeight: 800, lineHeight: 1, marginBottom: '0.2rem',
                }}>{t.num}</div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.15em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.88)', fontWeight: 600,
                }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Packages ═══ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: 'clamp(3rem, 6vw, 5rem) 0',
        marginTop: '-1rem',
        background: '#F8FAFD',
      }}>
        <div style={{
          position: 'absolute', top: '-150px', left: '20%', width: '400px', height: '400px',
          background: SKY_BLUE, borderRadius: '50%', filter: 'blur(120px)', opacity: 0.03, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-150px', right: '20%', width: '350px', height: '350px',
          background: GOLD, borderRadius: '50%', filter: 'blur(120px)', opacity: 0.03, pointerEvents: 'none',
        }} />
        <div className="container" style={{ maxWidth: '72rem', position: 'relative', zIndex: 1 }}>
          <div className="sch-pkg-grid" style={{
            display: 'grid', gridTemplateColumns: '1fr',
            gap: '1.25rem', marginBottom: '2.5rem',
          }}>
            {PACKAGES.map((pkg) => (
              <div key={pkg.id} className={`sch-pkg-card ${pkg.highlight ? 'sch-pkg-highlight' : ''}`}>

                {pkg.highlight && <div className="sch-badge">Most Popular</div>}

                <div className="sch-icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={pkg.highlight ? GOLD : SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={pkg.icon} />
                  </svg>
                </div>

                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: '#8899aa', fontWeight: 600, marginBottom: '0.3rem',
                }}>{pkg.subtitle}</p>

                <h3 style={{
                  fontFamily: 'var(--font-display)', fontSize: '1.3rem',
                  color: DARK, fontWeight: 700, marginBottom: '0.3rem',
                }}>{pkg.name}</h3>

                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                  color: '#364B6B', marginBottom: '1.25rem', lineHeight: 1.5,
                }}>{pkg.hours} {pkg.detail}</p>

                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: '2.2rem',
                  fontWeight: 800, color: GOLD, marginBottom: '0.25rem', lineHeight: 1,
                }}>{pkg.price}</div>

                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                  color: '#8899aa', marginBottom: '1.75rem', flexGrow: 1,
                }}>{pkg.desc}</p>

                <button
                  onClick={() => navigate('/register', { state: { packageId: pkg.id } })}
                  className={pkg.highlight ? 'sch-cta-gold' : 'sch-cta-ghost'}
                  style={{ width: '100%', border: pkg.highlight ? 'none' : undefined, cursor: 'pointer' }}
                >
                  Register Now
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Login Card */}
          <div className="sch-login-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(1,69,168,0.08), rgba(253,188,1,0.08))',
                border: '1.5px solid rgba(1,69,168,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                </svg>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#364B6B', margin: 0, fontWeight: 500 }}>
                Already a registered user?
              </p>
            </div>
            <Link
              to="/login"
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: SKY_BLUE, fontWeight: 700,
                textDecoration: 'none', borderBottom: `2px solid ${GOLD}`, paddingBottom: '2px',
                transition: 'color 0.3s ease',
              }}
            >
              Log in to your account
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
