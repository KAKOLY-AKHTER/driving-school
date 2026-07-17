import { useEffect, useRef, useState } from 'react'

export default function StatCounter({ end, suffix = '', label, duration = 1800, prefix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const hasRun = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setCount(end); return }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true
          const startTime = performance.now()
          const animate = (now) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * end))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [end, duration])

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
        fontWeight: 700,
        color: 'var(--color-gold-bright)',
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}>
        {prefix}{count}{suffix}
      </div>
      <div className="eyebrow" style={{ textAlign: 'center', lineHeight: 1.4 }}>
        {label}
      </div>
    </div>
  )
}
