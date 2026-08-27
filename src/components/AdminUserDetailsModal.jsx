import { useEffect, useState } from 'react'

const BLUE = '#0145A8'
const NAVY = '#0A2A5E'
const GOLD = '#FDBC01'

const displayValue = (value) => {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Not recorded'
  const text = String(value ?? '').trim()
  return text || 'Not recorded'
}

const formatDateTime = (value) => {
  if (!value) return 'Not recorded'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return displayValue(value)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatMoney = (value) => {
  const source = String(value ?? '').trim()
  if (!source) return 'Not recorded'
  const raw = source.replace(/[$,]/g, '')
  const amount = Number(raw)
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    : displayValue(value)
}

const studentName = (profile = {}, fallback = {}) => {
  const fullName = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ')
  return profile.displayName || profile.name || profile.username || fullName
    || fallback.displayName || fallback.name || fallback.email || 'Student'
}

const statusStyle = (status) => {
  const value = String(status || '').toLowerCase()
  if (value.includes('refund') || value.includes('cancel') || value.includes('denied')) return { color: '#B91C1C', background: '#FEF2F2' }
  if (value.includes('pending') || value.includes('scheduled')) return { color: '#9A6700', background: '#FFFBEB' }
  if (value.includes('complete') || value.includes('confirm') || value.includes('active') || value.includes('capture')) return { color: '#15803D', background: '#F0FDF4' }
  return { color: '#0755AE', background: '#EFF6FF' }
}

function StatusChip({ children }) {
  const style = statusStyle(children)
  return <span style={{ ...style, display: 'inline-flex', maxWidth: '100%', padding: '.28rem .58rem', borderRadius: '999px', fontSize: '.72rem', lineHeight: 1.25, fontWeight: 900, letterSpacing: '.045em', textTransform: 'uppercase', whiteSpace: 'normal' }}>{displayValue(children)}</span>
}

function InfoField({ label, value, mono = false, wide = false }) {
  return (
    <div style={{ minWidth: 0, gridColumn: wide ? '1 / -1' : undefined, display: 'grid', gridTemplateColumns: 'minmax(125px, .7fr) minmax(0, 1.3fr)', alignItems: 'start', gap: '.8rem', padding: '.78rem .2rem', borderBottom: '1px solid #E7EDF4' }}>
      <div style={{ color: '#58708C', fontSize: '.78rem', fontWeight: 800 }}>{label}</div>
      <div style={{ color: '#102F55', fontSize: '.92rem', fontWeight: 700, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{displayValue(value)}</div>
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <section style={{ border: '1px solid #DCE7F3', borderRadius: '14px', background: '#fff', overflow: 'hidden', boxShadow: '0 8px 24px rgba(10,42,94,.045)' }}>
      <div style={{ padding: '1rem 1.15rem', borderBottom: '1px solid #DCE7F3', background: '#fff' }}>
        <h3 style={{ margin: 0, color: '#0A2A5E', fontFamily: 'var(--font-display)', fontSize: '1.08rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '.55rem' }}><span aria-hidden="true" style={{ width: '5px', height: '22px', borderRadius: '99px', background: GOLD }} />{title}</h3>
        {subtitle && <p style={{ margin: '.25rem 0 0 .85rem', color: '#58708C', fontSize: '.8rem' }}>{subtitle}</p>}
      </div>
      <div style={{ padding: '1rem' }}>{children}</div>
    </section>
  )
}

function EmptyHistory({ children }) {
  return <div style={{ padding: '1.15rem', borderRadius: '12px', background: '#F8FAFC', color: '#64748B', textAlign: 'center', fontWeight: 700 }}>{children}</div>
}

function HistoryTable({ columns, rows, empty }) {
  if (!rows?.length) return <EmptyHistory>{empty}</EmptyHistory>
  return (
    <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
      <table style={{ width: '100%', minWidth: '680px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{columns.map(column => <th key={column.label} scope="col" style={{ padding: '.75rem', color: '#102F55', background: '#F1F6FC', borderBottom: '1px solid #D8E4F0', fontSize: '.8rem', fontWeight: 900, textAlign: 'left', whiteSpace: 'nowrap' }}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.enrollmentId || row.providerCaptureId || `${index}`}>
              {columns.map(column => <td key={column.label} style={{ padding: '.78rem', color: '#263F5F', borderBottom: index === rows.length - 1 ? 0 : '1px solid #E8EEF5', fontSize: '.86rem', verticalAlign: 'top', overflowWrap: 'anywhere' }}>{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LoadingState() {
  return (
    <div aria-live="polite" style={{ display: 'grid', gap: '.8rem' }}>
      {[1, 2, 3, 4].map(item => <div key={item} style={{ height: item === 1 ? '86px' : '120px', borderRadius: '14px', background: 'linear-gradient(90deg,#EDF3F9,#F8FAFC,#EDF3F9)', backgroundSize: '200% 100%', animation: 'adminSkeleton 1.4s ease infinite' }} />)}
      <span className="sr-only">Loading complete student profile</span>
    </div>
  )
}

export default function AdminUserDetailsModal({ dialog, onClose, onRetry }) {
  const [activeTab, setActiveTab] = useState('overview')
  useEffect(() => setActiveTab('overview'), [dialog?.user?.uid])
  if (!dialog) return null
  const { user = {}, data, loading, error } = dialog
  const profile = data?.profile || user
  const auth = data?.authentication || {}
  const summary = data?.summary || {}
  const name = studentName(profile, user)
  const initials = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || '?'
  const profileFields = [
    ['Student ID', profile.uid, true],
    ['Full Name', name],
    ['Login Email', profile.email || user.email],
    ['Phone Number', profile.phone || user.phone],
    ['Date of Birth', profile.dob],
    ['Gender', profile.gender],
    ['Parent / Guardian Phone', profile.parentPhone],
    ['Preferred Course Type', profile.courseType],
    ['Street Address', profile.address],
    ['City', profile.city],
    ['State', profile.state],
    ['ZIP Code', profile.zipCode],
    ['Pickup Address', profile.pickupAddress],
    ['Permit / License Number', profile.permit, true],
    ['Permit Issue Date', profile.issueDate],
    ['Permit Expiry Date', profile.expiryDate],
    ['Terms Accepted', formatDateTime(profile.termsAcceptedAt)],
    ['Form Submitted', formatDateTime(profile.submittedAt)],
    ['Medical Information', profile.medications, false, true],
    ['Student Notes', profile.notes, false, true],
  ]

  return (
    <div role="presentation" className="admin-modal-backdrop" style={{ position: 'fixed', inset: 0, zIndex: 14500, display: 'grid', placeItems: 'center', padding: '1rem', background: 'rgba(5,20,43,.72)', backdropFilter: 'blur(12px)' }} onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby="student-details-title" style={{ width: 'min(1180px,100%)', maxHeight: '92vh', overflowY: 'auto', borderRadius: '22px', background: '#F7FAFE', border: '1px solid rgba(255,255,255,.7)', boxShadow: '0 35px 110px rgba(2,17,41,.42)' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.15rem 1.35rem', background: 'linear-gradient(135deg,#082B64,#0755AE)', color: '#fff', borderBottom: `3px solid ${GOLD}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', minWidth: 0 }}>
            <div aria-hidden="true" style={{ width: '48px', height: '48px', flex: '0 0 auto', display: 'grid', placeItems: 'center', borderRadius: '50%', color: NAVY, background: `linear-gradient(135deg,#FFF4B8,${GOLD})`, fontSize: '1.05rem', fontWeight: 900 }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <h2 id="student-details-title" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(1.15rem,2vw,1.55rem)', color: '#fff' }}>Complete Student Profile</h2>
              <p style={{ margin: '.2rem 0 0', color: '#D9E9FF', overflowWrap: 'anywhere' }}>{name} · {profile.email || user.email || 'Email not recorded'}</p>
            </div>
          </div>
          <button autoFocus type="button" aria-label="Close complete student profile" onClick={onClose} style={{ width: '42px', height: '42px', flex: '0 0 auto', borderRadius: '50%', border: '1px solid rgba(255,255,255,.45)', background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: '1.65rem', lineHeight: 1, cursor: 'pointer' }}>&times;</button>
        </header>

        <div style={{ padding: '1.2rem', display: 'grid', gap: '1rem' }}>
          {loading && <LoadingState />}
          {!loading && error && (
            <div role="alert" style={{ padding: '1.25rem', border: '1px solid #FECACA', borderRadius: '14px', background: '#FEF2F2', color: '#991B1B' }}>
              <strong>Student details could not be loaded.</strong>
              <p style={{ margin: '.35rem 0 1rem' }}>{error}</p>
              <button type="button" onClick={onRetry} style={{ minHeight: '42px', padding: '.55rem 1rem', border: 0, borderRadius: '9px', background: BLUE, color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Retry</button>
            </div>
          )}
          {!loading && !error && data && (
            <>
              <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap', border: '1px solid #DCE7F3', borderRadius: '14px', background: '#fff', overflow: 'hidden', boxShadow: '0 8px 24px rgba(10,42,94,.045)' }}>
                {[
                  ['Courses', summary.courses], ['Bookings', summary.bookings], ['Payments', summary.payments],
                  ['Refunds', summary.refunds], ['Cart Items', summary.cartItems], ['Support Threads', summary.supportThreads],
                ].map(([label, value], index) => <div key={label} style={{ minWidth: '125px', flex: '1 1 125px', padding: '.8rem 1rem', borderRight: index < 5 ? '1px solid #E6EDF5' : 0, textAlign: 'center' }}><strong style={{ display: 'block', color: BLUE, fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>{Number(value || 0)}</strong><span style={{ color: '#526A86', fontSize: '.74rem', fontWeight: 800 }}>{label}</span></div>)}
              </div>

              <nav aria-label="Student profile sections" style={{ display: 'flex', gap: '.35rem', overflowX: 'auto', padding: '.35rem', border: '1px solid #DCE7F3', borderRadius: '12px', background: '#EDF3F9' }}>
                {[
                  ['overview', 'Overview'],
                  ['courses', `Courses (${summary.courses || 0})`],
                  ['bookings', `Bookings (${summary.bookings || 0})`],
                  ['finance', 'Payments & Refunds'],
                  ['activity', 'Activity'],
                ].map(([key, label]) => {
                  const selected = activeTab === key
                  return <button key={key} type="button" aria-pressed={selected} onClick={() => setActiveTab(key)} style={{ minHeight: '42px', flex: '0 0 auto', padding: '.58rem .9rem', border: selected ? `1px solid ${BLUE}` : '1px solid transparent', borderRadius: '9px', background: selected ? '#fff' : 'transparent', color: selected ? BLUE : '#49627E', boxShadow: selected ? '0 4px 13px rgba(1,69,168,.1)' : 'none', fontSize: '.84rem', fontWeight: 900, cursor: 'pointer' }}>{label}</button>
                })}
              </nav>

              {activeTab === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: '1rem', alignItems: 'start' }}>
                  <Section title="Student Information" subtitle="Contact, address, pickup, and driving details.">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', columnGap: '1.4rem' }}>
                      {profileFields.map(([label, value, mono, wide]) => <InfoField key={label} label={label} value={value} mono={mono} wide={wide} />)}
                    </div>
                  </Section>

                  <Section title="Account Information" subtitle="Read-only sign-in data. Passwords and security tokens are never displayed.">
                    <div>
                      <InfoField label="Account Created" value={formatDateTime(auth.creationTime || profile.createdAt)} />
                      <InfoField label="Last Sign-in" value={formatDateTime(auth.lastSignInTime)} />
                      <InfoField label="Last Token Refresh" value={formatDateTime(auth.lastRefreshTime)} />
                      <InfoField label="Email Verified" value={auth.available ? auth.emailVerified : 'Unavailable'} />
                      <InfoField label="Account Enabled" value={auth.available ? !auth.disabled : 'Unavailable'} />
                      <InfoField label="Sign-in Providers" value={auth.providerIds} />
                      <InfoField label="Profile Last Updated" value={formatDateTime(profile.updatedAt)} />
                      <InfoField label="AI Conversation Count" value={summary.aiConversations || 0} />
                    </div>
                  </Section>
                </div>
              )}

              {activeTab === 'courses' && <Section title="Course & Enrollment History">
                <HistoryTable
                  rows={data.courses}
                  empty="No enrolled courses are recorded for this student."
                  columns={[
                    { label: 'Course / Plan', render: row => displayValue(row.title || row.planName || (row.id ? `Course ${row.id}` : 'Legacy / Unassigned')) },
                    { label: 'Status', render: row => <StatusChip>{row.status || 'Active'}</StatusChip> },
                    { label: 'Paid Amount', render: row => formatMoney(row.paidAmount ?? row.price) },
                    { label: 'Location', render: row => displayValue(row.city || row.location) },
                    { label: 'Enrolled On', render: row => formatDateTime(row.enrolledAt || row.createdAt) },
                    { label: 'Enrollment ID', render: row => displayValue(row.enrollmentId) },
                  ]}
                />
              </Section>}

              {activeTab === 'bookings' && <Section title="Lesson Booking History">
                <HistoryTable
                  rows={data.bookings}
                  empty="No lesson bookings are recorded for this student."
                  columns={[
                    { label: 'Lesson Date', render: row => displayValue(row.date) },
                    { label: 'Lesson Time', render: row => displayValue(row.timeSlot || row.time) },
                    { label: 'Booking Status', render: row => <StatusChip>{row.status}</StatusChip> },
                    { label: 'Course', render: row => displayValue(row.courseName || row.planName || row.courseId) },
                    { label: 'Pickup / City', render: row => displayValue(row.pickupAddress || row.city || row.location) },
                    { label: 'Booking Reference', render: row => displayValue(row.id) },
                  ]}
                />
              </Section>}

              {activeTab === 'finance' && <div style={{ display: 'grid', gap: '1rem' }}><Section title="Payment History">
                <HistoryTable
                  rows={data.payments}
                  empty="No successful or recorded payments were found."
                  columns={[
                    { label: 'Paid On', render: row => formatDateTime(row.paidAt || row.date) },
                    { label: 'Invoice / Item', render: row => displayValue(row.item) },
                    { label: 'Amount', render: row => formatMoney(row.amount) },
                    { label: 'Discount', render: row => formatMoney(row.discount || 0) },
                    { label: 'Payment Status', render: row => <StatusChip>{row.status || 'Paid'}</StatusChip> },
                    { label: 'PayPal Reference', render: row => displayValue(row.providerCaptureId || row.ref) },
                  ]}
                />
              </Section>

              <Section title="Refund History">
                <HistoryTable
                  rows={data.refunds}
                  empty="No refund requests are recorded for this student."
                  columns={[
                    { label: 'Course', render: row => displayValue(row.Course_Name) },
                    { label: 'Amount', render: row => formatMoney(row.Amount) },
                    { label: 'Refund Status', render: row => <StatusChip>{row.Status}</StatusChip> },
                    { label: 'Reason', render: row => displayValue(row.Reason) },
                    { label: 'Requested / Updated', render: row => formatDateTime(row.updatedAt || row.updated_at || row.createdAt || row.created_at) },
                    { label: 'PayPal Refund Reference', render: row => displayValue(row.Provider_Refund_ID) },
                  ]}
                />
              </Section></div>}

              {activeTab === 'activity' && <Section title="Other Account Activity" subtitle="Current cart, checkout, and support activity summaries.">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', columnGap: '1.4rem' }}>
                  <InfoField label="Courses Waiting in Cart" value={(data.cartItems || []).map(item => item.title || item.planName || item.id).filter(Boolean)} />
                  <InfoField label="PayPal Checkout Attempts" value={(data.checkoutOrders || []).length} />
                  <InfoField label="Support Subjects" value={(data.supportThreads || []).map(thread => thread.subject).filter(Boolean)} />
                </div>
              </Section>}
            </>
          )}
        </div>
        <footer style={{ position: 'sticky', bottom: 0, padding: '.9rem 1.2rem', borderTop: '1px solid #DCE7F3', background: 'rgba(255,255,255,.96)', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ minHeight: '44px', padding: '.65rem 1.25rem', border: 0, borderRadius: '10px', background: NAVY, color: '#fff', fontWeight: 900, cursor: 'pointer' }}>Close Profile</button>
        </footer>
      </div>
    </div>
  )
}
