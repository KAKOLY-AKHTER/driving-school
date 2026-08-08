import { createContext, useCallback, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'
import { api } from '../api'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const refreshProfile = useCallback(async (currentUser = auth.currentUser) => {
    if (!currentUser) {
      setIsAdmin(false)
      return null
    }

    try {
      const profile = await api.getUser(currentUser.uid)
      setIsAdmin(Boolean(profile?.isAdmin))
      return profile
    } catch (error) {
      setIsAdmin(false)
      throw error
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          await refreshProfile(currentUser)
        } catch {
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [refreshProfile])

  const value = { user, loading, isAdmin, refreshProfile }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
