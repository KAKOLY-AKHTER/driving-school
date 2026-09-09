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

const visionMyths = [
  {
    image: '/myth1.png',
    alt: 'Prescription eyeglasses',
    myth: 'Failure to use proper glasses will hurt your eyes.',
    fact: 'This statement is true for only a small number of people. Some children have eye problems that can be corrected, and it is important that they wear their glasses. Corrective glasses or contacts improve eyesight; using your eyes with or without glasses will not damage them further.',
  },
  {
    image: '/myth2.png',
    alt: 'Person reading with a light',
    myth: 'Reading in dim light can damage your eyes.',
    fact: 'Reading in dim light can cause eye fatigue, but it will not hurt your eyes.',
  },
  {
    image: '/myth3.png',
    alt: 'Carrots',
    myth: 'Eating carrots will improve your vision.',
    fact: 'Carrots are high in vitamin A, which is essential for sight, but only a small amount is necessary to support vision.',
  },
  {
    image: '/myth4.png',
    alt: 'Person receiving an eye examination',
    myth: 'An eye exam is necessary only when you are having problems.',
    fact: 'Everyone should follow a proper eye-health program that includes regular eye examinations, even when there are no noticeable signs of a problem.',
  },
]

export function EyesVisionLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-vision-lesson">
      <LessonHeader title="2.1 The Eyes and Vision" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-vision-intro">
        <img src="/eye1.png" alt="Illustration of eyes wearing glasses" />
        <p><strong>Vision plays a key role in safe driving.</strong> Seeing all around your vehicle is crucial for detecting and avoiding hazardous situations. Good vision is essential for spotting trouble in time to avoid a collision.</p>
      </section>

      <section className="oe-copy-section oe-vision-section">
        <h4>Eye Physiology</h4>
        <p className="oe-vision-emphasis">Good vision is essential for driving.</p>
        <ul>
          <li>Most of what you do behind the wheel depends on your eyesight. If you cannot see clearly, you cannot judge distances or spot trouble and may be unable to react quickly to a potentially hazardous situation.</li>
          <li>You need to see “out of the corner of your eye.” This lets you spot cars approaching on either side while your eyes remain on the road ahead.</li>
          <li>Good distance judgment is important for knowing how far you are from other vehicles. Under good conditions, you need about 400 feet to stop at 55 mph and 210 feet to stop at 35 mph. You cannot drive safely at those speeds unless you can see at least that far ahead.</li>
          <li>Many people who see clearly during the day have trouble seeing clearly at night. This is called “night blindness.” Some people may also see poorly in dim light or have difficulty with the glare of headlights.</li>
        </ul>
      </section>

      <section className="oe-copy-section oe-vision-section">
        <h4>Visual Acuity</h4>
        <div className="oe-vision-media oe-vision-media-left">
          <img src="/alphabet.png" alt="Visual acuity eye chart" />
          <div>
            <p>The sharpness of your eyesight is extremely important when driving. <strong>Visual acuity</strong> is the ability to discern detail and identify and recognize what you see. It is essential for reading road signs and identifying hazards.</p>
            <ul>
              <li>A person who can clearly read 3/8-inch-high letters from 20 feet away is considered to have normal, or 20/20, vision.</li>
              <li>If a person has 20/40 vision, that person standing 20 feet from the chart can see what a person with normal vision can see from 40 feet away.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="oe-copy-section oe-vision-section">
        <h4>Distance Judgment (Depth Perception)</h4>
        <div className="oe-vision-media oe-vision-media-right">
          <div>
            <p><strong>Depth perception</strong> is your ability to correctly perceive the distance of objects in relation to your position. It is important when passing, approaching a vehicle, and turning.</p>
            <p>Poor depth perception can result in:</p>
            <ul>
              <li>Stopping too short of limit lines or inside an intersection.</li>
              <li>Turning too wide or too short.</li>
              <li>Being unable to maintain a constant speed.</li>
              <li>Being unable to follow other vehicles at a distance appropriate for driving conditions.</li>
            </ul>
          </div>
          <img src="/depth.png" alt="Depth perception illustration" />
        </div>
      </section>

      <section className="oe-copy-section oe-vision-section">
        <h4>Peripheral Vision</h4>
        <p>Peripheral vision is the ability to see what is happening to your sides—“looking out of the corner of your eye.” No matter how good your peripheral vision is, there will still be areas to the sides and rear of your vehicle that cannot be seen. These areas are called <strong>blind spots</strong>. Rear-view mirrors do not eliminate every blind spot, so before changing lanes, turn your head and look into the lane you intend to enter.</p>

        <h4>Night Vision</h4>
        <p>Night vision is your ability to see well in low light levels and is necessary for driving safely at night. Lights may appear blurry and “spread out” on the windshield, creating a sheen that is difficult to see through. This makes it harder to perceive the distance and position of the light source.</p>
        <p>Safe nighttime driving requires seeing well not only in low illumination but also seeing low-contrast objects. A person wearing dark clothing and crossing the street is harder to detect at night because there is less contrast between the pedestrian and the dark background.</p>

        <h4>Vision and Color Blindness</h4>
        <p>Color blindness is the inability to distinguish differences between certain colors. It results from an absence of color-sensitive pigment in the cone cells of the retina, the nerve layer at the back of the eye.</p>
        <p>A person with color blindness may have trouble seeing red, green, blue, or mixtures of these colors. The most common type is red-green color blindness, in which red and green may appear to be the same color.</p>
        <p>Drivers with color-vision difficulties must pay special attention to the position and pattern of traffic signals. Traffic controls rely on a color system—red means stop, green means go, and yellow means yield—but shape and position also help identify the required action.</p>
      </section>

      <aside className="oe-note-box oe-vision-compensation">
        <strong>Compensation for Subnormal Vision</strong>
        <p>If you have vision problems, visit an optometrist and get fitted for eyeglasses or contact lenses. In severe cases, consult an ophthalmologist.</p>
        <p>Recommendations for compensating for poor visual acuity:</p>
        <ul>
          <li>For poor depth perception, use extra caution when judging the speed and distance of oncoming vehicles and approaching objects.</li>
          <li>For poor peripheral vision, turn your head frequently to increase your field of vision.</li>
          <li>For poor glare resistance and recovery, use the sun visor, wear sunglasses or other dark lenses during sunset, and avoid looking directly into the headlights of oncoming cars.</li>
          <li>For color blindness, learn the general shapes and patterns of signs and rely on the position of signal lights rather than only their color.</li>
        </ul>
      </aside>

      <section className="oe-copy-section oe-vision-section oe-myth-section">
        <h4>Common Eye and Vision Myths</h4>
        <p>It is important to separate fact from fiction, especially when the topic is eyesight. Knowing how to care for your eyes is the first step toward protecting your sight for a lifetime.</p>
        <div className="oe-myth-list">
          {visionMyths.map(item => (
            <article className="oe-myth-item" key={item.myth}>
              <img src={item.image} alt={item.alt} />
              <p><strong>Myth:</strong> {item.myth}<br /><strong>Fact:</strong> {item.fact}</p>
            </article>
          ))}
          <article className="oe-myth-item oe-myth-fact">
            <img src="/myth5.png" alt="It is true" />
            <p>It is important to wear your eyeglasses or corrective contact lenses while driving. The Department of Motor Vehicles may suspend or revoke your license if you violate this restriction.</p>
          </article>
        </div>
      </section>

      <section className="oe-copy-section oe-vision-section oe-vision-process">
        <h4>How Does Vision Work?</h4>
        <img src="/eye2.png" alt="Close-up view of a human eye" />
        <ol>
          <li>When a person views an external object, light rays strike the eye and pass through the cornea, pupil, aqueous humor, lens, and vitreous humor.</li>
          <li>When the rays reach the retina, the rods and cones are stimulated.</li>
          <li>An upside-down image is relayed through nerve impulses to the optic nerve.</li>
          <li>The image is transferred to the brain, which turns it into a right-side-up image.</li>
          <li>The resulting image is what the person sees.</li>
        </ol>
      </section>

      <section className="oe-copy-section oe-vision-section">
        <h4>Vision Care</h4>
        <p>Certain aspects of vision deteriorate slowly with age—sometimes so slowly that people do not notice the change. Have your eyes checked every year or two by an optometrist or ophthalmologist to help protect yourself and others while driving.</p>

        <h4>Things to Consider to Help Vision While Driving</h4>
        <ul>
          <li>Keep windows clean and clear away objects inside the vehicle that may obstruct your vision. Do not hang anything from the inside rear-view mirror.</li>
          <li>Do not place stickers, signs, or other objects on windows where they can adversely affect your vision.</li>
          <li>Tinted windows must meet legal standards for the degree and location of the tint.</li>
          <li>Adjust the seat first so you can see clearly and sit comfortably, then adjust every mirror before beginning to drive.</li>
          <li>It is illegal to drive a motor vehicle equipped with a television or similar device that is visible to the driver while the vehicle is operating.</li>
          <li>Keep windshield wipers in good operating condition and use them whenever needed for clear vision in fog, snow, or rain.</li>
        </ul>
      </section>

      <section className="oe-copy-section oe-vision-section oe-sunglasses-section">
        <div className="oe-sunglasses-intro">
          <div className="oe-glasses-stack" aria-label="Examples of sunglasses">
            <img src="/sun-glass1.png" alt="Purple-tinted sunglasses" />
            <img src="/sun-glass2.png" alt="Dark sunglasses" />
            <img src="/sun-glass3.png" alt="Reflective sunglasses" />
          </div>
          <div>
            <h4>Why Do I Need to Wear Sunglasses?</h4>
            <p>Sunglasses can help your eyes in two important ways:</p>
            <ul>
              <li>They help filter light.</li>
              <li>They protect against the sun’s damaging rays.</li>
            </ul>
            <p>Good sunglasses reduce glare and filter out 99 to 100 percent of ultraviolet (UV) rays. They should be comfortable and protect your eyes without distortion.</p>
          </div>
        </div>

        <h4>How Does the Sun Damage the Eyes?</h4>
        <p>Three types of rays come from the sun:</p>
        <ul className="oe-nested-list">
          <li><strong>Visible:</strong> What you see as color.</li>
          <li><strong>Infrared:</strong> Invisible but felt as heat.</li>
          <li><strong>Ultraviolet (UV radiation):</strong> Invisible and often called “sunburn rays.”
            <ul>
              <li>UV radiation includes UV-A and UV-B rays. These invisible rays can damage your eyes immediately or over a lifetime of exposure.</li>
            </ul>
          </li>
        </ul>

        <div className="oe-vision-remember">
          <h4>Remember!</h4>
          <p>Constant exposure to bright sunlight can damage the:</p>
          <ul>
            <li><strong>Cornea:</strong> The clear outer part of the eye that allows light through to the retina.</li>
            <li><strong>Lens:</strong> The part of the eye responsible for focusing.</li>
            <li><strong>Retina:</strong> The innermost layer of the eye that sends an image to the brain.</li>
          </ul>
        </div>

        <h4>How Can Sunglasses Protect My Eyes from UV Radiation?</h4>
        <ul className="oe-nested-list">
          <li>Sunglasses eliminate glare that causes squinting.</li>
          <li>All types of eyewear—including prescription and nonprescription glasses, contact lenses, and lens implants—should absorb UV-A and UV-B rays.
            <ul>
              <li>Look for sunglasses that block 99 to 100 percent of both types of ultraviolet rays. Be cautious of labels that claim to block harmful UV rays without stating how much radiation they block.</li>
            </ul>
          </li>
        </ul>

        <h4>Who Is at Risk for Eye Problems Caused by UV Rays?</h4>
        <ul>
          <li>Anyone who spends time in the sun is at risk. People who spend long hours outside for work or sports have greater exposure to UV rays.</li>
          <li>Certain medications—including tetracycline, sulfa drugs, birth-control pills, tranquilizers, and diuretics—can increase sensitivity to UV rays.</li>
        </ul>
      </section>

      <section className="oe-copy-section oe-vision-section oe-lens-section">
        <h4>Types of Lenses</h4>
        <ul className="oe-nested-list oe-lens-list">
          <li><strong>Clip-on lenses</strong>
            <ul>
              <li>They are worn over prescription eyeglasses and are convenient, but they may not fully cover the lens.</li>
              <li>The additional lens surfaces may cause reflections, scratch prescription lenses, or fall off.</li>
            </ul>
          </li>
          <li><strong>Gradient lenses</strong>
            <ul>
              <li>These may be dark at the top and lighter at the bottom, or dark at the top and bottom and lighter in the center.</li>
              <li>They are useful when sunlight comes from overhead or is reflected upward from below.</li>
            </ul>
          </li>
          <li><strong>Mirrored lenses</strong>
            <ul><li>A thin metallic coating further reduces the amount of light that reaches the eye.</li></ul>
          </li>
          <li><strong>Photochromic lenses</strong>
            <ul>
              <li>These lenses darken in bright light and lighten in dim light.</li>
              <li>Light level, lens thickness, and temperature affect how dark they become, and they may not change quickly enough for sudden lighting changes.</li>
            </ul>
          </li>
          <li><strong>Polarizing lenses</strong>
            <ul><li>These reduce glare and reflected light from flat surfaces, making them useful for driving and other activities around water or bright ground.</li></ul>
          </li>
          <li><strong>Lens colors</strong>
            <ul>
              <li>Neutral gray or “smoke” lenses provide the best color perception. Amber, brown, or green can also be good choices.</li>
              <li>Red, orange, blue, or purple tints may interfere with color perception and can allow too much light.</li>
              <li>Lens tint alone does not indicate the degree of UV protection.</li>
            </ul>
          </li>
        </ul>

        <h4>Quality and Safety of Lenses</h4>
        <p>Inspect lenses for scratches, bubbles, and distortion. Poorly made glasses do not damage the physical structure of your eyes, but flaws and distortion may force your eyes to work harder and cause:</p>
        <ul className="oe-vision-symptoms">
          <li>Squinting</li>
          <li>Blinking</li>
          <li>Tearing</li>
          <li>Headaches</li>
          <li>Nausea</li>
          <li>Dizziness</li>
        </ul>
        <p>The Food and Drug Administration requires lenses to be impact-resistant and made from optical-quality glass or plastic. This does not mean they are shatterproof, but they can withstand moderate impact. Polycarbonate is the most shatter-resistant material commonly available and is an excellent choice for children’s sunglasses and impact-related sports.</p>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}
