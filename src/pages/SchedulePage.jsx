const PACKAGES = [
  {
    id: 2,
    name: 'Basic',
    subtitle: 'Package A',
    hours: '2 Hours',
    detail: 'Behind the Wheel',
    price: '$210',
    desc: '2 Hrs Professional Training',
    color: '#008ED3',
    highlight: false,
  },
  {
    id: 12,
    name: 'Basic',
    subtitle: 'Package D',
    hours: '4 Hours',
    detail: 'Behind the Wheel',
    price: '$399',
    desc: '4 Hrs Professional Training',
    color: '#004C97',
    highlight: false,
  },
  {
    id: 3,
    name: 'Essential',
    subtitle: 'Package B',
    hours: '6 Hours',
    detail: 'Behind the Wheel',
    price: '$599',
    desc: 'Behind The Wheel Only',
    color: '#004C97',
    highlight: false,
  },
  {
    id: 8,
    name: 'Ideal',
    subtitle: 'Package C',
    hours: '6 Hours',
    detail: 'BTW + Online Driver Ed',
    price: '$615',
    desc: '6 Hrs BTW + Online Driver Ed',
    color: '#008ED3',
    highlight: true,
  },
  {
    id: 4,
    name: 'Premier',
    subtitle: 'Package E',
    hours: '10 Hours',
    detail: 'Behind the Wheel',
    price: '$999',
    desc: '6 Hours + 4 Extra Hours',
    color: '#FF6E35',
    highlight: false,
  },
]

const cardCSS = `
  .sched-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 2.5rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .sched-card:hover {
    transform: translateY(-4px);
    border-color: rgba(253,188,1,0.3);
    box-shadow: 0 12px 40px rgba(0,0,0,0.3);
  }
  .sched-card-highlight {
    border-color: var(--color-gold) !important;
    background: rgba(253,188,1,0.04) !important;
    box-shadow: 0 0 40px rgba(253,188,1,0.08);
  }
  .sched-card-highlight::before {
    content: 'MOST POPULAR';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-gold);
    color: #0145A8;
    font-family: var(--font-mono);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    padding: 0.35rem 1.25rem;
  }
`

export default function SchedulePage() {
  return (
    <div style={{ paddingTop: '12rem', minHeight: '100vh' }}>
      <style>{cardCSS}</style>

      <div className="container" style={{ maxWidth: '72rem', marginBottom: '6rem' }}>

        {/* HEADER */}
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <img
            src="/driving-logo.png"
            alt="A Precision Driving School"
            style={{
              height: 'clamp(100px, 14vw, 160px)',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 1.5rem',
              filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.85)) drop-shadow(0 0 18px rgba(253,188,1,0.45))',
            }}
          />
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: '#ffffff', marginBottom: '0.5rem', lineHeight: 1.1 }}>
            Schedule Appointments
          </h1>
          <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
            <span className="gold-bar" style={{ width: '20px' }} />
            Behind-the-Wheel Training
            <span className="gold-bar" style={{ width: '20px' }} />
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '42ch', margin: '0 auto 0.5rem' }}>
            Choose a package and register online. For live chat call{' '}
            <span style={{ color: 'var(--color-gold)', fontWeight: 700 }}>925-329-1736</span> (9am–5pm)
          </p>
        </div>

        {/* PACKAGE GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '3rem',
        }}>
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`sched-card ${pkg.highlight ? 'sched-card-highlight' : ''}`}
            >
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: pkg.color,
                marginBottom: '0.4rem',
              }}>
                {pkg.subtitle}
              </p>

              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                color: '#ffffff',
                marginBottom: '0.3rem',
              }}>
                {pkg.name}
              </h3>

              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '1.25rem',
              }}>
                {pkg.hours} {pkg.detail}
              </p>

              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2.2rem',
                fontWeight: 700,
                color: 'var(--color-gold)',
                marginBottom: '0.25rem',
              }}>
                {pkg.price}
              </div>

              <p style={{
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.5)',
                marginBottom: '2rem',
                flexGrow: 1,
              }}>
                {pkg.desc}
              </p>

              <a
                href={`https://www.aprecisiondrivingschool.com/schedule/register.html/${pkg.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={pkg.highlight ? 'btn-gold' : 'btn-ghost'}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Register Now
              </a>
            </div>
          ))}
        </div>

        {/* LOGIN LINK */}
        <div className="reveal" style={{
          textAlign: 'center',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem' }}>
            Already a registered user?{' '}
            <a
              href="https://www.aprecisiondrivingschool.com/schedule/cart_login_check.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-gold)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '3px' }}
            >
              Click here to login
            </a>
          </p>
        </div>

      </div>
    </div>
  )
}
