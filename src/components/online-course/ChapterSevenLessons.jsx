function LessonHeader({ title, onPrevious, onNext }) {
  return <div className="oe-lesson-heading-row"><h3 className="oe-chapter-kicker">{title}</h3><div className="oe-mini-nav" aria-label="Lesson navigation"><button type="button" onClick={onPrevious} aria-label="Previous lesson">&#9664;</button><button type="button" onClick={onNext} aria-label="Next lesson">&#9654;</button></div></div>
}

function LessonFooter({ onPrevious, onNext }) {
  return <div className="oe-bottom-nav"><button type="button" onClick={onPrevious}>&larr; Previous</button><button type="button" onClick={onNext}>Next &rarr;</button></div>
}

export function ChapterSevenOverview({ lessons, onSelectLesson, onBegin }) {
  return (
    <article className="oe-chapter-seven-overview">
      <h3 className="oe-chapter-kicker">Chapter 7: Sharing The Road And Accident Prevention</h3>
      <img className="oe-chapter-seven-image" src="/share.png" alt="Share the road with motorists, bicyclists and pedestrians" />
      <p>Drivers of all ages must be concerned with traffic laws, courtesy and safety. As a driver, you must be constantly aware that you share the road with a variety of road traffic and vehicles such as commercial trucks, emergency vehicles, motorcycles, mopeds, bicyclists and pedestrians. Safe driving involves more than just learning the basics of operating a vehicle and memorizing the rules of the road. It also requires good judgment and reflexes, experience, patience and common sense.</p>
      <nav className="oe-chapter-seven-lessons" aria-label="Chapter 7 lessons">{lessons.map((lesson, index) => <button type="button" onClick={() => onSelectLesson(index)} key={lesson}><span>7.{index + 1}</span><strong>{lesson}</strong><span aria-hidden="true">&rarr;</span></button>)}</nav>
      <div className="oe-start-wrap"><button className="oe-start" type="button" onClick={onBegin}>Begin Lesson</button></div>
    </article>
  )
}

export function SharingRoadTipsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-sharing-road-lesson">
      <LessonHeader title="7.1 Tips for Sharing the Road When Driving" onPrevious={onPrevious} onNext={onNext} />
      <img className="oe-sharing-hero" src="/tips1.png" alt="Share the road because every life counts" />
      <section className="oe-copy-section"><ul>
        <li>Be alert and use extra care when sharing the road with pedestrians, bicycles, motorcycles and other vehicles. Some vehicles are small and hard to see. Also be extra aware when children are present because their movements can be unpredictable.</li>
        <li>Watch for commercial vehicles that make frequent stops. Allow more following distance.</li>
        <li>Check your vehicle mirrors and look over your shoulder for approaching traffic when pulling into traffic from curbside parking or driveways.</li>
        <li>Be alert, listen and watch for road and traffic signs when driving in the roadway.</li>
      </ul></section>

      <section className="oe-copy-section oe-sharing-section">
        <h4>Sharing the Road with Pedestrians</h4>
        <p>As a driver, watch out and always yield the right-of-way to people walking, jogging, biking, crossing the street and especially for pedestrians darting from between parked vehicles.</p>
        <div className="oe-sharing-media"><img src="/tips2.png" alt="Watch for pedestrians sign" /><ul>
          <li>Watch for them when entering a street from a driveway or alley, at stop signs, traffic signals, roundabouts, crosswalks and intersections.</li>
          <li>Take extra care when people with disabilities are crossing the road.</li>
          <li>Be on high alert for children entering the street when you are driving near schools, playgrounds or residential neighborhoods.</li>
        </ul></div>
        <div className="oe-sharing-media"><img src="/tips3.png" alt="Pedestrian countdown signal" /><p>After a traffic light turns green, yield to people crossing the street and for vehicles that may still be turning in front of you or crossing the intersection. Even when traffic lights or crosswalks are not present, drivers must still yield the right-of-way to a pedestrian crossing the roadway. Never attempt to pass any vehicle that has stopped to allow a pedestrian to cross.</p></div>
        <ul>
          <li>Drivers must take every possible precaution to avoid a collision with pedestrians.</li>
          <li>Motorists should be aware that pedestrians are likely to cross in the middle of the block, whether or not a crosswalk is present. Mid-block crosswalks provide pedestrians with safe crossing along roadways at places other than intersections. A yield line is sometimes used to indicate the location where drivers should stop for pedestrians in the crosswalk.</li>
        </ul>
        <div className="oe-sharing-media"><img src="/tips4.png" alt="Pedestrians, joggers and bicyclists sharing a city street" /><ul>
          <li>When there are no sidewalks, pedestrians should walk on the side of the road facing oncoming traffic. Parents should teach their children this practice. However, drivers must watch for pedestrians.</li>
          <li>Drivers must be alert for joggers running along roadways. Joggers should wear reflective clothing, use sidewalks or roadway shoulders and avoid jogging at night, dawn, dusk or during bad weather. Joggers, like other pedestrians, should be on the side of the road facing oncoming traffic.</li>
        </ul></div>
      </section>
      <section className="oe-copy-section oe-sharing-section">
        <h4>Sharing the Road with Emergency Vehicles</h4>
        <div className="oe-emergency-images"><img src="/tips6.png" alt="Ambulance" /><img src="/tips5.png" alt="Fire truck and police vehicle" /></div>
        <p>Yield the right-of-way to an emergency vehicle that is displaying flashing warning lights, sounding a siren or any other audible warning sounds that are approaching from any direction of the roadway. These emergency vehicles can be ambulances, fire department and police vehicles.</p>
        <p><strong>When you see a stopped emergency vehicle:</strong></p>
        <ul><li>Slow down and move over a lane if possible.</li><li>If traffic or other conditions prevent you from changing lanes, you must slow down and proceed with due caution.</li></ul>
        <p><strong>When an emergency vehicle is approaching:</strong></p>
        <ul>
          <li>Pull over to the edge of the roadway, clear of intersections and stop.</li><li>Remain there until the emergency vehicle has passed.</li>
          <li>Keep your foot on the brake so the brake lights let emergency vehicle drivers know you have stopped.</li>
          <li>Stay at least 500 feet behind any moving emergency vehicle displaying flashing warning lights and/or sounding a siren.</li>
          <li>Never pass a moving emergency vehicle displaying flashing warning lights unless directed to do so by the emergency vehicle driver or a law enforcement officer.</li>
        </ul>
      </section>

      <section className="oe-copy-section oe-sharing-section">
        <h4>Sharing the Road with Commercial Vehicles</h4>
        <div className="oe-sharing-media"><img src="/tips7.png" alt="Commercial trucks sharing a freeway" /><p>When a commercial vehicle such as a truck or a bus collides with smaller vehicles, people in the smaller vehicles are much more likely to be severely injured or killed.</p></div>
        <p>Motorists should understand the following about commercial vehicles:</p>
        <ul>
          <li>Commercial vehicle drivers cannot stop or maneuver their vehicles as easily as a passenger vehicle. They take longer to stop. A passenger vehicle traveling at 55 mph can stop in about 130 feet to 140 feet. A commercial vehicle traveling at the same speed takes 400 feet to stop.</li>
          <li>Although trucks are equipped with up to eight mirrors, it is still easy for a car to be in their blind spot. When following a truck you should keep a safe distance behind the vehicle. If you cannot see the truck&apos;s mirrors, the truck driver cannot see you.</li>
        </ul>
        <img className="oe-sharing-wide-image" src="/tips8.png" alt="Commercial truck blind spots" />
        <ul>
          <li>Commercial vehicle drivers may not be able to see vehicles alongside or close behind their commercial vehicles. Commercial vehicles have deep blind spots behind them and on both sides. Stay out of their blind spots.</li>
          <li>Commercial vehicles need room to make right turns. They may swing wide to the left to safely negotiate a right turn. When you see a commercial vehicle with its right turn signal on at an intersection, know that the truck is going to make a wide right turn. Do not try to pass on the right-hand side or you might get squeezed between the truck and the curb. Stay behind trucks making right turns.</li>
        </ul>
        <p><strong>Vehicle size and weight do not cause crashes - drivers do.</strong></p><p>Remember to:</p>
        <ul>
          <li>Keep a safe distance behind a truck or bus. Following a commercial vehicle too closely greatly increases the chances of a rear-end collision. When your passenger vehicle is right behind a commercial vehicle, it will severely limit what you can see on the road ahead. Note: Extend the distance between your vehicle and a commercial vehicle as weather or road conditions deteriorate.</li>
          <li>The longer you drive in the blind spots of commercial vehicles, the greater the chances for a crash. A good rule of thumb is if you cannot see the commercial vehicle driver in the truck&apos;s side mirror then the driver cannot see you.</li>
          <li>When following a commercial vehicle, observe its turn signals before trying to pass. Cutting in between a commercial vehicle and the curb or shoulder to the right may result in a crash. If the commercial vehicle appears to be starting a left turn, wait and verify which way the driver is signaling before passing on the right.</li>
          <li>Signal intended lane changes or turns well in advance. Never cut off a truck or bus and force it to slow down or stop suddenly.</li>
          <li>Avoid passing or driving adjacent to larger vehicles in a roundabout.</li>
          <li>Always pass commercial vehicles legally on the left side and maintain a consistent speed when passing. Be sure you can see the entire cab of the truck in your rearview mirror before signaling and pulling in front of the commercial vehicle.</li>
          <li>Never cross behind a commercial vehicle that is preparing to back up or is backing up. Remember, most trailers are eight and a half feet wide and can hide a car completely, preventing the truck driver from even seeing your vehicle.</li>
          <li>Always stay behind white stopping lines. White stopping lines are there for a reason. If you stop past the line, commercial vehicles will not be able to complete their turns without hitting you.</li>
          <li>When merging onto the freeway, commercial vehicles may not be able to move over, so match the flow of traffic as closely as possible, pick your spot and proceed.</li>
          <li>When exiting the freeway, leave space between you and the vehicle behind you. Plan your move early and always signal your intentions as soon as possible.</li>
          <li>At night, use low beam headlights when following a truck or bus.</li>
        </ul>
      </section>
      <section className="oe-copy-section oe-sharing-section">
        <h4>Sharing the Road with Motorcycles</h4>
        <div className="oe-sharing-media"><img src="/tips9.png" alt="Motorcyclist on the road" /><p>Always treat motorcycle operators with courtesy. Leave plenty of extra space between your vehicle and a motorcycle ahead. Motorcycles may suddenly swerve to avoid obstacles.</p></div>
        <ul>
          <li>Pass as you would another vehicle, but not so fast or so close that your tires throw dirt or stones into the rider&apos;s face.</li>
          <li>Before changing lanes, check to see if a motorcycle is in the space where you plan to move. After you pass, look again before you move back into the other lane.</li>
          <li>Many motorcycle-vehicle crashes happen when drivers fail to check their blind spots before turning, changing lanes, backing up or parking.</li>
          <li>When at intersections, watch for oncoming motorcycles and other small vehicles. Their smaller size makes it difficult to judge their distance and speed. Always exercise caution at intersections and allow motorcycles or other small vehicles to clear the intersection before beginning your turn.</li>
          <li>The single headlight or taillight of a motorcycle can blend into the lights of other vehicles. A single light in traffic may mean a motorcycle.</li>
          <li>When making left turns, be alert for possible oncoming motorcycles.</li>
          <li>Watch for clues such as motorcycle operators or passengers turning their heads to look behind or motorcycle operators beginning to lean or tilt their vehicles.</li>
          <li>When coming up behind a motorcycle, slow down sooner than you would for other vehicles. Leave plenty of space.</li>
          <li>When pulling out of a side street, remember that an oncoming motorcycle is probably much closer and coming much faster than it appears.</li>
        </ul>
        <h4>Electric Bicycle Classes</h4>
        <p>Three classes of electric bicycles have been created. All operators of a Class 3 maximum speed of 28 miles per hour (mph) electric bicycle must be 16 years old or older and are required to wear a bicycle helmet. There is no financial responsibility, DL, registration, or license plate requirement for these electric bicycles.</p>
        <h4>Motorcycle Lane Splitting</h4>
        <p>The California Highway Patrol (CHP) has been authorized to begin developing educational guidelines relating to lane splitting and will consult with specified agencies and organizations with an interest in road safety and motorcyclist behavior.</p>
      </section>

      <section className="oe-copy-section oe-sharing-section">
        <h4>Sharing the Road with Bicycles</h4>
        <div className="oe-sharing-media"><img src="/tips10.png" alt="Bicyclist riding alongside vehicles" /><p>Bicycling is a form of transportation that many people choose to use for both economic and health benefits. Respect their right-of-way and share the road with bicyclists. Both bicyclists and drivers need to share the responsibility for avoiding conflicts and collisions by communicating their intentions while using the road.</p></div>
        <p><strong>Bicycle Reflector</strong> Bicycles operated during darkness upon a highway or a sidewalk must be equipped with a red reflector or a solid or flashing red light with a built-in reflector on the rear.</p>
      </section>
      <div className="oe-video-wrap oe-sharing-video"><iframe src="https://www.youtube.com/embed/Q07YbSdahL4" title="Scanning - Rules of the Road" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function AccidentOverviewLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-accident-overview-lesson">
      <LessonHeader title="7.2 Causes of Accidents Overview" onPrevious={onPrevious} onNext={onNext} />
      <section className="oe-copy-section oe-accident-intro">
        <p>Traffic collisions are one of the top five causes of death in the United States. Although some collisions are unavoidable, defensive driving decreases the chances for these to occur. Drivers need to be aware of the different factors that increase the risk of collisions.</p>
        <h4>Increase Accident Report-ability Threshold</h4>
        <p>The minimum damage threshold for collision report-ability has increased from $750 to $1,000. A driver of a motor vehicle involved in a collision with property damages greater than $1,000 must submit a Report of Traffic Accident Occurring in California (SR 1) to DMV. DMV is authorized to impose sanctions following an uninsured reportable collision.</p>
      </section>
      <img className="oe-accident-image" src="/accident.png" alt="Illustration of damaged vehicles after traffic collisions" />
      <section className="oe-copy-section oe-accident-statistics">
        <h4>According to the DMV statistics:</h4>
        <ul>
          <li>There are between 450,000 and 500,000 traffic accidents reported annually in California alone. About 60% of these accidents involve property damage only, 39% involve injury to a passenger, driver or pedestrian and about 1% result in death.</li>
          <li>One person is killed every two and a half hours in California and one person is injured every 2 minutes as a result of a traffic collision.</li>
          <li>Although drivers under 30 years of age account for only about 23% of licensed drivers, they comprise about 35% of all drivers in fatal and injury collisions.</li>
          <li>Teenage drivers have four times higher collision rates than adults. Traffic collisions are the leading cause of death for teenagers.</li>
        </ul>
      </section>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}
