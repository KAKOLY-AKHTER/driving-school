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

export function ConstructionAutomobileLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-construction-lesson">
      <LessonHeader title="5.1 Construction of the Automobile" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-construction-section oe-frame-section">
        <h4>Frame and Body</h4>
        <p>The purpose of a vehicle&apos;s frame is to support the body, engine and other components. The frame along with the body is largely responsible for the structural integrity of the vehicle. The wheels and tires through the vehicle&apos;s suspension system support the frame itself.</p>
      </section>

      <section className="oe-construction-section">
        <h4>Engine</h4>
        <p>When you start your car:</p>
        <ul className="oe-construction-list">
          <li>The power from your battery is used to activate the starter motor.</li>
          <li>The starter motor turns the flywheel and crankshaft of the engine so that the engine can attain sufficient momentum and speed to start and run on its own</li>
        </ul>
        <img className="oe-engine-diagram compact" src="/engine.png" alt="Crankshaft" />
        <ul className="oe-construction-list">
          <li>The crankshaft is inside your engine and it supplies power to the remainder of the power train. The crankshaft is connected by connecting rods to pistons inside cylinders.</li>
        </ul>
        <img className="oe-engine-diagram compact" src="/engine1.png" alt="A typical piston and connecting rod" />
        <ul className="oe-construction-list">
          <li>Gas inside the cylinders drives the pistons up and down and through the connecting rods and turns the crankshaft</li>
          <li>Inside the cylinders, a mixture of gas and air is compressed, ignited by the spark plug. The mixture of air and gas is delivered to the cylinders by the carburetor or fuel injection system. Oil is then delivered to all the vehicle&apos;s moving parts to be lubricated. There are several engine types, which are identified by the number of cylinders and the way the cylinders are laid out. Each cylinder contains a piston that travels up and down inside the cylinder bore. All the pistons in the engine are connected through individual connecting rods to a common crankshaft.</li>
        </ul>
      </section>

      <section className="oe-construction-section oe-fuel-section">
        <h4>Fuel and Air</h4>
        <p>The function of the fuel system is to store and supply fuel to the cylinder chamber where it can be mixed with air, vaporized and burned to produce energy. The fuel, which can be either gasoline or diesel, is stored in a fuel tank. A fuel pump draws the fuel from the tank through fuel lines and delivers it through a fuel filter to either a carburetor or fuel injector and then delivered to the cylinder chamber for combustion.</p>

        <div className="oe-construction-subsection">
          <h5>Gasoline</h5>
          <p>Gasoline is a complex blend of carbon and hydrogen compounds. Additives are added to improve performance. All gasoline is basically the same, but no two blends are identical. The two most important features of gasoline are volatility and resistance to knock (octane).</p>
          <ul className="oe-construction-list">
            <li>Volatility is a measurement of how easily the fuel vaporizes.</li>
            <li>Resistance to knock or octane is simply the temperature at which the gas will burn.</li>
          </ul>
        </div>

        <div className="oe-construction-subsection">
          <h5>Diesel</h5>
          <p>Diesel fuel, like gasoline is a complex blend of carbon and hydrogen compounds. It too requires additives for maximum performance. Standard diesel fuel (sometimes called diesel oil) comes in two grades: Diesel #1 (or 1-D) and Diesel #2 (or 2-D). The higher the cetane number, the more volatile the fuel. Most diesel vehicles use fuel with a rating of 40 to 55. You won&apos;t have to worry about which type to use because all diesel automakers specify Diesel #2 for normal driving conditions. Truckers use Diesel #2 to carry heavy loads for long distances at sustained speeds because it&apos;s less volatile than Diesel #1 and provides greater fuel economy. Diesel fuel also is measured by its viscosity. Like any oil, diesel fuel gets thicker and cloudier at lower temperatures. Under extreme conditions, it can become a gel and refuse to flow at all. Diesel #1 flows more easily than Diesel #2, so it&apos;s more efficient at lower temperatures . The two types of oil can be blended, and most service stations offer diesel fuel blended for local weather conditions. 2D fuels are used in warmer weather and are sometimes mixed with 1D fuel to create a competent winter fuel.</p>
        </div>

        <div className="oe-construction-subsection">
          <h5>Fuel Tank</h5>
          <p>The Fuel tank is used to store the gas. All tanks have a fuel filler pipe and a fuel outlet line to the engine and a vent system. The catalytic converter cars are equipped with contains a filler pipe restrictor so that leaded fuel, which is dispensed from a thicker nozzle, cannot be introduced into the fuel system. All fuel tanks must be vented</p>
        </div>

        <div className="oe-construction-subsection">
          <h5>Fuel Lines</h5>
          <ul className="oe-construction-list">
            <li>Steel lines and flexible hoses delete carry the fuel from the tank to the engine. When servicing or replacing the steel lines, steel must be used. Copper or aluminum must never be used.</li>
            <li>When replacing flexible rubber hoses, proper hose must be used. Ordinary rubber such as that used in vacuum or water hose will soften and deteriorate. Be cautious to route all hoses away from the exhaust system.</li>
          </ul>
        </div>

        <div className="oe-construction-subsection">
          <h5>Fuel Pumps</h5>
          <ul className="oe-construction-list">
            <li>There are two types of fuel pumps used in automobiles:</li>
            <li>Mechanical</li>
            <li>Most carbureted cars use mechanical fuel pumps. Mechanical fuel pumps are diaphragm pumps, mounted on the engine and operated by an eccentric cam usually on the camshaft. A rocker arm attached to the eccentric moves up and down flexing the diaphragm and pumping the fuel to the engine. Mechanical pumps operate on pressures of 4-6 psi (pounds per square inch).</li>
            <li>Electric</li>
            <li>All fuel-injected cars today use electric fuel pumps. Electric pumps do not depend on an eccentric for operation. They can be located anywhere on the vehicle but they work best when located near the fuel tank. Electric pumps can operate on pressures of 30-40 psi.</li>
          </ul>
        </div>

        <aside className="oe-construction-note"><strong>Note:</strong> These pumps look identical, so be careful when replacing a fuel pump. Make sure that the proper one is used. Fuel pumps are rated by pressure and volume. When checking fuel pump operation, both specifications must be checked and met.</aside>

        <div className="oe-construction-subsection">
          <h5>Fuel Filters</h5>
          <ul className="oe-construction-list">
            <li>The fuel filter is the key to a properly functioning fuel delivery system. This applies more with fuel injection than with carbureted cars. Fuel injectors are more susceptible to damage from dirt. When the filter clogs, the electric fuel pump works so hard to push fuel past the filter that it burns itself up.</li>
            <li>Most cars use two filters. One inside the gas tank and one in a line to the fuel injectors or carburetor.
              <p className="oe-inline-note"><strong>Note:</strong> Unless some severe and unusual condition occurs to cause a large amount of dirt to enter the gas tank, it is only necessary to replace the filter in the line.</p>
            </li>
          </ul>
        </div>
      </section>

      <section className="oe-construction-section">
        <h4>Vehicle Power Train</h4>
        <p>A vehicle&apos;s power train consists of components that generate and transmit power to the wheels.</p>
        <ul className="oe-construction-list">
          <li>In a rear-wheel drive vehicle, the power train includes:
            <ul>
              <li>The engine which generates the force which is transmitted</li>
              <li>The transmission in which gears adjust the engine&apos;s RPM so as to control the torque or force which is transmitted</li>
              <li>A clutch (automatic or manual) which disengages the transmission from the engine to allow changing gears</li>
              <li>The drive shaft that transmits forces from the transmission to the components at the rear of the vehicle. These include the differential which allows the back wheels to turn at different speeds so as to maintain traction and the axle delete which transmits the force from the differential to the rear wheels.</li>
            </ul>
          </li>
          <li>In a front-wheel drive vehicle, the power is transmitted from the engine through the combination of transmission-differential and then directly to the front wheels.</li>
          <li>In a four-wheel drive vehicle, the power is transmitted from the transmission to the transfer case that transmits power to either the rear wheels only or to both the rear and front wheels.</li>
        </ul>
      </section>

      <section className="oe-construction-section">
        <h4>Vehicle Exhaust</h4>
        <p>After the gas explodes in the cylinders of the engine it is released into one or more exhaust manifolds and collect into one stream of spent gases from all the cylinders. The gasses are then passed through a catalytic converter that chemically reduces the quantity of harmful pollutants and eventually passes by exhaust pipes through the muffler and resonator that reduce the noise from the explosion of gas in the engine. The gasses are then moved to the tailpipe which vents the hot gases away from the vehicle so that they will not collect underneath it.</p>
      </section>

      <section className="oe-construction-section">
        <h4>Vehicle Cooling System</h4>
        <p>The heat caused by the friction of moving engine parts and the explosion of gasoline in the cylinders is removed through the vehicle&apos;s cooling system. The coolant flowing through the passages inside the engine absorbs the heat. The coolant is a mixture of water and chemicals that protect the cooling system from corrosion lubricate the water pump and prevent engine from freezing. The coolant is largely stored in the radiator whose main purpose is to transfer the heat from the coolant to the outside environment (air) while it is being circulated by the water pump. The radiator is cooled by air flowing through it as you drive and by the radiator fan. Most radiators have a recovery tank, which is used to capture coolant as it expands due to heat and return it to the radiator when it cools. In order to allow the engine to quickly heat up to proper running temperature, the flow of coolant is controlled by heat sensing valve called a thermostat.</p>
        <img className="oe-engine-diagram cooling" src="/engine3.png" alt="Vehicle cooling system" />
      </section>

      <section className="oe-construction-section">
        <h4>Vehicle Electrical System</h4>
        <ul className="oe-construction-list">
          <li>The battery is your vehicle&apos;s primary source of electrical power. When you turn your ignition switch to start your car, electricity is used to close another switch called a solenoid that transmits the large amount of current needed to turn the starter motor. Once your engine is running, power is generated by the alternator, which also keeps your battery charged. The voltage regulator controls the amount of electricity that is generated. The distributor and coil generate and deliver the very high voltage electricity needed by the individual spark plugs of your engine</li>
          <li>Electricity is distributed throughout your vehicle by various electrical circuits for lighting, operation of electrical motors, computers that control various functions, and radio, interior cooling, heating and ventilation system. The fuses are to disable a circuit that is drawing too much current to prevent a fire and protect the components that the circuit serves.</li>
        </ul>
      </section>

      <section className="oe-construction-section">
        <h4>Suspension</h4>
        <ul className="oe-construction-list">
          <li>The purpose of your vehicle&apos;s suspension system is to:
            <ul>
              <li>Connect the wheels to the frame and body.</li>
              <li>Keep the movement of your wheels from being transmitted fully to the body. This allows the driver to maintain control of the car in turns and on rough roads. It also makes riding in the car more comfortable.</li>
            </ul>
          </li>
          <li>The up and down movement of the wheels is absorbed by the springs in the suspension system. Shock absorbers keep the springs from continuously bouncing.</li>
          <li>There are different designs for suspension systems involving various linkages, struts, joints and torsion bars.</li>
        </ul>
      </section>

      <section className="oe-construction-section oe-brakes-section">
        <h4>Brakes</h4>
        <div className="oe-brake-intro">
          <img src="/engine4.png" alt="Vehicle brake assembly" />
          <p>The purpose of brakes is to allow the driver to slow down or stop the vehicle,upon pressing down on the brake pedal. The brakes must be in top working condition, so that in an emergency the driver is able to stop completely without incident. The brake pads need to be maintained by repairing or replacing them since they get the most wear.</p>
        </div>
        <ul className="oe-construction-list">
          <li>There are two independent braking systems in your vehicle:</li>
          <li>Service brakes are used to slow your vehicle while you are driving.</li>
          <li>Parking brake (also referred to as the emergency brake) can also be used to slow your vehicle in an emergency, but is mainly used to hold your vehicle in one place while stopped or parked.</li>
          <li>When you press your brake pedal, a piston in your master cylinder forces brake fluid through hydraulic lines to pistons in the wheel cylinders at the wheels.</li>
        </ul>

        <p>There are two types of brakes:</p>
        <ul className="oe-construction-list">
          <li>Drum brakes slow your vehicle by the friction of a brake shoe pushing against the drum that is rotating with the wheel.</li>
          <li>Disk brakes slow your car by the friction of a caliper pressing against a disc that is rotating with the wheel.</li>
        </ul>

        <aside className="oe-brake-tip">
          <img src="/tipe.png" alt="Tip" />
          <p>Both drum and disk brakes convert friction force to heat and if the brakes get too hot, they cease to work because they cannot dissipate enough heat. For both types of brakes, your stopping distance time is roughly proportional to the square of your speed, so if you double your speed you quadruple the distance to stop your car.</p>
        </aside>

        <ul className="oe-construction-list">
          <li>When you are stopped and apply your brakes, they lock. It is the friction force between the tires and the road that keeps you from moving. Brakes will only slow your car while there is friction between the moving parts of your brakes.
            <ul>
              <li>If the wheels are locked, as in the case of a skid, the drums or discs are not moving and there will be no friction.</li>
              <li>The purpose of antilock brake systems is to prevent the brakes from becoming locked by first sensing if they are locked and then automatically and rapidly releasing and applying pressure.</li>
              <li>If you do not have antilock brakes, you can avoid having your brakes lock by manually and rapidly releasing and then reapplying pressure to your brake pedal.</li>
            </ul>
          </li>
          <li>The parking brake uses a cable rather than a hydraulic system to engage your brakes or clamp down on your drive shaft and will therefore function even if your service brakes have failed.</li>
        </ul>

        <div className="oe-more-information">
          <img src="/more.png" alt="Tell Me More" />
          <p>Click for more information about <strong>&quot;How Antilock Brake Systems Work&quot;</strong></p>
        </div>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}
