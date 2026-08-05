import { useEffect } from 'react'

const SITE_URL = 'https://www.aprecisiondrivingschool.com'
const DEFAULT_IMAGE = `${SITE_URL}/driving-logo.png`

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

export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title
    const canonicalUrl = `${SITE_URL}${window.location.pathname === '/' ? '/' : window.location.pathname}`
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', canonicalUrl)
    setMeta('meta[property="og:image"]', 'content', DEFAULT_IMAGE)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[name="twitter:image"]', 'content', DEFAULT_IMAGE)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl
  }, [title, description])
}
