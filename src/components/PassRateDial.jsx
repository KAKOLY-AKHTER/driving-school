import { useEffect, useState, useRef } from 'react'

export default function PassRateDial({ percent = 99, size = 240 }) {
  const [animated, setAnimated] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const hasRun = useRef(false)
  const containerRef = useRef(null)
  const DURATION = 1800

  const cx = size / 2
  const cy = size / 2
  const strokeWidth = size * 0.052
  const radius = size / 2 - strokeWidth * 1.9
  const circumference = 2 * Math.PI * radius

  const GAP_DEG = 130
  const ARC_DEG = 360 - GAP_DEG
  const startAngle = 90 + GAP_DEG / 2
  const rotation = startAngle - 90
  const toRad = (deg) => (deg * Math.PI) / 180

  const fill = (animated / 100) * (ARC_DEG / 360)
  const fillLen = circumference * fill

  // Ticks
  const TICKS = 24
  const ticks = Array.from({ length: TICKS }, (_, i) => {
    const angle = startAngle + (ARC_DEG / (TICKS - 1)) * i
    const rad = toRad(angle)
    const isMajor = i % 4 === 0
    const innerR = radius - (isMajor ? strokeWidth * 1.3 : strokeWidth * 0.65)
    const outerR = radius + strokeWidth * 0.08
    return {
      x1: cx + innerR * Math.cos(rad),
      y1: cy + innerR * Math.sin(rad),
      x2: cx + outerR * Math.cos(rad),
      y2: cy + outerR * Math.sin(rad),
      isMajor,
      progress: i / (TICKS - 1),
    }
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setAnimated(percent); return }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true
          startRef.current = null
          const animate = (ts) => {
            if (!startRef.current) startRef.current = ts
            const elapsed = ts - startRef.current
            const progress = Math.min(elapsed / DURATION, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setAnimated(eased * percent)
            if (progress < 1) rafRef.current = requestAnimationFrame(animate)
          }
          const timer = setTimeout(() => {
            rafRef.current = requestAnimationFrame(animate)
          }, 200)
          return () => clearTimeout(timer)
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [percent])

  // Endpoint position for glow dot
  const endAngle = startAngle + (ARC_DEG * (animated / 100))
  const endRad = toRad(endAngle)
  const endX = cx + radius * Math.cos(endRad)
  const endY = cy + radius * Math.sin(endRad)

  return (
    <div ref={containerRef} style={{ display: 'inline-block', position: 'relative' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`${percent}% DMV first-attempt pass rate`}
        role="img"
        style={{ display: 'block', filter: 'drop-shadow(0 0 24px rgba(253,188,1,0.12))' }}
      >
        {/* Outer ring subtle */}
        <circle
          cx={cx} cy={cy} r={radius + strokeWidth * 1.4}
          fill="none"
          stroke="rgba(42,47,55,0.6)"
          strokeWidth={0.5}
        />

        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#1A1E24"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference * (ARC_DEG / 360)} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="butt"
          transform={`rotate(${rotation}, ${cx}, ${cy})`}
        />

        {/* Gold glow shadow layer */}
        {animated > 0 && (
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="rgba(253,188,1,0.18)"
            strokeWidth={strokeWidth + 6}
            strokeDasharray={`${fillLen} ${circumference}`}
            strokeLinecap="butt"
            transform={`rotate(${rotation}, ${cx}, ${cy})`}
          />
        )}

        {/* Main gold arc */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${fillLen} ${circumference}`}
          strokeLinecap="butt"
          transform={`rotate(${rotation}, ${cx}, ${cy})`}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8A6B2E" />
            <stop offset="60%" stopColor="#FDBC01" />
            <stop offset="100%" stopColor="#E4C97A" />
          </linearGradient>
        </defs>

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={
              t.progress <= animated / 100
                ? t.isMajor ? 'rgba(228,201,122,0.7)' : 'rgba(253,188,1,0.4)'
                : t.isMajor ? '#2A2F37' : '#1A1E24'
            }
            strokeWidth={t.isMajor ? 1.5 : 0.8}
          />
        ))}

        {/* Endpoint glow dot */}
        {animated > 2 && (
          <>
            <circle cx={endX} cy={endY} r={strokeWidth * 0.55} fill="rgba(228,201,122,0.25)" />
            <circle cx={endX} cy={endY} r={strokeWidth * 0.3} fill="#E4C97A" />
          </>
        )}

        {/* Inner circle */}
        <circle
          cx={cx} cy={cy}
          r={radius - strokeWidth * 1.7}
          fill="#0A0C0F"
          stroke="#1A1E24"
          strokeWidth={0.5}
        />

        {/* Inner ring decoration */}
        <circle
          cx={cx} cy={cy}
          r={radius - strokeWidth * 2.4}
          fill="none"
          stroke="rgba(253,188,1,0.08)"
          strokeWidth={0.5}
          strokeDasharray="4 8"
        />

        {/* Percentage value */}
        <text
          x={cx} y={cy - size * 0.04}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#E4C97A"
          fontFamily="'JetBrains Mono', monospace"
          fontSize={size * 0.2}
          fontWeight="700"
          letterSpacing="-2"
        >
          {Math.round(animated)}%
        </text>

        {/* Sub label */}
        <text
          x={cx} y={cy + size * 0.17}
          textAnchor="middle"
          fill="#7C97AC"
          fontFamily="'JetBrains Mono', monospace"
          fontSize={size * 0.048}
          letterSpacing={size * 0.012}
        >
          PASS RATE
        </text>

        {/* DMV label */}
        <text
          x={cx} y={cy + size * 0.24}
          textAnchor="middle"
          fill="rgba(168,159,147,0.5)"
          fontFamily="'JetBrains Mono', monospace"
          fontSize={size * 0.036}
          letterSpacing={size * 0.008}
        >
          DMV DRIVE TEST
        </text>
      </svg>
    </div>
  )
}
