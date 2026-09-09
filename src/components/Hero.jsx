import { Link } from 'react-router-dom'
import './HeroSlider.css'

export default function Hero() {
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing')
    if (!pricingSection) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const targetTop = pricingSection.getBoundingClientRect().top + window.scrollY - 84
    window.scrollTo({ top: Math.max(0, targetTop), behavior: prefersReducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <>
    <style>{`
      .hero-cta {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5rem;
        width: 100%;
        max-width: 520px;
        box-sizing: border-box;
      }
      .hero-content {
        width: min(100%, 720px);
        box-sizing: border-box;
      }
      .hero-cta .hero-action-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-width: 0;
        min-height: 46px;
        padding: 0.6rem 0.7rem;
        border-radius: 9px;
        box-sizing: border-box;
        font-size: clamp(0.6rem, 0.9vw, 0.7rem);
        letter-spacing: 0.07em;
        line-height: 1.35;
        text-align: center;
        white-space: normal;
        overflow-wrap: anywhere;
        cursor: pointer;
      }
      .hero-cta .btn-gold {
        box-shadow: 0 6px 20px rgba(0,0,0,0.45), 0 0 0 4px rgba(255,255,255,0.14);
      }
      .hero-cta .btn-ghost {
        background: rgba(10,22,40,0.6);
        border: 2px solid var(--color-gold);
        color: var(--color-gold);
        box-shadow: 0 6px 20px rgba(0,0,0,0.42), 0 0 0 3px rgba(253,188,1,0.1);
        backdrop-filter: blur(3px);
      }
      .hero-cta .btn-ghost:hover {
        background: rgba(253,188,1,0.18);
        border-color: var(--color-gold);
        color: var(--color-gold);
      }
      .hero-scroll-wrap {
        position: absolute;
        z-index: 2;
        right: 0;
        bottom: 1.2rem;
        left: 0;
        display: flex;
        justify-content: center;
        pointer-events: none;
      }
      .hero-scroll-cue {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        padding: 0;
        border: 0;
        background: transparent;
        color: #fff3b0;
        cursor: pointer;
        filter: drop-shadow(0 4px 10px rgba(0,0,0,0.72));
        pointer-events: auto;
      }
      .hero-scroll-label {
        padding-left: 0.3em;
        font-family: var(--font-mono);
        font-size: 0.64rem;
        font-weight: 800;
        letter-spacing: 0.3em;
        line-height: 1;
        text-transform: uppercase;
      }
      .hero-scroll-mouse {
        position: relative;
        width: 23px;
        height: 34px;
        border: 1.5px solid #ffd84a;
        border-radius: 999px;
        background: rgba(3,20,43,0.2);
      }
      .hero-scroll-wheel {
        position: absolute;
        top: 6px;
        left: 50%;
        width: 3px;
        height: 7px;
        border-radius: 999px;
        background: #ffd84a;
        transform: translateX(-50%);
        animation: heroScrollWheel 1.8s ease-in-out infinite;
      }
      .hero-scroll-line {
        width: 2px;
        height: 25px;
        background: linear-gradient(to bottom, #ffd84a, transparent);
        animation: heroScrollLine 1.8s ease-in-out infinite;
      }
      @keyframes heroScrollWheel {
        0% { opacity: 0; transform: translate(-50%, -1px); }
        30%, 70% { opacity: 1; }
        100% { opacity: 0; transform: translate(-50%, 10px); }
      }
      @keyframes heroScrollLine {
        0%, 100% { opacity: 0.45; transform: scaleY(0.8); }
        50% { opacity: 1; transform: scaleY(1); }
      }
      @media (prefers-reduced-motion: reduce) {
        .hero-scroll-wheel,
        .hero-scroll-line { animation: none; }
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
        .hero-cta { grid-template-columns: 1fr; width: 100%; }
        .hero-cta .hero-action-button { min-height: 46px; }
        .hero-section {
          padding-top: 14rem !important;
          padding-bottom: 8rem !important;
          min-height: auto !important;
          align-items: flex-start !important;
        }
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
            width="432"
            height="164"
            decoding="async"
            fetchPriority="high"
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
          <div className="hero-cta">
            <Link to="/schedule" className="hero-action-button btn-gold">Register For Driving Lessons</Link>
            <Link to="/online-drivers-ed/register?course=1" className="hero-action-button btn-ghost">Register For Online Drivers Ed</Link>
            <button type="button" className="hero-action-button btn-gold">Online Education Student Login</button>
            <button type="button" className="hero-action-button btn-ghost">Behind The Wheel Student Login</button>
          </div>

        </div>
      </div>

      <div className="hero-scroll-wrap">
        <button type="button" className="hero-scroll-cue" onClick={scrollToPricing} aria-label="Scroll to pricing plans">
          <span className="hero-scroll-label">Scroll</span>
          <span className="hero-scroll-mouse"><span className="hero-scroll-wheel" /></span>
          <span className="hero-scroll-line" />
        </button>
      </div>

    </section>
    </>
  )
}
