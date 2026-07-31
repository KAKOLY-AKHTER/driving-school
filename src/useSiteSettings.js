import { useState, useEffect } from 'react'
import { api } from './api'

export const SITE_DEFAULTS = {
  phone: '+1 925 329 1736',
  email: 'aprecisiondrivingschool@gmail.com',
  address: '2001 Omega Rd, Ste 205',
  subaddress: 'San Ramon, CA 94583',
  scheduleLabel: 'aprecisiondrivingschool.com',
  scheduleLink: 'https://www.aprecisiondrivingschool.com/schedule/cart_home.html',
}

export function phoneHref(phone) {
  return 'tel:' + (phone || '').replace(/[^\d+]/g, '')
}

let settingsPromise = null

export function useSiteSettings() {
  const [settings, setSettings] = useState(SITE_DEFAULTS)

  useEffect(() => {
    if (!settingsPromise) {
      settingsPromise = api.getSettings()
        .then(s => ({ ...SITE_DEFAULTS, ...(s || {}) }))
        .catch(() => SITE_DEFAULTS)
    }
    settingsPromise.then(setSettings)
  }, [])

  return settings
}
