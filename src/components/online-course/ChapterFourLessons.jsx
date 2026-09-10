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

const shapeSigns = [
  {
    image: '/stop.png',
    alt: 'Red octagonal stop sign',
    title: 'Octagon',
    description: 'The eight-sided octagon is reserved for STOP signs. Make a complete stop at the limit line, before the crosswalk, or before entering the intersection.',
  },
  {
    image: '/yield.png',
    alt: 'Inverted triangular yield sign',
    title: 'Downward-Pointing Triangle',
    description: 'The equilateral triangle pointing down is reserved for YIELD. Slow down and be ready to stop for vehicles, bicyclists, or pedestrians. Current U.S. YIELD signs use red and white.',
  },
  {
    image: '/circle.png',
    alt: 'Circular railroad advance-warning sign shape',
    title: 'Circle',
    description: 'A circular sign warns that a highway-rail grade crossing is ahead. Look and listen, reduce speed, and be prepared to stop.',
  },
  {
    image: '/cross.png',
    alt: 'Railroad crossing crossbuck sign',
    title: 'Crossbuck',
    description: 'The X-shaped crossbuck marks a highway-rail grade crossing. Yield to trains and cross only when the tracks are completely clear.',
  },
  {
    image: '/pentagoan.png',
    alt: 'Five-sided school sign shape',
    title: 'Pentagon',
    description: 'The five-sided pentagon identifies a school area or school crossing. Reduce speed, watch carefully for children, and obey crossing guards.',
  },
  {
    image: '/caution.png',
    alt: 'Yellow diamond-shaped caution sign',
    title: 'Diamond',
    description: 'Diamond-shaped signs warn of roadway conditions or hazards ahead, such as curves, merging traffic, intersections, or construction activity.',
  },
  {
    image: '/traingle.png',
    alt: 'Sideways pennant-shaped warning sign',
    title: 'Pennant',
    description: 'The sideways, elongated triangle marks the beginning of a NO PASSING ZONE. Do not begin passing until signs and pavement markings permit it.',
  },
  {
    image: '/rectangle.png',
    alt: 'Vertical rectangular speed limit sign',
    title: 'Vertical Rectangle',
    description: 'Vertical rectangles commonly communicate regulatory requirements, including speed limits, parking rules, and lane-use instructions.',
  },
  {
    image: '/square.png',
    alt: 'Square roadway service and parking signs',
    title: 'Square',
    description: 'Square signs may display regulatory, warning, or guide information. Their color and symbol tell you the specific instruction or service.',
  },
  {
    image: '/horizontal.png',
    alt: 'Horizontal rectangular divided-road guide sign',
    title: 'Horizontal Rectangle',
    description: 'Horizontal rectangles are widely used for guide, regulatory, and warning messages. Read the wording and follow the sign according to its color and context.',
  },
]

const colorGroups = [
  {
    color: 'Black and White',
    className: 'black',
    images: [
      { src: '/one-key.png', alt: 'Black and white ONE WAY sign beside a yellow railroad warning sign' },
    ],
    description: 'Black and white are commonly used for regulatory messages, route information, arrows, symbols, and sign legends. High contrast makes the instruction easy to recognize.',
  },
  {
    color: 'Red',
    className: 'red',
    images: [
      { src: '/wrong-way.png', alt: 'DO NOT ENTER, WRONG WAY, and STOP signs' },
    ],
    description: 'Red identifies stop, yield, prohibition, and wrong-way messages. Never enter when a DO NOT ENTER or WRONG WAY sign faces you.',
  },
  {
    color: 'Red Circle and Slash',
    className: 'red',
    images: [
      { src: '/red-line.png', alt: 'No parking sign with a red slash' },
      { src: '/cross-line.png', alt: 'No U-turn sign with a red slash' },
    ],
    description: 'A red circle with a diagonal slash means the pictured action is prohibited. The symbol inside shows what you must not do.',
  },
  {
    color: 'White and Blue Information',
    className: 'white',
    images: [
      { src: '/white.png', alt: 'White parking information sign' },
      { src: '/follow.png', alt: 'Transit stop directional sign' },
      { src: '/sit.png', alt: 'Accessible parking symbol' },
    ],
    description: 'White backgrounds commonly carry regulatory or route information. Blue panels identify road-user services and accessibility information.',
  },
  {
    color: 'Orange',
    className: 'orange',
    images: [
      { src: '/orange.png', alt: 'Orange signs and channelizing devices in a work zone' },
      { src: '/construction.png', alt: 'Orange ROAD CONSTRUCTION AHEAD sign' },
    ],
    description: 'Orange warns of temporary traffic-control, construction, and maintenance conditions. Slow down, expect workers or equipment, and follow all directions.',
  },
  {
    color: 'Yellow and Fluorescent Yellow-Green',
    className: 'yellow',
    images: [
      { src: '/caution.png', alt: 'Yellow caution warning sign' },
      { src: '/school.png', alt: 'Fluorescent yellow-green school warning sign' },
    ],
    description: 'Yellow warns of general road hazards. Fluorescent yellow-green highlights pedestrian, bicycle, playground, school, and school-bus warnings.',
  },
  {
    color: 'Brown',
    className: 'brown',
    images: [
      { src: '/brown.png', alt: 'Brown winter recreation and picnic-area guide signs' },
    ],
    description: 'Brown guide signs direct travelers to recreational, cultural, and historical destinations or points of interest.',
  },
  {
    color: 'Green',
    className: 'green',
    images: [
      { src: '/green.png', alt: 'Green freeway entrance guide sign' },
      { src: '/boardway.png', alt: 'Green Broadway street-name sign' },
    ],
    description: 'Green is used for guide information such as destinations, directions, distances, street names, and permitted movements.',
  },
  {
    color: 'Blue',
    className: 'blue',
    images: [
      { src: '/blue.png', alt: 'Blue traveler-services sign for food, fuel, and lodging' },
    ],
    description: 'Blue signs identify traveler services such as food, fuel, lodging, hospitals, accessibility facilities, and emergency information.',
  },
]

export function TrafficSignsShapesColorsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-signs-shapes-lesson">
      <LessonHeader title="4.1 Traffic Signs: Shapes and Colors" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-signs-intro">
        <p>Traffic signs use standardized shapes, colors, symbols, and words to communicate quickly. Recognizing these visual clues helps you identify whether a sign provides a <strong>regulation</strong>, <strong>warning</strong>, or <strong>guidance and information</strong>.</p>
      </section>

      <section className="oe-sign-learning-section" aria-labelledby="traffic-sign-shapes">
        <div className="oe-sign-section-title">
          <span>01</span>
          <div><p>Recognize the outline</p><h4 id="traffic-sign-shapes">Sign Shapes</h4></div>
        </div>
        <div className="oe-sign-shape-grid">
          {shapeSigns.map(sign => (
            <article className="oe-shape-card" key={sign.title}>
              <div className="oe-shape-image-wrap"><img src={sign.image} alt={sign.alt} /></div>
              <div><h5>{sign.title}</h5><p>{sign.description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="oe-sign-learning-section" aria-labelledby="traffic-sign-colors">
        <div className="oe-sign-section-title">
          <span>02</span>
          <div><p>Read the visual code</p><h4 id="traffic-sign-colors">Sign Colors</h4></div>
        </div>
        <div className="oe-sign-color-grid">
          {colorGroups.map(group => (
            <article className={`oe-color-card ${group.className}`} key={group.color}>
              <div className="oe-color-card-copy"><h5>{group.color}</h5><p>{group.description}</p></div>
              <div className="oe-color-images">
                {group.images.map(image => <img src={image.src} alt={image.alt} key={image.src} />)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="oe-sign-reminder">
        <strong>Driver reminder</strong>
        <p>Shape and color help you recognize a sign quickly, but you must read and obey the complete message. Always follow warning signs and temporary traffic-control directions.</p>
      </aside>

      <div className="oe-video-wrap oe-traffic-signs-video">
        <iframe
          src="https://www.youtube.com/embed/cYdZZdtdsMw"
          title="Traffic signs: rules of the road"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

const trafficSignalCards = [
  {
    image: '/light2.png',
    alt: 'Solid red traffic signal',
    title: 'Solid Red Light',
    tone: 'red',
    summary: 'Stop completely at the limit line, before the crosswalk, or before entering the intersection.',
    points: [
      'Remain stopped until the signal permits you to proceed.',
      'After a full stop, you may turn right when safe unless a NO TURN ON RED sign prohibits it. Yield to pedestrians, bicyclists, and traffic with the right-of-way.',
      'A red arrow means STOP. Do not turn in the arrow’s direction until a green signal or green arrow appears.',
    ],
  },
  {
    image: '/light3.png',
    alt: 'Solid yellow traffic signal',
    title: 'Solid Yellow Light',
    tone: 'yellow',
    summary: 'The signal is about to turn red. Stop if you can do so safely.',
    points: [
      'Do not speed up to beat the red light.',
      'If you cannot stop safely, continue cautiously through the intersection.',
      'Watch for pedestrians, bicyclists, and vehicles that may begin moving as the signal changes.',
    ],
  },
  {
    image: '/light4.png',
    alt: 'Yellow left-turn arrow signal',
    title: 'Yellow Arrow',
    tone: 'yellow',
    summary: 'The protected turning period is ending and the signal will change soon.',
    points: [
      'Stop if you can do so safely.',
      'If you are already in the intersection or cannot stop safely, complete the turn cautiously.',
      'Be prepared to obey the next green light, red light, or red arrow.',
    ],
  },
  {
    image: '/light5.png',
    alt: 'Solid green traffic signal over an intersection',
    title: 'Solid Green Light',
    tone: 'green',
    summary: 'Proceed only when the intersection is clear and it is safe to do so.',
    points: [
      'Yield to any vehicle, bicyclist, or pedestrian already in the intersection.',
      'When turning, yield to pedestrians and oncoming traffic as required.',
      'Do not enter if traffic prevents you from clearing the intersection before the signal changes.',
    ],
  },
  {
    image: '/light6.png',
    alt: 'Green directional arrow traffic signal',
    title: 'Green Arrow',
    tone: 'green',
    summary: 'Go in the direction of the arrow; opposing traffic is stopped for the protected movement.',
    points: [
      'Check that the intersection and crosswalk are clear before moving.',
      'Yield to any vehicle, bicyclist, or pedestrian still in the intersection.',
      'Stay in the lane controlled by the arrow and follow pavement markings.',
    ],
  },
]

export function TrafficControlSignsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-traffic-control-lesson">
      <LessonHeader title="4.2 Traffic Control Signs" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-traffic-control-intro">
        <img src="/traffic-light1.png" alt="Standard red, yellow, and green traffic signal" />
        <div>
          <h4>Traffic Signals Regulate Movement</h4>
          <p>Traffic signals are installed at intersections, crossings, freeway entrances, and other locations to regulate the movement of motorists, bicyclists, and pedestrians.</p>
          <p>Most standard signals display red at the top, yellow in the middle, and green at the bottom. Always obey the illuminated color or arrow and check that the path is clear before entering.</p>
        </div>
      </section>

      <section className="oe-copy-section oe-morgan-section">
        <h4>An Important Traffic-Signal Innovator</h4>
        <div className="oe-morgan-media">
          <img src="/morgan.png" alt="Portrait of inventor Garrett Augustus Morgan" />
          <div>
            <h5>Garrett Augustus Morgan</h5>
            <p>Garrett Morgan was an American inventor, entrepreneur, and public-safety advocate. In 1923, he received a U.S. patent for an improved traffic signal with STOP and GO positions plus an intermediate all-stop position that could clear an intersection before traffic changed direction.</p>
            <p>His design was one important step in the development of modern traffic-control systems. Morgan also patented a safety hood and used it during the 1916 Cleveland tunnel disaster rescue.</p>
          </div>
        </div>
      </section>

      <section className="oe-signal-learning-section" aria-labelledby="traffic-light-signals">
        <div className="oe-signal-title-row">
          <span aria-hidden="true">01</span>
          <div><p>Understand every indication</p><h4 id="traffic-light-signals">Traffic Light Signals</h4></div>
        </div>
        <div className="oe-signal-card-list">
          {trafficSignalCards.map(signal => (
            <article className={`oe-signal-card ${signal.tone}`} key={signal.title}>
              <div className="oe-signal-image-wrap"><img src={signal.image} alt={signal.alt} /></div>
              <div>
                <h5>{signal.title}</h5>
                <p className="oe-signal-summary">{signal.summary}</p>
                <ul>{signal.points.map(point => <li key={point}>{point}</li>)}</ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="oe-copy-section oe-uturn-control-section">
        <h4>U-Turn Controls</h4>
        <div className="oe-uturn-media">
          <img src="/u-turn.png" alt="U TURN OK lane-control sign" />
          <div>
            <p>A U TURN OK sign identifies a location or lane where a U-turn may be made when it is otherwise legal and safe. Signal, use the designated lane, and yield as required.</p>
            <p>When an arrow-shaped signal controls a U-turn lane, obey the red, yellow, and green indications in the same way as other directional arrows.</p>
          </div>
          <img src="/u-turn1.png" alt="U-turn warning sign" />
        </div>
      </section>

      <section className="oe-copy-section oe-special-signal-section">
        <h4>Flashing and Inoperative Signals</h4>
        <div className="oe-special-signal-grid">
          <article><strong>Flashing red</strong><p>Stop completely. Proceed only when it is safe and right-of-way rules allow.</p></article>
          <article><strong>Flashing yellow</strong><p>Slow down, stay alert, and proceed with caution. A full stop is not required unless traffic conditions demand it.</p></article>
          <article><strong>Flashing yellow arrow</strong><p>The turn is permitted but not protected. Yield to oncoming traffic, bicyclists, and pedestrians before turning.</p></article>
          <article><strong>Signal not working</strong><p>Stop as if the intersection has STOP signs in all directions, then proceed cautiously when safe.</p></article>
        </div>
      </section>

      <section className="oe-copy-section oe-enforcement-section">
        <h4>Automated Enforcement and Ramp Signals</h4>
        <div className="oe-enforcement-media">
          <img src="/collect-img.png" alt="Examples of photo-enforced traffic-control signs" />
          <div>
            <p>Some intersections or other controlled locations use automated enforcement. Signs may identify camera enforcement, but every driver must obey the signal whether or not a camera is present.</p>
            <p>Ramp-meter signals regulate how vehicles enter a freeway. Stop on red and proceed on green according to the posted sign, including any instruction about the number of vehicles allowed per green.</p>
          </div>
        </div>
      </section>

      <section className="oe-copy-section oe-designated-lanes-section">
        <h4>Designated Lanes</h4>
        <div className="oe-designated-lanes-media">
          <img src="/lanes.png" alt="Lane arrows for left, straight, and right movements" />
          <div>
            <p>Lane-control signs and pavement arrows assign traffic movements through an intersection. Position your vehicle early and follow the arrow for your lane.</p>
            <ul>
              <li>Do not make a turn from a lane marked for straight-through traffic only.</li>
              <li>Do not change lanes abruptly inside the intersection.</li>
              <li>Yield to pedestrians and bicyclists before completing a permitted turn.</li>
            </ul>
          </div>
        </div>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

const regulatorySignCards = [
  {
    image: '/stop.png',
    alt: 'Red octagonal STOP sign',
    title: 'Stop Sign is white on red and its shape is octagon.',
    tone: 'red',
    points: [
      'This sign means that you must make a complete stop before entering a crosswalk, passing the limit line or entering the intersection.',
      'If no crosswalk or limit line is marked, you must stop at the corner.',
      'You must give the right-of-way to all vehicles and pedestrians who arrived before you at the intersection or who are currently in the intersection.',
      'On divided highways, a STOP sign for crossing or turning vehicles is often placed on the island or dividing strip. You must also stop for these signs.',
    ],
  },
  {
    image: '/yield.png',
    alt: 'Triangular YIELD sign',
    tone: 'red',
    description: 'This sign means that you must slow down and be ready to stop and let other traffic (including pedestrians and bicycles) have the right-of-way before you continue driving.',
  },
  {
    image: '/do-not.png',
    alt: 'DO NOT ENTER sign',
    tone: 'red',
    description: 'The DO NOT ENTER sign tells you that there is danger ahead because vehicles will be coming toward you. It is usually found on a freeway off ramp.',
  },
  {
    image: '/wrong.png',
    alt: 'WRONG WAY sign',
    tone: 'red',
    description: 'The WRONG WAY sign tells you that you are traveling the opposite direction of traffic in the lane. This sign are often placed together with the DO NOT ENTER sign or on freeway on and off ramps. If you see either of these signs drive to the side of the road and stop. When safe, back out or turn around and go back to the road you were originally on.',
  },
  {
    image: '/one-way.png',
    alt: 'Black and white ONE WAY sign',
    tone: 'blue',
    description: 'This sign means that traffic on the road travels only in the direction that the arrow is pointing.',
  },
  {
    image: '/turn.png',
    alt: 'No right turn, no left turn, and no U-turn signs',
    title: 'No Right Turn, No Left Turn, No U Turn',
    tone: 'red',
    description: 'The driver must obey these signs. These signs are square in shape. With an additional horizontal rectangle sign, attached to the bottom of the square sign. This area is usually is where the words are displayed of what the driver should not do.',
  },
]

const warningSignCards = [
  {
    image: '/plus.png',
    alt: 'Yellow crossroad warning sign',
    description: 'A diamond yellow sign with a big black "+", this tells a driver that another road will intersect with their road. Warning to be cautious of traffic pulling out or crossing the road',
  },
  {
    image: '/dimond.png',
    alt: 'Yellow traffic signal ahead warning sign',
    description: 'A diamond yellow sign, which depicts a traffic light on it, tells the driver that there is a traffic signal ahead. Prepare to stop.',
  },
  {
    image: '/arrow1.png',
    alt: 'Yellow merge warning sign',
    description: 'A diamond yellow sign with an arrow going one way and another line going through an arrow, tells the driver that another lane of traffic will be merging with their lane.',
  },
  {
    image: '/arrow2.png',
    alt: 'Yellow two-way traffic warning sign',
    description: 'A diamond yellow sign that depicts two straight arrows, one pointing up and one pointing down, inform the driver of TWO WAY TRAFFIC ahead. (Sometimes this sign may have the words stated below the diamond on the sign, on a horizontal rectangle sign.)',
  },
  {
    image: '/arrow3.png',
    alt: 'Yellow divided highway ends warning sign',
    description: 'A diamond yellow sign that says END DIVIDED ROAD, indicates that the median or wall will end and that the lanes will be directly opposing each other.',
  },
]

export function TrafficRegulatorySignsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-regulatory-signs-lesson">
      <LessonHeader title="4.3 Traffic Regulatory Signs" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-regulatory-intro">
        <div>
          <p>Regulatory signs inform the drivers of important roadway rules that they must obey. These signs include warning of potential dangers, directions, information and services. All drivers must be aware of what all of the colors and symbols mean in order to make responsible and quick decisions.</p>
        </div>
        <img src="/road-sign.png" alt="Collection of regulatory, warning, construction, and guide signs" />
      </section>

      <section className="oe-regulatory-section" aria-labelledby="regulatory-signs-heading">
        <h4 className="oe-visually-hidden" id="regulatory-signs-heading">Regulatory Signs</h4>
        <div className="oe-regulatory-card-list">
          {regulatorySignCards.map(sign => (
            <article className={`oe-regulatory-card ${sign.tone}`} key={sign.image}>
              <div className="oe-regulatory-image-wrap"><img src={sign.image} alt={sign.alt} /></div>
              <div>
                {sign.title && <h5>{sign.title}</h5>}
                {sign.description && <p>{sign.description}</p>}
                {sign.points && <ul>{sign.points.map(point => <li key={point}>{point}</li>)}</ul>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="oe-copy-section oe-parking-section">
        <h4>Most parking related signs are also regulatory and must be obeyed</h4>
        <div className="oe-parking-media">
          <img src="/parking.png" alt="Accessible parking, no parking, loading zone, and timed parking signs" />
        </div>
      </section>

      <section className="oe-pedestrian-safety-grid" aria-label="Pedestrian and school-area warnings">
        <article>
          <img src="/ahead.png" alt="Pedestrian and school crossing warning signs" />
          <div><p>This warning sign indicates that there may be pedestrians crossing the roadway ahead. You should slow down, look carefully for pedestrians crossing or about to cross the road and yield the right-of-way to pedestrians crossing.</p></div>
        </article>
        <article>
          <img src="/school.png" alt="School crossing warning sign" />
          <div><p>A number of warning signs are related to schools and playgrounds. You should slow down and carefully watch for children who might enter or cross the road. Speed signs are often posted along with these signs.</p></div>
        </article>
      </section>

      <section className="oe-regulatory-section" aria-labelledby="warning-signs-heading">
        <h4 className="oe-reference-section-title" id="warning-signs-heading">Warning signs alert you to potential dangers ahead and changes in the road conditions.</h4>
        <div className="oe-warning-intro">
          <img src="/caution.png" alt="Yellow diamond-shaped caution sign" />
          <p>All warning signs must also be obeyed. Most warning signs are yellow and shaped like a diamond.</p>
        </div>
        <p>Below are some examples of warning signs.</p>
        <div className="oe-warning-card-grid">
          {warningSignCards.map(sign => (
            <article className="oe-warning-card" key={sign.image}>
              <img src={sign.image} alt={sign.alt} />
              <div><p>{sign.description}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="oe-information-sign-grid" aria-label="Transit and guide signs">
        <article>
          <div className="oe-information-image-wrap"><img src="/public-bus.png" alt="Public transit bus and bicycle lane sign with posted hours" /></div>
          <div><h4>Public Transit Bus Lanes</h4><p>It is illegal to drive, stop, park, or leave a vehicle standing in the area of a road designated for the exclusive use of public transit buses unless a vehicle must cross the lane to make a turn. Signs will be posted to indicate the lanes are for "bus only" use.</p></div>
        </article>
        <article>
          <div className="oe-information-image-wrap"><img src="/guide.png" alt="Blue guide and traveler service symbols" /></div>
          <div><p>Guide and information signs inform you of services, recreation areas and destination information.</p></div>
        </article>
      </section>

      <section className="oe-work-zone-section" aria-labelledby="work-zone-heading">
        <h4 className="oe-reference-section-title" id="work-zone-heading">The orange construction signs inform drivers of construction zones ahead.</h4>
        <div className="oe-work-zone-signs">
          <img src="/road-orange.png" alt="Orange ONE LANE ROAD AHEAD construction sign" />
          <div><p>Some signs depict lane closures, speed reduction, slow, ramp closures, detours, detour routes, date and times of closures, work crews, etc. Orange cones on the road also warn the drivers that areas may be blocked to traffic due to construction or maintenance.</p></div>
          <img src="/man.png" alt="Orange flagger warning sign" />
        </div>
        <p className="oe-work-zone-note"><strong>Note:</strong> Drivers must watch for trucks with flashing white arrows, these indicate to drivers that a work crew is either working in a lane and that the drivers need to merge into the appropriate lane. A driver needs to be especially cautious around construction and maintenance areas, due to the work crews being on or just off the road. It is highly dangerous work to the workers, if drivers do not obey the construction and maintenance signs.</p>
        <h4 className="oe-reference-section-title">Safety Tips for Work Zone</h4>
        <div className="oe-work-zone-tips">
          <img src="/under.png" alt="Under construction barricade illustration" />
          <div>
            <p>Work zones can be very dangerous for all vehicles especially when traveling on the highway. It is important to be alert and be prepared to slow down or stop in a work zone. Slowing down and allowing others to merge, will ensure a safe passage through work zones.</p>
          </div>
        </div>
        <p>The following are few tips on work zone safety.</p>
        <ul className="oe-work-zone-long-list">
          <li>Work zones are busy places where construction vehicles and workers are always moving. Stay alert and stay on the safe path that is designated throughout the work zone. Try to avoid work zones altogether by using alternate routes when possible. If you can't avoid work zones, allow for more time to travel, slow down and consider sharing a ride with someone to reduce congestion.</li>
          <li>Work zones often pop up suddenly. If you are not paying attention to the signs, you could find yourself in a serious collision. Trucks can be great indicators of trouble or slow downs ahead. Trucks have a height advantage and can see ahead of traffic. Paying attention to a truck's brake lights is a good signal of a slow down or work zone ahead. Truck drivers know the stopping limitations of their trucks, and pay close attention to traffic. Take your cues from trucks and you'll be prepared.</li>
          <li>Aggressive drivers can be extremely dangerous while driving in work zones. Work zones require time and courtesy. For a smooth passage through work zones, allow others to merge in front of you. Be especially considerate to trucks. They require more space to merge and are the least maneuverable vehicles on the road. Remember, trucks have large blind spots, making it difficult to see cars squeezing in close to the front and sides of their truck.</li>
        </ul>
      </section>

      <div className="oe-video-wrap oe-regulatory-video">
        <iframe
          src="https://www.youtube.com/embed/wZN3hoBNqUY"
          title="Traffic control devices and roadway warning signs"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

const yellowMarkingRows = [
  {
    image: '/road-spedy1.png',
    alt: 'Single solid yellow line marking the left boundary of a roadway',
    text: 'On divided highways and some other roadways, a single solid yellow line will usually be used to indicate the left most boundary of the drivable roadway. You should not drive to the left of this line. Sets of solid yellow lines are frequently used to divide oncoming lanes of traffic before an upcoming hazard such as a road obstruction caused by the pillar of an over-crossing.',
  },
  {
    image: '/road-speedy2.png',
    alt: 'Single broken yellow centerline on an open road',
    text: 'If there is a single yellow line dividing lanes of traffic and the line is broken, you may pass over this to pass other vehicles and to make left turns into other streets, driveways and alleys, if it can be done safely.',
  },
  {
    image: '/speedy3.png',
    alt: 'Diagram showing broken and solid yellow centerlines',
    text: 'If there are two yellow lines dividing lanes of traffic and the line closest to your lane is broken, you may cross over it to pass vehicles ahead, if it is safe to do so. If the line closest to your lane is solid, you may not cross over it except to turn left into a driveway or alley.',
  },
  {
    image: '/speedy4.png',
    alt: 'Double solid yellow centerlines',
    text: 'If there are two solid yellow lines dividing lanes of traffic, you may not cross over them to pass another vehicle. You should never drive to the left of these lines. You may cross over a double solid yellow line to make a left turn at an intersection, to enter or exit a road or a driveway or to make a U-turn, if it can be made safely and is not otherwise prohibited.',
  },
]

const centerTurnLaneRules = [
  "You must use the center left turn lane to make a left turn or U turn if one exists on the street you are driving. You must signal and completely enter the lane before making your left- hand turn. Don't stop part way into the lane with your vehicle blocking traffic.",
  'You may only drive in this lane for a distance up to 200 feet, which is about the length of five or six vehicles. The limit on driving in a center left turn lane is to help prevent drivers from using this lane as a regular traffic lane or as a passing lane. You may not use a center left-turn lane for either of these purposes.',
  'Be cautious and look for vehicles coming from the opposite direction that are pulling into a center left turn lane. Because of the potential for meeting other vehicles coming from opposite direction head-on, center left turn lanes are often referred to as "suicide lanes."',
  'When turning left from a side street or driveway, you have the option to use this lane before completing your turn. If you want to first turn into the center left-turn lane, you should signal, wait until it is safe and then drive completely into the center left turn lane. Wait in the lane with your right- turn signal on for traffic to clear before pulling into traffic. Alternatively, if traffic is clear in both directions, you can make your left turn directly from the side street or driveway, without first stopping in the center left turn lane.',
  'Turn signal on for traffic to clear before pulling into traffic. Alternatively, if traffic is clear in both directions, you can make your left turn directly from the side street or driveway, without first stopping in the center left turn lane.',
]

const whiteMarkingRows = [
  {
    image: '/speedy10.png',
    alt: 'Broad white crosswalk lines across a road',
    text: 'Crosswalks are delineated with sets of broad white lines, which cross the road. Crosswalks are often preceded by white words painted on the road indicating "SLOW PED XING." There are special rules that the driver must follow when dealing with pedestrians crossing the roadway, but in general you should always stop behind the crosswalk when you must stop at an intersection.',
  },
  {
    image: '/speedy11.png',
    alt: 'STOP message painted on the pavement',
    text: 'Thick solid white lines that cross the roadway are used to mark the limit line at intersections and the clearance line at RR crossings. You must stop behind these lines at an intersection or railroad crossing. White painted letters on the pavement such as "RXR" often precedes the limit lines at railroad crossings.',
  },
  {
    image: '/speedy12.png',
    alt: 'White directional arrow painted in a traffic lane',
    text: 'White arrows are sometimes painted on the roadway to indicate whether the lane proceeds ahead, merges, turns or exits. These arrows are intended to guide your choice of lane.',
  },
  {
    image: '/speedy13.png',
    alt: 'Bicycle and SLOW symbols painted on the roadway',
    text: 'Large white letters and symbols are often painted on the road to warn you of upcoming signals, stop signs, changes in the lane, bicycle lanes and crosswalks. You should keep an eye on the roadway surface for these messages when you are driving.',
  },
  {
    image: '/speddy14.png',
    alt: 'Diamond and arrow markings in a carpool lane',
    text: 'Diamonds painted in a lane indicate that lane is for the use of buses and carpools only. Using a carpool lane requires a minimum of 2 or 3 people in your vehicle.',
  },
]

export function HighwayRoadMarkingsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-highway-markings-lesson">
      <LessonHeader title="4.4 Highway and Road Markings" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-markings-intro">
        <p>Lines and other markings painted on the pavement are also used to control and direct traffic. Sometimes these lines will include reflective raised pavement markers, which make the lines more visible. Markers may also be used to simulate the lines.</p>
        <div className="oe-markings-intro-media">
          <img src="/road-speedy.png" alt="Road illustration with yellow and white pavement markings" />
          <p>Yellow and white are the two most common colors of pavement markings. Lines in these two colors have different meanings. You should be able to determine where you are on a roadway by the color and type of the lines.</p>
        </div>
      </section>

      <section className="oe-marking-section oe-yellow-markings" aria-labelledby="yellow-centerline-heading">
        <h4 id="yellow-centerline-heading">YELLOW Centerline Markings</h4>
        <p>Yellow lines parallel to the roadway mark the center of a roadway on which there is two-way traffic. Yellow lines are used in different configurations that have different meanings.</p>
        <ul>
          <li>If there is a single solid yellow line dividing lanes of traffic, you may not drive over this line to pass other vehicles.</li>
          <li>You may cross over a solid yellow line to make a left turn at an intersection, to enter or exit a road or a driveway or to make a U-turn, if it can be made safely and is not otherwise prohibited.</li>
        </ul>
        <div className="oe-marking-row-list">
          {yellowMarkingRows.map(row => (
            <article className="oe-marking-row" key={row.image}>
              <div className="oe-marking-image-wrap"><img src={row.image} alt={row.alt} /></div>
              <p>{row.text}</p>
            </article>
          ))}
        </div>

        <article className="oe-wide-marking-card">
          <img src="/speedy5.png" alt="Diagram showing double yellow lines separated by two or more feet" />
          <p>Two sets of solid double yellow lines that are two or more feet apart represent a wall or center divider. You may not drive on or over these lines for any reason. You may only make a U turn or left turn on a street divided with these lines at an opening provided for turns.</p>
        </article>

        <article className="oe-marking-row oe-carpool-row">
          <div className="oe-marking-image-wrap"><img src="/speedy6.png" alt="Carpool lane separated by parallel solid yellow lines" /></div>
          <p>In some cases, one or more sets of parallel solid yellow lines are also used to separate carpool lanes from normal traffic lanes. Do not cross over these lines to enter or exit the carpool lane. Wait until the lines are broken or for some other designated place to enter or exit the lane.</p>
        </article>

        <article className="oe-center-lane-card">
          <div>
            <p><strong>A center traffic lane enclosed by double yellow lines on each side with the inner lines broken</strong> may be used to start and complete left hand turns and start U-turns from either direction of traffic but cannot be used for passing.</p>
          </div>
          <img src="/speedy7.png" alt="Two-way center left turn lane diagram" />
        </article>

        <div className="oe-center-turn-rules">
          <h4>Rules for Proper Use of Center Left Turn Lanes</h4>
          <ul>{centerTurnLaneRules.map(rule => <li key={rule}>{rule}</li>)}</ul>
        </div>

        <article className="oe-school-marking-card">
          <img src="/school1.png" alt="School crossing pavement warning sign" />
          <p>Broad yellow lines crossing the road are sometimes painted near school crossings. Sometime the words "SCHOOL XING" are used. You should carefully scan for children about to cross or crossing the road when you see these markings.</p>
          <img src="/school2.png" alt="SCHOOL XING sign" />
        </article>
      </section>

      <section className="oe-marking-section oe-white-markings" aria-labelledby="white-centerline-heading">
        <h4 id="white-centerline-heading">WHITE Centerline Markings</h4>
        <p>White lines of different configurations indicate different meanings.</p>
        <ul>
          <li>White lines parallel to the roadway separate lanes of traffic going in the same direction, including bicycle lanes from car lanes.</li>
          <li>Messages such as "STOP AHEAD" or arrows directing traffic in a particular lane are often painted on the pavement in white.</li>
          <li>White lines, which cross the roadway, delineate crosswalks or limit lines.</li>
        </ul>

        <article className="oe-marking-row">
          <div className="oe-marking-image-wrap"><img src="/speedy8.png" alt="Double solid white lane lines" /></div>
          <p>A single or double solid white line dividing traffic lanes going in the same direction cannot be crossed for any reason.</p>
        </article>
        <ul>
          <li>On divided highways, a single solid white line will usually be used to indicate the rightmost boundary of the drivable roadway.</li>
          <li>You should not drive to the right of this line.</li>
          <li>Sets of solid white lines are frequently used to divide the lanes before an upcoming hazard such as a road obstruction caused by the pillar of an over-crossing, or the median between a freeway off-ramp and normal traffic lanes.</li>
        </ul>
        <div className="oe-marking-road-overview"><img src="/speedy9.png" alt="Aerial view of solid and broken white roadway lines" /></div>
        <ul>
          <li>These lines should not be crossed.</li>
          <li>Thicker solid white lines are used to separate parts of left and right turn lanes close to the intersection.</li>
          <li>If a single broken white line divides lanes of traffic, you may cross over the line to enter the lane next to you.</li>
        </ul>

        <div className="oe-marking-row-list oe-white-row-list">
          {whiteMarkingRows.map(row => (
            <article className="oe-marking-row" key={row.image}>
              <div className="oe-marking-image-wrap"><img src={row.image} alt={row.alt} /></div>
              <p>{row.text}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="oe-video-wrap oe-markings-video">
        <iframe
          src="https://www.youtube.com/embed/pJ6aXMXdABM"
          title="Traffic lanes and rules of the road"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

const curbMarkingGroups = [
  {
    name: 'White Curb',
    className: 'white',
    points: ['Allows very short stops, only to take or drop off passengers or to put mail in the mailbox.'],
  },
  {
    name: 'Yellow Curb',
    className: 'yellow',
    points: [
      'Loading zone',
      'A driver may stop, but only long enough to load or unload freight or passengers.',
      'Stop for no longer than the local ordinances allow.',
      'Drivers of non-commercial vehicles are usually required to remain in their vehicle in this zone.',
    ],
  },
  {
    name: 'Red curbs',
    className: 'red',
    points: ['No stopping, standing or parking. However, buses may stop at a red zone marked for buses, as red curbs usually indicate a bus stop.'],
  },
  {
    name: 'Blue Curb',
    className: 'blue',
    points: ['This indicates parking for the disabled only. In order to park in a blue zone the driver must display a placard or the license plate must be specially marked.'],
  },
  {
    name: 'Green Curb',
    className: 'green',
    points: ['This indicates parking is for a limited amount of time. The time is usually posted on a sign next to or near the green zone or is painted on the curb.'],
  },
]

export function CurbMarkingsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-curb-markings-lesson">
      <LessonHeader title="4.5 Curb Markings" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-curb-intro">
        <img src="/curb.png" alt="Street showing white, yellow, red, blue, and green curb markings" />
        <p>Curb Markings are designed to regulate parking areas and spaces. They indicate that the parking is controlled, permitted, restricted, or not permitted.</p>
      </section>

      <section className="oe-curb-color-list" aria-label="Curb marking colors">
        {curbMarkingGroups.map(group => (
          <article className={`oe-curb-color-card ${group.className}`} key={group.name}>
            <div className="oe-curb-color-swatch" aria-hidden="true" />
            <div>
              <h4>{group.name}</h4>
              <ul>{group.points.map(point => <li key={point}>{point}</li>)}</ul>
            </div>
          </article>
        ))}
      </section>

      <div className="oe-video-wrap oe-curb-video">
        <iframe
          src="https://www.youtube.com/embed/9HwjrJ7J-oU"
          title="Parking and curb markings"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function ChapterFourTestLesson({ onStart }) {
  return (
    <article className="oe-full-lesson oe-test-lesson oe-chapter-four-test">
      <h3>4.6 Chapter 4</h3>
      <section className="oe-chapter-four-test-card">
        <p><strong>Congratulations!</strong> You have completed the reading for chapter 4. You&apos;ll need to get 9 answers correct (out of 12) in order to proceed. <strong>Good luck!</strong></p>
        <button className="oe-chapter-four-test-start" type="button" onClick={onStart} aria-label="Start here and return to Chapter 4">
          <img src="/start.png" alt="Start Here" />
        </button>
        <img className="oe-chapter-four-quiz-image" src="/quize.png" alt="Chapter 4 quiz illustration" />
      </section>
    </article>
  )
}
