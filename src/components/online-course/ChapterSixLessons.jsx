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
