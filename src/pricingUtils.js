export const priceNumber = (value) => {
  const amount = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(amount) && amount >= 0 ? amount : 0
}

export const locationPlanPrice = (tier, distance = 'Near') => {
  if (!tier) return ''
  return String(distance).toLowerCase() === 'long'
    ? (tier.planPriceTwo || tier.planPrice || '')
    : (tier.planPrice || '')
}

export const locationPriceSummary = (tier) => ({
  near: locationPlanPrice(tier, 'Near'),
  long: locationPlanPrice(tier, 'Long'),
})
