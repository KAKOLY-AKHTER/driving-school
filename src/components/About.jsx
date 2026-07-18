const aboutCSS = `
  .about-card {
    background: #ffffff;
    border: 1px solid #E2EBF5;
    padding: 2.25rem 1.75rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .about-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 50px rgba(1,69,168,0.1);
  }
  .about-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #0145A8, #FDBC01);
  }
  .about-icon-circle {
    width: 56px; height: 56px;
    margin: 0 auto 1.25rem;
    background: rgba(1,69,168,0.06);
    border: 1.5px solid rgba(1,69,168,0.12);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
  }
  .about-divider {
    width: 60px; height: 2px;
    background: linear-gradient(90deg, #0145A8, #FDBC01);
    margin: 0 auto 2rem;
  }
  .about-program-card {
    background: #ffffff;
    border: 1px solid #E2EBF5;
    padding: 2.5rem 2rem;
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.3s ease;
  }
  .about-program-card:hover {
    box-shadow: 0 12px 40px rgba(1,69,168,0.08);
  }
  .about-program-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
  }
  .about-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 1rem;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 700;
  }
  .about-note-red {
    background: rgba(182,59,59,0.04);
    border: 1px solid rgba(182,59,59,0.12);
    border-left: 3px solid #B23B3B;
    padding: 1rem 1.25rem;
    margin-top: 1rem;
  }
  .about-note-blue {
    background: rgba(1,69,168,0.03);
    border: 1px solid rgba(1,69,168,0.1);
    border-left: 3px solid #0145A8;
    padding: 1rem 1.25rem;
    margin-top: 1rem;
  }
  .about-lesson-step {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.75rem 0;
  }
  .about-lesson-num {
    width: 32px; height: 32px; min-width: 32px;
    background: #0145A8;
    color: #ffffff;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
`

const FEATURES = [
  { icon: '👥', label: 'WHO WE ARE', text: 'Very friendly, patient, polite and professional looking instructors.' },
  { icon: '🛡️', label: 'OUR MISSION', text: 'Cars with Dual control system for students safety.' },
  { icon: '🎯', label: 'OUR VISION', text: 'Guaranteed low prices for professional training.' },
  { icon: '📘', label: 'OUR PROGRAMS', text: 'Online courses and behind the wheel training.' },
]

export default function About() {
  return (
    <section className="section-pad" style={{ backgroundColor: '#F8FAFD' }}>
      <style>{aboutCSS}</style>
      <div className="container" style={{ maxWidth: '72rem' }}>

        {/* TOP BADGE + TITLE */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: '#0145A8',
            padding: '0.55rem 1.25rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(1,69,168,0.25)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FDBC01" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', fontWeight: 700 }}>
              Approved by the DMV — License #E4566
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)', color: '#0145A8', marginBottom: '0.75rem', lineHeight: 1.1 }}>
            A Precision Driving School
          </h2>
          <div className="about-divider" />
          <p style={{ color: '#364B6B', maxWidth: '54ch', margin: '0 auto', lineHeight: 1.85, fontSize: '1.05rem' }}>
            Guaranteed low prices for professional training. We are fully Bonded, Licensed and Insured.
            Free Pickup and drop off from student's location — home OR school.
            Our Instructors have gone through full Background Check.
          </p>
        </div>

        {/* 4 FEATURE CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '5rem',
        }}>
          {FEATURES.map((f, i) => (
            <div key={f.label} className={`about-card reveal reveal-delay-${i + 1}`}>
              <div className="about-icon-circle">{f.icon}</div>
              <h4 style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#0145A8',
                marginBottom: '0.75rem',
                fontWeight: 700,
              }}>{f.label}</h4>
              <p style={{ color: '#364B6B', fontSize: '0.9rem', lineHeight: 1.7 }}>{f.text}</p>
            </div>
          ))}
        </div>

        {/* SCHEDULING SECTION */}
        <div className="reveal" style={{
          background: '#ffffff',
          border: '1px solid #E2EBF5',
          padding: 'clamp(2.5rem, 4vw, 3.5rem)',
          marginBottom: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px',
            background: 'linear-gradient(180deg, #0145A8, #FDBC01)',
          }} />

          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#0145A8', marginBottom: '1.25rem' }}>
            Scheduling An Appointment
          </h3>

          <p style={{ color: '#364B6B', lineHeight: 1.85, marginBottom: '1.5rem', fontSize: '1rem' }}>
            To schedule the appointment for 6hrs we recommend to have space in between the lessons so the students can practice.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.75rem' }}>
            <div className="about-lesson-step">
              <div className="about-lesson-num">1</div>
              <div>
                <span style={{ fontWeight: 700, color: '#0145A8', fontSize: '0.9rem' }}>Basics & Defensive Driving</span>
                <span style={{ color: '#364B6B', fontSize: '0.9rem' }}> — Fundamentals of safe driving on real streets.</span>
              </div>
            </div>
            <div className="about-lesson-step">
              <div className="about-lesson-num">2</div>
              <div>
                <span style={{ fontWeight: 700, color: '#0145A8', fontSize: '0.9rem' }}>All Kinds of Parking</span>
                <span style={{ color: '#364B6B', fontSize: '0.9rem' }}> — Parallel, perpendicular, hill parking and more.</span>
              </div>
            </div>
            <div className="about-lesson-step">
              <div className="about-lesson-num">3</div>
              <div>
                <span style={{ fontWeight: 700, color: '#0145A8', fontSize: '0.9rem' }}>Freeway Driving</span>
                <span style={{ color: '#364B6B', fontSize: '0.9rem' }}> — Highway merging, lane changes, and high-speed confidence.</span>
              </div>
            </div>
          </div>

          <a
            href="https://www.aprecisiondrivingschool.com/schedule/cart_home.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
            style={{ display: 'inline-flex' }}
          >
            Schedule Your Lessons Now
          </a>
        </div>

        {/* TEENAGERS & ADULTS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

          {/* TEENAGERS */}
          <div className="about-program-card reveal">
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(90deg, #0145A8, #FDBC01)',
            }} />
            <div className="about-tag" style={{ background: '#0145A8', color: '#ffffff', marginBottom: '1.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              Teenagers
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#0145A8', marginBottom: '1rem' }}>
              6 Hours Required
            </h4>
            <p style={{ color: '#364B6B', fontSize: '0.9rem', lineHeight: 1.8, marginBottom: '0.75rem' }}>
              Divided into <strong style={{ color: '#0145A8' }}>3 lessons</strong> of 2 hrs each.
              After taking one 2hr lesson our instructor will sign off the permit and student can legally drive with Parents.
            </p>
            <p style={{ color: '#364B6B', fontSize: '0.9rem', lineHeight: 1.8, marginBottom: '0.5rem' }}>
              They have to carry their permit in order to drive with anyone.
            </p>
            <div className="about-note-red">
              <p style={{ color: '#8B3A3A', fontSize: '0.82rem', lineHeight: 1.65 }}>
                <strong>Please note:</strong> Permit must be carried at every lesson. Otherwise there will be a <strong>$60 charge</strong>.
                There is a flat <strong>$60 processing fee</strong> on any refunds. Please read the cancellation policy.
              </p>
            </div>
          </div>

          {/* ADULTS */}
          <div className="about-program-card reveal">
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(90deg, #FDBC01, #0145A8)',
            }} />
            <div className="about-tag" style={{ background: '#FDBC01', color: '#0145A8', marginBottom: '1.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              Adults
            </div>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#0145A8', marginBottom: '1rem' }}>
              Own License Required
            </h4>
            <p style={{ color: '#364B6B', fontSize: '0.9rem', lineHeight: 1.8, marginBottom: '0.75rem' }}>
              Adults can take a driving lesson with their own country License — only if it's valid.
              They have to bring it to the driving lesson.
            </p>
            <p style={{ color: '#364B6B', fontSize: '0.9rem', lineHeight: 1.8, marginBottom: '0.5rem' }}>
              In order to get a California license, adults have to get the Learner's Permit from the DMV.
            </p>
            <div className="about-note-blue">
              <p style={{ color: '#364B6B', fontSize: '0.82rem', lineHeight: 1.65 }}>
                Any questions? Text us at{' '}
                <strong style={{ color: '#0145A8' }}>+1 925-329-1736</strong> (do not call or leave voicemail)
                or email <strong style={{ color: '#0145A8' }}>aprecisiondrivingschool@gmail.com</strong>
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
