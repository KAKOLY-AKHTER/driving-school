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

export function DefensiveDrivingLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-defensive-driving-lesson">
      <LessonHeader title="6.1 Defensive Driving" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-driving-section oe-defensive-intro-section">
        <img className="oe-defensive-intro-image" src="/improv1.png" alt="Improve defensive driving skills" />
        <p>Defensive driving is a form of training for a motor vehicle driver that goes beyond mastery of the rules of the road and the basic mechanics of driving. Its aim is to reduce the risk of driving by anticipating dangerous situations, despite adverse conditions or the mistakes of others. This is achieved through adherence to a variety of general rules, as well as the practice of specific driving techniques.</p>

        <h4>Courtesy and Attitude</h4>
        <ul className="oe-driving-list">
          <li>Acceptance of responsibility
            <ul><li>If you make a mistake, take responsibility for your actions.</li></ul>
          </li>
          <li>Alertness
            <ul>
              <li>Always be alert.</li>
              <li>Be ready to handle any driving situation you may encounter.</li>
            </ul>
          </li>
          <li>Consideration for others, including car occupants</li>
          <li>Be courteous and considerate to those who share the road with you and also to your passengers.</li>
          <li>Foresight
            <ul><li>Be aware of potential hazardous situations ahead of you on the road.</li></ul>
          </li>
          <li>Good attitude towards other highway users and toward the laws and law enforcement</li>
          <li>Use good judgment in making driving decisions.</li>
        </ul>
      </section>

      <section className="oe-driving-section">
        <h4>Right-of-Way</h4>
        <div className="oe-video-wrap oe-driving-video">
          <iframe src="https://www.youtube.com/embed/xmNYLKYcdrw" title="Right of Way - Rules of the Road" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        </div>

        <div className="oe-right-of-way-media">
          <img src="/improve2.png" alt="Yield right of way sign" />
          <p>Right-of-Way means the right to immediate use of the roadway but use only in such a manner to assure the safety of the other drivers and pedestrians.</p>
        </div>
        <ul className="oe-driving-list">
          <li>RIGHT-OF-WAY rules indicate who shall yield when there is a potential conflict between vehicles or between a vehicle and a pedestrian. A driver shall give the right-of-way to pedestrians, bicyclists and emergency vehicles at all times.</li>
          <li>Right-of-way rules should be accompanied by common sense and courtesy.</li>
          <li>You should neither insist on taking the right-of-way nor insist that others take it when they are hesitant to do so. If two vehicles enter an intersection from different directions at the same time and the intersection is controlled by stop signs in all directions or the signal light is not working, the driver on the right has the right of way.</li>
          <li>You must yield the right of way to any police car, fire engine, ambulance or other emergency vehicle using a siren and/or red lights.</li>
        </ul>

        <img className="oe-emergency-vehicle-image" src="/improve3.png" alt="Driver yielding to an approaching emergency vehicle" />
        <p>Drive as close to the right edge of the road as possible and stop until the emergency vehicle(s) has passed.</p>
        <p>Never stop in an intersection. If you are in an intersection and see an emergency vehicle, continue through the intersection and then drive to the right as soon as possible and stop.</p>
        <p>Emergency vehicles often use the wrong side of the street to continue on their way. They sometimes use a loud speaker to talk to drivers blocking their path.</p>
      </section>

      <section className="oe-driving-section">
        <h4>Driving Environment</h4>
        <p>Drivers need to understand that the environment and conditions of the roadway are constantly changing. They should be prepared to handle and react to any changes such as weather conditions, traffic, collisions, construction areas, or sunrise and sunset. One good way for a driver to practice is to listen to traffic reports.</p>

        <h4>Looking Ahead</h4>
        <ul className="oe-driving-list">
          <li>In order to avoid last minute moves when driving in traffic, the driver should:
            <ul>
              <li>Look ahead for traffic hazards such as road construction, accidents and detours.</li>
              <li>Leave enough following distance to safely maneuver around hazards or disabled vehicles.</li>
              <li>Look ahead for signal changes such as yellow lights and flashing crosswalk signs.</li>
            </ul>
          </li>
          <li>A visual lead of 10 to 15 seconds or one block is appropriate when driving in traffic in urban areas.</li>
        </ul>

        <h4>Planning Your Trip</h4>
        <p>Planning your trip and how you will get to your destination is part of driving safely. If you have clear directions to your destination, you won&apos;t be tempted to try to read a map while driving. There are many websites that can be used to plan your route prior to leaving for your destination.</p>

        <h4>Weather Conditions</h4>
        <p>Weather conditions affect visibility and braking distance. Driving becomes more difficult when visibility is reduced or when road surfaces are covered with snow, rain or ice.</p>

        <h4>Safe Driving Distances</h4>
        <p>It is important to remember that drivers must keep the vehicle under control at all times. Leaving enough room between your car and the car in front of you is crucial. Adequate following distances and braking distances allow the driver time to slow down or stop when necessary.</p>
        <div className="oe-video-wrap oe-driving-video">
          <iframe src="https://www.youtube.com/embed/oEiYmMAkioU" title="Following Distance - Rules of the Road" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        </div>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function BasicSpeedLawsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-basic-speed-lesson">
      <LessonHeader title="6.2 Basic Speed Laws" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-driving-section">
        <div className="oe-speed-intro">
          <img src="/speed1.png" alt="Speed limit sign" />
          <p>California &quot;Basic Speed Law&quot; indicates that you may never drive faster than is safe for current conditions. For example, if you are driving 45 mph in a 55 mph speed zone during a dense fog, you could be cited for driving &quot;too fast for conditions.&quot;</p>
        </div>
        <p>Regardless of the posted speed limit, your speed should depend on:</p>
        <ul className="oe-driving-list compact">
          <li>The number and speed of other vehicles on the road.</li>
          <li>Whether the road surface is smooth, rough, graveled, wet, dry, wide, or narrow.</li>
          <li>Bicyclists or pedestrians walking on the road&apos;s edge or crossing the street.</li>
          <li>Whether it is raining, foggy, snowing, windy, or dusty.</li>
        </ul>
      </section>

      <section className="oe-driving-section">
        <h4>Maximum Speed Limit</h4>
        <div className="oe-maximum-speed-media">
          <img src="/speed2.png" alt="Maximum speed limit 65 sign" />
          <div>
            <p>The maximum speed limit on most California highways is 65 mph.</p>
            <ul className="oe-driving-list">
              <li>You may drive 70 mph where posted. Unless otherwise posted, the maximum speed limit is 55 mph on two-lane undivided highways and for vehicles towing trailers. Other speed limit signs are posted for the type of roads and traffic in each area. All speed limits are based on ideal driving conditions. Construction zones usually have reduced speed zones.</li>
              <li>Driving faster than the posted speed limit or driving faster than safe for current conditions on any road is dangerous and illegal. High speed increases your stopping distance. The faster you go, the less time you have to avoid a hazard or collision. The force of a 60 mph crash is not just twice as great as a 30 mph crash ---- it&apos;s four times as great!</li>
            </ul>
          </div>
        </div>

        <ul className="oe-driving-list oe-speed-rules">
          <li>The urban driving environment is typically more challenging to the novice driver because there are more stimuli to be sorted and reacted to. Reducing speed allows more time to see the details of the urban driving environment such as pedestrians, road hazards and traffic flow. It also allows time to analyze what you see and predict what might happen, react to any hazards that might require quick reflexes, execute decisions to safely change directions and avoid hazardous situations. 50% of all traffic violations involve speeding. Many of these occur in urban areas.</li>
          <li>There is no minimum speed limit in California, but the law states that: <em>&quot;No person shall drive so slowly or stop on the roadway that may impede traffic or block the normal and reasonable movement of traffic.&quot;</em> You can be cited if you are stopped for doing this.
            <p>You should reduce your speed when:</p>
            <ul>
              <li>Traffic is dense.</li>
              <li>Near shopping centers, parking lots and in downtown areas.</li>
              <li>When you see brake lights on several cars ahead.</li>
              <li>Driving on narrow bridges and in tunnels.</li>
              <li>When approaching toll plazas.</li>
              <li>Near schools, playgrounds and on residential streets.</li>
            </ul>
          </li>
          <li>There are special speed limits that are to be obeyed even if there is no sign erected. Conviction of speeding when driving in these special areas is based on proof that the driver was unsafe and negligent.
            <ul>
              <li>Railway crossings</li>
              <li>Blind intersections</li>
              <li>Alleys</li>
              <li>Residential districts</li>
              <li>Schools</li>
              <li>Bridges</li>
              <li>Business districts</li>
            </ul>
          </li>
          <li>You can assume that the speed limit is 25 miles per hour in any business or residential district unless posted otherwise. When passing a school when children are present and when passing a senior center with a &quot;senior&quot; warning sign, the speed limit is also 25 mph unless otherwise posted. Sometimes lower speed limits are posted in the general vicinity of schools in addition to the school itself. Specially marked crosswalks and five-sided signs warn that you are approaching or are in the presence of a school.</li>
        </ul>

        <h4 className="oe-speed-subheading">You should reduce your speed rather than &quot;ride the brake.&quot;</h4>
        <p>Covering the brake pedal to improve reaction time is recommended when:</p>
        <ul className="oe-driving-list compact">
          <li>You are passing parked cars, as they may pull out in front of you or open their door</li>
          <li>You see brake lights ahead meaning that traffic is coming to a stop</li>
          <li>You are approaching signal lights- look for traffic build up at the intersection and for flashing crosswalk lights, because these indicate that the light is about to change.</li>
        </ul>
      </section>

      <SpeedLawCodeSections />

      <section className="oe-driving-section oe-speed-video-section">
        <div className="oe-video-wrap oe-driving-video">
          <iframe src="https://www.youtube.com/embed/04-J4_dfXxU" title="Speed Limits - Rules of the Road" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        </div>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

function SpeedLawCodeSections() {
  return (
    <section className="oe-driving-section oe-speed-code-section">
      <h4 className="oe-speed-code-title">CVC Code: Established Speed Laws</h4>
      <article><h5>CVC 22400: Minimum Speed Law</h5><h6>Slow Moving Vehicles</h6><p>Vehicles proceeding at a speed less than the flow of traffic and moving on a twolane highway where passing is unsafe, must turn off the roadway at the nearest place designated as a turnout or wherever sufficient area for a safe turnout exists if a line of 5 or more vehicles forms behind them.</p></article>
    </section>
  )
}
