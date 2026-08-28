import { useEffect, useId, useRef, useState } from 'react'

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 4 * 1024 * 1024

export default function ProfilePhotoUploader({
  photoURL = '',
  name = 'Account',
  initials = '?',
  fallbackURL = '',
  onUpload,
  onRemove,
  disabled = false,
}) {
  const headingId = useId()
  const inputRef = useRef(null)
  const [localPreview, setLocalPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview)
  }, [localPreview])

  const choosePhoto = () => {
    setError('')
    setConfirmingRemove(false)
    inputRef.current?.click()
  }

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Profile photo must be 4 MB or smaller.')
      return
    }

    const preview = URL.createObjectURL(file)
    setLocalPreview(previous => {
      if (previous) URL.revokeObjectURL(previous)
      return preview
    })
    setBusy(true)
    setError('')
    try {
      await onUpload(file)
      setLocalPreview(previous => {
        if (previous) URL.revokeObjectURL(previous)
        return ''
      })
    } catch (uploadError) {
      setError(uploadError?.message || 'The profile photo could not be uploaded.')
      setLocalPreview(previous => {
        if (previous) URL.revokeObjectURL(previous)
        return ''
      })
    } finally {
      setBusy(false)
    }
  }

  const handleRemove = async () => {
    setBusy(true)
    setError('')
    try {
      await onRemove()
      setConfirmingRemove(false)
    } catch (removeError) {
      setError(removeError?.message || 'The profile photo could not be removed.')
    } finally {
      setBusy(false)
    }
  }

  const visiblePhoto = localPreview || photoURL || fallbackURL
  const isDisabled = disabled || busy

  return (
    <section aria-labelledby={headingId} style={{ padding:'1.1rem', border:'1px solid #D8E5F4', borderRadius:'16px', background:'linear-gradient(135deg,#F8FBFF,#FFFDF5)', marginBottom:'1.5rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
        {visiblePhoto ? (
          <img src={visiblePhoto} alt={`${name} profile`} style={{ width:'88px', height:'88px', borderRadius:'50%', objectFit:'cover', border:'3px solid #FDBC01', boxShadow:'0 10px 28px rgba(1,69,168,.16)', flexShrink:0 }} />
        ) : (
          <div role="img" aria-label={`${name} profile initials`} style={{ width:'88px', height:'88px', borderRadius:'50%', display:'grid', placeItems:'center', background:'linear-gradient(135deg,#FDBC01,#FFD54F)', color:'#0A1628', border:'3px solid #FDBC01', boxShadow:'0 10px 28px rgba(1,69,168,.16)', fontSize:'1.45rem', fontWeight:900, flexShrink:0 }}>{initials}</div>
        )}
        <div style={{ flex:'1 1 260px', minWidth:0 }}>
          <h4 id={headingId} style={{ margin:'0 0 .35rem', color:'#0A1628', fontFamily:'var(--font-display)', fontSize:'1.05rem' }}>Profile photo</h4>
          <p style={{ margin:'0 0 .8rem', color:'#475569', lineHeight:1.55, fontSize:'.9rem' }}>Upload a clear JPG, PNG, or WebP image up to 4 MB. Square photos look best.</p>
          <div style={{ display:'flex', alignItems:'center', gap:'.65rem', flexWrap:'wrap' }}>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} hidden aria-label="Choose profile photo" />
            <button type="button" onClick={choosePhoto} disabled={isDisabled} style={{ padding:'.65rem 1rem', border:'1.5px solid #0145A8', borderRadius:'10px', background:'#0145A8', color:'#fff', fontWeight:800, cursor:isDisabled ? 'wait' : 'pointer', opacity:isDisabled ? .65 : 1 }}>{busy ? 'Uploading…' : photoURL ? 'Change photo' : 'Upload photo'}</button>
            {photoURL && !confirmingRemove && <button type="button" onClick={() => { setError(''); setConfirmingRemove(true) }} disabled={isDisabled} style={{ padding:'.65rem 1rem', border:'1.5px solid #FCA5A5', borderRadius:'10px', background:'#fff', color:'#B91C1C', fontWeight:800, cursor:isDisabled ? 'wait' : 'pointer', opacity:isDisabled ? .65 : 1 }}>Remove photo</button>}
          </div>
        </div>
      </div>
      {confirmingRemove && (
        <div role="alertdialog" aria-label="Confirm profile photo removal" style={{ marginTop:'.9rem', padding:'.8rem', border:'1px solid #FECACA', borderRadius:'10px', background:'#FFF7F7', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'.75rem', flexWrap:'wrap' }}>
          <span style={{ color:'#7F1D1D', fontWeight:700 }}>Remove the current profile photo?</span>
          <div style={{ display:'flex', gap:'.5rem' }}>
            <button type="button" onClick={() => setConfirmingRemove(false)} disabled={isDisabled} style={{ padding:'.5rem .8rem', border:'1px solid #CBD5E1', borderRadius:'8px', background:'#fff', color:'#334155', fontWeight:700 }}>Keep photo</button>
            <button type="button" onClick={handleRemove} disabled={isDisabled} style={{ padding:'.5rem .8rem', border:'1px solid #DC2626', borderRadius:'8px', background:'#DC2626', color:'#fff', fontWeight:800 }}>{busy ? 'Removing…' : 'Yes, remove'}</button>
          </div>
        </div>
      )}
      {error && <p role="alert" style={{ margin:'.85rem 0 0', padding:'.7rem .8rem', borderRadius:'10px', background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', fontWeight:700 }}>{error}</p>}
    </section>
  )
}
