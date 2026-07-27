import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCixaJ95E5AjFl4psif2MANZtzHKg1oeuo',
  authDomain: 'driving-school-695ba.firebaseapp.com',
  projectId: 'driving-school-695ba',
  storageBucket: 'driving-school-695ba.firebasestorage.app',
  messagingSenderId: '137067756107',
  appId: '1:137067756107:web:6202a261bb8ead29fdabce',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
