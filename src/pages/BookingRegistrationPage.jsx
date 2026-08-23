import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, deleteUser, updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import { api } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { usePageMeta } from '../usePageMeta'
import { saveBookingReturn, writeGuestCart } from '../utils/bookingStorage'
import PasswordInput from '../components/PasswordInput'

const SKY_BLUE = '#0145A8'
const DARK = '#0A1628'
const GOLD = '#FDBC01'

const priceNumber = value => {
  const amount = Number.parseFloat(String(value || '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

const phoneIsValid = value => {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

const splitFullName = value => {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? parts.at(-1) : '',
  }
}

function Field({ id, label, required = false, wide = false, children }) {
  return (
    <div className={wide ? 'booking-register-wide' : ''}>
      <label htmlFor={id} className="booking-register-label">
        {label}{required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
    </div>
  )
}

export default function BookingRegistrationPage() {
  usePageMeta(
    'Complete Your Booking — A Precision Driving School',
    'Create your secure student account and provide the information needed for your selected driving lessons.',
    { noIndex: true }
  )
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items } = useCart()
  const [creating, setCreating] = useState(false)
  const [completedUid, setCompletedUid] = useState('')
  const [error, setError] = useState('')
  const [sameAsHome, setSameAsHome] = useState(false)
  const [form, setForm] = useState(() => ({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    studentPhone: '',
    parentPhone: '',
    gender: '',
    dob: '',
    permit: '',
    homeAddress: '',
    city: items[0]?.city || '',
    state: 'California',
    zipCode: '',
    pickupAddress: '',
    medications: '',
    notes: '',
    acceptedTerms: false,
  }))

  const total = useMemo(() => items.reduce((sum, item) => {
    const charge = Number(item.chargeAmount)
    return sum + (Number.isFinite(charge) ? charge : priceNumber(item.price))
  }, 0), [items])

  const computedHomeAddress = [form.homeAddress, form.city, form.state, form.zipCode]
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(', ')

  useEffect(() => {
    if (creating) return
    if (completedUid && user?.uid === completedUid) {
      navigate('/payment', { replace: true })
      return
    }
    if (!completedUid && user) navigate('/cart', { replace: true })
  }, [completedUid, creating, navigate, user])

  const update = event => {
    const { name, type, checked, value } = event.target
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  const validate = () => {
    if (!items.length) return 'Your booking selection is empty. Please select a plan first.'
    if (!form.email.trim()) return 'Please enter your email address.'
    if (form.password.length < 8) return 'Password must contain at least 8 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    if (!form.fullName.trim()) return 'Please enter the student’s full name.'
    if (!phoneIsValid(form.studentPhone)) return 'Please enter a valid student phone number.'
    if (!phoneIsValid(form.parentPhone)) return 'Please enter a valid parent or guardian phone number.'
    if (!form.dob) return 'Please select the student’s date of birth.'
    if (!form.homeAddress.trim() || !form.city.trim()) return 'Please enter the complete home address and city.'
    if (!/^\d{5}(?:-\d{4})?$/.test(form.zipCode.trim())) return 'Please enter a valid ZIP code.'
    if (!sameAsHome && !form.pickupAddress.trim()) return 'Please enter the pickup address or select “Same as home address”.'
    if (!form.acceptedTerms) return 'Please accept the Terms of Service to continue.'
    return ''
  }

  const submit = async event => {
    event.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setCreating(true)
    setError('')
    let createdUser = null
    const bookingSnapshot = [...items]
    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password)
      createdUser = credential.user
      const names = splitFullName(form.fullName)
      await updateProfile(createdUser, { displayName: form.fullName.trim() })
      await api.saveUser(createdUser.uid, {
        ...names,
        displayName: form.fullName.trim(),
        name: form.fullName.trim(),
        dob: form.dob,
        phone: form.studentPhone.trim(),
        parentPhone: form.parentPhone.trim(),
        gender: form.gender,
        email: form.email.trim(),
        permit: form.permit.trim(),
        address: form.homeAddress.trim(),
        city: form.city.trim(),
        state: form.state,
        zipCode: form.zipCode.trim(),
        pickupAddress: sameAsHome ? computedHomeAddress : form.pickupAddress.trim(),
        medications: form.medications.trim(),
        notes: form.notes.trim(),
        courseType: items.map(item => item.id).join(',').slice(0, 120),
        completedModules: [],
        termsAcceptedAt: new Date().toISOString(),
      })
      saveBookingReturn('/payment')
      setCompletedUid(createdUser.uid)
    } catch (registrationError) {
      writeGuestCart(bookingSnapshot)
      if (createdUser) {
        try { await deleteUser(createdUser) } catch { /* Firebase account can be recovered through sign-in. */ }
      }
      if (registrationError.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in to continue with your saved booking.')
      } else if (registrationError.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (registrationError.code === 'auth/weak-password') {
        setError('Please choose a stronger password with at least 8 characters.')
      } else {
        setError(registrationError.message || 'Your account could not be created. Please try again.')
      }
    } finally {
      setCreating(false)
    }
  }

  const inputClass = 'booking-register-input'

  return (
    <section className="booking-register-page">
      <style>{`
        .booking-register-page{padding:clamp(9.5rem,13vw,12rem) 1rem 5rem;background:radial-gradient(circle at 80% 10%,rgba(1,69,168,.06),transparent 28rem),#F7F9FC;min-height:100vh}
        .booking-register-shell{width:min(1120px,100%);margin:0 auto;background:#fff;border:1px solid #DCE6F1;border-top:7px solid ${SKY_BLUE};border-radius:16px;box-shadow:0 24px 70px rgba(15,35,65,.1);padding:clamp(1.3rem,4vw,3.2rem)}
        .booking-register-title{text-align:center;margin:0 0 2rem;font-family:var(--font-display);font-size:clamp(2rem,5vw,3.2rem);color:${DARK};font-weight:900}
        .booking-register-section{margin-top:2rem}
        .booking-register-heading{display:flex;align-items:center;gap:.75rem;margin:0 0 1.25rem;font-family:var(--font-body);font-size:1.18rem;color:${SKY_BLUE};font-weight:850;text-transform:uppercase;letter-spacing:.04em}
        .booking-register-heading:before{content:'';width:5px;height:28px;background:linear-gradient(${SKY_BLUE},#3B82F6);border-radius:999px}
        .booking-register-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem 1.2rem}
        .booking-register-wide{grid-column:1/-1}
        .booking-register-label{display:block;margin:0 0 .42rem;color:#26364B;font-family:var(--font-body);font-size:.88rem;font-weight:750}
        .booking-register-label span{color:#DC2626}
        .booking-register-input{width:100%;min-height:52px;padding:.8rem .95rem;border:1.5px solid #D9E3EF;border-radius:10px;background:#fff;color:${DARK};font:500 .95rem var(--font-body);outline:none;box-sizing:border-box;transition:border-color .2s,box-shadow .2s}
        textarea.booking-register-input{min-height:92px;resize:vertical}
        .booking-register-input:focus{border-color:${SKY_BLUE};box-shadow:0 0 0 4px rgba(1,69,168,.09)}
        .booking-register-password{position:relative}.booking-register-password .booking-register-input{padding-right:4.5rem}.booking-register-password button{position:absolute;right:.8rem;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#475569;font-weight:800;cursor:pointer}
        .booking-register-radio-row{display:flex;gap:1.5rem;align-items:center;min-height:52px;flex-wrap:wrap}.booking-register-radio-row label{display:flex;gap:.45rem;align-items:center;color:#334155;cursor:pointer}.booking-register-radio-row input{accent-color:${SKY_BLUE};width:18px;height:18px}
        .booking-register-summary{display:grid;gap:.65rem;padding:1.1rem;border:1px solid #DCE6F1;border-radius:12px;background:#F8FAFD}.booking-register-plan{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;padding-bottom:.65rem;border-bottom:1px solid #E2E8F0}.booking-register-plan:last-child{padding-bottom:0;border-bottom:0}.booking-register-plan strong{color:${DARK}}.booking-register-plan span{color:${SKY_BLUE};font-weight:850;white-space:nowrap}
        .booking-register-total{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin:1rem 0 0;padding:1rem 1.1rem;border-radius:12px;background:${DARK};color:#fff;font-weight:800}.booking-register-total strong{font-size:1.45rem;color:${GOLD}}
        .booking-register-payment-note{margin:1rem 0 0;padding:.9rem 1rem;border:1px solid #BFDBFE;border-radius:12px;background:#EFF6FF;color:#516B89;font-size:.84rem;line-height:1.55}.booking-register-payment-note strong{color:#0B3C78}
        .booking-register-actions{display:flex;gap:1rem;align-items:center;flex-wrap:wrap;margin-top:1.5rem}.booking-register-back,.booking-register-submit{min-height:52px;padding:.85rem 1.5rem;border-radius:999px;font-family:var(--font-body);font-size:.95rem;font-weight:850;cursor:pointer}.booking-register-back{border:1.5px solid #CBD5E1;background:#fff;color:${SKY_BLUE}}.booking-register-submit{border:0;background:linear-gradient(135deg,${SKY_BLUE},#0B63CE);color:#fff;box-shadow:0 10px 25px rgba(1,69,168,.22)}.booking-register-submit:disabled{opacity:.6;cursor:wait}
        .booking-register-error{margin:1rem 0 0;padding:.85rem 1rem;border:1px solid #FCA5A5;border-radius:10px;background:#FEF2F2;color:#B91C1C;font-weight:700}
        .booking-register-login{text-align:center;margin:0 0 1.5rem;color:#334155}.booking-register-login a{color:${SKY_BLUE};font-weight:800}
        @media(max-width:700px){.booking-register-grid{grid-template-columns:1fr}.booking-register-wide{grid-column:auto}.booking-register-shell{padding:1.15rem}.booking-register-plan{flex-direction:column}.booking-register-actions>*{width:100%}}
      `}</style>

      <div className="booking-register-shell">
        <h1 className="booking-register-title">Account & Booking Form</h1>
        <p className="booking-register-login">
          Already have an account?{' '}
          <Link to="/login" state={{ from: '/cart' }} onClick={() => saveBookingReturn('/cart')}>Sign in and continue</Link>
        </p>

        {!items.length ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <h2 style={{ color: DARK, fontFamily: 'var(--font-display)' }}>No booking selected</h2>
            <p style={{ color: '#334155' }}>Select a plan, location and lesson time before completing this form.</p>
            <Link to="/pricing" className="btn-gold">View Pricing Plans</Link>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="booking-register-section">
              <h2 className="booking-register-heading">Account Register</h2>
              <div className="booking-register-grid">
                <Field id="booking-email" label="Email" required wide>
                  <input id="booking-email" className={inputClass} name="email" type="email" autoComplete="email" value={form.email} onChange={update} required />
                </Field>
                <Field id="booking-password" label="Password" required>
                  <PasswordInput id="booking-password" className={inputClass} name="password" autoComplete="new-password" minLength="8" value={form.password} onChange={update} required />
                </Field>
                <Field id="booking-confirm-password" label="Confirm Password" required>
                  <PasswordInput id="booking-confirm-password" className={inputClass} name="confirmPassword" autoComplete="new-password" minLength="8" value={form.confirmPassword} onChange={update} required />
                </Field>
              </div>
            </div>

            <div className="booking-register-section">
              <h2 className="booking-register-heading">Student Information</h2>
              <div className="booking-register-grid">
                <Field id="booking-name" label="Student First, Middle and Last Name" required>
                  <input id="booking-name" className={inputClass} name="fullName" autoComplete="name" maxLength="160" value={form.fullName} onChange={update} required />
                </Field>
                <Field id="booking-student-phone" label="Student Phone" required>
                  <input id="booking-student-phone" className={inputClass} name="studentPhone" type="tel" autoComplete="tel" maxLength="30" value={form.studentPhone} onChange={update} required />
                </Field>
                <Field id="booking-parent-phone" label="Parent / Guardian Phone" required>
                  <input id="booking-parent-phone" className={inputClass} name="parentPhone" type="tel" maxLength="30" value={form.parentPhone} onChange={update} required />
                </Field>
                <Field id="booking-gender" label="Gender">
                  <div id="booking-gender" className="booking-register-radio-row">
                    {['Male', 'Female', 'Other'].map(gender => (
                      <label key={gender}><input type="radio" name="gender" value={gender} checked={form.gender === gender} onChange={update} />{gender}</label>
                    ))}
                  </div>
                </Field>
                <Field id="booking-dob" label="Date of Birth" required>
                  <input id="booking-dob" className={inputClass} name="dob" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={update} required />
                </Field>
                <Field id="booking-permit" label="Permit Number (if applicable)">
                  <input id="booking-permit" className={inputClass} name="permit" maxLength="160" value={form.permit} onChange={update} />
                </Field>
                <Field id="booking-home-address" label="Home Address" required>
                  <textarea id="booking-home-address" className={inputClass} name="homeAddress" autoComplete="street-address" maxLength="500" value={form.homeAddress} onChange={update} required />
                </Field>
                <Field id="booking-city" label="City" required>
                  <input id="booking-city" className={inputClass} name="city" autoComplete="address-level2" maxLength="100" value={form.city} onChange={update} required />
                </Field>
                <Field id="booking-state" label="State" required>
                  <select id="booking-state" className={inputClass} name="state" value={form.state} onChange={update} required><option value="California">California</option></select>
                </Field>
                <Field id="booking-zip" label="ZIP Code" required>
                  <input id="booking-zip" className={inputClass} name="zipCode" inputMode="numeric" autoComplete="postal-code" maxLength="10" value={form.zipCode} onChange={update} required />
                </Field>
                <Field id="booking-pickup-address" label="Pickup Address" required wide>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.55rem', color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={sameAsHome} onChange={event => { setSameAsHome(event.target.checked); setError('') }} style={{ width: '18px', height: '18px', accentColor: SKY_BLUE }} /> Same as home address
                  </label>
                  <textarea id="booking-pickup-address" className={inputClass} name="pickupAddress" maxLength="500" disabled={sameAsHome} value={sameAsHome ? computedHomeAddress : form.pickupAddress} onChange={update} required={!sameAsHome} />
                </Field>
                <Field id="booking-medications" label="Medications">
                  <textarea id="booking-medications" className={inputClass} name="medications" maxLength="1000" value={form.medications} onChange={update} />
                </Field>
                <Field id="booking-notes" label="Additional Notes">
                  <textarea id="booking-notes" className={inputClass} name="notes" maxLength="2000" value={form.notes} onChange={update} />
                </Field>
              </div>
            </div>

            <div className="booking-register-section">
              <h2 className="booking-register-heading">Booking Summary</h2>
              <div className="booking-register-summary">
                {items.map(item => (
                  <div className="booking-register-plan" key={item.id}>
                    <div>
                      <strong>{item.title}</strong>
                      <div style={{ marginTop: '.25rem', color: '#334155', fontSize: '.84rem' }}>
                        {item.city || 'Location selected'} · {item.pickupSlots?.length || 0} slot{item.pickupSlots?.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    <span>{item.continuation ? 'Included' : item.price}</span>
                  </div>
                ))}
              </div>
              <div className="booking-register-total"><span>Total Amount</span><strong>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
              <p className="booking-register-payment-note"><strong>Next step:</strong> Select Pay Now below to create your secure account and review the payment options on the payment page.</p>
            </div>

            <div className="booking-register-section">
              <h2 className="booking-register-heading">Agreement</h2>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.7rem', color: '#334155', lineHeight: 1.55, cursor: 'pointer' }}>
                <input type="checkbox" name="acceptedTerms" checked={form.acceptedTerms} onChange={update} style={{ width: '19px', height: '19px', marginTop: '2px', accentColor: SKY_BLUE, flexShrink: 0 }} />
                <span>I accept the <Link to="/terms" target="_blank" rel="noreferrer" style={{ color: SKY_BLUE, fontWeight: 800 }}>Terms of Service</Link> and consent to the school using these details to manage my lessons.</span>
              </label>
            </div>

            {error && <div className="booking-register-error" role="alert">{error}</div>}
            <div className="booking-register-actions">
              <button type="button" className="booking-register-back" onClick={() => navigate('/pricing')}>← Back</button>
              <button type="submit" className="booking-register-submit" disabled={creating}>{creating ? 'Preparing Payment...' : 'Pay Now'}</button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
