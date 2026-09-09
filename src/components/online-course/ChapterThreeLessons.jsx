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

export function GravityLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-gravity-lesson">
      <LessonHeader title="3.1 Gravity" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-gravity-intro">
        <p><strong>Gravity</strong> is the force that pulls objects toward the center of the earth. It also affects a vehicle&apos;s speed when traveling uphill or downhill.</p>
        <h4>The Force of Gravity</h4>
        <p>Automobiles are equipped with safety systems that help drivers counteract the effects of gravity. Lower gears can help control a vehicle when driving on steep hills.</p>
      </section>

      <section className="oe-copy-section oe-gravity-section">
        <h4>Uphill</h4>
        <div className="oe-gravity-media-row">
          <img src="/uphil.png" alt="Vehicle traveling uphill" />
          <p>When you drive uphill, gravity works against the vehicle and slows it down. You may need to accelerate gradually or select a lower gear to maintain a safe, steady speed.</p>
        </div>

        <h4>Downhill</h4>
        <div className="oe-gravity-media-row oe-downhill-row">
          <img src="/downhill.png" alt="Steep downhill warning sign" />
          <p>When you drive downhill, gravity causes the vehicle to gain speed and increases stopping distance. Select a lower gear before a steep descent and brake smoothly as needed to maintain a safe speed and full control.</p>
        </div>
      </section>

      <section className="oe-copy-section oe-hill-parking-section">
        <img className="oe-hill-parking-diagram" src="/road.png" alt="Wheel positions for downhill, uphill, and no-curb hill parking" />
        <h4>Parking on a Hill</h4>
        <p>When parking on a hill, the vehicle could roll if equipment fails. Always set the parking brake and leave an automatic vehicle in Park or a manual vehicle in the proper gear.</p>
        <ul>
          <li><strong>Sloping driveway:</strong> Turn the wheels so the vehicle cannot roll into the street, leave it in Park or in gear, and set the parking brake.</li>
          <li><strong>Facing downhill:</strong> Turn the front wheels into the curb or toward the right side of the road.</li>
          <li><strong>Facing uphill with a curb:</strong> Turn the front wheels away from the curb and allow the vehicle to roll back gently until the wheel touches the curb.</li>
          <li><strong>Uphill or downhill without a curb:</strong> Turn the wheels to the right so the vehicle will roll away from the center of the road if the brakes fail.</li>
        </ul>
      </section>

      <section className="oe-copy-section oe-incline-equipment-section">
        <h4>Using Gears, Brakes, and Wheel Blocks on Inclines</h4>
        <p>Use the correct parking techniques whenever you stop on an incline. An improperly secured vehicle can roll away and create a serious hazard.</p>

        <h5>Gears</h5>
        <div className="oe-incline-media-row">
          <img src="/gears.png" alt="Manual transmission gear selector" />
          <ul>
            <li>Leave a manual-transmission vehicle in the appropriate gear for the direction of the incline.</li>
            <li>When facing downhill, use reverse gear.</li>
            <li>When facing uphill, use first gear.</li>
            <li>Always set the parking brake and position the wheels correctly.</li>
          </ul>
        </div>
        <div className="oe-incline-media-row">
          <img src="/breaks.png" alt="Automatic transmission gear selector" />
          <ul>
            <li>Leave an automatic-transmission vehicle in the Park position.</li>
            <li>Set the parking brake and position the wheels for the direction of the hill.</li>
          </ul>
        </div>

        <h5>Brakes</h5>
        <div className="oe-incline-media-row oe-incline-media-wide">
          <img src="/wheel1.png" alt="Vehicle parking brake" />
          <p>Use the parking or emergency brake whenever you park on an incline. Apply it fully so the vehicle remains securely in place. Never depend on the transmission alone to prevent a vehicle from rolling.</p>
        </div>

        <h5>Wheel Blocks</h5>
        <div className="oe-incline-media-row oe-incline-media-wide">
          <img src="/wheel2.png" alt="Wheel chocks used to secure a parked vehicle" />
          <p>If a vehicle may not remain safely parked on an incline, use properly rated wheel chocks. They provide additional protection for heavy vehicles or loads, but do not replace correct wheel positioning and use of the parking brake.</p>
        </div>
      </section>

      <aside className="oe-gravity-tip">
        <img src="/tipe.png" alt="Safety tip" />
        <p>What goes up must come down. Gravity pulls a vehicle down an incline just as it pulls a ball down a hill. Use the vehicle&apos;s gears, brakes, wheel position, and other safety equipment to maintain control.</p>
      </aside>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function InertiaEnergyLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-inertia-lesson">
      <LessonHeader title="3.2 Inertia and Energy" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-inertia-intro">
        <p>The law of inertia states that an object in motion tends to remain in motion, while an object at rest tends to remain at rest, unless another force acts on it.</p>
        <p>While driving, inertia keeps a vehicle moving until a force—such as the brakes, road friction, a fixed object, or another vehicle—changes its motion.</p>
        <p>During a sudden stop, occupants and unsecured objects continue moving forward. Loose items can become dangerous projectiles, so secure cargo and make sure everyone is properly restrained.</p>
      </section>

      <section className="oe-copy-section oe-seatbelt-section">
        <h4>Counteracting Inertia&apos;s Effects with Seat Belts</h4>
        <div className="oe-seatbelt-media">
          <img src="/buckling.png" alt="Buckle up and wear a seat belt" />
          <p>Safety belts help prevent or limit injuries caused by inertia. If a driver brakes suddenly or a collision occurs, an unrestrained body continues moving forward. A correctly fastened seat belt holds the driver and passengers securely in position and spreads crash forces across the stronger parts of the body.</p>
        </div>
      </section>

      <div className="oe-video-wrap oe-inertia-video">
        <iframe
          src="https://www.youtube.com/embed/2XKOzibVqJg"
          title="Understanding car crashes and Newton's First Law"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <section className="oe-energy-definitions" aria-label="Energy definitions">
        <article>
          <h4>Potential Energy</h4>
          <p>Potential energy is stored energy related to an object&apos;s position or condition. A vehicle at the top of a hill has gravitational potential energy that can become motion as it travels downhill.</p>
        </article>
        <article>
          <h4>Kinetic Energy</h4>
          <p>Kinetic energy is the energy of motion. A moving vehicle continues moving until forces such as braking friction, road resistance, or a collision slow or stop it.</p>
        </article>
      </section>

      <section className="oe-copy-section oe-kinetic-section">
        <h4>Effects of Kinetic Energy on Driving</h4>
        <ul>
          <li><strong>Speed has a major effect:</strong> doubling speed quadruples kinetic energy. Under similar conditions, braking distance increases approximately with the square of speed.</li>
          <li>Gravity reduces a vehicle&apos;s speed as it travels uphill. A lower gear may be needed to maintain steady, controlled movement.</li>
          <li>Gravity increases speed downhill. Select a lower gear before a steep descent and use the brakes smoothly to keep the vehicle under control.</li>
          <li>Brakes slow a vehicle by using friction to convert kinetic energy into heat. Excessive or continuous braking can cause the brakes to overheat and lose effectiveness.</li>
          <li>Your total stopping distance includes perception distance, reaction distance, and braking distance. It grows rapidly as speed increases and is also affected by the road, weather, tires, brakes, and vehicle load.</li>
          <li>In a collision, kinetic energy is transferred into vehicle deformation, sound, heat, friction, and the motion of the objects involved.</li>
        </ul>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function MomentumFrictionLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-momentum-lesson">
      <LessonHeader title="3.3 Momentum and Friction" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-copy-section oe-momentum-section">
        <h4>Momentum</h4>
        <div className="oe-force-media-row oe-momentum-media">
          <img src="/momentum.png" alt="Vehicle moving at speed" />
          <div>
            <p>Momentum describes how difficult it is to stop a moving object. It depends on the object&apos;s mass and velocity: a heavier or faster vehicle has more momentum.</p>
            <ul>
              <li>Doubling speed doubles momentum when the vehicle&apos;s mass stays the same.</li>
              <li>Increasing speed from 10 mph to 50 mph increases momentum five times.</li>
              <li>A heavier vehicle has more momentum than a lighter vehicle traveling at the same speed.</li>
            </ul>
          </div>
        </div>
        <div className="oe-force-callout">
          <h5>Controlling momentum</h5>
          <p>During a controlled stop, the brakes, tires, road surface, aerodynamic drag, and engine braking work together to reduce the vehicle&apos;s momentum. In a collision, remaining motion is transferred through deformation, heat, sound, and movement of the objects involved.</p>
        </div>
      </section>

      <section className="oe-copy-section oe-friction-section">
        <h4>Friction</h4>
        <p>Friction is the resistance created when surfaces move—or try to move—against one another. Drivers depend on friction between the tires and roadway for accelerating, steering, and braking.</p>
        <div className="oe-friction-facts">
          <article>
            <h5>Friction changes with:</h5>
            <ul>
              <li>Tire tread, condition, and correct inflation</li>
              <li>Vehicle load and weight distribution</li>
              <li>Road material and surface condition</li>
              <li>Rain, snow, ice, oil, mud, sand, and debris</li>
            </ul>
          </article>
          <article>
            <h5>Friction occurs:</h5>
            <ul>
              <li>Between the tires and the road</li>
              <li>Inside the brakes when they are applied</li>
              <li>In moving engine and transmission components</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="oe-copy-section oe-roads-tires-section">
        <h4>Friction Effects on Roads and Tires</h4>
        <div className="oe-force-media-row">
          <img src="/tire.png" alt="Technician inspecting a tire" />
          <div>
            <p>Worn, damaged, overloaded, underinflated, or overinflated tires may reduce usable traction and make the vehicle harder to control.</p>
            <ul>
              <li>Check tire pressure when the tires are cold and follow the vehicle manufacturer&apos;s specification.</li>
              <li>Inspect tread and tire condition regularly.</li>
              <li>Slow down and leave more stopping space when the road is wet or slippery.</li>
              <li>Accelerate, steer, and brake smoothly to preserve available traction.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="oe-copy-section oe-braking-friction-section">
        <h4>Friction Effects on Braking</h4>
        <ul>
          <li>Brakes use friction to convert a vehicle&apos;s kinetic energy into heat. Long or repeated braking can overheat the brakes and reduce their effectiveness.</li>
          <li>Anti-lock braking systems help prevent wheel lock during hard braking so the driver can retain steering control. Follow the vehicle owner&apos;s manual for correct use.</li>
          <li>Loss of traction is less likely when you reduce speed early and use the brakes smoothly.</li>
        </ul>
        <div className="oe-force-media-row oe-skid-media">
          <img src="/barking.png" alt="Slippery roadway warning sign" />
          <p>A skid occurs when one or more tires lose traction. Road contamination, excessive speed, abrupt steering, or braking beyond the available grip can cause a skid.</p>
        </div>
      </section>

      <section className="oe-copy-section oe-components-friction-section">
        <h4>Friction Effects on Vehicle Components</h4>
        <div className="oe-force-media-row oe-components-media">
          <div>
            <ul>
              <li>Release a manual clutch smoothly; an abrupt release can cause wheelspin or loss of control.</li>
              <li>Do not ride the brakes or drive with the clutch partially engaged.</li>
              <li>Select a lower gear before a long downhill grade to reduce continuous brake use.</li>
              <li>Use the manufacturer-specified lubricants and service intervals to limit damaging friction and wear.</li>
            </ul>
          </div>
          <img src="/settings.png" alt="Gears representing moving vehicle components" />
        </div>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function CentrifugalForceLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-centrifugal-lesson">
      <LessonHeader title="3.4 Centrifugal Force" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-curve-intro">
        <p>When a vehicle follows a curve, tire traction supplies the inward <strong>centripetal force</strong> that changes its direction. The occupants feel an apparent outward pull—often called the centrifugal effect—because inertia tends to keep them moving in a straight line.</p>
      </section>

      <section className="oe-copy-section oe-turning-section">
        <h4>Forces Acting in a Turn</h4>
        <ul>
          <li>A vehicle&apos;s inertia resists the change from straight-line motion.</li>
          <li>Tire traction must provide enough inward force to keep the vehicle on the curved path.</li>
          <li>Higher speed, a tighter curve, or reduced traction makes maintaining the intended path more difficult.</li>
        </ul>
        <div className="oe-curve-media">
          <img src="/bike.png" alt="Motorcyclist leaning through a curve" />
          <div>
            <h5>Two-wheel vehicles</h5>
            <p>A bicyclist or motorcyclist leans into a turn to balance the forces acting on the vehicle. All road users, including car drivers, must enter curves at a safe speed and keep their movements smooth.</p>
            <h5>Managing the curve</h5>
            <p>Look well ahead, reduce speed before entering, maintain a steady lane position, and accelerate gently only after the curve begins to open. Never exceed a posted advisory speed.</p>
          </div>
        </div>
      </section>

      <section className="oe-copy-section oe-curve-safety-section">
        <h4>Slow Down Before Entering a Curve</h4>
        <p>Complete most braking before the turn. Braking or steering abruptly in a curve asks the tires to provide more grip and can cause a skid, especially on wet, icy, sandy, or oily pavement. If you must slow while turning, do so progressively and keep the vehicle balanced.</p>
        <div className="oe-curve-note">
          <strong>Remember:</strong> You must be able to stop within the distance you can see. Hills, sharp curves, weather, and surface conditions may require a much lower speed than the posted limit.
        </div>
      </section>

      <section className="oe-copy-section oe-impact-section">
        <h4>Factors That Determine Impact Severity</h4>
        <p>Crash severity rises rapidly with speed. Vehicle mass, direction of travel, angle of impact, restraint use, and the design of the vehicles and objects involved also influence the outcome.</p>
        <h5>Vehicle structure and crumple zones</h5>
        <ul>
          <li>Crumple zones deform in a controlled way to absorb energy and lengthen the time over which occupants slow down.</li>
          <li>The passenger compartment is designed to remain as intact as possible.</li>
          <li>Seat belts and airbags work with the vehicle structure; airbags are not a substitute for seat belts.</li>
        </ul>
      </section>

      <aside className="oe-true-false-card">
        <img src="/true.png" alt="True or false question" />
        <div>
          <h4>True or False?</h4>
          <p><strong>False:</strong> A relaxed, sleeping, or impaired occupant is not protected from crash forces. Never drive impaired or drowsy, and always wear a seat belt correctly. The safest crash is the one you prevent.</p>
        </div>
      </aside>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function ChapterThreeTestLesson({ onStart }) {
  return (
    <article className="oe-full-lesson oe-test-lesson">
      <div className="oe-test-title-row">
        <span>Chapter Assessment</span>
        <h3>3.5 Chapter 3</h3>
      </div>
      <section className="oe-test-card">
        <div className="oe-test-message">
          <h4>Congratulations!</h4>
          <p>You have completed the reading for Chapter 3. You&apos;ll need to get <strong>9 answers correct</strong> (out of 12) in order to proceed. <strong>Good luck!</strong></p>
        </div>
        <div className="oe-test-score"><strong>9 / 12</strong><span>Correct answers required</span></div>
        <button className="oe-test-start" type="button" onClick={onStart} aria-label="Start here and return to Chapter 3" aria-describedby="chapter-three-return-note">
          <img src="/start.png" alt="" aria-hidden="true" />
        </button>
        <img className="oe-quiz-image" src="/quize.png" alt="Chapter 3 quiz illustration" />
        <p className="oe-test-return-note" id="chapter-three-return-note">Select <button className="oe-test-return-link" type="button" onClick={onStart}>Start Here</button> to return to the Chapter 3 overview.</p>
      </section>
    </article>
  )
}
