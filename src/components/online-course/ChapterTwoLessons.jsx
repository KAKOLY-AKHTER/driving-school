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
        <div className="oe-eye-graphic">
          <img src="/eye1.png" alt="Illustration of eyes wearing glasses" />
          <span className="oe-eye-iris oe-eye-iris-left" aria-hidden="true" />
          <span className="oe-eye-iris oe-eye-iris-right" aria-hidden="true" />
        </div>
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

export function EarsHearingLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-hearing-lesson">
      <LessonHeader title="2.2 The Ears and Hearing" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-hearing-intro">
        <img src="/ear.png" alt="Person listening carefully" />
        <div>
          <h4>Auditory Acuity</h4>
          <p>Sharp hearing is important for safe driving. Your hearing can:</p>
          <ul className="oe-nested-list">
            <li>Warn you of danger, such as a vehicle in your blind spot.</li>
            <li>Help you respond to:
              <ul>
                <li>Someone sounding a horn.</li>
                <li>Emergency-vehicle sirens.</li>
                <li>Bells at railroad crossings.</li>
              </ul>
            </li>
            <li>Alert you to possible engine trouble or other mechanical failure.</li>
          </ul>
        </div>
      </section>

      <div className="oe-hearing-condition-grid">
        <section className="oe-hearing-condition">
          <h4>Partial Deafness</h4>
          <p>A hearing impairment that limits a person&apos;s ability to hear low- to medium-volume sounds or sounds at certain frequencies.</p>
        </section>
        <section className="oe-hearing-condition">
          <h4>Total Deafness</h4>
          <p>A hearing impairment that results in the inability to hear sounds, including very loud sounds.</p>
        </section>
      </div>

      <section className="oe-copy-section oe-hearing-section">
        <h4>Compensation for Hearing Impairment</h4>
        <ul>
          <li>A person can improve the ability to drive safely by consulting a doctor and using a properly fitted hearing aid where appropriate.</li>
          <li>A driver with partial or total hearing loss can rely more strongly on visual awareness, including scanning the surrounding environment more frequently.</li>
        </ul>

        <h4>Hearing Care</h4>
        <p>Auditory acuity may deteriorate with age. Have your hearing checked periodically by a qualified medical professional because gradual changes can occur so slowly that they may not be immediately noticeable.</p>

        <h4>Considerations for Hearing and Driving</h4>
        <ul className="oe-nested-list">
          <li>To hear surrounding traffic while driving:
            <ul>
              <li>Keep the vehicle&apos;s audio-system volume low.</li>
              <li>When safe and suitable, keep a window slightly open so outside warning sounds are easier to hear.</li>
            </ul>
          </li>
          <li>Do not wear a headset or earplugs that cover both ears while driving.</li>
        </ul>
      </section>

      <section className="oe-copy-section oe-hearing-history">
        <h4>Brief History of the Hearing Aid</h4>
        <div className="oe-hearing-history-gallery">
          <img src="/aid1.png" alt="Have you heard message with an ear symbol" />
          <img src="/aid2.png" alt="Early portable hearing device" />
        </div>

        <p>A hearing aid is a device that helps people with hearing loss hear sounds more clearly. One of the earliest devices, known as the metal ear, appeared in the 17th century and was worn over the ears. Hearing aids developed in the early 19th century were often bulky devices designed to sit on a table. Ear trumpets and cones later became widely used.</p>
        <p>Frederick Rein of London became the first full-scale manufacturer of hearing aids around 1800, producing ear trumpets, hearing fans, and conversation tubes. These portable instruments amplified sound, but their size created a difficult tradeoff: larger instruments amplified more effectively, while smaller and more portable versions provided less benefit.</p>
        <p>By the late 1800s, acoustic horns used a tube with a sound-capturing cone at one end and an earpiece at the other. The demand for less visible hearing aids helped move design toward smaller devices that could fit in or around the ear.</p>

        <img className="oe-hearing-aid-lineup" src="/aid3.png" alt="A range of modern hearing aids" />

        <p>Efforts to make hearing aids less visible sometimes caused devices to be hidden in furniture, clothing, and accessories. Social stigma could discourage people from using the assistance they needed. Miniaturization eventually shifted the focus toward helping people hear effectively, and during the 20th century hearing aids evolved from mechanical devices to advanced electrical and electronic designs.</p>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function LimitingPhysicalConditionsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-conditions-lesson">
      <LessonHeader title="2.3 Other Limiting Physical Conditions" onPrevious={onPrevious} onNext={onNext} />

      <p className="oe-conditions-lead">The following are other physical conditions that could limit a driver&apos;s ability to safely operate a vehicle.</p>

      <div className="oe-condition-grid">
        <section className="oe-condition-card">
          <h4>Fatigue</h4>
          <p>When you are tired, you are less alert. The body naturally wants to sleep at night, and most drivers are less alert after midnight. You may not see hazards as soon or react as quickly, increasing the chance of a collision. If you are sleepy, the only safe action is to get off the road and rest. Otherwise, you risk your life and the lives of everyone sharing the road.</p>
        </section>

        <section className="oe-condition-card">
          <h4>Illness</h4>
          <p>Depending on the condition, illness can be a hazard to your safety and the safety of others. Consult a doctor to determine whether your condition allows you to drive a motor vehicle safely. The decision is best left to a medical professional.</p>
          <p>Do not take the wheel when your responses are slow or your judgment is impaired. Ask a friend or loved one to drive you to appointments rather than traveling on your own.</p>
        </section>

        <section className="oe-condition-card">
          <h4>Deformities</h4>
          <p>Consult a qualified doctor who specializes in your particular condition. They can best determine whether you are capable of operating a motor vehicle. Disclose any physical condition that could affect your driving skills. Vehicle modifications and adaptive equipment are available to help people with specific physical limitations drive safely.</p>
        </section>

        <section className="oe-condition-card">
          <h4>Steadiness</h4>
          <p>Steadiness can be affected by physiological, physical, or emotional factors. These factors may limit your ability to safely handle the steering wheel and control a vehicle. If you are not steady, neither will your vehicle be on the road. Consider not driving for your safety and the safety of others.</p>
        </section>

        <section className="oe-condition-card">
          <h4>Muscular Condition</h4>
          <p>Certain muscular conditions can keep you from being a safe driver. Depending on the condition, special equipment may be required to operate the vehicle safely. Consult your physician for details because every case must be evaluated individually.</p>
        </section>
      </div>

      <section className="oe-copy-section oe-disqualifying-section">
        <h4>Disqualifying Conditions</h4>
        <p>Some conditions may prevent an applicant from receiving a driver&apos;s license.</p>
        <ul className="oe-nested-list">
          <li>Each condition should be determined on an individual basis. Depending on the severity of the case or condition, an applicant may or may not qualify for a license.</li>
          <li>Consult your physician for details about your particular condition and whether driving is a safe option.</li>
          <li>In some cases, a person can compensate for a physical condition by demonstrating safe driving ability during a driving test.</li>
          <li>Examples of potentially disqualifying conditions include:
            <ul>
              <li>Cerebral palsy</li>
              <li>Epilepsy</li>
              <li>Cardiac conditions</li>
              <li>Paralysis</li>
              <li>Mental incapacity</li>
              <li>Dementia</li>
              <li>Lapses of consciousness</li>
              <li>Vision conditions</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="oe-copy-section oe-carbon-section">
        <h4>Effects of Carbon Monoxide Poisoning</h4>
        <div className="oe-carbon-media">
          <img src="/poision.png" alt="Vehicle exhaust pipes" />
          <div>
            <p><strong>Carbon monoxide is a deadly gas</strong> emitted by a vehicle as it burns gasoline. Never run a vehicle in a sealed or closed structure, such as a garage with the door closed.</p>
            <p>Emission problems may allow this poisonous gas to enter the vehicle while you are driving. Have your vehicle checked regularly by a qualified mechanic.</p>
          </div>
        </div>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function EssentialAttitudesLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-attitudes-lesson">
      <LessonHeader title="2.4 Essential Attitudes" onPrevious={onPrevious} onNext={onNext} />

      <section className="oe-attitude-intro">
        <img src="/atitude.png" alt="Attitude control dial" />
        <p>Drivers must possess a good, healthy attitude when operating a vehicle. A positive attitude helps a driver remain safe during difficult and stressful situations, including heavy traffic, bad weather, and encounters with inattentive drivers. Essential driving attitudes include courtesy, consideration for others, alertness, good judgment, responsibility, and foresight.</p>
      </section>

      <section className="oe-copy-section oe-attitude-section">
        <h4>Motivation and Readiness</h4>
        <div className="oe-attitude-media oe-attitude-media-left">
          <img src="/focus.png" alt="Focus and attitude word puzzle" />
          <div>
            <p><strong><em>Motivation</em></strong> involves learning the concepts and skills needed to become a safe driver through driver education and training, then applying what you have learned to real driving situations. You must be motivated to maintain a safe driving attitude.</p>
            <p><strong><em>Readiness</em></strong> means being mentally prepared for different traffic conditions and possessing the knowledge and skills needed to respond. A ready driver is completely focused on the task at hand.</p>
          </div>
        </div>
      </section>

      <section className="oe-copy-section oe-attitude-section">
        <h4>Analysis of Habit Patterns</h4>
        <ul className="oe-nested-list">
          <li>Young drivers often develop habits that are difficult to break. Student drivers should pay close attention to detail and make the learning stage an opportunity to develop sound driving habits.</li>
          <li>Continually monitor your own driving to identify poor habits and attitudes before they become automatic.</li>
          <li>Young drivers may:
            <ul>
              <li>Overestimate their capabilities.</li>
              <li>Rate some traffic situations as less risky than middle-aged and older drivers do.</li>
              <li>Underestimate danger in high-risk situations while overestimating danger in low- to medium-risk situations.</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="oe-copy-section oe-attitude-section oe-suggestions-section">
        <h4>Suggestions</h4>
        <div className="oe-attitude-media oe-attitude-media-compact">
          <img src="/suggestion.png" alt="Student having a helpful idea" />
          <div>
            <p>Once you identify a poor driving habit or attitude, consciously apply the appropriate behavior and practice it consistently until the correct response becomes automatic.</p>
            <p>Practice safe responses to hazards repeatedly while learning to drive. Training and continued practice are the best ways to overcome poor driving habits and attitudes.</p>
          </div>
        </div>
      </section>

      <section className="oe-copy-section oe-attitude-section oe-defensive-section">
        <h4>Learn to Be a Defensive Driver</h4>
        <div className="oe-attitude-media oe-attitude-media-compact">
          <img src="/defensive.png" alt="Driver avoiding an angry confrontation" />
          <ul>
            <li>Use all the skills taught in your driving course and always watch for the actions of other road users.</li>
            <li>Avoid confrontations and road rage so you and your passengers can arrive safely at your destination.</li>
            <li>Learn effective driving practices, make them your goal, and consistently put them into action.</li>
          </ul>
        </div>
      </section>

      <section className="oe-copy-section oe-attitude-section">
        <h4>Maintenance of Habit Patterns</h4>
        <ul>
          <li>Build a good habit pattern by repeating the correct steps until you can perform them consistently.</li>
          <li>Practice each maneuver properly until it becomes a safe driving habit.</li>
          <li>Good driving habits help you become the best and safest driver you can be.</li>
        </ul>
      </section>

      <section className="oe-copy-section oe-attitude-section oe-behavior-section">
        <h4 className="oe-underlined">Behavior Variables</h4>

        <h5>Emotional Tension</h5>
        <p>Driving while emotionally tense is unsafe. Other road users may irritate you and cause you to react irrationally or make choices you would not normally make when calm. Those choices may place you, your passengers, and other road users in danger.</p>
        <p><strong>Safe driving requires your full concentration.</strong></p>
        <ul>
          <li>If you are preoccupied with your emotions, you cannot focus fully on driving. Do not drive while severely tense or emotionally distressed.</li>
          <li>The safest choice is not to drive. Pull over safely, let someone else drive, or wait until you have calmed down.</li>
        </ul>

        <h5>Environmental Conditions</h5>
        <p>Conditions inside and outside the vehicle can affect your ability to concentrate, remain courteous, and drive safely. Give yourself time to breathe and focus. Common environmental factors include:</p>
        <ul className="oe-attitude-factor-list">
          <li>Road conditions and construction</li>
          <li>Traffic</li>
          <li>Unfamiliar routes</li>
          <li>Loud music</li>
          <li>Doing other things while driving</li>
        </ul>

        <h5>Driving Traits</h5>
        <p>Drivers may copy the habits of family members. For example, a parent who speeds through traffic, drives erratically, or takes unnecessary risks can unintentionally teach a young driver that such behavior is acceptable. Emotional or behavioral conditions can also affect a person&apos;s driving ability.</p>

        <h5>Physical Conditions</h5>
        <p>Physical conditions can affect the way a person drives. A stiff neck or back problem, for example, can limit the ability to look around the vehicle and check for hazards.</p>
      </section>

      <aside className="oe-attitude-tip">
        <img src="/tipe.png" alt="Safety tip" />
        <p>Establishing good habits on the roadway requires repeated correct performance, proper training, attention, experience, practice, and more practice.</p>
      </aside>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function UndesirableDrivingBehaviorsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-behaviors-lesson">
      <LessonHeader title="2.5 Undesirable Driving Behaviors" onPrevious={onPrevious} onNext={onNext} />

      <p className="oe-behaviors-lead">The following are undesirable driving behaviors that can result in collisions.</p>

      <section className="oe-behavior-feature">
        <img src="/car1.png" alt="Angry driver behaving aggressively" />
        <div>
          <h4>Aggressiveness</h4>
          <p>Aggressive behavior causes collisions and raises tempers. It often involves neglecting the rules of the road, which can lead to traffic citations and dangerous situations. Aggressive drivers pose a serious risk to everyone using the roadway.</p>
        </div>
      </section>

      <div className="oe-video-wrap oe-behavior-video">
        <iframe src="https://www.youtube.com/embed/NUkklawULUA" title="World's Most Aggressive Drivers" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </div>

      <section className="oe-copy-section oe-behavior-copy-section">
        <h4>Egotism</h4>
        <ul>
          <li>Some drivers enter the roadway believing they are the best driver on the road. This overconfidence can raise tempers and interfere with sound judgment.</li>
          <li>Egotistical drivers may act as though they own the road and disregard the rights of other road users.</li>
          <li>They may speed, take unnecessary risks, make unsafe rapid starts, or behave aggressively.</li>
          <li>They may fail to make room for merging vehicles, ignore the right-of-way, block others from passing, follow emergency vehicles too closely, or merge too quickly or slowly and cut off other drivers.</li>
        </ul>

        <h4>Emotional Instability</h4>
        <p>Driving while angry or upset can result in aggressive behavior, poor judgment, and poor vehicle control. If you experience these feelings, do not drive until you have calmed down and can give the driving task your full attention.</p>
      </section>

      <section className="oe-copy-section oe-behavior-copy-section">
        <h4>Inattentiveness</h4>
        <div className="oe-behavior-media-row">
          <img src="/car2.png" alt="Distracted driver in a car" />
          <p>Failing to pay attention to the driving task and the environment around your vehicle can cause a collision. Even a moment of psychological or situational distraction may prevent you from reacting quickly to a hazard. Apply proper driving practices, look well ahead and down the roadway, and remain focused on driving.</p>
        </div>

        <h4>Exhibitionism</h4>
        <div className="oe-behavior-media-row">
          <img src="/car3.png" alt="Driver showing off with unsafe vehicle maneuvers" />
          <p>Do not show off by racing, peeling out, oversteering, or speeding. Such behavior creates an unsafe environment for others and violates the rules and regulations of the road.</p>
        </div>
      </section>

      <section className="oe-copy-section oe-irresponsibility-section">
        <h4>Irresponsibility</h4>
        <p>Irresponsible driving causes collisions, injuries, and deaths. Every driver must take this responsibility seriously because even a small error can have devastating consequences. Tailgating, speeding, cutting off other drivers, and weaving through traffic are all irresponsible behaviors.</p>
        <p>Your life and your passengers&apos; lives are in your hands while you drive. Impaired driving places many lives at risk. Think before you act or get behind the wheel.</p>
      </section>

      <section className="oe-copy-section oe-reckless-section">
        <h4>Reckless Driving and Street Racing (AB 2190)</h4>
        <p><em>Effective in 2007, California AB 2190 (Benoit) increased penalties when reckless driving or a motor-vehicle speed contest causes specified great bodily injury to another person.</em></p>
        <p>Depending on the offense and circumstances, penalties may include imprisonment and fines. The law made qualifying first-offense conduct punishable as either a felony or a misdemeanor.</p>
        <p>Specified injuries include:</p>
        <ul className="oe-reckless-injuries">
          <li>Loss of consciousness</li>
          <li>Concussion</li>
          <li>Bone fracture</li>
          <li>Protracted loss or impairment of a bodily member or organ</li>
          <li>A wound requiring extensive suturing</li>
          <li>Serious disfigurement</li>
          <li>Brain injury</li>
          <li>Paralysis</li>
        </ul>
      </section>

      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function ChapterTwoTestLesson({ onStart }) {
  return (
    <article className="oe-full-lesson oe-test-lesson">
      <div className="oe-test-title-row">
        <span>Chapter Assessment</span>
        <h3>2.6 Chapter 2</h3>
      </div>
      <section className="oe-test-card">
        <div className="oe-test-message">
          <h4>Congratulations!</h4>
          <p>You have completed the reading for Chapter 2. You&apos;ll need to get <strong>9 answers correct</strong> (out of 12) in order to proceed. <strong>Good luck!</strong></p>
        </div>
        <div className="oe-test-score"><strong>9 / 12</strong><span>Correct answers required</span></div>
        <button className="oe-test-start" type="button" onClick={onStart} aria-label="Start here and return to Chapter 2" aria-describedby="chapter-two-return-note">
          <img src="/start.png" alt="" aria-hidden="true" />
        </button>
        <img className="oe-quiz-image" src="/quize.png" alt="Chapter 2 quiz illustration" />
        <p className="oe-test-return-note" id="chapter-two-return-note">Select <button className="oe-test-return-link" type="button" onClick={onStart}>Start Here</button> to return to the Chapter 2 overview.</p>
      </section>
    </article>
  )
}
