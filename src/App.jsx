import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import AboutPage from './pages/AboutPage'
import PricingPage from './pages/PricingPage'
import ContactPage from './pages/ContactPage'
import RegisterPage from './pages/RegisterPage'
import SchedulePage from './pages/SchedulePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CartPage from './pages/CartPage'
import AdminPage from './pages/AdminPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminSetupPage from './pages/AdminSetupPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1628' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(253,188,1,0.2)', borderTopColor: '#FDBC01', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1628' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(253,188,1,0.2)', borderTopColor: '#FDBC01', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  if (!user) return <Navigate to="/admin/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function LayoutSetup({ children }) {
  const location = useLocation()
  const observerRef = useRef(null)

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      const timeout = setTimeout(() => {
        const el = document.getElementById(id)
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 180
          window.scrollTo({ top, behavior: 'smooth' })
        } else {
          window.scrollTo(0, 0)
        }
      }, 150)
      return () => clearTimeout(timeout)
    }
    window.scrollTo(0, 0)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

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
    observerRef.current = observer

    const discover = () => {
      document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el))
    }

    discover()

    const mutator = new MutationObserver(discover)
    mutator.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutator.disconnect()
    }
  }, [])

  return children
}

function AppRoutes() {
  const location = useLocation()
  const hideShell = location.pathname === '/dashboard' || location.pathname === '/admin' || location.pathname === '/admin/login' || location.pathname === '/admin/setup'

  return (
    <>
      {!hideShell && <Nav />}
      <main style={{ minHeight: hideShell ? 'auto' : '100vh', display: 'flex', flexDirection: 'column' }}>
        <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/setup" element={<AdminSetupPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              } />
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
          {!hideShell && <Footer />}
        </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <LayoutSetup>
            <AppRoutes />
          </LayoutSetup>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
