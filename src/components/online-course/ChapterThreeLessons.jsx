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
