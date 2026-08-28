import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { usePageMeta } from '../usePageMeta'

const BLUE = '#0145A8'
const DARK = '#0A1628'
const GOLD = '#FDBC01'

let paypalSdkPromise = null

function loadPayPalSdk(clientId, currency) {
  if (window.paypal?.Buttons) return Promise.resolve(window.paypal)
  if (paypalSdkPromise) return paypalSdkPromise
  paypalSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const params = new URLSearchParams({
      'client-id': clientId,
      currency,
      intent: 'capture',
      components: 'buttons',
    })
    script.src = `https://www.paypal.com/sdk/js?${params}`
    script.async = true
    script.dataset.paypalSdk = 'true'
    script.onload = () => window.paypal?.Buttons
      ? resolve(window.paypal)
      : reject(new Error('PayPal checkout could not be loaded.'))
    script.onerror = () => {
      paypalSdkPromise = null
      reject(new Error('PayPal checkout could not be loaded. Check your connection and try again.'))
    }
    document.head.appendChild(script)
  })
  return paypalSdkPromise
}

const amountNumber = value => {
  const amount = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

const formatUSD = value => Number(value || 0).toLocaleString('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const displayDate = value => {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PaymentPage() {
  usePageMeta(
    'Secure Payment — A Precision Driving School',
    'Review your selected driving lessons and continue to secure payment.',
    { noIndex: true }
  )

  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, loading, syncError, refreshCart } = useCart()
  const [coupon, setCoupon] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [paymentState, setPaymentState] = useState('idle')
  const [paymentError, setPaymentError] = useState('')
  const [paymentEnvironment, setPaymentEnvironment] = useState('sandbox')
  const [paymentResult, setPaymentResult] = useState(null)
  const paypalButtonsRef = useRef(null)
  const [checkoutReference] = useState(() => {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
    return `PAY-${Date.now().toString(36).toUpperCase()}-${suffix}`
  })

  const subtotal = useMemo(() => items.reduce((sum, item) => {
    const charge = Number(item.chargeAmount)
    return sum + (Number.isFinite(charge) ? charge : amountNumber(item.price))
  }, 0), [items])
  const discount = Number(appliedCoupon?.discount || 0)
  const total = Math.max(0, Number(appliedCoupon?.total ?? subtotal))

  const selectedSlots = useMemo(() => items.flatMap(item => {
    const slots = Array.isArray(item.pickupSlots) ? item.pickupSlots : []
    return slots.map(slot => ({ ...slot, plan: item.title, city: item.city }))
  }), [items])

  const applyCoupon = async event => {
    event.preventDefault()
    const code = coupon.trim().toUpperCase()
    if (!code) {
      setNotice('Enter a coupon code before selecting Apply Coupon.')
      return
    }
    if (!user) {
      setNotice('Please sign in before applying a coupon.')
      return
    }
    setCouponLoading(true)
    setPaymentError('')
    try {
      const result = await api.validateCoupon(user.uid, code)
      setCoupon(code)
      setAppliedCoupon({ ...result.coupon, subtotal: Number(result.subtotal), discount: Number(result.discount), total: Number(result.total) })
      setNotice(result.message || `${code} applied successfully.`)
    } catch (error) {
      setAppliedCoupon(null)
      setNotice(error.message || 'Coupon could not be applied.')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCoupon('')
    setNotice('Coupon removed. The regular order total has been restored.')
  }

  useEffect(() => {
    if (!user || !items.length || subtotal <= 0 || paymentResult) return undefined
    let cancelled = false
    let buttons = null

    const initializePayPal = async () => {
      try {
        setPaymentState('loading')
        setPaymentError('')
        const config = await api.getPayPalConfig()
        if (cancelled) return
        setPaymentEnvironment(config.environment || 'sandbox')
        const paypal = await loadPayPalSdk(config.clientId, config.currency || 'USD')
        if (cancelled || !paypalButtonsRef.current) return
        paypalButtonsRef.current.replaceChildren()
        buttons = paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'pill',
            label: 'paypal',
            height: 48,
          },
          createOrder: async () => {
            setPaymentState('processing')
            setPaymentError('')
            const order = await api.createPayPalOrder(user.uid, appliedCoupon?.code || '')
            if (!order?.id) throw new Error('PayPal did not return an order number.')
            return order.id
          },
          onApprove: async (data, actions) => {
            try {
              setPaymentState('processing')
              const result = await api.capturePayPalOrder(user.uid, data.orderID)
              if (cancelled) return
              setPaymentResult(result)
              setPaymentState('complete')
              await refreshCart()
            } catch (error) {
              if (error.code === 'INSTRUMENT_DECLINED' && actions?.restart) {
                setPaymentState('ready')
                setPaymentError('That payment method was declined. Please choose another PayPal funding source.')
                return actions.restart()
              }
              setPaymentState('error')
              setPaymentError(error.message || 'PayPal payment could not be completed. Please try again.')
              throw error
            }
          },
          onCancel: () => {
            setPaymentState('ready')
            setPaymentError('Payment was cancelled. Your booking selection is still saved for a limited time.')
          },
          onError: () => {
            setPaymentState('error')
            setPaymentError(current => current || 'PayPal checkout encountered an error. Please try again.')
          },
        })
        if (!buttons.isEligible()) {
          throw new Error('PayPal is not available for this browser or location.')
        }
        await buttons.render(paypalButtonsRef.current)
        if (!cancelled) setPaymentState('ready')
      } catch (error) {
        if (!cancelled) {
          setPaymentState('error')
          setPaymentError(error.message || 'PayPal checkout could not be loaded.')
        }
      }
    }

    initializePayPal()
    return () => {
      cancelled = true
      try { buttons?.close() } catch { /* PayPal may already have removed its iframe. */ }
    }
  }, [appliedCoupon?.code, items, paymentResult, refreshCart, subtotal, user])

  return (
    <section className="payment-page">
      <style>{`
        .payment-page{padding:clamp(9.5rem,13vw,12rem) 1rem 5rem;min-height:100vh;background:radial-gradient(circle at 12% 18%,rgba(1,69,168,.09),transparent 30rem),#F4F7FB;color:${DARK}}
        .payment-shell{width:min(1120px,100%);margin:0 auto}
        .payment-heading{text-align:center;margin:0 0 2.2rem}.payment-heading p{margin:.45rem 0 0;color:#334155}
        .payment-heading h1{margin:0;font-family:var(--font-display);font-size:clamp(2.1rem,5vw,3.35rem);font-weight:900;color:${DARK}}
        .payment-grid{display:grid;grid-template-columns:minmax(0,.9fr) minmax(360px,1.1fr);gap:1.5rem;align-items:stretch}
        .payment-security,.payment-card{border:1px solid #D9E4F0;border-radius:20px;background:#fff;box-shadow:0 24px 70px rgba(15,35,65,.1);overflow:hidden}
        .payment-security{padding:clamp(1.5rem,4vw,3rem);background:linear-gradient(145deg,#071A35,#0B3C78);color:#fff;display:flex;flex-direction:column;justify-content:center;min-height:620px;position:relative}
        .payment-security:before{content:'';position:absolute;width:320px;height:320px;border-radius:50%;right:-110px;top:-90px;background:rgba(253,188,1,.14)}
        .payment-shield{width:96px;height:96px;border-radius:28px;display:grid;place-items:center;background:linear-gradient(145deg,${GOLD},#FFE071);color:${DARK};box-shadow:0 18px 45px rgba(253,188,1,.3);position:relative}
        .payment-security h2{font-family:var(--font-display);font-size:clamp(1.7rem,3vw,2.4rem);line-height:1.15;margin:2rem 0 .85rem;position:relative}.payment-security>p{color:#C8D7EA;line-height:1.7;max-width:430px;position:relative}
        .payment-assurances{display:grid;gap:1rem;margin:2rem 0 0;position:relative}.payment-assurance{display:flex;gap:.8rem;align-items:flex-start}.payment-assurance b{display:block;margin-bottom:.18rem}.payment-assurance span{color:#B8CBE2;font-size:.87rem;line-height:1.5}.payment-check{width:25px;height:25px;display:grid;place-items:center;border-radius:50%;background:rgba(253,188,1,.16);color:${GOLD};font-weight:900;flex:0 0 auto}
        .payment-card{border-top:6px solid ${BLUE};padding:clamp(1.35rem,4vw,2.5rem)}
        .payment-card h2{margin:0 0 1.7rem;font-family:var(--font-display);font-size:clamp(1.65rem,3vw,2.25rem);color:${BLUE};text-align:center}
        .payment-reference{padding:1rem;border-radius:12px;background:#F7FAFE;border:1px solid #E0E9F3;margin-bottom:1.2rem}.payment-reference span{display:block;color:#334155;font-size:.76rem;text-transform:uppercase;letter-spacing:.12em;font-weight:800}.payment-reference strong{display:block;margin-top:.25rem;overflow-wrap:anywhere;color:${DARK}}
        .payment-items{display:grid;gap:.75rem;margin:0 0 1.2rem}.payment-item{padding:.9rem 0;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;gap:1rem}.payment-item:last-child{border-bottom:0}.payment-item strong{display:block}.payment-item small{display:block;margin-top:.25rem;color:#334155;line-height:1.45}.payment-item-price{font-weight:900;color:${BLUE};white-space:nowrap}
        .payment-slot-list{padding:.8rem 1rem;border-radius:10px;background:#F8FAFC;margin-bottom:1.2rem;color:#475569;font-size:.82rem}.payment-slot-list strong{color:${DARK}}.payment-slot-list div+div{margin-top:.4rem}
        .payment-coupon{display:flex;gap:.65rem;margin-bottom:.65rem}.payment-coupon input{min-width:0;flex:1;min-height:48px;padding:.75rem .9rem;border:1.5px solid #D8E2EE;border-radius:10px;background:#fff;color:#111827;font:500 .9rem var(--font-body);outline:none;text-transform:uppercase}.payment-coupon input::placeholder{color:#64748B;opacity:1}.payment-coupon input:focus{border-color:${BLUE};box-shadow:0 0 0 4px rgba(1,69,168,.08)}.payment-coupon button{border:0;border-radius:10px;background:${BLUE};color:#fff;font-weight:800;padding:.75rem 1rem;cursor:pointer}.payment-coupon button:disabled{cursor:not-allowed;opacity:.62}.payment-coupon-applied{display:flex;align-items:center;justify-content:space-between;gap:.75rem;padding:.7rem .85rem;margin:0 0 1rem;border:1px solid #86EFAC;border-radius:10px;background:#F0FDF4;color:#166534;font-size:.84rem;font-weight:800}.payment-coupon-applied button{border:0;background:transparent;color:#B91C1C;font-weight:900;cursor:pointer}
        .payment-total{display:grid;gap:.55rem;padding:1rem 0;border-top:1px solid #DCE5EF;border-bottom:1px solid #DCE5EF;margin-bottom:1.15rem}.payment-total-row{display:flex;justify-content:space-between;gap:1rem;color:#475569}.payment-total-row.final{font-size:1.15rem;color:${DARK};font-weight:900}.payment-total-row.final strong{color:${BLUE}}
        .payment-notice{padding:.8rem .9rem;border:1px solid #FCD34D;border-radius:10px;background:#FFFBEB;color:#92400E;font-size:.82rem;line-height:1.5;margin:0 0 1rem}
        .paypal-checkout{min-height:52px;position:relative}.paypal-loading{min-height:52px;display:grid;place-items:center;border-radius:999px;background:#F1F5F9;color:#334155;font-weight:800}.paypal-processing{padding:.75rem 1rem;border-radius:10px;background:#EFF6FF;color:#1D4ED8;text-align:center;font-weight:800;margin-bottom:.75rem}.paypal-error{padding:.8rem .9rem;border:1px solid #FCA5A5;border-radius:10px;background:#FEF2F2;color:#B91C1C;font-size:.84rem;line-height:1.5;margin-bottom:.85rem}.payment-powered{text-align:center;margin:.85rem 0 0;color:#475569;font-size:.72rem}.payment-powered strong{color:#087CC1}
        .payment-success{padding:clamp(2rem,6vw,4.5rem);text-align:center;border:1px solid #BBE7D2;border-top:6px solid #059669;border-radius:20px;background:#fff;box-shadow:0 24px 70px rgba(15,35,65,.1)}.payment-success-icon{width:76px;height:76px;margin:0 auto 1.2rem;border-radius:50%;display:grid;place-items:center;background:#ECFDF5;color:#047857;font-size:2.2rem;font-weight:900}.payment-success h2{margin:0;font-family:var(--font-display);font-size:clamp(2rem,4vw,3rem);color:${DARK}}.payment-success p{color:#334155;line-height:1.65}.payment-success-reference{display:inline-block;padding:.8rem 1rem;margin:.5rem 0 1.3rem;border-radius:10px;background:#F8FAFC;border:1px solid #E2E8F0;color:${DARK};overflow-wrap:anywhere}.payment-success-actions{display:flex;justify-content:center;gap:.75rem;flex-wrap:wrap}
        .payment-actions{display:flex;justify-content:center;gap:.7rem;flex-wrap:wrap;margin-top:1.35rem}.payment-back{border:1px solid #CAD7E5;border-radius:999px;background:#fff;color:${BLUE};padding:.75rem 1.15rem;font-weight:800;cursor:pointer}.payment-contact{color:${BLUE};font-weight:800;text-decoration:none;padding:.75rem 1.15rem}
        .payment-empty{padding:4rem 1rem;text-align:center;border:1px solid #D9E4F0;border-radius:20px;background:#fff;box-shadow:0 20px 60px rgba(15,35,65,.08)}.payment-empty h2{font-family:var(--font-display);font-size:2rem;margin:0 0 .6rem}.payment-empty p{color:#334155;margin:0 0 1.5rem}
        @media(max-width:860px){.payment-grid{grid-template-columns:1fr}.payment-security{min-height:auto}.payment-security h2{margin-top:1.4rem}}
        @media(max-width:520px){.payment-page{padding-inline:.7rem}.payment-card{padding:1.1rem}.payment-coupon{flex-direction:column}.payment-coupon button{width:100%}.payment-item{flex-direction:column}.payment-security{padding:1.35rem}}
      `}</style>

      <div className="payment-shell">
        <header className="payment-heading">
          <h1>Complete Your Payment</h1>
          <p>Review your booking details before choosing a secure payment method.</p>
        </header>

        {paymentResult ? (
          <div className="payment-success" role="status">
            <div className="payment-success-icon" aria-hidden="true">✓</div>
            <h2>Payment completed</h2>
            <p>Your PayPal payment was verified and your selected course and lesson times are now enrolled.</p>
            <div className="payment-success-reference">
              PayPal order: <strong>{paymentResult.orderId}</strong>
              {paymentResult.captureId && <><br />Capture: <strong>{paymentResult.captureId}</strong></>}
            </div>
            <div className="payment-success-actions">
              <Link to="/dashboard?tab=courses" className="btn-gold">View My Courses</Link>
              <Link to="/dashboard?tab=payments" className="payment-contact">View Receipt</Link>
            </div>
          </div>
        ) : loading && !items.length ? (
          <div className="payment-empty" role="status">Restoring your selected booking...</div>
        ) : !items.length ? (
          <div className="payment-empty">
            <h2>No payment is due</h2>
            <p>Your cart does not contain a booking that is ready for payment.</p>
            <Link to="/pricing" className="btn-gold">View Pricing Plans</Link>
          </div>
        ) : (
          <div className="payment-grid">
            <aside className="payment-security">
              <div className="payment-shield" aria-hidden="true">
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              </div>
              <h2>Your booking details stay protected.</h2>
              <p>The payment processor will securely handle card or bank information. A Precision Driving School will only receive the payment result and transaction reference.</p>
              <div className="payment-assurances">
                <div className="payment-assurance"><span className="payment-check">✓</span><div><b>Clear order summary</b><span>Confirm plans, locations, lesson times and the total before paying.</span></div></div>
                <div className="payment-assurance"><span className="payment-check">✓</span><div><b>No duplicate enrollment</b><span>Your course should be activated only after verified payment confirmation.</span></div></div>
                <div className="payment-assurance"><span className="payment-check">✓</span><div><b>Payment receipt</b><span>Once connected, the provider transaction reference will appear in your dashboard.</span></div></div>
              </div>
            </aside>

            <div className="payment-card">
              <h2>Payment Details</h2>
              <div className="payment-reference">
                <span>Checkout Reference</span>
                <strong>{checkoutReference}</strong>
              </div>

              <div className="payment-items">
                {items.map(item => (
                  <div className="payment-item" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.city || 'Selected location'}{item.cityZip ? `, CA ${item.cityZip}` : ''}{item.cityDistance ? ` · ${item.cityDistance} rate` : ''}</small>
                    </div>
                    <span className="payment-item-price">{item.continuation ? 'Included' : formatUSD(Number.isFinite(Number(item.chargeAmount)) ? Number(item.chargeAmount) : amountNumber(item.price))}</span>
                  </div>
                ))}
              </div>

              {selectedSlots.length > 0 && (
                <div className="payment-slot-list">
                  {selectedSlots.map((slot, index) => (
                    <div key={`${slot.plan}-${slot.date}-${slot.time}-${index}`}><strong>{slot.plan}:</strong> {displayDate(slot.date)}{slot.time ? ` · ${slot.time}` : ''}{slot.city ? ` · ${slot.city}` : ''}</div>
                  ))}
                </div>
              )}

              <form className="payment-coupon" onSubmit={applyCoupon}>
                <label htmlFor="payment-coupon" className="sr-only">Coupon code</label>
                <input id="payment-coupon" value={coupon} disabled={couponLoading || paymentState === 'processing'} onChange={event => { setCoupon(event.target.value.toUpperCase()); setNotice('') }} maxLength="32" autoComplete="off" placeholder="Enter coupon code" />
                <button type="submit" disabled={couponLoading || paymentState === 'processing'}>{couponLoading ? 'Checking…' : appliedCoupon ? 'Reapply' : 'Apply Coupon'}</button>
              </form>
              {appliedCoupon && <div className="payment-coupon-applied" role="status"><span>✓ {appliedCoupon.code} applied — you save {formatUSD(discount)}</span><button type="button" onClick={removeCoupon} disabled={paymentState === 'processing'}>Remove</button></div>}

              <div className="payment-total">
                <div className="payment-total-row"><span>Subtotal</span><strong>{formatUSD(subtotal)}</strong></div>
                <div className="payment-total-row"><span>Coupon Discount{appliedCoupon ? ` (${appliedCoupon.code})` : ''}</span><strong>{discount > 0 ? `−${formatUSD(discount)}` : formatUSD(0)}</strong></div>
                <div className="payment-total-row"><span>Tax</span><strong>{formatUSD(0)}</strong></div>
                <div className="payment-total-row final"><span>Total Due</span><strong>{formatUSD(total)}</strong></div>
              </div>

              {syncError && <div className="payment-notice" role="alert">{syncError} <button type="button" onClick={refreshCart} style={{ border: 0, background: 'transparent', color: BLUE, fontWeight: 900, cursor: 'pointer' }}>Retry</button></div>}
              {notice && <div className="payment-notice" role="status">{notice}</div>}

              {paymentError && <div className="paypal-error" role="alert">{paymentError}</div>}
              {paymentState === 'processing' && <div className="paypal-processing" role="status">Securely processing your PayPal payment. Please do not close this page.</div>}
              {(paymentState === 'idle' || paymentState === 'loading') && (
                <div className="paypal-loading" role="status">Loading secure PayPal checkout...</div>
              )}
              {/* Keep this node empty so only the PayPal SDK owns its children. */}
              <div className="paypal-checkout" ref={paypalButtonsRef} aria-describedby="payment-provider-status" />
              <p id="payment-provider-status" className="payment-powered">
                PayPal {paymentEnvironment === 'sandbox' ? 'Sandbox test mode' : 'secure checkout'} · Course enrollment completes only after verified payment
              </p>

              <div className="payment-actions">
                <button type="button" className="payment-back" onClick={() => navigate('/cart')}>← Back to Cart</button>
                <Link className="payment-contact" to="/contact">Need help?</Link>
              </div>
              <p style={{ margin: '.8rem 0 0', textAlign: 'center', color: '#475569', fontSize: '.72rem' }}>Signed in as {user?.email || 'student'}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
