import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api'
import Pricing from '../components/Pricing'
import { usePageMeta } from '../usePageMeta'

const GOLD = '#FDBC01'
const GOLD_DEEP = '#C8960C'
const GOLD_BRIGHT = '#FFD54F'
const SKY_BLUE = '#0145A8'
const DARK = '#0a1628'

export default function PricingPage() {
  usePageMeta(
    'Packages & Pricing — A Precision Driving School San Ramon CA',
    'Compare driving school packages: online drivers ed, 2, 6 and 10-hour behind-the-wheel training, DMV drive test car rental and freeway focused courses. 99% pass rate, free pickup & drop.'
  )
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(null)
  const [selectedTier, setSelectedTier] = useState(null)
  const [error, setError] = useState('')
  const [tiers, setTiers] = useState(null)

  useEffect(() => {
    api.getPricing().then(d => { if (Array.isArray(d) && d.length) setTiers(d) }).catch(() => {})
  }, [])

  const handleChoose = (tier) => {
    if (!user) {
      navigate('/login')
      return
    }
    setSelectedTier(tier)
    setStep('confirm')
    setError('')
  }

  const handleConfirm = async () => {
    setStep('loading')
    try {
      const course = {
        id: selectedTier.id,
        title: selectedTier.planName,
        price: selectedTier.planPrice,
        status: 'Enrolled',
        progress: 0,
        enrolledAt: new Date().toISOString(),
        email: user.email,
      }
      const result = await api.addCourse(user.uid, course)
      if (result.ok) {
        if (result.duplicate) {
          setError('You are already enrolled in this course.')
          setStep('confirm')
          return
        }
        const payment = {
          date: new Date().toISOString().split('T')[0],
          ref: `INV-${Date.now().toString(36).toUpperCase()}`,
          email: user.email,
          item: selectedTier.planName,
          amount: selectedTier.planPrice,
          status: 'Pending',
        }
        await api.addPayment(user.uid, payment)
        setStep('success')
      } else {
        setError('Enrollment failed. Please try again.')
        setStep('confirm')
      }
    } catch {
      setError('Enrollment failed. Please try again.')
      setStep('confirm')
    }
  }

  const handleClose = () => {
    setStep(null)
    setSelectedTier(null)
    setError('')
  }

  const backdropStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10,22,40,0.6)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    animation: 'modalFadeIn 0.3s ease',
  }

  const modalStyle = {
    background: '#fff',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
    maxWidth: '460px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1)',
    animation: 'modalSlideUp 0.4s cubic-bezier(0.22,1,0.36,1)',
    position: 'relative',
  }

  return (
    <div style={{ paddingTop: '12rem', paddingBottom: '4rem' }}>
      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideUp { from { opacity: 0; transform: translateY(40px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes checkmarkDraw { 0% { stroke-dashoffset: 50; } 100% { stroke-dashoffset: 0; } }
        @keyframes checkmarkCircle { 0% { stroke-dashoffset: 166; } 100% { stroke-dashoffset: 0; } }
        @keyframes successPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spinLoader { to { transform: rotate(360deg); } }
        @keyframes pulseRing { 0% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(2.2); opacity: 0; } }
      `}</style>

      <Pricing light onEnroll={handleChoose} tiers={tiers} />

      {step === 'confirm' && selectedTier && (
        <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
          <div style={modalStyle}>
            <div style={{
              background: `linear-gradient(135deg, ${DARK} 0%, #1a0a3e 50%, ${DARK} 100%)`,
              borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
              padding: '2rem 2rem 1.5rem',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(253,188,1,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(253,188,1,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
              <button onClick={handleClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', transition: 'background 0.2s', zIndex: 2 }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>&times;</button>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ width: '16px', height: '2px', background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD_DEEP, fontWeight: 700 }}>Confirm Enrollment</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                  {selectedTier.planName}
                </h2>
              </div>
            </div>

            <div style={{ padding: '1.5rem 2rem 2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>Price</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: GOLD, fontWeight: 800, lineHeight: 1 }}>{selectedTier.planPrice}</span>
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', display: 'block', marginBottom: '0.2rem', fontWeight: 600 }}>Price Two</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: DARK, fontWeight: 800, lineHeight: 1 }}>{selectedTier.planPriceTwo}</span>
                </div>
              </div>

              <div style={{ width: '100%', height: '1px', background: '#E2EBF5', marginBottom: '1.25rem' }} />

              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8899aa', fontWeight: 700, marginBottom: '0.75rem' }}>What's included</p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', listStyle: 'none', padding: 0, margin: '0 0 1.75rem 0' }}>
                {selectedTier.options.map((opt, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                    {opt.permission === 'Included' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SKY_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      color: opt.permission === 'Included' ? '#4a5568' : '#94A3B8',
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                    }}>
                      {opt.text || opt.permission}
                    </span>
                  </li>
                ))}
              </ul>

              {error && (
                <div style={{ padding: '0.6rem 0.8rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: '#DC2626' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handleClose} style={{
                  flex: 1, padding: '0.85rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: '#8899aa', background: 'transparent', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s',
                }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E0'; e.currentTarget.style.color = DARK }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2EBF5'; e.currentTarget.style.color = '#8899aa' }}>Cancel</button>
                <button onClick={handleConfirm} style={{
                  flex: 2, padding: '0.85rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: DARK, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(253,188,1,0.25)',
                }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(253,188,1,0.4)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(253,188,1,0.25)' }}>
                  Confirm Enrollment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div style={backdropStyle}>
          <div style={{ ...modalStyle, maxWidth: '360px', padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', border: `3px solid #E2EBF5`, borderTopColor: SKY_BLUE, borderRadius: '50%', animation: 'spinLoader 0.8s linear infinite', margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: DARK, fontWeight: 700, margin: '0 0 0.4rem' }}>Processing Enrollment</h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: '#8899aa', margin: 0 }}>Setting up your course access...</p>
          </div>
        </div>
      )}

      {step === 'success' && selectedTier && (
        <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}>
          <div style={modalStyle}>
            <div style={{ padding: '2.5rem 2rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', animation: 'pulseRing 1.5s ease-out infinite' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(34,197,94,0.05)', animation: 'pulseRing 1.5s ease-out 0.5s infinite' }} />
                <svg width="80" height="80" viewBox="0 0 80 80" style={{ animation: 'successPop 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
                  <circle cx="40" cy="40" r="36" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeDasharray="166" strokeDashoffset="0" style={{ animation: 'checkmarkCircle 0.6s ease-in-out 0.3s both' }} />
                  <path d="M24 40 L34 50 L56 30" fill="none" stroke="#22C55E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50" strokeDashoffset="0" style={{ animation: 'checkmarkDraw 0.4s ease-in-out 0.7s both' }} />
                </svg>
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: DARK, fontWeight: 800, margin: '0 0 0.4rem' }}>Enrollment Successful!</h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: '#8899aa', margin: '0 0 0.3rem' }}>
                You've been enrolled in
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: SKY_BLUE, fontWeight: 700, margin: '0 0 1.5rem' }}>
                {selectedTier.planName} ({selectedTier.planPrice})
              </p>

              <div style={{ width: '100%', height: '1px', background: '#E2EBF5', marginBottom: '1.5rem' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button onClick={() => { handleClose(); navigate('/dashboard') }} style={{
                  width: '100%', padding: '0.85rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, color: DARK, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_BRIGHT})`, border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 16px rgba(253,188,1,0.25)',
                }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(253,188,1,0.4)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(253,188,1,0.25)' }}>
                  Go to Dashboard
                </button>
                <button onClick={handleClose} style={{
                  width: '100%', padding: '0.75rem 1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, color: '#8899aa', background: 'transparent', border: '1.5px solid #E2EBF5', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s',
                }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = SKY_BLUE; e.currentTarget.style.color = SKY_BLUE }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2EBF5'; e.currentTarget.style.color = '#8899aa' }}>
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
