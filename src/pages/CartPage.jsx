import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { usePageMeta } from '../usePageMeta'
import { saveBookingReturn } from '../utils/bookingStorage'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

const priceNumber = (value) => {
  const n = parseFloat(String(value || '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export default function CartPage() {
  usePageMeta(
    'Your Cart — A Precision Driving School',
    'Review the packages you selected before enrolling at A Precision Driving School.'
  )
  const { items, removeFromCart, enrollAll, refreshCart, loading: cartLoading, syncError } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [removing, setRemoving] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)

  const subtotal = items.reduce((sum, item) => {
    const charge = Number(item.chargeAmount)
    return sum + (Number.isFinite(charge) ? charge : priceNumber(item.price))
  }, 0)
  const continuationCount = items.filter(item => item.continuation).length
  const newPackageCount = items.length - continuationCount
  const expiredSelectionCount = items.filter(item => item.holdExpired).length
  const checkoutBlocked = busy || cartLoading || Boolean(syncError) || expiredSelectionCount > 0

  const handleRemove = async (id) => {
    setRemoving(id)
    setError('')
    try {
      await removeFromCart(id)
    } catch (removeError) {
      setError(removeError.message || 'Unable to remove this package. Please try again.')
    }
    setRemoving(null)
  }

  const handleEnrollAll = async () => {
    if (cartLoading || syncError) return
    if (expiredSelectionCount > 0) {
      setError('One or more time-slot reservations expired. Please remove those selections and choose the times again.')
      return
    }
    if (!user) {
      saveBookingReturn('/cart')
      navigate('/booking/register', { state: { from: '/cart' } })
      return
    }
    if (newPackageCount > 0) {
      navigate('/payment')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await enrollAll()
      if (result.ok) {
        setDone(result)
      } else {
        setError(result.error || 'Checkout failed. Please try again.')
      }
    } catch (checkoutError) {
      setError(checkoutError.message || 'Checkout failed. Please try again.')
    }
    setBusy(false)
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

  return (
    <div style={{ paddingTop: '12rem', paddingBottom: '4rem' }}>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(40px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes checkmarkDraw { 0% { stroke-dashoffset: 50; } 100% { stroke-dashoffset: 0; } }
        @keyframes checkmarkCircle { 0% { stroke-dashoffset: 166; } 100% { stroke-dashoffset: 0; } }
        @keyframes successPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spinLoader { to { transform: rotate(360deg); } }
      `}</style>

      <div className="container" style={{ maxWidth: '860px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD_DEEP, fontWeight: 700, margin: '0 0 0.5rem' }}>Your Selection</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,4vw,2.8rem)', color: DARK, fontWeight: 800, margin: '0 0 0.5rem' }}>Shopping Cart</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#475569', margin: 0 }}>Review new packages and any remaining lessons, then confirm them together.</p>
        </div>

        {syncError && (
          <div role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', padding: '0.8rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', margin: '0 0 1rem', fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#B91C1C' }}>
            <span>{syncError}</span>
            <button type="button" onClick={refreshCart} disabled={cartLoading} style={{ padding: '0.4rem 0.7rem', border: '1px solid #FCA5A5', borderRadius: '6px', background: '#fff', color: '#B91C1C', fontWeight: 800, cursor: cartLoading ? 'wait' : 'pointer' }}>{cartLoading ? 'Retrying...' : 'Retry'}</button>
          </div>
        )}

        {cartLoading && items.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#475569', fontFamily: 'var(--font-body)' }}>Restoring your saved selection...</div>
        ) : items.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-xl)', padding: '3.5rem 2rem', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(1,69,168,0.06),rgba(1,69,168,0.02))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: DARK, fontWeight: 800, margin: '0 0 0.5rem' }}>Your cart is empty</h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#475569', margin: '0 0 1.75rem' }}>Browse our packages and add the ones you want to your cart.</p>
            <Link to="/pricing" className="btn-gold">Browse Packages</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {items.map((it) => (
              <div key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', background: '#fff', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', transition: 'all 0.3s ease', flexWrap: 'wrap' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg,rgba(1,69,168,0.08),rgba(1,69,168,0.03))', color: SKY_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, flexShrink: 0, border: '1px solid rgba(1,69,168,0.08)' }}>{it.id}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: DARK, fontWeight: 800, margin: '0 0 0.2rem', textTransform: 'uppercase' }}>{it.title}</h3>
                  {it.continuation ? (
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap', margin:'0 0 0.65rem' }}>
                      <span style={{ padding:'0.25rem 0.6rem', borderRadius:'999px', background:'#ECFDF5', border:'1px solid #BBF7D0', color:'#15803D', fontFamily:'var(--font-body)', fontSize:'0.76rem', fontWeight:800 }}>Included with your package</span>
                      <span style={{ color:'#334155', fontFamily:'var(--font-body)', fontSize:'0.78rem' }}>No additional charge</span>
                    </div>
                  ) : (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#0755ae', fontWeight: 800, margin: '0 0 0.65rem' }}>{it.price}</p>
                  )}
                  {it.holdExpired && <div role="alert" style={{ margin:'0 0 0.65rem', padding:'0.55rem 0.7rem', borderRadius:'8px', background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', fontFamily:'var(--font-body)', fontSize:'0.78rem', fontWeight:800 }}>This time-slot reservation expired. Remove it and select the lesson times again.</div>}
                  <div style={{ display: 'grid', gap: '0.4rem', color: '#475569', fontFamily: 'var(--font-body)', fontSize: '0.82rem', lineHeight: 1.45 }}>
                    {it.city && <div><strong style={{ color: DARK }}>City:</strong> {it.city}{it.cityDistance ? ` · ${it.cityDistance} location` : ''}</div>}
                    {!it.continuation && it.priceBasis && <div><strong style={{ color: DARK }}>Applied price:</strong> {it.priceBasis} rate · {it.price}</div>}
                    {it.slotAllowance && (
                      <div><strong style={{ color: DARK }}>Package slots:</strong> {it.slotAllowance.used} used + {it.slotAllowance.selected || it.pickupSlots?.length || 0} selected / {it.slotAllowance.maximum} maximum</div>
                    )}
                    {(Array.isArray(it.pickupSlots) && it.pickupSlots.length ? it.pickupSlots : [{ date: it.preferredDate, time: it.pickupTime }]).filter(slot => slot?.date || slot?.time).map((slot, index) => (
                      <div key={`${slot.date || 'date'}-${slot.time || 'time'}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{ color: DARK, fontWeight: 800 }}>Slot {index + 1}:</span>
                        {slot.date && <span>{new Date(`${slot.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                        {slot.date && slot.time && <span aria-hidden="true">&middot;</span>}
                        {slot.time && <span>{slot.time}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => handleRemove(it.id)} disabled={removing === it.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', background: 'none', color: '#DC2626', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220,38,38,0.04)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.15)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                  {removing === it.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}

            <div style={{ background: '#fff', border: '1px solid #E2EBF5', borderRadius: 'var(--radius-xl)', padding: '1.75rem 2rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#475569', fontWeight: 700, margin: 0 }}>Amount due ({newPackageCount} new, {continuationCount} continuation)</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: GOLD, fontWeight: 800, margin: '0.25rem 0 0', lineHeight: 1 }}>${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#334155', margin: 0, maxWidth: '320px', lineHeight: 1.5 }}>{newPackageCount > 0 ? 'New packages are enrolled only after PayPal confirms the payment. Remaining lessons from an existing package have no additional charge.' : 'These lessons are already included in your package. Confirming them will not create another payment.'}</p>
              </div>

              {error && (
                <div style={{ padding: '0.6rem 0.8rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', margin: '0 0 1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#DC2626' }}>{error}</div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button onClick={handleEnrollAll} disabled={checkoutBlocked} style={{ flex: 2, minWidth: '220px', padding: '0.95rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: DARK, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, border: 'none', borderRadius: 'var(--radius-sm)', cursor: checkoutBlocked ? 'not-allowed' : 'pointer', opacity: checkoutBlocked ? 0.6 : 1, transition: 'all 0.3s', boxShadow: checkoutBlocked ? 'none' : '0 4px 16px rgba(253,188,1,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onMouseEnter={(e) => { if (!checkoutBlocked) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(253,188,1,0.4)' } }} onMouseLeave={(e) => { if (!checkoutBlocked) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(253,188,1,0.25)' } }}>
                  {cartLoading ? 'Restoring Cart...' : busy ? 'Confirming...' : expiredSelectionCount > 0 ? 'Reservation Expired' : user ? (newPackageCount > 0 ? 'Proceed to Payment' : 'Confirm Lessons') : 'Sign In to Continue'}
                </button>
                <button onClick={() => navigate('/pricing')} style={{ flex: 1, minWidth: '160px', padding: '0.95rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: SKY_BLUE, background: 'transparent', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.borderColor = SKY_BLUE }} onMouseLeave={(e) => { e.currentTarget.borderColor = '#E2EBF5' }}>
                  Keep Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {busy && (
        <div style={backdropStyle}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', maxWidth: '360px', padding: '3rem 2rem', textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
            <div style={{ width: '56px', height: '56px', border: '3px solid #E2EBF5', borderTopColor: SKY_BLUE, borderRadius: '50%', animation: 'spinLoader 0.8s linear infinite', margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DARK, fontWeight: 700, margin: '0 0 0.4rem' }}>Confirming Your Booking</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#8899aa', margin: 0 }}>Securing your selected lesson times...</p>
          </div>
        </div>
      )}

      {done !== null && (
        <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) setDone(null) }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', maxWidth: '460px', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', animation: 'modalSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)', overflow: 'hidden' }}>
            <div style={{ padding: '2.5rem 2rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', animation: 'pulseRing 1.5s ease-out infinite' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(34,197,94,0.05)', animation: 'pulseRing 1.5s ease-out 0.5s infinite' }} />
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ animation: 'successPop 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
                  <circle cx="40" cy="40" r="36" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeDasharray="166" strokeDashoffset="0" style={{ animation: 'checkmarkCircle 0.6s ease-in-out 0.3s both' }} />
                  <path d="M24 40 L34 50 L56 30" fill="none" stroke="#22C55E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" strokeDashoffset="0" style={{ animation: 'checkmarkDraw 0.4s ease-in-out 0.7s both' }} />
                </svg>
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: DARK, fontWeight: 800, margin: '0 0 0.4rem' }}>Booking Confirmed!</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#8899aa', margin: '0 0 1.5rem' }}>
                {done?.enrolled > 0 && `${done.enrolled} new package${done.enrolled === 1 ? '' : 's'} added. `}
                {done?.continued > 0 && `${done.continued} existing package${done.continued === 1 ? '' : 's'} updated with the selected lesson${done.newBookings === 1 ? '' : 's'}.`}
                {!done?.enrolled && !done?.continued && 'Your booking was completed successfully.'}
              </p>

              <div style={{ width: '100%', height: '1px', background: '#E2EBF5', marginBottom: '1.5rem' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button onClick={() => { setDone(null); navigate('/dashboard') }} style={{ width: '100%', padding: '0.85rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: DARK, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(253,188,1,0.25)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(253,188,1,0.4)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(253,188,1,0.25)' }}>
                  Go to Dashboard
                </button>
                <button onClick={() => setDone(null)} style={{ width: '100%', padding: '0.75rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: '#8899aa', background: 'transparent', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.borderColor = SKY_BLUE; e.currentTarget.style.color = SKY_BLUE }} onMouseLeave={(e) => { e.currentTarget.borderColor = '#E2EBF5'; e.currentTarget.style.color = '#8899aa' }}>
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
      `}</style>
    </div>
  )
}
