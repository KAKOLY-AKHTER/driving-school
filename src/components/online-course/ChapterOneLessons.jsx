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
  return (
    <div className="oe-bottom-nav">
      <button type="button" onClick={onPrevious}>&larr; Previous</button>
      <button type="button" onClick={onNext}>Next &rarr;</button>
    </div>
  )
}

export function ImportanceEducationLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson">
      <LessonHeader title="1.3 Importance of Driver's Education" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-importance-intro">
        <img src="/importance.png" alt="Student receiving behind-the-wheel driver training" />
        <p>The main purpose of driver education is to help you learn the <strong>skills, knowledge and attitudes</strong> needed for greater safety as an operator of an automobile and as a pedestrian.</p>
      </section>

      <section className="oe-copy-section oe-importance-points">
        <ul className="oe-nested-list">
          <li><strong>Driver&apos;s Education teaches students:</strong>
            <ul>
              <li>The rules and regulations of California roadways.</li>
              <li>How to handle and operate a motor vehicle.</li>
              <li>To develop their skills in preparation to become a confident and safe driver.</li>
            </ul>
          </li>
          <li><strong>Driver&apos;s education and behind-the-wheel training:</strong>
            <ul>
              <li>Gives students the information and skills to drive an automobile and prevent crashes.</li>
              <li>Trains drivers how to handle hazardous situations that arise while operating a motor vehicle.</li>
            </ul>
          </li>
          <li><strong>Driver&apos;s education reduces the possibility of costly, injurious and sometimes deadly crashes.</strong> It also reduces a family&apos;s auto and home insurance costs.</li>
        </ul>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function NewDrivingLawsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson">
      <LessonHeader title="1.4 The New Laws in Driving" onPrevious={onPrevious} onNext={onNext} />
      <div className="oe-laws-page-intro">
        <strong>NEW 2018 LAWS (DMV UPDATES)</strong>
        <span>Sacramento</span>
        <p>With the new year just around the corner, the California Department of Motor Vehicles (DMV) wants to inform the public of several new laws or changes to existing law that, unless otherwise noted, take effect January 1, 2018.</p>
      </div>
      <NewLawCards />
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function SmokeFreeCarsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-smoke-lesson">
      <LessonHeader title="1.5 Smoke-Free Cars" onPrevious={onPrevious} onNext={onNext} />
      <section className="oe-smoke-intro">
        <p>On <strong>January 1, 2008</strong>, a law went into effect that bans smoking in cars when children younger than 18 are present. Those caught violating the law will face up to a <strong>$100 fine</strong>.</p>
        <img src="/smoke.png" alt="No smoking sign" />
        <p>California is the <strong>third state</strong> to ban smoking in cars carrying minors but the first with a policy that protects all children under 18.</p>
      </section>
      <div className="oe-video-wrap">
        <iframe src="https://www.youtube.com/embed/vwZduijrAcw" title="Secondhand Smoke and the Effects on Children" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </div>
      <section className="oe-copy-section oe-smoke-content">
        <p>California residents are supportive of this new law. More than <strong>90 percent of Californians</strong>, including those who are smokers, supported the law to ban smoking in cars when children are present. (California Tobacco Survey 2005)</p>
        <p>The law was created to protect children who are particularly vulnerable to the dangerous effects of secondhand smoke. According to the Journal of Exposure Analysis and Environmental Epidemiology, the air quality in a car where someone is smoking can reach nearly <strong>10 times</strong> over the hazardous levels set by the United States Environmental Protection Agency. This level of air pollution in the vehicle caused by smoke from a cigarette is so severe that breathing it is dangerous for anyone.</p>
        <p>Children are still developing physically and physiologically. Children tend to breathe quicker than adults and, as a result, children exposed to secondhand smoke run a greater risk of damaging health effects.</p>
        <ul>
          <li>Children who breathe secondhand smoke on a regular basis are at a higher risk for middle ear infections.</li>
          <li>Exposure to secondhand smoke can cause asthma in children.</li>
          <li>Babies and children younger than age 6 who are exposed to secondhand smoke regularly are more likely to get respiratory tract infections, such as pneumonia and bronchitis.</li>
        </ul>
        <p>On <strong>January 26, 2006</strong>, the California Air Resources Board declared secondhand smoke a <strong>“toxic air contaminant”</strong>, putting it in the same category as car exhaust and asbestos.</p>
      </section>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function AutomobileHistoryLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-auto-lesson">
      <LessonHeader title="1.6 History of the Automobile" onPrevious={onPrevious} onNext={onNext} />
      <p className="oe-auto-lead">The automobile has been around for a little more than 125 years!</p>

      <section className="oe-auto-section">
        <h4>Development of the Automobile — Where It All Began</h4>
        <div className="oe-auto-media-row">
          <img src="/auto1.png" alt="Early automobile" />
          <p>In the 1880s, <strong>Karl Benz</strong> installed a small motor on a tricycle and the automobile was born. In 1896, <strong>Frank and Charles Duryea</strong> built the first American motorcar in Springfield, Massachusetts. They manufactured the first 13 of these gas-powered inventions.</p>
        </div>
      </section>

      <section className="oe-auto-section">
        <h4>Sociological Changes Caused by the Automobile</h4>
        <h5>The turn of the century (1900s)</h5>
        <div className="oe-auto-media-row">
          <img src="/auto2.png" alt="Automobile from the turn of the twentieth century" />
          <p>In 1896, Buffalo, New York was the first major city to pave all of its streets. At the turn of the century, 8,000 automobiles were on the road. <strong>General Motors incorporated in 1908.</strong> The first mile of rural highway was paved. Since more than 40 percent of the workforce was involved in farming, rural roads were important links. The first gas station opened in St. Louis, Missouri at the turn of the century. Speedometers were installed on Oldsmobile automobiles. In 1903, Henry Ford founded the Ford Motor Company. Five years later he introduced the Model T.</p>
        </div>
      </section>

      <section className="oe-auto-section">
        <h4>The 1900s</h4>
        <p>By 1915, 2.3 million automobiles were registered in the United States. About half of those were Ford&apos;s Model T. Model Ts were affordable, easy to service, and available in any color you wanted as long as that color was black. In 1910, Barney Oldfield set a new speed record with a Blitzen-Benz at Daytona Beach, Florida, at more than 131 miles an hour. The first Indianapolis 500 race was held in 1911. The Lincoln Highway, the nation&apos;s first coast-to-coast highway, was marked between New York and San Francisco. Carl Fisher spearheaded the effort. He wasn&apos;t the first to have this dream, but he figured out how to organize and fund the project. Wisconsin was the first state to assign numbers and letters to roads and highways.</p>
      </section>

      <section className="oe-auto-section oe-auto-highlight">
        <h4>Insurance for Automobiles Is Born</h4>
        <p>In Westfield, Massachusetts, an enterprising mechanic built his own car and then insured it for <strong>$1,000 worth of liability</strong>. His premium was <strong>$7.50</strong>.</p>
      </section>

      <section className="oe-auto-section">
        <h4>The Roaring Twenties</h4>
        <div className="oe-auto-media-row">
          <img src="/auto3.png" alt="Automobile from the Roaring Twenties" />
          <p>The federal government began a program to pave the way coast to coast. The first highway to connect the coasts was completed in 1927. Americans started “hitting” the road, traveling to National Parks, and making camping an American pastime. The new roads brought a complete transformation to the entire country.</p>
        </div>
      </section>

      <section className="oe-auto-section">
        <h4>The Automobile and the Future</h4>
        <div className="oe-auto-media-row">
          <img src="/auto4.png" alt="Modern automobile" />
          <p>The automobile is one of the most important possessions that we own. It gives freedom, education, and financial means. It has changed the entire way this nation looks. It has given us millions of miles of highways to transport our goods. The automobile may change in design, but it is here to stay. The sky is the limit to where we will go with the automobile. We have developed vehicles that run on electricity and solar power in our pursuit of a new source of power. Gasoline emits too much pollution and we are in dire need of a new, less harmful solution that is as affordable as Ford&apos;s Model T was to consumers back in the 1920&apos;s.</p>
        </div>
        <div className="oe-auto-media-row oe-auto-small-media">
          <img src="/auto5.png" alt="Road leading toward the future" />
          <p>In the future, we will see inventive new ideas that lead us into the new millennium and beyond. There is no doubt that these ideas will continue to change the way we think, act, and respond. They may even change the way we live.</p>
        </div>
        <div className="oe-auto-media-row oe-auto-fact-row">
          <img src="/auto6.png" alt="It is true" />
          <p><strong>Dr. Horatio Jackson</strong>, with his chauffeur and dog, was the first person to cross the country in an automobile. It took <strong>65 days</strong> to make their journey.</p>
        </div>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function ChapterOneTestLesson({ onStart }) {
  return (
    <article className="oe-full-lesson oe-test-lesson">
      <div className="oe-test-title-row">
        <span>Chapter Assessment</span>
        <h3>1.7 Chapter 1</h3>
      </div>
      <section className="oe-test-card">
        <div className="oe-test-message">
          <h4>Congratulations!</h4>
          <p>You have completed the reading for Chapter 1. You&apos;ll need to get <strong>9 answers correct</strong> (out of 12) in order to proceed. <strong>Good luck!</strong></p>
        </div>
        <div className="oe-test-score"><strong>9 / 12</strong><span>Correct answers required</span></div>
        <button className="oe-test-start" type="button" onClick={onStart} aria-label="Start here and return to Chapter 1" aria-describedby="chapter-one-return-note">
          <img src="/start.png" alt="" aria-hidden="true" />
        </button>
        <img className="oe-quiz-image" src="/quize.png" alt="Chapter 1 quiz illustration" />
        <p className="oe-test-return-note" id="chapter-one-return-note">Select <button className="oe-test-return-link" type="button" onClick={onStart}>Start Here</button> to return to the Chapter 1 overview.</p>
      </section>
    </article>
  )
}

const LAW_ITEMS = [
  { title: 'Private Carriers of Passengers (SB 19, Hill)', body: 'Beginning July 1, 2018, this law transfers regulatory authority over private carriers of passengers, including church and youth buses, from the California Public Utilities Commission to the DMV.' },
  { title: 'Motorcycle Training Courses (AB 1027, Acosta)', body: 'This law authorizes the DMV to accept a certificate of satisfactory completion from a motorcyclist-training program approved by the California Highway Patrol in place of the required motorcycle skills test. Applicants under 21 must still complete a novice motorcyclist-training program.' },
  { title: 'Disabled Person Parking Placards and Plates (SB 611, Hill)', body: 'This law changes the administration of the Disabled Person Parking Placard and Disabled Person License Plate Program. Applicants must provide proof of true full name and birthdate, replacement placards are limited, and the DMV must establish a renewal process requiring a mailed renewal notice every six years.' },
  { title: 'HOV Decal Program (AB 544, Bloom)', body: 'Beginning January 1, 2019, this law creates a decal program allowing certain low-emission vehicles to access high-occupancy vehicle lanes for a four-year term. Qualifying vehicles issued green or white decals in 2017 or 2018 may reapply for a decal granting access to high-occupancy toll lanes until January 1, 2022.' },
  { title: 'Parking Violations for Registration or Driver License Renewal (AB 503, Lackey)', body: 'This law changes requirements involving vehicle registration renewal and driver license issuance or renewal for unpaid parking penalties and fees. It creates a repayment process for low-income Californians and allows a vehicle owner to file for Planned Non-Operation status while unpaid parking penalties remain on the vehicle record.' },
  { title: 'DUI – Passenger for Hire (AB 2687, Achadjian)', body: 'Beginning July 1, 2018, this law makes it unlawful to operate a motor vehicle with a blood alcohol concentration of 0.04 percent or more when a passenger for hire is in the vehicle. The DMV will suspend a driver license when a conviction is added to the record, and commercial driver license holders will receive a disqualification.' },
  { title: 'Buses and Seatbelts (SB 20, Hill)', body: 'Beginning July 1, 2018, this law requires a passenger on a bus equipped with seat belts to be properly restrained by a safety belt. It also requires children from 8 through 15 years of age to use a safety belt or an appropriate child passenger restraint system that meets federal safety standards.' },
  { title: 'Cannabis Use in Vehicles (SB 65, Hill)', body: 'This law prohibits smoking or ingesting marijuana or marijuana products while driving or riding as a passenger in a vehicle.' },
]

function LawCard({ title, children }) {
  return <section className="oe-law-card"><h4>{title}</h4><p>{children}</p></section>
}

function NewLawCards() {
  return <div className="oe-law-updates">{[...LAW_ITEMS].reverse().map(item => <LawCard title={item.title} key={item.title}>{item.body}</LawCard>)}<RoadFeeCard /></div>
}

function RoadFeeCard() {
  const fees = [['Between $0 and $4,999', '$25'], ['$5,000–$24,999', '$50'], ['$25,000–$34,999', '$100'], ['$35,000–$59,999', '$150'], ['$60,000 and higher', '$175']]
  return <section className="oe-law-card oe-fee-card"><h4>Road Maintenance and Rehabilitation Program (SB 1, Beall)</h4><p>Beginning January 1, 2018, the DMV is required to collect a Transportation Improvement Fee (TIF) at registration or renewal, ranging from $25 to $175 based on the vehicle&apos;s current market value. Beginning July 1, 2020, the law also requires a Road Improvement Fee for zero-emission vehicles with a model year of 2020 or later.</p><p>The TIF is based on the vehicle&apos;s current market value. Customers with a vehicle renewal notice due on January 1, 2018 and later will include the TIF.</p><div className="oe-fee-table-wrap"><table className="oe-fee-table"><thead><tr><th>Vehicle Market Value Range</th><th>Transportation Improvement Fee</th></tr></thead><tbody>{fees.map(([range, fee]) => <tr key={range}><td>{range}</td><td><strong>{fee}</strong></td></tr>)}</tbody></table></div></section>
}
