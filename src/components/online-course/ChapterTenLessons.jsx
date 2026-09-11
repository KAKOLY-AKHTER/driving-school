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

function Section({ title, children, className = '' }) {
  return <section className={`oe-chapter-ten-section${className ? ` ${className}` : ''}`}><h4>{title}</h4>{children}</section>
}

export function ChapterTenOverview({ lessons, onSelectLesson, onBegin }) {
  return (
    <article className="oe-chapter-ten-overview">
      <h3 className="oe-chapter-kicker">Chapter 10: Acquiring A California Driver&apos;s License</h3>
      <figure className="oe-chapter-ten-hero">
        <img src="/pic.png" alt="Driver displaying a California driver license" />
        <figcaption>A driver&apos;s license shows that a person has been given permission by the State of California to drive on public roadways.</figcaption>
      </figure>
      <nav className="oe-chapter-ten-lessons" aria-label="Chapter 10 lessons">
        {lessons.map((lesson, index) => (
          <button type="button" onClick={() => onSelectLesson(index)} key={lesson}>
            <span>10.{index + 1}</span>
            <strong>{lesson === 'Test 10' ? 'Chapter 10 Test' : lesson}</strong>
            <span aria-hidden="true">&rarr;</span>
          </button>
        ))}
      </nav>
      <div className="oe-start-wrap"><button className="oe-start" type="button" onClick={onBegin}>Begin Lesson</button></div>
    </article>
  )
}

export function ObtainingLicenseLesson({ onPrevious, onNext }) {
  const writtenTopics = ['Accident responsibility', 'DUI/drugs', 'Driving on freeways', 'Lane markings and lane usage', 'Parking, including on hills', 'Road hazards and railroad crossings', 'Right-of-way', 'Seat belts and child restraints', 'Maintaining a space cushion', 'Speed and speed limits', 'Safe driving practices', 'Sharing the roadway with others', 'Driving with special vehicles, including school buses', 'Improving traffic flow', 'Traffic lights, signals, turns and signs', 'Visual scanning', 'Driving in inclement weather']
  const vehicleChecklist = ['Driver window rolls down', 'Windshield is unobstructed for the driver and examiner', 'Rear-view mirrors are present', 'Front and rear turn signals and brake lights work', 'Tires have adequate tread', 'Foot brake does not touch the floorboard', 'Horn and emergency/parking brake work', 'Windshield wipers, defroster, emergency flashers and headlights work', 'Passenger door opens from inside and outside', 'Glove box is closed and secure', 'Seat belts are present and functional', 'Rear license plate has current registration stickers', 'Proof of financial responsibility is available', 'The applicant knows the arm signals']
  const testedSkills = ['Driving through and stopping at intersections', 'Control of the vehicle', 'Parking-lot driving and backing up', 'Choosing a speed appropriate for conditions', 'Judging distance and respecting right-of-way', 'Attentiveness and visual-search skills', 'Business, urban, residential and rural driving', 'Lane changes and left and right turns', 'Freeway or highway driving when required']

  return (
    <article className="oe-full-lesson oe-obtaining-license-lesson">
      <LessonHeader title="10.1 Process in Obtaining your Driver's License" onPrevious={onPrevious} onNext={onNext} />

      <Section title="To obtain a driver license you must:">
        <ul>
          <li>Be in the United States legally.</li>
          <li>Provide proof of age and California residency.</li>
          <li>Provide a Social Security number when required.</li>
          <li>Complete driver education and driver training when required for your age.</li>
          <li>Provide a thumbprint and pass a vision test.</li>
          <li>Pass a knowledge test showing that you understand California traffic laws.</li>
          <li>Pass a behind-the-wheel test of your driving skills.</li>
        </ul>
        <p>When applying for an original driver license or identification card, present an acceptable birth-date and legal-presence document and provide the identifying information required by the DMV. If the name on that document differs from the application, also bring an acceptable true-full-name document.</p>
        <p><strong>Examples of true-full-name documents:</strong></p>
        <ul>
          <li>Adoption or legal name-change documents.</li>
          <li>Marriage certificate or dissolution-of-marriage document.</li>
          <li>A certificate, declaration, or registration document verifying a domestic partnership.</li>
        </ul>
        <p><strong>Examples of other acceptable documents may include:</strong></p>
        <ul className="oe-ten-columns">
          <li>U.S. birth certificate</li><li>Proof of Indian Blood Degree</li><li>U.S. passport</li><li>U.S. Armed Forces identification card</li><li>Certificate of Naturalization</li><li>Permanent Resident Card</li><li>Qualifying foreign passport and immigration documents</li>
        </ul>
      </Section>

      <Section title="California Residency Requirement">
        <p>Applicants for an original California driver license or identification card must submit satisfactory proof of California residency. The DMV cannot issue the original card until the residency requirement is met.</p>
      </Section>

      <Section title="Making an Appointment">
        <p>You may schedule an appointment with the DMV to apply for a license and take required tests instead of waiting in line. Use the DMV website or telephone service to find the nearest office and available appointment options.</p>
      </Section>

      <Section title="Photograph Taken">
        <div className="oe-ten-photo-row">
          <img src="/man1.png" alt="Driver license applicant having a photograph taken" />
          <p>When the application process is complete and fees are paid, your photograph will be taken.</p>
        </div>
      </Section>

      <Section title="Written Test">
        <div className="oe-ten-written-row">
          <img src="/quize.png" alt="Written knowledge test illustration" />
          <div>
            <p>Your knowledge of traffic laws and safe-driving practices is assessed during the application process. Topics include:</p>
            <ul className="oe-ten-columns">{writtenTopics.map(topic => <li key={topic}>{topic}</li>)}</ul>
          </div>
        </div>
        <h5>Written Test Passing Requirements</h5>
        <ul>
          <li>The provisional-license knowledge test contains 46 questions and allows a maximum of 7 errors.</li>
          <li>The adult original-license test contains 36 questions and allows 5 errors.</li>
          <li>The license-renewal test contains 18 questions and allows 3 errors.</li>
        </ul>
        <aside className="oe-chapter-ten-note"><strong>Note:</strong> Tests are revised during the year. Prepare by studying the current California Driver Handbook instead of old versions of the tests.</aside>
        <ul>
          <li>The knowledge test is available in many languages. Applicants taking a non-English or oral test may also have to identify common traffic signs in English.</li>
          <li>Provisional applicants who fail must wait before retesting so they have time to study.</li>
          <li>After three failed written-test attempts, a new application and fee are required.</li>
        </ul>
      </Section>

      <Section title="Behind-the-Wheel Driving Test">
        <p>Only the examiner may accompany you during the driving test, and no animals may be in the vehicle.</p>
        <h5>Your vehicle must be in proper working order:</h5>
        <ul className="oe-ten-columns">{vehicleChecklist.map(item => <li key={item}>{item}</li>)}</ul>
        <h5>The test evaluates your understanding of the road and your vehicle-handling skills:</h5>
        <ul className="oe-ten-columns">{testedSkills.map(item => <li key={item}>{item}</li>)}</ul>
        <aside className="oe-chapter-ten-note"><strong>Scoring:</strong> The examiner scores many driving items. Serious safety errors can cause automatic disqualification.</aside>
        <ul>
          <li>Automatic-disqualification errors include an unsafe maneuver requiring examiner intervention, striking an object or curb, disobeying a sign or signal, endangering people or vehicles, dangerous speed, misuse of equipment, or a lane violation.</li>
          <li>After three failed driving-test attempts, the instruction permit is no longer valid and a new application fee is required.</li>
          <li>The best preparation is professional driver training and extensive practice of every required maneuver.</li>
          <li>A provisional applicant normally must hold an instruction permit for six months before testing and must wait before retesting after a failed attempt.</li>
        </ul>
      </Section>

      <div className="oe-video-wrap oe-ten-driving-video">
        <iframe src="https://www.youtube.com/embed/eQ8AGkmtS1Q" title="Tips to pass your driving test" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </div>

      <Section title="Successful Completion of Requirements">
        <div className="oe-ten-license-images">
          <img src="/man2.png" alt="California provisional and under-21 driver license card format" />
          <img src="/man3.png" alt="Close-up of provisional-until date on a California driver license" />
        </div>
        <ul>
          <li>After completing the procedures, requirements, and examinations, a successful applicant receives a temporary paper license until the photo license is issued or the application is refused.</li>
          <li>A provisional license holder may drive alone while following all provisional restrictions and avoiding collisions and traffic violations.</li>
          <li>The provisional status ends at age 18.</li>
          <li>During the first 12 months, a provisional driver cannot drive between 11 p.m. and 5 a.m. or transport passengers under age 20 unless accompanied by an authorized licensed adult or driving instructor.</li>
          <li>Driver licenses must be renewed periodically. A vision, knowledge, or driving test may be required.</li>
          <li>Carry your driver license whenever you drive and show it to law enforcement or involved parties when legally required.</li>
          <li>Notify the DMV after an address change, visit a DMV office after a legal name change, and replace a damaged or lost license. Destroy the old card if it is later found after replacement.</li>
        </ul>
      </Section>

      <Section title="Emergency and Donor Card">
        <ul>
          <li>The DMV provides organ-donor information and registration options. Organ donation has saved thousands of lives, including people injured in traffic collisions.</li>
          <li>Emergency medical information may be carried with your license so responders can find important details when needed.</li>
        </ul>
      </Section>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function CaliforniaLicenseClassesLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-license-classes-lesson">
      <LessonHeader title="10.2 California License Classes" onPrevious={onPrevious} onNext={onNext} />
      <p className="oe-chapter-ten-lead">California issues different classes of driver licenses. Applicants must tell the DMV what type of vehicle they need to drive so the appropriate license, endorsements, tests, and restrictions can be determined.</p>

      <Section title="Class A">
        <p>Permits operation or towing of vehicle combinations within Class A authority, including vehicles covered by Classes B and C, subject to applicable endorsements and restrictions.</p>
      </Section>

      <Section title="Class A—Firefighter">
        <p>Permits operation of qualifying Class A and Class B combination firefighting vehicles, plus Class C vehicles. It does not authorize passenger transportation.</p>
      </Section>

      <Section title="Class A—Noncommercial">
        <ul>
          <li>May authorize towing a travel trailer over 10,000 pounds GVWR or a fifth-wheel travel trailer over 15,000 pounds GVWR when not used for hire.</li>
          <li>With the required endorsement, it may cover certain fifth-wheel livestock or recreational trailers within the legal weight and use limits.</li>
          <li>The tow vehicle and trailer must meet all applicable weight, equipment, and safety requirements.</li>
        </ul>
      </Section>

      <Section title="Class B">
        <p>Generally covers heavy single vehicles, certain buses and farm-labor vehicles, and other vehicles within Class B authority. Passenger, school-bus, air-brake, or other endorsements and certificates may be required.</p>
      </Section>

      <Section title="Class B—Firefighter">
        <p>Permits operation of a qualifying single firefighting vehicle and Class C vehicles. It does not authorize passenger transportation and is subject to firefighter-license restrictions.</p>
      </Section>

      <Section title="Class C">
        <ul>
          <li>Covers most ordinary passenger vehicles and light trucks that do not require a commercial Class A or B license.</li>
          <li>May cover certain three-wheel vehicles, house cars, vans, and trailers when they remain within statutory weight, passenger, and use limits.</li>
          <li>Special towing authority may require an endorsement and is not valid for towing for hire.</li>
        </ul>
      </Section>

      <Section title="Commercial Class C">
        <p>A commercial Class C license and the proper endorsement may be required for vehicles transporting hazardous materials that require placards, hazardous waste, or certain passenger operations.</p>
      </Section>

      <Section title="Class M1">
        <p>Permits operation of a two-wheel motorcycle or motor-driven cycle and vehicles covered by Class M2, subject to restrictions and endorsements.</p>
      </Section>

      <Section title="Class M2">
        <p>Permits operation of a motorized bicycle, moped, or bicycle with an attached motor within the limits of the license.</p>
      </Section>

      <Section title="Motorcycle Training Course" className="oe-motorcycle-training">
        <p>Young motorcycle applicants must complete the motorcycle-training requirements that apply to their age. A California Highway Patrol-approved training program may provide the certificate needed by the DMV. Riders should confirm current requirements and approved training locations with the DMV or the California Motorcyclist Safety Program.</p>
      </Section>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}
