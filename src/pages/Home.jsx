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

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <TrustBar />
      <TheRoute />
      <Programs />
      <Pricing />
      <Awards />
      <Testimonials />
      <ServiceAreas />
      <CTABanner />
    </>
  )
}
