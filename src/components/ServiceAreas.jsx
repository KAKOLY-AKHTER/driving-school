import { useState, useEffect } from 'react'
import { api, makeEmbedCode } from '../api'

const LOCATIONS = [
  { name: 'San Ramon', map: 'https://www.google.com/maps/embed/v1/place?q=SAN+RAMON+CA&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5' },
  { name: 'Danville', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100863.97399194786!2d-122.04184640146435!3d37.813488021706846!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808ff31209500587%3A0x185b7b97f3832fd5!2sDanville%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1714387044634!5m2!1sen!2sin', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5' },
  { name: 'Livermore', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d101045.39924703917!2d-121.85476100892504!3d37.68049120011074!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fe586385a2071%3A0x98d32231cb6bd871!2sLivermore%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1714386912208!5m2!1sen!2sin', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5' },
  { name: 'Pleasanton', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d202142.65679680137!2d-122.1723057097092!3d37.66145075852708!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fe9a261ba755f%3A0xb3ab6847e1ea7d16!2sPleasanton%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1714386614013!5m2!1sen!2sin', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5' },
  { name: 'Dublin', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d100989.52971764698!2d-121.99252020662772!3d37.7214898142999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fe65cd6892231%3A0x3b327c848ef64057!2sDublin%2C%20CA%2094568%2C%20USA!5e0!3m2!1sen!2sin!4v1715787261489!5m2!1sen!2sin', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5' },
]

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'

export default function ServiceAreas() {
  const [areas, setAreas] = useState(null)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    api.getAreas().then(d => { if (Array.isArray(d) && d.length) setAreas(d) }).catch(() => {})
  }, [])

  const list = areas && areas.length ? areas : LOCATIONS

  const copyEmbed = async (loc) => {
    const code = makeEmbedCode(loc.map)
    try {
      await navigator.clipboard.writeText(code)
      setCopied(loc.name)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(loc.name)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const renderCard = (loc, extraStyle = undefined) => (
    <div key={loc.name} className="area-card" style={extraStyle}>
      <div className="area-map-wrap">
        <iframe
          src={loc.map}
          style={{ width: '100%', height: '100%', border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`${loc.name} map`}
        />
        <div className="area-pin">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a1628">
            <path d={loc.icon} />
          </svg>
        </div>
      </div>

      <div className="area-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              background: GOLD,
              transform: 'rotate(45deg)',
              flexShrink: 0,
            }}
          />
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem',
              color: '#1a2332',
              fontWeight: 700,
              margin: 0,
            }}
          >
            {loc.name}
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', paddingLeft: '14px', flexWrap: 'wrap' }}>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.82rem',
              color: '#8899aa',
              margin: 0,
            }}
          >
            Bay Area, California
          </p>
          <button
            onClick={() => copyEmbed(loc)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.7rem',
              background: copied === loc.name ? 'rgba(34,197,94,0.1)' : 'rgba(1,69,168,0.06)',
              border: `1px solid ${copied === loc.name ? 'rgba(34,197,94,0.3)' : 'rgba(1,69,168,0.15)'}`,
              borderRadius: '999px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.45rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: copied === loc.name ? '#16A34A' : SKY_BLUE,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (copied !== loc.name) { e.currentTarget.style.background = 'rgba(1,69,168,0.12)'; e.currentTarget.style.borderColor = SKY_BLUE } }}
            onMouseLeave={(e) => { if (copied !== loc.name) { e.currentTarget.style.background = 'rgba(1,69,168,0.06)'; e.currentTarget.style.borderColor = 'rgba(1,69,168,0.15)' } }}
            title="Copy embed code"
          >
            {copied === loc.name ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                Copy Embed
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes areaCardIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .area-card {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: #ffffff;
          border: 1px solid rgba(1,69,168,0.1);
          transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
          animation: areaCardIn 0.6s cubic-bezier(0.22,1,0.36,1) both;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
        }
        .area-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(253,188,1,0.15);
          border-color: rgba(253,188,1,0.25);
        }
        .area-card:nth-child(1) { animation-delay: 0.1s; }
        .area-card:nth-child(2) { animation-delay: 0.2s; }
        .area-card:nth-child(3) { animation-delay: 0.3s; }
        .area-card:nth-child(4) { animation-delay: 0.4s; }
        .area-card:nth-child(5) { animation-delay: 0.5s; }
        .area-map-wrap {
          position: relative;
          width: 100%;
          height: 220px;
          overflow: hidden;
        }
        .area-map-wrap iframe {
          width: 100%;
          height: 100%;
          border: 0;
          transition: transform 0.5s ease;
        }
        .area-card:hover .area-map-wrap iframe {
          transform: scale(1.05);
        }
        .area-pin {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, ${GOLD} 0%, ${GOLD_BRIGHT} 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(253,188,1,0.4);
          z-index: 2;
          transition: all 0.3s ease;
          animation: areaPinPulse 2s ease-in-out infinite;
        }
        .area-card:hover .area-pin {
          transform: translate(-50%, -50%) scale(1.15);
          box-shadow: 0 6px 22px rgba(253,188,1,0.55);
        }
        @keyframes areaPinPulse {
          0%, 100% { box-shadow: 0 4px 15px rgba(253,188,1,0.4); }
          50% { box-shadow: 0 4px 25px rgba(253,188,1,0.6); }
        }
        .area-info {
          padding: 1.5rem;
          position: relative;
          z-index: 2;
        }
        @media (min-width: 768px) {
          .areas-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (min-width: 1024px) {
          .areas-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .area-map-wrap { height: 180px; }
          .areas-grid-bottom { flex-direction: column !important; }
          .areas-grid-bottom .area-card { flex: none !important; max-width: 100% !important; }
        }
      `}</style>

      <section
        id="locations"
        className="section-pad"
        style={{
          background: 'linear-gradient(180deg, #0d1f3c 0%, #0a1628 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(1,69,168,0.03) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(253,188,1,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p
              style={{
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
              }}
            >
              <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD})`, display: 'inline-block' }} />
              Locations
              <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, ${GOLD}, transparent)`, display: 'inline-block' }} />
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                color: '#ffffff',
                marginBottom: '0.5rem',
                fontWeight: 800,
              }}
            >
              Pick Up & Drop Off Areas
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
                color: 'rgba(255,255,255,0.55)',
                maxWidth: '32rem',
                marginInline: 'auto',
              }}
            >
              Free pickup and drop off from home, work and school across the Bay Area
            </p>
          </div>

          <div
            className="areas-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1.5rem',
            }}
          >
            {list.slice(0, 3).map((loc) => renderCard(loc))}
          </div>

          <div
            className="areas-grid-bottom"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1.5rem',
              marginTop: '1.5rem',
              flexWrap: 'wrap',
            }}
          >
            {list.slice(3).map((loc) => renderCard(loc, { flex: '1 1 300px', maxWidth: 'calc(33.333% - 1rem)' }))}
          </div>
        </div>
      </section>
    </>
  )
}
