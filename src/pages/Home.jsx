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
import { usePageMeta } from '../usePageMeta'

export default function Home() {
  usePageMeta(
    'A Precision Driving School — San Ramon, CA | DMV-Licensed Driving Lessons',
    'California\'s premier DMV-licensed driving school serving San Ramon, Dublin, Danville, Pleasanton since 1989. 99% DMV pass rate. Teen & adult lessons, online drivers ed, free pickup & drop.'
  )
  return (
    <>
      <Hero />
      <About />
      <TrustBar />
      <TheRoute />
     
      <Pricing />
       <Programs />
      <Awards />
      <Testimonials />
      <ServiceAreas />
      <CTABanner />
    </>
  )
}
