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

export function ProperLaneUseLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-lane-use-lesson">
      <LessonHeader title="6.3 Proper Lane Use" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-driving-section">
        <h4>Designated Lane of Travel</h4>
        <h5>Divided Highways</h5>
        <img className="oe-lane-hero" src="/lane1.png" alt="Divided highway with traffic traveling in opposite directions" />
        <p>A divided highway is a highway a where a wall or retainer is dividing the traffic driving in opposite directions.</p>

        <h5>Lane Roadways</h5>
        <div className="oe-lane-media-row oe-lane-roadway-row">
          <img src="/lane2.png" alt="Roadway with marked traffic lanes" />
          <ul className="oe-driving-list compact">
            <li>A lane roadway is a roadway where there are at least two clearly marked lanes for traffic, going in one direction on the roadway.</li>
            <li>The lane has either a double yellow line, or single yellow line in the center.</li>
            <li>The lines can be broken or unbroken.</li>
          </ul>
        </div>

        <h5>Three-Lane Highways</h5>
        <div className="oe-lane-media-row oe-three-lane-row">
          <img src="/lane3.png" alt="Three-lane highway lane numbering diagram" />
          <ul className="oe-driving-list compact">
            <li>These highways have three lanes of traffic all going in the same direction of travel.</li>
            <li>The left or &quot;fast&quot; lane is called the &quot;Number one lane,&quot; the lanes to the right of the number one lane are called the number two and then the number three lanes. Drive in the lane with the smoothest flow of traffic. If you can choose among three lanes, pick the middle lane for the smoothest driving. To drive faster, pass, or turn left, use the left lane. When you choose to drive slowly or enter or exit the road, use the right lane.</li>
          </ul>
        </div>

        <div className="oe-video-wrap oe-driving-video">
          <iframe src="https://www.youtube.com/embed/K_nQhHS6jjk" title="Center Left Turn Lane" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        </div>

        <h5>HOV Lanes</h5>
        <div className="oe-hov-row">
          <img src="/lane4.png" alt="High occupancy vehicle lane" />
          <p>The HOV lanes, or high occupancy vehicle lane(s) are also known as the carpool lanes. These lanes are clearly marked and are restricted to vehicles with two (and sometimes three) or more occupants.</p>
          <img src="/lane5.png" alt="Carpool with multiple occupants" />
        </div>
      </section>

      <section className="oe-driving-section">
        <h4>Position of Vehicle on Lane of Travel</h4>
        <h5>Marked Lanes</h5>
        <ul className="oe-driving-list compact"><li>The position of the vehicle in a marked lane is to the right side of your lane or in the center if there are two lanes. You want to stay in the center of your lane of travel.</li></ul>
        <h5>Narrow Roadways</h5>
        <ul className="oe-driving-list compact"><li>Position your vehicle to the far right of a narrow roadway and reduce your speed.</li></ul>
        <h5>Mountain Roadways</h5>
        <ul className="oe-driving-list compact">
          <li>Position your vehicle to the extreme right of the roadway while driving on a mountain or curved roadway.</li>
          <li>Use your headlights.</li>
          <li>Honk your horn on blind curves.</li>
        </ul>
        <h5>Other Vehicles Approaching</h5>
        <ul className="oe-driving-list compact"><li>When a car or vehicle is approaching you from the opposite direction or to pass you on the roadway, it is important to move your vehicle to the far right of your lane.</li></ul>
      </section>

      <section className="oe-driving-section">
        <h4>Exceptions to Driving on the Right Side of Roadway.</h4>
        <p>When passing a vehicle going in your direction, you will end up crossing over onto the opposing traffic&apos;s lane of travel. Extreme caution must be used. On a multi-lane highway, you will also be using the left lane within the same direction to pass a vehicle.</p>
        <p>The following are exceptions to driving on the right side of the roadway:</p>
        <ul className="oe-driving-list compact">
          <li>When turning left at an intersection, a cross street or a private roadway.</li>
          <li>When the right half of the road is closed or blocked.</li>
          <li>On a one-way roadway.</li>
          <li>When the road is not wide enough.</li>
          <li>When weather conditions and road markings force you too.</li>
        </ul>
      </section>

      <section className="oe-driving-section">
        <h4>Required Lane Use and Use of Turnouts</h4>
        <p><strong>Left turn lanes</strong> are to be used when turning left from a highway. This keeps traffic flowing and minimizes rear-end collisions. <strong>Turnout lanes</strong> are usually provided on a single-lane mountain and country roads to allow slower vehicles to pull over allowing lighter, faster traffic to pass safely. It is required for vehicles traveling slower than the other vehicles to use turnouts when five or more cars are behind you and allow traffic to clear before proceeding.</p>
        <h5>Slow-Moving Vehicles</h5>
        <ul className="oe-driving-list compact"><li>Any vehicle upon a highway traveling less than the normal speed of traffic moving in the same direction shall drive in the right-hand lane except when over taking and passing another vehicle traveling in the same direction.</li></ul>
        <h5>Left Turns</h5>
        <ul className="oe-driving-list compact"><li>Use left turn lanes when preparing for lefts turn at an intersection, cross road or private roadway.</li></ul>
        <h5>Use Turnouts When Five Cars Are Behind You</h5>
        <ul className="oe-driving-list compact"><li>It is required for vehicles that are traveling slower than the other vehicles (5 vehicles) traveling on the same road in the same direction to use the designated turnouts, and allow traffic to clear before proceeding.</li></ul>
        <h5>Special Vehicles</h5>
        <ul className="oe-driving-list compact"><li>On three and four-way highways in California, large trucks are restricted to the two right lanes. They generally travel in the far right lane and use the second lane to pass.</li></ul>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function SafeDrivingIntersectionsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-intersections-lesson">
      <LessonHeader title="6.4 Safe Driving Practices: Intersections" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-driving-section">
        <div className="oe-intersection-intro">
          <img src="/safe1.png" alt="Road intersection illustration" />
          <div>
            <p>An intersection is any place where one lane of roadway meets another roadway.</p>
            <p>Intersections include cross streets, side streets, alleys, freeway entrances and any other location where vehicles traveling on different highways or roads join each other. When approaching an intersection, it is important to determine as far ahead as possible whether the intersection you are approaching is controlled or not, so that you can anticipate the behavior of cross traffic, pedestrians and cars stopping ahead. Choose the correct lane for turning and reduce speed as appropriate.</p>
            <p>Driving through an intersection is one of the most complex traffic situations motorists encounter. Intersection collisions account for more than 45 percent of all reported crashes.</p>
          </div>
        </div>
        <ul className="oe-driving-list oe-intersection-rules">
          <li>At intersections without &quot;STOP&quot; or &quot;YIELD&quot; signs, slow down and be ready to stop. Yield to traffic and pedestrians already in the intersection or just entering the intersection. Yield to the vehicle or bicycle that arrives first or to the vehicle or bicycle on your right if it reaches the intersection at the same time as you.</li>
          <li>At &quot;T&quot; intersections without &quot;STOP&quot; or &quot;YIELD&quot; signs, yield to traffic and pedestrians on the through road. They have the right-of-way.</li>
          <li>When you turn left, give the right-of-way to all vehicles approaching that are close enough to be dangerous. Also, look for motorcyclists, bicyclists and pedestrians.<br />Safety suggestion: While waiting to turn left, keep your wheels pointed straight ahead until it is safe to start your turn. If your wheels are pointed to the left and a vehicle hits you from behind, you could be pushed into oncoming traffic.</li>
          <li>When you turn right, be sure to check for pedestrians crossing the street and bicyclists coming up behind you on the right.</li>
          <li>On divided highways or highways with several lanes, watch for vehicles approaching in any lane you cross. Turn either left or right only when it is safe.</li>
          <li>When there are &quot;STOP&quot; signs at all corners, stop first then follow the rules listed above.</li>
          <li>If you have parked off the road or are leaving a parking lot, etc., yield to traffic before reentering the road.</li>
          <li>Safe driving practices:</li>
          <li>You should not rely on an oncoming vehicle&apos;s turn signal to guarantee that the vehicle will turn. Many people neglect to cancel a turn signal or begin signaling too far ahead of a turn. Make sure that the oncoming vehicle is slowing and preparing to turn before you proceed.</li>
          <li>The law requires you to signal even when you don&apos;t see any cars around. You should always signal before turning or changing lanes. Make sure that your turn signal is turned off after you have completed your turn or lane change. It is also recommended that you use both arm signals and turn signal lights if it is difficult to see turn signal lights due to glare.</li>
        </ul>
      </section>

      <ControlledIntersections />
      <RoundaboutsAndTurns />
      <SignalingAndTurnArrows />
      <LeftAndRightTurns />
      <UTurns />

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

function LessonVideo({ videoId, title }) {
  return (
    <div className="oe-video-wrap oe-driving-video">
      <iframe src={`https://www.youtube.com/embed/${videoId}`} title={title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
    </div>
  )
}

function ControlledIntersections() {
  return (
    <section className="oe-driving-section">
      <h4>Controlled Intersections</h4>
      <div className="oe-controlled-images">
        <img src="/safe2.png" alt="Three-color traffic signal" />
        <img src="/safe3.png" alt="Traffic officer directing vehicles" />
      </div>
      <p>A controlled intersection is where you have traffic control devices, traffic signals, signs, or someone directing traffic.</p>
      <LessonVideo videoId="oANRoSrG_eY" title="Signal Intersections - Rules of the Road" />

      <h5 className="oe-signal-group-title">Yellow Light</h5>
      <div className="oe-signal-row">
        <img src="/safe4.png" alt="Solid yellow traffic light" />
        <p><strong>Solid Yellow</strong><br />A yellow signal light means &quot;CAUTION.&quot; The red signal light is about to appear. When you see the yellow light, stop if you can do so safely. If you cannot stop safely, look into the intersection for vehicles, pedestrians or bicyclists that may enter the intersection and cross the intersection cautiously.</p>
      </div>
      <div className="oe-signal-row compact">
        <img src="/safe5.png" alt="Yellow left arrow" />
        <p><strong>Yellow Arrow</strong> A yellow arrow means the &quot;protected&quot; turning time period is ending. Be prepared to obey the next signal, which could be the green or red light or the red arrow.</p>
      </div>
      <p><strong>Flashing Yellow</strong><br />A flashing yellow signal light warns you to &quot;PROCEED WITH CAUTION.&quot; You do not need to stop for a flashing yellow light, but you must slow down and be especially alert before entering the intersection.</p>
      <p><strong>Flashing Yellow Arrow</strong><br />This signal means turns are permitted (unprotected), but you must first yield to oncoming traffic and pedestrians and then proceed with caution.</p>

      <h5 className="oe-signal-group-title">Red Light</h5>
      <div className="oe-signal-row">
        <img src="/safe6.png" alt="Solid red traffic light" />
        <p><strong>Solid Red</strong><br />A red signal light means &quot;STOP.&quot; You can make a right turn against a red light after you stop then yield to pedestrians, bicyclists and vehicles close enough to be a hazard. Make the right turn only when it is safe. Do not turn if a &quot;NO TURN ON RED&quot; sign is posted.</p>
      </div>
      <div className="oe-signal-row compact">
        <img src="/safe7.png" alt="Red right arrow" />
        <p>A red arrow means &quot;STOP.&quot; Remain stopped until the green signal or green arrow appears. Do not turn against a red arrow.</p>
      </div>
      <p><strong>Flashing Red</strong> A flashing red signal light means &quot;STOP.&quot; After stopping, you may proceed when it is safe. Observe the right-of-way rules.</p>

      <h5 className="oe-signal-group-title">Green Light</h5>
      <h5>Solid Green</h5>
      <div className="oe-signal-row wide">
        <img src="/safe8.png" alt="Solid green traffic light" />
        <p>Give the right-of-way to any vehicle, bicyclist or pedestrian in the intersection. A green light means &quot;GO.&quot; If you are turning left, make the turn only if you have enough space to complete the turn before creating a hazard for any oncoming vehicle, bicyclist or pedestrian. Do not enter the intersection if you cannot get completely across before the light turns red. If you block the intersection, you can be cited.</p>
      </div>
      <h5>Green Arrow</h5>
      <div className="oe-signal-row compact">
        <img src="/safe9.png" alt="Green left arrow" />
        <p>A green arrow means &quot;GO.&quot; You must turn in the direction the arrow is pointing after you yield to any vehicle, bicyclist, or pedestrian still in the intersection. The green arrow allows you to make a &quot;protected&quot; turn. Oncoming vehicles, bicyclists and pedestrians are stopped by a red light as long as the green arrow is lighted.</p>
      </div>

      <h5>Traffic Signal Blackout</h5>
      <p>The traffic signal blackout means that the light is not working. Proceed cautiously as if the intersection is controlled by &quot;STOP&quot; signs in all directions.</p>
      <div className="oe-signal-row oe-stop-row">
        <img src="/stop.png" alt="Stop sign" />
        <p>At intersections with 4-way stop signs, stop first then yield to the vehicle that arrived first or to the vehicle on your right if you arrive at the same time as other vehicles.</p>
      </div>
      <LessonVideo videoId="QHFpGAmgct4" title="Intersections - Rules of the Road" />
    </section>
  )
}

function RoundaboutsAndTurns() {
  return (
    <section className="oe-driving-section">
      <h4>Roundabouts</h4>
      <p>A roundabout is an intersection where traffic travels around a central island in a counter-clockwise direction. Vehicles entering or exiting the roundabout must yield to all traffic including pedestrians.</p>
      <p>When you approach a roundabout:</p>
      <ul className="oe-driving-list compact">
        <li>Slow down as you approach the roundabout.</li>
        <li>Yield to pedestrians and bicyclists crossing the roadway.</li>
        <li>Watch for signs and/or pavement markings that guide you or prohibit certain movements.</li>
        <li>Enter the roundabout when there is a big enough gap in traffic.</li>
        <li>Drive in a counter-clockwise direction. Do not stop or pass other vehicles.</li>
        <li>Use your turn signals when you change lanes or exit the roundabout.</li>
        <li>If you miss your exit, continue around until you return to your exit.</li>
      </ul>
      <p>For roundabouts with multiple lanes, choose your entry or exit lane based on your destination as shown in the graphic. For example, to:</p>
      <img className="oe-intersection-diagram" src="/safe10.png" alt="Multi-lane roundabout routes" />
      <ul className="oe-driving-list compact">
        <li>Turn right at the intersection (blue car), choose the right-hand lane and exit in the right-hand lane.</li>
        <li>Go straight through the intersection (red car), choose either lane, and exit in the lane you entered.</li>
        <li>Turn left (yellow car), choose the left lane, and exit.</li>
      </ul>

      <h4>Uncontrolled Intersections</h4>
      <p>At intersections with no stop or yield signs you should slow down and be ready to stop. You must yield to vehicles already in the intersection or just entering it. If you and another driver arrive at the intersection at the same time, the driver on the left must yield the right-of-way.</p>

      <h4>Making Turns</h4>
      <img className="oe-intersection-diagram medium" src="/safe11.png" alt="Vehicles making left and right turns at an intersection" />
      <p>When making a left turn from a two-way street onto a two-way street, you should start from the left most lane, but may end in any lane traveling in the direction you are turning (unless otherwise controlled).</p>
      <p>When making a right or left hand turn:</p>
      <ul className="oe-driving-list compact">
        <li>You must scan the intersection and the roadways entering it for pedestrians, bicycles and other vehicles</li>
        <li>Be aware of controlled lanes and directional signals and plan your vehicle&apos;s position before and after the turn so as to avoid a collision or blocking traffic</li>
        <li>If your view is blocked, you must yield and move very slowly until you have good visibility</li>
        <li>If there is a bicycle lane that you must use to make a right turn, do not enter it more than 200 feet before the turn, and do not cut off a bicyclist who has the right-of-way in the bike lane.</li>
      </ul>
      <LessonVideo videoId="3i_3tYk2hn0" title="Signaling and Merging - Rules of the Road" />
    </section>
  )
}

function SignalingAndTurnArrows() {
  return (
    <section className="oe-driving-section">
      <h5>Signaling</h5>
      <ul className="oe-driving-list compact">
        <li>You should use your electronic and hand signals.</li>
        <li>Considerations:
          <ul>
            <li>Signal during the last 100 feet before turning.</li>
            <li>On a freeway, signal for at least 5 seconds before turning or exiting.</li>
            <li>Signal even when you don&apos;t see other vehicles around.</li>
            <li>Be sure your turn signal is turned off after you have completed your turn or lane change so that you will not mislead other drivers.</li>
            <li>Do not assume that because you have signaled a turn that there will be space for you to complete a turn.</li>
            <li>Check your blind spots in addition to signaling an intention to make a turn.</li>
          </ul>
        </li>
      </ul>
      <h4>Turns and Arrows</h4>
      <ul className="oe-driving-list">
        <li>A green arrow means that you have right-of-way to turn in the direction the arrow is pointing after yielding to traffic, bicycles, and pedestrians already in the intersection. The turning vehicle is protected from oncoming traffic.</li>
        <li>A yellow arrow means the protected turning time is about to end and to be prepared to obey the next signal which could be a green or red light or the red arrow.</li>
        <li>A red arrow means stop until the green arrow or green signal appears and that you may not turn either right or left on a red arrow even if you stop first.</li>
      </ul>
    </section>
  )
}

function LeftAndRightTurns() {
  return (
    <section className="oe-driving-section">
      <h4>Left Turns</h4>
      <div className="oe-left-turn-intro">
        <img src="/safe12.png" alt="Green left turn arrow" />
        <p>Making left turns through an intersection can be dangerous. It is difficult to see and judge the speed of oncoming traffic. Make sure you leave enough time/space to clear the oncoming vehicles when making a left turn. At a green light you may make a left turn only if there is no hazard from oncoming traffic and it is not prohibited.</p>
      </div>
      <ul className="oe-driving-list">
        <li>When making a left turn at an uncontrolled intersection or a circular green light with no arrow, you must yield to oncoming traffic. It is a good practice to pull into the intersection in preparation for the turn. Once in the intersection you must complete your turn even if the light has turned yellow or red.</li>
        <li>When you are making a left turn, oncoming vehicles often have the right-of-way. Safely turning left includes not turning too soon and &quot;cutting the corner&quot; of the lane belonging to vehicles coming toward you. For example: Signal and stop for a red traffic light at the limit line or corner. You may turn left into a street if there is no sign to prohibit the turn. Yield to pedestrians, bicyclists or other vehicles moving on their green light.</li>
      </ul>
      <img className="oe-intersection-diagram wide" src="/safe13.png" alt="Correct left turn without cutting the corner" />

      <TurnDiagram title="LEFT TURN FROM ONE-WAY ROAD INTO ONE-WAY ROAD:" image="/safe14.png">
        Prepare to turn by getting into the left lane or the left side of a single lane, as close as possible to the left curb or edge of the road. If the road you enter has two lanes, you must turn into its left lane.
      </TurnDiagram>
      <TurnDiagram title="LEFT TURN FROM TWO-WAY ROAD INTO TWO-WAY ROAD:" image="/safe15.png">
        Approach the turn with your left wheels as close as possible to the centerline. Try to use the left side of the intersection to help ensure that you do not interfere with opposing traffic turning left. Stay to the right of the centerline of the road you enter but as close as possible to the centerline.
      </TurnDiagram>
      <ul className="oe-driving-list"><li>Be alert for traffic especially motorcycles approaching from the left and from the oncoming lane you are about to cross. Oncoming motorcycles are difficult to see and it is difficult to judge their speed and distance away. Drivers often fail to see an oncoming motorcycle and collide with it while making a turn across a traffic lane.</li></ul>
      <TurnDiagram title="LEFT TURN FROM TWO-WAY ROAD INTO FOUR-LANE HIGHWAY:" image="/safe16.png">
        Approach the turn with your left wheels as close as possible to the centerline. Enter the left lane, to the right of the centerline. When traffic permits, you may move out of the left lane.
      </TurnDiagram>
      <TurnDiagram title="LEFT TURN FROM TWO-WAY ROAD INTO ONE-WAY ROAD:" image="/safe17.png">
        Approach the turn with your left wheels as close as possible to the centerline. Make the turn before reaching the center of the intersection, and turn into the left lane of the road you enter.
      </TurnDiagram>

      <h4>Right Turns</h4>
      <div className="oe-right-turn-intro">
        <img src="/safe18.png" alt="Right turn warning sign" />
        <p>A right turn may be made on a red light after you have yielded to all traffic and pedestrians and if a NO TURN ON RED sign is not posted. You must make a complete stop before making your right turn. Safely turning right includes not turning wide. You should stay in the right lane until after you have finished your turn.</p>
      </div>
      <img className="oe-intersection-diagram wide" src="/safe19.png" alt="Correct right turn path" />
      <p>To safely make a right turn, drive close to the right edge of the road. If there is a bike lane, drive into the bike lane no more than 200 feet before the turn. Watch for bicyclists or motorcyclists who may get between your vehicle and the curb. Begin signaling about 100 feet before the turn. Look over your right shoulder and reduce your speed. Stop behind the limit line, look both ways and turn when it is safe. Do not turn wide. Complete your turn in the right lane.</p>
      <img className="oe-turn-lane-sign" src="/safe20.png" alt="Begin right turn lane yield to bikes sign" />
      <p>Certain lanes are for right turns only. Make sure the lane that you are in is for a right turn, if there is a designated lane for turning right. Otherwise, you want to check the bike lane for bicyclists. When it is clear, move into the bike lane close to the curb to make your right turn.</p>
    </section>
  )
}

function TurnDiagram({ title, image, children }) {
  return (
    <div className="oe-turn-diagram-block">
      <h5>{title}</h5>
      <img src={image} alt={title.toLowerCase()} />
      <p>{children}</p>
    </div>
  )
}

function UTurns() {
  return (
    <section className="oe-driving-section">
      <h5>U Turns</h5>
      <ul className="oe-driving-list compact">
        <li>Unless otherwise prohibited by a sign, a U-turn is legal at an intersection whenever a traffic stop sign protects you from oncoming traffic.</li>
        <li>A U-turn is legal at an intersection with a signal light, which is either green or a green arrow unless otherwise prohibited.</li>
        <li>When attempting a U-turn at an intersection:</li>
        <li>You must be sure it is not prohibited</li>
        <li>Scan for pedestrians and bicycles as well as other vehicles that may be entering the intersection</li>
        <li>You must start the turn from the leftmost lane available to you but may finish it in any lane.</li>
      </ul>
      <img className="oe-intersection-diagram wide" src="/safe21.png" alt="U-turn paths at a divided intersection" />
      <h5>Check for Prohibitive Signs</h5>
      <div className="oe-no-u-turn-row">
        <img src="/safe22.png" alt="No U-turn signs" />
        <p>Look for signs telling you that you cannot make a U-turn. If you do not see a sign, U-turn is usually is allowed. Obey all traffic signs and signals.</p>
      </div>
    </section>
  )
}

export function BackingParkingLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-backing-lesson">
      <LessonHeader title="6.6 Backing Up, Parallel Parking and Three-Point Turn" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-driving-section">
        <h4>Backing Up</h4>
        <p>Backing up a vehicle takes practice. Vision is typically limited and extreme caution must be used at all times. It is difficult to see directly behind the car, even when using mirrors and glancing back.</p>
        <img className="oe-backing-hero" src="/back.png" alt="Driver looking behind while backing up a car" />
        <p>Before getting into your vehicle, check behind the car for small objects, children, children&apos;s toys and other hazards.</p>
        <p>When backing up, you should:</p>
        <ul className="oe-driving-list">
          <li>Look in your rear view mirror and your side view mirrors. However, do not rely on your rear view and/or side mirrors to back up. You cannot see a wide enough view of traffic or hazards with your mirrors alone.</li>
          <li>Watch behind your vehicle as you are backing up. Turn and look over your right shoulder to look behind you while you back up to make sure you are seeing all of the traffic.</li>
          <li>Remember to always back up slowly using your brake and clutch to control your speed and avoid collisions.</li>
        </ul>
        <p>If your ability to turn your head and shoulders is restricted:</p>
        <ul className="oe-driving-list compact">
          <li>Avoid backing up if at all possible.</li>
          <li>Find parking places that do not require backing up.</li>
          <li>Carefully use all your mirrors and get passengers to help with the maneuver.</li>
        </ul>
        <div className="oe-video-wrap oe-driving-video">
          <iframe src="https://www.youtube.com/embed/Il5KdPDJG98" title="Backing maneuver driving test" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        </div>

        <h4>Sharp Turns</h4>
        <ul className="oe-driving-list">
          <li>Backing around corners or sharp curves should be avoided unless you have good visibility in all directions because it is very dangerous. A vehicle can come around the curve and run into the back end of your vehicle.</li>
          <li>If you must make a sharp turn while backing up, use your left hand as the main steering hand to turn the steering wheel
            <ul><li>Then, just as you would when driving forward, use your hand over hand movements, all while your body is positioned sideways and your head is turned towards the right rear.</li></ul>
          </li>
          <li>Once you have completed making the sharp turn straighten your steering wheel to the angle of the roadway or intended area that you are backing into. Always proceed at very slow speeds.</li>
        </ul>
      </section>

      <section className="oe-driving-section">
        <h4>Parallel Parking</h4>
        <p>Many motorists consider parallel parking the most difficult part of driving. Practice, patience and self-confidence will help you master the task of properly backing and properly judging distances and angles. You must adjust parallel parking procedures to the particular situation.</p>
        <div className="oe-video-wrap oe-driving-video">
          <iframe src="https://www.youtube.com/embed/eRgeq8xrqTg" title="Parallel parking driving test" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        </div>

        <h5 className="oe-backing-emphasis">The following instructions are basic and general instructions for parallel parking</h5>
        <p>Select a space that is large enough for your vehicle on your side of the road. Check your mirrors before stopping and signal to alert other drivers. Pull up alongside the vehicle in front of the space, leaving about two feet between the other vehicle and yours.</p>
        <p>Look behind you over both shoulders to make sure you will not interfere with pedestrians or oncoming traffic. Back up slowly and begin to turn your steering wheel all the way toward the near curb. Look through the rear window, not the rearview mirrors, as you back up. Check to the side and front occasionally to make sure that you are clearing the vehicle ahead.</p>
        <p>When your front wheels are opposite the rear bumper of the vehicle ahead, turn the steering wheel the other way while continuing to back up. Make sure you clear the vehicle ahead. Look back and stop to avoid bumping the vehicle behind you.</p>
        <p>Straighten your wheels, and pull forward. Allow room for the vehicles ahead and behind you to get out. In your final parking position, your wheels must be no more than 18 inches from the curb.</p>
        <p>To get closer to the curb, alternately pull forward and back up, turning the steering wheel first towards the curb and then quickly straight again. After parking, remember that you may not open the door on the roadside if it will interfere with traffic.</p>

        <h5 className="oe-backing-emphasis">To pull out of a parallel parking space</h5>
        <p>Make sure your wheels are straight, back up to the vehicle behind you, and turn your wheels away from the curb. Steps to safely enter into traffic:</p>
        <ol className="oe-driving-list oe-numbered-driving-list">
          <li>Turn your head to look over your right shoulder and check through the backseat rear-window for pedestrians, bicyclists, motorcyclists and other vehicles that may become a hazard.</li>
          <li>Use your vehicle&apos;s interior rearview mirror to help keep an eye on hazards behind your vehicle.</li>
          <li>Signal your intentions to move from your parking space into traffic.</li>
          <li>Check your vehicle&apos;s side view mirrors, especially on the driver&apos;s side, for approaching vehicles, pedestrians, bicyclists, in-line skaters, motorcyclists and other highway users.</li>
          <li>Turn your head to look over your left shoulder out through the backseat rear-window, and begin to slowly drive forward, making sure you can enter traffic without hitting the vehicle parked ahead.</li>
          <li>Again turn your head and look over your left shoulder to re-check through the backseat rear-window and pull out into the traffic lane only when it is safe to do so.</li>
        </ol>
      </section>

      <ThreePointTurnInstructions />
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

function ThreePointTurnInstructions() {
  const steps = [
    'Activate your right turn signal. This will alert other drivers that you intend to "do something". Assuming that there are not any driveways, this should alert the cars behind you know that you intend to stop. Tap your brakes to further alert drivers that you intend to stop.',
    'Pull over as close to the curb as you can (approximately 6-10 inches) and stop.',
    'Activate your left turn signal.',
    'Check traffic in all directions to make sure that it is clear for at least 15-20 seconds in both directions. If there are drivers behind you, you can motion to them to go around you.',
    'Turn your wheel as far to the left as possible and begin moving forward. Your goal is to end up perpendicular to the curb on the other side of the street. You should be 6-10 inches from the curb.',
    'Activate your right turn signal (as this is the direction you\'ll be backing).',
    'Recheck traffic flow to make sure it is still clear to reverse. Although your car is probably blocking all traffic, that doesn\'t mean another car hasn\'t pulled up directly behind your vehicle.',
    'Turn your wheel as far to the right as possible.',
    'Shift into reverse and begin backing.',
    'Stop within 6-12 inches of the other curb.',
    'Recheck traffic again to make sure it is clear.',
    'Put your car into Drive and continue in your new direction.',
  ]

  return (
    <section className="oe-driving-section">
      <h4>How to Make a Three-Point Turn</h4>
      <ol className="oe-driving-list oe-numbered-driving-list oe-three-point-list">
        {steps.map(step => <li key={step}>{step}</li>)}
      </ol>
    </section>
  )
}

export function ChapterSixTestLesson({ onStart }) {
  return (
    <article className="oe-full-lesson oe-test-lesson oe-chapter-four-test oe-chapter-six-test">
      <h3>6.7 Chapter 6</h3>
      <section className="oe-chapter-four-test-card">
        <p><strong>Congratulations!</strong> You have completed the reading for chapter 6. You&apos;ll need to get 9 answers correct (out of 12) in order to proceed. <strong>Good luck!</strong></p>
        <button className="oe-chapter-four-test-start" type="button" onClick={onStart} aria-label="Start here and return to Chapter 6">
          <img src="/start.png" alt="Start Here" />
        </button>
        <img className="oe-chapter-four-quiz-image" src="/quize.png" alt="Chapter 6 quiz illustration" />
      </section>
    </article>
  )
}
