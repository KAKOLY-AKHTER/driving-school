function LessonHeader({ title, onPrevious, onNext }) {
  return <div className="oe-lesson-heading-row"><h3 className="oe-chapter-kicker">{title}</h3><div className="oe-mini-nav" aria-label="Lesson navigation"><button type="button" onClick={onPrevious} aria-label="Previous lesson">&#9664;</button><button type="button" onClick={onNext} aria-label="Next lesson">&#9654;</button></div></div>
}

function LessonFooter({ onPrevious, onNext }) {
  return <div className="oe-bottom-nav"><button type="button" onClick={onPrevious}>&larr; Previous</button><button type="button" onClick={onNext}>Next &rarr;</button></div>
}

function DrivingFactors() {
  return <><h5>Driving too fast</h5><ul><li>Speed is the primary factor in about 28% of fatal and injury collisions.</li><li>When you drive faster than is safe for current conditions, you have less time to react, it takes longer to stop, and a collision causes greater impact and injuries.</li></ul><p><strong>Note:</strong> The basic speed law requires a safe speed for weather, visibility, traffic and roadway conditions. Never drive faster than the posted limit; driving too slowly can also be unsafe.</p><h5>Improper turns</h5><ul><li>Making an illegal or otherwise improper turn is the primary collision factor in about 9% of fatal and injury collisions in California.</li><li>Make turns only when you can see that it is safe, signal 100 feet before the corner, look for pedestrians and bicyclists, yield to traffic already in the intersection, and look 10 to 15 seconds ahead.</li></ul><TurnDiagrams /><FinalFactors /></>
}

function TurnDiagrams() {
  return <div className="oe-turn-factor-content">
    <h5>Left Turns</h5><p>Left turns are much more dangerous than right turns because they require crossing opposing traffic. Judge the distance needed, proceed only when it is safe, use the proper lane, signal 100 feet before the junction, make a complete stop when required, and yield the right-of-way.</p>
    <h5>Right Turns</h5><ul><li>Watch for pedestrians and bicyclists. Check WALK and DO NOT WALK signals and never assume a pedestrian will not step off a curb.</li><li>Right on red is legal unless prohibited. Stop completely before the limit line and do not interfere with traffic moving on a green light.</li><li>Use a bike lane for a right turn only when it is clear and within 200 feet of the intersection.</li></ul>
    <h5>Left turn from a two-way street (#1)</h5><img className="oe-factor-image oe-factor-turn-image" src="/factor9.png" alt="Left and right turns from a two-way street" /><ul><li>Start the turn in the left lane closest to the middle of the street.</li><li>Complete the turn in either lane of the cross street, if safe.</li><li>Use the center left turn lane if there is one.</li><li>A left turn may be made from another lane if permitted by signs or arrows.</li></ul>
    <h5>Right turn (#2)</h5><ul><li>Begin and end the turn in the lane nearest the right-hand curb.</li><li>Do not swing wide into another lane.</li><li>Watch for bicyclists between your vehicle and the curb.</li><li>Signs or pavement markings may allow a right turn from another lane.</li></ul>
    <h5>Left turn from a two-way street into a one-way street (#3)</h5><img className="oe-factor-image oe-factor-turn-image" src="/factor10.png" alt="Turns numbered three and four" /><ul><li>Start the turn from the lane closest to the middle of the street.</li><li>Turn into any lane that is safely open, as shown by the arrows.</li></ul>
    <h5>Left turn from a one-way street into a two-way street (#4)</h5><ul><li>Start the turn from the far-left lane.</li><li>Turn into either lane that is safely open.</li></ul>
    <h5>Left turn from a one-way street into a one-way street (#5)</h5><ul><li>Start the turn from the far-left lane.</li><li>Watch for bicyclists between your vehicle and the curb.</li><li>Turn into any lane that is safely open.</li></ul>
    <h5>Right turn from a one-way street into a one-way street (#6)</h5><ul><li>Start the turn in the far-right lane.</li><li>If safe, you may end the turn in any lane.</li><li>Signs or pavement markings may allow a right turn from another lane.</li></ul><img className="oe-factor-image oe-factor-turn-image" src="/factor11.png" alt="Turns numbered five and six" />
    <h5>Turn at a T intersection from a one-way street into a two-way street (#7)</h5><ul><li>Through traffic has the right-of-way. You may turn either right or left from the center lane. Watch for vehicles and bicyclists inside your turn.</li></ul><img className="oe-factor-image oe-factor-turn-image" src="/factor12.png" alt="Turn at a T intersection" />
    <h5>Center Left Turn Lanes</h5><img className="oe-factor-image oe-factor-turn-image" src="/factor13.png" alt="Center left turn lane" /><ul><li>A center left turn lane is marked on both sides by two painted lines; the inner line is broken and the outer line is solid.</li><li>Use it to turn left or begin a permitted U-turn. You may drive only 200 feet in this lane.</li><li>Signal and drive completely inside the lane. Make sure it is clear in both directions and enter traffic only when safe.</li></ul>
    <h5>Simultaneous Turns</h5><ul><li>When two or more lanes turn in the same direction, remain in your proper lane from start to finish.</li><li>Opposing turn lanes may sometimes turn at the same time when their signals permit it.</li></ul>
    <h5>U-Turns</h5><p>A U-turn reverses direction on a roadway. Obey NO U-TURN signs, turn from the leftmost lane, yield to all traffic, and watch for drivers turning right while you complete the maneuver.</p>
  </div>
}

function FinalFactors() {
  return <div className="oe-final-factor-content">
    <h5>Improper lane changes</h5><img className="oe-factor-image oe-factor-image-medium" src="/factor14.png" alt="Improper lane change" /><ul><li>Improper lane changes are the primary collision factor in about 4% of fatal and injury accidents in California.</li><li>Signal, check your mirrors, turn your head and check the lane and blind spots before moving.</li><li>Yield to vehicles already in the lane. Never assume they will make room for you.</li><li>Avoid last-minute lane changes. Keep watching traffic ahead and behind while changing lanes.</li><li>Do not cross several lanes at once or cross solid white lines. Change one lane at a time.</li></ul>
    <h5>Failing to obey stop signals and signs</h5><img className="oe-factor-image oe-factor-image-large" src="/factor15.png" alt="Traffic signs and signals" /><ul><li>Failure to obey a stop sign or signal is the primary collision factor in about 9% of fatal and injury collisions in California.</li><li>Stop signs and red lights require a complete stop behind the limit line, crosswalk, or before the intersection.</li></ul><p><strong>Note:</strong> A complete stop lets your body move slightly forward and then backward. Intersections are common collision locations, and you should stop at a yellow signal if you can do so safely.</p>
    <h5>Failing to yield the right-of-way</h5><div className="oe-factor-media"><img src="/factor16.png" alt="Yield right-of-way sign" /><ul><li>Failure to yield the right-of-way to another vehicle or pedestrian is the primary collision factor in about 20% of fatal and injury collisions in California.</li><li>Never assume another driver will yield and never insist on taking the right-of-way. Yielding often helps avoid collisions.</li></ul></div>
    <h5>Driving on the wrong side of the road</h5><div className="oe-factor-media"><img src="/factor17.png" alt="Do not enter and wrong way signs" /><ul><li>Driving on the wrong side of the road is the primary collision factor in about 4% of fatal and injury collisions in California.</li><li>Wrong-side driving most often results in head-on crashes, among the most dangerous collisions.</li><li>Use pavement-line colors to identify direction. A yellow line on your right can indicate you are on the wrong side.</li><li>Look for WRONG WAY and DO NOT ENTER signs when turning into traffic.</li></ul></div>
  </div>
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

export function AccidentFactorsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-accident-factors-lesson">
      <LessonHeader title="7.3 Factors that Causes Accidents" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-factor-section">
        <h4>Physical Factors</h4>
        <div className="oe-factor-media oe-factor-media-small"><img src="/factor1.png" alt="Illness" /><div><strong>Illness can:</strong><ul><li>Impair a person&apos;s ability to transmit visual and auditory information to the brain.</li><li>Impair the ability of the brain to act on this information.</li><li>Impair a driver&apos;s ability to rapidly take corrective action during emergency situations.</li></ul></div></div>
        <div className="oe-factor-media oe-factor-media-reverse"><p>Certain prescription and over-the-counter <strong>medications</strong> taken for illnesses, even common cold medications, can cause the driver to become drowsy while driving. You should be very careful if you choose to drive when you are feeling ill. You are responsible for knowing the effects the medications you take have on your driving ability.</p><img src="/factor2.png" alt="Prescription and over-the-counter medications" /></div>
        <p><strong>If you are ill, stay home and rest. Do not drive on the roadway, especially if you are taking medications that cause drowsiness.</strong></p>
        <div className="oe-factor-media oe-factor-media-small"><img src="/factor3.png" alt="Fatigued person" /><div><p>Physical and mental <strong>fatigue</strong> also increases the likelihood of crashes by affecting your vision, judgment and reaction time.</p><ul><li>Falling asleep is the primary factor in about 1% of fatal and injury collisions in California.</li><li>Driving when you are tired is just as dangerous as driving when you have been drinking alcohol. When you are tired, you are less alert and may not see hazards early enough to react quickly. If you are tired, get off the road and get some sleep.</li></ul></div></div>
      </section>

      <section className="oe-factor-section">
        <h4>Psychological Factors</h4>
        <div className="oe-factor-media oe-factor-media-reverse"><div><p>Some psychological factors can also lead to accidents such as:</p><ul><li>Being emotionally distressed or tense</li><li>Being distracted by personal problems or environmental conditions inside and outside your vehicle</li><li>Having inadequate training and practice.</li></ul><p>Safe driving requires concentration. If you are preoccupied with your emotions, you will not be able to focus on the task of driving safely.</p></div><img src="/factor4.png" alt="Emotionally distressed driver" /></div>
        <h4>Environmental Distractions</h4>
        <img className="oe-factor-image oe-factor-image-pair" src="/factor5.png" alt="Drivers distracted inside their vehicles" />
        <p>Conditions inside of your vehicle can also cause you to drive unsafely. For example:</p><ul><li>Distracting passengers</li><li>Loud music</li><li>Doing other things while driving</li><li>Using cell phone</li></ul>
        <h4>Alcohol and Drugs</h4>
        <div className="oe-factor-media"><img src="/factor6.png" alt="Do not drink and drive" /><p>Alcohol and drugs are the primary collision factor in about 9% of fatal and injury accidents in California. Alcohol, illegal drugs, prescription drugs and over-the-counter medications can impair your vision, judgment and reaction time.</p></div>
      </section>

      <section className="oe-factor-section"><h4>Driver Behavior</h4><p><strong>The following are common driver behaviors that lead to collisions.</strong></p>
        <h5>Inattentiveness</h5><ul><li>You could find yourself involved in a collision when not keeping your eyes on the road or losing your concentration even for just a second. One second not looking at the road means one fewer second that you have to react to emergency situations.</li><li>To avoid being distracted while driving:<ul><li>Do not play your radio too loud.</li><li>Refrain from changing CDs or radio stations.</li><li>Plan your trips by mapping your destination and having enough travel time.</li><li>Refrain from using your cell phones or other digital devices.</li></ul></li></ul>
        <div className="oe-video-wrap oe-factor-video"><iframe src="https://www.youtube.com/embed/ZDvGdHqP9Co" title="Texting while driving causes car accidents" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>
        <h5>Poor visual scanning</h5><ul><li>When you drive, keep your eyes moving and look for potential hazards around your vehicle. Do not focus only on the back of the car ahead of you. Do not assume anything.</li><li>Scanning the roadside helps you to see:<ul><li>Vehicles and pedestrians that may be in the roadway by the time you reach them.</li><li>Warning signs for potential hazards ahead.</li><li>Signs that give you directions.</li></ul></li><li>Remember to keep your eyes moving. Be aware of your surroundings near and far. Turn your head before changing lanes to check your blind spots. Be prepared and watch for potential emergency situations. Be aware of traffic signs or any warning signs for upcoming road conditions.</li><li>Be aware of vehicles, pedestrians and objects around your vehicle when slowing down, merging, changing lanes, passing, or making a turn. Check your mirrors and blind spots before attempting any of these maneuvers. If you cannot see the roadway ahead because of a large vehicle, such as a truck or SUV, make sure to give yourself additional space in front of your vehicle so you can react in an emergency situation.</li></ul>
        <h5>Making poor decisions</h5>
        <p>Making a poor decision while driving can also result in an accident. Poor decisions can result from:</p>
        <ul><li>Not knowing the law</li><li>Disregarding the law</li><li>Taking unnecessary risks</li></ul>
        <h5>Inability to handle a vehicle in emergency situations</h5>
        <ul>
          <li>The key to becoming a safe driver is learning the appropriate ways to react to different emergency situations in a split second and making the appropriate decisions.</li>
          <li>Collisions happen because drivers do not expect and prepare for these situations and do not know how to properly react to them.</li>
          <li>The best ways to avoid a collision is to:<ul><li>Anticipate hazards</li><li>Be ready to respond</li><li>Know the handling characteristics and limitations of your car</li><li>Remain calm</li></ul></li>
          <li>Think before slamming on your brakes. It is not the best reaction to every driving emergency.</li>
        </ul>
        <h5>Skids</h5>
        <ul>
          <li>Not understanding how to handle your vehicle in emergency situations may result in skidding that can cause a crash. Skids occur whenever tires lose their grip on the road. Certain road and weather conditions are particularly likely to cause your vehicle to skid.</li>
          <li>Skids are caused by:<ul><li>Over-braking</li><li>Over-steering</li><li>Over-acceleration</li></ul></li>
          <li>Avoid driving too fast as it results in the need to over-brake and over-steer.</li>
          <li>The key to avoiding skids is to:<ul><li>Smoothly apply your brakes and accelerator</li><li>Turn slowly and smoothly</li></ul></li>
          <li>If your car starts to skid, immediately remove your foot from the gas pedal and turn into the skid.</li>
        </ul>
        <img className="oe-factor-image oe-factor-image-wide" src="/factor7.png" alt="How to steer through a skid" />
        <h5>Tailgating</h5>
        <img className="oe-factor-image oe-factor-image-medium" src="/factor8.png" alt="A vehicle following too closely" />
        <ul>
          <li>Tailgating is indicated as the primary collision factor in about 3% of all fatal and injury accidents in California.</li>
          <li>If you are following another vehicle too closely (tailgating), you will not be able to see hazards ahead of you as easily and you will have less time to stop or slow down in an emergency situation.</li>
          <li>Tailgating is particularly risky and dangerous on freeways because vehicles are usually traveling faster. In some instances, drivers slow down needlessly to look at broken down vehicles and other scenes, which is called rubbernecking. Rubbernecking and tailgating are a dangerous mix which leads to rear-end collisions.</li>
          <li>Best Practice: allow enough space in front of your vehicle to stop safely.<ul><li>You should always keep a minimum of a 3-second gap in front of your vehicle. Pick a fixed object on the roadway and count the seconds from when the vehicle ahead passes it until you reach it. If it is not at least 3 seconds, slow down and increase your following distance.</li></ul></li>
        </ul>
        <h5>Unsafe passing</h5>
        <ul><li>Be extra careful and aware when passing other vehicles on two-lane roads since passing will put you on the wrong side of the road.</li><li>Before attempting to pass, make sure passing is permitted, your view is clear, and there is enough space in oncoming traffic.</li><li>Passing several cars at one time is particularly dangerous.</li><li>If another driver wants to pass you, be courteous and let them do so. Do not speed up in passing lanes. Use turnout lanes when possible so that others may pass you safely.</li></ul>
        <DrivingFactors />
      </section>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function MechanicalFailureLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-mechanical-failure-lesson">
      <LessonHeader title="7.4 Mechanical Failure: Causes and Prevention" onPrevious={onPrevious} onNext={onNext} />
      <section className="oe-mechanical-intro">
        <img src="/failure.png" alt="Vehicle with an overheated engine" />
        <div><p>A significant number of collisions are caused by vehicle equipment failure such as:</p><ul><li>Bald or defective tires</li><li>Bad brakes</li><li>Inoperative lights</li><li>Degraded steering and suspension components.</li></ul></div>
      </section>
      <p>You should keep your vehicle in good working condition and perform routine maintenance to help avoid crashes caused by mechanical failure.</p>
      <p>You should know how to react to avoid crashes when it happens to you. The first thing to remember is to stay calm. You will be able to think more clearly and respond appropriately if you do not panic.</p>

      <section className="oe-mechanical-tip-row">
        <img src="/tipe.png" alt="Tip" />
        <div><h4>If your gas pedal is stuck down, you should:</h4><ul><li>Shift to neutral</li><li>Apply the brakes</li><li>Keep your eyes on the road to look for a way out</li><li>Warn other drivers by blinking and flashing your emergency lights</li><li>Try to drive the car safely off the road</li><li>Turn off your ignition when you no longer need to change direction and are stopped.</li><li>Turn on your emergency flashers.</li></ul></div>
      </section>
      <aside className="oe-mechanical-note"><strong>Note:</strong> Turning the ignition switch completely off while moving is never the correct response to an emergency situation. It may lock the steering wheel and you will be unable to steer the vehicle. Never turn your ignition off while your vehicle is still moving, no matter what sort of emergency situation you are experiencing.</aside>

      <section className="oe-mechanical-section">
        <h4>If you have a tire blowout or lose a wheel while driving, you should:</h4>
        <p>Hold the steering wheel tightly and steer straight ahead. Slow down gradually by taking your foot off the gas pedal slowly but without applying the brakes. Slow to a stop off the road and apply the brakes only when the car is almost stopped. Turn on your emergency flashers.</p>
      </section>
      <section className="oe-mechanical-section">
        <h4>If your brakes suddenly give out while driving, you should:</h4>
        <ul><li>Downshift to lower gear or lower range (automatic transmissions) to help slow your vehicle.</li><li>Pump the brake pedal fast and hard to build up brake fluid pressure. You will know in three to four pumps if the brakes will work. Do not pump the brakes on vehicles with antilock brakes.</li><li>Use your parking or emergency brake to gently slow your vehicle but release it before the vehicle starts to skid.</li><li>Steer and swerve to avoid a collision or steer into something soft like bushes.</li><li>Sound your horn and flash your lights to alert other drivers.</li><li>When you are stopped, turn off the ignition and turn on your emergency flashers.</li></ul>
      </section>
      <section className="oe-mechanical-section"><h4>If your brakes get wet and do not work <span>(such as after you travel through a big puddle):</span></h4><p>Dry them by lightly pressing the gas pedal and brake pedal at the same time so that the vehicle drives against the pressure of the brakes. Do this only until the brakes begin working.</p></section>
      <section className="oe-mechanical-section">
        <h4>If your vehicle&apos;s engine is running hot, you should:</h4>
        <ul><li>Turn off the air conditioner.</li><li>If you are in stop and go traffic change your route so that you can get air moving over the radiator.</li><li>Pull to the side of the road if you see steam.</li><li>Shut off the engine, turn on your emergency flashers, open the hood and wait 20 minutes before inspecting the radiator.</li><li>After 20 minutes, refill the radiator by pouring water or coolant into the overflow tank.</li><li>With the hood still up, inspect for leaks and call a tow truck if you cannot fix them.</li></ul>
      </section>
      <aside className="oe-mechanical-note"><strong>Note:</strong> Driving up on hills or mountains while using your air conditioning puts extra strain on your engine and may cause your vehicle to overheat. Use your air conditioning sparingly when driving up steep roads.</aside>
      <section className="oe-mechanical-section">
        <h4>If both of your headlights go out while driving at night, you should:</h4>
        <ul><li>First wiggle the dimmer switch, which will often put the lights back on.</li><li>If the lights do not come on, put on your parking lights, turn indicators or emergency flashers to warn other drivers.</li><li>Pull off the road as quickly as possible and leave the emergency flashers on.</li></ul>
      </section>
      <aside className="oe-mechanical-note"><strong>Note:</strong><ul><li>You might try checking your battery terminals or fuses to see if they are loose or blown.</li><li>Do not try driving at night with only your parking lights working or with no lights working. This is extremely dangerous even for only a short period. Also, do not attempt to use your high-beam headlights and keep driving. You will not be able to dim them for other vehicles on the roadway.</li></ul></aside>
      <section className="oe-mechanical-section">
        <h4>If your engine stalls while you are driving, you should:</h4>
        <ul><li>Turn on your emergency flashers immediately.</li><li>Move your vehicle to the side of the road as quickly and safely as possible. Also, realize that the steering wheel may take more force to turn because the power steering won&apos;t work.</li><li>Stop your vehicle. You may need more force on the brakes because power brakes will not work.</li><li>Turn on your emergency flashers.</li><li>Try to restart the engine. If the engine won&apos;t start, call for help. Do not try to restart your engine while you are still moving.</li></ul>
      </section>
      <section className="oe-mechanical-section">
        <h4>If your hood suddenly flies up while you are driving, you should:</h4>
        <ul><li>Slow down.</li><li>Try to look under the hood to see where you are going. If you cannot then put your head out the window to look around the hood and use the lane line markings as a guide.</li><li>Pull off the road as soon as is safely possible and put on your emergency flashers.</li></ul>
      </section>
      <div className="oe-more-emergency"><img src="/more.png" alt="Tell me more" /><strong>Other Emergency Situations that Cause Collisions</strong></div>
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
