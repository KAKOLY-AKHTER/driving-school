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
  return <div className="oe-bottom-nav"><button type="button" onClick={onPrevious}>&larr; Previous</button><button type="button" onClick={onNext}>Next &rarr;</button></div>
}

const BAC_ROWS = [
  ['0.02%–0.04% BAC', 'Relaxed, onset of impaired complex reaction time and divided attention.'],
  ['0.04% BAC', 'Impaired simple reaction time.'],
  ['0.05% BAC', 'Euphoric, relaxed and friendly; impaired tracking, skilled psychomotor tasks and oculomotor control.'],
  ['0.07%–0.08% BAC', 'Talkative, excited and sociable; impaired divided attention, information processing, steering, braking, speed control, lane tracking, gear changing and judgments of speed and distance.'],
  ['0.09%–0.10% BAC', 'Loss of physical coordination, slurred speech and loss of inhibitions; impaired concentrated attention and perception.'],
  ['0.12% BAC', 'Unrestrained behavior, lack of control and pronounced loss of judgment.'],
  ['0.20% BAC', 'Loss of alertness, onset of drowsiness and lethargy.'],
  ['0.30% BAC', 'Stupor or comatose state.'],
  ['0.40% BAC', 'Suppression of respiratory function; an erratic heartbeat can be fatal.'],
  ['0.50% BAC', 'Death is very likely to occur.'],
]

const DRINK_ROWS = [
  ['Manhattan', '1.15 oz. (34 ml)'],
  ['Dry Martini', '1.00 oz. (30 ml)'],
  ['Malt liquor—12 oz. (355 ml)', '0.71 oz. (21 ml)'],
  ['Airline miniature', '0.70 oz. (21 ml)'],
  ['Whiskey Sour/Highball', '0.60 oz. (18 ml)'],
  ['Table Wine—5 oz. (148 ml)', '0.55 oz. (16 ml)'],
  ['Beer—12 oz. (355 ml)', '0.54 oz. (16 ml)'],
  ['Reduced Alcohol Beer', '0.28 oz. (8 ml)'],
]

export function ChapterEightOverview({ lessons, onSelectLesson, onBegin }) {
  return (
    <article className="oe-chapter-eight-overview">
      <h3 className="oe-chapter-kicker">Chapter 8: Alcohol And Drugs And Driving</h3>
      <nav className="oe-chapter-eight-lessons" aria-label="Chapter 8 lessons">
        {lessons.map((lesson, index) => (
          <button type="button" onClick={() => onSelectLesson(index)} key={lesson}>
            <span>8.{index + 1}</span>
            <strong>{lesson === 'Test 8' ? 'Chapter 8 Test' : lesson}</strong>
            <span aria-hidden="true">&rarr;</span>
          </button>
        ))}
      </nav>
      <div className="oe-start-wrap"><button className="oe-start" type="button" onClick={onBegin}>Begin Lesson</button></div>
    </article>
  )
}

export function AlcoholAsDrugLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-alcohol-lesson">
      <LessonHeader title="8.1 Alcohol as a Drug" onPrevious={onPrevious} onNext={onNext} />
      <img className="oe-alcohol-image oe-alcohol-equation" src="/drugs1.png" alt="Car plus alcohol and drugs equals a police car" />
      <p><strong>All alcoholic beverages are drugs,</strong> a depressant that attacks the central nervous system and a poison which will take up to 24 hours to remove from the body from the time drinking has stopped. Alcohol is absorbed unchanged into the stomach and into the small intestines. It is promptly disseminated by the bloodstream to all parts of the body, including the brain.</p>
      <img className="oe-alcohol-image oe-alcohol-effects-image" src="/drugs2.png" alt="Effects of alcohol on the brain and body" />

      <section className="oe-alcohol-section">
        <p>The depressant effects of alcohol on the nervous system are proportional to the amount of alcohol in the blood.</p>
        <ul>
          <li>This is related to the quantity consumed, the length of time since drinking began, the time between drinks, the nature of the alcoholic beverage, the body weight of the person drinking and the speed of absorption.</li>
          <li>Absorption is delayed by the presence of food in the stomach and the concentration and nature of the alcoholic beverage.</li>
        </ul>
        <h4>Elimination process of alcohol from the body</h4>
        <p>About 90% to 95% of the alcohol is converted to carbon dioxide and water, a process that begins in the liver. The other 5% to 10% is excreted through the lungs and kidneys.</p>
        <p className="oe-alcohol-note"><strong>Note:</strong> Exercise, fresh air, cold showers, coffee or any other so-called “remedies” do not accelerate elimination of alcohol from the body system.</p>
      </section>

      <section className="oe-alcohol-section">
        <h4>Understanding Alcohol Levels</h4>
        <ul><li>You may not realize it, but there are different amounts of alcohol in various alcoholic beverages. Wine has a higher concentration of alcohol than beer, and liquor is much more concentrated than both. Because of these discrepancies, different amounts of each liquid are served in “one drink.”</li></ul>
        <img className="oe-alcohol-image oe-drink-level-image" src="/drugs3.png" alt="Alcohol content in common drink servings" />
        <ul>
          <li>In the United States, a single serving of alcohol is considered to have 0.6 ounces of ethanol. Typically, this amounts to 12 oz. of beer, 5 oz. of wine or 1.5 oz. of 80-proof liquor.</li>
          <li>These numbers can change depending on the strength of a specific wine, beer or liquor. Drivers cannot always base their intoxication level on how many drinks they have had; they must pay attention to how they are feeling as they consume their beverages.</li>
        </ul>
      </section>

      <section className="oe-alcohol-section">
        <h4>Stages of Alcohol Influence</h4>
        <p>An individual who continues to drink more rapidly than alcohol is eliminated from the body generally goes through the following stages:</p>
        <ol className="oe-alcohol-stages">
          <li>Mostly sober (hardly influenced)</li><li>Elation</li><li>Excitement</li><li>Confusion</li><li>Stupor</li><li>Unconsciousness</li><li>Death</li>
        </ol>
        <h4>Blood Alcohol Concentration (BAC)</h4>
        <ul>
          <li>BAC refers to the amount of alcohol contained in a person&apos;s blood.
            <ul><li>It is measured as weight per unit of volume and is usually expressed as a percentage.</li><li>Alcohol in the blood travels directly to the brain, affecting cognitive functioning and increasing the risk of injury.</li><li>A particularly significant risk is a motor vehicle crash caused by too great a concentration of alcohol.</li></ul>
          </li>
          <li>Studies show that the higher the BAC, the less accurate you are in assessing your own BAC level.</li>
        </ul>
        <div className="oe-alcohol-table-wrap">
          <table className="oe-alcohol-table">
            <thead><tr><th>BAC %</th><th>Description</th></tr></thead>
            <tbody>{BAC_ROWS.map(([level, description]) => <tr key={level}><td>{level}</td><td>{description}</td></tr>)}</tbody>
          </table>
        </div>
        <ul><li>BACs may vary widely.<ul><li>They will generally be higher for women than for men drinking the same quantities at the same rate.</li><li>People of the same sex drinking the same amount of alcohol can have very different BAC readings.</li><li>The same person drinking the same amount can reach different BACs on different occasions.</li></ul></li></ul>
      </section>

      <div className="oe-video-wrap oe-alcohol-video">
        <iframe src="https://www.youtube.com/embed/nAr8H5ZnkpU" title="It Takes Time—alcohol awareness" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </div>

      <section className="oe-alcohol-section">
        <h4>Testing Blood Alcohol Level</h4>
        <p>Measurement of the concentration of alcohol in the body is usually done with a blood test, a urine test or a breath test.</p>
        <h4>Zero Tolerance</h4>
        <ul>
          <li>Young drivers are at a higher risk of being involved in an alcohol-related crash. Research shows that more than 33 percent of all fatalities of 15- through 20-year-olds result from a motor vehicle crash and, of these, more than 35 percent are alcohol-related.</li>
          <li>Impaired driving poses a significant threat for drivers under age 21. Zero-tolerance laws use stricter standards for underage drivers because of their increased crash risk at low BAC levels. Penalties can include license suspension or revocation, significant fines and community service.</li>
        </ul>
        <h4>How Alcohol Affects Driving and Similar Skills</h4>
        <ul>
          <li><strong>Slowed reaction time</strong><ul><li>Even small quantities of alcohol affect driving ability. You may react more slowly when something unexpected happens.</li></ul></li>
          <li><strong>Poor judgment</strong><ul><li>You may have trouble judging your speed, the speed of other vehicles and distances.</li></ul></li>
          <li><strong>Impaired vision and hearing</strong><ul><li>Drivers tend to focus straight ahead and neglect side vision. They may miss vehicles, pedestrians, warning bells or horns.</li></ul></li>
          <li><strong>Poor coordination</strong></li>
          <li>You may have trouble doing more than one thing at a time, especially in an emergency.</li>
          <li><strong>False sense of confidence</strong><ul><li>You may feel more confident but be less able to cope with unexpected events.</li><li>You may take risks you would not normally take.</li><li>Tolerance to alcohol&apos;s sedative effects does not remove the impairment of driving skills.</li><li>Effects can be dangerous and unpredictable when alcohol is combined with medicines or other drugs.</li></ul></li>
        </ul>
      </section>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function AlcoholHumanBodyLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-alcohol-lesson oe-alcohol-body-lesson">
      <LessonHeader title="8.2 Alcohol and the Human Body" onPrevious={onPrevious} onNext={onNext} />
      <p className="oe-alcohol-body-intro">In moderation, alcohol is pleasant and relaxing; it may even, according to some research, be beneficial. One small glass of whiskey taken each day is said to help control arteriosclerosis, but the benefits are lost if more is consumed.</p>

      <section className="oe-alcohol-section">
        <h4>Alcohol&apos;s Properties</h4>
        <ul>
          <li>Alcohol is a general term denoting a family of organic chemicals with common properties. Members of this family include ethanol, methanol, isopropanol and others.</li>
          <li>Alcohol (ethanol) is a clear, volatile liquid that burns (oxidizes) easily. It has a slight, characteristic odor and is very soluble in water. Alcohol is an organic compound composed of carbon, oxygen and hydrogen. Its chemical formula is C2H5OH.</li>
          <li>Alcohol is a central nervous system depressant. This body system is the most severely affected by alcohol. The degree of impairment is directly proportional to the concentration of alcohol in the blood.</li>
          <li>When ingested, alcohol passes from the stomach into the small intestine, where it is rapidly absorbed into the blood and distributed throughout the body. As blood alcohol concentration increases, response to stimuli decreases, speech becomes slurred and walking becomes unsteady. At very high concentrations a person can become comatose and die.</li>
          <li>The American Medical Association has defined the blood alcohol concentration level of impairment for all people to be 0.04 grams per 100 milliliters of blood.</li>
        </ul>
      </section>

      <section className="oe-alcohol-section">
        <h4>Absorption</h4>
        <p>Alcohol is absorbed from all parts of the gastrointestinal tract largely by simple diffusion into the blood. The small intestine is by far the most efficient region for alcohol absorption because of its very large surface area.</p>
        <h4>Distribution</h4>
        <p>Alcohol has a high affinity for water and is therefore found in body tissues and fluids. Absorbed alcohol is rapidly carried throughout the body in the blood. Once absorption is complete, the blood at all points in the system contains approximately the same concentration of alcohol.</p>
        <h4>Elimination</h4>
        <p>The liver is responsible, through metabolism, for eliminating about 95% of ingested alcohol. The remainder is eliminated through breath, urine, sweat and other body fluids. As a rule of thumb, a person eliminates one average drink or about 0.5 oz. (15 ml) of alcohol per hour.</p>
        <ul><li>The rate of elimination tends to be higher when blood alcohol concentration is very high.</li><li>Chronic alcoholics may metabolize alcohol at a significantly higher rate than average.</li><li>The body&apos;s ability to metabolize alcohol quickly tends to diminish with age.</li></ul>
      </section>

      <section className="oe-alcohol-section">
        <h4>Body Weight and Body Type</h4>
        <p>In general, the less you weigh, the more you will be affected by a given amount of alcohol. Because alcohol has a high affinity for water, the larger of two similarly built people will generally have a lower alcohol concentration after the same amount. For people of the same weight, a well-muscled individual is usually less affected than someone with a higher percentage of fat.</p>
        <h4>Rate of Consumption</h4>
        <p>Blood alcohol concentration depends on the amount consumed and the rate at which the body metabolizes alcohol. Drinking faster than the rate of elimination produces a cumulative effect and increasing blood alcohol concentration.</p>
        <h4>Alcohol Content</h4>
        <p>It is not the number of drinks you have but how much alcohol you consume. Some drinks are more potent than others.</p>
        <p className="oe-drink-table-caption">Alcohol Content of Some Typical Drinks</p>
        <div className="oe-alcohol-table-wrap oe-drink-table-wrap">
          <table className="oe-alcohol-table oe-drink-table">
            <thead><tr><th>Drink</th><th>Alcohol Content</th></tr></thead>
            <tbody>{DRINK_ROWS.map(([drink, content]) => <tr key={drink}><td>{drink}</td><td>{content}</td></tr>)}</tbody>
          </table>
        </div>
        <p>The concentration of drinks can slightly affect peak blood alcohol concentration because different concentrations are absorbed at different rates.</p>
        <ul><li>Alcohol is most rapidly absorbed when the concentration of the drink is between 10% and 30%.</li><li>Below 10%, the concentration gradient in the gastrointestinal tract is low.</li><li>Concentrations above 30% can irritate the gastrointestinal tract and delay gastric emptying.</li></ul>
      </section>

      <section className="oe-alcohol-section">
        <h4>Food</h4>
        <p>When food is taken with alcohol, it results in a lower and delayed peak blood alcohol concentration.</p>
        <ul><li>Because alcohol is absorbed most efficiently in the small intestine, food can slow its absorption into the system.</li><li>Lower alcohol concentration due to food can allow the body to eliminate absorbed alcohol more efficiently.</li></ul>
        <h4>Medication</h4>
        <p>Alcohol&apos;s effects can increase when you are taking medication. Always consult your physician or the medical information supplied with the medication and understand the possible effects of combining it with alcohol.</p>
        <h4>Fatigue</h4>
        <p>Fatigue causes many of the same symptoms as alcohol intoxication. These symptoms are amplified when fatigue and alcohol intoxication occur together.</p>
        <h4>Tolerance</h4>
        <p>Tolerance is the reduction of a drug&apos;s effectiveness after prolonged or heavy use. At least two types work with alcohol:</p>
        <ul><li><strong>Metabolic tolerance:</strong> chronic users may metabolize alcohol more rapidly and achieve lower peak blood alcohol concentrations from the same amount.</li><li><strong>Functional tolerance:</strong> changes in an organ or system&apos;s sensitivity can allow chronic users to show greater tolerance than an average person, without making driving safe.</li></ul>
        <h4>Gender Differences</h4>
        <ul><li>Women often have a higher percentage of body fat and lower percentage of body water. A man and woman of the same weight consuming the same amount may therefore reach different alcohol concentrations.</li><li>Studies indicate that elimination rates may also differ between men and women.</li></ul>
        <h4>Age</h4>
        <p>Total body water tends to decrease with age, so an older person may be more affected by alcohol.</p>
      </section>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function AlcoholBodyOrgansLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-alcohol-organs-lesson">
      <LessonHeader title="8.3 Effects of Alcohol on the Body Organs" onPrevious={onPrevious} onNext={onNext} />
      <section className="oe-organ-feature">
        <div>
          <h4>Cirrhosis of the Liver</h4>
          <p>Alcohol acts on the nervous system and the brain, first as a stimulant, then if more alcohol is consumed, as a depressant. Inside the body, alcohol is detoxified or broken down into harmless compounds by the liver. In the process, liver cells are destroyed. Normally, the liver replaces these cells quickly, but if an excessive amount of alcohol is drunk every day, the liver is unable to repair the damage. The result is a progressive and finally fatal condition called cirrhosis of the liver.</p>
        </div>
        <img src="/effect.png" alt="Cirrhosis damage to the liver" />
      </section>
      <section className="oe-organ-effects">
        <h4>Pancreatitis</h4>
        <p>Alcohol can also cause a fatal disease of the pancreas called pancreatitis, which may occur suddenly or develop gradually.</p>
        <h4>Neuropathy</h4>
        <p>This condition is a progressive and debilitating disease of the nerves. Alcohol through its action on the nervous system may cause this condition.</p>
        <h4>Cardiomyopathy</h4>
        <p>This condition results in damage to the muscle of the heart, leading to heart failure. Excessive alcohol consumption may contribute to this condition.</p>
        <h4>Ulcers and Anemia</h4>
        <p>Alcohol also increases the risk of peptic ulcers and cancer of the digestive tract. Heavy drinking may also lead to vitamin deficiencies, especially of folic acid and vitamin B, which can cause anemia.</p>
        <h4>Vision</h4>
        <p>Alcohol usually has a relaxing effect, resulting in less voluntary control over all general body musculature. The delicate control of the fine discrete muscles that move and focus our eyes is particularly affected by alcohol. Light enters the eye through the pupil and passes through the lens. Anything that interferes with this operation affects the impulses transmitted to the brain and the clarity of the picture interpreted by the brain. When the brain receives a fuzzy picture, it is unable to make an appropriate response to the traffic scene.</p>
        <h4>The effects of alcohol on a driver</h4>
        <ul>
          <li>Reduces control over light entering the eye</li>
          <li>Distorts the eye&apos;s focusing ability</li>
          <li>Reduces visual acuity</li>
          <li>Causes double vision</li>
          <li>Affects the ability to judge distances</li>
          <li>Reduces the driver&apos;s peripheral vision</li>
          <li>Reduces the eye&apos;s ability to distinguish colors</li>
          <li>Reduces visibility at night</li>
        </ul>
      </section>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function IdentifyingDrunkDriversLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-identifying-drivers-lesson">
      <LessonHeader title="8.4 Identifying Drunk Drivers" onPrevious={onPrevious} onNext={onNext} />
      <section className="oe-drunk-driver-content">
        <p>Even if you do not drink, you may still become the unfortunate victim of a drunk driver. By learning to spot the warning signs, the chances of you becoming involved in an alcohol-related motor vehicle collision are diminished. The following are usually the signs of a drunk driver on the roadway:</p>
        <ul className="oe-drunk-driver-signs">
          <li>Makes unusually wide or illegal turns.</li>
          <li>Straddles the centerline or lane marker.</li>
          <li>Drives with one&apos;s head out of the window or with the window down in cold weather.</li>
          <li>Nearly strikes objects or other vehicles.</li>
          <li>Often weaves or swerves.</li>
          <li>Drives on other than the designated roadway.</li>
          <li>Uses excessive speed.</li>
          <li>Drives at a very slow rate of speed.</li>
          <li>Stops for no apparent cause.</li>
          <li>Follows too closely.</li>
          <li>Drifts from one lane to another.</li>
          <li>Rides with tires on the center lane or road marker.</li>
          <li>Uses erratic braking patterns.</li>
          <li>Drives into opposing or crossing traffic.</li>
          <li>Responds slowly to traffic signals.</li>
          <li>Uses rapid acceleration or deceleration.</li>
          <li>Drives with headlights off at night.</li>
        </ul>
        <div className="oe-call-911">
          <img src="/call.png" alt="Call 911" />
          <p>If you see an apparent drunk driver on the road, give them a lot of space, as their driving is very unpredictable. Call 911 and report drunk drivers before they have a chance to kill or injure someone!</p>
        </div>
      </section>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function DrinkingDrivingAlternativesLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-drinking-alternatives-lesson">
      <LessonHeader title="8.5 Alternatives to Drinking and Driving" onPrevious={onPrevious} onNext={onNext} />
      <section className="oe-alternatives-intro">
        <img src="/drink.png" alt="Do not drink and drive" />
        <p>You should <strong>NEVER</strong> get behind the wheel if you have been drinking! There are many alternatives! Is it really worth the risk of losing your license, or risking injuring yourself or others?</p>
      </section>
      <section className="oe-alternatives-section">
        <h4>Possible solutions</h4>
        <ul>
          <li>Public education<ul><li>Being aware of the effects of alcohol and drugs on the body and driving.</li></ul></li>
          <li>Abstinence<ul><li>Sustain from drinking before driving is an obvious solution, but drinking is so widespread and socially acceptable in our society that many drivers will not follow this course.</li></ul></li>
        </ul>
      </section>
      <section className="oe-alternatives-section">
        <h4>Alternatives to Drinking and Driving</h4>
        <ul>
          <li>The best alternative to drinking and driving is to not drive after having consumed the slightest amount of alcohol.</li>
          <li>Take a taxi, walk, or set aside a designated driver.</li>
          <li>Designated Driver<ul><li>A designated driver is a non-drinker selected to drive the drinkers home safely.</li><li>This person can participate in the evening events, just not drink alcoholic beverages.</li><li>Many bars and restaurants provide free soft drinks to designated drivers.</li></ul></li>
          <li>Use Alternate Means of Transportation<ul><li>Use taxis, buses or other driving services, including calling a friend or family member to drive you home.</li><li>They would rather have you safe and alive and be inconvenienced by picking you up than have to identify your body at the morgue, or pay a bail bondsman to get you out of jail.</li></ul></li>
        </ul>
      </section>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function DrugsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-drugs-lesson">
      <LessonHeader title="8.6 Drugs" onPrevious={onPrevious} onNext={onNext} />
      <section className="oe-drugs-intro">
        <img src="/caution1.png" alt="Medication side-effects caution sign" />
        <p>Both prescription and non-prescription drugs can alter your ability to drive safely. <strong>DO NOT</strong> operate a vehicle if using non-prescription (illegal) and even some prescription drugs!</p>
      </section>

      <section className="oe-drugs-section">
        <h4>Effects of Drugs on Driving</h4>
        <div className="oe-drugs-effects-media">
          <img src="/caution2.png" alt="Drugs are deadly warning" />
          <p>You must never drive while under the influence of any illicit non-prescription drugs. The effects of illicit drugs can make a person incapable of safely operating a motor vehicle. It is a criminal offense to carry an illicit drug on your body or in your vehicle. Drugs kill. Drugs and driving do not mix.</p>
        </div>
        <h4>First time use</h4>
        <p>A person should not drive a motor vehicle when using or trying a prescribed or over-the-counter drug for the first time. Because the effects are unknown, the drug may produce symptoms that make driving unsafe. Even when a physician says it should be safe to drive, a drug may affect each person differently.</p>
        <h4>Do Not Mix Drugs and Alcohol</h4>
        <p>Do not mix two drugs without consulting your physician and pharmacist. Two drugs may be safe separately but deadly when combined. Their interaction can cause adverse effects that make driving unsafe. It is also not advisable to drink alcohol while taking prescription or over-the-counter drugs.</p>
      </section>

      <section className="oe-drugs-section">
        <h4>Different Types of Drugs</h4>
        <h5>Prescription Drugs</h5>
        <p>Even a mild prescription drug can cause you to lose balance, concentration and responsiveness. Anyone taking medication must be aware of its side effects and consult a doctor or pharmacist about the medication being taken.</p>
        <h5>Analgesics (Painkillers)</h5>
        <p>Pain-relieving drugs can be administered as tablets, injections or inhaled gas. Aspirin is a common analgesic, while powerful and highly addictive opioid painkillers include codeine and morphine.</p>
        <h5>Antihistamines</h5>
        <p>Antihistamines may be used to treat allergies, insect bites, nausea and vomiting. They can have significant side effects and should be taken only as directed. Effects on driving can include:</p>
        <ul><li>Inattention</li><li>Drowsiness</li><li>Confusion</li><li>Blurred vision</li><li>Dizziness</li></ul>
        <h5>Over-the-counter drugs (OTC)</h5>
        <p>OTC drugs can be purchased without a prescription. Cough syrups, drops, sprays, headache tablets, hay-fever, cold, allergy and diet medicines can be dangerous when misused. Effects on driving can include:</p>
        <ul><li>Drowsiness</li><li>Dizziness</li><li>Slowed reaction</li><li>Irritability</li><li>Faulty judgment</li><li>Blurred vision</li><li>Impaired depth perception</li></ul>
      </section>

      <section className="oe-drugs-section oe-illegal-drugs-section">
        <h4>Illegal Drugs</h4>
        <p>It is a violation of the law to purchase, use or possess illegal drugs. Combining these substances with driving is also a violation of the law.</p>
        <h5>Depressants</h5>
        <p>Depressants or sedative-hypnotic drugs include tranquilizers, sleeping pills, anesthetics and some antihistamines. They depress the central nervous system and are often called “downers.”</p>
        <ul>
          <li><strong>Barbiturates</strong> slow body and mind reactions, cause sleep or unconsciousness, and reduce response time needed for safe driving.</li>
          <li><strong>Benzodiazepines</strong> can cause sedation, slurred speech and dizziness. Although commonly prescribed under medical care, they may also be misused.</li>
        </ul>
        <h5>Stimulants</h5>
        <p>Stimulants temporarily increase mental or physical function and are often called “uppers.” They may increase alertness, wakefulness and locomotion, but can dangerously cloud judgment.</p>
        <ul>
          <li>Amphetamines and methylphenidates can cause dizziness, confusion, euphoria, increased motor and speech activity, psychosis and hallucinations.</li>
          <li>Cocaine rapidly affects the central nervous system. Its effects resemble those of amphetamines and can also include local anesthetic effects.</li>
        </ul>
        <h5>Narcotics</h5>
        <p>Narcotic analgesics are commonly called opioids. Common adverse effects include nausea, vomiting, dizziness, mental clouding and dysphoria.</p>
        <h5>Hallucinogens</h5>
        <p>Hallucinogens produce mental illusions that users may interpret as real. A driver with distorted perception may swerve to avoid a hallucination and endanger everyone on the roadway.</p>
        <ul className="oe-hallucinogen-list">
          <li><strong>LSD or ecstasy:</strong> LSD is rapidly absorbed and its psychic effects can begin soon after use.</li>
          <li><strong>Psilocybin/Psilocin:</strong> “Magic mushrooms” can increase heart rate and body temperature, dilate pupils and produce vivid visual imagery.</li>
          <li><strong>Morning glory seeds:</strong> may cause euphoria, sedation and hallucinations.</li>
          <li><strong>DOM/STP:</strong> can produce LSD-like physical and psychic effects lasting several hours.</li>
          <li><strong>Belladonna alkaloids:</strong> can cause delirium, disorientation, restlessness, irritability, confusion and loss of coordination.</li>
          <li><strong>PCP:</strong> can cause extreme disorientation, agitation and hallucinations; abuse may be fatal.</li>
          <li><strong>Marijuana:</strong> can alter time perception, attention, short-term memory, thought patterns and sensory awareness. Higher doses can cause depersonalization and marked sensory distortion.</li>
        </ul>
        <h4>Think Smart</h4>
        <img className="oe-think-smart-image" src="/caution3.png" alt="Crash scene with a do not drink and drive warning" />
      </section>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function DuiLawsLesson({ onPrevious, onNext }) {
  return (
    <article className="oe-full-lesson oe-dui-laws-lesson">
      <LessonHeader title="8.7 DUI laws" onPrevious={onPrevious} onNext={onNext} />
      <section className="oe-dui-section">
        <p><strong>Driving Under the Influence.</strong> Beginning January 1, 2012, courts can order a 10-year driver-license revocation for a California motorist convicted of a third or subsequent DUI violation, with possible reinstatement after five years if specified conditions are met. (AB 1601, Hill)</p>
        <p><strong>Sobriety checkpoints.</strong> Drivers are required to stop and submit to a sobriety checkpoint. A vehicle generally may not be impounded for 30 days solely because its driver fails to hold a valid license; officers must make a reasonable attempt to identify the registered owner so the vehicle can be released. (AB 353, Cedillo)</p>
        <p><strong>Implied consent for chemical testing.</strong> Persons lawfully arrested for DUI are subject to chemical testing. Urine testing is permitted only under specific circumstances.</p>
        <p><em>California Vehicle Code</em> (CVC) §23612, “implied consent for chemical testing,” requires a blood or breath chemical test when a person is lawfully arrested for DUI involving drugs, or a combination of drugs and alcohol. A urine chemical test is permitted only when:</p>
        <ul><li>Both blood and breath tests are unavailable.</li><li>The individual is a hemophiliac.</li><li>The individual is taking anticoagulant medication.</li></ul>
      </section>
      <section className="oe-iid-faq" aria-label="Ignition interlock device questions">
        <article><h4>1. Question: What is an IID?</h4><p><strong>Answer:</strong> An ignition interlock device is wired to a vehicle&apos;s ignition and requires a breath sample before the engine starts. If alcohol is detected, the engine will not start. The device may request periodic breath samples while the vehicle is being driven.</p></article>
        <article><h4>2. Question: What is the purpose of the IID pilot program?</h4><p><strong>Answer:</strong> Its purpose is to reduce DUI offenses and provide DMV with data that can be used to evaluate the effectiveness of ignition interlock devices.</p></article>
        <article><h4>3. Question: What are the requirements of the IID pilot program?</h4><p><strong>Answer:</strong> Individuals covered by the program must install an IID on every vehicle they own or drive, provide DMV with the required installation verification, pay applicable administrative fees and meet all other reinstatement requirements before a license can be reinstated, reissued or restricted.</p></article>
        <article><h4>4. Question: Which four counties are involved in the IID pilot program?</h4><p><strong>Answer:</strong> The pilot program includes Alameda, Los Angeles, Sacramento and Tulare Counties.</p></article>
      </section>
      <LessonFooter onPrevious={onPrevious} onNext={onNext} />
    </article>
  )
}

export function ChapterEightTestLesson({ onStart }) {
  return (
    <article className="oe-full-lesson oe-test-lesson oe-chapter-four-test oe-chapter-eight-test">
      <h3>8.8 Chapter 8</h3>
      <section className="oe-chapter-four-test-card">
        <p><strong>Congratulations!!</strong> You have completed the reading for chapter 8. You&apos;ll need to get 9 answers correct (out of 12) in order to proceed. <strong>Good luck!</strong></p>
        <button className="oe-chapter-four-test-start" type="button" onClick={onStart} aria-label="Start here and return to Chapter 8">
          <img src="/start.png" alt="Start Here" />
        </button>
        <img className="oe-chapter-four-quiz-image" src="/quize.png" alt="Chapter 8 quiz illustration" />
      </section>
    </article>
  )
}
