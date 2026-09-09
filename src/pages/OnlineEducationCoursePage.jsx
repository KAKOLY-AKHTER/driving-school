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

export default function OnlineEducationCoursePage() {
  usePageMeta('30 Hour Drivers Ed Curriculum — A Precision Driving School', 'Protected online driver education curriculum.', { noIndex: true })
  const navigate = useNavigate()
  const [activeChapter, setActiveChapter] = useState(0)
  const [activeLesson, setActiveLesson] = useState(0)
  const [openChapters, setOpenChapters] = useState(() => new Set([0]))
  const [started, setStarted] = useState(false)
  const chapter = useMemo(() => CHAPTERS[activeChapter], [activeChapter])
  const selectedLesson = chapter.topics[activeLesson] || chapter.lesson

  const selectChapter = index => {
    setActiveChapter(index)
    setActiveLesson(0)
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
    setActiveLesson(0)
    setStarted(false)
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/online-drivers-ed/login', { replace: true })
  }

  return (
    <div className="oe-course-page">
      <style>{`
        .oe-course-page{min-height:100vh;background:#f4f7fb;color:#111827;font-family:var(--font-body)}
        .oe-course-header{background:linear-gradient(100deg,#3677c6,#4b8bd4);border-bottom:1px solid rgba(255,255,255,.18)}.oe-course-head-inner{width:min(1200px,calc(100% - 2rem));height:84px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:2rem}.oe-course-logo{display:block;width:74px;height:74px;object-fit:contain;filter:drop-shadow(0 4px 10px rgba(3,32,80,.18))}.oe-logout{min-height:38px;padding:.55rem 1rem;border:1px solid rgba(255,255,255,.8);border-radius:6px;background:#b91c1c;color:#fff;font:800 .72rem var(--font-mono);letter-spacing:.06em;cursor:pointer;box-shadow:0 5px 14px rgba(72,10,10,.2)}
        .oe-course-nav{background:#06338f;box-shadow:0 4px 16px rgba(4,32,86,.18)}.oe-course-nav-inner{width:min(1200px,calc(100% - 2rem));min-height:44px;margin:auto;display:flex;align-items:center;gap:.2rem}.oe-course-nav a,.oe-course-nav button{padding:.65rem .9rem;border:0;background:none;color:#fff;font:700 .82rem var(--font-body);text-decoration:none;cursor:pointer}.oe-course-nav a:hover,.oe-course-nav button:hover{background:rgba(255,255,255,.12)}
        .oe-course-layout{width:min(1200px,calc(100% - 2rem));margin:1.25rem auto 3rem;display:grid;grid-template-columns:330px minmax(0,1fr);gap:1.1rem;align-items:start}.oe-curriculum,.oe-lesson-card{overflow:hidden;border:1px solid #cbd5e1;border-radius:7px;background:#fff;box-shadow:0 8px 24px rgba(15,45,82,.07)}.oe-panel-title{margin:0;padding:.85rem 1rem;background:#0733a0;color:#fff;font-family:var(--font-display);font-size:1.08rem}.oe-chapter-list{margin:0;padding:0;list-style:none}.oe-chapter-item{border-bottom:1px solid #dbe2ea}.oe-chapter-item:last-child{border-bottom:0}.oe-chapter-btn{display:grid;grid-template-columns:23px minmax(0,1fr) 18px;align-items:center;gap:.25rem;width:100%;padding:.75rem .7rem;border:0;background:#f5f7fa;color:#34291f;font-size:.72rem;font-weight:700;text-align:left;text-transform:uppercase;cursor:pointer;line-height:1.35}.oe-chapter-btn:hover{background:#fff8dd}.oe-chapter-btn.active{background:#fff1b8;color:#0733a0}.oe-check{color:#ef3340;font-size:1rem;font-weight:900}.oe-chevron{color:#0145a8;font-size:.8rem;text-align:center;transition:transform .2s ease}.oe-chapter-btn[aria-expanded="true"] .oe-chevron{transform:rotate(180deg)}.oe-sublesson-list{display:grid;padding:.35rem 0 .55rem;background:#fff}.oe-sublesson{width:100%;padding:.38rem .8rem .38rem 2.75rem;border:0;background:#fff;color:#334155;font-size:.76rem;line-height:1.3;text-align:left;cursor:pointer}.oe-sublesson:hover{background:#eef5ff;color:#0145a8}.oe-sublesson.active{background:#e7f0ff;color:#0145a8;font-weight:800;box-shadow:inset 3px 0 #fdbc01}
        .oe-lesson-title{margin:0;padding:.85rem 1.2rem;background:#0733a0;color:#fff;font-family:var(--font-display);font-size:1.08rem}.oe-lesson-body{padding:clamp(1.2rem,3vw,2rem);background:#f9fafb;min-height:520px}.oe-chapter-kicker{margin:0 0 .8rem;color:#0145a8;font-family:var(--font-display);font-size:clamp(1.25rem,2.5vw,1.8rem);font-style:italic}.oe-intro{font-weight:800;font-size:1rem}.oe-chapter-image{display:block;width:min(210px,48%);height:auto;margin:1.2rem auto;object-fit:contain;filter:drop-shadow(0 12px 22px rgba(1,69,168,.15))}.oe-responsibility{width:130px;height:130px;margin:1.3rem auto;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#68b9ff,#0569bd 58%,#043b77);color:#fff;text-align:center;font:900 .72rem var(--font-mono);letter-spacing:.08em;box-shadow:0 15px 30px rgba(1,69,168,.2)}.oe-points{max-width:760px;margin:1rem auto;line-height:1.6}.oe-lesson-position{text-align:center;color:#637892;font:700 .68rem var(--font-mono);letter-spacing:.08em;text-transform:uppercase}.oe-start-wrap{text-align:center;margin-top:1.6rem}.oe-start{padding:.78rem 1.15rem;border:0;border-radius:6px;background:#273242;color:#fff;font-weight:800;cursor:pointer}.oe-start.started{background:#15803d}.oe-lesson-note{max-width:760px;margin:1rem auto 0;padding:.85rem 1rem;border:1px solid #bbf7d0;border-radius:7px;background:#f0fdf4;color:#166534;text-align:center}.oe-course-footer{padding:1rem;background:#0733a0;color:#dbeafe;text-align:center;font-size:.78rem}
        @media(max-width:900px){.oe-course-head-inner{height:76px}.oe-course-logo{width:66px;height:66px}.oe-course-layout{grid-template-columns:1fr}.oe-lesson-body{min-height:auto}.oe-course-nav-inner{overflow-x:auto}.oe-course-nav a,.oe-course-nav button{white-space:nowrap}}
        @media(max-width:520px){.oe-course-head-inner{height:70px}.oe-course-logo{width:60px;height:60px}.oe-logout{min-height:34px;padding:.45rem .7rem}.oe-course-layout{width:min(100% - 1rem,1200px)}.oe-lesson-body{padding:1rem}}
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
        <section className="oe-lesson-card" aria-live="polite"><h2 className="oe-lesson-title">{selectedLesson}</h2><div className="oe-lesson-body"><p className="oe-lesson-position">Lesson {activeChapter + 1}.{activeLesson + 1} of {CHAPTERS.length} chapters</p><h3 className="oe-chapter-kicker">Chapter {activeChapter + 1}: {chapter.title}</h3><p className="oe-intro">{chapter.intro}</p>{activeChapter === 0 ? <img className="oe-chapter-image" src="/chapter1.png" alt="Responsibility lesson illustration" /> : <div className="oe-responsibility">DRIVE<br />RESPONSIBLY</div>}<ul className="oe-points">{chapter.points.map(point => <li key={point}>{point}</li>)}</ul><div className="oe-start-wrap"><button type="button" className={`oe-start${started ? ' started' : ''}`} onClick={() => setStarted(true)}>{started ? 'Lesson Started' : 'Begin Lesson'}</button>{started && <p className="oe-lesson-note">Lesson opened. Use the curriculum dropdowns to continue through each topic.</p>}</div></div></section>
      </main>
      <footer className="oe-course-footer">Copyright © {new Date().getFullYear()} A Precision Driving School. All rights reserved.</footer>
    </div>
  )
}
