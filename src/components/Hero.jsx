import './HeroSlider.css'

export default function Hero() {
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
        min-height: 42px;
        padding: 0.5rem 0.6rem;
        border-radius: 9px;
        box-sizing: border-box;
        font-size: clamp(0.56rem, 0.85vw, 0.66rem);
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
        .hero-cta .hero-action-button { min-height: 42px; }
        .hero-section {
          padding-top: 14rem !important;
          padding-bottom: 4rem !important;
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
            <button type="button" className="hero-action-button btn-gold">Register For Driving Lessons</button>
            <button type="button" className="hero-action-button btn-ghost">Register For Online Drivers Ed</button>
            <button type="button" className="hero-action-button btn-gold">Online Education Student Login</button>
            <button type="button" className="hero-action-button btn-ghost">Behind The Wheel Student Login</button>
          </div>

        </div>
      </div>

    </section>
    </>
  )
}
