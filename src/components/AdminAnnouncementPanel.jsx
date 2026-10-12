import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { announcementIsVisible } from './AnnouncementBar'

const defaultAnnouncement = {
  announcementEnabled: false,
  announcementMessage: '',
  announcementCtaLabel: '',
  announcementCtaLink: '',
  announcementStartsAt: '',
  announcementEndsAt: '',
}

const fieldLabelStyle = {
  fontFamily: 'var(--font-mono)', fontSize: '.76rem', letterSpacing: '.1em', textTransform: 'uppercase',
  color: '#334155', display: 'block', marginBottom: '.35rem', fontWeight: 800,
}

export default function AdminAnnouncementPanel({ cardStyle, inputStyle }) {
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState(defaultAnnouncement)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api.getSettings()
      .then(data => {
        if (cancelled) return
        const nextSettings = data || {}
        setSettings(nextSettings)
        setForm({ ...defaultAnnouncement, ...nextSettings })
      })
      .catch(loadError => { if (!cancelled) setError(loadError.message || 'Announcement settings could not be loaded.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const status = useMemo(() => {
    if (!form.announcementEnabled) return { label: 'Off — not visible to visitors', color: '#64748B', background: '#F1F5F9' }
    if (!form.announcementMessage.trim()) return { label: 'Needs a message before it can go live', color: '#B45309', background: '#FFFBEB' }
    if (!announcementIsVisible(form)) return { label: 'Scheduled or expired — not visible today', color: '#0755AE', background: '#EFF6FF' }
    return { label: 'Live — visible at the bottom of public pages', color: '#15803D', background: '#F0FDF4' }
  }, [form])

  const setValue = (key, value) => setForm(current => ({ ...current, [key]: value }))
  const save = async event => {
    event.preventDefault()
    const cleanMessage = form.announcementMessage.trim()
    if (form.announcementEnabled && !cleanMessage) return setError('Enter an announcement message before turning it on.')
    if (form.announcementStartsAt && form.announcementEndsAt && form.announcementEndsAt < form.announcementStartsAt) return setError('End date cannot be before the start date.')
    const link = form.announcementCtaLink.trim()
    if (link && !(/^(\/)(?!\/)[A-Za-z0-9_./?=&%#-]*$/.test(link) || /^https:\/\//i.test(link))) return setError('Button link must begin with / (for this site) or https://.')
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const nextSettings = { ...(settings || {}), ...form, announcementMessage: cleanMessage, announcementCtaLink: link, announcementCtaLabel: form.announcementCtaLabel.trim() }
      await api.adminUpdateSettings(nextSettings)
      setSettings(nextSettings)
      setForm({ ...defaultAnnouncement, ...nextSettings })
      setMessage(form.announcementEnabled ? 'Announcement saved. It is now updated on the public website.' : 'Announcement saved and hidden from the public website.')
    } catch (saveError) {
      setError(saveError.message || 'Announcement could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return <section style={{ ...cardStyle, marginBottom: '1.25rem', padding: 0, overflow: 'hidden' }} aria-labelledby="announcement-title">
    <div style={{ padding: '1.3rem 1.5rem', background: 'linear-gradient(135deg,#082048,#0145A8)', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div><h2 id="announcement-title" style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.3rem' }}>Website Offer & Announcement Bar</h2><p style={{ margin: '.3rem 0 0', color: 'rgba(255,255,255,.8)', lineHeight: 1.5 }}>Show one clear offer or notice as a moving bar at the bottom of every public page.</p></div>
        <span style={{ padding: '.36rem .65rem', borderRadius: '999px', background: form.announcementEnabled ? '#DCFCE7' : 'rgba(255,255,255,.14)', color: form.announcementEnabled ? '#166534' : '#fff', fontSize: '.76rem', fontWeight: 850 }}>{form.announcementEnabled ? 'ON' : 'OFF'}</span>
      </div>
    </div>
    <form onSubmit={save} style={{ padding: '1.5rem' }}>
      {loading ? <p style={{ color: '#475569', margin: 0 }}>Loading announcement settings…</p> : <>
        <div role="status" style={{ marginBottom: '1rem', padding: '.72rem .9rem', borderRadius: '10px', background: status.background, color: status.color, fontWeight: 800 }}>{status.label}</div>
        {message && <div role="status" style={{ marginBottom: '1rem', padding: '.72rem .9rem', borderRadius: '10px', background: '#F0FDF4', color: '#166534', fontWeight: 800 }}>{message}</div>}
        {error && <div role="alert" style={{ marginBottom: '1rem', padding: '.72rem .9rem', borderRadius: '10px', background: '#FEF2F2', color: '#B91C1C', fontWeight: 800 }}>{error}</div>}
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '.9rem 1rem', marginBottom: '1.1rem', border: '1px solid #D8E4F0', borderRadius: '12px', cursor: 'pointer' }}>
          <span><strong style={{ display: 'block', color: '#0A1628' }}>Show announcement on the website</strong><small style={{ color: '#64748B' }}>Turn this off anytime to hide it immediately.</small></span>
          <input type="checkbox" checked={form.announcementEnabled} onChange={event => setValue('announcementEnabled', event.target.checked)} style={{ width: '22px', height: '22px', accentColor: '#15803D' }} aria-label="Show announcement on the website" />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}><label style={fieldLabelStyle}>Offer / notice message *</label><textarea value={form.announcementMessage} onChange={event => setValue('announcementMessage', event.target.value)} maxLength="240" rows="3" placeholder="Example: Fall special: $20 off Essential Plan — use code FALL20." style={{ ...inputStyle, minHeight: '86px', resize: 'vertical' }} /><small style={{ color: '#64748B' }}>{form.announcementMessage.length}/240 characters</small></div>
          <div><label style={fieldLabelStyle}>Button text (optional)</label><input value={form.announcementCtaLabel} onChange={event => setValue('announcementCtaLabel', event.target.value)} maxLength="40" placeholder="View plans" style={inputStyle} /></div>
          <div><label style={fieldLabelStyle}>Button link (optional)</label><input value={form.announcementCtaLink} onChange={event => setValue('announcementCtaLink', event.target.value)} maxLength="2000" placeholder="/pricing or https://..." style={inputStyle} /></div>
          <div><label style={fieldLabelStyle}>Start date (optional)</label><input type="date" value={form.announcementStartsAt} onChange={event => setValue('announcementStartsAt', event.target.value)} style={inputStyle} /></div>
          <div><label style={fieldLabelStyle}>End date (optional)</label><input type="date" min={form.announcementStartsAt || undefined} value={form.announcementEndsAt} onChange={event => setValue('announcementEndsAt', event.target.value)} style={inputStyle} /></div>
        </div>
        <p style={{ margin: '.7rem 0 0', color: '#64748B', fontSize: '.82rem', lineHeight: 1.5 }}>Dates follow California time. Leave both blank to show the message until you turn it off.</p>
        <div style={{ marginTop: '1.25rem', padding: '.9rem 1rem', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}><span style={{ ...fieldLabelStyle, marginBottom: '.45rem' }}>Live preview</span><div style={{ overflow: 'hidden', borderRadius: '7px', background: '#082048', color: '#fff', padding: '.55rem .75rem', display: 'flex', alignItems: 'center', gap: '.6rem', fontSize: '.88rem' }}><span style={{ color: '#FDBC01' }}>●</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{form.announcementMessage || 'Your announcement will appear here.'}</span>{form.announcementCtaLink && <span style={{ color: '#082048', background: '#FDBC01', borderRadius: '5px', padding: '.25rem .45rem', fontWeight: 850, whiteSpace: 'nowrap' }}>{form.announcementCtaLabel || 'Learn more'} →</span>}</div></div>
        <button type="submit" disabled={saving} style={{ marginTop: '1.25rem', padding: '.75rem 1.1rem', border: 0, borderRadius: '9px', background: 'linear-gradient(135deg,#0145A8,#0A2A5E)', color: '#fff', fontWeight: 850, cursor: saving ? 'wait' : 'pointer', opacity: saving ? .7 : 1 }}>{saving ? 'Saving…' : form.announcementEnabled ? 'Save & Publish Announcement' : 'Save Announcement Settings'}</button>
      </>}
    </form>
  </section>
}
