import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { api } from '../api'
import Pricing from '../components/Pricing'
import { usePageMeta } from '../usePageMeta'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

const CITIES = [
  'Fremont', 'Newark', 'Hayward', 'Union City', 'San Lorenzo', 'San Leandro',
  'Castro Valley', 'Ashland', 'Oakland', 'San Jose', 'Santa Clara', 'Sunnyvale',
  'Palo Alto', 'San Mateo', 'Mountain View', 'Cupertino', 'Menlo Park',
  'Redwood City', 'San Francisco', 'Millbrae', 'San Bruno', 'Burlingame',
  'Hillsborough', 'South San Francisco', 'Foster City', 'Brisbane', 'Belmont',
  'Alameda', 'Pleasanton', 'San Ramon', 'Milpitas',
]

const PICKUP_TIMES = [
  '07:00 AM - 09:00 AM',
  '09:00 AM - 11:00 AM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
]

const priceNumber = (value) => {
  const n = parseFloat(String(value || '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export default function PricingPage() {
  usePageMeta(
    'Packages & Pricing — A Precision Driving School San Ramon CA',
    'Compare driving school packages: online drivers ed, 2, 6 and 10-hour behind-the-wheel training, DMV drive test car rental and freeway focused courses. 99% pass rate, free pickup & drop.'
  )
  const { user } = useAuth()
  const { addToCart } = useCart()
  const navigate = useNavigate()
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
  const [error, setError] = useState('')
  const [tiers, setTiers] = useState(null)

  useEffect(() => {
    api.getPricing().then(d => { if (Array.isArray(d) && d.length) setTiers(d) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!pendingDate) return
    setBookedTimes([])
    api.getBookingAvailability(pendingDate)
      .then(data => setBookedTimes(Array.isArray(data?.bookedTimes) ? data.bookedTimes : []))
      .catch(() => setBookedTimes([]))
  }, [pendingDate])

  const handleChoose = (tier) => {
    const existing = selectedPlans.find(plan => plan.tier.id === tier.id)
    setSelectedTier(tier)
    setSelectedCity(existing?.city || '')
    setSelectedDate(existing?.slots[0]?.date || '')
    setSelectedTime(existing?.slots[0]?.time || '')
    setSelectedSlots(existing?.slots || [])
    setPendingDate('')
    setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    setStep('city')
    setError('')
  }

  const handleCityNext = () => {
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
    if (!selectedPlans.length || selectedPlans.some(plan => !plan.slots.length)) {
      setError('Please select at least one date and pickup time for every plan.')
      return
    }
    if (!user) {
      navigate('/login')
      return
    }
    setStep('loading')
    try {
      for (const plan of selectedPlans) {
        await addToCart({
          id: plan.tier.id,
          title: plan.tier.planName,
          price: plan.tier.planPrice,
          city: plan.city,
          preferredDate: plan.slots[0]?.date || '',
          pickupTime: plan.slots[0]?.time || '',
          pickupSlots: plan.slots,
        })
        await Promise.all(plan.slots.map(slot => api.createBooking({ userId: user.uid, date: slot.date, timeSlot: slot.time, status: 'scheduled' })))
      }
      navigate('/cart')
    } catch {
      setError('Failed to add booking to cart. Please try again.')
      setStep('calendar')
    }
  }

  const handleConfirm = async (goToCart = false) => {
    setStep('loading')
    try {
      const course = {
        id: selectedTier.id,
        title: selectedTier.planName,
        price: selectedTier.planPrice,
        city: selectedCity,
        preferredDate: selectedDate,
        pickupTime: selectedTime,
        pickupSlots: selectedSlots,
      }
      const result = await addToCart(course)
      if (result.ok) {
        if (result.duplicate) {
          if (goToCart) {
            await Promise.all(selectedSlots.map(slot => api.createBooking({ userId: user.uid, date: slot.date, timeSlot: slot.time, status: 'scheduled' })))
            navigate('/cart')
            return
          }
          setError('This course is already in your cart.')
          setStep('confirm')
          return
        }
        if (goToCart) {
          await Promise.all(selectedSlots.map(slot => api.createBooking({ userId: user.uid, date: slot.date, timeSlot: slot.time, status: 'scheduled' })))
          navigate('/cart')
        } else setStep('success')
      } else {
        setError(result.error || 'Failed to add to cart. Please try again.')
        setStep(goToCart ? 'calendar' : 'confirm')
      }
    } catch {
      setError('Failed to add to cart. Please try again.')
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

  const plansTotal = selectedPlans.reduce((sum, plan) => sum + priceNumber(plan.tier.planPrice), 0)

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
    <div style={{ paddingTop: '12rem', paddingBottom: '4rem' }}>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(40px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes checkmarkDraw { 0% { stroke-dashoffset: 50; } 100% { stroke-dashoffset: 0; } }
        @keyframes checkmarkCircle { 0% { stroke-dashoffset: 166; } 100% { stroke-dashoffset: 0; } }
        @keyframes successPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spinLoader { to { transform: rotate(360deg); } }
        @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
      `}</style>

      <Pricing light onEnroll={handleChoose} tiers={tiers} />

      {step === 'city' && selectedTier && (
        <div style={{ ...backdropStyle, alignItems: 'flex-start', paddingTop: '1.25rem' }} onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
          <div style={{ ...modalStyle, maxWidth: '800px', borderRadius: '8px', padding: '1.35rem 1.8rem 1.8rem' }}>
            <button onClick={handleClose} aria-label="Close" style={{ position: 'absolute', top: '1rem', right: '1.25rem', border: 0, background: 'transparent', color: '#777', fontSize: '2rem', lineHeight: 1, cursor: 'pointer', padding: 0 }}>&times;</button>

            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 2.5rem 1.5rem 0', fontFamily: 'var(--font-body)', fontSize: '1.25rem', color: DARK, fontWeight: 800 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0866ff" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              Find Driving Lessons Near You
            </h2>

            <div style={{ fontFamily: 'var(--font-body)', color: DARK, fontSize: '1rem', lineHeight: 1.6, marginBottom: '0.25rem' }}>
              <div>Plan Name: <strong>{selectedTier.planName}</strong></div>
              <div>Price: <strong>{selectedTier.planPrice}</strong></div>
            </div>
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
                {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
              <button onClick={handleCityNext} style={{ minHeight: '46px', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0 1.15rem', border: 0, borderRadius: '10px', background: '#0755ae', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 7px 18px rgba(7,85,174,0.18)' }}>
                Next
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
            {error && <p style={{ margin: '0.55rem 0 0', color: '#dc2626', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>{error}</p>}
          </div>
        </div>
      )}

      {step === 'calendar' && selectedTier && (
        <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
          <div style={{ ...modalStyle, maxWidth: '640px', borderRadius: '12px', padding: '1.2rem', background: '#f8fafc' }}>
            <button onClick={handleClose} aria-label="Close" style={{ position: 'absolute', top: '0.75rem', right: '1rem', zIndex: 2, border: 0, background: 'transparent', color: '#64748b', fontSize: '1.8rem', cursor: 'pointer' }}>&times;</button>
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <h2 style={{ margin: 0, color: '#08284a', fontFamily: 'var(--font-body)', fontSize: '1.7rem', fontWeight: 800 }}>Your Selected Course</h2>
              <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>You've chosen the perfect driving course for your needs!</p>
            </div>

            <div style={{ padding: '1rem 0.75rem 0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ color: '#64748b', fontFamily: 'var(--font-body)', fontSize: '0.75rem' }}>Select Your Preferred Dates</div>
                  <strong style={{ color: '#0755ae', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>{calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</strong>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button disabled={calendarMonth <= currentMonthStart} onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))} style={{ width: '32px', height: '30px', border: 0, borderRadius: '8px', background: '#f1f5f9', color: '#08284a', fontSize: '1.35rem', cursor: calendarMonth <= currentMonthStart ? 'not-allowed' : 'pointer', opacity: calendarMonth <= currentMonthStart ? 0.4 : 1 }}>&lsaquo;</button>
                  <button onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))} style={{ width: '32px', height: '30px', border: 0, borderRadius: '8px', background: '#f1f5f9', color: '#08284a', fontSize: '1.35rem', cursor: 'pointer' }}>&rsaquo;</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '6px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} style={{ textAlign: 'center', padding: '0.25rem 0', color: '#475569', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}>{day}</div>)}
                {calendarDays.map((day, index) => {
                  if (!day) return <div key={`blank-${index}`} />
                  const dayDate = new Date(calendarYear, calendarMonthIndex, day)
                  const disabled = dayDate < today
                  const key = dateKey(day)
                  const selected = selectedSlots.some(slot => slot.date === key)
                  return (
                    <button key={key} disabled={disabled} onClick={() => { setPendingDate(key); setError('') }} style={{ minHeight: '42px', border: selected ? '2px solid #0755ae' : `1px solid ${disabled ? '#fee2e2' : '#cde7d2'}`, borderRadius: '3px', background: selected ? '#dbeafe' : disabled ? '#fff1f2' : '#edf7ef', color: selected ? '#0755ae' : disabled ? '#ff3b45' : '#19963b', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: selected ? 800 : 500, cursor: disabled ? 'not-allowed' : 'pointer' }}>{day}</button>
                  )
                })}
              </div>

              <div style={{ marginTop: '0.9rem', fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 700, color: DARK }}>Selected Dates:</div>
              {selectedPlans.filter(plan => plan.tier.id !== selectedTier.id).map(plan => (
                <div key={plan.tier.id} onClick={() => activatePlan(plan)} style={{ marginTop: '0.35rem', padding: '0.65rem', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div>
                      <strong style={{ color: '#586576', fontFamily: 'var(--font-body)', fontSize: '0.8rem' }}>{plan.tier.planName}</strong>
                      <span style={{ color: '#64748b', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}> ({plan.slots.length}/4 slots)</span>
                      <div style={{ color: '#64748b', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}>{plan.city}</div>
                      <button onClick={(e) => { e.stopPropagation(); removePlan(plan.tier.id) }} style={{ marginTop: '0.4rem', padding: '0.32rem 0.5rem', border: 0, borderRadius: '4px', background: '#e93647', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.65rem', cursor: 'pointer' }}>Remove plan</button>
                    </div>
                    <span style={{ alignSelf: 'flex-start', padding: '0.25rem 0.55rem', borderRadius: '999px', background: '#0755ae', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 800 }}>{plan.tier.planPrice}</span>
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.55rem', paddingTop: '0.45rem' }}>
                    {plan.slots.length ? plan.slots.map(slot => (
                      <div key={`${slot.date}-${slot.time}`} style={{ padding: '0.45rem', marginBottom: '0.3rem', background: '#f8fafc', color: '#53657a', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}>
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
                    <span style={{ color: '#64748b', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}> (Select up to 4 slots)</span>
                    <div style={{ marginTop: '0.2rem', color: '#64748b', fontFamily: 'var(--font-body)', fontSize: '0.7rem' }}>{selectedCity}</div>
                    <button onClick={() => removePlan(selectedTier.id)} style={{ marginTop: '0.45rem', padding: '0.35rem 0.55rem', border: 0, borderRadius: '4px', background: '#e93647', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}>Remove plan</button>
                  </div>
                  <span style={{ alignSelf: 'flex-start', padding: '0.25rem 0.55rem', borderRadius: '999px', background: '#0755ae', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 800 }}>{selectedTier.planPrice}</span>
                </div>
                <div style={{ borderTop: '1px solid #cbd5e1', marginTop: '0.65rem', paddingTop: '0.55rem', fontFamily: 'var(--font-body)', fontSize: '0.75rem' }}>
                  {selectedSlots.length ? selectedSlots.map(slot => (
                    <div key={`${slot.date}-${slot.time}`} style={{ padding: '0.55rem', marginBottom: '0.35rem', background: 'rgba(255,255,255,0.62)', borderRadius: '3px', color: '#53657a' }}>
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
              <div style={{ margin: '0.45rem 0', color: '#08284a', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 800 }}>Total: ${plansTotal.toFixed(2)}</div>
              <button onClick={handleBooking} style={{ width: '100%', minHeight: '38px', border: 0, borderRadius: '8px', background: '#0755ae', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 800, cursor: 'pointer' }}>Proceed to Booking</button>
            </div>

            {pendingDate && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(15,23,42,0.48)' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '525px', maxHeight: '92vh', overflowY: 'auto', padding: '3rem clamp(1.2rem, 6vw, 3.5rem) 1.4rem', borderRadius: '16px', background: '#fff', boxShadow: '0 24px 70px rgba(15,23,42,0.3)' }}>
                  <button onClick={() => setPendingDate('')} aria-label="Close pickup time" style={{ position: 'absolute', top: '0.8rem', right: '1.1rem', border: 0, background: 'transparent', color: '#64748b', fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '2.5rem' }}>
                    <div style={{ width: '55px', height: '55px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0efff', color: '#0755ae' }}>
                      <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                    </div>
                    <h3 style={{ margin: 0, color: '#102a46', fontFamily: 'var(--font-body)', fontSize: '1.5rem', fontWeight: 800 }}>Select Pickup Time</h3>
                  </div>
                  <p style={{ margin: '0 0 0.6rem', color: DARK, fontFamily: 'var(--font-body)', fontSize: '1.05rem', fontWeight: 800 }}>
                    Selected Date: {new Date(`${pendingDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p style={{ margin: '0 0 1.2rem', color: '#102a46', fontFamily: 'var(--font-body)', fontSize: '1rem' }}>Choose your preferred pickup time:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                    {PICKUP_TIMES.map(time => {
                      const booked = bookedTimes.includes(time) || selectedSlots.some(slot => slot.date === pendingDate && slot.time === time)
                      const limitReached = selectedSlots.length >= 4
                      return (
                      <div key={time} style={{ minHeight: '56px', padding: '0.7rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', borderRadius: '11px', background: booked ? '#ffe5e5' : '#fff', boxShadow: booked ? 'none' : '0 8px 24px rgba(15,23,42,0.09)' }}>
                        <strong style={{ color: '#08284a', fontFamily: 'var(--font-body)', fontSize: '1rem' }}>{time}</strong>
                        {booked ? (
                          <button disabled style={{ padding: '0.55rem 0.75rem', border: 0, borderRadius: '5px', background: '#e93647', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 800, cursor: 'not-allowed' }}>Booked</button>
                        ) : (
                          <button disabled={limitReached} onClick={() => { const nextSlots = [...selectedSlots, { date: pendingDate, time }]; setSelectedSlots(nextSlots); setSelectedPlans(prev => prev.map(plan => plan.tier.id === selectedTier.id ? { ...plan, slots: nextSlots } : plan)); setSelectedDate(pendingDate); setSelectedTime(time); setPendingDate(''); setError('') }} style={{ padding: '0.55rem 0.75rem', border: 0, borderRadius: '5px', background: limitReached ? '#94a3b8' : '#0866ff', color: '#fff', fontFamily: 'var(--font-body)', fontSize: '0.9rem', cursor: limitReached ? 'not-allowed' : 'pointer' }}>{limitReached ? 'Max 4 Slots' : 'Book Now'}</button>
                        )}
                      </div>
                    )})}
                  </div>
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
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>Today's Price</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: GOLD, fontWeight: 800, lineHeight: 1 }}>{selectedTier.planPrice}</span>
                </div>
                {selectedTier.planPriceTwo && selectedTier.planPriceTwo !== selectedTier.planPrice && (
                  <div style={{ paddingTop: '0.55rem' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#94A3B8', fontWeight: 600, lineHeight: 1, textDecoration: 'line-through' }}>{selectedTier.planPriceTwo}</span>
                    {priceNumber(selectedTier.planPriceTwo) > priceNumber(selectedTier.planPrice) && (
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.55rem', fontWeight: 700, color: '#16A34A', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '999px', padding: '0.15rem 0.45rem', display: 'block', marginTop: '0.3rem', width: 'fit-content' }}>
                        Save ${priceNumber(selectedTier.planPriceTwo) - priceNumber(selectedTier.planPrice)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ width: '100%', height: '1px', background: '#E2EBF5', marginBottom: '1.25rem' }} />

              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 700, marginBottom: '0.75rem' }}>What's included</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', listStyle: 'none', padding: 0, margin: '0 0 1.75rem 0' }}>
                {selectedTier.options.map((opt, i) => (
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
                {selectedTier.planName} ({selectedTier.planPrice})
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
