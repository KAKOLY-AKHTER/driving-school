import { useEffect } from 'react'

const SITE_URL = 'https://www.aprecisiondrivingschool.com'
const DEFAULT_IMAGE = `${SITE_URL}/driving-logo.png`
const PRIVATE_PATH_PREFIXES = ['/dashboard', '/admin', '/cart', '/login', '/register', '/booking/register']

function setMeta(selector, attribute, value) {
  let element = document.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    const match = selector.match(/meta\[(name|property)="([^"]+)"\]/)
    if (match) element.setAttribute(match[1], match[2])
    document.head.appendChild(element)
  }
  element.setAttribute(attribute, value)
}

export function usePageMeta(title, description, options = {}) {
  useEffect(() => {
    const pathname = window.location.pathname || '/'
    const noIndex = Boolean(options.noIndex) || PRIVATE_PATH_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
    const canonicalUrl = `${SITE_URL}${pathname === '/' ? '/' : pathname}`
    const image = options.image || DEFAULT_IMAGE

    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[name="robots"]', 'content', noIndex ? 'noindex, nofollow' : 'index, follow')
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', canonicalUrl)
    setMeta('meta[property="og:image"]', 'content', image)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[name="twitter:image"]', 'content', image)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl
  }, [title, description, options.image, options.noIndex])
}
