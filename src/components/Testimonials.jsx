import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

const DEFAULT_REVIEWS = [
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
  },
]

const FIVE_STARS = [0, 1, 2, 3, 4]
const GOLD = '#FDBC01'
const SKY_BLUE = '#0145A8'
const BG = '#F8FAFD'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'

function getIndices(active, total) {
  const prev = (active - 1 + total) % total
  const next = (active + 1) % total
  return [prev, active, next]
}

function CoverCard({ review, position, isPaused }) {
  const isCenter = position === 'center'

  const baseStyle = {
    background: '#ffffff',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${isCenter ? 'rgba(253,188,1,0.25)' : 'rgba(1,69,168,0.06)'}`,
    borderTop: isCenter ? `4px solid ${GOLD}` : '4px solid rgba(1,69,168,0.08)',
    padding: isCenter ? '2.5rem 2rem 2rem' : '1.5rem 1.2rem 1.2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
    flexShrink: 0,
    ...(isCenter
      ? {
          width: '100%',
          maxWidth: '520px',
          minHeight: '420px',
          boxShadow: '0 25px 70px rgba(1,69,168,0.12), 0 8px 24px rgba(253,188,1,0.08)',
          transform: 'scale(1)',
          opacity: 1,
          zIndex: 3,
        }
      : {
          width: '100%',
          maxWidth: '320px',
          minHeight: '320px',
          boxShadow: '0 8px 30px rgba(1,69,168,0.05)',
          transform: 'scale(0.82)',
          opacity: 1,
          zIndex: 1,
        }),
  }

  return (
    <div style={baseStyle} aria-hidden={!isCenter}>
      {isCenter && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-8px',
            right: '12px',
            fontFamily: 'var(--font-display)',
            fontSize: '10rem',
            lineHeight: 1,
            color: 'rgba(253,188,1,0.06)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          &ldquo;
        </div>
      )}

      <div
        className={`testi-quote-circle${isPaused ? ' paused' : ''}`}
        style={{
          width: isCenter ? '56px' : '40px',
          height: isCenter ? '56px' : '40px',
          borderRadius: '50%',
          background: isCenter
            ? `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_BRIGHT} 100%)`
            : 'rgba(1,69,168,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: isCenter ? '1.2rem' : '0.8rem',
          color: isCenter ? '#ffffff' : SKY_BLUE,
          flexShrink: 0,
        }}
      >
        <svg width={isCenter ? 24 : 18} height={isCenter ? 24 : 18} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 .001 0 .001 0 0z" />
        </svg>
      </div>

      <div style={{ display: 'flex', gap: '3px', marginBottom: isCenter ? '1rem' : '0.6rem' }}>
        {FIVE_STARS.map((i) => (
          <svg key={i} width={isCenter ? 18 : 13} height={isCenter ? 18 : 13} viewBox="0 0 24 24" fill={i < (Number(review.rating) || 5) ? GOLD : '#D8E0EA'}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>

      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: isCenter ? 'clamp(0.95rem, 1.5vw, 1.1rem)' : '0.78rem',
          color: isCenter ? '#2d3748' : '#5a6a7a',
          lineHeight: isCenter ? 1.7 : 1.55,
          marginBottom: isCenter ? '1.5rem' : '0.8rem',
          fontStyle: 'italic',
          maxWidth: isCenter ? '460px' : '260px',
          position: 'relative',
          zIndex: 1,
          flex: 1,
        }}
      >
        &ldquo;{review.text}&rdquo;
      </p>

      {isCenter && (
        <div
          style={{
            width: '50px',
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            marginBottom: '0.8rem',
          }}
        />
      )}

      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: isCenter ? '0.7rem' : '0.58rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: isCenter ? GOLD_DEEP : '#8899aa',
          fontWeight: 700,
        }}
      >
        {review.name}
      </div>
    </div>
  )
}

export default function Testimonials() {
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS)
  const [active, setActive] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const total = reviews.length

  const timerRef = useRef(null)

  useEffect(() => {
    let activeRequest = true
    api.getReviews()
      .then(data => {
        if (!activeRequest || !Array.isArray(data)) return
        setReviews(data)
        setActive(0)
      })
      .catch(() => {})
    return () => { activeRequest = false }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (reviews.length > 0 && !isPaused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timerRef.current = setInterval(() => {
        setActive((curr) => (curr + 1) % reviews.length)
      }, 4000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isPaused, reviews.length])

  if (!total) return null

  const [prevIdx, centerIdx, nextIdx] = getIndices(active, total)

  return (
    <>
      <style>{`
        @keyframes testiProgressShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes testiPulseGold {
          0%, 100% { box-shadow: 0 4px 14px rgba(253,188,1,0.25); }
          50% { box-shadow: 0 6px 22px rgba(253,188,1,0.5); }
        }
        .testi-quote-circle {
          animation: testiPulseGold 2.5s ease-in-out infinite;
        }
        .testi-quote-circle.paused {
          animation-play-state: paused;
        }
        .testi-progress-track {
          width: 100%;
          max-width: 180px;
          height: 3px;
          background: rgba(1,69,168,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .testi-progress-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, ${GOLD}, ${GOLD_BRIGHT});
          animation: testiProgressShrink ${isPaused ? '0s' : '4s'} linear forwards;
        }
        .testi-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: rgba(1,69,168,0.12);
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
          padding: 0;
        }
        .testi-dot:hover {
          background: rgba(1,69,168,0.25);
          transform: scale(1.25);
        }
        .testi-dot.active {
          background: ${GOLD};
          width: 36px;
          border-radius: 5px;
          border-color: ${GOLD_DEEP};
          box-shadow: 0 2px 10px rgba(253,188,1,0.45);
        }
        .testi-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, ${GOLD_DEEP}, transparent);
        }
        .testi-section::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, ${GOLD_DEEP}, transparent);
        }
        .testi-coverflow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
          perspective: 1200px;
        }
        .testi-side-card {
          transition: all 0.7s cubic-bezier(0.22,1,0.36,1);
          flex-shrink: 1;
          min-width: 0;
        }
        .testi-center-card {
          transition: all 0.7s cubic-bezier(0.22,1,0.36,1);
          flex-shrink: 0;
          z-index: 3;
        }
        @media (max-width: 900px) {
          .testi-coverflow {
            gap: 0.5rem;
            min-height: 340px !important;
          }
          .testi-side-card {
            display: none;
          }
        }
      `}</style>

      <section
        id="reviews"
        className="testi-section section-pad"
        style={{
          background: BG,
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false)
        }}
        role="region"
        aria-label="Customer testimonials carousel"
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'var(--font-display)',
            fontSize: '30rem',
            lineHeight: 1,
            color: 'rgba(1,69,168,0.018)',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 0,
          }}
        >
          &ldquo;
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: GOLD_DEEP,
                fontWeight: 700,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.8rem',
              }}
            >
              <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD})`, display: 'inline-block' }} />
              Testimonials
              <span style={{ width: '24px', height: '2px', background: `linear-gradient(90deg, ${GOLD}, transparent)`, display: 'inline-block' }} />
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                color: SKY_BLUE,
                marginBottom: '0.5rem',
                fontWeight: 800,
              }}
            >
              Customer Testimonials
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'clamp(0.85rem, 1.5vw, 1rem)',
                color: '#5a6a7a',
                maxWidth: '30rem',
                marginInline: 'auto',
              }}
            >
              A Precision Driving School (Lic#E4566)
            </p>
          </div>

          <div
            className="testi-coverflow"
            style={{ minHeight: '440px' }}
          >
            <div className="testi-side-card" style={{ flex: '0 0 28%' }}>
              <CoverCard review={reviews[prevIdx]} position="left" isPaused={isPaused} />
            </div>
            <div className="testi-center-card" style={{ flex: '0 0 44%' }}>
              <CoverCard review={reviews[centerIdx]} position="center" isPaused={isPaused} />
            </div>
            <div className="testi-side-card" style={{ flex: '0 0 28%' }}>
              <CoverCard review={reviews[nextIdx]} position="right" isPaused={isPaused} />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
              marginTop: '3rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {reviews.map((review, i) => (
                <button
                  key={review._id || `${review.name}-${i}`}
                  onClick={() => setActive(i)}
                  className={`testi-dot${active === i ? ' active' : ''}`}
                  aria-label={`Go to testimonial ${i + 1}`}
                  aria-current={active === i ? 'true' : undefined}
                />
              ))}
            </div>

            <div className="testi-progress-track">
              <div
                key={`progress-${active}-${isPaused}`}
                className="testi-progress-fill"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
