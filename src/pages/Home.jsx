import Hero from '../components/Hero'
import About from '../components/About'
import TrustBar from '../components/TrustBar'
import TheRoute from '../components/TheRoute'
import Programs from '../components/Programs'
import Pricing from '../components/Pricing'
import Awards from '../components/Awards'
import Testimonials from '../components/Testimonials'
import ServiceAreas from '../components/ServiceAreas'
import CTABanner from '../components/CTABanner'
import HomeBlogs from '../components/HomeBlogs'
import { usePageMeta } from '../usePageMeta'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Home() {
  const [pricing, setPricing] = useState([])
  const [pricingLoading, setPricingLoading] = useState(true)
  const [pricingError, setPricingError] = useState('')
  const [pricingRequest, setPricingRequest] = useState(0)

  usePageMeta(
    'A Precision Driving School — San Ramon, CA | DMV-Licensed Driving Lessons',
    'California\'s premier DMV-licensed driving school serving San Ramon, Dublin, Danville, Pleasanton since 1989. 99% DMV pass rate. Teen & adult lessons, online drivers ed, free pickup & drop.'
  )
  useEffect(() => {
    let active = true
    setPricingLoading(true)
    setPricingError('')
    api.getPricing()
      .then(data => {
        if (!active) return
        if (!Array.isArray(data) || !data.length) throw new Error('No pricing plans are currently available.')
        setPricing(data)
      })
      .catch(error => {
        if (active) setPricingError(error?.message || 'Pricing could not be loaded.')
      })
      .finally(() => {
        if (active) setPricingLoading(false)
      })
    return () => { active = false }
  }, [pricingRequest])

  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      <Hero />
      {pricingLoading || pricingError ? (
        <section id="pricing" className="home-pricing-state section-pad" aria-labelledby="home-pricing-state-title">
          <div className="container" style={{ textAlign: 'center' }}>
            <p className="home-pricing-eyebrow">Pricing</p>
            <h2 id="home-pricing-state-title">
              {pricingLoading ? 'Loading current packages…' : 'Current packages are temporarily unavailable.'}
            </h2>
            {pricingLoading ? (
              <div className="home-pricing-skeletons" role="status" aria-live="polite">
                <span className="sr-only">Loading current pricing packages.</span>
                {[0, 1, 2].map(item => <div className="home-pricing-skeleton" key={item} aria-hidden="true" />)}
              </div>
            ) : (
              <>
                <p role="alert">{pricingError} Please try again.</p>
                <button type="button" className="home-retry-button" onClick={() => setPricingRequest(value => value + 1)}>
                  Retry pricing
                </button>
              </>
            )}
          </div>
        </section>
      ) : <Pricing light tiers={pricing} />}
      <About />
      <TrustBar />
      <TheRoute />
      <Programs />
      <Awards />
      <Testimonials />
      <HomeBlogs />
      <ServiceAreas />
      <CTABanner />
      <Link className="home-mobile-book" to="/schedule" aria-label="Book a driving lesson">Book a Driving Lesson</Link>
    </div>
  )
}
