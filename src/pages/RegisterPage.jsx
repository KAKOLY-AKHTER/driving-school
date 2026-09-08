import { cloneElement, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, deleteUser, updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import { api } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { usePageMeta } from '../usePageMeta'
import { saveBookingReturn, writeGuestCart } from '../utils/bookingStorage'
import PasswordInput from '../components/PasswordInput'

const GOLD = '#FDBC01'
const BLUE = '#0145A8'
const DARK = '#0A1628'

const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'District Of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
  'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana',
  'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Puerto Rico', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee',
  'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
]

const COURSE_TYPES = [
  { id: '1', name: 'Online Driver Ed', price: '$39.99', label: 'Online Driver Ed (US $): 39.99' },
  { id: '13', name: 'Duplicate Certificate 400C', price: '$15.00', label: 'Duplicate Certificate 400C (US $): 15.00' },
]

const EMPTY_FORM = {
  firstName: '', middleName: '', lastName: '', dob: '', phone: '', email: '',
  address1: '', address2: '', city: '', state: 'California', zipCode: '',
  username: '', password: '', confirmPassword: '', courseType: '1',
  billingSame: false, billingFirstName: '', billingLastName: '', billingAddress1: '',
  billingAddress2: '', billingCity: '', billingState: 'California', billingZipCode: '',
  billingPhone: '', billingEmail: '', disclaimer: '',
}

const phoneIsValid = value => {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

export default function RegisterPage() {
  usePageMeta(
    'Online Drivers Ed Registration — A Precision Driving School',
    'Register for California online drivers education or request a duplicate completion certificate.',
    { noIndex: true },
  )
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshCart } = useCart()
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completedUid, setCompletedUid] = useState('')

  const selectedCourse = useMemo(
    () => COURSE_TYPES.find(course => course.id === form.courseType) || COURSE_TYPES[0],
    [form.courseType],
  )

  useEffect(() => {
    const requestedCourse = new URLSearchParams(location.search).get('course')
    if (COURSE_TYPES.some(course => course.id === requestedCourse)) {
      setForm(current => ({ ...current, courseType: requestedCourse }))
    }
  }, [location.search])

  useEffect(() => {
    if (!completedUid || user?.uid !== completedUid) return undefined
    let active = true
    const openPayment = async () => {
      await refreshCart()
      if (active) navigate('/payment', { replace: true })
    }
    openPayment()
    return () => { active = false }
  }, [completedUid, navigate, refreshCart, user])

  const update = event => {
    const { name, type, checked, value } = event.target
    const mirroredBillingFields = {
      firstName: 'billingFirstName', lastName: 'billingLastName', address1: 'billingAddress1',
      address2: 'billingAddress2', city: 'billingCity', state: 'billingState',
      zipCode: 'billingZipCode', phone: 'billingPhone', email: 'billingEmail',
    }
    setForm(current => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(current.billingSame && mirroredBillingFields[name] ? { [mirroredBillingFields[name]]: value } : {}),
    }))
    setErrors(current => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
    setError('')
  }

  const toggleBillingSame = event => {
    const checked = event.target.checked
    setForm(current => ({
      ...current,
      billingSame: checked,
      ...(checked ? {
        billingFirstName: current.firstName,
        billingLastName: current.lastName,
        billingAddress1: current.address1,
        billingAddress2: current.address2,
        billingCity: current.city,
        billingState: current.state,
        billingZipCode: current.zipCode,
        billingPhone: current.phone,
        billingEmail: current.email,
      } : {}),
    }))
    setError('')
  }

  const validate = () => {
    const next = {}
    const required = {
      firstName: 'Enter the student’s first name.', lastName: 'Enter the student’s last name.',
      dob: 'Enter the student’s date of birth.', phone: 'Enter a phone number.',
      email: 'Enter an email address.', address1: 'Enter the mailing address.', city: 'Enter the city.',
      state: 'Select a state.', zipCode: 'Enter the ZIP code.', username: 'Enter a username.',
      password: 'Enter a password.', confirmPassword: 'Confirm the password.', courseType: 'Select a course type.',
      billingFirstName: 'Enter the billing first name.', billingLastName: 'Enter the billing last name.',
      billingAddress1: 'Enter the billing address.', billingCity: 'Enter the billing city.',
      billingState: 'Select a billing state.', billingZipCode: 'Enter the billing ZIP code.',
      billingPhone: 'Enter the billing phone number.', billingEmail: 'Enter the billing email address.',
    }
    Object.entries(required).forEach(([name, message]) => {
      if (!String(form[name] || '').trim()) next[name] = message
    })
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (form.billingEmail && !/^\S+@\S+\.\S+$/.test(form.billingEmail.trim())) next.billingEmail = 'Enter a valid billing email address.'
    if (form.phone && !phoneIsValid(form.phone)) next.phone = 'Enter a valid phone number.'
    if (form.billingPhone && !phoneIsValid(form.billingPhone)) next.billingPhone = 'Enter a valid billing phone number.'
    if (form.zipCode && !/^\d{5}(?:-\d{4})?$/.test(form.zipCode.trim())) next.zipCode = 'Enter a valid ZIP code.'
    if (form.billingZipCode && !/^\d{5}(?:-\d{4})?$/.test(form.billingZipCode.trim())) next.billingZipCode = 'Enter a valid billing ZIP code.'
    if (form.username.trim().length < 3) next.username = 'Username must contain at least 3 characters.'
    if (form.password.length < 8) next.password = 'Password must contain at least 8 characters.'
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.'
    if (form.disclaimer !== 'agree') next.disclaimer = 'Accept the enrollment disclaimer to continue.'
    setErrors(next)
    const firstInvalid = Object.keys(next)[0]
    if (firstInvalid) {
      window.requestAnimationFrame(() => document.querySelector(`[name="${firstInvalid}"]`)?.focus())
      setError('Please review the highlighted information before continuing.')
      return false
    }
    return true
  }

  const submit = async event => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setError('')
    let createdUser = null
    let prepared = false
    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password)
      createdUser = credential.user
      const displayName = [form.firstName, form.middleName, form.lastName].map(value => value.trim()).filter(Boolean).join(' ')
      const billingName = [form.billingFirstName, form.billingLastName].map(value => value.trim()).filter(Boolean).join(' ')
      const billingAddress = [form.billingAddress1, form.billingAddress2, form.billingCity, form.billingState, form.billingZipCode].map(value => value.trim()).filter(Boolean).join(', ')
      await updateProfile(createdUser, { displayName })
      await api.saveUser(createdUser.uid, {
        firstName: form.firstName.trim(), middleName: form.middleName.trim(), lastName: form.lastName.trim(),
        displayName, name: displayName, dob: form.dob, phone: form.phone.trim(), email: form.email.trim(),
        username: form.username.trim(), address: [form.address1, form.address2].map(value => value.trim()).filter(Boolean).join(', '),
        city: form.city.trim(), state: form.state, zipCode: form.zipCode.trim(), courseType: form.courseType,
        payerName: billingName, payerRelationship: 'Billing contact', payerPhone: form.billingPhone.trim(),
        payerEmail: form.billingEmail.trim(), payerAddress: billingAddress, payerConsentAt: new Date().toISOString(),
        completedModules: [], termsAcceptedAt: new Date().toISOString(),
      })
      const cart = await api.addToCart(createdUser.uid, {
        id: selectedCourse.id, title: selectedCourse.name, price: selectedCourse.price,
        city: form.city.trim(), purchaseOnly: true, pickupSlots: [],
      })
      if (!cart?.ok) throw new Error(cart?.error || 'The selected course could not be prepared for payment.')
      writeGuestCart(cart.items || [])
      saveBookingReturn('/payment')
      prepared = true
      setCompletedUid(createdUser.uid)
    } catch (registrationError) {
      if (createdUser) {
        try { await deleteUser(createdUser) } catch { /* The account can be recovered through sign-in. */ }
      }
      if (registrationError.code === 'auth/email-already-in-use') setError('An account with this email already exists. Please sign in instead.')
      else if (registrationError.code === 'auth/weak-password') setError('Please choose a stronger password with at least 8 characters.')
      else setError(registrationError.message || 'Registration could not be completed. Please try again.')
    } finally {
      if (!prepared) setSubmitting(false)
    }
  }

  const inputClass = 'online-register-input'

  return (
    <main className="online-register-page">
      <style>{`
        .online-register-page{padding:10rem 1rem 5rem;background:radial-gradient(circle at 10% 8%,rgba(1,69,168,.08),transparent 28rem),#F5F8FC;color:${DARK};min-height:100vh}
        .online-register-hero{text-align:center;max-width:760px;margin:0 auto 2rem}.online-register-logo{width:150px;height:auto;filter:drop-shadow(0 10px 28px rgba(1,69,168,.18))}.online-register-kicker{margin:.8rem 0 .45rem;color:${BLUE};font:800 .7rem var(--font-mono);letter-spacing:.18em;text-transform:uppercase}.online-register-hero h1{margin:0;font:900 clamp(2rem,5vw,3.45rem)/1.08 var(--font-display);color:${DARK}}.online-register-hero h1 span{color:${BLUE}}.online-register-hero p:last-child{color:#52657E;line-height:1.7}
        .online-register-card{width:min(1060px,100%);margin:0 auto;padding:clamp(1.3rem,4vw,3rem);background:#fff;border:1px solid #D9E4F0;border-top:6px solid ${BLUE};border-radius:20px;box-shadow:0 24px 70px rgba(8,35,73,.11)}
        .online-register-alert{margin:0 0 1.4rem;padding:.9rem 1rem;border:1px solid #FCA5A5;border-radius:10px;background:#FEF2F2;color:#B91C1C;font-weight:750}
        .online-register-section{padding:0 0 2rem;margin:0 0 2rem;border-bottom:1px solid #E2E8F0}.online-register-section:last-of-type{margin-bottom:0}.online-register-heading{display:flex;align-items:center;gap:.7rem;margin:0 0 1.25rem;font:800 1.15rem var(--font-display);color:${BLUE}}.online-register-heading:before{content:'';width:5px;height:27px;border-radius:999px;background:linear-gradient(${GOLD},${BLUE})}
        .online-register-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem 1.2rem}.online-register-wide{grid-column:1/-1}.online-register-field{display:flex;flex-direction:column;gap:.4rem}.online-register-field label{color:#253B5C;font-size:.76rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.online-register-field label span{color:#DC2626}
        .online-register-input{width:100%;min-height:52px;box-sizing:border-box;padding:.82rem .95rem;border:1.5px solid #C9D7E7;border-radius:10px;background:#fff;color:${DARK};font:500 .94rem var(--font-body);outline:none}.online-register-input:focus{border-color:${BLUE};box-shadow:0 0 0 4px rgba(1,69,168,.09)}.online-register-input[aria-invalid=true]{border-color:#DC2626;background:#FFF9F9}.online-register-select{appearance:auto;cursor:pointer}.online-register-field-error{margin:0;color:#B91C1C;font-size:.74rem;font-weight:700}
        .online-register-same{display:flex;align-items:center;gap:.55rem;margin:0 0 1rem;color:#334155;font-weight:750;cursor:pointer}.online-register-same input{width:18px;height:18px;accent-color:${BLUE}}
        .online-register-payment-note{display:flex;gap:.8rem;padding:1rem;margin:0;border:1px solid #BFDBFE;border-radius:12px;background:#EFF6FF;color:#365A84;line-height:1.6}.online-register-payment-note strong{display:block;color:#063B82}.online-register-agreement{display:flex;gap:1.5rem;flex-wrap:wrap}.online-register-agreement label{display:flex;align-items:center;gap:.5rem;color:#334155;font-weight:750;cursor:pointer}.online-register-agreement input{width:18px;height:18px;accent-color:${BLUE}}
        .online-register-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}.online-register-cancel,.online-register-submit{min-height:52px;padding:.85rem 1.6rem;border-radius:999px;font-weight:850;cursor:pointer}.online-register-cancel{border:1.5px solid #CBD5E1;background:#fff;color:${BLUE};text-decoration:none;display:inline-grid;place-items:center}.online-register-submit{border:0;background:linear-gradient(135deg,${GOLD},#FFD75B);color:${DARK};box-shadow:0 10px 25px rgba(253,188,1,.28)}.online-register-submit:disabled{opacity:.62;cursor:wait}.online-register-login{text-align:center;margin:1.5rem 0 0;color:#52657E}.online-register-login a{color:${BLUE};font-weight:800}
        @media(max-width:700px){.online-register-page{padding-top:8.5rem}.online-register-grid{grid-template-columns:1fr}.online-register-wide{grid-column:auto}.online-register-card{padding:1.15rem}.online-register-actions>*{width:100%}}
      `}</style>

      <header className="online-register-hero">
        <img className="online-register-logo" src="/driving-logo.png" alt="A Precision Driving School" />
        <p className="online-register-kicker">Online Registration</p>
        <h1>Register &amp; <span>Pay Securely</span></h1>
        <p>Complete the form once, then continue to the secure Payment Details page.</p>
      </header>

      <form className="online-register-card" onSubmit={submit} noValidate>
        {error && <div className="online-register-alert" role="alert">{error}</div>}

        <FormSection title="Student Information">
          <div className="online-register-grid">
            <Field name="firstName" label="First Name" required error={errors.firstName}><input className={inputClass} name="firstName" value={form.firstName} onChange={update} /></Field>
            <Field name="middleName" label="Middle Name"><input className={inputClass} name="middleName" value={form.middleName} onChange={update} /></Field>
            <Field name="lastName" label="Last Name" required error={errors.lastName}><input className={inputClass} name="lastName" value={form.lastName} onChange={update} /></Field>
            <Field name="dob" label="Date of Birth" required error={errors.dob}><input className={inputClass} type="date" name="dob" value={form.dob} onChange={update} /></Field>
            <Field name="phone" label="Phone Number" required error={errors.phone}><input className={inputClass} name="phone" inputMode="tel" autoComplete="tel" placeholder="999-999-9999" value={form.phone} onChange={update} /></Field>
            <Field name="email" label="Email" required error={errors.email}><input className={inputClass} type="email" name="email" autoComplete="email" value={form.email} onChange={update} /></Field>
            <Field name="address1" label="Address 1" required error={errors.address1}><input className={inputClass} name="address1" autoComplete="address-line1" value={form.address1} onChange={update} /></Field>
            <Field name="address2" label="Address 2 / Apt"><input className={inputClass} name="address2" autoComplete="address-line2" value={form.address2} onChange={update} /></Field>
            <Field name="city" label="City" required error={errors.city}><input className={inputClass} name="city" autoComplete="address-level2" value={form.city} onChange={update} /></Field>
            <Field name="state" label="State" required error={errors.state}><select className={`${inputClass} online-register-select`} name="state" value={form.state} onChange={update}>{STATES.map(state => <option key={state}>{state}</option>)}</select></Field>
            <Field name="zipCode" label="ZIP Code" required error={errors.zipCode}><input className={inputClass} name="zipCode" inputMode="numeric" autoComplete="postal-code" maxLength="10" value={form.zipCode} onChange={update} /></Field>
          </div>
        </FormSection>

        <FormSection title="Account & Course">
          <div className="online-register-grid">
            <Field name="username" label="Username" required error={errors.username}><input className={inputClass} name="username" autoComplete="username" value={form.username} onChange={update} /></Field>
            <Field name="courseType" label="Course Type" required error={errors.courseType}><select className={`${inputClass} online-register-select`} name="courseType" value={form.courseType} onChange={update}>{COURSE_TYPES.map(course => <option key={course.id} value={course.id}>{course.label}</option>)}</select></Field>
            <Field name="password" label="Password" required error={errors.password}><PasswordInput className={inputClass} name="password" autoComplete="new-password" value={form.password} onChange={update} /></Field>
            <Field name="confirmPassword" label="Confirm Password" required error={errors.confirmPassword}><PasswordInput className={inputClass} name="confirmPassword" autoComplete="new-password" value={form.confirmPassword} onChange={update} /></Field>
          </div>
        </FormSection>

        <FormSection title="Billing Information">
          <label className="online-register-same"><input type="checkbox" name="billingSame" checked={form.billingSame} onChange={toggleBillingSame} /> Billing address is the same as the mailing address</label>
          <div className="online-register-grid">
            <Field name="billingFirstName" label="First Name" required error={errors.billingFirstName}><input className={inputClass} name="billingFirstName" value={form.billingFirstName} onChange={update} /></Field>
            <Field name="billingLastName" label="Last Name" required error={errors.billingLastName}><input className={inputClass} name="billingLastName" value={form.billingLastName} onChange={update} /></Field>
            <Field name="billingAddress1" label="Address 1" required error={errors.billingAddress1}><input className={inputClass} name="billingAddress1" value={form.billingAddress1} onChange={update} /></Field>
            <Field name="billingAddress2" label="Address 2 / Apt"><input className={inputClass} name="billingAddress2" value={form.billingAddress2} onChange={update} /></Field>
            <Field name="billingCity" label="City" required error={errors.billingCity}><input className={inputClass} name="billingCity" value={form.billingCity} onChange={update} /></Field>
            <Field name="billingState" label="State" required error={errors.billingState}><select className={`${inputClass} online-register-select`} name="billingState" value={form.billingState} onChange={update}>{STATES.map(state => <option key={state}>{state}</option>)}</select></Field>
            <Field name="billingZipCode" label="ZIP Code" required error={errors.billingZipCode}><input className={inputClass} name="billingZipCode" inputMode="numeric" maxLength="10" value={form.billingZipCode} onChange={update} /></Field>
            <Field name="billingPhone" label="Phone Number" required error={errors.billingPhone}><input className={inputClass} name="billingPhone" inputMode="tel" placeholder="999-999-9999" value={form.billingPhone} onChange={update} /></Field>
            <Field name="billingEmail" label="Email" required error={errors.billingEmail}><input className={inputClass} type="email" name="billingEmail" value={form.billingEmail} onChange={update} /></Field>
          </div>
        </FormSection>

        <FormSection title="Agreement & Payment">
          <p className="online-register-payment-note"><span aria-hidden="true">✓</span><span><strong>{selectedCourse.name} — {selectedCourse.price}</strong>Card or PayPal details will be entered securely on the next page. This website does not store card numbers or CVV.</span></p>
          <div className="online-register-agreement" style={{ marginTop:'1rem' }}>
            <label><input type="radio" name="disclaimer" value="agree" checked={form.disclaimer === 'agree'} onChange={update} /> I Agree</label>
            <label><input type="radio" name="disclaimer" value="disagree" checked={form.disclaimer === 'disagree'} onChange={update} /> I Disagree</label>
          </div>
          {errors.disclaimer && <p className="online-register-field-error" style={{ marginTop:'.55rem' }}>{errors.disclaimer}</p>}
        </FormSection>

        <div className="online-register-actions">
          <Link className="online-register-cancel" to="/online-drivers-ed">Cancel</Link>
          <button className="online-register-submit" type="submit" disabled={submitting}>{submitting ? 'Preparing Payment…' : `Pay Now — ${selectedCourse.price}`}</button>
        </div>
        <p className="online-register-login">Already registered? <Link to="/login" state={{ from:'/payment' }}>Sign in</Link></p>
      </form>
    </main>
  )
}

function FormSection({ title, children }) {
  return <section className="online-register-section"><h2 className="online-register-heading">{title}</h2>{children}</section>
}

function Field({ name, label, required = false, error = '', children }) {
  const id = `online-registration-${name}`
  return (
    <div className="online-register-field">
      <label htmlFor={id}>{label}{required && <span> *</span>}</label>
      {cloneElement(children, { id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': error ? `${id}-error` : undefined })}
      {error && <p className="online-register-field-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}
