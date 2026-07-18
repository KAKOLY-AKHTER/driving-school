import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import PricingPage from './pages/PricingPage'
import ContactPage from './pages/ContactPage'
import RegisterPage from './pages/RegisterPage'
import SchedulePage from './pages/SchedulePage'

// Component to handle scroll reset on route change and global scroll reveal
function LayoutSetup({ children }) {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const elements = document.querySelectorAll('.reveal')
    elements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [location.pathname])

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <LayoutSetup>
        <Nav />
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="*" element={
              <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 2rem' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(4rem, 10vw, 8rem)', color: 'var(--color-gold)', lineHeight: 1, marginBottom: '1rem' }}>404</h1>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-paper)', marginBottom: '0.5rem' }}>Page not found</p>
                <p style={{ color: 'var(--color-paper-muted)', marginBottom: '2rem' }}>The page you are looking for does not exist.</p>
                <a href="/" className="btn-gold">Back to Home</a>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </LayoutSetup>
    </BrowserRouter>
  )
}