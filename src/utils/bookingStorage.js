const GUEST_CART_KEY = 'aprecision_guest_cart_v1'
const BOOKING_RETURN_KEY = 'aprecision_booking_return_v1'

const storageAvailable = () => {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage)
  } catch {
    return false
  }
}

const readStorage = (key) => {
  try {
    return storageAvailable() ? window.localStorage.getItem(key) : null
  } catch {
    return null
  }
}

const writeStorage = (key, value) => {
  try {
    if (!storageAvailable()) return false
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

const cleanText = (value, maxLength = 160) => String(value ?? '').trim().slice(0, maxLength)

const cleanCount = (value) => {
  const count = Number.parseInt(value, 10)
  return Number.isFinite(count) && count >= 0 ? count : 0
}

export const normalizeCartItem = (item) => {
  if (!item || typeof item !== 'object') return null

  const id = cleanText(item.id, 80)
  const title = cleanText(item.title, 160)
  if (!id || !title) return null

  const pickupSlots = Array.isArray(item.pickupSlots)
    ? item.pickupSlots
      .slice(0, 5)
      .map(slot => ({
        date: cleanText(slot?.date, 10),
        time: cleanText(slot?.time, 40),
      }))
      .filter(slot => /^\d{4}-\d{2}-\d{2}$/.test(slot.date) && slot.time)
    : []

  const preferredDateValue = cleanText(item.preferredDate || pickupSlots[0]?.date, 10)

  const slotAllowance = item.slotAllowance && typeof item.slotAllowance === 'object'
    ? {
        maximum: cleanCount(item.slotAllowance.maximum),
        used: cleanCount(item.slotAllowance.used),
        selected: cleanCount(item.slotAllowance.selected ?? pickupSlots.length),
        remaining: cleanCount(item.slotAllowance.remaining),
        remainingAfterSelection: cleanCount(item.slotAllowance.remainingAfterSelection),
      }
    : null

  const chargeAmount = Number(item.chargeAmount)

  return {
    id,
    title,
    price: cleanText(item.price, 40),
    chargeAmount: Number.isFinite(chargeAmount) && chargeAmount >= 0 ? chargeAmount : undefined,
    continuation: item.continuation === true,
    enrollmentId: cleanText(item.enrollmentId, 160),
    holdExpired: item.holdExpired === true,
    slotAllowance,
    city: cleanText(item.city, 100),
    cityDistance: cleanText(item.cityDistance, 20),
    priceBasis: cleanText(item.priceBasis, 20),
    nearPrice: cleanText(item.nearPrice, 40),
    longPrice: cleanText(item.longPrice, 40),
    preferredDate: /^\d{4}-\d{2}-\d{2}$/.test(preferredDateValue) ? preferredDateValue : '',
    pickupTime: cleanText(item.pickupTime || pickupSlots[0]?.time, 40),
    pickupSlots,
  }
}

export const readGuestCart = () => {
  if (!storageAvailable()) return []
  try {
    const value = JSON.parse(readStorage(GUEST_CART_KEY) || '[]')
    if (!Array.isArray(value)) return []
    return value.map(normalizeCartItem).filter(Boolean).slice(0, 20)
  } catch {
    return []
  }
}

export const writeGuestCart = (items) => {
  const safeItems = Array.isArray(items)
    ? items.map(normalizeCartItem).filter(Boolean).slice(0, 20)
    : []

  writeStorage(GUEST_CART_KEY, safeItems.length ? JSON.stringify(safeItems) : null)
  return safeItems
}

export const saveBookingReturn = (path = '/cart') => {
  if (!storageAvailable()) return
  const safePath = path === '/pricing' || path.startsWith('/pricing?') ? path : '/cart'
  writeStorage(BOOKING_RETURN_KEY, safePath)
}

export const consumeBookingReturn = () => {
  if (!storageAvailable()) return ''
  const path = readStorage(BOOKING_RETURN_KEY) || ''
  writeStorage(BOOKING_RETURN_KEY, null)
  return path === '/cart' || path === '/pricing' || path.startsWith('/pricing?') ? path : ''
}
