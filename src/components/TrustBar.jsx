

const TRUST_ITEMS = [
  { text: 'DMV License #E4566', highlight: true },
  { text: 'Bonded & Insured' },
  { text: 'Instructing Since 1989', highlight: true },
  { text: '99% First-Attempt Pass Rate', highlight: true },
  { text: '4× Best of San Ramon Award', highlight: true },
  { text: 'Dual-Control Vehicles' },
  { text: 'Background-Checked Instructors' },
  { text: 'Free Pickup & Drop-Off' },
  { text: 'Open 7 Days a Week' },
  { text: 'San Ramon · Dublin · Danville' },
]

// duplicate for seamless infinite scroll
const ALL = [...TRUST_ITEMS, ...TRUST_ITEMS]

export default function TrustBar() {
  return (
    <section className="marquee-wrapper" aria-label="Why drivers trust A Precision Driving School">
      <ul className="sr-only">
        {TRUST_ITEMS.map(item => <li key={item.text}>{item.text}</li>)}
      </ul>
      <div className="marquee-track" aria-hidden="true">
        {ALL.map((item, i) => (
          <div key={i} className={`marquee-item${item.highlight ? ' highlight' : ''}`}>
            <span className="dot" />
            {item.text}
          </div>
        ))}
      </div>
    </section>
  )
}
