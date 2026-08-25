import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'

const BLUE = '#0145A8'
const DARK = '#0A1628'

const emptyForm = () => ({
  code: '',
  discountType: 'fixed',
  discountValue: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
})

const statusMeta = coupon => ({
  active: { label: 'Active — Customers Can Use', color: '#15803D', background: '#F0FDF4' },
  paused: { label: 'Paused — Cannot Be Used', color: '#B91C1C', background: '#FEF2F2' },
  scheduled: { label: 'Scheduled — Starts Later', color: '#0755AE', background: '#EFF6FF' },
  expired: { label: 'Expired — Cannot Be Used', color: '#64748B', background: '#F1F5F9' },
}[coupon.effectiveStatus] || { label: coupon.effectiveStatus || 'Unknown', color: '#64748B', background: '#F1F5F9' })

const discountLabel = coupon => coupon.discountType === 'percentage'
  ? `${Number(coupon.discountValue || 0).toLocaleString('en-US')}% off`
  : Number(coupon.discountValue || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

function Pager({ page, pages, total, onChange }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginTop: '1rem' }}><span style={{ color: '#475569', fontSize: '.9rem' }}>Page {page} of {pages} · {total} coupon{total === 1 ? '' : 's'}</span><div style={{ display: 'flex', gap: '.45rem' }}><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} style={{ padding: '.5rem .8rem', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Previous</button><button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} style={{ padding: '.5rem .8rem', border: '1px solid #CBD5E1', borderRadius: '8px', background: '#fff', cursor: page >= pages ? 'not-allowed' : 'pointer' }}>Next</button></div></div>
}

export default function AdminCouponsPanel({ cardStyle, inputStyle, labelStyle, thStyle, tdStyle, requestConfirmation }) {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [limit, setLimit] = useState(10)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    api.adminCoupons()
      .then(data => { if (!cancelled) setCoupons(Array.isArray(data) ? data : []) })
      .catch(loadError => { if (!cancelled) setError(loadError.message || 'Coupon codes could not be loaded.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [attempt])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return coupons.filter(coupon => (!query || [coupon.code, coupon.discountType, coupon.discountValue, coupon.expiresAt].some(value => String(value || '').toLowerCase().includes(query))) && (status === 'all' || coupon.effectiveStatus === status))
  }, [coupons, search, status])
  const pages = Math.max(1, Math.ceil(filtered.length / limit))
  const safePage = Math.min(page, pages)
  const visible = filtered.slice((safePage - 1) * limit, safePage * limit)
  const activeCount = coupons.filter(coupon => coupon.effectiveStatus === 'active').length
  const totalUses = coupons.reduce((sum, coupon) => sum + Number(coupon.redemptionCount || 0), 0)

  const openNew = () => { setForm(emptyForm()); setEditing('new'); setMessage(''); setError('') }
  const openEdit = coupon => {
    setForm({
      code: coupon.code || '',
      discountType: coupon.discountType || 'fixed',
      discountValue: String(coupon.discountValue ?? ''),
      startsAt: coupon.startsAt || '',
      expiresAt: coupon.expiresAt || '',
      isActive: coupon.isActive !== false,
    })
    setEditing(String(coupon._id))
    setMessage('')
    setError('')
  }

  const saveCoupon = async event => {
    event.preventDefault()
    const code = form.code.trim().toUpperCase().replace(/\s+/g, '')
    const value = Number(form.discountValue)
    if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)) {
      setError('Coupon code must be 3–32 characters using letters, numbers, hyphens, or underscores.')
      return
    }
    if (!Number.isFinite(value) || value <= 0 || (form.discountType === 'percentage' && value > 100)) {
      setError(form.discountType === 'percentage' ? 'Enter a percentage between 0.01 and 100.' : 'Enter a fixed dollar discount greater than zero.')
      return
    }
    if (form.startsAt && form.expiresAt && form.expiresAt < form.startsAt) {
      setError('Expiry date cannot be before the start date.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const doc = { ...form, code, discountValue: value }
      if (editing === 'new') await api.adminAddCoupon(doc)
      else await api.adminUpdateCoupon(editing, doc)
      setEditing(null)
      setMessage(editing === 'new' ? 'Coupon created successfully.' : 'Coupon changes saved.')
      setAttempt(current => current + 1)
    } catch (saveError) {
      setError(saveError.message || 'Coupon could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const toggleCoupon = coupon => {
    const nextActive = coupon.isActive === false
    requestConfirmation(
      nextActive ? 'Activate coupon code?' : 'Pause coupon code?',
      nextActive
        ? `${coupon.code} will become available to customers, subject to its start and expiry dates.`
        : `${coupon.code} will stop working for new checkout attempts. Existing completed payments are not affected.`,
      async () => {
        await api.adminUpdateCoupon(coupon._id, { ...coupon, isActive: nextActive })
        setMessage(nextActive ? `${coupon.code} activated.` : `${coupon.code} paused.`)
        setAttempt(current => current + 1)
      },
    )
  }

  const deleteCoupon = coupon => requestConfirmation(
    Number(coupon.redemptionCount || 0) > 0 ? 'Delete a previously used coupon?' : 'Delete coupon code?',
    Number(coupon.redemptionCount || 0) > 0
      ? `${coupon.code} has been used ${coupon.redemptionCount} time${Number(coupon.redemptionCount) === 1 ? '' : 's'}. Payment history will keep its coupon details, but this code will be permanently removed from the dashboard.`
      : `${coupon.code} will be permanently removed and customers will no longer be able to use it.`,
    async () => {
      await api.adminDeleteCoupon(coupon._id, Number(coupon.redemptionCount || 0) > 0)
      setCoupons(current => current.filter(item => String(item._id) !== String(coupon._id)))
      setMessage(`${coupon.code} deleted.`)
    },
  )

  return <>
    <div className="admin-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
      {[{ label: 'All Coupon Codes', value: coupons.length, color: BLUE }, { label: 'Active Now', value: activeCount, color: '#16A34A' }, { label: 'Total Times Used', value: totalUses, color: '#C8960C' }].map(item => <div key={item.label} style={{ ...cardStyle, textAlign: 'center', padding: '1.2rem' }}><div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: item.color, fontWeight: 900 }}>{item.value}</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase', color: '#475569', fontWeight: 800 }}>{item.label}</div></div>)}
    </div>
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}><div><h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: DARK, fontSize: '1.35rem' }}>Customer Coupon Codes</h2><p style={{ margin: '.35rem 0 0', color: '#475569', lineHeight: 1.5 }}>Create discounts that are securely verified by the server before PayPal charges the customer.</p></div><button type="button" onClick={openNew} style={{ padding: '.65rem 1rem', border: 0, borderRadius: '9px', background: `linear-gradient(135deg,${BLUE},#0A2A5E)`, color: '#fff', fontWeight: 850, cursor: 'pointer' }}>+ Create Coupon</button></div>
      <div role="note" style={{ marginBottom: '1rem', padding: '.85rem 1rem', border: '1px solid #BFDBFE', borderRadius: '12px', background: '#EFF6FF', color: '#1E3A5F', lineHeight: 1.55 }}><strong>How it works:</strong> Fixed Amount removes a dollar value; Percentage removes a percentage. A coupon may reduce a PayPal order to $0.01, but never below it.</div>
      {message && <div role="status" style={{ marginBottom: '1rem', padding: '.8rem 1rem', border: '1px solid #86EFAC', borderRadius: '10px', background: '#F0FDF4', color: '#166534', fontWeight: 750 }}>{message}</div>}
      {error && <div role="alert" style={{ marginBottom: '1rem', padding: '.8rem 1rem', border: '1px solid #FCA5A5', borderRadius: '10px', background: '#FEF2F2', color: '#B91C1C', fontWeight: 750 }}>{error} {!editing && <button type="button" onClick={() => setAttempt(current => current + 1)} style={{ marginLeft: '.5rem', border: 0, background: 'transparent', color: BLUE, fontWeight: 850, cursor: 'pointer' }}>Retry</button>}</div>}
      <div className="admin-toolbar" style={{ display: 'flex', gap: '.55rem', flexWrap: 'wrap', marginBottom: '1rem' }}><input type="search" aria-label="Search coupon codes" placeholder="Search code, discount or date…" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} style={{ ...inputStyle, maxWidth: '290px' }} /><select aria-label="Filter coupon status" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }} style={{ ...inputStyle, width: '220px' }}><option value="all">All coupon statuses</option><option value="active">Active now</option><option value="scheduled">Scheduled</option><option value="paused">Paused</option><option value="expired">Expired</option></select><select aria-label="Coupon rows per page" value={limit} onChange={event => { setLimit(Number(event.target.value)); setPage(1) }} style={{ ...inputStyle, width: '105px' }}><option value="10">10 / page</option><option value="25">25 / page</option><option value="50">50 / page</option></select></div>
      <div className="admin-table-wrap"><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '980px' }}><thead><tr><th scope="col" style={thStyle}>Coupon Code</th><th scope="col" style={thStyle}>Customer Discount</th><th scope="col" style={thStyle}>Valid From</th><th scope="col" style={thStyle}>Expires After</th><th scope="col" style={thStyle}>Current Availability</th><th scope="col" style={thStyle}>Times Used</th><th scope="col" className="admin-actions-cell" style={thStyle}>Manage Coupon</th></tr></thead><tbody>
        {visible.map(coupon => { const meta = statusMeta(coupon); return <tr key={coupon._id}><td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontWeight: 900, color: BLUE }}>{coupon.code}</td><td style={{ ...tdStyle, fontWeight: 800 }}>{discountLabel(coupon)}</td><td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{coupon.startsAt || 'Immediately'}</td><td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>{coupon.expiresAt || 'No expiry date'}</td><td style={tdStyle}><span style={{ display: 'inline-flex', padding: '.28rem .55rem', borderRadius: '999px', background: meta.background, color: meta.color, fontSize: '.72rem', fontWeight: 850, whiteSpace: 'nowrap' }}>{meta.label}</span></td><td style={{ ...tdStyle, textAlign: 'center', fontWeight: 800 }}>{Number(coupon.redemptionCount || 0)}</td><td className="admin-actions-cell" style={{ ...tdStyle, minWidth: '235px' }}><div style={{ display: 'flex', gap: '.4rem' }}><button type="button" onClick={() => toggleCoupon(coupon)} style={{ padding: '.4rem .6rem', border: `1.5px solid ${coupon.isActive === false ? '#16A34A' : '#D97706'}`, borderRadius: '8px', background: '#fff', color: coupon.isActive === false ? '#15803D' : '#B45309', fontWeight: 800, cursor: 'pointer' }}>{coupon.isActive === false ? 'Activate' : 'Pause'}</button><button type="button" onClick={() => openEdit(coupon)} style={{ padding: '.4rem .6rem', border: `1.5px solid ${BLUE}`, borderRadius: '8px', background: '#fff', color: BLUE, fontWeight: 800, cursor: 'pointer' }}>Edit</button><button type="button" onClick={() => deleteCoupon(coupon)} style={{ padding: '.4rem .6rem', border: '1.5px solid #DC2626', borderRadius: '8px', background: '#fff', color: '#DC2626', fontWeight: 800, cursor: 'pointer' }}>Delete</button></div></td></tr> })}
        {!loading && !visible.length && <tr><td colSpan={7} style={{ ...tdStyle, padding: '2.2rem', textAlign: 'center', color: '#475569' }}>{search || status !== 'all' ? 'No coupons match the selected search and status.' : 'No coupon codes yet. Select “Create Coupon” to add the first one.'}</td></tr>}
        {loading && <tr><td colSpan={7} style={{ ...tdStyle, padding: '2.2rem', textAlign: 'center', color: '#475569' }}>Loading coupon codes…</td></tr>}
      </tbody></table></div>
      <Pager page={safePage} pages={pages} total={filtered.length} onChange={setPage} />
    </div>

    {editing && <div role="presentation" className="admin-modal-backdrop" onClick={event => { if (event.target === event.currentTarget) requestConfirmation('Discard coupon changes?', 'Any unsaved coupon changes will be lost.', () => setEditing(null)) }} style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'grid', placeItems: 'center', padding: '1rem', background: 'rgba(10,22,40,.68)', backdropFilter: 'blur(10px)' }}><form role="dialog" aria-modal="true" aria-labelledby="coupon-dialog-title" onSubmit={saveCoupon} style={{ width: 'min(620px,100%)', maxHeight: '90vh', overflowY: 'auto', padding: '1.7rem', borderRadius: '20px', background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,.28)' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}><div><h3 id="coupon-dialog-title" style={{ margin: 0, fontFamily: 'var(--font-display)', color: DARK, fontSize: '1.35rem' }}>{editing === 'new' ? 'Create Coupon Code' : 'Edit Coupon Code'}</h3><p style={{ margin: '.3rem 0 0', color: '#64748B', fontSize: '.86rem' }}>All amounts are in US dollars and are verified during checkout.</p></div><button type="button" aria-label="Close coupon editor" onClick={() => requestConfirmation('Discard coupon changes?', 'Any unsaved coupon changes will be lost.', () => setEditing(null))} style={{ border: 0, background: 'transparent', color: '#475569', fontSize: '1.6rem', cursor: 'pointer' }}>×</button></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '1rem' }}><div><label style={labelStyle}>Coupon Code *</label><input autoFocus value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value.toUpperCase().replace(/\s+/g, '') }))} maxLength="32" placeholder="e.g. SAVE15" style={{ ...inputStyle, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }} /></div><div><label style={labelStyle}>Discount Type *</label><select value={form.discountType} onChange={event => setForm(current => ({ ...current, discountType: event.target.value }))} style={inputStyle}><option value="fixed">Fixed Amount ($)</option><option value="percentage">Percentage (%)</option></select></div><div><label style={labelStyle}>{form.discountType === 'percentage' ? 'Percentage Off *' : 'Dollar Amount Off *'}</label><input type="number" inputMode="decimal" min="0.01" max={form.discountType === 'percentage' ? '100' : '1000000'} step="0.01" value={form.discountValue} onChange={event => setForm(current => ({ ...current, discountValue: event.target.value }))} placeholder={form.discountType === 'percentage' ? '15' : '15.00'} style={inputStyle} /></div><div><label style={labelStyle}>Customer Availability *</label><select value={form.isActive ? 'active' : 'paused'} onChange={event => setForm(current => ({ ...current, isActive: event.target.value === 'active' }))} style={inputStyle}><option value="active">Active — customers can use</option><option value="paused">Paused — customers cannot use</option></select></div><div><label style={labelStyle}>Start Date</label><input type="date" value={form.startsAt} onChange={event => setForm(current => ({ ...current, startsAt: event.target.value }))} style={inputStyle} /><small style={{ display: 'block', marginTop: '.35rem', color: '#64748B' }}>Leave blank to start immediately.</small></div><div><label style={labelStyle}>Expiry Date</label><input type="date" min={form.startsAt || undefined} value={form.expiresAt} onChange={event => setForm(current => ({ ...current, expiresAt: event.target.value }))} style={inputStyle} /><small style={{ display: 'block', marginTop: '.35rem', color: '#64748B' }}>Valid through this date. Leave blank for no expiry.</small></div></div>
      {error && <div role="alert" style={{ marginTop: '1rem', padding: '.75rem .9rem', border: '1px solid #FCA5A5', borderRadius: '10px', background: '#FEF2F2', color: '#B91C1C', fontWeight: 750 }}>{error}</div>}
      <div style={{ display: 'flex', gap: '.7rem', marginTop: '1.3rem' }}><button type="button" disabled={saving} onClick={() => requestConfirmation('Discard coupon changes?', 'Any unsaved coupon changes will be lost.', () => setEditing(null))} style={{ flex: 1, padding: '.75rem', border: '1.5px solid #CBD5E1', borderRadius: '9px', background: '#fff', color: '#475569', fontWeight: 850, cursor: 'pointer' }}>Cancel</button><button type="submit" disabled={saving} style={{ flex: 1, padding: '.75rem', border: 0, borderRadius: '9px', background: `linear-gradient(135deg,${BLUE},#0A2A5E)`, color: '#fff', fontWeight: 850, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Saving Coupon…' : editing === 'new' ? 'Create Coupon' : 'Save Coupon Changes'}</button></div></form></div>}
  </>
}
