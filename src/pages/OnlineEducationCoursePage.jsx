import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { usePageMeta } from '../usePageMeta'
import { AutomobileHistoryLesson, ChapterOneTestLesson, ImportanceEducationLesson, NewDrivingLawsLesson, SmokeFreeCarsLesson } from '../components/online-course/ChapterOneLessons'
import { EyesVisionLesson, LimitingPhysicalConditionsLesson } from '../components/online-course/ChapterTwoLessons'

const CHAPTERS = [
  { title: 'Driving Is Your Responsibility', lesson: "Driver's License: A Privilege", intro: 'Driving a motor vehicle requires a lot of responsibility.', points: ['When behind the wheel, safe driving is your responsibility and it should always be your first priority.', 'Always obey traffic rules and signals, drive responsibly, be courteous to other drivers and avoid taking unnecessary risks.', 'Driving can be dangerous and even fatal if driving rules are not followed.', 'Understanding how your vehicle works and how to safely drive on all highways and streets is part of being a responsible driver.', 'There are millions of drivers that will be sharing the road with you. Use caution and be an attentive driver at all times.'], topics: ["Driver's License: A Privilege", 'Obeying the Laws', "Importance of Driver's Education", 'The New Laws in Driving', 'Smoke-Free Cars', 'History of the Automobile', 'Test 1'] },
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

const CHAPTER_TWO_OVERVIEW = 'A driver must be in good physical condition to drive safely. They need to be able to see and hear well enough to detect potential hazards and handle emergency situations. A driver must also be able to scan for and recognize traffic signs and signals, pedestrians, vehicles, and other potential hazards. Good perception of the surrounding environment—and the ability to decide on and execute the actions needed to avoid hazards—are essential. Lastly, a driver must maintain a good mental attitude when operating a vehicle.'

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
        <h4>What Does Your License Mean to You?</h4>
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
        <h4>What Does Your License Mean to Others?</h4>
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
        <h4>An Automobile Is as Dangerous as a Loaded Gun</h4>
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
              <li>Standard transmission (stick shift) cars are parked in either first gear or reverse, depending on whether the vehicle is on a flat surface, uphill, or downhill.</li>
            </ul>
          </li>
          <li>All types of vehicles should follow the same rules when parking on a hill.</li>
        </ul>
        <h4><em>Uphill, Against the Curb</em></h4>
        <ul>
          <li>Turn the vehicle&apos;s front wheels to the left so that the back of the front-right tire rests against the curb.</li>
          <li>Be sure to set your emergency brake before you exit your car.</li>
        </ul>
        <h4><em>Downhill</em></h4>
        <ul>
          <li>Turn the vehicle&apos;s wheels to the right so that the front of the tire is up against the curb.</li>
        </ul>
      </section>

      <img className="oe-parking-image" src="/driver-lisence2.png" alt="Correct wheel positions for downhill and uphill parking" />

      <div className="oe-tip-row">
        <img src="/driver-lisence3-png.png" alt="Tip" />
        <p>Always keep your vehicle in top working condition. Get into the habit of taking your vehicle in for regular maintenance checks. Be safe and be aware.</p>
      </div>

      <div className="oe-bottom-nav">
        <button type="button" onClick={onPrevious}>&larr; Previous</button>
        <button type="button" onClick={onNext}>Next &rarr;</button>
      </div>
    </article>
  )
}

function ObeyingLawsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson">
      <div className="oe-lesson-heading-row">
        <h3 className="oe-chapter-kicker">1.2 Obeying the Laws</h3>
        <div className="oe-mini-nav" aria-label="Lesson navigation">
          <button type="button" onClick={onPrevious} aria-label="Previous lesson">&#9664;</button>
          <button type="button" onClick={onNext} aria-label="Next lesson">&#9654;</button>
        </div>
      </div>

      <p className="oe-laws-intro">Laws and regulations are in place for the sole purpose of safety. A driver must obey the rules of the road in order to keep themselves and other drivers safe on the roadways. Follow and pay attention to all traffic signs and signals when operating a motor vehicle.</p>

      <section className="oe-copy-section oe-sign-section oe-stop-section">
        <h4>Why Stop Completely at STOP Signs?</h4>
        <div className="oe-sign-row">
          <img src="/stop.png" alt="Stop sign" />
          <p><strong>A STOP sign and red lights</strong> are traffic control devices that tell a driver that they must stop their vehicle. STOP signs are implemented to control the traffic flow and to keep drivers from having a collision. A stop sign means that you must completely stop behind the limit line, crosswalk, and intersection. Choosing to stop completely could mean the difference between life and death.</p>
        </div>
      </section>

      <section className="oe-copy-section oe-sign-section oe-yield-section">
        <div className="oe-sign-row">
          <img src="/yield.png" alt="Yield sign" />
          <div>
            <h4>What Does “YIELD” Mean?</h4>
            <p>This sign means <strong>“to give way.”</strong> The driver at a YIELD sign:</p>
            <ul>
              <li>Shall give way to oncoming traffic.</li>
              <li>Shall let other drivers, pedestrians, and bicycles have the right-of-way.</li>
              <li>May need to stop at a YIELD sign until it is clear to pull out into traffic.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="oe-copy-section">
        <h4>Common Courtesy Is a Key to Safety</h4>
        <p>Being courteous can help avoid accidents and keep traffic moving in an orderly fashion.</p>
        <ul>
          <li>Always drive with a good attitude toward other drivers.</li>
          <li>Never insist on taking the right-of-way.</li>
        </ul>
        <p>Drivers are faced with multiple decisions while driving a motor vehicle that can cause stress and tension. When drivers are courteous to one another it will reduce this stress. For example: Give other drivers the right-of-way or allow them space when they are trying to change lanes.</p>
      </section>

      <section className="oe-copy-section">
        <h4>Treat Other Drivers the Way You Want To Be Treated</h4>
        <p>Do something nice and it is done back to you. This is true on roadways as well. For example:</p>
        <ul>
          <li>Give space in your lane for merging traffic, move over and let faster drivers pass, give drivers that are signaling a lane change a way in, etc.</li>
          <li>Do not honk in anger, scream, cut off others, tailgate, or flash your headlights because you would not want another driver to do this to you.</li>
        </ul>
      </section>

      <section className="oe-copy-section">
        <h4>The Roadway Is Shared By ALL Drivers</h4>
        <p>Safely sharing the roadway with other drivers and pedestrians is essential for avoiding collisions.</p>
        <ul>
          <li>Always be aware of your surroundings and watch out for other drivers.</li>
          <li>If you are blocking traffic by going too slow, safely allow them to pass.</li>
          <li>Never assume other drivers will give you the right-of-way.</li>
        </ul>
      </section>

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
  const isDriverLicenseLesson = activeChapter === 0 && activeLesson === 0
  const isObeyingLawsLesson = activeChapter === 0 && activeLesson === 1
  const isImportanceLesson = activeChapter === 0 && activeLesson === 2
  const isNewLawsLesson = activeChapter === 0 && activeLesson === 3
  const isSmokeFreeLesson = activeChapter === 0 && activeLesson === 4
  const isAutomobileHistoryLesson = activeChapter === 0 && activeLesson === 5
  const isChapterOneTest = activeChapter === 0 && activeLesson === 6
  const isEyesVisionLesson = activeChapter === 1 && activeLesson === 0
  const isLimitingConditionsLesson = activeChapter === 1 && activeLesson === 2
  const isDetailedLesson = isDriverLicenseLesson || isObeyingLawsLesson || isImportanceLesson || isNewLawsLesson || isSmokeFreeLesson || isAutomobileHistoryLesson || isChapterOneTest || isEyesVisionLesson || isLimitingConditionsLesson

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

  const goToLesson = (chapterIndex, lessonIndex) => {
    setActiveChapter(chapterIndex)
    setActiveLesson(lessonIndex)
    setStarted(false)
    setOpenChapters(current => new Set(current).add(chapterIndex))
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
        .oe-chapter-two-overview{max-width:820px;margin:1rem auto 0}.oe-chapter-two-image{display:block;width:min(480px,82%);max-height:300px;margin:0 auto;padding:.45rem;border:1px solid #d8e2ef;border-radius:10px;background:#fff;object-fit:contain;box-shadow:0 10px 24px rgba(15,45,82,.09)}.oe-chapter-two-copy{margin:1rem 0 0;padding:1rem 1.1rem;border:1px solid #dbe5f1;border-left:5px solid #0145a8;border-radius:0 9px 9px 0;background:#fff;color:#26364b;line-height:1.7;box-shadow:0 5px 16px rgba(15,45,82,.045)}
        .oe-full-lesson{font-size:.94rem;line-height:1.65}.oe-lesson-heading-row{align-items:center;padding:0 0 .9rem;border-bottom:2px solid #e4ebf4}.oe-lesson-heading-row .oe-chapter-kicker{font-size:clamp(1.25rem,2.3vw,1.65rem);font-style:normal;font-weight:700}.oe-lesson-lead{margin:1.25rem 0;padding:.85rem 1rem;border-left:5px solid #fdbc01;border-radius:0 7px 7px 0;background:#06285f;color:#fff;font-size:.92rem;letter-spacing:.025em}.oe-license-hero{padding:.65rem;border-radius:9px;background:#fff}.oe-copy-section{margin:1rem 0;padding:1rem 1.1rem;border:1px solid #dce5f0;border-radius:9px;background:#fff;box-shadow:0 5px 16px rgba(15,45,82,.045)}.oe-copy-section h4{margin:.9rem 0 .25rem;color:#06285f;font-size:.97rem}.oe-copy-section h4:first-child{margin-top:0}.oe-copy-section ul,.oe-note-box ul{padding-left:1.35rem}.oe-copy-section li,.oe-note-box li{margin:.25rem 0}.oe-nested-list>li::marker{color:#0145a8}.oe-nested-list ul{margin-top:.25rem;list-style-type:circle}.oe-note-box{padding:1rem 1.1rem;border:1px solid #f4d367;border-left:5px solid #fdbc01;background:linear-gradient(135deg,#fffdf4,#fff8db);box-shadow:0 5px 16px rgba(92,67,4,.06)}.oe-note-box strong{display:block;color:#06285f;font-size:1rem}.oe-note-box p{margin:.25rem 0 .55rem}.oe-video-wrap{border:4px solid #fff;box-shadow:0 14px 32px rgba(4,31,74,.2)}.oe-parking-image{padding:.7rem;border:1px solid #dce5f0;border-radius:9px;background:#fff;box-shadow:0 8px 20px rgba(15,45,82,.07)}.oe-tip-row{border-left:5px solid #0145a8;box-shadow:0 5px 16px rgba(15,45,82,.05)}.oe-bottom-nav button{border-radius:6px;padding:.72rem 1rem;box-shadow:0 5px 12px rgba(10,28,53,.14)}
        .oe-points{display:grid;gap:.62rem;max-width:780px;padding:0;list-style:none}.oe-points li{position:relative;margin:0;padding:.72rem .85rem .72rem 2.65rem;border:1px solid #dbe5f1;border-radius:8px;background:#fff;color:#26364b;box-shadow:0 4px 12px rgba(15,45,82,.045)}.oe-points li::before{content:'✓';position:absolute;left:.82rem;top:.69rem;width:1.15rem;height:1.15rem;display:grid;place-items:center;border-radius:50%;background:#0145a8;color:#fff;font-size:.68rem;font-weight:900;box-shadow:0 0 0 3px #e6f0ff}.oe-points li:hover{border-color:#f0c84c;background:#fffdf5}
        .oe-copy-section ul,.oe-note-box ul{margin:.38rem 0 .8rem;padding:0;list-style:none}.oe-copy-section li,.oe-note-box li{position:relative;margin:.3rem 0;padding-left:1.3rem}.oe-copy-section li::before,.oe-note-box li::before{content:'';position:absolute;left:.12rem;top:.64em;width:.48rem;height:.48rem;border-radius:50%;background:#fdbc01;box-shadow:0 0 0 3px rgba(253,188,1,.16)}.oe-copy-section ul ul{margin:.42rem 0 .15rem .5rem;padding-left:.55rem}.oe-copy-section ul ul li::before{width:.4rem;height:.4rem;top:.68em;background:#fff;border:2px solid #0145a8;box-shadow:none}.oe-note-box li::before{background:#0145a8;box-shadow:0 0 0 3px rgba(1,69,168,.12)}
        .oe-lesson-title,.oe-panel-title,.oe-chapter-kicker,.oe-copy-section h4,.oe-overview-links h4{font-weight:900}.oe-intro{font-weight:900}.oe-points{width:calc(100% - 1.15rem);margin:1rem 0 1rem 1.15rem}.oe-copy-section>ul,.oe-note-box>ul{width:calc(100% - 1.15rem);margin-left:1.15rem}.oe-copy-section ul ul{width:calc(100% - .85rem);margin-left:.85rem}.oe-overview-links{width:calc(100% - 1.15rem);margin:1.4rem 0 .25rem 1.15rem;padding:1rem;border:1px solid #dbe5f1;border-radius:9px;background:#fff;box-shadow:0 5px 16px rgba(15,45,82,.045)}.oe-overview-links h4{margin:0 0 .65rem;color:#06285f;font-family:var(--font-display);font-size:1rem}.oe-overview-link-list{display:grid;gap:.35rem}.oe-overview-link-list button{display:grid;grid-template-columns:42px minmax(0,1fr) 20px;align-items:center;gap:.35rem;width:100%;padding:.56rem .65rem;border:0;border-bottom:1px solid #e7edf5;background:transparent;color:#0145a8;text-align:left;cursor:pointer}.oe-overview-link-list button:last-child{border-bottom:0}.oe-overview-link-list button>span:first-child{color:#8a6500;font:800 .72rem var(--font-mono)}.oe-overview-link-list button strong{font-size:.88rem;font-weight:900}.oe-overview-link-list button>span:last-child{text-align:right;font-size:1rem;transition:transform .18s ease}.oe-overview-link-list button:hover{border-radius:5px;background:#fff8dd;color:#06285f}.oe-overview-link-list button:hover>span:last-child{transform:translateX(3px)}
        .oe-laws-intro{margin:1.15rem 0;padding:1rem 1.1rem;border-left:5px solid #0145a8;border-radius:0 8px 8px 0;background:#eaf2ff;color:#173152;font-weight:700;line-height:1.65}.oe-sign-section{position:relative;overflow:hidden}.oe-stop-section{border-left:4px solid #dc2626}.oe-yield-section{border-left:4px solid #fdbc01}.oe-sign-row{display:grid;grid-template-columns:145px minmax(0,1fr);align-items:center;gap:1.15rem}.oe-sign-row img{display:block;width:130px;max-height:145px;margin:auto;object-fit:contain;filter:drop-shadow(0 7px 12px rgba(15,23,42,.13))}.oe-sign-row p{line-height:1.62}.oe-sign-row strong{font-weight:900;color:#071b34}
        .oe-importance-intro{display:grid;grid-template-columns:220px minmax(0,1fr);align-items:center;gap:1.3rem;margin:1.15rem 0;padding:1.1rem;border:1px solid #dbe5f1;border-left:5px solid #0145a8;border-radius:9px;background:#fff;box-shadow:0 6px 18px rgba(15,45,82,.06)}.oe-importance-intro img{display:block;width:200px;max-height:230px;margin:auto;object-fit:contain;filter:drop-shadow(0 8px 15px rgba(15,23,42,.13))}.oe-importance-intro p{margin:0;color:#26364b;font-size:1rem;line-height:1.7}.oe-importance-intro strong,.oe-importance-points strong{color:#06285f;font-weight:900}
        .oe-laws-page-intro{margin:1.15rem 0;padding:1rem 1.1rem;border-left:5px solid #fdbc01;border-radius:0 9px 9px 0;background:linear-gradient(135deg,#06285f,#0b438f);color:#fff;box-shadow:0 8px 20px rgba(4,31,74,.15)}.oe-laws-page-intro>strong,.oe-laws-page-intro>span{display:block;font-weight:900}.oe-laws-page-intro>strong{color:#ffd75a;font-size:1rem}.oe-laws-page-intro>span{margin:.08rem 0 .35rem}.oe-laws-page-intro p{margin:0;line-height:1.6}.oe-law-updates{display:grid;gap:.72rem}.oe-law-card{padding:1rem 1.1rem;border:1px solid #dbe5f1;border-left:4px solid #0145a8;border-radius:8px;background:#fff;box-shadow:0 5px 15px rgba(15,45,82,.045)}.oe-law-card:nth-child(even){border-left-color:#fdbc01}.oe-law-card h4{margin:0 0 .32rem;color:#06285f;font-size:.96rem;font-weight:900}.oe-law-card p{margin:.2rem 0;color:#34445a;line-height:1.58}.oe-fee-table-wrap{margin-top:.85rem;overflow-x:auto}.oe-fee-table{width:100%;border-collapse:collapse;background:#fff;font-size:.84rem}.oe-fee-table th,.oe-fee-table td{padding:.62rem .7rem;border:1px solid #cbd5e1;text-align:left}.oe-fee-table th{background:#06285f;color:#fff;font-weight:900}.oe-fee-table tbody tr:nth-child(even){background:#f5f8fc}.oe-fee-table td strong{color:#0145a8;font-weight:900}
        .oe-smoke-intro{margin:1.15rem 0;padding:1.1rem;border:1px solid #f1c7c7;border-left:5px solid #dc2626;border-radius:9px;background:linear-gradient(135deg,#fff,#fff7f7);box-shadow:0 6px 18px rgba(90,18,18,.06)}.oe-smoke-intro p{margin:0;color:#26364b;line-height:1.65}.oe-smoke-intro strong,.oe-smoke-content strong{color:#9f1717;font-weight:900}.oe-smoke-intro img{display:block;width:min(320px,70%);max-height:280px;margin:1rem auto;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(35,17,17,.14))}.oe-smoke-content{border-left:4px solid #0145a8}.oe-smoke-content>p{margin:.8rem 0}.oe-smoke-content>p:first-child{margin-top:0}.oe-smoke-content>p:last-child{margin-bottom:0}
        .oe-auto-lead{margin:1.15rem 0;padding:.9rem 1rem;border-left:5px solid #fdbc01;border-radius:0 8px 8px 0;background:#06285f;color:#fff;font-weight:900}.oe-auto-section{margin:.85rem 0;padding:1rem 1.1rem;border:1px solid #dbe5f1;border-left:4px solid #0145a8;border-radius:9px;background:#fff;box-shadow:0 5px 16px rgba(15,45,82,.05)}.oe-auto-section:nth-of-type(even){border-left-color:#fdbc01}.oe-auto-section h4{margin:0 0 .55rem;color:#06285f;font-size:1rem;font-weight:900}.oe-auto-section h5{margin:-.15rem 0 .65rem;color:#617087;font-size:.82rem;font-weight:800}.oe-auto-section p{margin:.2rem 0;color:#34445a;line-height:1.58}.oe-auto-media-row{display:grid;grid-template-columns:minmax(190px,280px) minmax(0,1fr);align-items:center;gap:1.2rem}.oe-auto-media-row img{display:block;width:100%;max-height:210px;margin:auto;object-fit:contain;filter:drop-shadow(0 8px 14px rgba(15,23,42,.13))}.oe-auto-highlight{background:linear-gradient(135deg,#fffdf4,#fff8dd)}.oe-auto-small-media{grid-template-columns:180px minmax(0,1fr);margin-top:1rem;padding-top:1rem;border-top:1px solid #e3eaf3}.oe-auto-small-media img{max-height:155px}.oe-auto-fact-row{grid-template-columns:150px minmax(0,1fr);margin-top:1rem;padding:.8rem;border-radius:7px;background:#eef5ff}.oe-auto-fact-row img{max-height:70px}.oe-auto-section strong{color:#06285f;font-weight:900}
        .oe-test-title-row{margin-bottom:1rem}.oe-test-title-row>span{display:inline-block;margin-bottom:.3rem;color:#8a6500;font:800 .67rem var(--font-mono);letter-spacing:.1em;text-transform:uppercase}.oe-test-title-row h3{margin:0;color:#06285f;font-family:var(--font-display);font-size:clamp(1.75rem,4vw,2.5rem);font-weight:900}.oe-test-card{position:relative;min-height:390px;padding:clamp(1.1rem,3vw,2rem);overflow:hidden;border:1px solid #dbe5f1;border-top:5px solid #fdbc01;border-radius:12px;background:linear-gradient(135deg,#fff 0%,#f4f8ff 100%);box-shadow:0 10px 28px rgba(15,45,82,.08)}.oe-test-message{max-width:690px}.oe-test-message h4{margin:0 0 .35rem;color:#06285f;font-size:1.3rem;font-weight:900}.oe-test-message p{margin:0;color:#34445a;line-height:1.65}.oe-test-message strong{color:#0145a8;font-weight:900}.oe-test-score{display:flex;align-items:center;gap:.75rem;width:max-content;margin:1rem 0;padding:.65rem .85rem;border-radius:8px;background:#06285f;color:#fff}.oe-test-score strong{color:#ffd457;font-size:1.2rem}.oe-test-score span{font-size:.75rem;font-weight:800}.oe-test-start{display:block;margin:.7rem 0;padding:.6rem .75rem;border:2px solid transparent;border-radius:7px;background:#fff;cursor:pointer;box-shadow:0 5px 14px rgba(15,45,82,.1);transition:transform .18s ease,border-color .18s ease}.oe-test-start:hover{transform:translateY(-2px);border-color:#fdbc01}.oe-test-start img{display:block;width:164px;height:auto}.oe-quiz-image{display:block;width:min(220px,55%);height:auto;margin:.35rem 0 0 1.2rem;filter:drop-shadow(0 10px 16px rgba(15,23,42,.12))}.oe-test-return-note{margin:1rem 0 0;color:#64748b;font-size:.78rem}.oe-test-return-note strong{color:#0145a8}
        .oe-test-start:focus-visible{outline:3px solid #0145a8;outline-offset:3px}.oe-test-return-link{display:inline;padding:0;border:0;background:transparent;color:#0145a8;font:inherit;font-weight:900;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.18em;cursor:pointer}.oe-test-return-link:hover{color:#06285f}.oe-test-return-link:focus-visible{border-radius:3px;outline:3px solid #fdbc01;outline-offset:3px}.oe-full-lesson p,.oe-full-lesson li{overflow-wrap:break-word}.oe-copy-section h4,.oe-auto-section h4,.oe-law-card h4{letter-spacing:-.01em}.oe-mini-nav button,.oe-bottom-nav button{transition:background-color .18s ease,transform .18s ease,box-shadow .18s ease}.oe-mini-nav button:active,.oe-bottom-nav button:active{transform:translateY(1px)}
        .oe-vision-intro{margin:1.15rem 0;padding:1.1rem;border:1px solid #dbe5f1;border-left:5px solid #0145a8;border-radius:9px;background:linear-gradient(135deg,#fff,#f3f8ff);box-shadow:0 6px 18px rgba(15,45,82,.06)}.oe-eye-graphic{position:relative;width:min(340px,80%);aspect-ratio:160/72;margin:0 auto 1rem}.oe-eye-graphic>img{display:block;width:100%;height:100%;object-fit:contain}.oe-eye-iris{position:absolute;top:26.5%;width:14.4%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#58c7ef 0 36%,#168fce 50%,#bdeeff 61%,rgba(255,255,255,.25) 68%);pointer-events:none}.oe-eye-iris-left{left:30.3%}.oe-eye-iris-right{left:60.7%}.oe-eye-iris::after{content:'';position:absolute;left:36%;top:36%;width:28%;height:28%;border-radius:50%;background:radial-gradient(circle at 38% 32%,#fff 0 8%,#0b1725 12% 100%);animation:oe-eye-scan 3.6s ease-in-out infinite}.oe-eye-iris-right::after{animation-delay:-.12s}@keyframes oe-eye-scan{0%,100%{transform:translate(-34%,1%)}28%{transform:translate(30%,-18%)}52%{transform:translate(34%,14%)}76%{transform:translate(-8%,22%)}}.oe-vision-intro p{margin:0;color:#26364b;line-height:1.7}.oe-vision-intro strong{color:#06285f;font-weight:900}.oe-vision-section>h4{margin:1.25rem 0 .45rem}.oe-vision-section>h4:first-child{margin-top:0}.oe-vision-emphasis{text-align:center;color:#06285f;font-size:1rem;font-weight:900}.oe-vision-media{display:grid;align-items:center;gap:1.25rem}.oe-vision-media-left{grid-template-columns:180px minmax(0,1fr)}.oe-vision-media-right{grid-template-columns:minmax(0,1fr) 210px}.oe-vision-media>img{display:block;width:100%;max-height:260px;margin:auto;padding:.45rem;border:1px solid #dbe5f1;border-radius:8px;background:#fff;object-fit:contain;box-shadow:0 7px 18px rgba(15,45,82,.07)}.oe-myth-list{display:grid;gap:.7rem;margin-top:1rem}.oe-myth-item{display:grid;grid-template-columns:125px minmax(0,1fr);align-items:center;gap:1rem;padding:.75rem;border:1px solid #e0e8f1;border-radius:8px;background:#f9fbfe}.oe-myth-item img{display:block;width:110px;max-height:95px;margin:auto;object-fit:contain}.oe-myth-item p{margin:0}.oe-myth-item p strong{color:#0145a8;font-weight:900}.oe-myth-fact{border-color:#b9d5f5;background:#eef6ff}.oe-myth-fact img{width:120px;max-height:60px}.oe-vision-process>img{display:block;width:min(340px,78%);max-height:245px;margin:1rem auto;padding:.4rem;border:1px solid #dbe5f1;border-radius:9px;background:#fff;object-fit:contain;box-shadow:0 8px 20px rgba(15,45,82,.08)}.oe-vision-process ol{counter-reset:vision-step;display:grid;gap:.55rem;margin:1rem 0 0;padding:0;list-style:none}.oe-vision-process ol li{counter-increment:vision-step;position:relative;min-height:32px;margin:0;padding:.42rem .55rem .42rem 2.55rem;border-radius:7px;background:#f5f8fc}.oe-vision-process ol li::before{content:counter(vision-step);position:absolute;left:.55rem;top:.36rem;display:grid;place-items:center;width:1.55rem;height:1.55rem;border-radius:50%;background:#0145a8;color:#fff;font:900 .7rem var(--font-mono)}.oe-sunglasses-intro{display:grid;grid-template-columns:150px minmax(0,1fr);align-items:center;gap:1.2rem}.oe-glasses-stack{display:grid;gap:.55rem}.oe-glasses-stack img{display:block;width:125px;max-height:60px;margin:auto;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(15,23,42,.13))}.oe-vision-remember{margin:1rem 0;padding:.9rem 1rem;border:1px solid #f2d16a;border-left:5px solid #fdbc01;border-radius:0 8px 8px 0;background:#fff9df}.oe-vision-remember h4{margin:0;color:#7a5600;font-weight:900}.oe-vision-remember p{margin:.18rem 0}.oe-lens-list>li{margin-bottom:.8rem}.oe-lens-list>li>strong{color:#06285f;font-size:.95rem;font-weight:900}.oe-vision-symptoms{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.35rem .8rem}
        .oe-conditions-lead{margin:1.15rem 0;padding:.9rem 1rem;border-left:5px solid #fdbc01;border-radius:0 8px 8px 0;background:#06285f;color:#fff;font-weight:900;line-height:1.6}.oe-condition-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem}.oe-condition-card{padding:1rem;border:1px solid #dbe5f1;border-top:4px solid #0145a8;border-radius:8px;background:#fff;box-shadow:0 5px 15px rgba(15,45,82,.05)}.oe-condition-card:nth-child(even){border-top-color:#fdbc01}.oe-condition-card:last-child{grid-column:1/-1}.oe-condition-card h4{margin:0 0 .35rem;color:#06285f;font-size:1rem;font-weight:900}.oe-condition-card p{margin:.35rem 0;color:#34445a;line-height:1.62}.oe-disqualifying-section{border-left:5px solid #b91c1c}.oe-disqualifying-section>h4{color:#8f1717}.oe-carbon-section{border-left:5px solid #fdbc01}.oe-carbon-media{display:grid;grid-template-columns:130px minmax(0,1fr);align-items:center;gap:1.1rem}.oe-carbon-media img{display:block;width:120px;max-height:95px;margin:auto;padding:.35rem;border:1px solid #dbe5f1;border-radius:7px;background:#fff;object-fit:contain;box-shadow:0 6px 14px rgba(15,45,82,.08)}.oe-carbon-media p{margin:.3rem 0}.oe-carbon-media strong{color:#8f1717;font-weight:900}
        @media(max-width:900px){.oe-course-head-inner{height:76px}.oe-course-logo{width:66px;height:66px}.oe-course-layout{grid-template-columns:1fr}.oe-lesson-body{min-height:auto}.oe-course-nav-inner{overflow-x:auto}.oe-course-nav a,.oe-course-nav button{white-space:nowrap}}
        @media(max-width:700px){.oe-vision-media-left,.oe-vision-media-right,.oe-sunglasses-intro{grid-template-columns:1fr}.oe-vision-media>img{width:min(220px,80%);max-height:230px}.oe-sunglasses-intro{gap:.8rem}.oe-glasses-stack{grid-template-columns:repeat(3,1fr);gap:.35rem}.oe-glasses-stack img{width:min(110px,100%)}.oe-vision-symptoms{grid-template-columns:repeat(2,minmax(0,1fr))}.oe-condition-grid{grid-template-columns:1fr}.oe-condition-card:last-child{grid-column:auto}}
        @media(max-width:620px){.oe-importance-intro{grid-template-columns:1fr;gap:.8rem}.oe-importance-intro img{width:155px;max-height:175px}.oe-importance-intro p{font-size:.9rem}.oe-law-card{padding:.85rem .9rem}.oe-fee-table{min-width:430px}.oe-auto-media-row,.oe-auto-small-media,.oe-auto-fact-row{grid-template-columns:1fr;gap:.75rem}.oe-auto-media-row img{width:min(280px,90%);max-height:180px}.oe-auto-small-media img{width:min(180px,70%);max-height:145px}.oe-auto-fact-row img{width:min(145px,65%);max-height:65px}.oe-auto-section{padding:.85rem .9rem}.oe-test-card{min-height:350px}.oe-test-start{margin-inline:auto}.oe-quiz-image{margin:.5rem auto}.oe-test-return-note{text-align:center}}
        @media(max-width:520px){.oe-course-head-inner{height:70px}.oe-course-logo{width:60px;height:60px}.oe-logout{min-height:34px;padding:.45rem .7rem}.oe-course-layout{width:min(100% - 1rem,1200px)}.oe-lesson-body{padding:1rem}.oe-full-lesson{font-size:.84rem}.oe-lesson-heading-row{align-items:center}.oe-mini-nav button{width:30px;height:28px}.oe-bottom-nav button{min-width:0}.oe-tip-row{grid-template-columns:38px minmax(0,1fr);padding:.7rem}.oe-tip-row img{width:32px}.oe-points,.oe-copy-section>ul,.oe-note-box>ul,.oe-overview-links{width:calc(100% - .55rem);margin-left:.55rem}.oe-copy-section ul ul{width:calc(100% - .5rem);margin-left:.5rem}.oe-overview-links{padding:.75rem}.oe-overview-link-list button{grid-template-columns:38px minmax(0,1fr) 16px;padding:.52rem .4rem}.oe-sign-row{grid-template-columns:1fr;gap:.75rem}.oe-sign-row img{width:105px;max-height:115px}.oe-laws-intro{padding:.85rem .9rem}.oe-carbon-media{grid-template-columns:1fr}.oe-carbon-media img{width:110px}.oe-vision-symptoms{grid-template-columns:1fr 1fr}}
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
          <h2 className="oe-lesson-title">{isChapterOneTest ? '30 Hour Drivers Ed Curriculum' : chapter.lesson}</h2>
          <div className={`oe-lesson-body${isDetailedLesson ? ' detailed' : ''}`}>
            {isDriverLicenseLesson ? (
              <DriverLicensePrivilegeLesson onPrevious={goToPreviousLesson} onNext={goToNextLesson} />
            ) : isObeyingLawsLesson ? (
              <ObeyingLawsLesson onPrevious={() => goToLesson(0, 0)} onNext={() => goToLesson(0, 2)} />
            ) : isImportanceLesson ? (
              <ImportanceEducationLesson onPrevious={() => goToLesson(0, 1)} onNext={() => goToLesson(0, 3)} />
            ) : isNewLawsLesson ? (
              <NewDrivingLawsLesson onPrevious={() => goToLesson(0, 2)} onNext={() => goToLesson(0, 4)} />
            ) : isSmokeFreeLesson ? (
              <SmokeFreeCarsLesson onPrevious={() => goToLesson(0, 3)} onNext={() => goToLesson(0, 5)} />
            ) : isAutomobileHistoryLesson ? (
              <AutomobileHistoryLesson onPrevious={() => goToLesson(0, 4)} onNext={() => goToLesson(0, 6)} />
            ) : isChapterOneTest ? (
              <ChapterOneTestLesson onStart={() => goToLesson(0, -1)} />
            ) : isEyesVisionLesson ? (
              <EyesVisionLesson onPrevious={() => goToLesson(1, -1)} onNext={() => goToLesson(1, 1)} />
            ) : isLimitingConditionsLesson ? (
              <LimitingPhysicalConditionsLesson onPrevious={() => goToLesson(1, 1)} onNext={() => goToLesson(1, 3)} />
            ) : (
              <>
                <p className="oe-lesson-position">{activeLesson < 0 ? `Chapter ${activeChapter + 1} overview` : `Lesson ${activeChapter + 1}.${activeLesson + 1}`}</p>
                <h3 className="oe-chapter-kicker">Chapter {activeChapter + 1}: {chapter.title}</h3>
                {activeChapter === 1 && activeLesson < 0 ? (
                  <section className="oe-chapter-two-overview" aria-label="Chapter 2 introduction">
                    <img className="oe-chapter-two-image" src="/chapter2.png" alt="A focused driver operating a vehicle" />
                    <p className="oe-chapter-two-copy">{CHAPTER_TWO_OVERVIEW}</p>
                  </section>
                ) : (
                  <>
                    <p className="oe-intro">{chapter.intro}</p>
                    {activeChapter === 0 ? <img className="oe-chapter-image" src="/chapter1.png" alt="Responsibility lesson illustration" /> : <div className="oe-responsibility">DRIVE<br />RESPONSIBLY</div>}
                    <ul className="oe-points">{chapter.points.map(point => <li key={point}>{point}</li>)}</ul>
                  </>
                )}
                {activeLesson < 0 && (
                  <nav className="oe-overview-links" aria-label={`Chapter ${activeChapter + 1} lessons`}>
                    <h4>Chapter {activeChapter + 1} Lessons</h4>
                    <div className="oe-overview-link-list">
                      {chapter.topics.map((topic, lessonIndex) => (
                        <button type="button" onClick={() => selectLesson(activeChapter, lessonIndex)} key={topic}>
                          <span>{activeChapter + 1}.{lessonIndex + 1}</span>
                          <strong>{topic === `Test ${activeChapter + 1}` ? `Chapter ${activeChapter + 1} Test` : topic}</strong>
                          <span aria-hidden="true">&rarr;</span>
                        </button>
                      ))}
                    </div>
                  </nav>
                )}
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
