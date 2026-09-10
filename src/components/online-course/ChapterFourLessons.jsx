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
