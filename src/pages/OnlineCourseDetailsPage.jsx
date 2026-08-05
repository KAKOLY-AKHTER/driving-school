import { Link } from 'react-router-dom'
import { usePageMeta } from '../usePageMeta'

const lessons = [
  'Driving Is Your Responsibility', 'The Driver', 'Natural Forces Affecting the Driver',
  'Signs, Signals and Highway Markings', 'California Vehicle Code and Rules of the Road',
  'Causes and Costs of Accidents', 'Differences in Urban and Rural Driving',
  'Critical Vehicle Systems and Subsystems', 'Pedestrian Safety', 'Effects of Alcohol and Drugs',
  'Motorcycle Safety', 'Risk Taking and Risk Perception of Teenagers', 'Substance Abuse',
  'Driving Experience', 'Road Rage',
]

export default function OnlineCourseDetailsPage() {
  usePageMeta('Online Driver Education Course Details', 'Review the complete California DMV-approved online driver education curriculum and enrollment information.')
  return (
    <div className="cd-page">
      <style>{`
        .cd-page{padding-top:10rem;background:#f3f7fd;color:#071b34;font-family:var(--font-body);min-height:100vh}
        .cd-wrap{width:min(1060px,calc(100% - 2rem));margin-inline:auto}
        .cd-nav{position:sticky;top:4.5rem;z-index:30;margin-top:1rem;background:#06285f;box-shadow:0 5px 16px rgba(2,20,48,.18)}
        .cd-nav-inner{min-height:58px;display:flex;align-items:center;justify-content:center;gap:.4rem 1rem;overflow-x:auto;scrollbar-width:none}
        .cd-nav-inner::-webkit-scrollbar{display:none}.cd-nav a{flex:0 0 auto;padding:.72rem 1rem;border-radius:7px;color:#fff;font-size:.76rem;font-weight:800;text-decoration:none;text-transform:uppercase;white-space:nowrap}
        .cd-nav a:hover{background:#FDBC01;color:#0145A8}.cd-nav a.active{color:#FDBC01;text-shadow:0 0 12px rgba(253,188,1,.6)}
        .cd-intro{padding:3.5rem 1rem;text-align:center;background:#eaf1fc;border-bottom:1px solid #d7e1ef}.cd-intro p{max-width:650px;margin:0 auto 1.4rem;color:#526277;line-height:1.8}.cd-pills{display:flex;justify-content:center;gap:.8rem;flex-wrap:wrap}.cd-pill{padding:.55rem 1rem;border-radius:999px;background:#fff;box-shadow:0 5px 16px rgba(15,40,75,.08);font-size:.78rem}.cd-pill strong{color:#e02d34}
        .cd-section{padding:4rem 0}.cd-title{text-align:center;font-family:var(--font-display);font-size:2.3rem;margin:0 0 2rem}.cd-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(260px,1fr);gap:2.5rem}.cd-lessons{display:grid;grid-template-columns:1fr 1fr;gap:.65rem}.cd-lesson{display:flex;align-items:center;background:#fff;border-radius:8px;box-shadow:0 5px 18px rgba(15,40,75,.07);overflow:hidden;font-size:.76rem;font-weight:800;text-transform:uppercase}.cd-lesson span{align-self:stretch;min-width:52px;display:grid;place-items:center;background:#063b82;color:#fff;font-size:.9rem}.cd-lesson div{padding:.8rem}
        .cd-side{display:flex;flex-direction:column;gap:1rem}.cd-info{padding:1.3rem;background:#fff;border:1px solid #e1e8f1;border-radius:12px}.cd-info h3{margin:0 0 .7rem;color:#063b82}.cd-info p{margin:0;color:#64748b;font-size:.85rem;line-height:1.75}.cd-cta{margin-top:3rem;display:grid;grid-template-columns:.8fr 1.2fr;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 15px 40px rgba(15,40,75,.12)}.cd-price{display:grid;place-items:center;padding:2rem;background:linear-gradient(135deg,#061c45,#063b82);color:#fff;text-align:center}.cd-price strong{font-family:var(--font-display);font-size:3rem}.cd-buy{padding:2rem;display:flex;flex-direction:column;justify-content:center}.cd-btn{width:max-content;padding:.8rem 1.3rem;border-radius:6px;background:#e02d34;color:#fff;font-weight:800;text-decoration:none;box-shadow:0 7px 18px rgba(224,45,52,.25)}
        @media(max-width:760px){.cd-page{padding-top:9.5rem}.cd-nav{margin-top:.5rem}.cd-nav-inner{justify-content:flex-start;padding-inline:.6rem}.cd-grid,.cd-cta{grid-template-columns:1fr}.cd-lessons{grid-template-columns:1fr}.cd-title{font-size:1.8rem}}
      `}</style>
      <nav className="cd-nav" aria-label="Online course sections"><div className="cd-wrap cd-nav-inner">
        <Link to="/online-drivers-ed">Home</Link><Link className="active" to="/online-drivers-ed/details">Course Details</Link><Link to="/online-drivers-ed/pricing">Pricing</Link><Link to="/online-drivers-ed/permit">Permit</Link><Link to="/online-drivers-ed/driver-license">Driver License</Link><Link to="/">Behind the Wheel</Link>
      </div></nav>
      <section className="cd-intro"><p>Fifteen structured lessons walk you from basic responsibility through advanced topics—at your own pace, on any device—so you are prepared for your permit and supervised driving.</p><div className="cd-pills"><span className="cd-pill"><strong>15</strong> lessons</span><span className="cd-pill"><strong>100%</strong> online</span><span className="cd-pill"><strong>Certificate</strong> included</span></div></section>
      <section className="cd-section"><div className="cd-wrap"><h1 className="cd-title">Course Details</h1><div className="cd-grid"><div><h2 style={{fontSize:'1.25rem'}}>Curriculum Overview</h2><div className="cd-lessons">{lessons.map((lesson,i)=><div className="cd-lesson" key={lesson}><span>{String(i+1).padStart(2,'0')}</span><div>{lesson}</div></div>)}</div><div style={{textAlign:'center',marginTop:'1.5rem'}}><Link to="/register" className="cd-btn">Get Started</Link></div></div><aside className="cd-side"><div className="cd-info"><h3>Help When You Need It</h3><p>Our support team answers questions by live chat and email, whether you are a student or parent.</p></div><div className="cd-info"><h3>Quick, Secure Enrollment</h3><p>Complete the brief sign-up form and start your course immediately. Certificate delivery is straightforward.</p></div><div className="cd-info"><h3>Questions from Parents or Students?</h3><p>Get course guidance, technical assistance and answers to common topics from our team.</p></div></aside></div><div className="cd-cta"><div className="cd-price"><div><small>ONLY</small><br/><strong>$39.99</strong></div></div><div className="cd-buy"><h2>California DMV-Approved Teen Driver Education</h2><p style={{color:'#64748b'}}>100% online, self-paced lessons with your official completion certificate included.</p><Link to="/register" className="cd-btn">Sign Up Now</Link></div></div></div></section>
    </div>
  )
}
