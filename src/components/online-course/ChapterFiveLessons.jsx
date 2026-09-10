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

export function SteeringDashboardLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-dashboard-lesson">
      <LessonHeader title="5.2 The Steering Wheel and Dashboard" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-dashboard-section">
        <h4>The steering wheel</h4>
        <div className="oe-dashboard-media compact">
          <img src="/steer1.png" alt="Steering wheel" />
          <p>The steering wheel is a central device for the driver. The steering wheel is connected to and controls the wheels by the axle. By turning the steering wheel in a direction, what you are actually turning are the vehicle&apos;s wheels.</p>
        </div>
        <ul className="oe-dashboard-list">
          <li>The steering wheels in newer cars are usually powered. This means that the steering is much more sensitive and easier to handle. In older cars, this was not available and you are using a lot more muscle to turn the wheels.</li>
          <li>Always keep your hands on the steering wheel to keep the car positioned within your lane or roadway. To make a right turn or to maneuver a right curve, you must turn the steering wheel to the right and guide the vehicle to the degree of that right turn or angle. To make a left turn or to maneuver a left curve, you must turn the steering wheel to the left and guide the vehicle to the degree of that left angle.</li>
          <li>The left hand should be positioned at 9 o&apos;clock and the right hand should be positioned at 3 o&apos;clock of the steering wheel.</li>
        </ul>
      </section>

      <section className="oe-dashboard-section oe-gauges-intro">
        <h4>The Dashboard Gauges</h4>
        <aside className="oe-dashboard-note"><strong>Note:</strong><br />To find out more about the gauges on your car, the best source of information is your owner&apos;s manual.</aside>
        <ul className="oe-dashboard-list">
          <li>The most common configuration in today&apos;s car is: Speedometer, Tachometer, Fuel and Temperature.</li>
        </ul>
        <img className="oe-dashboard-wide-image" src="/watch1.png" alt="Vehicle dashboard gauges" />
      </section>

      <section className="oe-dashboard-section">
        <h4>Speedometer</h4>
        <p>The most used gauge. The speedometer consists of a cable that spins inside a flexible tube. The cable is connected on one side to the speedometer, and on the other side to the speedometer gear inside the transmission.</p>
        <img className="oe-dashboard-gauge-image" src="/watch2.png" alt="Speedometer" />
        <ul className="oe-dashboard-list">
          <li>The accuracy of the speedometer can be affected by the size of the tires. If the tires are larger in diameter than original equipment, the speedometer will read that you are going slower than you actually are.</li>
          <li>Another cause for inaccurate readings is the improper speedometer gear inside the transmission. This can sometimes happen after a replacement transmission has been installed. Legitimate transmission shops are aware of this and will make sure that the correct speedometer gear is the new transmission.</li>
        </ul>
      </section>

      <section className="oe-dashboard-section">
        <h4>Fuel Gauge</h4>
        <div className="oe-dashboard-media">
          <img src="/watch3.png" alt="Fuel gauge" />
          <p>A fuel gauge (or gas gauge) is an instrument used to indicate the level of fuel contained in a tank. When the needle drops below E, there is usually 1 or 2 gallons left in reserve. To find out for sure, pull out your owner&apos;s manual and find out how many gallons of gas your tank holds.</p>
        </div>
        <aside className="oe-dashboard-note"><strong>Note:</strong><br />It is not a good idea to let your tank drop below 1/4. This is because your fuel pump is submerged in fuel at the bottom of the tank. The liquid fuel helps to keep the fuel pump cool. If the fuel level goes too low and uncovers the pump, the pump will run hotter than normal. If you do this often enough, it can shorten the life of the fuel pump and eventually cause it to fail.</aside>
      </section>

      <section className="oe-dashboard-section">
        <h4>Temperature Gauge</h4>
        <div className="oe-dashboard-media">
          <img src="/watch4.png" alt="Temperature gauge" />
          <p>This gauge measures the temperature of the engine coolant in degrees. Paying attention to the car temperature gauge is vitally important when driving. You should check your temperature gauge frequently, just as you do with your other gauges.</p>
        </div>
        <ul className="oe-dashboard-list oe-dashboard-nested-list">
          <li><strong>Normal Range</strong>
            <ul>
              <li>When you look at your car temperature gauge, the needle should be in the center or just slightly below center (toward &quot;C&quot;). The temperature should be in that range any time you look at it.</li>
            </ul>
          </li>
          <li><strong>High Temperature</strong>
            <ul>
              <li>If the temperature gauge is suddenly high, there are several possible reasons. One is that you have lost coolant. This could mean a slow leak, or it could mean a gradual evaporation. It could also mean the thermostat is broken and is not opening as it should to let coolant into the engine. Another possible cause of a sudden temperature rise is the failure of the water pump or water pump gasket.</li>
            </ul>
          </li>
          <li><strong>Low Temperature</strong>
            <ul>
              <li>If the temperature is low and stays low, the thermostat is likely stuck open and is allowing a constant flow of coolant into the engine.</li>
            </ul>
          </li>
          <li><strong>Steps to Take</strong>
            <ul>
              <li>If the temperature gauge is running high, then you can immediately turn the heater on in the car. If it is hot outside, then roll the windows down as well and direct the air vents away from the passengers. This will cool the engine down quickly as you look for a place to pull over and check the water level.</li>
              <li>Never open a hot radiator. Instead, add water through the overflow tank if it is needed.</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="oe-dashboard-section">
        <h4>Tachometer</h4>
        <div className="oe-dashboard-media">
          <img src="/watch5.png" alt="Tachometer" />
          <p>The tachometer measures how fast the engine is turning in RPM (Revolutions Per Minute). This information is useful if the car has a standard shift transmission and you want to shift at the optimum RPM for best fuel economy or best acceleration. This is one of the least used gauges on a car with an automatic transmission.</p>
        </div>
        <aside className="oe-dashboard-tip">
          <img src="/tipe.png" alt="Tip" />
          <p>You should never race your engine so fast that the tachometer moves into the red zone as this can cause engine damage. Some engines are protected by the engine computer from going into the red zone. Usually, the tachometer shows single digit markings like 1, 2, 3. Somewhere, you will also see an indicator that says RPM x 1000. This means that you multiply the reading by 1000 to get the actual RPM, so if the needle is pointing to 2, the engine is running at 2000 RPM.</p>
        </aside>
      </section>

      <section className="oe-dashboard-section">
        <h4>Oil Pressure Gauge</h4>
        <div className="oe-dashboard-media oil">
          <img src="/watch6.png" alt="Oil pressure gauge" />
          <p>This gauge measures engine oil pressure in pounds per square inch. Oil pressure is just as important to an engine as blood pressure is to a person. If you run an engine with no oil pressure even for less than a minute, you can easily destroy the engine. Most cars have an oil lamp that lights when oil pressure is dangerously low. If it comes on while you&apos;re driving, stop the vehicle as soon as is safely possible and shut off the engine. Then, check the oil level and add oil as necessary.</p>
        </div>
      </section>

      <section className="oe-dashboard-section">
        <h4>Charging System Gauge</h4>
        <p>The charging system is what provides the electrical current for your vehicle. Without a charging system, your battery will be depleted and your vehicle will shut down. The charging system gauge or warning lamp monitors the health of this system so that you have a warning of a problem before you get stuck.</p>
        <p>There are two types of gauges used to monitor charging systems:</p>
        <ul className="oe-dashboard-list oe-dashboard-nested-list">
          <li><strong>Voltmeter</strong>
            <ul>
              <li>It measures system voltage. A modern automobile has a 12-volt electrical system. A fully charged battery will read about 12.5 volts when the engine is not running. When the engine is running, the charging system takes over so that the voltmeter will read 14 to 14.5 volts and should stay there unless there is a heavy load on the electrical system such as wipers, lights, heater and rear defogger all operating together while the engine is idling at which time the voltage may drop. If the voltage drops below 12.5, it means that the battery is providing some of the current. You may notice that your dash lights dim at this point. If this happens for an extended period, the battery will run down and may not have enough of a charge to start the car after shutting it off. This should never happen with a healthy charging system because as soon as you step on the gas, the charging system will recharge the battery. If the voltage is constantly below 14 volts, you should have the system checked. If the voltage ever goes above 15 volts, there is a problem with the voltage regulator. Have the system checked as soon as possible as this &quot;overcharging&quot; condition can cause damage to your electrical system.</li>
            </ul>
          </li>
          <li><strong>Ammeter</strong>
            <ul>
              <li>It measures amperage. If the battery is fully charged and there is minimal electrical demand, then the ammeter should read close to zero, but should always be on the positive side of zero. It is normal for the ammeter to read high positive amperage in order to recharge the battery after starting, but it should taper off in a few minutes. If it continues to read more than 10 or 20 amps even though the lights, wipers and other electrical devices are turned off, you may have a weak battery and should have it checked.</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="oe-dashboard-section">
        <h4>Emergency Flasher</h4>
        <p>The emergency flashers are usually located on the dashboard of the vehicle, labeled by a red and white emergency symbol.</p>
        <img className="oe-dashboard-gauge-image" src="/watch7.png" alt="Emergency flasher button" />
        <ul className="oe-dashboard-list">
          <li>The driver of a vehicle should only use these as a signal to an emergency situation. For instance - If the driver of a vehicle is having mechanical problems, physical health problems or there is an emergency situation on the roadway ahead.</li>
          <li>The driver should use the emergency flashers to warn the other drivers so that they can be prepared for any road conditions and slow down.</li>
        </ul>
      </section>

      <section className="oe-dashboard-section">
        <h4>Headlights</h4>
        <p>Every vehicle must be equipped with two headlamps one on each side of the front of the vehicle. All drivers must use their headlights 30 minutes AFTER sunset until 30 minutes BEFORE sunrise. If a driver is on the road during this time, the driver must turn on their headlights. The headlights are set up with low and high beam lights.</p>
        <img className="oe-dashboard-gauge-image" src="/watch8.png" alt="Vehicle headlights" />
        <ul className="oe-dashboard-list">
          <li>The <strong>low beam light</strong> is the standard light used to illuminate the driving surface and conditions. The low beam lights are used when driving under most normal conditions. They must be visible 500 feet in front of your vehicle.</li>
          <li>The <strong>high beam lights</strong> are only used when the driver&apos;s visibility is limited. This gives the driver a bigger picture of the driving conditions. In an effort not to blind or blur another driver, do not use your high beams when you are less than 300 feet behind another vehicle or 500 feet from an oncoming vehicle.</li>
        </ul>
      </section>

      <section className="oe-dashboard-section oe-brake-lights-section">
        <h4>Brake Lights</h4>
        <div className="oe-dashboard-media brake-lights">
          <img src="/watch9.png" alt="Vehicle brake lights" />
          <p>The brake lights are red lights that are on the back of each vehicle. Brake lights allow the driver to indicate a stop, slowing, or an emergency situation. As the driver of a vehicle presses down on the brake pedal, the rear brake lights will illuminate on the back of the car to indicate slowing or stopping. The brake pedal is the pedal in the center of the driver&apos;s floorboard.</p>
        </div>
        <div className="oe-dashboard-steps">
          <img src="/step.png" alt="Step by Step" />
          <div>
            <h5>How to use the car&apos;s braking system</h5>
            <ol>
              <li>For the driver to brake, the driver should release the right foot from the accelerator.</li>
              <li>Next, the driver moves their right foot onto the brake pedal and gently presses down.</li>
              <li>The rear brake lights will illuminate. This will warn drivers behind the braking vehicle that they are slowing, stopping or having an emergency.</li>
            </ol>
          </div>
        </div>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function WindshieldMirrorsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-mirrors-lesson">
      <LessonHeader title="5.3 The Windshield and Mirrors" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-mirror-section">
        <h4>Windshield</h4>
        <div className="oe-mirror-media windshield">
          <img src="/mirror1.png" alt="Windshield and windshield wiper" />
          <p>The windshield provides the driver&apos;s direct view of traffic and road conditions in front of the vehicle. The driver is positioned in the driver&apos;s seat to look out through the windshield. You must keep your windows clear , and without cracks. You are required by law to have a windshield in place, free of obstructions and without need of repair. If you have a crack or lines in the windshield glass you need to repair it immediately.</p>
        </div>
        <ul className="oe-mirror-list">
          <li>Windshields protect the vehicle&apos;s occupants from wind, temperature extremes, and flying debris such as dust, insects, and rocks. Properly installed automobile windshields are also essential to safety. UV Coating may be applied to screen out harmful ultraviolet light.</li>
          <li>Modern windshields are generally made of laminated safety glass that consists of two curved sheets of glass with a plastic layer laminated between them for safety and are glued into the window frame. This glued-in screen contributes to the vehicle&apos;s rigidity.</li>
          <li>In many places, laws restrict the use of heavily tinted glass in vehicle windshields. Generally, laws specify the maximum level of tint permitted. Note that there is noticeably more tint in the uppermost part of the windshield to help block glare from the sun.</li>
          <li>Today&apos;s windshields are a safety device just like seat belts and air bags. The installation of the auto glass is done with an automotive grade urethane designed specifically for automobiles. The adhesive creates a molecular bond between the glass and the vehicle. If the adhesive bond fails at any point on the glass it can reduce the effectiveness of the air bag and substantially compromise the structural integrity of the roof.</li>
        </ul>
        <aside className="oe-mirror-fact">
          <img src="/more.png" alt="Tell Me More" />
          <p>Mary Anderson is said to have invented the windshield wiper in the United States, where she patented the idea in 1905. The idea was initially met with resistance, but was a standard feature on all American cars by 1916.</p>
        </aside>
      </section>

      <section className="oe-mirror-section">
        <h4>Mirrors</h4>
        <p>Mirrors aid the driver in seeing on the sides and to the rear of the car.</p>

        <h5>Rear-view Mirror</h5>
        <div className="oe-mirror-media">
          <img src="/mirror2.png" alt="Rear-view mirror" />
          <p>A rear-view mirror is a mirror in automobiles and other vehicles designed to allow the driver to see rearward through the vehicle&apos;s backlight (rear windshield or windscreen). In cars, the rear-view mirror is usually affixed to the top of the windshield on a double-swivel mount allowing it to be adjusted to suit the height and viewing angle of any driver and to swing harmlessly out of the way if impacted by a vehicle occupant in a collision. The rear-view mirror is augmented by one or more side-view mirrors, which serve as the only rear-vision mirrors on motorcycles and bicycles.</p>
        </div>

        <h5>Side Mirrors</h5>
        <div className="oe-mirror-media">
          <img src="/mirror3.png" alt="Side-view mirror" />
          <p>The side view mirrors are located on the outside of the vehicle in a position so the driver is able to see to their sides and side rear of the vehicle. The driver will need to check the side mirrors while driving to see where the traffic and other vehicles are positioned. The driver shall check the appropriate mirror for the direction in which the driver intends to make their maneuver. Look right for a right maneuver; and look left for a left maneuver.</p>
        </div>

        <div className="oe-video-wrap oe-mirror-video">
          <iframe src="https://www.youtube.com/embed/da6BVQ1iERQ" title="The Safety Factor: Properly Adjusting Your Car Mirrors" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        </div>

        <aside className="oe-mirror-tip">
          <img src="/tipe.png" alt="Tip" />
          <p>Do not solely rely on the side view mirrors to give you the complete picture, since all cars have blind spots. The driver should also look over the appropriate shoulder before starting the maneuver.</p>
        </aside>
      </section>

      <section className="oe-mirror-section oe-mirror-space-section">
        <h4>Mirror Space Setting</h4>
        <div className="oe-mirror-diagrams">
          <img src="/mirror4.png" alt="Peripheral vision and mirror blind areas" />
          <img src="/mirror5.png" alt="Central space area and inside rear mirror view" />
        </div>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function CarSafetyEquipmentLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-safety-equipment-lesson">
      <LessonHeader title="5.4 Car Safety Equipment" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-safety-section">
        <h4>Seatbelts</h4>
        <div className="oe-safety-media seatbelt">
          <img src="/care1.png" alt="Driver fastening a seatbelt" />
          <p>The purpose of seatbelts and shoulder straps is to keep your body from hitting the steering wheel, windshield or other portions of the interior of your car in a crash. Safety belts are also effective in preventing total ejection from a car in a crash. If you are struck from the side in a collision, the impact could push you back and forth across the seat. Seatbelts help to keep you in a better position to control the vehicle.</p>
        </div>

        <div className="oe-video-wrap oe-safety-video">
          <iframe src="https://www.youtube.com/embed/A7YpHXPAk9g" title="Saved By the Belt: A Teen's Survival Story" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
        </div>

        <p>Safety belts can reduce injuries and deaths.</p>
        <p>Unrestrained occupants of a car keep moving during the time the car takes to stop due to inertia. They will still be moving forward at their original speed when they slam into the steering wheel, windshield or other part of the car. This force is equivalent to that of hitting the ground when falling from a three-story building. When hit from behind, inertia causes a person’s neck to bend backwards, which can result in whiplash.</p>
        <p>To be effective, seatbelts must be worn properly.</p>
        <ul className="oe-safety-list">
          <li>The shoulder belt should fit snugly against your body</li>
          <li>You should never wear the shoulder belt under your arm</li>
          <li>You should never wear a seatbelt that is twisted</li>
          <li>You should never be reclined in your seat when moving.</li>
        </ul>
        <p>Seat belts, both the lap belt and shoulder harness, must be in good working order. You may not operate your vehicle on public roads or on private property, such as parking lots, unless you and all of your passengers eight years of age or older or who are 4 feet 9 inches tall or taller, are wearing seatbelts.</p>

        <h5>Child Safety Seat Requirements</h5>
        <p>In addition to the existing child passenger restraint system laws, any child who is under 2 years old must be secured in a rear-facing child passenger restraint system unless the child is 40 pounds or more, or 3&apos;4&quot; or taller.</p>
        <p>Children younger than eight years old or who are less than 4 feet 9 inches tall are seated in a federally approved child passenger restraint system.</p>
        <p>You and your passengers must wear seat belts while your vehicle is moving on public roads and on private property, such as parking lots.</p>
        <p>If seat belts are not worn by any of your passengers, you and the passenger(s) can be cited. If the passenger is younger than 16 years of age, you will be cited if he or she is not wearing his or her seat belt.</p>
        <p>Always use your seat belts (including the shoulder harness) even if the vehicle is equipped with air bags. You can have shoulder harnesses or seat belts installed in older vehicles. Even if you wear only a lap belt when driving, your chances of living through a collision are twice as high as someone who does not wear a lap belt. If you wear a lap and shoulder belt, your chances are three to four times higher to live through a collision.</p>
        <p>Pregnant women should wear the lap belt as low as possible under the abdomen, and the shoulder strap should be placed between the breasts and to the side of the abdomen’s bulge.</p>
        <aside className="oe-safety-note"><strong>Note:</strong><br />Using seatbelts reduces the risk of being thrown from your vehicle in a collision. If you do not install and use a shoulder harness with the seat (lap) belt, serious or fatal injuries may happen in some crashes. Lap-only belts increase the chance of spinal column and abdominal injuries—especially in children. Shoulder harnesses may be available for your vehicle, if it is not already equipped with them.</aside>
      </section>

      <section className="oe-safety-section">
        <h4>Airbags</h4>
        <p>Air bags, combined with lap/shoulder safety belts offer the most effective safety protection available today for passenger vehicles. Air bags are designed to provide protection over and above what the seat belt provides. They are gas-inflated cushions built into the steering wheel, dashboard, door, roof or seat of your car that use a crash sensor to trigger a rapid expansion to protect you from the impact of an accident.</p>
        <img className="oe-safety-centered-image" src="/care2.png" alt="Deployed vehicle airbags" />
        <ul className="oe-safety-list oe-safety-nested-list">
          <li>For the maximum air bag protection
            <ul>
              <li>Sit back at least 10 inches from the steering wheel and dashboard.</li>
              <li>Always wear your seat belt properly.</li>
              <li>If your steering wheel tilts, direct it toward your chest, not your head.</li>
              <li>If you are pregnant, place the lap belt low on your abdomen with the shoulder portion over the collarbone.</li>
            </ul>
          </li>
          <li>Always seat children in the back seat when possible, even if there is no airbag in front of them.
            <ul>
              <li>Avoid putting children in the front seat of a car equipped with airbags.</li>
              <li>Children sitting in the front seat with an air bag could be severely injured by the airbag. Even when kids get older, riding in the back seat is safer.</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="oe-safety-section">
        <h4>Headlights</h4>
        <p>Headlights should be used:</p>
        <ul className="oe-safety-list">
          <li>When it is cloudy, raining, snowing or foggy</li>
          <li>On frosty mornings when windshields may be icy or foggy</li>
          <li>On country or mountain roads to make it easier for other drivers to see you</li>
          <li>Anytime you do not have enough light to see for at least 1000 feet</li>
          <li>Anytime it would help you see and be seen better</li>
          <li>No later than 30 minutes after sunset and until at least 30 minutes before sunrise.</li>
        </ul>
        <p>You should use your high-beam headlights whenever you are having trouble seeing with your normal headlights, except when it is raining, foggy, snowing, or when it may blind other drivers.</p>
        <p>You must:</p>
        <ul className="oe-safety-list">
          <li>Dim your high beams for oncoming vehicles by the time they are within 500 feet of your vehicle</li>
          <li>Dim your high beams when the vehicle you are following is within 300 feet.</li>
          <li>You may flash your headlights to get the attention of another driver so as to avoid an accident.</li>
        </ul>
      </section>

      <section className="oe-safety-section">
        <h4>Signaling Indicators</h4>
        <div className="oe-safety-media signaling">
          <img src="/care3.png" alt="Driver operating a signaling indicator" />
          <p>The signals are the lighting devices that allow you to inform other drivers on the roadway what your intentions are.</p>
        </div>
        <h5>Considerations to take:</h5>
        <ul className="oe-safety-list">
          <li>Do not assume that just because you have signaled a turn or lane change that others can or will leave you the space to complete it.</li>
          <li>You must signal even when you don&apos;t see any cars around.</li>
          <li>You should use both arm signals and signal lights if it is difficult for others to see your signal lights.</li>
          <li>You must signal before turning, changing lanes, or otherwise entering traffic from a side road or driveway.</li>
          <li>You should signal during the last 100 feet before turning unless traffic conditions indicate you should start signaling earlier, such as on a freeway where you should signal for at least 5 seconds before changing lanes.</li>
          <li>In addition to signaling the intention to make a turn, you must check your mirrors and blind spots to make sure it is safe to complete the maneuver.</li>
          <li>If you plan to turn as soon as you leave an intersection, do not start signaling while you are approaching or in the intersection. Wait until you have crossed the intersection so as not to confuse traffic.</li>
          <li>Make sure that your signal is turned off after you have completed your turn or lane change.</li>
        </ul>

        <h5>Hand Gestures</h5>
        <div className="oe-hand-gestures">
          <img src="/care5.png" alt="Driver using a hand gesture" />
          <div className="oe-hand-gesture-copy">
            <p>To indicate a right turn the driver should lower the driver&apos;s window and put their left arm out in an &quot;L&quot; shape. The arm should be straight out from the shoulder and bent up towards the sky from the elbow to the hand. This will inform the other drivers of the right turn.</p>
            <p>To indicate a left turn, the driver should completely extend the arm straight out. This will inform the other drivers on the road of your intentions.</p>
            <p>To indicate a stop or slowing down, the driver should extend the arm out straight from the shoulder, and at the elbow the arm should bend straight down towards the ground. This will allow other drivers to be prepared for your vehicle to slow or stop.</p>
          </div>
        </div>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}
