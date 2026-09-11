function LessonHeader({ title, onPrevious, onNext }) {
  return (
    <div className="oe-lesson-heading-row">
      <h3 className="oe-chapter-kicker">{title}</h3>
      <div className="oe-mini-nav" aria-label="Lesson navigation">
        <button type="button" onClick={onPrevious} aria-label="Previous lesson">&#9664;</button>
        <button type="button" onClick={onNext} aria-label="Next lesson">&#9654;</button>
      </div>
    </div>
  )
}

function LessonFooter({ onPrevious, onNext }) {
  return <div className="oe-bottom-nav"><button type="button" onClick={onPrevious}>&larr; Previous</button><button type="button" onClick={onNext}>Next &rarr;</button></div>
}

function TopicSection({ title, children, className = '' }) {
  return <section className={`oe-chapter-nine-section${className ? ` ${className}` : ''}`}><h4>{title}</h4>{children}</section>
}

export function ChapterNineOverview({ lessons, onSelectLesson, onBegin }) {
  return (
    <article className="oe-chapter-nine-overview">
      <h3 className="oe-chapter-kicker">Chapter 9: Licensing, Registrations And California Vehicle Codes</h3>
      <img className="oe-chapter-nine-flag" src="/flag.png" alt="California Republic flag" />
      <p>The California Driver&apos;s License is a privilege, not a right. Obtaining a license shows that you have the appropriate training and skills necessary to drive a vehicle. To apply for a driver&apos;s license, a person must apply at their local office of the Department of Motor Vehicles.</p>
      <nav className="oe-chapter-nine-lessons" aria-label="Chapter 9 lessons">
        {lessons.map((lesson, index) => (
          <button type="button" onClick={() => onSelectLesson(index)} key={lesson}>
            <span>9.{index + 1}</span>
            <strong>{lesson === 'Test 9' ? 'Chapter 9 Test' : lesson}</strong>
            <span aria-hidden="true">&rarr;</span>
          </button>
        ))}
      </nav>
      <div className="oe-start-wrap"><button className="oe-start" type="button" onClick={onBegin}>Begin Lesson</button></div>
    </article>
  )
}

export function LicensingLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-licensing-lesson">
      <LessonHeader title="9.1 Licensing" onPrevious={onPrevious} onNext={onNext} />

      <TopicSection title="Who Must Have a California Driver License?">
        <p>All California residents who drive on public highways or use public parking facilities must have a California driver license, <strong>except:</strong></p>
        <ul>
          <li>Members of the Armed Forces or United States Government civilian employees who drive vehicles owned or controlled by the U.S. Government on federal business.</li>
          <li>Persons who drive farming vehicles not normally used on public highways.</li>
          <li>Persons who drive registered off-highway vehicles or snowmobiles across a highway other than a freeway.</li>
          <li><strong>Visitors to California</strong>
            <ul><li>If you are over 18 and have a valid driver&apos;s license from your home state or country, you may drive in California as long as that license remains valid.</li></ul>
          </li>
          <li><strong>Visitors who are minors</strong>
            <ul>
              <li>Visitors between 16 and 18 may drive with a valid home-state license or instruction permit for only 10 days after arriving in California. After 10 days, they need a nonresident minor&apos;s certificate or California license.</li>
              <li>A nonresident minor&apos;s certificate is issued by the DMV after proof of financial responsibility is provided.</li>
            </ul>
          </li>
        </ul>
      </TopicSection>

      <TopicSection title="Licensing Requirements for Minors">
        <p>A minor is under 18 years of age and must meet the permit requirements. A parent or legal guardian must sign the application; if both have joint custody, both must sign.</p>
        <p><strong>To get a permit, you must:</strong></p>
        <ul>
          <li>Be at least 15&frac12; years old, but under 18.</li>
          <li>Complete the Driver License or Identification Card Application.</li>
          <li>Have your parent or guardian sign the application.</li>
          <li>Pass the traffic laws and road signs test. If you fail, you must wait before retaking it.</li>
          <li>If you are between 15&frac12; and 17&frac12;, provide proof that you completed driver education or are enrolled in an approved integrated driver education and training program.</li>
          <li>The provisional permit is not valid until you begin behind-the-wheel driver training with an instructor or reach age 17&frac12;.</li>
        </ul>
      </TopicSection>

      <TopicSection title="Minor's Permit Restrictions">
        <ul>
          <li>A minor&apos;s permit is not valid until driver training begins and the instructor signs it.</li>
          <li>The minor must practice with a licensed California parent, guardian, driving instructor, or adult age 25 or older. That person must sit close enough to take control at any time.</li>
          <li>A provisional permit does not allow a minor to drive alone, even to a DMV office for a driving test.</li>
        </ul>
      </TopicSection>

      <TopicSection title="Provisional Permits">
        <p>The first step toward a license is an instruction permit. Drivers under 18 have additional restrictions that adult drivers do not have.</p>
        <ul>
          <li>Obey all traffic laws and drive without a collision.</li>
          <li>Drive with a licensed parent, guardian, driving instructor, or adult age 25 or older.</li>
          <li>Hold the permit for at least six months before taking the driving test.</li>
        </ul>
      </TopicSection>

      <TopicSection title="Minor's Driver License Requirements">
        <ul>
          <li>Be at least 16 years old.</li>
          <li>Provide proof of driver education and driver training completion.</li>
          <li>Have held a California instruction permit, or an instruction permit from another state, for at least six months.</li>
          <li>Provide a parent or guardian signature confirming 50 hours of supervised driving practice, including 10 hours at night.</li>
          <li>Pass the behind-the-wheel driving test.</li>
        </ul>
        <aside className="oe-chapter-nine-note"><strong>Note:</strong> You have three chances to pass the driving test while your permit is valid. After a failed behind-the-wheel test, a retest fee and waiting period apply.</aside>
      </TopicSection>

      <TopicSection title="Provisional Driver's License">
        <p>Once licensed, a provisional driver may drive alone as long as they avoid collisions and traffic violations. The provisional status ends at age 18.</p>
        <ul>
          <li>During the first 12 months, you cannot drive between 11 p.m. and 5 a.m.</li>
          <li>You cannot transport passengers under age 20 unless accompanied by a licensed parent or guardian, a licensed driver age 25 or older, or a licensed or certified driving instructor.</li>
        </ul>
      </TopicSection>

      <TopicSection title="Exceptions to Minor's Driver License Restrictions">
        <p>The law allows limited exceptions when written documentation is carried:</p>
        <ul>
          <li>Medical necessity when reasonable transportation alternatives are inadequate, supported by a physician&apos;s note.</li>
          <li>Schooling or a school-authorized activity, supported by a school official&apos;s note.</li>
          <li>Employment necessity, supported by an employer&apos;s note.</li>
          <li>The need to drive an immediate family member, supported by the required parent, guardian, or physician documentation.</li>
        </ul>
        <aside className="oe-chapter-nine-note"><strong>Note:</strong> These requirements do not apply to an emancipated minor who has provided the DMV with proof of financial responsibility in place of a parent or guarantor signature.</aside>
      </TopicSection>

      <TopicSection title="Teenage Driving Facts">
        <ul>
          <li><strong>Traffic violations:</strong> New teen drivers are frequently cited during their first year, and speeding can result in loss of vehicle control.</li>
          <li><strong>Teenage traffic deaths:</strong> Inexperience, limited vehicle familiarity, and risk-taking make collisions especially dangerous for young drivers.</li>
          <li>Teen drivers must follow speed limits, road signs, and safe-driving rules and stay especially alert.</li>
        </ul>
      </TopicSection>

      <TopicSection title="Negligent Operator">
        <p>The DMV tracks traffic convictions and at-fault collisions and assigns point counts. Points may remain on a driving record for years, depending on the occurrence.</p>
        <ul>
          <li>A minor driving infraction or an at-fault collision normally counts as one point.</li>
          <li>More serious offenses—such as reckless driving, DUI, hit-and-run, evading law enforcement, or driving while suspended or revoked—normally count as two points.</li>
          <li>A driver may be considered a negligent operator with 4 points in 12 months, 6 points in 24 months, or 8 points in 36 months.</li>
          <li>Provisional licensees face stricter actions, beginning with a warning and escalating to driving restrictions, suspension, and probation.</li>
          <li>Restrictions, suspension, or probation continue for their full term even after the driver turns 18.</li>
        </ul>
      </TopicSection>

      <TopicSection title="Habitual Truant (Persons 13–18 Years of Age)">
        <p>A court may suspend, restrict, delay, or revoke driving privileges when a person is convicted of being a habitual truant from school.</p>
      </TopicSection>

      <TopicSection title="Keeping Your Provisional Driver License">
        <ul>
          <li>Failure to appear in court or pay a traffic fine can suspend your driving privilege until the matter is resolved.</li>
          <li>One at-fault collision or conviction within 12 months may result in a warning.</li>
          <li>A second within 12 months can create a 30-day restriction unless accompanied by a licensed adult age 25 or older.</li>
          <li>A third within 12 months can result in a six-month suspension and one year of probation.</li>
          <li>Additional at-fault collisions or convictions while on probation can lead to another suspension.</li>
          <li>If your driving privilege is suspended or revoked, you may not drive in California.</li>
        </ul>
      </TopicSection>

      <TopicSection title="Minors and Cell Phones">
        <p>It is against the law for a minor to use a cell phone while driving. Do not answer calls or respond to text messages while behind the wheel.</p>
        <p><strong>Emergency exception:</strong> A minor may use a phone to contact law enforcement, a health-care provider, the fire department, or another emergency service.</p>
      </TopicSection>

      <TopicSection title="License Refusal, Suspension and Revocation" className="oe-license-actions">
        <p>The DMV issues, refuses, suspends, and revokes driver licenses. Courts and the DMV may act when a driver fails to comply with driving laws.</p>
        <ul>
          <li>A court may suspend or delay a license for vandalism, certain firearms offenses, auto theft, racing, reckless driving, or driving under the influence.</li>
          <li>Refusing a required chemical test can result in suspension, with stronger consequences for later offenses.</li>
          <li>A license may be suspended or revoked for hit-and-run, serious injury collisions, controlled-substance offenses, excessive speeding, or failure to meet financial-responsibility and collision-reporting requirements.</li>
          <li>A parent or guardian who signed a provisional application may request cancellation.</li>
          <li>When a license is suspended or revoked, it must be surrendered. Driving anyway can lead to fines, jail, and vehicle impoundment.</li>
          <li>Possessing or displaying an altered or invalid driver license is unlawful.</li>
        </ul>
        <h5>When stopped by law enforcement</h5>
        <ul>
          <li>Slow down, signal, move as far to the right as safely possible, and stop completely. Never stop on a median.</li>
          <li>On a freeway, pull fully onto the shoulder or follow an officer&apos;s loudspeaker directions.</li>
          <li>If the location is dark, isolated, or unsafe, signal your intent and proceed slowly to a nearby well-lit or safer place.</li>
          <li>Turn off the ignition, keep both hands visible on the steering wheel, and wait for instructions before reaching for documents.</li>
          <li>At night, turn on the interior light and follow the officer&apos;s directions calmly.</li>
        </ul>
      </TopicSection>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function RegistrationLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-registration-lesson">
      <LessonHeader title="9.2 Registration" onPrevious={onPrevious} onNext={onNext} />
      <TopicSection title="Registering a Vehicle">
        <p>A car dealer normally submits the registration documents and fees for a vehicle purchased from the dealership. The DMV then mails the registration documents to the owner.</p>
        <ul>
          <li>When a vehicle is sold by a dealer, the California Vehicle Code provides for consumer information, correction of safety defects, display of the suggested retail price, and other sale-related matters.</li>
          <li>For a private-party purchase, provide the DMV with an endorsed Certificate of Title, the purchase price and odometer reading, a smog certificate when required, and applicable sales tax.</li>
          <li>The DMV will not register a vehicle if required fees and taxes are unpaid, forms are incomplete, a required smog certificate is missing, or financial responsibility has not been shown.</li>
        </ul>
      </TopicSection>

      <TopicSection title="Registration Cards and License Plates">
        <ul>
          <li>Carry the vehicle registration card whenever you drive and show it to law enforcement when requested.</li>
          <li>License plates must be securely mounted at the legally required height and the rear plate must be illuminated.</li>
          <li>If a registration card or plate is lost or mutilated, promptly notify the DMV and obtain a replacement. If both plates are stolen, also notify law enforcement.</li>
          <li>Do not alter a license plate.</li>
          <li>Pay annual fees to keep registration current and receive current registration documents and stickers. Required proof of financial responsibility and smog certification must also be maintained.</li>
        </ul>
      </TopicSection>

      <TopicSection title="Owner Responsibilities">
        <ul>
          <li>If a vehicle will not be operated, moved, or parked on a highway, apply for planned non-operation status instead of paying full renewal fees. Additional fees apply if the vehicle is returned to road use.</li>
          <li>When you move, notify the DMV of your new address within 10 days and update the address on the registration card.</li>
          <li>Notify the DMV within 10 days if a new or different motor is installed.</li>
          <li>A seller must notify the DMV within 5 days using a Notice of Transfer and Release of Liability and provide the required title and smog documentation.</li>
          <li>A buyer must transfer ownership into their name with the DMV within 10 days of purchase.</li>
          <li>Maintain insurance or other required financial responsibility and carry evidence whenever you drive.</li>
          <li>An owner may be responsible for damages when another person drives the vehicle with the owner&apos;s permission. A person signing a minor&apos;s license application assumes liability as provided by law.</li>
          <li>Keep the vehicle in safe working condition and report a stolen vehicle to law enforcement.</li>
        </ul>
      </TopicSection>

      <aside className="oe-chapter-nine-note oe-registration-note">
        <strong>Remember:</strong>
        <ul>
          <li>Knowingly making a false stolen-vehicle report is unlawful.</li>
          <li>Notify law enforcement when a stolen vehicle is recovered.</li>
          <li>Altering a Vehicle Identification Number (VIN) is unlawful.</li>
          <li>Participating in chop-shop activities is unlawful.</li>
        </ul>
      </aside>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function CaliforniaVehicleCodesLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-vehicle-code-lesson">
      <LessonHeader title="9.3 California Vehicle Codes" onPrevious={onPrevious} onNext={onNext} />
      <p className="oe-chapter-nine-lead">The California Vehicle Code establishes the rules for drivers, vehicles, licensing, registration, road use, and enforcement. Every driver is responsible for knowing and following the laws that apply to the vehicle and roadway.</p>

      <TopicSection title="The Driver's Responsibilities">
        <ul>
          <li>Carry a valid driver license and comply with every restriction printed on it.</li>
          <li>Obey traffic signs, signals, pavement markings, speed laws, right-of-way rules, and directions from law enforcement.</li>
          <li>Never drive while impaired, distracted, unlicensed, or while your driving privilege is suspended or revoked.</li>
          <li>Stop after a collision, help anyone injured, exchange required information, and make required reports.</li>
          <li>Show your driver license, registration, and evidence of financial responsibility when lawfully requested.</li>
        </ul>
      </TopicSection>

      <TopicSection title="Vehicle and Registration Requirements">
        <ul>
          <li>Keep registration current and display valid license plates and registration stickers.</li>
          <li>Maintain required financial responsibility and provide proof when necessary.</li>
          <li>Keep brakes, tires, lights, signals, mirrors, windshield, seat belts, and other required safety equipment in working order.</li>
          <li>Do not alter plates, registration documents, a VIN, or other identifying information.</li>
          <li>Secure passengers, children, animals, and cargo so they do not create a hazard.</li>
        </ul>
      </TopicSection>

      <TopicSection title="Sharing California Roads">
        <ul>
          <li>Yield to pedestrians and bicyclists as required and allow safe space when passing.</li>
          <li>Stop for school buses displaying flashing red lights when the law requires it.</li>
          <li>Use extra care around motorcycles, transit vehicles, emergency vehicles, highway workers, and railroad crossings.</li>
          <li>Do not block intersections, crosswalks, bicycle lanes, driveways, or accessible parking areas.</li>
          <li>Use headlights, turn signals, and hazard warning lights as required to communicate with other road users.</li>
        </ul>
      </TopicSection>

      <TopicSection title="Violations and Consequences">
        <p>Violations may result in citations, fines, points, traffic school, vehicle impoundment, license restriction, suspension, revocation, probation, or criminal penalties. More serious or repeated violations carry stronger consequences.</p>
        <ul>
          <li>Reckless driving, DUI, hit-and-run, racing, evading law enforcement, and driving while suspended or revoked are serious offenses.</li>
          <li>The registered owner must not knowingly allow an unlicensed person to drive the vehicle.</li>
          <li>A driver must cooperate with lawful traffic stops and must not attempt to evade an officer.</li>
        </ul>
      </TopicSection>

      <aside className="oe-chapter-nine-note"><strong>Safe-driving principle:</strong> Laws set minimum standards. Choose the safer action whenever traffic, weather, visibility, or roadway conditions require more care.</aside>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function ChapterNineTestLesson({ onStart }) {
  return (
    <article className="oe-full-lesson oe-test-lesson oe-chapter-four-test oe-chapter-nine-test">
      <h3>9.4 Chapter 9</h3>
      <section className="oe-chapter-four-test-card">
        <p><strong>Congratulations!</strong> You have completed the reading for chapter 9. You&apos;ll need to get 9 answers correct (out of 12) in order to proceed. <strong>Good luck!</strong></p>
        <button className="oe-chapter-four-test-start" type="button" onClick={onStart} aria-label="Start here and return to Chapter 9">
          <img src="/start.png" alt="Start Here" />
        </button>
        <img className="oe-chapter-four-quiz-image" src="/quize.png" alt="Chapter 9 quiz illustration" />
      </section>
    </article>
  )
}
