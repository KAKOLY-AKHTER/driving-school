import { useState } from 'react'
import { Link } from 'react-router-dom'

const progCSS = `
  .prog-section {
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(circle at 8% 15%, rgba(1,69,168,0.07), transparent 28%),
      radial-gradient(circle at 92% 82%, rgba(253,188,1,0.09), transparent 24%),
      linear-gradient(180deg, #f8fbff 0%, #ffffff 48%, #f7faff 100%);
  }
  .prog-section::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: .28;
    pointer-events: none;
    background-image: radial-gradient(rgba(1,69,168,.17) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: linear-gradient(to bottom, transparent, #000 22%, #000 75%, transparent);
  }
  .prog-shell { position: relative; z-index: 1; }
  .programs-grid { display: grid; gap: clamp(1.25rem, 2.5vw, 2rem); }
  .prog-card {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: rgba(255,255,255,.94);
    border: 1px solid rgba(1,69,168,.12);
    border-radius: 28px;
    box-shadow: 0 18px 55px rgba(15,39,74,.09), 0 2px 8px rgba(15,39,74,.04);
    transition: transform .45s cubic-bezier(.22,1,.36,1), box-shadow .45s cubic-bezier(.22,1,.36,1), border-color .3s ease;
  }
  .prog-card:hover {
    transform: translateY(-10px);
    border-color: rgba(1,69,168,.26);
    box-shadow: 0 30px 75px rgba(1,69,168,.16), 0 8px 24px rgba(15,39,74,.08);
  }
  .prog-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    z-index: 4;
    background: linear-gradient(90deg, #0145A8, #2f7be5 55%, #FDBC01);
  }
  .prog-img-wrap {
    width: calc(100% - 1.5rem);
    height: clamp(280px, 28vw, 350px);
    margin: .75rem .75rem 0;
    overflow: hidden;
    position: relative;
    border-radius: 21px;
    background: #eaf0f7;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.28), 0 8px 24px rgba(15,39,74,.10);
  }
  .prog-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: transform .7s cubic-bezier(.22,1,.36,1), filter .5s ease;
    background: #F0F4F8;
    filter: saturate(1.04) contrast(1.035) brightness(1.025);
  }
  .prog-card:hover .prog-img-wrap img {
    transform: scale(1.055);
    filter: saturate(1.08) contrast(1.045) brightness(1.035);
  }
  .prog-img-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, transparent 62%, rgba(3,20,43,.08) 76%, rgba(3,20,43,.34) 100%);
    pointer-events: none;
  }
  .prog-img-badge {
    position: absolute;
    bottom: 1.15rem;
    left: 1.15rem;
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    padding: .55rem 1rem;
    font-family: var(--font-mono);
    font-size: .66rem;
    letter-spacing: .13em;
    text-transform: uppercase;
    font-weight: 800;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.26);
    box-shadow: 0 8px 22px rgba(3,20,43,.24);
    backdrop-filter: blur(10px);
  }
  .prog-img-number {
    position: absolute;
    top: 1.1rem;
    right: 1.1rem;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    color: #fff;
    background: rgba(3,20,43,.58);
    border: 1px solid rgba(255,255,255,.26);
    backdrop-filter: blur(12px);
    font-family: var(--font-mono);
    font-size: .72rem;
    font-weight: 800;
    letter-spacing: .08em;
  }
  .prog-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: clamp(1.7rem, 3vw, 2.4rem);
  }
  .prog-meta { display: flex; flex-wrap: wrap; gap: .55rem; margin-bottom: 1.25rem; }
  .prog-meta span {
    display: inline-flex;
    align-items: center;
    gap: .38rem;
    padding: .42rem .7rem;
    color: #0145A8;
    background: #edf5ff;
    border: 1px solid rgba(1,69,168,.10);
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: .62rem;
    font-weight: 800;
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  .prog-bullet {
    display: flex;
    gap: .8rem;
    align-items: flex-start;
    color: #334b6d;
    line-height: 1.65;
  }
  .prog-dot {
    width: 23px; height: 23px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(253,188,1,.20), rgba(253,188,1,.08));
    border: 1px solid rgba(200,150,12,.22);
    color: #0145A8;
    margin-top: .05rem;
    flex-shrink: 0;
  }
  .prog-policy {
    margin: auto 0 1.25rem;
    padding: 1rem 1.05rem;
    border: 1px solid #e3ebf5;
    border-radius: 14px;
    background: linear-gradient(135deg,#f8fbff,#fff);
  }
  .prog-accordion-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    padding: 0;
    color: #0145A8;
  }
  .prog-policy-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .32s ease; }
  .prog-policy-body.open { grid-template-rows: 1fr; }
  .prog-policy-inner { overflow: hidden; }
  .prog-cta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    padding: 1rem 1.15rem;
    border-radius: 14px;
    color: #fff;
    background: linear-gradient(135deg,#0145A8,#07336f);
    box-shadow: 0 10px 24px rgba(1,69,168,.22);
    text-decoration: none;
    font-family: var(--font-body);
    font-size: .9rem;
    font-weight: 800;
    transition: transform .3s ease, box-shadow .3s ease;
  }
  .prog-card:nth-child(2) .prog-cta { color: #07192f; background: linear-gradient(135deg,#FDBC01,#FFD75C); box-shadow: 0 10px 24px rgba(253,188,1,.25); }
  .prog-cta:hover { transform: translateY(-2px); box-shadow: 0 15px 32px rgba(1,69,168,.30); }
  @media (min-width: 900px) { .programs-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } }
  @media (max-width: 640px) {
    .prog-card { border-radius: 22px; }
    .prog-img-wrap { width: calc(100% - 1rem); margin: .5rem .5rem 0; height: 250px; border-radius: 17px; }
    .prog-content { padding: 1.4rem; }
  }
`

function buildPrograms() {
  return [
  {
    id: 'teens',
    label: 'Teenagers',
    title: 'Six hours. Three lessons. One permit sign-off.',
    img: '/behind-wheel-training.jpg',
    imgFallback: '/teenager-car.png',
    imgWidth: 1000,
    imgHeight: 667,
    meta: ['6 training hours', '3 private lessons'],
    bullets: [
      'Six hours with an instructor, split into three 2-hour lessons',
      'We recommend spacing lessons apart so students have time to practice',
      'The instructor signs the permit after the first lesson so the student can legally practice with a parent',
    ],
    policyTitle: 'Important Requirements & Fees',
    policy: 'Students must bring their permit to every lesson. A missing permit or late cancellation carries a $60 fee; a flat $60 processing fee applies to any refund.',
    cta: 'Book Teen Lessons',
    href: '/schedule',
    gradient: 'linear-gradient(90deg, #0145A8, #0145A8)',
    tagBg: '#0145A8',
    tagColor: '#ffffff',
  },
  {
    id: 'adults',
    label: 'Adults',
    title: 'Bring a valid license. Leave with confidence.',
    img: '/prog-adult.png',
    imgFallback: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&h=400&fit=crop',
    imgWidth: 1199,
    imgHeight: 834,
    meta: ['One-on-one coaching', 'Flexible training'],
    bullets: [
      'Adults may train with a valid license from their own country',
      'Must bring license to every lesson',
      'To earn a California license, adults first need a learner\'s permit from the DMV',
    ],
    policyTitle: 'Communication Policy',
    policy: 'Please send questions by text instead of calling or leaving voicemail. We usually respond by text or email the same day.',
    cta: 'Book Adult Lessons',
    href: '/schedule',
    gradient: 'linear-gradient(90deg, #FDBC01, #FDBC01)',
    tagBg: '#FDBC01',
    tagColor: '#0145A8',
  }
]
}

export default function Programs() {
  const [openId, setOpenId] = useState(null)
  const PROGRAMS = buildPrograms()

  return (
    <section id="programs" className="section-pad prog-section">
      <style>{progCSS}</style>
      <div className="container prog-shell">

        <div className="reveal" style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem,5vw,4rem)' }}>
          <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', color: '#0145A8', background:'#fff', border:'1px solid rgba(1,69,168,.12)', borderRadius:'999px', padding:'.55rem 1rem', boxShadow:'0 8px 22px rgba(1,69,168,.07)' }}>
            <span style={{ width: '20px', height: '2px', background: '#FDBC01', display: 'inline-block' }} />
            Programs
            <span style={{ width: '20px', height: '2px', background: '#FDBC01', display: 'inline-block' }} />
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', color: '#0145A8', marginBottom: '0.75rem' }}>
            Training built around <span style={{ color:'#F2B600' }}>your goals.</span>
          </h2>
          <p style={{ maxWidth:'650px', margin:'0 auto', color:'#526783', fontSize:'clamp(.95rem,1.4vw,1.08rem)', lineHeight:1.75 }}>Professional one-on-one instruction for teen and adult drivers, delivered with patience, clarity and confidence.</p>
        </div>

        <div className="programs-grid">
          {PROGRAMS.map((prog, idx) => (
            <article key={prog.id} id={`program-${prog.id}`} className={`prog-card reveal reveal-delay-${idx + 1}`} style={{ scrollMarginTop: '9rem' }}>

              {/* IMAGE */}
              <div className="prog-img-wrap">
                <img
                  src={prog.img}
                  alt={prog.label}
                  width={prog.imgWidth}
                  height={prog.imgHeight}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.target.src = prog.imgFallback }}
                />
                <div className="prog-img-overlay" />
                <div className="prog-img-number">0{idx + 1}</div>
                <div className="prog-img-badge" style={{ background: prog.tagBg, color: prog.tagColor }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  {prog.label}
                </div>
              </div>

              <div className="prog-content">
                <div className="prog-meta">
                  {prog.meta.map(item => <span key={item}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>{item}</span>)}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.45rem, 2.5vw, 2rem)', color: '#0b326e', margin:'0 0 1.6rem', lineHeight: 1.18, letterSpacing:'-.02em' }}>
                  {prog.title}
                </h3>

                <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin:'0 0 2rem', padding:0, listStyle:'none' }}>
                  {prog.bullets.map((b, i) => (
                    <li key={i} className="prog-bullet">
                      <div className="prog-dot"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><path d="m6 12 4 4 8-9"/></svg></div>
                      <span style={{ fontSize: '0.93rem' }}>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* Accordion Policy */}
                <div className="prog-policy">
                  <button
                    className="prog-accordion-btn"
                    onClick={() => setOpenId(openId === prog.id ? null : prog.id)}
                    aria-expanded={openId === prog.id}
                  >
                    <span style={{ display:'flex', alignItems:'center', gap:'.55rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0145A8', fontWeight: 800 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      {prog.policyTitle}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="2.2" style={{
                      transform: openId === prog.id ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.3s ease',
                    }}><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <div className={`prog-policy-body ${openId === prog.id ? 'open' : ''}`}>
                    <div className="prog-policy-inner"><p style={{ color: '#334155', fontSize: '0.84rem', margin:'0.85rem 0 0', paddingTop:'.8rem', lineHeight: 1.65, borderTop:'1px solid #e7edf5' }}>{prog.policy}</p></div>
                  </div>
                </div>

                <Link to={prog.href} className="prog-cta">
                  <span>{prog.cta}</span>
                  <span style={{ width:'34px', height:'34px', borderRadius:'50%', display:'grid', placeItems:'center', background:'rgba(255,255,255,.18)' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span>
                </Link>
              </div>

            </article>
          ))}
        </div>

      </div>

    </section>
  )
}
