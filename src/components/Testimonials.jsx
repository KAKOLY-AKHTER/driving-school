import { useState, useEffect } from 'react'

const REVIEWS = [
  {
    name: 'Hamza Mian',
    text: 'I had a great time learning how to drive with the instructors. They are very knowledgeable with driving and passing the behind the wheel test.',
  },
  {
    name: 'Roop L.',
    text: 'I had a very positive experience with this driving school. My daughter had lessons with Raj, and she is a truly great instructor. Raj does a wonderful job helping students understand how to react to the car and the surrounding environment.',
  },
  {
    name: 'SimplyXenia',
    text: 'Working with Ken has been a very enjoyable experience!! He stays calm and collected while practicing with me. While still giving me helpful tips for the future.',
  },
  {
    name: 'Armaan',
    text: 'Had an excellent experience with A Precision Driving School. Definitely recommend if you are looking to learn driving and ace your exam. They taught me everything from starting the car to going on the freeway, and I am far more confident as a driver.',
  },
  {
    name: 'Mudassar Mujawar',
    text: 'I opted for 6 hours classes and time spent in each class was worth. Instructors were knowledgeable and professional throughout, appreciate the way driving skills were imparted during the classes.',
  },
  {
    name: 'Olivia Brandeis',
    text: 'Ken was a very patient and flexible instructor. He had lots of available times and even took me through the course before my driving test. I would highly recommend this service.',
  },
  {
    name: 'Shishir Bahubali',
    text: 'Really good driving school. I had Ken as my instructor all three times and he was very helpful. He was very good at explaining what I have to do and answering all my questions.',
  },
  {
    name: 'Aryav Dusara',
    text: 'The experience I had with a precision driving school was very good. The instructor was very helpful and was able to teach me how to drive without any prior experience on my part.',
  },
  {
    name: 'Mehek Saini',
    text: 'The driving instructors are super helpful and teach amazingly. They always answer questions specifically and point out and help you fix your mistakes. I 100% recommend.',
  }
]

export default function Testimonials() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActive(curr => (curr + 1) % REVIEWS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const review = REVIEWS[active]

  return (
    <section id="reviews" className="section-pad">
      <div className="container" style={{ maxWidth: '48rem' }}>
        
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
            <span className="gold-bar" style={{ width: '20px' }} />
            Student Reviews
            <span className="gold-bar" style={{ width: '20px' }} />
          </p>
        </div>

        <div className="reveal reveal-delay-2" style={{ position: 'relative', perspective: '1000px' }}>
          {/* Quote Mark */}
          <div style={{
            position: 'absolute', top: '-3rem', left: '50%', transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)', fontSize: '8rem', color: 'rgba(201,162,75,0.1)',
            lineHeight: 1, zIndex: 0
          }}>
            "
          </div>

          <div
            key={active}
            className="testi-fade-enter"
            style={{
              position: 'relative', zIndex: 1,
              textAlign: 'center',
              minHeight: '200px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {/* Stars */}
            <div className="stars" style={{ marginBottom: '2rem' }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>

            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
              color: 'var(--color-paper)',
              lineHeight: 1.5,
              marginBottom: '2.5rem'
            }}>
              "{review.text}"
            </p>

            <div className="eyebrow-gold">{review.name}</div>
          </div>
        </div>

        {/* Progress Bar Indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '3rem' }}>
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: active === i ? '24px' : '12px',
                height: '2px',
                backgroundColor: active === i ? 'var(--color-gold)' : 'var(--color-ink-muted)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
