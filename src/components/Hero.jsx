import { Link } from 'react-router-dom'
import './HeroSlider.css'

export default function Hero() {
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing')
    if (!pricingSection) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compactNavbarOffset = 84
    const targetTop = pricingSection.getBoundingClientRect().top + window.scrollY - compactNavbarOffset

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <>
    <style>{`
      .hero-cta .btn-gold,
      .hero-cta .btn-ghost {
        padding: 1rem 2.4rem;
        font-size: 0.8rem;
        box-shadow: 0 6px 20px rgba(0,0,0,0.45), 0 0 0 4px rgba(255,255,255,0.14);
      }
      .hero-cta .btn-ghost {
        background: rgba(10,22,40,0.6);
        border: 2px solid var(--color-gold);
        color: var(--color-gold);
        backdrop-filter: blur(2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.45), 0 0 0 4px rgba(253,188,1,0.18);
      }
      .hero-cta .btn-ghost:hover {
        background: rgba(253,188,1,0.18);
        border-color: var(--color-gold);
      }
      .hero-scroll-wrap {
        position: absolute;
        z-index: 2;
        bottom: 1.35rem;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        pointer-events: none;
      }
      .hero-scroll-cue {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.42rem;
        opacity: 0.98;
        padding: 0;
        color: inherit;
        border: 0;
        background: transparent;
        cursor: pointer;
        filter: drop-shadow(0 4px 10px rgba(0,0,0,0.72));
        transition: transform 0.22s ease, filter 0.22s ease;
        pointer-events: auto;
      }
      .hero-scroll-cue:hover {
        transform: translateY(3px);
        filter: drop-shadow(0 5px 13px rgba(0,0,0,0.78)) drop-shadow(0 0 8px rgba(253,188,1,0.28));
      }
      .hero-scroll-cue:focus-visible {
        outline: 2px solid #ffd84a;
        outline-offset: 7px;
        border-radius: 999px;
      }
      .hero-scroll-label {
        padding-left: 0.32em;
        color: #fff3b0;
        font-family: var(--font-mono);
        font-size: 0.68rem;
        font-weight: 800;
        line-height: 1;
        letter-spacing: 0.32em;
        text-transform: uppercase;
        text-shadow: 0 2px 5px rgba(0,0,0,0.9), 0 0 10px rgba(253,188,1,0.35);
      }
      .hero-scroll-mouse {
        position: relative;
        display: block;
        width: 25px;
        height: 37px;
        border: 1.5px solid rgba(255,216,74,0.95);
        border-radius: 999px;
        background: rgba(3,20,43,0.2);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 0 12px rgba(253,188,1,0.22);
      }
      .hero-scroll-wheel {
        position: absolute;
        top: 7px;
        left: 50%;
        width: 3px;
        height: 7px;
        border-radius: 999px;
        background: #ffd84a;
        box-shadow: 0 0 8px rgba(255,216,74,0.9);
        transform: translateX(-50%);
        animation: heroScrollWheel 1.8s ease-in-out infinite;
      }
      .hero-scroll-line {
        display: block;
        width: 2px;
        height: 30px;
        background: linear-gradient(to bottom, #ffd84a 0%, rgba(253,188,1,0.72) 48%, transparent 100%);
        box-shadow: 0 0 8px rgba(253,188,1,0.6);
        transform-origin: top;
        animation: heroScrollLine 1.8s ease-in-out infinite;
      }
      @keyframes heroScrollWheel {
        0% { opacity: 0; transform: translate(-50%, -1px); }
        28% { opacity: 1; }
        72% { opacity: 1; }
        100% { opacity: 0; transform: translate(-50%, 11px); }
      }
      @keyframes heroScrollLine {
        0%, 100% { opacity: 0.48; transform: scaleY(0.78); }
        50% { opacity: 1; transform: scaleY(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .hero-scroll-wheel,
        .hero-scroll-line {
          animation: none;
        }
      }
      @media (max-width: 600px) {
        .hero-content {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
        }
        .hero-logo { margin-bottom: 1.5rem !important; }
        .hero-title { font-size: 2.2rem !important; margin-bottom: 0.8rem !important; }
        .hero-subtitle { font-size: 0.9rem !important; margin-bottom: 1rem !important; }
        .hero-cta { justify-content: center !important; }
        .hero-section {
          padding-top: 14rem !important;
          padding-bottom: 4rem !important;
          min-height: auto !important;
          align-items: flex-start !important;
        }
        .hero-scroll-wrap { bottom: 0.75rem; }
        .hero-scroll-label { font-size: 0.58rem; }
        .hero-scroll-mouse { width: 22px; height: 32px; }
        .hero-scroll-line { height: 22px; }
      }
    `}</style>
    <section
      className="hero-section"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        paddingTop: 'clamp(9rem, 16vw, 13rem)',
        paddingBottom: '4rem',
        overflow: 'hidden',
      }}
    >
      {/* Background Images Slider (CSS Only) */}
      <div className="hero-css-slider" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <div className="css-slide slide-1" style={{ backgroundImage: 'url(/hero1.png)' }} />
        <div className="css-slide slide-2" style={{ backgroundImage: 'url(/hero2.jpg)' }} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="reveal hero-content" style={{ maxWidth: '720px' }}>

          {/* 1. Title */}
          <h1 className="hero-title" style={{
            fontSize: 'clamp(2.8rem, 6vw, 4.8rem)',
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(0,0,0,0.92), 0 10px 28px rgba(0,0,0,0.56)',
            marginBottom: '1.2rem',
            lineHeight: 1.1,
          }}>
            Precision, practiced
          </h1>

          {/* 2. Subtitle */}
          <p className="hero-subtitle" style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.15rem)',
            color: '#eeeeee',
            textShadow: '0 2px 3px rgba(0,0,0,0.94), 0 8px 20px rgba(0,0,0,0.5)',
            maxWidth: '48ch',
            lineHeight: 1.6,
            marginBottom: '1.8rem',
          }}>
            Safe, confident driving starts here. Dual-control cars, background-checked instructors, and a method refined over three decades to get you licensed on the first try.
          </p>

          {/* 3. Hero Icon Logo Image */}
          <img
            className="hero-logo"
            src="/hero-icon-logo.png"
            alt="A Precision Driving School"
            style={{
              height: 'clamp(100px, 14vw, 180px)',
              width: 'auto',
              objectFit: 'contain',
              imageRendering: 'auto',
              backfaceVisibility: 'hidden',
              display: 'block',
              marginBottom: '1.8rem',
              filter: 'drop-shadow(0 6px 15px rgba(0,0,0,0.58)) drop-shadow(0 0 7px rgba(253,188,1,0.24))',
            }}
          />

          {/* 4. CTA Buttons */}
          <div className="hero-cta" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/schedule" className="btn-gold">
              Book Driving Lessons
            </Link>
            <Link to="/register" className="btn-ghost">
              Online Drivers Ed
            </Link>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll-wrap">
        <button type="button" className="hero-scroll-cue" onClick={scrollToPricing} aria-label="Scroll to pricing plans">
          <span className="hero-scroll-label">Scroll</span>
          <span className="hero-scroll-mouse">
            <span className="hero-scroll-wheel" />
          </span>
          <span className="hero-scroll-line" />
        </button>
      </div>

    </section>
    </>
  )
}
