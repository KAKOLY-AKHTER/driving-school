import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ServiceAreas from '../components/ServiceAreas'
import { makeEmbedCode } from '../api'
import { usePageMeta } from '../usePageMeta'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'
const API = import.meta.env.VITE_API_URL || ''

const CONTACTS = [
  {
    key: 'call',
    label: 'Call Us',
    sublabel: 'Text only please',
    valueKey: 'phone',
    hrefKey: 'tel:',
    hrefPrefix: 'tel:+',
    icon: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  },
  {
    key: 'email',
    label: 'Email Us',
    sublabel: 'We reply within 24 hours',
    valueKey: 'email',
    hrefKey: 'mailto:',
    hrefPrefix: 'mailto:',
    icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
  },
  {
    key: 'visit',
    label: 'Visit Us',
    sublabel: 'DMV Licensed since 1989',
    valueKey: 'address',
    subvalueKey: 'subaddress',
    hrefKey: 'https://maps.google.com/?q=',
    icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5',
  },
  {
    key: 'schedule',
    label: 'Schedule Online',
    sublabel: 'Book your lessons 24/7',
    href: '/schedule',
    display: 'Book Online 24/7',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
]

const TRUST = [
  { num: '35+', label: 'Years Experience' },
  { num: '99%', label: 'DMV Pass Rate' },
  { num: '5K+', label: 'Students Trained' },
  { num: '100%', label: 'Background Checked' },
]

export default function ContactPage() {
  usePageMeta(
    'Contact Us — A Precision Driving School San Ramon CA',
    'Contact A Precision Driving School in San Ramon, CA. Call or text +1 925 329 1736 or email aprecisiondrivingschool@gmail.com. Serving San Ramon, Dublin, Danville, Pleasanton, Livermore.'
  )
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', comments: '' })
  const [formLoading, setFormLoading] = useState(false)
  const [formMsg, setFormMsg] = useState('')
  const [settings, setSettings] = useState(null)
  const [copied, setCopied] = useState(false)

  const copyMapEmbed = async () => {
    const q = settings ? `${(settings.address || '')} ${(settings.subaddress || '')}` : '2001 Omega Rd Ste 205 San Ramon CA 94583'
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    const code = makeEmbedCode(url)
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    fetch(`${API}/api/settings`)
      .then(r => r.json())
      .then(d => setSettings(d))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.phone || !form.email || !form.comments) {
      setFormMsg('Please fill all fields.'); setTimeout(() => setFormMsg(''), 3000); return
    }
    setFormLoading(true)
    try {
      const res = await fetch(`${API}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.ok) {
        setFormMsg('Message sent! We will get back to you within 24 hours.')
        setForm({ firstName: '', lastName: '', phone: '', email: '', comments: '' })
      } else {
        setFormMsg('Failed to send. Please try again.')
      }
    } catch {
      setFormMsg('Network error. Please try again.')
    }
    setFormLoading(false)
    setTimeout(() => setFormMsg(''), 3000)
  }

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  return (
    <>
      <style>{`
        @keyframes cFadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cPulseRing {
          0% { transform: scale(1); opacity: 0.35; }
          100% { transform: scale(1.7); opacity: 0; }
        }
        @keyframes cShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes cGradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes cStarFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.5; }
        }
        @keyframes cBorderDash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes cCountUp {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes cBgPan {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes cOrbit {
          0% { transform: translate(0,0) scale(1); opacity: 0.10; }
          25% { transform: translate(30px,-20px) scale(1.05); opacity: 0.16; }
          50% { transform: translate(-10px,-40px) scale(1.1); opacity: 0.10; }
          75% { transform: translate(-30px,-10px) scale(1.05); opacity: 0.16; }
          100% { transform: translate(0,0) scale(1); opacity: 0.10; }
        }
        @keyframes cGridSlide {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        @keyframes cLineGrow {
          0% { width: 0; opacity: 0; }
          50% { opacity: 0.15; }
          100% { width: 100%; opacity: 0; }
        }
        @keyframes cRingPulse {
          0% { transform: scale(0.8); opacity: 0.2; border-color: rgba(253,188,1,0.15); }
          50% { transform: scale(1.2); opacity: 0.08; border-color: rgba(1,69,168,0.2); }
          100% { transform: scale(0.8); opacity: 0.2; border-color: rgba(253,188,1,0.15); }
        }

        .c-hero-title { animation: cFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both; }
        .c-hero-sub { animation: cFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        .c-hero-trust { animation: cFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both; }

        .c-contact-card {
          background: #ffffff;
          border: 1px solid #E2EBF5;
          padding: 2.25rem 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
          animation: cFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
          position: relative;
          overflow: hidden;
        }
        .c-contact-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, ${SKY_BLUE}, ${GOLD}, ${SKY_BLUE}, transparent);
          background-size: 200% 100%;
          animation: cGradientMove 4s ease-in-out infinite;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .c-contact-card:hover::before { opacity: 1; }
        .c-contact-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 24px 60px rgba(1,69,168,0.1), 0 8px 20px rgba(253,188,1,0.06);
          border-color: ${GOLD};
        }
        .c-contact-card:nth-child(1) { animation-delay: 0.15s; }
        .c-contact-card:nth-child(2) { animation-delay: 0.25s; }
        .c-contact-card:nth-child(3) { animation-delay: 0.35s; }
        .c-contact-card:nth-child(4) { animation-delay: 0.45s; }

        .c-icon-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 72px; height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(1,69,168,0.06), rgba(253,188,1,0.06));
          border: 2px solid rgba(1,69,168,0.08);
          margin-bottom: 1.25rem;
          transition: all 0.4s ease;
        }
        .c-contact-card:hover .c-icon-wrap {
          border-color: ${GOLD};
          background: linear-gradient(135deg, rgba(253,188,1,0.08), rgba(1,69,168,0.08));
          transform: scale(1.1);
        }
        .c-icon-wrap::before, .c-icon-wrap::after {
          content: '';
          position: absolute;
          inset: -7px;
          border: 1px solid rgba(253,188,1,0.12);
          border-radius: 50%;
          animation: cPulseRing 3s ease-out infinite;
          pointer-events: none;
        }
        .c-icon-wrap::after { animation-delay: 1.5s; }
        .c-contact-card:hover .c-icon-wrap::before,
        .c-contact-card:hover .c-icon-wrap::after {
          border-color: rgba(253,188,1,0.25);
        }

        .c-hours-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.8rem 0;
          border-bottom: 1px solid rgba(1,69,168,0.05);
          transition: background 0.3s ease;
        }
        .c-hours-row:hover { background: rgba(1,69,168,0.02); }
        .c-hours-row:last-child { border-bottom: none; }

        .c-map-card {
          position: relative;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: #ffffff;
          border: 1px solid rgba(1,69,168,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.06);
          transition: all 0.4s ease;
        }
        .c-map-card:hover {
          box-shadow: 0 16px 48px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .c-map-card iframe { width: 100%; height: 420px; border: 0; display: block; }
        .c-map-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 60px;
          background: linear-gradient(transparent, rgba(255,255,255,0.8));
          pointer-events: none;
        }
        .c-map-card:hover {
          box-shadow: 0 16px 48px rgba(0,0,0,0.1);
          border-color: rgba(253,188,1,0.2);
        }
        .c-map-card::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 60px;
          background: linear-gradient(transparent, rgba(255,255,255,0.8));
          pointer-events: none;
          z-index: 1;
        }

        .c-glow {
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.12;
          animation: cOrbit 10s ease-in-out infinite;
        }
        .c-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: cStarFloat ease-in-out infinite;
        }

        .c-trust-card {
          text-align: center;
          padding: 1rem;
          animation: cFadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        .c-trust-card:nth-child(1) { animation-delay: 0.4s; }
        .c-trust-card:nth-child(2) { animation-delay: 0.5s; }
        .c-trust-card:nth-child(3) { animation-delay: 0.6s; }
        .c-trust-card:nth-child(4) { animation-delay: 0.7s; }

        .c-gold-divider {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${GOLD}, transparent);
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .c-cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .c-map-hours { grid-template-columns: 1.2fr 1fr !important; }
        }
        @media (min-width: 1024px) {
          .c-cards-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .c-map-card iframe { height: 260px; }
        }
      `}</style>

      {/* ═══ Hero ═══ */}
      <section style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #0a2a5e 25%, ${DARK} 50%, #0c2040 75%, ${DARK} 100%)`,
        backgroundSize: '300% 300%',
        animation: 'cBgPan 12s ease-in-out infinite',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: '14rem',
        paddingBottom: '6rem',
        minHeight: '600px',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(253,188,1,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(253,188,1,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'cGridSlide 8s linear infinite',
          pointerEvents: 'none',
        }} />
        {[...Array(3)].map((_, i) => (
          <div key={`line-${i}`} style={{
            position: 'absolute',
            top: `${25 + i * 20}%`, left: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${i % 2 === 0 ? GOLD : SKY_BLUE}, transparent)`,
            animation: `cLineGrow ${4 + i}s ease-in-out ${i * 1.5}s infinite`,
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
            animation: `cRingPulse ${5 + i * 2}s ease-in-out ${i * 0.8}s infinite`,
            pointerEvents: 'none',
          }} />
        ))}
        <div className="c-glow" style={{ top: '-100px', left: '10%', background: SKY_BLUE, width: '350px', height: '350px' }} />
        <div className="c-glow" style={{ bottom: '-80px', right: '15%', background: GOLD, width: '280px', height: '280px', animationDelay: '3s' }} />
        <div className="c-glow" style={{ top: '40%', left: '60%', background: SKY_BLUE, width: '200px', height: '200px', opacity: 0.06, animationDelay: '5s' }} />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="c-particle" aria-hidden="true" style={{
            width: `${2 + i * 1}px`, height: `${2 + i * 1}px`,
            background: i % 3 === 0 ? GOLD : i % 3 === 1 ? 'rgba(1,69,168,0.5)' : 'rgba(255,255,255,0.12)',
            top: `${10 + i * 9}%`, left: `${8 + i * 10}%`,
            animationDuration: `${3 + i * 0.5}s`, animationDelay: `${i * 0.2}s`,
          }} />
        ))}

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Eyebrow */}
          <div className="c-hero-title" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.8rem',
            marginBottom: '1.25rem',
          }}>
            <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: GOLD_DEEP,
              fontWeight: 700,
            }}>Get In Touch</span>
            <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          </div>

          {/* Title */}
          <h1 className="c-hero-title" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            color: '#ffffff',
            lineHeight: 1.1,
            fontWeight: 800,
            marginBottom: '1.25rem',
          }}>
            Contact{' '}
            <span style={{
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_BRIGHT} 50%, ${GOLD} 100%)`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'cShimmer 3s linear infinite',
            }}>Us</span>
          </h1>

          <p className="c-hero-sub" style={{
            fontFamily: 'var(--font-body)',
            color: 'rgba(255,255,255,0.5)',
            fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)',
            maxWidth: '38ch',
            marginInline: 'auto',
            lineHeight: 1.7,
            marginBottom: '3rem',
          }}>
            Ready to start driving? We're here to guide you every step of the way.
          </p>

          {/* Trust Stats */}
          <div className="c-hero-trust" style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 'clamp(1.5rem, 3vw, 3rem)',
          }}>
            {TRUST.map((t) => (
              <div key={t.label} className="c-trust-card">
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                  color: GOLD,
                  fontWeight: 800,
                  lineHeight: 1,
                  marginBottom: '0.3rem',
                }}>{t.num}</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.55rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: 600,
                }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Contact Cards ═══ */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(3rem, 6vw, 5rem) 0 0',
        marginTop: '-2rem',
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="c-cards-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '1.5rem',
            marginBottom: '4rem',
          }}>
            {CONTACTS.map((c) => {
              const internal = c.href
              const val = internal ? (c.display || '') : (settings ? settings[c.valueKey] || c.fallback || '' : '')
              const subval = c.subvalueKey && settings ? settings[c.subvalueKey] || '' : ''
              const href = internal || (c.hrefPrefix ? c.hrefPrefix + val : (settings ? settings[c.hrefKey] || '' : ''))
              const inner = (
                <>
                  <div className="c-icon-wrap">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={c.icon} />
                    </svg>
                  </div>

                  <p style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#8899aa',
                    fontWeight: 600,
                    marginBottom: '0.35rem',
                  }}>{c.sublabel}</p>

                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    color: DARK,
                    fontWeight: 700,
                    marginBottom: '0.6rem',
                  }}>{c.label}</h3>

                  {val && (
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9rem',
                      color: SKY_BLUE,
                      fontWeight: 600,
                      wordBreak: 'break-word',
                    }}>{val}</p>
                  )}

                  {subval && (
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.85rem',
                      color: '#364B6B',
                      marginTop: '0.15rem',
                    }}>{subval}</p>
                  )}
                </>
              )
              return internal ? (
                <Link
                  key={c.key}
                  to={internal}
                  className="c-contact-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {inner}
                </Link>
              ) : (
                <a
                  key={c.key}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="c-contact-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {inner}
                </a>
              )
            })}
          </div>

          {/* ═══ Map + Hours Side by Side ═══ */}
          <div className="c-map-hours" style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2rem',
            marginBottom: '2rem',
          }}>
            {/* Map */}
            <div className="c-map-card" style={{ position: 'relative' }}>
              <iframe
                src={settings ? `https://maps.google.com/maps?q=${encodeURIComponent((settings.address || '') + ' ' + (settings.subaddress || ''))}&t=&z=15&ie=UTF8&iwloc=&output=embed` : `https://maps.google.com/maps?q=2001%20Omega%20Rd%20Ste%20205%20San%20Ramon%20CA%2094583&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="420"
                style={{ border: 0, display: 'block' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="A Precision Driving School Location"
              />
              <button
                onClick={copyMapEmbed}
                style={{
                  position: 'absolute',
                  bottom: '0.75rem',
                  right: '0.75rem',
                  zIndex: 5,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.9rem',
                  background: copied ? 'rgba(34,197,94,0.95)' : 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '999px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.5rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: copied ? '#fff' : SKY_BLUE,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.background = 'rgba(1,69,168,0.08)' } }}
                onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.background = 'rgba(255,255,255,0.95)' } }}
                title="Copy embed code"
              >
                {copied ? (
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

            {/* Contact Form */}
            <div className="c-contact-card" style={{ animationDelay: '0.5s', padding: '2.5rem 2rem' }}>
              <div className="c-icon-wrap">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                </svg>
              </div>

              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                color: DARK,
                fontWeight: 700,
                marginBottom: '0.3rem',
              }}>Get in Touch</h3>

              <div className="c-gold-divider" style={{ marginBottom: '1.5rem' }} />

              <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <input type="text" placeholder="First Name" value={form.firstName} onChange={e => update('firstName', e.target.value)} style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1.5px solid #E2EBF5', fontFamily: 'var(--font-body)', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.3s', background: '#F8FAFD' }} onFocus={e => e.target.style.borderColor = SKY_BLUE} onBlur={e => e.target.style.borderColor = '#E2EBF5'} />
                  <input type="text" placeholder="Last Name" value={form.lastName} onChange={e => update('lastName', e.target.value)} style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1.5px solid #E2EBF5', fontFamily: 'var(--font-body)', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.3s', background: '#F8FAFD' }} onFocus={e => e.target.style.borderColor = SKY_BLUE} onBlur={e => e.target.style.borderColor = '#E2EBF5'} />
                </div>
                <input type="tel" placeholder="Phone Number" value={form.phone} onChange={e => update('phone', e.target.value)} style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1.5px solid #E2EBF5', fontFamily: 'var(--font-body)', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.3s', background: '#F8FAFD' }} onFocus={e => e.target.style.borderColor = SKY_BLUE} onBlur={e => e.target.style.borderColor = '#E2EBF5'} />
                <input type="email" placeholder="Email Address" value={form.email} onChange={e => update('email', e.target.value)} style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1.5px solid #E2EBF5', fontFamily: 'var(--font-body)', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.3s', background: '#F8FAFD' }} onFocus={e => e.target.style.borderColor = SKY_BLUE} onBlur={e => e.target.style.borderColor = '#E2EBF5'} />
                <textarea placeholder="Comments" rows="4" value={form.comments} onChange={e => update('comments', e.target.value)} style={{ padding: '0.85rem 1rem', borderRadius: '12px', border: '1.5px solid #E2EBF5', fontFamily: 'var(--font-body)', fontSize: '0.88rem', outline: 'none', transition: 'border-color 0.3s', background: '#F8FAFD', resize: 'vertical' }} onFocus={e => e.target.style.borderColor = SKY_BLUE} onBlur={e => e.target.style.borderColor = '#E2EBF5'} />
                {formMsg && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: formMsg.includes('sent') || formMsg.includes('success') ? '#16A34A' : '#DC2626', margin: 0 }}>{formMsg}</p>
                )}
                <button type="submit" disabled={formLoading} style={{ width: '100%', padding: '0.9rem', background: formLoading ? '#94A3B8' : `linear-gradient(135deg,${SKY_BLUE},#0a2a5e)`, color: '#fff', border: 'none', borderRadius: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, cursor: formLoading ? 'not-allowed' : 'pointer', transition: 'all 0.3s', boxShadow: formLoading ? 'none' : '0 4px 16px rgba(1,69,168,0.25)' }}>
                  {formLoading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
