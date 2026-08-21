import { lazy, Suspense, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Nav from './components/Nav'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import { usePageMeta } from './usePageMeta'
const Home = lazy(() => import('./pages/Home'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const BookingRegistrationPage = lazy(() => import('./pages/BookingRegistrationPage'))
const PaymentPage = lazy(() => import('./pages/PaymentPage'))
const SchedulePage = lazy(() => import('./pages/SchedulePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'))
const AdminSetupPage = lazy(() => import('./pages/AdminSetupPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const OnlineCoursePage = lazy(() => import('./pages/OnlineCoursePage'))
const OnlineCourseDetailsPage = lazy(() => import('./pages/OnlineCourseDetailsPage'))
const OnlineCoursePricingPage = lazy(() => import('./pages/OnlineCoursePricingPage'))
const OnlineCoursePermitPage = lazy(() => import('./pages/OnlineCoursePermitPage'))
const OnlineCourseDriverLicensePage = lazy(() => import('./pages/OnlineCourseDriverLicensePage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))

function PageLoader() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading page" style={{ minHeight: '55vh', display: 'grid', placeItems: 'center', background: '#ffffff' }}>
      <div style={{ width: '42px', height: '42px', border: '3px solid rgba(1,69,168,0.15)', borderTopColor: '#0145A8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function NotFoundPage() {
  usePageMeta('Page Not Found — A Precision Driving School', 'The requested page could not be found.', { noIndex: true })
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(4rem, 10vw, 8rem)', color: 'var(--color-gold)', lineHeight: 1, marginBottom: '1rem' }}>404</h1>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--color-ink)', marginBottom: '0.5rem' }}>Page not found</p>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: '2rem' }}>The page you are looking for does not exist.</p>
      <Link to="/" className="btn-gold">Back to Home</Link>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1628' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(253,188,1,0.2)', borderTopColor: '#FDBC01', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
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
      {!hideShell && <a className="skip-link" href="#main-content">Skip to main content</a>}
      {!hideShell && <Nav />}
      <main id="main-content" tabIndex="-1" style={{ minHeight: hideShell ? 'auto' : '100vh', display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={<PageLoader />}>
        <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/online-drivers-ed" element={<OnlineCoursePage />} />
              <Route path="/online-drivers-ed/details" element={<OnlineCourseDetailsPage />} />
              <Route path="/online-drivers-ed/pricing" element={<OnlineCoursePricingPage />} />
              <Route path="/online-drivers-ed/permit" element={<OnlineCoursePermitPage />} />
              <Route path="/online-drivers-ed/driver-license" element={<OnlineCourseDriverLicensePage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/booking/register" element={<BookingRegistrationPage />} />
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
              <Route path="/payment" element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/setup" element={<AdminSetupPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              } />
              <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
          </main>
          {!hideShell && <Footer />}
        </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <CartProvider>
            <LayoutSetup>
              <AppRoutes />
            </LayoutSetup>
          </CartProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
