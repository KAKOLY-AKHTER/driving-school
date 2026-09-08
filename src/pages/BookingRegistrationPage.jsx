import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, deleteUser, updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import { api } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { usePageMeta } from '../usePageMeta'
import { saveBookingReturn, writeGuestCart } from '../utils/bookingStorage'
import PasswordInput from '../components/PasswordInput'
import { locationPlanPrice } from '../pricingUtils'

const SKY_BLUE = '#0145A8'
const DARK = '#0A1628'
const GOLD = '#FDBC01'

const REGISTRATION_PACKAGES = [
  { id: '2', label: 'Package A: 2 Hours of Behind the Wheel' },
  { id: '3', label: 'Package B: 6 Hours of Behind the Wheel' },
  { id: '5', label: 'Package C: 10 Hours of Behind the Wheel' },
  { id: '4', label: 'IDEAL FOR STUDENTS' },
  { id: '12', label: 'Package D: 4 Hours of Behind the Wheel' },
]

const priceNumber = value => {
  const amount = Number.parseFloat(String(value || '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(amount) ? amount : 0
}

const priceLabel = value => `$${priceNumber(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const phoneIsValid = value => {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
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
  const location = useLocation()
  const { user } = useAuth()
  const { items, refreshCart } = useCart()
  const requestedPlanId = useMemo(() => new URLSearchParams(location.search).get('plan') || '', [location.search])
  const directRegistration = Boolean(requestedPlanId) || items.length === 0
  const [creating, setCreating] = useState(false)
  const [preparingPayment, setPreparingPayment] = useState(false)
  const [completedUid, setCompletedUid] = useState('')
  const [error, setError] = useState('')
  const [sameAsHome, setSameAsHome] = useState(false)
  const [packages, setPackages] = useState([])
  const [packagesLoading, setPackagesLoading] = useState(true)
  const [packagesError, setPackagesError] = useState('')
  const [selectedPackageId, setSelectedPackageId] = useState(requestedPlanId)
  const [form, setForm] = useState(() => ({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    middleName: '',
    lastName: '',
    studentPhone: '',
    parentPhone: '',
    payerName: '',
    payerRelationship: '',
    payerEmail: '',
    payerSecondaryPhone: '',
    payerAddress: '',
    gender: '',
    dob: '',
    permit: '',
    issueDate: '',
    expiryDate: '',
    homeAddress: '',
    city: items[0]?.city || '',
    state: 'California',
    zipCode: '',
    pickupAddress: '',
    medications: '',
    notes: '',
    payerConsent: false,
    acceptedTerms: false,
  }))

  const total = useMemo(() => items.reduce((sum, item) => {
    const charge = Number(item.chargeAmount)
    return sum + (Number.isFinite(charge) ? charge : priceNumber(item.price))
  }, 0), [items])

  const selectedPackage = packages.find(plan => String(plan?.id) === String(selectedPackageId)) || null
  const selectedPackageNearPrice = locationPlanPrice(selectedPackage, 'Near')

  useEffect(() => {
    const validRequestedPackage = REGISTRATION_PACKAGES.some(plan => plan.id === String(requestedPlanId))
    setSelectedPackageId(validRequestedPackage ? String(requestedPlanId) : '')
  }, [requestedPlanId])

  useEffect(() => {
    let active = true
    setPackagesLoading(true)
    setPackagesError('')
    api.getPricing()
      .then(plans => {
        if (!active) return
        const livePlans = Array.isArray(plans) ? plans : []
        const available = REGISTRATION_PACKAGES
          .map(definition => {
            const plan = livePlans.find(item => String(item?.id) === definition.id)
            return plan ? { ...plan, registrationLabel: definition.label } : null
          })
          .filter(Boolean)
        if (available.length !== REGISTRATION_PACKAGES.length) throw new Error('One or more registration packages are not configured yet.')
        setPackages(available)
        setSelectedPackageId(current => available.some(plan => String(plan.id) === String(current)) ? current : '')
      })
      .catch(loadError => {
        if (active) setPackagesError(loadError?.message || 'Packages could not be loaded.')
      })
      .finally(() => {
        if (active) setPackagesLoading(false)
      })
    return () => { active = false }
  }, [])

  const computedHomeAddress = [form.homeAddress, form.city, form.state, form.zipCode]
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(', ')

  useEffect(() => {
    if (creating) return
    if (completedUid && user?.uid === completedUid) {
      let active = true
      const openPaymentPage = async () => {
        setPreparingPayment(true)
        await refreshCart()
        if (active) navigate('/payment', { replace: true })
      }
      openPaymentPage()
      return () => { active = false }
    }
    if (!completedUid && user) {
      navigate(directRegistration && selectedPackageId ? `/pricing?plan=${encodeURIComponent(selectedPackageId)}` : '/cart', { replace: true })
    }
    return undefined
  }, [completedUid, creating, directRegistration, navigate, refreshCart, selectedPackageId, user])

  const update = event => {
    const { name, type, checked, value } = event.target
    setForm(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  const validate = () => {
    if (directRegistration && !selectedPackageId) return 'Please select a package.'
    if (directRegistration && !selectedPackage) return 'The selected package is no longer available. Please choose another package.'
    if (!directRegistration && !items.length) return 'Your booking selection is empty. Please select a plan first.'
    if (!form.email.trim()) return 'Please enter your email address.'
    if (form.password.length < 8) return 'Password must contain at least 8 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    if (!form.firstName.trim() || !form.lastName.trim()) return 'Please enter the student’s first and last name.'
    if (!phoneIsValid(form.studentPhone)) return 'Please enter a valid student phone number.'
    if (!phoneIsValid(form.parentPhone)) return 'Please enter a valid parent or guardian phone number.'
    if (!form.payerName.trim() || !form.payerRelationship.trim()) return 'Please enter the primary payer’s name and relationship to the student.'
    if (!form.payerEmail.trim() || !/^\S+@\S+\.\S+$/.test(form.payerEmail.trim())) return 'Please enter a valid primary payer email address.'
    if (!form.payerAddress.trim()) return 'Please enter the primary payer’s home address.'
    if (!form.gender) return 'Please select the student’s gender.'
    if (!form.dob) return 'Please select the student’s date of birth.'
    if (!form.homeAddress.trim() || !form.city.trim()) return 'Please enter the complete home address and city.'
    if (!/^\d{5}(?:-\d{4})?$/.test(form.zipCode.trim())) return 'Please enter a valid ZIP code.'
    if (!sameAsHome && !form.pickupAddress.trim()) return 'Please enter the pickup address or select “Same as home address”.'
    if (!form.payerConsent) return 'The primary payer must give permission for the student to schedule lessons.'
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
    if (directRegistration) writeGuestCart([])
    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password)
      createdUser = credential.user
      const displayName = [form.firstName, form.middleName, form.lastName].map(value => value.trim()).filter(Boolean).join(' ')
      await updateProfile(createdUser, { displayName })
      await api.saveUser(createdUser.uid, {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        displayName,
        name: displayName,
        dob: form.dob,
        phone: form.studentPhone.trim(),
        parentPhone: form.parentPhone.trim(),
        payerName: form.payerName.trim(),
        payerRelationship: form.payerRelationship.trim(),
        payerPhone: form.parentPhone.trim(),
        payerEmail: form.payerEmail.trim(),
        payerSecondaryPhone: form.payerSecondaryPhone.trim(),
        payerAddress: form.payerAddress.trim(),
        payerConsentAt: new Date().toISOString(),
        gender: form.gender,
        email: form.email.trim(),
        permit: form.permit.trim(),
        issueDate: form.issueDate,
        expiryDate: form.expiryDate,
        address: form.homeAddress.trim(),
        city: form.city.trim(),
        state: form.state,
        zipCode: form.zipCode.trim(),
        pickupAddress: sameAsHome ? computedHomeAddress : form.pickupAddress.trim(),
        medications: form.medications.trim(),
        notes: form.notes.trim(),
        courseType: (directRegistration ? selectedPackageId : items.map(item => item.id).join(',')).slice(0, 120),
        completedModules: [],
        termsAcceptedAt: new Date().toISOString(),
      })
      if (directRegistration) {
        const result = await api.addToCart(createdUser.uid, {
          id: selectedPackage.id,
          title: selectedPackage.registrationLabel || selectedPackage.planName,
          price: locationPlanPrice(selectedPackage, 'Near'),
          city: form.city.trim(),
          purchaseOnly: true,
          pickupSlots: [],
        })
        if (!result?.ok) throw new Error(result?.error || 'The selected package could not be prepared for payment.')
        // Keep a short-lived local copy so the payment page never renders an
        // empty state while the newly authenticated cart is being refreshed.
        writeGuestCart(result.items || [])
      }
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
        .booking-register-page{padding:clamp(11rem,15vw,13.5rem) 1rem 5rem;background:radial-gradient(circle at 80% 10%,rgba(1,69,168,.06),transparent 28rem),#F7F9FC;min-height:100vh}
        .booking-register-shell{width:min(1120px,100%);margin:0 auto;background:#fff;border:1px solid #DCE6F1;border-top:7px solid ${SKY_BLUE};border-radius:16px;box-shadow:0 24px 70px rgba(15,35,65,.1);padding:clamp(1.3rem,4vw,3.2rem)}
        .booking-register-intro{text-align:center;margin:0 auto 1.7rem;max-width:760px}.booking-register-eyebrow{display:inline-flex;align-items:center;gap:.65rem;margin:0 0 .7rem;color:${SKY_BLUE};font-family:var(--font-mono);font-size:.72rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.booking-register-eyebrow:before,.booking-register-eyebrow:after{content:'';width:34px;height:2px;border-radius:999px;background:${GOLD}}
        .booking-register-title{text-align:center;margin:0;font-family:var(--font-display);font-size:clamp(2.15rem,5vw,3.45rem);line-height:1.08;color:${DARK};font-weight:900}.booking-register-title span{color:${SKY_BLUE}}
        .booking-register-subtitle{margin:.8rem auto 0;color:#52657E;font-size:clamp(.92rem,2vw,1.05rem);line-height:1.65}
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
        .booking-register-package-note{margin:.7rem 0 0;padding:.8rem .9rem;border:1px solid #BFDBFE;border-radius:10px;background:#EFF6FF;color:#34506F;font-size:.84rem;line-height:1.55}
        .booking-register-login{text-align:center;margin:0 0 1.5rem;color:#334155}.booking-register-login a{color:${SKY_BLUE};font-weight:800}
        @media(max-width:700px){.booking-register-page{padding-top:9rem}.booking-register-grid{grid-template-columns:1fr}.booking-register-wide{grid-column:auto}.booking-register-shell{padding:1.15rem}.booking-register-plan{flex-direction:column}.booking-register-actions>*{width:100%}}
      `}</style>

      <div className="booking-register-shell">
        <header className="booking-register-intro">
          <p className="booking-register-eyebrow">Student Registration</p>
          <h1 className="booking-register-title">Register &amp; <span>Secure Your Package</span></h1>
          <p className="booking-register-subtitle">Complete your information below. You will review your selected package and pay securely on the next page.</p>
        </header>
        <p className="booking-register-login">
          Already have an account?{' '}
          <Link
            to="/login"
            state={{ from: directRegistration && selectedPackageId ? `/pricing?plan=${encodeURIComponent(selectedPackageId)}` : '/cart' }}
            onClick={() => saveBookingReturn(directRegistration && selectedPackageId ? `/pricing?plan=${encodeURIComponent(selectedPackageId)}` : '/cart')}
          >Sign in and continue</Link>
        </p>

        <form onSubmit={submit} noValidate>
            {directRegistration && (
              <div className="booking-register-section" style={{ marginTop: 0 }}>
                <h2 className="booking-register-heading">Package</h2>
                <div className="booking-register-grid">
                  <Field id="booking-package" label="Package" required wide>
                    <select
                      id="booking-package"
                      className={inputClass}
                      value={selectedPackageId}
                      onChange={event => { setSelectedPackageId(event.target.value); setError('') }}
                      disabled={packagesLoading}
                      required
                    >
                      <option value="">{packagesLoading ? 'Loading packages…' : '-- Select Package --'}</option>
                      {packages.map(plan => <option key={plan.id} value={plan.id}>{plan.registrationLabel} - {priceLabel(locationPlanPrice(plan, 'Near'))}</option>)}
                    </select>
                    {packagesError && <div className="booking-register-error" role="alert">{packagesError}</div>}
                    {selectedPackage && (
                      <p className="booking-register-package-note">
                        <strong>{selectedPackage.registrationLabel}</strong> — {priceLabel(selectedPackageNearPrice)}.
                        {' '}Complete this form and select Pay Now to continue directly to the secure payment page.
                      </p>
                    )}
                  </Field>
                </div>
              </div>
            )}
            <div className="booking-register-section">
              <h2 className="booking-register-heading">Account Register</h2>
              <div className="booking-register-grid">
                <Field id="booking-email" label="Username / Email" required wide>
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
                <Field id="booking-first-name" label="Student's First Name" required>
                  <input id="booking-first-name" className={inputClass} name="firstName" autoComplete="given-name" maxLength="80" value={form.firstName} onChange={update} required />
                </Field>
                <Field id="booking-middle-name" label="Student's Middle Name">
                  <input id="booking-middle-name" className={inputClass} name="middleName" autoComplete="additional-name" maxLength="80" value={form.middleName} onChange={update} />
                </Field>
                <Field id="booking-last-name" label="Student's Last Name" required>
                  <input id="booking-last-name" className={inputClass} name="lastName" autoComplete="family-name" maxLength="80" value={form.lastName} onChange={update} required />
                </Field>
                <Field id="booking-student-phone" label="Student Phone" required>
                  <input id="booking-student-phone" className={inputClass} name="studentPhone" type="tel" autoComplete="tel" maxLength="30" value={form.studentPhone} onChange={update} required />
                </Field>
                <Field id="booking-parent-phone" label="Primary Payer Phone Number" required>
                  <input id="booking-parent-phone" className={inputClass} name="parentPhone" type="tel" maxLength="30" value={form.parentPhone} onChange={update} required />
                </Field>
                <Field id="booking-payer-name" label="Primary Payer Name" required>
                  <input id="booking-payer-name" className={inputClass} name="payerName" autoComplete="name" maxLength="160" value={form.payerName} onChange={update} required />
                </Field>
                <Field id="booking-payer-relationship" label="Primary Payer Relationship to Student" required>
                  <input id="booking-payer-relationship" className={inputClass} name="payerRelationship" maxLength="100" value={form.payerRelationship} onChange={update} required />
                </Field>
                <Field id="booking-payer-email" label="Primary Payer Email" required>
                  <input id="booking-payer-email" className={inputClass} name="payerEmail" type="email" autoComplete="email" maxLength="320" value={form.payerEmail} onChange={update} required />
                </Field>
                <Field id="booking-payer-secondary-phone" label="Primary Payer Secondary Phone Number">
                  <input id="booking-payer-secondary-phone" className={inputClass} name="payerSecondaryPhone" type="tel" maxLength="30" value={form.payerSecondaryPhone} onChange={update} />
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
                <Field id="booking-issue-date" label="Permit Issue Date">
                  <input id="booking-issue-date" className={inputClass} name="issueDate" type="date" value={form.issueDate} onChange={update} />
                </Field>
                <Field id="booking-expiry-date" label="Permit Expiration Date">
                  <input id="booking-expiry-date" className={inputClass} name="expiryDate" type="date" min={form.issueDate || undefined} value={form.expiryDate} onChange={update} />
                </Field>
                <Field id="booking-home-address" label="Home Address" required>
                  <textarea id="booking-home-address" className={inputClass} name="homeAddress" autoComplete="street-address" maxLength="500" value={form.homeAddress} onChange={update} required />
                </Field>
                <Field id="booking-payer-address" label="Primary Payer Home Address" required>
                  <textarea id="booking-payer-address" className={inputClass} name="payerAddress" autoComplete="street-address" maxLength="500" value={form.payerAddress} onChange={update} required />
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

            {!directRegistration && <div className="booking-register-section">
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
            </div>}

            {directRegistration && selectedPackage && (
              <div className="booking-register-section">
                <h2 className="booking-register-heading">Payment Summary</h2>
                <div className="booking-register-summary">
                  <div className="booking-register-plan">
                    <strong>{selectedPackage.registrationLabel}</strong>
                    <span>{priceLabel(selectedPackageNearPrice)}</span>
                  </div>
                </div>
                <div className="booking-register-total"><span>Total Amount</span><strong>{priceLabel(selectedPackageNearPrice)}</strong></div>
                <p className="booking-register-payment-note"><strong>Next step:</strong> Pay Now creates the student account and opens the secure payment page. Lesson dates can be booked from the student dashboard after payment.</p>
              </div>
            )}

            <div className="booking-register-section">
              <h2 className="booking-register-heading">Agreement</h2>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.7rem', color: '#334155', lineHeight: 1.55, cursor: 'pointer', marginBottom: '.9rem' }}>
                <input type="checkbox" name="payerConsent" checked={form.payerConsent} onChange={update} style={{ width: '19px', height: '19px', marginTop: '2px', accentColor: SKY_BLUE, flexShrink: 0 }} />
                <span>The primary payer gives permission for the above student to schedule their own lessons.</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.7rem', color: '#334155', lineHeight: 1.55, cursor: 'pointer' }}>
                <input type="checkbox" name="acceptedTerms" checked={form.acceptedTerms} onChange={update} style={{ width: '19px', height: '19px', marginTop: '2px', accentColor: SKY_BLUE, flexShrink: 0 }} />
                <span>I accept the <Link to="/terms" target="_blank" rel="noreferrer" style={{ color: SKY_BLUE, fontWeight: 800 }}>Terms of Service</Link> and consent to the school using these details to manage my lessons.</span>
              </label>
            </div>

            {error && <div className="booking-register-error" role="alert">{error}</div>}
            <div className="booking-register-actions">
              <button type="button" className="booking-register-back" onClick={() => navigate(directRegistration ? '/schedule' : '/pricing')}>← Back</button>
              <button type="submit" className="booking-register-submit" disabled={creating || preparingPayment || (directRegistration && packagesLoading)}>{creating || preparingPayment ? 'Preparing Payment...' : 'Pay Now'}</button>
            </div>
          </form>
      </div>
    </section>
  )
}
