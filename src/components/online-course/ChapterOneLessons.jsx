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
