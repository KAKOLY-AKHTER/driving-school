import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('Application error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main role="alert" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#f8fafc', color: '#0a1628' }}>
        <div style={{ width: 'min(100%, 560px)', padding: '2rem', border: '1px solid #dbe5f0', borderRadius: '18px', background: '#fff', boxShadow: '0 20px 60px rgba(10,22,40,.12)', textAlign: 'center' }}>
          <p style={{ margin: '0 0 .5rem', color: '#0145a8', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', fontSize: '.75rem' }}>A Precision Driving School</p>
          <h1 style={{ margin: '0 0 .75rem', fontFamily: 'var(--font-display)', fontSize: 'clamp(1.7rem,5vw,2.4rem)' }}>We could not load this page</h1>
          <p style={{ margin: '0 auto 1.5rem', maxWidth: '44ch', color: '#475569' }}>Your information is safe. Refresh the page to try again, or return to the home page.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
            <button type="button" className="btn-gold" style={{ color: '#0a1628', textShadow: 'none', cursor: 'pointer' }} onClick={() => window.location.reload()}>Refresh Page</button>
            <a className="btn-ghost" style={{ color: '#0145a8', borderColor: '#0145a8', textShadow: 'none' }} href="/">Back to Home</a>
          </div>
        </div>
      </main>
    )
  }
}
