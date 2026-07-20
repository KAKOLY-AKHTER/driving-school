import './HeroSlider.css'

export default function Hero() {
  return (
    <>
    <style>{`
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
      }
    `}</style>
    <section
      className="hero-section"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        paddingTop: 'clamp(7rem, 15vw, 11rem)',
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
            textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.6)',
            marginBottom: '1.2rem',
            lineHeight: 1.1,
          }}>
            Precision, practiced
          </h1>

          {/* 2. Subtitle */}
          <p className="hero-subtitle" style={{
            fontSize: 'clamp(1rem, 1.5vw, 1.15rem)',
            color: '#eeeeee',
            textShadow: '0 2px 8px rgba(0,0,0,0.9), 0 1px 4px rgba(0,0,0,0.6)',
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
              display: 'block',
              marginBottom: '1.8rem',
              filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.85)) drop-shadow(0 0 18px rgba(253,188,1,0.45))',
            }}
          />

          {/* 4. CTA Buttons */}
          <div className="hero-cta" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="https://www.aprecisiondrivingschool.com/schedule/cart_home.html" className="btn-gold" target="_blank" rel="noopener noreferrer">
              Book Driving Lessons
            </a>
            <a href="https://www.aprecisiondrivingschool.com/script/register.php" className="btn-ghost" target="_blank" rel="noopener noreferrer">
              Online Drivers Ed
            </a>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: '2rem', left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }} aria-hidden="true">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          animation: 'floatY 3s ease-in-out infinite',
          opacity: 0.5,
        }}>
        <span className="eyebrow" style={{ fontSize: '0.7rem' }}>Scroll</span>
        <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, var(--color-gold), transparent)' }} />
        </div>
      </div>

    </section>
    </>
  )
}
