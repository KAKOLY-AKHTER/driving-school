import { useState } from 'react'

const STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','District Of Columbia','Florida','Georgia','Hawaii','Idaho','Illinois',
  'Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana',
  'Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York',
  'North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Puerto Rico','Rhode Island','South Carolina','South Dakota','Tennessee',
  'Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

const COURSE_TYPES = [
  { value: '1', label: 'Online Driver Ed — $39.99' },
  { value: '7', label: 'Duplicate Certificate 400C — $15' },
]

const inputStyle = {
  width: '100%',
  padding: '0.85rem 1rem',
  background: '#ffffff',
  border: '1px solid #D1DFEE',
  borderRadius: '6px',
  color: '#0145A8',
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
}

const inputFocusCSS = `
  .reg-input:focus {
    border-color: #0145A8 !important;
    box-shadow: 0 0 0 3px rgba(1,69,168,0.1) !important;
  }
  .reg-input::placeholder { color: #A0B3C6; }
  .reg-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%230145A8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L1 4h14z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; background-color: #ffffff; }
  .reg-section-title {
    font-family: var(--font-display);
    font-size: 1.1rem;
    color: #0145A8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #E2EBF5;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .reg-section-title::before {
    content: '';
    width: 4px;
    height: 20px;
    background: var(--color-gold);
    border-radius: 2px;
  }
`

function FormField({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: '#364B6B',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        {label} {required && <span style={{ color: '#B23B3B' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function RegisterPage() {
  const [sameAsMailing, setSameAsMailing] = useState(false)
  const [form, setForm] = useState({
    firstName: '', middleName: '', lastName: '',
    address1: '', address2: '', city: '', state: 'California', zipCode: '',
    dob: '', phone: '', email: '', username: '', password: '', confirmPassword: '',
    courseType: '1',
    ccType: '', ccMonth: '', ccYear: '', ccNumber: '', ccCvv: '',
    billFirstName: '', billLastName: '', billAddress1: '', billAddress2: '',
    billCity: '', billState: 'California', billZip: '', billPhone: '', billEmail: '',
    disclaimer: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSameBilling = (e) => {
    const checked = e.target.checked
    setSameAsMailing(checked)
    if (checked) {
      setForm(prev => ({
        ...prev,
        billFirstName: prev.firstName,
        billLastName: prev.lastName,
        billAddress1: prev.address1,
        billAddress2: prev.address2,
        billCity: prev.city,
        billState: prev.state,
        billZip: prev.zipCode,
        billPhone: prev.phone,
        billEmail: prev.email,
      }))
    } else {
      setForm(prev => ({
        ...prev,
        billFirstName: '', billLastName: '', billAddress1: '', billAddress2: '',
        billCity: '', billState: 'California', billZip: '', billPhone: '', billEmail: '',
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.disclaimer !== '1') {
      alert('Please accept the disclaimer to proceed.')
      return
    }
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match.')
      return
    }
    alert('Registration submitted successfully!')
  }

  return (
    <div style={{ paddingTop: '12rem', minHeight: '100vh' }}>
      <style>{inputFocusCSS}</style>
      <div className="container" style={{ maxWidth: '52rem', marginBottom: '6rem' }}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src="/driving-logo.png"
            alt="A Precision Driving School"
            style={{
              height: 'clamp(140px, 20vw, 220px)',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 0.75rem',
              filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.85)) drop-shadow(0 0 18px rgba(253,188,1,0.45))',
            }}
          />
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#ffffff', marginBottom: '0.4rem', lineHeight: 1.1 }}>
            30 Hour Drivers Ed
          </h1>
          <p className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <span className="gold-bar" style={{ width: '20px' }} />
            Online Registration
            <span className="gold-bar" style={{ width: '20px' }} />
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '40ch', margin: '0 auto' }}>
            Register and pay via credit card to get started today.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: '#F8FAFD',
          border: '1px solid #E2EBF5',
          padding: 'clamp(2rem, 4vw, 3rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem',
        }}>

          {/* PERSONAL INFO */}
          <div>
            <div className="reg-section-title">Personal Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <FormField label="First Name" required>
                <input name="firstName" value={form.firstName} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Middle Name">
                <input name="middleName" value={form.middleName} onChange={handleChange} className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Last Name" required>
                <input name="lastName" value={form.lastName} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Date of Birth" required>
                <input name="dob" value={form.dob} onChange={handleChange} required placeholder="MM-DD-YYYY" className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Phone Number" required>
                <input name="phone" value={form.phone} onChange={handleChange} required placeholder="999-999-9999" className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Email" required>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
            </div>
          </div>

          {/* ADDRESS */}
          <div>
            <div className="reg-section-title">Mailing Address</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <FormField label="Address Line 1" required>
                <input name="address1" value={form.address1} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Address Line 2">
                <input name="address2" value={form.address2} onChange={handleChange} className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="City" required>
                <input name="city" value={form.city} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="State" required>
                <select name="state" value={form.state} onChange={handleChange} required className="reg-input reg-select" style={inputStyle}>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Zip Code" required>
                <input name="zipCode" value={form.zipCode} onChange={handleChange} required maxLength={5} className="reg-input" style={inputStyle} />
              </FormField>
            </div>
          </div>

          {/* ACCOUNT */}
          <div>
            <div className="reg-section-title">Account Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <FormField label="Username" required>
                <input name="username" value={form.username} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Password" required>
                <input name="password" type="password" value={form.password} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Confirm Password" required>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
            </div>
          </div>

          {/* COURSE */}
          <div>
            <div className="reg-section-title">Course Selection</div>
            <FormField label="Course Type" required>
              <select name="courseType" value={form.courseType} onChange={handleChange} required className="reg-input reg-select" style={inputStyle}>
                {COURSE_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FormField>
          </div>

          {/* PAYMENT */}
          <div>
            <div className="reg-section-title">Payment Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <FormField label="Card Type" required>
                <select name="ccType" value={form.ccType} onChange={handleChange} required className="reg-input reg-select" style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="Visa">Visa</option>
                  <option value="MasterCard">MasterCard</option>
                  <option value="Discover">Discover</option>
                  <option value="Amex">American Express</option>
                </select>
              </FormField>
              <FormField label="Card Number" required>
                <input name="ccNumber" value={form.ccNumber} onChange={handleChange} required maxLength={16} placeholder="XXXXXXXXXXXXXXXX" className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Expiration Month" required>
                <select name="ccMonth" value={form.ccMonth} onChange={handleChange} required className="reg-input reg-select" style={inputStyle}>
                  <option value="">Month</option>
                  {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Expiration Year" required>
                <select name="ccYear" value={form.ccYear} onChange={handleChange} required className="reg-input reg-select" style={inputStyle}>
                  <option value="">Year</option>
                  {Array.from({ length: 16 }, (_, i) => 26 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="CVV" required>
                <input name="ccCvv" value={form.ccCvv} onChange={handleChange} required maxLength={4} placeholder="3-4 digits" className="reg-input" style={inputStyle} />
              </FormField>
            </div>
          </div>

          {/* BILLING */}
          <div>
            <div className="reg-section-title">Billing Address</div>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              color: '#0145A8', fontSize: '0.9rem', fontWeight: 600,
              marginBottom: '1.25rem', cursor: 'pointer',
            }}>
              <input type="checkbox" checked={sameAsMailing} onChange={handleSameBilling} style={{ accentColor: '#0145A8', width: '18px', height: '18px' }} />
              Billing address is the same as mailing address
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <FormField label="First Name" required>
                <input name="billFirstName" value={form.billFirstName} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Last Name" required>
                <input name="billLastName" value={form.billLastName} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Address 1" required>
                <input name="billAddress1" value={form.billAddress1} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Address 2">
                <input name="billAddress2" value={form.billAddress2} onChange={handleChange} className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="City" required>
                <input name="billCity" value={form.billCity} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="State" required>
                <select name="billState" value={form.billState} onChange={handleChange} required className="reg-input reg-select" style={inputStyle}>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Zip Code" required>
                <input name="billZip" value={form.billZip} onChange={handleChange} required maxLength={5} className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Phone" required>
                <input name="billPhone" value={form.billPhone} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
              <FormField label="Email" required>
                <input name="billEmail" type="email" value={form.billEmail} onChange={handleChange} required className="reg-input" style={inputStyle} />
              </FormField>
            </div>
          </div>

          {/* DISCLAIMER */}
          <div>
            <div className="reg-section-title">Disclaimer</div>
            <div style={{
              background: '#F0F4F8',
              border: '1px solid #E2EBF5',
              padding: '1.5rem',
            }}>
              <p style={{ color: '#364B6B', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                Aprecision Driving School is not affiliated with the DMV, and the department shall not be responsible
                for distributed materials, advertisements, etc.
              </p>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#0145A8', fontWeight: 600 }}>
                  <input type="radio" name="disclaimer" value="1" checked={form.disclaimer === '1'} onChange={handleChange} style={{ accentColor: '#0145A8', width: '18px', height: '18px' }} />
                  I Agree
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#0145A8', fontWeight: 600 }}>
                  <input type="radio" name="disclaimer" value="0" checked={form.disclaimer === '0'} onChange={handleChange} style={{ accentColor: '#0145A8', width: '18px', height: '18px' }} />
                  I Disagree
                </label>
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
            <button type="submit" className="btn-gold" style={{ padding: '1rem 3rem', fontSize: '1rem' }}>
              Register & Pay
            </button>
            <a href="/" className="btn-ghost" style={{ padding: '1rem 3rem', fontSize: '1rem' }}>
              Cancel
            </a>
          </div>

        </form>
      </div>
    </div>
  )
}
