import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { SITE_DEFAULTS } from '../useSiteSettings'

function californiaDateKey() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const value = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

export function announcementIsVisible(settings, today = californiaDateKey()) {
  if (!settings?.announcementEnabled || !settings?.announcementMessage?.trim()) return false
  if (settings.announcementStartsAt && today < settings.announcementStartsAt) return false
  if (settings.announcementEndsAt && today > settings.announcementEndsAt) return false
  return true
}

export default function AnnouncementBar() {
  const [settings, setSettings] = useState(SITE_DEFAULTS)

  useEffect(() => {
    let cancelled = false
    const refresh = () => api.getSettings()
      .then(value => { if (!cancelled) setSettings({ ...SITE_DEFAULTS, ...(value || {}) }) })
      .catch(() => {})
    refresh()
    const timer = window.setInterval(refresh, 60_000)
    return () => { cancelled = true; window.clearInterval(timer) }
  }, [])

  if (!announcementIsVisible(settings)) return null

  const message = settings.announcementMessage.trim()
  const label = settings.announcementCtaLabel?.trim()
  const link = settings.announcementCtaLink?.trim()
  const cta = link && label
    ? link.startsWith('/')
      ? <Link className="announcement-bar__cta" to={link}>{label}<span aria-hidden="true">→</span></Link>
      : <a className="announcement-bar__cta" href={link}>{label}<span aria-hidden="true">→</span></a>
    : null

  return (
    <aside className="announcement-bar" aria-label="Current school announcement">
      <div className="announcement-bar__ticker" aria-hidden="true">
        <div className="announcement-bar__track">
          {[0, 1].map(copy => <div className="announcement-bar__message" key={copy}><span className="announcement-bar__spark" />{message}</div>)}
        </div>
      </div>
      <div className="sr-only">{message}</div>
      {cta}
    </aside>
  )
}
