import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'

const BLUE = '#0145A8'
const NAVY = '#0A234E'
const GOLD = '#FDBC01'

const threadTime = thread => thread?.updatedAt || thread?.createdAt || ''
const supportKey = thread => `${thread?.student?.uid || ''}:${thread?.id || ''}`

const formatTimestamp = value => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function SupportMessage({ message, adminView = false, studentName = 'Student' }) {
  const fromAdmin = message?.from === 'admin'
  const mine = adminView ? fromAdmin : !fromAdmin
  return (
    <div className={`live-support-message ${mine ? 'is-mine' : ''}`}>
      <div className="live-support-bubble">
        <p>{message?.text}</p>
        <span>{fromAdmin ? 'School team' : studentName} · {formatTimestamp(message?.timestamp)}</span>
      </div>
    </div>
  )
}

function SupportShell({ children }) {
  return (
    <>
      <style>{`
        .live-support-shell{display:grid;grid-template-columns:minmax(290px,340px) minmax(0,1fr);height:clamp(600px,74vh,760px);max-width:1180px;margin:0 auto;background:#fff;border:1px solid #DCE7F3;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(15,35,70,.10)}
        .live-support-list{display:flex;flex-direction:column;min-width:0;border-right:1px solid #DCE7F3;background:linear-gradient(180deg,#F8FBFF 0%,#F2F7FD 100%)}
        .live-support-list-head{padding:1rem 1.1rem;border-bottom:1px solid #DCE7F3;background:rgba(255,255,255,.88)}
        .live-support-list-heading{display:flex;align-items:center;justify-content:space-between;gap:.75rem}
        .live-support-list-kicker{margin:0 0 .15rem;color:#9A6700;font-family:var(--font-mono);font-size:.67rem;font-weight:900;letter-spacing:.13em;text-transform:uppercase}
        .live-support-list-title{display:block;color:#10213A;font-size:1rem;line-height:1.2}
        .live-support-list-scroll{flex:1;overflow:auto;padding:.7rem}
        .live-support-thread{width:100%;display:flex;align-items:flex-start;gap:.72rem;text-align:left;border:1px solid transparent;background:transparent;border-radius:15px;padding:.82rem;cursor:pointer;color:#334155;margin-bottom:.4rem;transition:background .18s ease,border-color .18s ease,box-shadow .18s ease,transform .18s ease}
        .live-support-thread:hover{background:#fff;border-color:#D8E4F2;transform:translateY(-1px)}
        .live-support-thread.is-active{background:#fff;border-color:rgba(1,69,168,.3);box-shadow:0 8px 22px rgba(1,69,168,.10)}
        .live-support-thread-avatar{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border-radius:11px;background:linear-gradient(135deg,#E3EFFF,#C7DDF9);color:#0145A8;font-size:.83rem;font-weight:900}
        .live-support-thread.is-active .live-support-thread-avatar{background:linear-gradient(135deg,#0755AE,#0A2A5E);color:#fff}
        .live-support-thread-copy{display:block;min-width:0;flex:1}
        .live-support-thread-title{display:flex;align-items:center;gap:.45rem;font-weight:850;color:#10213A;margin:0 0 .2rem;min-width:0}
        .live-support-thread-title span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .live-support-thread-meta{display:block;font-size:.8rem;color:#526780;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.45}
        .live-support-unread{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#DC2626;color:#fff;font-size:.7rem;font-weight:900;flex:none}
        .live-support-chat{display:flex;flex-direction:column;min-width:0;background:#FBFDFF}
        .live-support-chat-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.35rem;border-bottom:1px solid #DCE7F3;min-height:78px;background:#fff}
        .live-support-conversation-title{display:flex;align-items:center;gap:.7rem;min-width:0}
        .live-support-conversation-avatar{display:grid;place-items:center;width:38px;height:38px;flex:0 0 38px;border-radius:12px;background:#EEF5FF;color:#0145A8;font-weight:900}
        .live-support-conversation-kicker{margin:0 0 .12rem;color:#9A6700;font-family:var(--font-mono);font-size:.64rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
        .live-support-chat-body{flex:1;overflow:auto;padding:1.5rem;background:radial-gradient(circle at 100% 0%,rgba(1,69,168,.06),transparent 24rem),linear-gradient(135deg,#FBFDFF,#F4F8FD)}
        .live-support-message{display:flex;justify-content:flex-start;margin:1rem 0}
        .live-support-message.is-mine{justify-content:flex-end}
        .live-support-bubble{width:fit-content;min-width:0;max-width:min(70%,580px);padding:1rem 1.12rem;border-radius:18px 18px 18px 6px;background:#fff;border:1px solid #D8E4F2;box-shadow:0 7px 18px rgba(15,35,70,.07)}
        .live-support-message.is-mine .live-support-bubble{background:linear-gradient(135deg,#0755AE,#0A2A5E);color:#fff;border:0;border-radius:18px 18px 6px 18px;box-shadow:0 8px 20px rgba(1,69,168,.2)}
        .live-support-bubble p{white-space:pre-wrap;overflow-wrap:anywhere;margin:0;font-size:clamp(.96rem,1.1vw,1.04rem);line-height:1.6}
        .live-support-bubble span{display:block;margin-top:.55rem;font-size:.76rem;color:#64748B}
        .live-support-message.is-mine .live-support-bubble span{color:rgba(255,255,255,0.88)}
        .live-support-compose{padding:1rem 1.25rem;border-top:1px solid #DCE7F3;background:#fff}
        .live-support-compose-row{display:flex;align-items:flex-end;gap:.65rem}
        .live-support-input{width:100%;box-sizing:border-box;border:1.5px solid #D8E4F2;border-radius:12px;padding:.75rem .85rem;font:inherit;color:#10213A;background:#fff;outline:none}
        .live-support-input:focus{border-color:#0145A8;box-shadow:0 0 0 4px rgba(1,69,168,.08)}
        textarea.live-support-input{resize:vertical;min-height:52px;max-height:150px}
        .live-support-primary,.live-support-secondary{border-radius:10px;padding:.68rem .9rem;border:1px solid transparent;font-weight:800;cursor:pointer;white-space:nowrap}
        .live-support-primary{background:#0145A8;color:#fff;box-shadow:0 7px 18px rgba(1,69,168,.16)}
        .live-support-primary:hover{background:#063C89}
        .live-support-secondary{background:#fff;border-color:#D6E0EB;color:#334155}
        .live-support-primary:disabled,.live-support-secondary:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}
        .live-support-status{display:inline-flex;align-items:center;gap:.35rem;padding:.3rem .55rem;border-radius:999px;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;font-weight:900;background:#ECFDF3;color:#15803D}
        .live-support-status.is-closed{background:#F1F5F9;color:#334155}
        .live-support-empty{height:100%;display:grid;place-items:center;text-align:center;padding:2rem;color:#334155}
        .live-support-new{max-width:680px;margin:0 auto;padding:clamp(1rem,4vw,2.25rem)}
        .live-support-error{margin:.75rem 1rem;padding:.75rem;border-radius:10px;background:#FEF2F2;border:1px solid #FECACA;color:#B91C1C;font-weight:700}
        .live-support-stats{display:flex;gap:.45rem;flex-wrap:wrap;margin-top:.55rem}
        .live-support-stat{font-size:.72rem;font-weight:850;border-radius:999px;padding:.28rem .48rem;background:#EFF6FF;color:#0145A8}
        @media(max-width:760px){.live-support-shell{grid-template-columns:1fr;height:auto;min-height:680px}.live-support-list{border-right:0;border-bottom:1px solid #E2EBF5;max-height:255px}.live-support-chat{min-height:520px}.live-support-chat-head{padding:.85rem 1rem}.live-support-chat-body{padding:1rem}.live-support-compose{padding:.85rem}.live-support-bubble{max-width:88%}}
        @media(max-width:480px){.live-support-compose-row{align-items:stretch;flex-direction:column}.live-support-primary{width:100%}.live-support-chat-head{align-items:flex-start}.live-support-chat-head>div:last-child{display:flex;flex-direction:column;gap:.4rem}.live-support-bubble{min-width:min(170px,88vw);max-width:94%;padding:.9rem 1rem}}
      `}</style>
      {children}
    </>
  )
}

export function UserLiveSupportPanel({ user, onUnreadChange }) {
  const [threads, setThreads] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [newRequest, setNewRequest] = useState(false)
  const [subject, setSubject] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  const loadThreads = useCallback(async ({ quiet = false } = {}) => {
    if (!user?.uid) return
    if (!quiet) setLoading(true)
    try {
      const data = await api.getMessages(user.uid)
      const rows = Array.isArray(data) ? data : []
      setThreads(rows)
      setSelectedId(current => current && rows.some(row => row.id === current) ? current : (rows[0]?.id || ''))
      setError('')
    } catch (loadError) {
      if (!quiet) setError(loadError?.message || 'Live support conversations could not be loaded.')
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    loadThreads()
    const timer = window.setInterval(() => loadThreads({ quiet: true }), 15_000)
    return () => window.clearInterval(timer)
  }, [loadThreads])

  const selected = threads.find(thread => thread.id === selectedId)

  useEffect(() => {
    onUnreadChange?.(threads.filter(thread => thread.unreadByUser).length)
  }, [threads, onUnreadChange])

  useEffect(() => {
    if (!selected?.unreadByUser || !user?.uid) return
    setThreads(current => current.map(thread => thread.id === selected.id ? { ...thread, unreadByUser: false, read: true } : thread))
    api.markThreadRead(user.uid, selected.id).catch(() => {})
  }, [selected?.id, selected?.unreadByUser, user?.uid])

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) }, [selected?.messages?.length])

  const createRequest = async event => {
    event.preventDefault()
    if (!subject.trim() || !draft.trim() || !user?.uid) return
    setSaving(true); setError('')
    try {
      const result = await api.createThread(user.uid, subject.trim(), draft.trim())
      setThreads(Array.isArray(result?.messages) ? result.messages : [])
      setSelectedId(result?.thread?.id || '')
      setSubject(''); setDraft(''); setNewRequest(false)
    } catch (saveError) {
      setError(saveError?.message || 'Your support request could not be sent.')
    } finally { setSaving(false) }
  }

  const sendReply = async event => {
    event.preventDefault()
    if (!draft.trim() || !selected || !user?.uid) return
    setSaving(true); setError('')
    try {
      const result = await api.replyThread(user.uid, selected.id, draft.trim())
      setThreads(Array.isArray(result?.messages) ? result.messages : [])
      setDraft('')
    } catch (saveError) {
      setError(saveError?.message || 'Your reply could not be sent.')
    } finally { setSaving(false) }
  }

  return (
    <SupportShell>
      <section aria-label="Live support" className="live-support-shell">
        <aside className="live-support-list">
          <div className="live-support-list-head">
            <button type="button" className="live-support-primary" style={{ width: '100%' }} onClick={() => { setNewRequest(true); setSelectedId(''); setDraft(''); setError('') }}>+ New support request</button>
          </div>
          <div className="live-support-list-scroll">
            {loading ? <p role="status" style={{ color: '#334155', padding: '.6rem' }}>Loading conversations…</p> : threads.length === 0 ? <p style={{ color: '#334155', padding: '.6rem' }}>No support requests yet.</p> : threads.map(thread => (
              <button type="button" key={thread.id} className={`live-support-thread ${selectedId === thread.id && !newRequest ? 'is-active' : ''}`} onClick={() => { setSelectedId(thread.id); setNewRequest(false); setDraft(''); setError('') }}>
                <p className="live-support-thread-title"><span>{thread.subject || 'Support request'}</span>{thread.unreadByUser && <span className="live-support-unread">New</span>}</p>
                <p className="live-support-thread-meta">{thread.status === 'closed' ? 'Closed' : 'Open'} · {formatTimestamp(threadTime(thread))}</p>
              </button>
            ))}
          </div>
        </aside>

        <div className="live-support-chat">
          {error && <div className="live-support-error" role="alert">{error} <button type="button" className="live-support-secondary" style={{ marginLeft: '.5rem', padding: '.3rem .5rem' }} onClick={() => loadThreads()}>Retry</button></div>}
          {newRequest ? (
            <form className="live-support-new" onSubmit={createRequest}>
              <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '.15em', fontWeight: 900, fontSize: '.75rem', margin: 0 }}>School support team</p>
              <h2 style={{ color: NAVY, margin: '.35rem 0 .4rem', fontSize: '1.65rem' }}>How can we help?</h2>
              <p style={{ color: '#334155', lineHeight: 1.6, margin: '0 0 1.25rem' }}>Send your question to the school team. Replies will stay in this dashboard.</p>
              <label htmlFor="live-support-subject" style={{ display: 'block', fontWeight: 800, color: '#334155', marginBottom: '.35rem' }}>Subject</label>
              <input id="live-support-subject" className="live-support-input" maxLength={200} value={subject} onChange={event => setSubject(event.target.value)} placeholder="Example: Help with my lesson booking" required />
              <label htmlFor="live-support-first-message" style={{ display: 'block', fontWeight: 800, color: '#334155', margin: '1rem 0 .35rem' }}>Message</label>
              <textarea id="live-support-first-message" className="live-support-input" rows={6} maxLength={4000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Describe what you need help with…" required />
              <div style={{ display: 'flex', gap: '.65rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button type="submit" className="live-support-primary" disabled={saving}>{saving ? 'Sending…' : 'Send request'}</button>
                <button type="button" className="live-support-secondary" onClick={() => { setNewRequest(false); setSelectedId(threads[0]?.id || ''); setDraft('') }}>Cancel</button>
              </div>
            </form>
          ) : selected ? (
            <>
              <header className="live-support-chat-head">
                <div style={{ minWidth: 0 }}><h2 style={{ color: NAVY, margin: 0, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.subject}</h2><p style={{ color: '#334155', margin: '.2rem 0 0', fontSize: '.85rem' }}>Conversation with A Precision Driving School</p></div>
                <span className={`live-support-status ${selected.status === 'closed' ? 'is-closed' : ''}`}>{selected.status === 'closed' ? 'Closed' : 'Open'}</span>
              </header>
              <div className="live-support-chat-body" aria-live="polite">
                {(selected.messages || []).map((message, index) => <SupportMessage key={`${message.timestamp || 'message'}-${index}`} message={message} studentName="You" />)}
                <div ref={endRef} />
              </div>
              <form className="live-support-compose" onSubmit={sendReply}>
                {selected.status === 'closed' && <p style={{ margin: '0 0 .55rem', color: '#334155', fontSize: '.85rem' }}>Replying will reopen this request.</p>}
                <div className="live-support-compose-row"><textarea aria-label="Reply to school support" className="live-support-input" rows={2} maxLength={4000} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Write a reply…" required /><button type="submit" className="live-support-primary" disabled={saving || !draft.trim()}>{saving ? 'Sending…' : 'Send reply'}</button></div>
              </form>
            </>
          ) : (
            <div className="live-support-empty"><div><div style={{ width: 64, height: 64, borderRadius: 18, display: 'grid', placeItems: 'center', margin: '0 auto 1rem', background: '#EFF6FF', color: BLUE, fontSize: '1.7rem' }}>💬</div><h2 style={{ color: NAVY, margin: 0 }}>Live Support</h2><p style={{ maxWidth: 420, lineHeight: 1.6 }}>Create a support request to talk directly with the school team.</p><button type="button" className="live-support-primary" onClick={() => setNewRequest(true)}>Start a request</button></div></div>
          )}
        </div>
      </section>
    </SupportShell>
  )
}

export function AdminLiveSupportPanel({ onUnreadChange }) {
  const [threads, setThreads] = useState([])
  const [counts, setCounts] = useState({ total: 0, open: 0, unread: 0 })
  const [selectedKey, setSelectedKey] = useState('')
  const [status, setStatus] = useState('all')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  const loadInbox = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    try {
      const data = await api.adminSupport()
      const rows = Array.isArray(data?.threads) ? data.threads : []
      setThreads(rows)
      setCounts(data?.counts || { total: rows.length, open: rows.filter(row => row.status === 'open').length, unread: rows.filter(row => row.unreadByAdmin).length })
      setSelectedKey(current => current && rows.some(row => supportKey(row) === current) ? current : (supportKey(rows[0]) || ''))
      setError('')
    } catch (loadError) {
      if (!quiet) setError(loadError?.message || 'Live support inbox could not be loaded.')
    } finally { if (!quiet) setLoading(false) }
  }, [])

  useEffect(() => {
    loadInbox()
    const timer = window.setInterval(() => loadInbox({ quiet: true }), 10_000)
    return () => window.clearInterval(timer)
  }, [loadInbox])

  const filtered = useMemo(() => {
    return threads.filter(thread => status === 'all' || thread.status === status)
  }, [threads, status])
  const selected = threads.find(thread => supportKey(thread) === selectedKey)

  useEffect(() => { onUnreadChange?.(counts.unread || 0) }, [counts.unread, onUnreadChange])

  useEffect(() => {
    if (!selected?.unreadByAdmin) return
    setThreads(current => current.map(thread => supportKey(thread) === selectedKey ? { ...thread, unreadByAdmin: false } : thread))
    setCounts(current => ({ ...current, unread: Math.max(0, current.unread - 1) }))
    api.adminReadSupport(selected.student.uid, selected.id).catch(() => {})
  }, [selected?.id, selected?.student?.uid, selected?.unreadByAdmin, selectedKey])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) }, [selected?.messages?.length])

  const sendReply = async event => {
    event.preventDefault()
    if (!selected || !draft.trim()) return
    setSaving(true); setError('')
    try {
      await api.adminReplySupport(selected.student.uid, selected.id, draft.trim())
      setDraft('')
      await loadInbox({ quiet: true })
    } catch (saveError) { setError(saveError?.message || 'The reply could not be sent.') }
    finally { setSaving(false) }
  }

  const changeStatus = async nextStatus => {
    if (!selected) return
    setSaving(true); setError('')
    try {
      await api.adminUpdateSupportStatus(selected.student.uid, selected.id, nextStatus)
      await loadInbox({ quiet: true })
    } catch (saveError) { setError(saveError?.message || 'Conversation status could not be updated.') }
    finally { setSaving(false) }
  }

  return (
    <SupportShell>
      <div style={{ maxWidth: 1180, margin: '0 auto 1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div><p style={{ color: '#334155', margin: 0 }}>Reply to student questions and keep every conversation in one place.</p><div className="live-support-stats"><span className="live-support-stat">{counts.total} total</span><span className="live-support-stat">{counts.open} open</span><span className="live-support-stat" style={{ background: counts.unread ? '#FEF2F2' : '#F1F5F9', color: counts.unread ? '#B91C1C' : '#64748B' }}>{counts.unread} unread</span></div></div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}><select aria-label="Filter support status" className="live-support-input" style={{ width: 150 }} value={status} onChange={event => setStatus(event.target.value)}><option value="all">All status</option><option value="open">Open</option><option value="closed">Closed</option></select></div>
      </div>
      <section aria-label="Admin live support inbox" className="live-support-shell">
        <aside className="live-support-list">
          <div className="live-support-list-head">
            <div className="live-support-list-heading">
              <div><p className="live-support-list-kicker">Support desk</p><strong className="live-support-list-title">Student inbox</strong></div>
              <button type="button" className="live-support-secondary" style={{ padding: '.38rem .55rem' }} onClick={() => loadInbox()} disabled={loading}>Refresh</button>
            </div>
          </div>
          <div className="live-support-list-scroll">
            {loading ? <p role="status" style={{ color: '#334155', padding: '.6rem' }}>Loading inbox…</p> : filtered.length === 0 ? <p style={{ color: '#334155', padding: '.6rem' }}>{threads.length ? 'No requests match these filters.' : 'No student support requests yet.'}</p> : filtered.map(thread => (
              <button type="button" key={supportKey(thread)} className={`live-support-thread ${selectedKey === supportKey(thread) ? 'is-active' : ''}`} onClick={() => { setSelectedKey(supportKey(thread)); setDraft(''); setError('') }}>
                <span className="live-support-thread-avatar" aria-hidden="true">{(thread.student?.name || thread.student?.email || 'Student').trim().charAt(0).toUpperCase()}</span>
                <div className="live-support-thread-copy"><p className="live-support-thread-title"><span>{thread.student?.name || thread.student?.email || 'Student'}</span>{thread.unreadByAdmin && <span className="live-support-unread">New</span>}</p>
                <p className="live-support-thread-meta" style={{ fontWeight: 750, color: '#334155' }}>{thread.subject || 'Support request'}</p><p className="live-support-thread-meta">{thread.status === 'closed' ? 'Closed' : 'Open'} / {formatTimestamp(threadTime(thread))}</p></div>
              </button>
            ))}
          </div>
        </aside>
        <div className="live-support-chat">
          {error && <div className="live-support-error" role="alert">{error} <button type="button" className="live-support-secondary" style={{ marginLeft: '.5rem', padding: '.3rem .5rem' }} onClick={() => loadInbox()}>Retry</button></div>}
          {selected ? <>
            <header className="live-support-chat-head"><div className="live-support-conversation-title"><span className="live-support-conversation-avatar" aria-hidden="true">{(selected.student?.name || selected.student?.email || 'S').trim().charAt(0).toUpperCase()}</span><div style={{ minWidth: 0 }}><p className="live-support-conversation-kicker">Active conversation</p><h2 style={{ color: NAVY, fontSize: '1.08rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.subject || 'Student support request'}</h2><p style={{ color: '#526780', margin: '.18rem 0 0', fontSize: '.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.student?.name || 'Student'}{selected.student?.email ? ` / ${selected.student.email}` : ''}</p></div></div><div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flex: '0 0 auto' }}><span className={`live-support-status ${selected.status === 'closed' ? 'is-closed' : ''}`}>{selected.status || 'open'}</span><button type="button" className="live-support-secondary" disabled={saving} onClick={() => changeStatus(selected.status === 'closed' ? 'open' : 'closed')}>{selected.status === 'closed' ? 'Reopen' : 'Close'}</button></div></header>
            <div className="live-support-chat-body" aria-live="polite">{(selected.messages || []).map((message, index) => <SupportMessage key={`${message.timestamp || 'message'}-${index}`} message={message} adminView studentName={selected.student?.name || 'Student'} />)}<div ref={endRef} /></div>
            <form className="live-support-compose" onSubmit={sendReply}><div className="live-support-compose-row"><textarea aria-label="Reply to student" className="live-support-input" rows={2} maxLength={4000} value={draft} onChange={event => setDraft(event.target.value)} placeholder={selected.status === 'closed' ? 'Reply to reopen this request…' : 'Write a reply to the student…'} required /><button type="submit" className="live-support-primary" disabled={saving || !draft.trim()}>{saving ? 'Sending…' : 'Send reply'}</button></div></form>
          </> : <div className="live-support-empty"><div><div style={{ fontSize: '2rem' }}>💬</div><h2 style={{ color: NAVY }}>Live Support Inbox</h2><p>Select a student request to view and reply.</p></div></div>}
        </div>
      </section>
    </SupportShell>
  )
}
