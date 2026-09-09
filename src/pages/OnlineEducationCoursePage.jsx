import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { usePageMeta } from '../usePageMeta'

const CHAPTERS = [
  { title: 'Driving Is Your Responsibility', lesson: "Driver's License: A Privilege", intro: 'Driving a motor vehicle requires knowledge, care and a strong sense of responsibility.', points: ['Make safety your first priority whenever you are behind the wheel.', 'Obey traffic rules and signals and be courteous to other road users.', 'Avoid distractions and unnecessary risks.', 'Understand how your vehicle works and keep it safe to operate.'], topics: ["Driver's License: A Privilege", 'Obeying the Laws', "Importance of Driver's Education", 'The New Laws in Driving', 'Smoke-Free Cars', 'History of the Automobile', 'Test 1'] },
  { title: 'The Human Factors Affecting the Driver', lesson: 'Eyes and Vision', intro: 'Safe decisions depend on vision, hearing, physical condition, attitude and attention.', points: ['Scan far ahead and check mirrors regularly.', 'Recognize fatigue, stress and limited visibility.', 'Stay focused and avoid aggressive behavior.'], topics: ['Eyes and Vision', 'The Ears and Hearing', 'Other Limiting Physical Conditions', 'Essential Attitudes', 'Undesirable Driving Behaviors', 'Test 2'] },
  { title: 'Natural Forces Affecting the Automobile', lesson: 'Gravity', intro: 'Gravity, inertia, friction and momentum affect every movement of a vehicle.', points: ['Adjust speed before curves and hills.', 'Leave enough room to stop safely.', 'Understand how road surface conditions affect traction.'], topics: ['Gravity', 'Inertia and Energy', 'Momentum and Friction', 'Centrifugal Force', 'Test 3'] },
  { title: 'Signs, Signals and Highway Markings', lesson: 'Traffic Signs: Shapes and Colors', intro: 'Traffic control devices communicate rules, warnings and guidance to every driver.', points: ['Learn sign shapes and colors.', 'Follow traffic lights and lane-control signals.', 'Read pavement markings before changing position.'], topics: ['Traffic Signs: Shapes and Colors', 'Traffic Control Signs', 'Traffic Regulatory Signs', 'Highway and Road Markings', 'Curb Markings', 'Test 4'] },
  { title: 'The Vehicle Systems', lesson: 'Construction of the Automobile', intro: 'A responsible driver understands the controls and safety systems of the vehicle.', points: ['Check tires, lights and fluid levels.', 'Know the purpose of dashboard warnings.', 'Use seat belts and safety equipment correctly.'], topics: ['Construction of the Automobile', 'The Steering Wheel and Dashboard', 'The Windshield and Mirrors', 'Car Safety Equipment', 'Vehicle Maintenance', 'Owning and Operating Cost and Safety Measures', 'Test 5'] },
  { title: 'Rules of the Road and Safe Driving Practices', lesson: 'Defensive Driving', intro: 'Defensive driving helps you anticipate hazards and make safe, lawful decisions.', points: ['Maintain a safe following distance.', 'Yield the right of way when required.', 'Choose a speed suitable for current conditions.'], topics: ['Defensive Driving', 'Basic Speed Law', 'Proper Lane Use', 'Safe Driving Practices: Intersections', 'Safe Driving Practices: Passing', 'Backing Up, Parallel Parking, Three-Point Turn', 'Test 6'] },
  { title: 'Sharing the Road and Accident Prevention', lesson: 'Tips for Sharing the Road When Driving', intro: 'Drivers must safely share the road with pedestrians, cyclists, motorcycles and large vehicles.', points: ['Check blind spots carefully.', 'Give vulnerable road users enough space.', 'Plan an escape path and expect the unexpected.'], topics: ['Tips for Sharing the Road When Driving', 'Causes of Accidents: Overview', 'Factors that Cause Accidents', 'Mechanical Failure: Causes and Prevention', 'Roadway: Causes and Prevention', 'Vehicle Safety Features Applications', 'Test 7'] },
  { title: 'Alcohol and Drugs and Driving', lesson: 'Alcohol as a Drug', intro: 'Alcohol, cannabis, medicines and other drugs can impair judgment and vehicle control.', points: ['Never drive while impaired.', 'Plan a sober ride before consuming alcohol.', 'Understand that legal medicines may also affect driving.'], topics: ['Alcohol as a Drug', 'Alcohol and the Human Body', 'Effects of Alcohol on the Body Organs', 'Identifying Drunk Drivers', 'Alternatives to Drinking and Driving', 'Drugs', 'DUI Laws', 'Test 8'] },
  { title: 'Licensing, Registrations and California Vehicle Codes', lesson: 'Licensing', intro: 'California law sets requirements for licensing, vehicle registration and financial responsibility.', points: ['Carry a valid license and required documents.', 'Keep registration and insurance current.', 'Understand the responsibilities of a licensed driver.'], topics: ['Licensing', 'Registration', 'California Vehicle Codes', 'Test 9'] },
  { title: "Acquiring a California Driver's License", lesson: "Process in Obtaining a California Driver's License", intro: 'Follow each permit, practice and testing requirement before applying for a driver license.', points: ['Complete the required driver education.', 'Practice with a qualified supervising driver.', 'Prepare your vehicle and documents for the road test.'], topics: ["Process in Obtaining a California Driver's License", 'California License Class', 'Other Licensing Information', 'California Identification Card', 'Test 10'] },
  { title: 'Final Test', lesson: 'Final Test', intro: 'Review the complete curriculum before beginning the final knowledge assessment.', points: ['Revisit any chapter that needs more study.', 'Read every question carefully.', 'Apply safe-driving principles to each situation.'], topics: ['Final Test'] },
]

function DriverLicensePrivilegeLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson">
      <div className="oe-lesson-heading-row">
        <h3 className="oe-chapter-kicker">1.1 Driver&apos;s License: A Privilege</h3>
        <div className="oe-mini-nav" aria-label="Lesson navigation">
          <button type="button" onClick={onPrevious} aria-label="Previous lesson">&#9664;</button>
          <button type="button" onClick={onNext} aria-label="Next lesson">&#9654;</button>
        </div>
      </div>

      <p className="oe-lesson-lead">Having a driver&apos;s license is a privilege, not a right.</p>
      <img className="oe-license-hero" src="/driver-lisence1.png" alt="Driver license privilege illustration" />

      <section className="oe-copy-section">
        <h4>What does your license means to you?</h4>
        <ul className="oe-nested-list">
          <li>Your license means that:
            <ul>
              <li>You have passed a written and driving test on the rules and regulations of the road.</li>
              <li>You have been given the responsibility of driving a motor vehicle and that you understand how to operate a motor vehicle.</li>
              <li>You must take your responsibilities seriously. You are responsible for all of your acts when you are behind the wheel of an automobile. Being a negligent driver may cause you the loss, suspension, or revocation of your driver&apos;s license.</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="oe-copy-section">
        <h4>What does your license mean to others?</h4>
        <ul className="oe-nested-list">
          <li>Your license tells other drivers that:
            <ul>
              <li>You have the information and the skills to handle and operate a motor vehicle.</li>
              <li>You know and understand the rules and regulations of the roadways.</li>
              <li>You value the fact that the State of California gave you the privilege to drive.</li>
            </ul>
          </li>
        </ul>
      </section>

      <aside className="oe-note-box">
        <strong>Note:</strong>
        <p>Be aware that the other users of the roadways are subjected to your driving habits and behavior.</p>
        <ul>
          <li>If you are, or act, as a negligent or irresponsible driver, death or injury may come to others.</li>
          <li>If you are a teenager and act negligently and irresponsibly, your parents will be responsible for your actions. The parents of a teen are financially liable for their teen drivers&apos; actions.</li>
        </ul>
      </aside>

      <section className="oe-copy-section">
        <h4>Operating a Motor Vehicle Is a Serious Responsibility</h4>
        <p>It is important to focus and think clearly when you are driving because lives are at stake. Be in the right mind and be aware of what you are doing at all times. Make good judgments when you drive.</p>
        <h4>The Motor Vehicle Is a Weapon</h4>
        <p>The car that you drive could cause serious damage to you and those that are around your vehicle. Remember that even at low speeds of 1-35 MPH, you can seriously hurt or even kill a person or an animal.</p>
        <h4>Automobile Areas Dangerous As a Loaded Gun</h4>
        <p>Distracted drivers can cause serious injuries and death on the roadways. If your eyes and attention are on the road and your surroundings, you are in a position to react in time to avoid an accident.</p>
        <p>Factors that can cause danger to the driver and others:</p>
        <ul>
          <li>Drunk driving</li>
          <li>Cell phones and texting</li>
          <li>Driving tired</li>
          <li>Speed</li>
          <li>Vehicle malfunction</li>
          <li>Bad weather and road conditions</li>
        </ul>
      </section>

      <div className="oe-video-wrap">
        <iframe
          src="https://www.youtube.com/embed/6Hcfph_g3JE"
          title="Safe Driving Tips"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      <section className="oe-copy-section">
        <h4 className="oe-underlined">Parking Responsibility</h4>
        <ul className="oe-nested-list">
          <li>Always set your emergency brake when parking your vehicle. This will give added security that your car will not roll away.
            <ul>
              <li>If your vehicle has an automatic transmission, make sure that you set the gear in the park position.</li>
              <li>Standard transmission (stick shift) cars are parked in either first gear or reverse, depending if you are on a flat surface, uphill, or downhill position.</li>
            </ul>
          </li>
          <li>All types of vehicles should follow the same rules when parking on a hill.</li>
        </ul>
        <h4><em>Uphill, Against the Curb</em></h4>
        <ul>
          <li>Turn the vehicle&apos;s front wheels to the left so that the back of the front-right tire rests against the curb.</li>
          <li>Be sure to set use your emergency brake before you exit your car.</li>
        </ul>
        <h4><em>Downhill</em></h4>
        <ul>
          <li>Turn the vehicle&apos;s wheels to the right so that the front of the tire is up against the curb.</li>
        </ul>
      </section>

      <img className="oe-parking-image" src="/driver-lisence2.png" alt="Correct wheel positions for downhill and uphill parking" />

      <div className="oe-tip-row">
        <img src="/driver-lisence3-png.png" alt="Tip" />
        <p>Always keep your vehicle in top working condition. Get in a habit of having your vehicle in for a regular maintenance check. Be safe and be aware.</p>
      </div>

      <div className="oe-bottom-nav">
        <button type="button" onClick={onPrevious}>&larr; Previous</button>
        <button type="button" onClick={onNext}>Next &rarr;</button>
      </div>
    </article>
  )
}

export default function OnlineEducationCoursePage() {
  usePageMeta('30 Hour Drivers Ed Curriculum — A Precision Driving School', 'Protected online driver education curriculum.', { noIndex: true })
  const navigate = useNavigate()
  const [activeChapter, setActiveChapter] = useState(0)
  const [activeLesson, setActiveLesson] = useState(-1)
  const [openChapters, setOpenChapters] = useState(() => new Set([0]))
  const [started, setStarted] = useState(false)
  const chapter = useMemo(() => CHAPTERS[activeChapter], [activeChapter])
  const selectedLesson = activeLesson >= 0 ? chapter.topics[activeLesson] : chapter.lesson
  const isDriverLicenseLesson = activeChapter === 0 && activeLesson === 0

  const selectChapter = index => {
    setActiveChapter(index)
    setActiveLesson(-1)
    setStarted(false)
    setOpenChapters(current => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const selectLesson = (chapterIndex, lessonIndex) => {
    setActiveChapter(chapterIndex)
    setActiveLesson(lessonIndex)
    setStarted(false)
    setOpenChapters(current => new Set(current).add(chapterIndex))
  }

  const showCourseMap = () => {
    setOpenChapters(new Set(CHAPTERS.map((_, index) => index)))
    setActiveChapter(0)
    setActiveLesson(-1)
    setStarted(false)
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/online-drivers-ed/login', { replace: true })
  }

  const goToPreviousLesson = () => {
    setActiveChapter(0)
    setActiveLesson(-1)
    setStarted(false)
    setOpenChapters(current => new Set(current).add(0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToNextLesson = () => {
    setActiveChapter(0)
    setActiveLesson(1)
    setStarted(false)
    setOpenChapters(current => new Set(current).add(0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="oe-course-page">
      <style>{`
        .oe-course-page{min-height:100vh;background:#f4f7fb;color:#111827;font-family:var(--font-body)}
        .oe-course-header{background:linear-gradient(100deg,#3677c6,#4b8bd4);border-bottom:1px solid rgba(255,255,255,.18)}.oe-course-head-inner{width:min(1200px,calc(100% - 2rem));height:84px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:2rem}.oe-course-logo{display:block;width:74px;height:74px;object-fit:contain;filter:drop-shadow(0 4px 10px rgba(3,32,80,.18))}.oe-logout{min-height:38px;padding:.55rem 1rem;border:1px solid rgba(255,255,255,.8);border-radius:6px;background:#b91c1c;color:#fff;font:800 .72rem var(--font-mono);letter-spacing:.06em;cursor:pointer;box-shadow:0 5px 14px rgba(72,10,10,.2)}
        .oe-course-nav{background:#06338f;box-shadow:0 4px 16px rgba(4,32,86,.18)}.oe-course-nav-inner{width:min(1200px,calc(100% - 2rem));min-height:44px;margin:auto;display:flex;align-items:center;gap:.2rem}.oe-course-nav a,.oe-course-nav button{padding:.65rem .9rem;border:0;background:none;color:#fff;font:700 .82rem var(--font-body);text-decoration:none;cursor:pointer}.oe-course-nav a:hover,.oe-course-nav button:hover{background:rgba(255,255,255,.12)}
        .oe-course-layout{width:min(1200px,calc(100% - 2rem));margin:1.25rem auto 3rem;display:grid;grid-template-columns:330px minmax(0,1fr);gap:1.1rem;align-items:start}.oe-curriculum,.oe-lesson-card{overflow:hidden;border:1px solid #cbd5e1;border-radius:7px;background:#fff;box-shadow:0 8px 24px rgba(15,45,82,.07)}.oe-panel-title{margin:0;padding:.85rem 1rem;background:#0733a0;color:#fff;font-family:var(--font-display);font-size:1.08rem}.oe-chapter-list{margin:0;padding:0;list-style:none}.oe-chapter-item{border-bottom:1px solid #dbe2ea}.oe-chapter-item:last-child{border-bottom:0}.oe-chapter-btn{display:grid;grid-template-columns:23px minmax(0,1fr) 18px;align-items:center;gap:.25rem;width:100%;padding:.75rem .7rem;border:0;background:#f5f7fa;color:#34291f;font-size:.72rem;font-weight:700;text-align:left;text-transform:uppercase;cursor:pointer;line-height:1.35}.oe-chapter-btn:hover{background:#fff8dd}.oe-chapter-btn.active{background:#fff1b8;color:#0733a0}.oe-check{color:#ef3340;font-size:1rem;font-weight:900}.oe-chevron{color:#0145a8;font-size:.8rem;text-align:center;transition:transform .2s ease}.oe-chapter-btn[aria-expanded="true"] .oe-chevron{transform:rotate(180deg)}.oe-sublesson-list{display:grid;padding:.35rem 0 .55rem;background:#fff}.oe-sublesson{width:100%;padding:.38rem .8rem .38rem 2.75rem;border:0;background:#fff;color:#334155;font-size:.76rem;line-height:1.3;text-align:left;cursor:pointer}.oe-sublesson:hover{background:#eef5ff;color:#0145a8}.oe-sublesson.active{background:#e7f0ff;color:#0145a8;font-weight:800;box-shadow:inset 3px 0 #fdbc01}
        .oe-lesson-title{margin:0;padding:.85rem 1.2rem;background:#0733a0;color:#fff;font-family:var(--font-display);font-size:1.08rem}.oe-lesson-body{padding:clamp(1.2rem,3vw,2rem);background:#f9fafb;min-height:520px}.oe-chapter-kicker{margin:0 0 .8rem;color:#0145a8;font-family:var(--font-display);font-size:clamp(1.25rem,2.5vw,1.8rem);font-style:italic}.oe-intro{font-weight:800;font-size:1rem}.oe-chapter-image{display:block;width:min(210px,48%);height:auto;margin:1.2rem auto;object-fit:contain;filter:drop-shadow(0 12px 22px rgba(1,69,168,.15))}.oe-responsibility{width:130px;height:130px;margin:1.3rem auto;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#68b9ff,#0569bd 58%,#043b77);color:#fff;text-align:center;font:900 .72rem var(--font-mono);letter-spacing:.08em;box-shadow:0 15px 30px rgba(1,69,168,.2)}.oe-points{max-width:760px;margin:1rem auto;line-height:1.6}.oe-lesson-position{text-align:center;color:#637892;font:700 .68rem var(--font-mono);letter-spacing:.08em;text-transform:uppercase}.oe-start-wrap{text-align:center;margin-top:1.6rem}.oe-start{padding:.78rem 1.15rem;border:0;border-radius:6px;background:#273242;color:#fff;font-weight:800;cursor:pointer}.oe-start.started{background:#15803d}.oe-lesson-note{max-width:760px;margin:1rem auto 0;padding:.85rem 1rem;border:1px solid #bbf7d0;border-radius:7px;background:#f0fdf4;color:#166534;text-align:center}.oe-course-footer{padding:1rem;background:#0733a0;color:#dbeafe;text-align:center;font-size:.78rem}
        .oe-lesson-body.detailed{padding:clamp(1rem,2.4vw,1.7rem)}.oe-full-lesson{max-width:820px;margin:auto;color:#172033;font-size:.9rem;line-height:1.52}.oe-lesson-heading-row{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;border-bottom:1px solid #d8e2ef;padding-bottom:.65rem}.oe-lesson-heading-row .oe-chapter-kicker{margin:0;font-style:normal}.oe-mini-nav{display:flex;gap:.25rem;flex:0 0 auto}.oe-mini-nav button,.oe-bottom-nav button{border:0;border-radius:4px;background:#263242;color:#fff;font-weight:800;cursor:pointer}.oe-mini-nav button{width:34px;height:30px}.oe-mini-nav button:hover,.oe-bottom-nav button:hover{background:#0145a8}.oe-lesson-lead{margin:1.2rem 0 .4rem;text-transform:uppercase;font-weight:900}.oe-license-hero{display:block;width:min(640px,100%);max-height:230px;object-fit:contain;margin:.8rem auto 1.25rem}.oe-copy-section{margin:1.1rem 0}.oe-copy-section h4{margin:.85rem 0 .2rem;font-size:.96rem;color:#101827}.oe-copy-section p{margin:.2rem 0}.oe-copy-section ul{margin:.25rem 0 .75rem;padding-left:1.45rem}.oe-copy-section li{margin:.12rem 0}.oe-underlined{text-decoration:underline}.oe-note-box{margin:1rem 0;padding:.9rem 1rem;border-left:4px solid #fdbc01;border-radius:0 6px 6px 0;background:#fff8dd;color:#3f3423}.oe-video-wrap{position:relative;width:min(720px,100%);aspect-ratio:16/9;margin:1.5rem auto;overflow:hidden;border-radius:8px;background:#071426;box-shadow:0 12px 28px rgba(4,31,74,.18)}.oe-video-wrap iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.oe-parking-image{display:block;width:min(540px,100%);height:auto;margin:1.25rem auto}.oe-tip-row{display:grid;grid-template-columns:48px minmax(0,1fr);align-items:center;gap:.9rem;margin:1.4rem 0;padding:.8rem 1rem;border:1px solid #dbe5f1;border-radius:7px;background:#fff}.oe-tip-row img{display:block;width:38px;height:auto}.oe-tip-row p{margin:0}.oe-bottom-nav{display:flex;justify-content:space-between;gap:1rem;margin-top:1.5rem;padding-top:1rem;border-top:1px solid #d8e2ef}.oe-bottom-nav button{min-width:110px;padding:.65rem .9rem}
        .oe-full-lesson{font-size:.94rem;line-height:1.65}.oe-lesson-heading-row{align-items:center;padding:0 0 .9rem;border-bottom:2px solid #e4ebf4}.oe-lesson-heading-row .oe-chapter-kicker{font-size:clamp(1.25rem,2.3vw,1.65rem);font-style:normal;font-weight:700}.oe-lesson-lead{margin:1.25rem 0;padding:.85rem 1rem;border-left:5px solid #fdbc01;border-radius:0 7px 7px 0;background:#06285f;color:#fff;font-size:.92rem;letter-spacing:.025em}.oe-license-hero{padding:.65rem;border-radius:9px;background:#fff}.oe-copy-section{margin:1rem 0;padding:1rem 1.1rem;border:1px solid #dce5f0;border-radius:9px;background:#fff;box-shadow:0 5px 16px rgba(15,45,82,.045)}.oe-copy-section h4{margin:.9rem 0 .25rem;color:#06285f;font-size:.97rem}.oe-copy-section h4:first-child{margin-top:0}.oe-copy-section ul,.oe-note-box ul{padding-left:1.35rem}.oe-copy-section li,.oe-note-box li{margin:.25rem 0}.oe-nested-list>li::marker{color:#0145a8}.oe-nested-list ul{margin-top:.25rem;list-style-type:circle}.oe-note-box{padding:1rem 1.1rem;border:1px solid #f4d367;border-left:5px solid #fdbc01;background:linear-gradient(135deg,#fffdf4,#fff8db);box-shadow:0 5px 16px rgba(92,67,4,.06)}.oe-note-box strong{display:block;color:#06285f;font-size:1rem}.oe-note-box p{margin:.25rem 0 .55rem}.oe-video-wrap{border:4px solid #fff;box-shadow:0 14px 32px rgba(4,31,74,.2)}.oe-parking-image{padding:.7rem;border:1px solid #dce5f0;border-radius:9px;background:#fff;box-shadow:0 8px 20px rgba(15,45,82,.07)}.oe-tip-row{border-left:5px solid #0145a8;box-shadow:0 5px 16px rgba(15,45,82,.05)}.oe-bottom-nav button{border-radius:6px;padding:.72rem 1rem;box-shadow:0 5px 12px rgba(10,28,53,.14)}
        @media(max-width:900px){.oe-course-head-inner{height:76px}.oe-course-logo{width:66px;height:66px}.oe-course-layout{grid-template-columns:1fr}.oe-lesson-body{min-height:auto}.oe-course-nav-inner{overflow-x:auto}.oe-course-nav a,.oe-course-nav button{white-space:nowrap}}
        @media(max-width:520px){.oe-course-head-inner{height:70px}.oe-course-logo{width:60px;height:60px}.oe-logout{min-height:34px;padding:.45rem .7rem}.oe-course-layout{width:min(100% - 1rem,1200px)}.oe-lesson-body{padding:1rem}.oe-full-lesson{font-size:.84rem}.oe-lesson-heading-row{align-items:center}.oe-mini-nav button{width:30px;height:28px}.oe-bottom-nav button{min-width:0}.oe-tip-row{grid-template-columns:38px minmax(0,1fr);padding:.7rem}.oe-tip-row img{width:32px}}
      `}</style>
      <header className="oe-course-header"><div className="oe-course-head-inner"><img className="oe-course-logo" src="/driving-logo.png" alt="A Precision Driving School" /><button className="oe-logout" type="button" onClick={handleLogout}>Log Out</button></div></header>
      <nav className="oe-course-nav" aria-label="Course navigation"><div className="oe-course-nav-inner"><Link to="/">Home</Link><button type="button" onClick={showCourseMap}>Course Map</button><Link to="/contact">Contact us</Link></div></nav>
      <main className="oe-course-layout">
        <aside className="oe-curriculum">
          <h1 className="oe-panel-title">Drivers Ed Curriculum</h1>
          <ul className="oe-chapter-list">
            {CHAPTERS.map((item, chapterIndex) => {
              const isOpen = openChapters.has(chapterIndex)
              return (
                <li className="oe-chapter-item" key={item.title}>
                  <button type="button" className={`oe-chapter-btn${activeChapter === chapterIndex ? ' active' : ''}`} onClick={() => selectChapter(chapterIndex)} aria-expanded={isOpen}>
                    <span className="oe-check">&#10003;</span>
                    <span>{chapterIndex + 1}. {item.title}</span>
                    <span className="oe-chevron" aria-hidden="true">&#9662;</span>
                  </button>
                  {isOpen && (
                    <div className="oe-sublesson-list">
                      {item.topics.map((topic, lessonIndex) => (
                        <button type="button" className={`oe-sublesson${activeChapter === chapterIndex && activeLesson === lessonIndex ? ' active' : ''}`} onClick={() => selectLesson(chapterIndex, lessonIndex)} key={topic}>
                          {chapterIndex + 1}.{lessonIndex + 1} {topic}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </aside>
        <section className="oe-lesson-card" aria-live="polite">
          <h2 className="oe-lesson-title">{selectedLesson}</h2>
          <div className={`oe-lesson-body${isDriverLicenseLesson ? ' detailed' : ''}`}>
            {isDriverLicenseLesson ? (
              <DriverLicensePrivilegeLesson onPrevious={goToPreviousLesson} onNext={goToNextLesson} />
            ) : (
              <>
                <p className="oe-lesson-position">{activeLesson < 0 ? `Chapter ${activeChapter + 1} overview` : `Lesson ${activeChapter + 1}.${activeLesson + 1}`}</p>
                <h3 className="oe-chapter-kicker">Chapter {activeChapter + 1}: {chapter.title}</h3>
                <p className="oe-intro">{chapter.intro}</p>
                {activeChapter === 0 ? <img className="oe-chapter-image" src="/chapter1.png" alt="Responsibility lesson illustration" /> : <div className="oe-responsibility">DRIVE<br />RESPONSIBLY</div>}
                <ul className="oe-points">{chapter.points.map(point => <li key={point}>{point}</li>)}</ul>
                <div className="oe-start-wrap">
                  <button
                    type="button"
                    className={`oe-start${started ? ' started' : ''}`}
                    onClick={() => activeLesson < 0 ? selectLesson(activeChapter, 0) : setStarted(true)}
                  >
                    {started ? 'Lesson Started' : 'Begin Lesson'}
                  </button>
                  {started && <p className="oe-lesson-note">Lesson opened. Use the curriculum dropdowns to continue through each topic.</p>}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <footer className="oe-course-footer">Copyright © {new Date().getFullYear()} A Precision Driving School. All rights reserved.</footer>
    </div>
  )
}
