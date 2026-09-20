import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
// A named Firebase app has its own persisted Auth storage key. Keeping the
// administrator session here prevents a student sign-in in another tab from
// replacing the admin session (and vice versa).
const adminApp = initializeApp(firebaseConfig, 'admin-session')
export const auth = getAuth(app)
export const adminAuth = getAuth(adminApp)
export const googleProvider = new GoogleAuthProvider()
