import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { api } from '../api'
import Pricing from '../components/Pricing'
import { usePageMeta } from '../usePageMeta'
import { saveBookingReturn } from '../utils/bookingStorage'
import { DEFAULT_BOOKING_LOCATIONS, locationDistanceLabel } from '../locations'
import { locationPlanPrice, priceNumber } from '../pricingUtils'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

const PICKUP_TIMES = [
  '07:00 AM - 09:00 AM',
  '09:30 AM - 11:30 AM',
  '12:00 PM - 02:00 PM',
  '02:30 PM - 04:30 PM',
  '05:00 PM - 07:00 PM',
]
const DMV_APPOINTMENT_HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
const DMV_APPOINTMENT_MINUTES = ['00', '15', '30', '45']
const isDmvAppointmentPlan = tier => {
  const id = String(tier?.id || '')
  const name = String(tier?.planName || '').toUpperCase()
  return id === '6' || id === '7' || name.includes('DMV DRIVE TEST CAR RENTAL')
}

const slotLimitForPlan = (tier) => {
  const id = String(tier?.id || '')
  const name = String(tier?.planName || '').toUpperCase()
  if (id === '2') return 1
  if (id === '5') return 5
  if (id === '3' || id === '4') return 3
  if (id === '6' || id === '7' || id === '8') return 1
  if (name.includes('PREMIER')) return 5
  if (name.includes('ESSENTIAL')) return 3
  if (name.includes('IDEAL FOR STUDENTS')) return 3
  if (name.includes('BASIC PLAN')) return 1
  if (name.includes('DMV DRIVE TEST CAR RENTAL')) return 1
  if (name.includes('FREEWAY FOCUSED COURSE')) return 1
  return 3
}

const slotInstruction = (tier) => {
  const limit = slotLimitForPlan(tier)
  return limit === 1
    ? 'Select 1 date & time slot'
    : `Select 1 to ${limit} date & time slots`
}

const activeEnrollmentFor = (courses, tier) => [...(Array.isArray(courses) ? courses : [])].reverse().find(course => {
  const status = String(course?.status || 'Enrolled').trim().toLowerCase()
  return String(course?.id) === String(tier?.id)
    && !['cancelled', 'refunded', 'refund pending'].includes(status)
}) || null

const enrollmentUsedSlots = (enrollment) => {
  const serverCount = Number(enrollment?.slotAllowance?.used)
  if (Number.isFinite(serverCount) && serverCount >= 0) return serverCount
  return Array.isArray(enrollment?.pickupSlots) ? enrollment.pickupSlots.length : 0
}

function BookingSteps({ current }) {
  const items = ['Plan', 'City', 'Schedule', 'Cart']
  return (
    <div aria-label="Booking progress" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.45rem', margin: '0 0 1.25rem' }}>
      {items.map((label, index) => {
        const stepNumber = index + 1
        const complete = stepNumber < current
        const active = stepNumber === current
        return (
          <div key={label} aria-current={active ? 'step' : undefined} style={{ position: 'relative', textAlign: 'center', color: active || complete ? '#0755ae' : '#94a3b8' }}>
            <div style={{ width: '28px', height: '28px', margin: '0 auto 0.35rem', borderRadius: '50%', display: 'grid', placeItems: 'center', background: complete ? '#0755ae' : active ? '#eaf2ff' : '#f1f5f9', border: active ? '2px solid #0755ae' : '1px solid #e2e8f0', color: complete ? '#fff' : 'inherit', fontSize: '0.72rem', fontWeight: 800 }}>
              {complete ? '✓' : stepNumber}
            </div>
            <span style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '0.68rem', fontWeight: active ? 800 : 700 }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function PricingPage() {
  usePageMeta(
    'Packages & Pricing — A Precision Driving School San Ramon CA',
    'Compare driving school packages: online drivers ed, 2, 6 and 10-hour behind-the-wheel training, DMV drive test car rental and freeway focused courses. 99% pass rate, free pickup & drop.'
  )
  const { user } = useAuth()
  const { addToCart } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState(null)
  const [selectedTier, setSelectedTier] = useState(null)
  const [selectedPlans, setSelectedPlans] = useState([])
  const [selectedCity, setSelectedCity] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedSlots, setSelectedSlots] = useState([])
  const [pendingDate, setPendingDate] = useState('')
  const [bookedTimes, setBookedTimes] = useState([])
  const [timeAvailability, setTimeAvailability] = useState({})
  const [customBookedTimes, setCustomBookedTimes] = useState([])
  const [appointmentHour, setAppointmentHour] = useState('09')
  const [appointmentMinute, setAppointmentMinute] = useState('00')
  const [appointmentPeriod, setAppointmentPeriod] = useState('AM')
  const [monthAvailability, setMonthAvailability] = useState({})
  const [monthAvailabilityLoading, setMonthAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [error, setError] = useState('')
  const [tiers, setTiers] = useState(null)
  const [pricingLoading, setPricingLoading] = useState(true)
  const [pricingLoadError, setPricingLoadError] = useState('')
  const [pricingLoadVersion, setPricingLoadVersion] = useState(0)
  const [bookingLocations, setBookingLocations] = useState(DEFAULT_BOOKING_LOCATIONS)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)
  const [enrollmentLoadError, setEnrollmentLoadError] = useState('')
  const [enrollmentLoadVersion, setEnrollmentLoadVersion] = useState(0)

  useEffect(() => {
    let active = true
    setPricingLoading(true)
    setPricingLoadError('')
    api.getPricing()
      .then(data => {
        if (!active) return
        if (!Array.isArray(data) || !data.length) throw new Error('No pricing plans are currently available.')
        setTiers(data)
      })
      .catch(loadError => {
        if (active) setPricingLoadError(loadError?.message || 'Pricing plans could not be loaded.')
      })
      .finally(() => {
        if (active) setPricingLoading(false)
      })
    return () => { active = false }
  }, [pricingLoadVersion])

  useEffect(() => {
    let active = true
    api.getLocations()
      .then(data => {
        if (!active || !Array.isArray(data)) return
        setBookingLocations([...data].sort((a, b) =>
          (Number(a.order) || 0) - (Number(b.order) || 0) || String(a.name || '').localeCompare(String(b.name || ''))
        ))
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!user) {
      setEnrolledCourses([])
      setEnrollmentLoading(false)
      setEnrollmentLoadError('')
      return
    }
    let active = true
    setEnrollmentLoading(true)
    setEnrollmentLoadError('')
    api.getUser(user.uid)
      .then(profile => {
        if (active) setEnrolledCourses(Array.isArray(profile?.courses) ? profile.courses : [])
      })
      .catch(() => {
        if (active) {
          setEnrolledCourses([])
          setEnrollmentLoadError('We could not check your current package allowance. Please retry before selecting lesson times.')
        }
      })
      .finally(() => {
        if (active) setEnrollmentLoading(false)
      })
    return () => { active = false }
  }, [user, enrollmentLoadVersion])

  const enrollmentForPlan = (tier) => activeEnrollmentFor(enrolledCourses, tier)
  const locationForCity = city => bookingLocations.find(item => item.name === city)
  const distanceForCity = (city) => locationDistanceLabel(locationForCity(city)?.distance || 'Near')
  const zipForCity = city => String(locationForCity(city)?.zipCode || '').trim()
  const planLocationPrice = (tier, city) => locationPlanPrice(tier, distanceForCity(city))
  const selectionLimitForPlan = (tier) => {
    const maximum = slotLimitForPlan(tier)
    const enrollment = enrollmentForPlan(tier)
    if (!enrollment) return maximum
    const serverRemaining = Number(enrollment?.slotAllowance?.remaining)
    const remaining = Number.isFinite(serverRemaining)
      ? serverRemaining
      : maximum - enrollmentUsedSlots(enrollment)
    return Math.max(0, Math.min(maximum, remaining))
  }
  const planIsContinuation = (tier) => Boolean(enrollmentForPlan(tier))
  const planCharge = (tier, city) => planIsContinuation(tier) ? 0 : priceNumber(planLocationPrice(tier, city))
  const planPriceLabel = (tier, city) => planIsContinuation(tier) ? 'Included' : planLocationPrice(tier, city)
  const selectionInstruction = (tier) => {
    const limit = selectionLimitForPlan(tier)
    if (planIsContinuation(tier)) {
      const used = enrollmentUsedSlots(enrollmentForPlan(tier))
      const maximum = slotLimitForPlan(tier)
      return limit > 0
        ? `${used}/${maximum} used · select 1 to ${limit} remaining`
        : `${maximum}/${maximum} slots already used`
    }
    return slotInstruction(tier)
  }
  const selectedEnrollment = enrollmentForPlan(selectedTier)
  const selectedPlanSelectionLimit = selectedTier ? selectionLimitForPlan(selectedTier) : 0

  useEffect(() => {
    if (!tiers?.length) return
    const planId = new URLSearchParams(location.search).get('plan')
    if (!planId) return
    const tier = tiers.find(item => String(item.id) === planId)
    if (!tier) return
    setSelectedTier(tier)
    setSelectedCity('')
    setSelectedDate('')
    setSelectedTime('')
    setSelectedSlots([])
    setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    setError('')
    setStep('city')
  }, [tiers, location.search])

  useEffect(() => {
    if (!selectedTier || enrollmentLoading || !selectedEnrollment) return
    if (selectedPlanSelectionLimit === 0 && (step === 'city' || step === 'calendar')) {
      setSelectedPlans(prev => prev.filter(plan => String(plan.tier.id) !== String(selectedTier.id)))
      setSelectedSlots([])
      setError(`All ${slotLimitForPlan(selectedTier)} included slots for ${selectedTier.planName} have already been used.`)
      setStep('full')
    }
  }, [selectedTier, selectedEnrollment, selectedPlanSelectionLimit, enrollmentLoading, step])

  useEffect(() => {
    if (!pendingDate) return
    let active = true
    setBookedTimes([])
    setCustomBookedTimes([])
    setTimeAvailability({})
    setAvailabilityLoading(true)
    api.getBookingAvailability(pendingDate)
      .then(data => {
        if (!active) return
        const slots = Array.isArray(data?.slots) ? data.slots : []
        setBookedTimes(Array.isArray(data?.bookedTimes) ? data.bookedTimes : [])
        setCustomBookedTimes(Array.isArray(data?.customBookedTimes) ? data.customBookedTimes : [])
        setTimeAvailability(Object.fromEntries(slots.map(slot => [slot.time, slot.status])))
      })
      .catch(() => {
        if (!active) return
        setBookedTimes([...PICKUP_TIMES])
        setTimeAvailability(Object.fromEntries(PICKUP_TIMES.map(time => [time, 'unavailable'])))
      })
      .finally(() => { if (active) setAvailabilityLoading(false) })
    return () => { active = false }
  }, [pendingDate, selectedTier?.id])

  useEffect(() => {
    if (step !== 'calendar') return undefined
    let active = true
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    setMonthAvailabilityLoading(true)
    setAvailabilityError('')
    api.getAvailability({ from, to })
      .then(data => {
        if (!active) return
        setMonthAvailability(data?.dates && typeof data.dates === 'object' ? data.dates : {})
      })
      .catch(error => {
        if (!active) return
        setMonthAvailability({})
        setAvailabilityError(error?.message || 'Available lesson dates could not be loaded.')
      })
      .finally(() => { if (active) setMonthAvailabilityLoading(false) })
    return () => { active = false }
  }, [calendarMonth, step])

  const handleChoose = (tier) => {
    if (!enrollmentLoading && planIsContinuation(tier) && selectionLimitForPlan(tier) === 0) {
      setSelectedTier(tier)
      setError(`All ${slotLimitForPlan(tier)} included slots for ${tier.planName} have already been used.`)
      setStep('full')
      return
    }
    const existing = selectedPlans.find(plan => plan.tier.id === tier.id)
    setSelectedTier(tier)
    setSelectedCity(existing?.city || '')
    setSelectedDate(existing?.slots[0]?.date || '')
    setSelectedTime(existing?.slots[0]?.time || '')
    setSelectedSlots(existing?.slots || [])
    setPendingDate('')
    setAppointmentHour('09')
    setAppointmentMinute('00')
    setAppointmentPeriod('AM')
    setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    setStep('city')
    setError('')
  }

  const handleCityNext = () => {
    if (user && enrollmentLoading) {
      setError('Checking your current package allowance. Please wait a moment.')
      return
    }
    if (user && enrollmentLoadError) {
      setError(enrollmentLoadError)
      return
    }
    if (selectionLimitForPlan(selectedTier) < 1) {
      setError(`This package has no remaining lesson slots.`)
      return
    }
    if (!selectedCity) {
      setError('Please select your city.')
      return
    }
    setError('')
    setSelectedPlans(prev => {
      const plan = { tier: selectedTier, city: selectedCity, slots: selectedSlots }
      const exists = prev.some(item => item.tier.id === selectedTier.id)
      return exists ? prev.map(item => item.tier.id === selectedTier.id ? plan : item) : [...prev, plan]
    })
    setStep('calendar')
  }

  const handleBooking = async () => {
    if (user && enrollmentLoading) {
      setError('Checking your current package allowance. Please wait a moment.')
      return
    }
    if (user && enrollmentLoadError) {
      setError(enrollmentLoadError)
      return
    }
    if (!selectedPlans.length || selectedPlans.some(plan => plan.slots.length < 1 || plan.slots.length > selectionLimitForPlan(plan.tier))) {
      setError("Please select at least 1 available slot for every plan. You may choose up to each plan's displayed maximum.")
      return
    }
    setStep('loading')
    try {
      for (const plan of selectedPlans) {
        const result = await addToCart({
          id: plan.tier.id,
          title: plan.tier.planName,
          price: planLocationPrice(plan.tier, plan.city),
          cityDistance: distanceForCity(plan.city),
          cityZip: zipForCity(plan.city),
          priceBasis: distanceForCity(plan.city),
          nearPrice: locationPlanPrice(plan.tier, 'Near'),
          longPrice: locationPlanPrice(plan.tier, 'Long'),
          city: plan.city,
          preferredDate: plan.slots[0]?.date || '',
          pickupTime: plan.slots[0]?.time || '',
          pickupSlots: plan.slots,
          continuation: planIsContinuation(plan.tier),
        })
        if (!result?.ok) throw new Error(result?.error || 'Unable to save this package.')
      }
      if (!user) {
        saveBookingReturn('/cart')
        navigate('/booking/register', { state: { from: '/cart' } })
        return
      }
      navigate('/cart')
    } catch (bookingError) {
      setError(bookingError.message || 'One or more packages could not be saved. Your other selections remain in the cart.')
      setStep('calendar')
    }
  }

  const handleDmvAppointmentTime = () => {
    const time = `${appointmentHour}:${appointmentMinute} ${appointmentPeriod}`
    const slotLimit = selectionLimitForPlan(selectedTier)
    if (selectedSlots.length >= slotLimit) {
      setError(`This plan allows up to ${slotLimit} appointment slot${slotLimit === 1 ? '' : 's'}.`)
      return
    }
    const alreadySelected = selectedSlots.some(slot => slot.date === pendingDate && slot.time === time)
      || selectedPlans.some(plan => String(plan.tier.id) !== String(selectedTier.id)
        && plan.slots.some(slot => slot.date === pendingDate && slot.time === time))
    if (alreadySelected || customBookedTimes.includes(time)) {
      setError('This DMV appointment time has already been selected or booked. Please choose another time.')
      return
    }
    const nextSlots = [...selectedSlots, { date: pendingDate, time }]
    setSelectedSlots(nextSlots)
    setSelectedPlans(previous => previous.map(plan => plan.tier.id === selectedTier.id ? { ...plan, slots: nextSlots } : plan))
    setSelectedDate(pendingDate)
    setSelectedTime(time)
    setPendingDate('')
    setError('')
  }

  const handleConfirm = async (goToCart = false) => {
    setStep('loading')
    try {
      const course = {
        id: selectedTier.id,
        title: selectedTier.planName,
        price: planLocationPrice(selectedTier, selectedCity),
        cityDistance: distanceForCity(selectedCity),
        cityZip: zipForCity(selectedCity),
        priceBasis: distanceForCity(selectedCity),
        nearPrice: locationPlanPrice(selectedTier, 'Near'),
        longPrice: locationPlanPrice(selectedTier, 'Long'),
        city: selectedCity,
        preferredDate: selectedDate,
        pickupTime: selectedTime,
        pickupSlots: selectedSlots,
      }
      const result = await addToCart(course)
      if (result.ok) {
        if (result.duplicate) {
          if (goToCart) {
            navigate('/cart')
            return
          }
          setError('This course is already in your cart.')
          setStep('confirm')
          return
        }
        if (goToCart) {
          navigate('/cart')
        } else setStep('success')
      } else {
        setError(result.error || 'Failed to add to cart. Please try again.')
        setStep(goToCart ? 'calendar' : 'confirm')
      }
    } catch (bookingError) {
      setError(bookingError.message || 'Failed to add to cart. Please try again.')
      setStep(goToCart ? 'calendar' : 'confirm')
    }
  }

  const handleClose = () => {
    setStep(null)
    setSelectedTier(null)
    setSelectedPlans([])
    setSelectedCity('')
    setSelectedDate('')
    setSelectedTime('')
    setSelectedSlots([])
    setPendingDate('')
    setCustomBookedTimes([])
    setAppointmentHour('09')
    setAppointmentMinute('00')
    setAppointmentPeriod('AM')
    setError('')
  }

  const removePlan = (planId) => {
    const remaining = selectedPlans.filter(plan => plan.tier.id !== planId)
    setSelectedPlans(remaining)
    if (!remaining.length) {
      handleClose()
      return
    }
    const next = remaining[0]
    setSelectedTier(next.tier)
    setSelectedCity(next.city)
    setSelectedSlots(next.slots)
    setSelectedDate(next.slots[0]?.date || '')
    setSelectedTime(next.slots[0]?.time || '')
  }

  const activatePlan = (plan) => {
    setSelectedTier(plan.tier)
    setSelectedCity(plan.city)
    setSelectedSlots(plan.slots)
    setSelectedDate(plan.slots[0]?.date || '')
    setSelectedTime(plan.slots[0]?.time || '')
    setError('')
  }

  const plansTotal = selectedPlans.reduce((sum, plan) => sum + planCharge(plan.tier, plan.city), 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const calendarYear = calendarMonth.getFullYear()
  const calendarMonthIndex = calendarMonth.getMonth()
  const firstWeekday = new Date(calendarYear, calendarMonthIndex, 1).getDay()
  const daysInMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate()
  const calendarDays = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const dateKey = (day) => {
    const month = String(calendarMonthIndex + 1).padStart(2, '0')
    return `${calendarYear}-${month}-${String(day).padStart(2, '0')}`
  }

  const backdropStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,22,40,0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    animation: 'modalFadeIn 0.3s ease',
  }

  const modalStyle = {
    background: '#fff',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
    maxWidth: '460px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
    animation: 'modalSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)',
    position: 'relative',
  }

  return (
    <div className="pricing-page" style={{ paddingTop: '12rem', paddingBottom: '4rem' }}>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(40px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes checkmarkDraw { 0% { stroke-dashoffset: 50; } 100% { stroke-dashoffset: 0; } }
        @keyframes checkmarkCircle { 0% { stroke-dashoffset: 166; } 100% { stroke-dashoffset: 0; } }
        @keyframes successPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spinLoader { to { transform: rotate(360deg); } }
        @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
      `}</style>

      {pricingLoading ? (
        <section className="public-page-state" role="status" aria-live="polite">
          <span className="sr-only">Loading current pricing packages.</span>
          <div className="public-card-skeleton-grid" aria-hidden="true">
            {[0, 1, 2].map(item => <div className="public-card-skeleton" key={item} />)}
          </div>
        </section>
      ) : pricingLoadError ? (
        <section className="public-page-state" role="alert">
          <h1>Pricing is temporarily unavailable</h1>
          <p>{pricingLoadError} Please try again.</p>
          <button type="button" className="public-retry-button" onClick={() => setPricingLoadVersion(value => value + 1)}>Retry pricing</button>
        </section>
      ) : (
        <Pricing light onEnroll={handleChoose} tiers={tiers} />
      )}

      {step === 'full' && selectedTier && (
        <div style={backdropStyle} onClick={(event) => { if (event.target === event.currentTarget) handleClose() }}>
          <div role="dialog" aria-modal="true" aria-labelledby="full-package-title" style={{ ...modalStyle, maxWidth:'480px', padding:'2rem', textAlign:'center' }}>
            <button type="button" onClick={handleClose} aria-label="Close" style={{ position:'absolute', top:'0.8rem', right:'1rem', border:0, background:'transparent', color:'#334155', fontSize:'1.8rem', cursor:'pointer' }}>&times;</button>
            <div aria-hidden="true" style={{ width:'58px', height:'58px', margin:'0 auto 1rem', display:'grid', placeItems:'center', borderRadius:'50%', background:'#EFF6FF', color:'#0755AE', fontSize:'1.6rem', fontWeight:900 }}>&#10003;</div>
            <h2 id="full-package-title" style={{ margin:'0 0 0.6rem', color:DARK, fontFamily:'var(--font-display)', fontSize:'1.45rem' }}>All Included Slots Are Booked</h2>
            <p style={{ margin:'0 0 1.3rem', color:'#334155', fontFamily:'var(--font-body)', lineHeight:1.65 }}>{error}</p>
            <button type="button" onClick={() => navigate('/dashboard')} style={{ minHeight:'44px', padding:'0 1.2rem', border:0, borderRadius:'10px', background:'#0755AE', color:'#fff', fontFamily:'var(--font-body)', fontWeight:800, cursor:'pointer' }}>View My Lessons</button>
          </div>
        </div>
      )}

      {step === 'city' && selectedTier && (
        <div style={{ ...backdropStyle, alignItems: 'flex-start', paddingTop: '1.25rem' }} onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
          <div role="dialog" aria-modal="true" aria-labelledby="city-modal-title" style={{ ...modalStyle, maxWidth: '800px', borderRadius: '14px', padding: '1.35rem 1.8rem 1.8rem' }}>
            <button onClick={handleClose} aria-label="Close" style={{ position: 'absolute', top: '1rem', right: '1.25rem', border: 0, background: 'transparent', color: '#777', fontSize: '2rem', lineHeight: 1, cursor: 'pointer', padding: 0 }}>&times;</button>

            <h2 id="city-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 2.5rem 1.5rem 0', fontFamily: 'var(--font-body)', fontSize: '1.25rem', color: DARK, fontWeight: 800 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0866ff" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              Find Driving Lessons Near You
            </h2>

            <BookingSteps current={2} />

            <div style={{ fontFamily: 'var(--font-body)', color: DARK, fontSize: '1rem', lineHeight: 1.6, marginBottom: '0.25rem' }}>
              <div>Plan Name: <strong>{selectedTier.planName}</strong></div>
              <div>
                Price: <strong>{user && enrollmentLoading
                  ? 'Checking package status…'
                  : planIsContinuation(selectedTier)
                    ? 'Already paid — no additional charge'
                    : selectedCity
                      ? `${planLocationPrice(selectedTier, selectedCity)} (${distanceForCity(selectedCity)} location)`
                      : locationPlanPrice(selectedTier, 'Near')}</strong>
              </div>
              {planIsContinuation(selectedTier) && <div style={{ marginTop:'0.25rem', color:'#15803D', fontWeight:800 }}>{selectionInstruction(selectedTier)}</div>}
            </div>
            {!planIsContinuation(selectedTier) && (
              <p role="note" style={{ fontFamily: 'var(--font-body)', color: '#dc2626', fontSize: '0.98rem', lineHeight: 1.55, fontWeight: 800, margin: '0.55rem 0 1.05rem' }}>
                Additional charges may apply based on the instructor&apos;s travel distance to your preferred lesson location.
              </p>
            )}
            <p style={{ fontFamily: 'var(--font-body)', color: '#7a8494', fontSize: '0.95rem', margin: '0 0 0.9rem' }}>Please select your city</p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <select
                name="city"
                required
                value={selectedCity}
                onChange={(e) => { setSelectedCity(e.target.value); setError('') }}
                style={{ width: 'min(100%, 372px)', minHeight: '46px', padding: '0 2.5rem 0 0.75rem', border: `1px solid ${error ? '#ef4444' : '#dce6f2'}`, borderRadius: '10px', background: '#fff', boxShadow: '0 4px 14px rgba(15,23,42,0.04)', color: selectedCity ? DARK : '#4b5563', fontFamily: 'var(--font-body)', fontSize: '1rem', cursor: 'pointer' }}
              >
                <option value="">Select city</option>
                {['Near', 'Long'].map(distance => {
                  const group = bookingLocations.filter(item => locationDistanceLabel(item.distance) === distance)
                  return group.length ? (
                    <optgroup key={distance} label={`${distance} pickup locations`}>
                      {group.map(item => <option key={item._id || item.name} value={item.name}>{item.name}{item.zipCode ? `, CA ${item.zipCode}` : ''}</option>)}
                    </optgroup>
                  ) : null
                })}
              </select>
              <button type="button" disabled={Boolean(user && enrollmentLoading)} onClick={handleCityNext} style={{ minHeight: '46px', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0 1.15rem', border: 0, borderRadius: '10px', background: user && enrollmentLoading ? '#94A3B8' : '#0755ae', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 800, cursor: user && enrollmentLoading ? 'wait' : 'pointer', boxShadow: user && enrollmentLoading ? 'none' : '0 7px 18px rgba(7,85,174,0.18)' }}>
                {user && enrollmentLoading ? 'Checking…' : 'Next'}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
            {error && <p role="alert" style={{ margin: '0.55rem 0 0', color: '#dc2626', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>{error}</p>}
            {user && enrollmentLoadError && <button type="button" onClick={() => setEnrollmentLoadVersion(version => version + 1)} style={{ marginTop:'0.55rem', padding:'0.45rem 0.75rem', border:'1px solid #BFDBFE', borderRadius:'8px', background:'#EFF6FF', color:'#0755AE', fontFamily:'var(--font-body)', fontWeight:800, cursor:'pointer' }}>Retry package check</button>}
          </div>
        </div>
      )}

      {step === 'calendar' && selectedTier && (
        <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
          <div role="dialog" aria-modal="true" aria-labelledby="calendar-modal-title" style={{ ...modalStyle, maxWidth: '640px', borderRadius: '16px', padding: '1.2rem', background: '#f8fafc' }}>
            <button onClick={handleClose} aria-label="Close" style={{ position: 'absolute', top: '0.75rem', right: '1rem', zIndex: 2, border: 0, background: 'transparent', color: '#334155', fontSize: '1.8rem', cursor: 'pointer' }}>&times;</button>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <h2 id="calendar-modal-title" style={{ margin: 0, color: '#08284a', fontFamily: 'var(--font-body)', fontSize: '1.7rem', fontWeight: 800 }}>Your Selected Course</h2>
              <p style={{ margin: '0.25rem 0 0', color: '#334155', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>You've chosen the perfect driving course for your needs!</p>
            </div>

            <BookingSteps current={3} />

            <div style={{ padding: '1rem 0.75rem 0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ color: '#334155', fontFamily: 'var(--font-body)', fontSize: '0.75rem' }}>Select Your Preferred Slots</div>
                  <div style={{ color: '#334155', fontFamily: 'var(--font-body)', fontSize: '0.68rem', marginTop: '0.15rem' }}>Choose at least 1 slot for each plan, up to its available package allowance.</div>
                  <strong style={{ color: '#0755ae', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>{calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</strong>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button disabled={calendarMonth <= currentMonthStart} onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))} style={{ width: '32px', height: '30px', border: 0, borderRadius: '8px', background: '#f1f5f9', color: '#08284a', fontSize: '1.35rem', cursor: calendarMonth <= currentMonthStart ? 'not-allowed' : 'pointer', opacity: calendarMonth <= currentMonthStart ? 0.4 : 1 }}>&lsaquo;</button>
                  <button onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))} style={{ width: '32px', height: '30px', border: 0, borderRadius: '8px', background: '#f1f5f9', color: '#08284a', fontSize: '1.35rem', cursor: 'pointer' }}>&rsaquo;</button>
                </div>
              </div>

              <div aria-label="Calendar status legend" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', margin: '0 0 0.65rem', color: '#334155', fontSize: '0.68rem', fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><i aria-hidden="true" style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#edf7ef', border: '1px solid #cde7d2' }} />Available</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><i aria-hidden="true" style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#dbeafe', border: '1px solid #0755ae' }} />Selected</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><i aria-hidden="true" style={{ width: '11px', height: '11px', borderRadius: '3px', background: '#fff1f2', border: '1px solid #fee2e2' }} />Unavailable</span>
              </div>
              {monthAvailabilityLoading && <p role="status" style={{ margin: '0 0 .65rem', color: '#0755AE', fontSize: '.75rem', fontWeight: 700 }}>Loading available lesson dates…</p>}
              {availabilityError && <p role="alert" style={{ margin: '0 0 .65rem', color: '#DC2626', fontSize: '.75rem', fontWeight: 700 }}>{availabilityError}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} style={{ textAlign: 'center', padding: '0.25rem 0', color: '#475569', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}>{day}</div>)}
                {calendarDays.map((day, index) => {
                  if (!day) return <div key={`blank-${index}`} />
                  const dayDate = new Date(calendarYear, calendarMonthIndex, day)
                  const key = dateKey(day)
                  const dateSlots = Array.isArray(monthAvailability[key]) ? monthAvailability[key] : []
                  const hasAvailableTime = dateSlots.some(slot => slot.status === 'available')
                  const disabled = dayDate < today || monthAvailabilityLoading || !hasAvailableTime
                  const selected = selectedSlots.some(slot => slot.date === key)
                  return (
                    <button key={key} disabled={disabled} title={hasAvailableTime ? `${dateSlots.filter(slot => slot.status === 'available').length} time slots available` : 'No lesson times opened by the school'} onClick={() => { setPendingDate(key); setError('') }} style={{ minHeight: '42px', border: selected ? '2px solid #0755ae' : `1px solid ${disabled ? '#fee2e2' : '#cde7d2'}`, borderRadius: '3px', background: selected ? '#dbeafe' : disabled ? '#fff1f2' : '#edf7ef', color: selected ? '#0755ae' : disabled ? '#ff3b45' : '#19963b', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: selected ? 800 : 500, cursor: disabled ? 'not-allowed' : 'pointer' }}>{day}</button>
                  )
                })}
              </div>

              <div style={{ marginTop: '0.9rem', fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, color: DARK }}>Selected Slots:</div>
              {selectedPlans.filter(plan => plan.tier.id !== selectedTier.id).map(plan => (
                <div key={plan.tier.id} onClick={() => activatePlan(plan)} style={{ marginTop: '0.35rem', padding: '0.65rem', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div>
                      <strong style={{ color: '#586576', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>{plan.tier.planName}</strong>
                      <span style={{ color: '#334155', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}> ({selectionInstruction(plan.tier)} · {plan.slots.length} selected / {selectionLimitForPlan(plan.tier)} available)</span>
                      <div style={{ color: '#334155', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}>{plan.city}</div>
                      <button onClick={(e) => { e.stopPropagation(); removePlan(plan.tier.id) }} style={{ marginTop: '0.4rem', padding: '0.32rem 0.5rem', border: 0, borderRadius: '4px', background: '#e93647', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.65rem', cursor: 'pointer' }}>Remove plan</button>
                    </div>
                    <span style={{ alignSelf: 'flex-start', padding: '0.25rem 0.55rem', borderRadius: '999px', background: planIsContinuation(plan.tier) ? '#15803D' : '#0755ae', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 800 }}>{planPriceLabel(plan.tier, plan.city)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.55rem', paddingTop: '0.45rem' }}>
                    {plan.slots.length ? plan.slots.map(slot => (
                      <div key={`${slot.date}-${slot.time}`} style={{ padding: '0.45rem', marginBottom: '0.3rem', background: '#f8fafc', color: '#334155', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}>
                        <div>{new Date(`${slot.date}T00:00:00`).toLocaleDateString('en-US')} &nbsp; {slot.time}</div>
                      </div>
                    )) : <span style={{ color: '#ef3340', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}>No slot selected</span>}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '0.35rem', padding: '0.65rem', border: '1.5px solid #0755ae', background: '#eaf2ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div>
                    <strong style={{ color: '#586576', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>{selectedTier.planName}</strong>
                    <span style={{ color: '#334155', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}> ({selectionInstruction(selectedTier)} · {selectedSlots.length} selected / {selectionLimitForPlan(selectedTier)} available)</span>
                    <div style={{ marginTop: '0.2rem', color: '#334155', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}>{selectedCity}</div>
                    <button onClick={() => removePlan(selectedTier.id)} style={{ marginTop: '0.45rem', padding: '0.35rem 0.55rem', border: 0, borderRadius: '4px', background: '#e93647', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}>Remove plan</button>
                  </div>
                  <span style={{ alignSelf: 'flex-start', padding: '0.25rem 0.55rem', borderRadius: '999px', background: planIsContinuation(selectedTier) ? '#15803D' : '#0755ae', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 800 }}>{planPriceLabel(selectedTier, selectedCity)}</span>
                </div>
                <div style={{ borderTop: '1px solid #cbd5e1', marginTop: '0.65rem', paddingTop: '0.55rem', fontFamily: 'var(--font-body)', fontSize: '0.75rem' }}>
                  {selectedSlots.length ? selectedSlots.map(slot => (
                    <div key={`${slot.date}-${slot.time}`} style={{ padding: '0.55rem', marginBottom: '0.35rem', background: 'rgba(255,255,255,0.62)', borderRadius: '3px', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
                        {new Date(`${slot.date}T00:00:00`).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                        <span>{slot.time}</span>
                        <button onClick={() => { const remaining = selectedSlots.filter(item => item.date !== slot.date || item.time !== slot.time); setSelectedSlots(remaining); setSelectedPlans(prev => prev.map(plan => plan.tier.id === selectedTier.id ? { ...plan, slots: remaining } : plan)); setSelectedDate(remaining[0]?.date || ''); setSelectedTime(remaining[0]?.time || ''); setError('') }} aria-label="Remove selected slot" style={{ width: '24px', height: '24px', marginLeft: '0.2rem', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 0, borderRadius: '4px', background: '#e93647', color: '#fff', cursor: 'pointer' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>
                        </button>
                      </div>
                    </div>
                  )) : <span style={{ color: '#ef3340' }}>No slot selected</span>}
                </div>
              </div>

              {error && <p style={{ color: '#dc2626', margin: '0.45rem 0 0', fontFamily: 'var(--font-body)', fontSize: '0.75rem' }}>{error}</p>}
              <button onClick={() => { setStep(null); setSelectedTier(null); setPendingDate('') }} style={{ width: '100%', marginTop: '0.6rem', minHeight: '34px', border: 0, borderRadius: '6px', background: '#747f88', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }}>+ Add More Plans</button>
              <div style={{ margin: '0.45rem 0', color: '#08284a', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 800 }}>Additional amount due: ${plansTotal.toFixed(2)}</div>
              {selectedPlans.some(plan => planIsContinuation(plan.tier)) && <div style={{ margin:'-0.2rem 0 0.5rem', color:'#15803D', fontFamily:'var(--font-body)', fontSize:'0.72rem', fontWeight:700 }}>Remaining lessons from an enrolled package are included at no extra charge.</div>}
              <button onClick={handleBooking} style={{ width: '100%', minHeight: '38px', border: 0, borderRadius: '8px', background: '#0755ae', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 800, cursor: 'pointer' }}>Proceed to Booking</button>
            </div>

            {pendingDate && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.48)' }}>
                <div role="dialog" aria-modal="true" aria-labelledby="pickup-time-title" style={{ position: 'relative', width: '100%', maxWidth: '525px', maxHeight: '92vh', overflowY: 'auto', padding: '3rem clamp(1.2rem, 6vw, 3.5rem) 1.4rem', borderRadius: '18px', background: '#fff', boxShadow: '0 24px 70px rgba(15,23,42,0.3)' }}>
                  <button onClick={() => setPendingDate('')} aria-label="Close pickup time" style={{ position: 'absolute', top: '0.8rem', right: '1.1rem', border: 0, background: 'transparent', color: '#334155', fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '2.5rem' }}>
                    <div style={{ width: '55px', height: '55px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0efff', color: '#0755ae' }}>
                      <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                    </div>
                    <h3 id="pickup-time-title" style={{ margin: 0, color: '#102a46', fontFamily: 'var(--font-body)', fontSize: '1.5rem', fontWeight: 800 }}>Select Pickup Time</h3>
                  </div>
                  <p style={{ margin: '0 0 0.6rem', color: DARK, fontFamily: 'var(--font-body)', fontSize: '1.05rem', fontWeight: 800 }}>
                    Selected Date: {new Date(`${pendingDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p style={{ margin: '0 0 1.2rem', color: '#102a46', fontFamily: 'var(--font-body)', fontSize: '1rem' }}>
                    {isDmvAppointmentPlan(selectedTier) ? 'Choose your DMV appointment time:' : 'Choose your preferred pickup time:'}
                  </p>
                  {isDmvAppointmentPlan(selectedTier) ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
                        <label htmlFor="dmv-hour" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Hour</label>
                        <select id="dmv-hour" value={appointmentHour} onChange={event => { setAppointmentHour(event.target.value); setError('') }} style={{ minHeight: '44px', padding: '0 0.75rem', border: '1px solid #CBD5E1', borderRadius: '7px', background: '#fff', color: DARK, fontFamily: 'var(--font-body)', fontSize: '1rem' }}>
                          {DMV_APPOINTMENT_HOURS.map(hour => <option key={hour} value={hour}>{hour}</option>)}
                        </select>
                        <span aria-hidden="true" style={{ color: '#334155', fontWeight: 900 }}>:</span>
                        <label htmlFor="dmv-minute" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Minute</label>
                        <select id="dmv-minute" value={appointmentMinute} onChange={event => { setAppointmentMinute(event.target.value); setError('') }} style={{ minHeight: '44px', padding: '0 0.75rem', border: '1px solid #CBD5E1', borderRadius: '7px', background: '#fff', color: DARK, fontFamily: 'var(--font-body)', fontSize: '1rem' }}>
                          {DMV_APPOINTMENT_MINUTES.map(minute => <option key={minute} value={minute}>{minute}</option>)}
                        </select>
                        <label htmlFor="dmv-period" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>AM or PM</label>
                        <select id="dmv-period" value={appointmentPeriod} onChange={event => { setAppointmentPeriod(event.target.value); setError('') }} style={{ minHeight: '44px', padding: '0 0.75rem', border: '1px solid #CBD5E1', borderRadius: '7px', background: '#fff', color: DARK, fontFamily: 'var(--font-body)', fontSize: '1rem' }}>
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                        <button type="button" disabled={availabilityLoading} onClick={handleDmvAppointmentTime} style={{ minHeight: '44px', padding: '0 1rem', border: 0, borderRadius: '7px', background: availabilityLoading ? '#94A3B8' : '#0866ff', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 800, cursor: availabilityLoading ? 'wait' : 'pointer' }}>
                          {availabilityLoading ? 'Checking...' : 'Done'}
                        </button>
                      </div>
                      {customBookedTimes.includes(`${appointmentHour}:${appointmentMinute} ${appointmentPeriod}`) && (
                        <p role="alert" style={{ margin: '0.75rem 0 0', color: '#DC2626', fontSize: '0.84rem', fontWeight: 750 }}>This appointment time is already booked. Please choose another time.</p>
                      )}
                    </div>
                  ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {PICKUP_TIMES.map(time => {
                      const effectiveStatus = timeAvailability[time] || (availabilityLoading ? 'loading' : 'unavailable')
                      const booked = bookedTimes.includes(time)
                        || selectedSlots.some(slot => slot.date === pendingDate && slot.time === time)
                        || selectedPlans.some(plan => String(plan.tier.id) !== String(selectedTier.id)
                          && plan.slots.some(slot => slot.date === pendingDate && slot.time === time))
                        || effectiveStatus !== 'available'
                      const slotLimit = selectionLimitForPlan(selectedTier)
                      const limitReached = selectedSlots.length >= slotLimit
                      const unavailableLabel = effectiveStatus === 'held'
                        ? 'Held'
                        : effectiveStatus === 'booked'
                          ? 'Booked'
                          : effectiveStatus === 'blocked'
                            ? 'Blocked'
                            : effectiveStatus === 'closed'
                              ? 'School Closed'
                            : 'Unavailable'
                      return (
                      <div key={time} style={{ minHeight: '56px', padding: '0.7rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', borderRadius: '11px', background: booked ? '#ffe5e5' : '#fff', boxShadow: booked ? 'none' : '0 8px 24px rgba(15,23,42,0.09)' }}>
                        <strong style={{ color: '#08284a', fontFamily: 'var(--font-body)', fontSize: '1rem' }}>{time}</strong>
                        {booked ? (
                          <button disabled style={{ padding: '0.55rem 0.75rem', border: 0, borderRadius: '5px', background: effectiveStatus === 'held' ? '#D97706' : '#e93647', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 800, cursor: 'not-allowed' }}>{availabilityLoading ? 'Checking…' : unavailableLabel}</button>
                        ) : (
                          <button disabled={limitReached || availabilityLoading} onClick={() => { const nextSlots = [...selectedSlots, { date: pendingDate, time }]; setSelectedSlots(nextSlots); setSelectedPlans(prev => prev.map(plan => plan.tier.id === selectedTier.id ? { ...plan, slots: nextSlots } : plan)); setSelectedDate(pendingDate); setSelectedTime(time); setPendingDate(''); setError('') }} style={{ padding: '0.55rem 0.75rem', border: 0, borderRadius: '5px', background: limitReached || availabilityLoading ? '#94a3b8' : '#0866ff', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.9rem', cursor: limitReached || availabilityLoading ? 'not-allowed' : 'pointer' }}>{availabilityLoading ? 'Checking...' : limitReached ? `Max ${slotLimit} Slot${slotLimit > 1 ? 's' : ''}` : 'Book Now'}</button>
                        )}
                      </div>
                    )})}
                  </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
                    <button onClick={() => setPendingDate('')} style={{ padding: '0.7rem 1rem', border: '1px solid #d7dee8', borderRadius: '8px', background: '#fff', color: '#1f2937', fontFamily: 'var(--font-body)', fontSize: '0.95rem', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'confirm' && selectedTier && (
        <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
          <div style={modalStyle}>
            <div style={{
              background: `linear-gradient(135deg, ${DARK} 0%, #1a0a3e 50%, ${DARK} 100%)`,
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              padding: '2rem 2rem 1.5rem',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(253,188,1,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(253,188,1,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
              <button onClick={handleClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', transition: 'background 0.2s', zIndex: 2 }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>&times;</button>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ width: '16px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD_DEEP, fontWeight: 700 }}>Confirm Selection</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                  {selectedTier.planName}
                </h2>
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem 2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {(['Near', 'Long']).map(distance => {
                  const activeDistance = selectedCity ? distanceForCity(selectedCity) : ''
                  return (
                    <div key={distance} style={{ minWidth: '118px', padding: '.65rem .8rem', borderRadius: '10px', border: `1px solid ${activeDistance === distance ? '#93C5FD' : '#E2E8F0'}`, background: activeDistance === distance ? '#EFF6FF' : '#F8FAFC' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: activeDistance === distance ? '#0755AE' : '#64748B', display: 'block', marginBottom: '0.2rem', fontWeight: 800 }}>{distance} Price</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', color: activeDistance === distance ? GOLD_DEEP : DARK, fontWeight: 800, lineHeight: 1 }}>{locationPlanPrice(selectedTier, distance)}</span>
                    </div>
                  )
                })}
              </div>
              {selectedCity && <p style={{ margin: '-.75rem 0 1.25rem', color: '#0755AE', fontFamily: 'var(--font-body)', fontSize: '.82rem', fontWeight: 800 }}>{selectedCity}{zipForCity(selectedCity) ? `, CA ${zipForCity(selectedCity)}` : ''} is a {distanceForCity(selectedCity)} location. Your price is {planLocationPrice(selectedTier, selectedCity)}.</p>}

              <div style={{ width: '100%', height: '1px', background: '#E2EBF5', marginBottom: '1.25rem' }} />

              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 700, marginBottom: '0.75rem' }}>What's included</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', listStyle: 'none', padding: 0, margin: '0 0 1.75rem 0' }}>
                {selectedTier.options
                  .filter((opt) => String(opt.text || '').trim())
                  .map((opt, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                    {opt.permission === 'Included' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      color: opt.permission === 'Included' ? '#4a5568' : '#94A3B8',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                    }}>
                      {opt.text || opt.permission}
                    </span>
                  </li>
                  ))}
              </ul>

              {error && (
                <div style={{ padding: '0.6rem 0.8rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#DC2626' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleClose} style={{
                  flex: 1, padding: '0.85rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: '#8899aa', background: 'transparent', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s',
                }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E0'; e.currentTarget.style.color = DARK }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2EBF5'; e.currentTarget.style.color = '#8899aa' }}>Cancel</button>
                <button onClick={() => handleConfirm()} style={{
                  flex: 2, padding: '0.85rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: DARK, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(253,188,1,0.25)',
                }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(253,188,1,0.4)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(253,188,1,0.25)' }}>
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div style={backdropStyle}>
          <div style={{ ...modalStyle, maxWidth: '360px', padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', border: `3px solid #E2EBF5`, borderTopColor: SKY_BLUE, borderRadius: '50%', animation: 'spinLoader 0.8s linear infinite', margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DARK, fontWeight: 700, margin: '0 0 0.4rem' }}>Adding to Cart</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#8899aa', margin: 0 }}>Saving your selection...</p>
          </div>
        </div>
      )}

      {step === 'success' && selectedTier && (
        <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
          <div style={modalStyle}>
            <div style={{ padding: '2.5rem 2rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', animation: 'pulseRing 1.5s ease-out infinite' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(34,197,94,0.05)', animation: 'pulseRing 1.5s ease-out 0.5s infinite' }} />
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ animation: 'successPop 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
                  <circle cx="40" cy="40" r="36" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeDasharray="166" strokeDashoffset="0" style={{ animation: 'checkmarkCircle 0.6s ease-in-out 0.3s both' }} />
                  <path d="M24 40 L34 50 L56 30" fill="none" stroke="#22C55E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" strokeDashoffset="0" style={{ animation: 'checkmarkDraw 0.4s ease-in-out 0.7s both' }} />
                </svg>
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: DARK, fontWeight: 800, margin: '0 0 0.4rem' }}>Added to Cart!</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#8899aa', margin: '0 0 0.3rem' }}>
                Added to your cart:
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: SKY_BLUE, fontWeight: 700, margin: '0 0 1.5rem' }}>
                {selectedTier.planName} ({planLocationPrice(selectedTier, selectedCity)} · {distanceForCity(selectedCity)})
              </p>

              <div style={{ width: '100%', height: '1px', background: '#E2EBF5', marginBottom: '1.5rem' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button onClick={() => { handleClose(); navigate('/cart') }} style={{
                  width: '100%', padding: '0.85rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: DARK, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(253,188,1,0.25)',
                }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(253,188,1,0.4)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(253,188,1,0.25)' }}>
                  Go to Cart
                </button>
                <button onClick={handleClose} style={{
                  width: '100%', padding: '0.75rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: '#8899aa', background: 'transparent', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s',
                }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = SKY_BLUE; e.currentTarget.style.color = SKY_BLUE }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2EBF5'; e.currentTarget.style.color = '#8899aa' }}>
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
