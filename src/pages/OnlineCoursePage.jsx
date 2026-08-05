import { Link } from 'react-router-dom'
import { usePageMeta } from '../usePageMeta'

const BLUE = '#063b82'
const SKY = '#0866ff'
const DARK = '#071b34'

const lessons = [
  'Driving Is Your Responsibility', 'The Driver', 'Natural Forces Affecting the Driver',
  'Signs, Signals and Highway Markings', 'California Vehicle Code and Rules of the Road',
  'Causes and Costs of Accidents', 'Differences in Urban and Rural Driving',
  'Critical Vehicle Systems and Subsystems', 'Pedestrian Safety', 'Effects of Alcohol and Drugs',
  'Motorcycle Safety', 'Risk Taking and Risk Perception of Teenagers', 'Substance Abuse',
  'Driving Experience', 'Road Rage',
]

export default function OnlineCoursePage() {
  usePageMeta('California DMV-Approved Online Driver Education', 'Complete a DMV-approved online driver education course from any device and prepare for your California permit.')

  return (
    <div className="oc-page">
      <style>{`
        .oc-page { background:#f5f8fc; color:${DARK}; font-family:var(--font-body); padding-top:10rem; }
        .oc-subnav { position:sticky; top:4.5rem; z-index:30; margin-top:1rem; background:#06285f; box-shadow:0 5px 16px rgba(2,20,48,.18); }
        .oc-subnav-inner { min-height:58px; display:flex; align-items:center; justify-content:center; gap:.4rem 1.2rem; overflow-x:auto; scrollbar-width:none; }
        .oc-subnav-inner::-webkit-scrollbar { display:none; }
        .oc-subnav a { flex:0 0 auto; padding:.72rem 1.1rem; border-radius:7px; color:#fff; font-size:.78rem; font-weight:800; text-decoration:none; text-transform:uppercase; white-space:nowrap; transition:.2s ease; }
        .oc-subnav a:hover { background:#FDBC01; color:#0145A8; }
        .oc-subnav a.active { color:#FDBC01; text-shadow:0 0 12px rgba(253,188,1,.6); }
        .oc-container { width:min(1120px,calc(100% - 2rem)); margin-inline:auto; }
        .oc-hero { min-height:540px; display:flex; align-items:center; background:linear-gradient(90deg,rgba(3,20,43,.9),rgba(3,20,43,.2)),url('/hero2.jpg') center/cover; }
        .oc-panel { width:min(440px,100%); padding:2rem; color:#fff; background:rgba(5,25,52,.88); border-radius:18px; box-shadow:0 20px 60px rgba(0,0,0,.3); }
        .oc-btn { display:inline-flex; align-items:center; justify-content:center; padding:.9rem 1.6rem; border:0; border-radius:7px; background:${SKY}; color:#fff; font-weight:800; text-decoration:none; cursor:pointer; }
        .oc-section { padding:5rem 0; }
        .oc-title { margin:0 0 .6rem; text-align:center; color:${DARK}; font-family:var(--font-display); font-size:clamp(1.8rem,4vw,2.7rem); font-weight:800; }
        .oc-sub { max-width:660px; margin:0 auto 2.5rem; text-align:center; color:#64748b; }
        .oc-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:2rem; }
        .oc-card { padding:2rem 1.25rem; text-align:center; background:#fff; border:1px solid #dbe7f4; border-radius:16px; box-shadow:0 12px 35px rgba(15,40,75,.08); }
        .oc-number { width:38px; height:38px; margin:-3.2rem auto 1.2rem; display:grid; place-items:center; border-radius:50%; background:${SKY}; color:#fff; font-weight:800; box-shadow:0 7px 18px rgba(8,102,255,.3); }
        .oc-lessons { display:grid; grid-template-columns:repeat(2,1fr); gap:.65rem; }
        .oc-lesson { display:flex; align-items:center; gap:.8rem; padding:.8rem; background:#fff; border-radius:7px; box-shadow:0 4px 16px rgba(15,40,75,.06); font-size:.82rem; font-weight:700; }
        .oc-lesson span { min-width:38px; padding:.4rem; text-align:center; background:${BLUE}; color:#fff; border-radius:4px; }
        .oc-requirements { display:grid; grid-template-columns:repeat(2,1fr); gap:1.5rem; }
        .oc-requirement { padding:2rem; border-radius:14px; background:${BLUE}; color:#fff; box-shadow:0 14px 35px rgba(6,59,130,.2); }
        .oc-about { background:#fff; overflow:hidden; }
        .oc-about-inner { display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,1fr); gap:5rem; align-items:center; }
        .oc-about-visual { position:relative; min-height:530px; }
        .oc-about-visual::before { content:''; position:absolute; top:-18px; right:8%; width:280px; height:250px; background-image:radial-gradient(#d7e0eb 2px,transparent 2px); background-size:18px 18px; opacity:.8; }
        .oc-about-main { position:absolute; inset:15px 55px 70px 0; width:calc(100% - 55px); height:440px; object-fit:cover; border-radius:28px; box-shadow:0 22px 48px rgba(15,40,75,.14); }
        .oc-about-small { position:absolute; right:0; bottom:10px; width:48%; height:230px; object-fit:cover; border:6px solid #fff; border-radius:20px; box-shadow:0 22px 40px rgba(55,23,23,.2); }
        .oc-about-copy h2 { max-width:570px; margin:0 0 1.4rem; color:#052c67; font-family:var(--font-display); font-size:clamp(2.2rem,4.2vw,3.45rem); line-height:1.04; }
        .oc-about-copy p { color:#465b79; font-size:1rem; line-height:1.9; }
        .oc-checks { display:grid; grid-template-columns:1fr 1fr; gap:1.1rem 2rem; margin-top:1.4rem; padding:0; list-style:none; }
        .oc-checks li { position:relative; padding-left:2.35rem; color:#052c67; font-size:.98rem; font-weight:800; line-height:1.35; }
        .oc-checks li::before { content:'✓'; position:absolute; left:0; top:-2px; width:25px; height:25px; display:grid; place-items:center; border:2px solid #0755ae; border-radius:50%; color:#0755ae; font-size:.8rem; font-weight:900; }
        @media(max-width:760px) { .oc-page{padding-top:9.5rem}.oc-subnav{top:4.5rem;margin-top:.5rem}.oc-subnav-inner{justify-content:flex-start;padding-inline:.65rem}.oc-subnav a{font-size:.68rem;padding:.65rem .8rem}.oc-hero{min-height:620px}.oc-steps,.oc-requirements,.oc-about-inner{grid-template-columns:1fr}.oc-lessons{grid-template-columns:1fr}.oc-steps{gap:3rem}.oc-about-inner{gap:2rem}.oc-about-visual{min-height:390px}.oc-about-main{inset:10px 35px 55px 0;width:calc(100% - 35px);height:320px;border-radius:20px}.oc-about-small{width:52%;height:165px;border-width:4px}.oc-checks{grid-template-columns:1fr}.oc-about-copy h2{font-size:2.25rem} }
      `}</style>

      <nav className="oc-subnav" aria-label="Online course sections">
        <div className="oc-container oc-subnav-inner">
          <a className="active" href="#course-home">Home</a>
          <Link to="/online-drivers-ed/details">Course Details</Link>
          <Link to="/online-drivers-ed/pricing">Pricing</Link>
          <Link to="/online-drivers-ed/permit">Permit</Link>
          <Link to="/online-drivers-ed/driver-license">Driver License</Link>
          <Link to="/">Behind the Wheel</Link>
        </div>
      </nav>

      <section className="oc-hero" id="course-home">
        <div className="oc-container">
          <div className="oc-panel">
            <div style={{ color:'#ffd04a', fontWeight:800, fontSize:'.8rem', letterSpacing:'.12em', textTransform:'uppercase' }}>California State Approved</div>
            <h1 style={{ margin:'.55rem 0', fontFamily:'var(--font-display)', fontSize:'clamp(2rem,5vw,3.2rem)', lineHeight:1.05 }}>California DMV-Approved</h1>
            <p style={{ margin:'0 0 1rem', color:'rgba(255,255,255,.78)' }}>DMV License #E4566</p>
            <ul style={{ paddingLeft:'1.2rem', lineHeight:1.9, color:'rgba(255,255,255,.85)' }}>
              <li>100% online and mobile friendly</li><li>No hidden fees</li><li>Guaranteed to pass</li><li>Certificate of completion included</li>
            </ul>
            <Link to="/register" id="course-pricing" className="oc-btn" style={{ width:'100%', marginTop:'.75rem' }}>Buy Plan — $39.99</Link>
          </div>
        </div>
      </section>

      <section className="oc-section" id="course-details">
        <div className="oc-container">
          <h2 className="oc-title">Everything You Need, <span style={{ color:SKY }}>All in One Place.</span></h2>
          <p className="oc-sub">Complete your driver education requirements quickly and easily with our simple three-step process.</p>
          <div className="oc-steps">
            {[
              ['Pass Your Online Driver Ed','Complete our state-approved online course at your own pace from any device.'],
              ['Take Certificate to DMV','Bring your course completion certificate to your local DMV office.'],
              ["Get Your Driver's Permit",'With your certificate, you are one step closer to getting your permit.'],
            ].map((item,i)=><div className="oc-card" key={item[0]}><div className="oc-number">{i+1}</div><div style={{ fontSize:'2rem' }}>{['▣','★','▤'][i]}</div><h3>{item[0]}</h3><p style={{ color:'#64748b', fontSize:'.88rem', lineHeight:1.7 }}>{item[1]}</p></div>)}
          </div>
        </div>
      </section>

      <section className="oc-section" id="driver-license" style={{ background:'#edf3fa' }}>
        <div className="oc-container">
          <h2 className="oc-title">Complete Your Lesson</h2>
          <div className="oc-lessons">{lessons.map((lesson,i)=><div className="oc-lesson" key={lesson}><span>{String(i+1).padStart(2,'0')}</span>{lesson}</div>)}</div>
          <div style={{ textAlign:'center', marginTop:'2rem' }}><Link to="/register" className="oc-btn">Get Started</Link></div>
        </div>
      </section>

      <section className="oc-section" id="permit">
        <div className="oc-container">
          <h2 className="oc-title">Fulfill Your California Permit Requirements</h2>
          <p className="oc-sub" style={{ color:'#e93647', fontWeight:800 }}>Includes Free DMV Practice Test</p>
          <div className="oc-requirements">
            <div className="oc-requirement"><h3>Teenagers</h3><p style={{ color:'rgba(255,255,255,.75)', lineHeight:1.8 }}>California teens aged 15½ to 17½ must finish DMV-approved driver education before applying for an instruction permit.</p></div>
            <div className="oc-requirement"><h3>Adults</h3><p style={{ color:'rgba(255,255,255,.75)', lineHeight:1.8 }}>Eligible drivers can prepare for the written test, learn California road laws, and build safe driving knowledge.</p></div>
          </div>
        </div>
      </section>

      <section className="oc-section oc-about" id="behind-wheel">
        <div className="oc-container oc-about-inner">
          <div className="oc-about-visual">
            <img className="oc-about-main" src="/buy-plan1.png" alt="Student completing online driver education" />
            <img className="oc-about-small" src="/driving-lesson-premium.jpg" alt="Teen driver receiving behind-the-wheel guidance" loading="lazy" decoding="async" />
          </div>
          <div className="oc-about-copy">
            <h2>100% Online California Driver Education</h2>
            <p><strong style={{ color:'#052c67' }}>A Precision Driving School</strong> provides effective driver education for first-time drivers to learn safe driving skills and meet California DMV requirements. Students under 18 can complete their required education online before beginning supervised driving.</p>
            <p>Our registration, course and student information systems are secure, convenient and designed so learners can progress confidently from any device.</p>
            <ul className="oc-checks"><li>Access to Course Trainer</li><li>Live Chat Support</li><li>Log On and Off — Course Saves Your Progress</li><li>Get Unlimited Chances to Pass</li><li>Official DMV Certificate Upon Completion</li><li>Mobile-Friendly Learning</li></ul>
          </div>
        </div>
      </section>
    </div>
  )
}
