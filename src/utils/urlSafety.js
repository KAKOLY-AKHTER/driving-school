const HTTP_PROTOCOLS = new Set(['http:', 'https:'])
const GOOGLE_MAP_HOSTS = new Set(['google.com', 'www.google.com', 'maps.google.com'])

export function safeHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null

  try {
    const url = new URL(value.trim())
    return HTTP_PROTOCOLS.has(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

export function safeGoogleMapsUrl(value) {
  const safeUrl = safeHttpUrl(value)
  if (!safeUrl) return null

  try {
    const url = new URL(safeUrl)
    return GOOGLE_MAP_HOSTS.has(url.hostname.toLowerCase()) ? safeUrl : null
  } catch {
    return null
  }
}
