import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, reload } from 'firebase/auth'
import { adminAuth } from '../firebase'
import { adminApi } from '../api'

const AdminAuthContext = createContext(null)

export function useAdminAuth() {
  return useContext(AdminAuthContext)
}

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authRevision, setAuthRevision] = useState(0)

  const refreshAuthUser = useCallback(async () => {
    const currentUser = adminAuth.currentUser
    if (!currentUser) {
      setUser(null)
      return null
    }
    await reload(currentUser)
    await currentUser.getIdToken(true)
    setUser(currentUser)
    setAuthRevision(revision => revision + 1)
    return currentUser
  }, [])

  const refreshProfile = useCallback(async (currentUser = adminAuth.currentUser) => {
    if (!currentUser) {
      setIsAdmin(false)
      return null
    }
    try {
      const profile = await adminApi.getUser(currentUser.uid)
      setIsAdmin(Boolean(profile?.isAdmin))
      return profile
    } catch (error) {
      setIsAdmin(false)
      throw error
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuth, async (currentUser) => {
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
    return unsubscribe
  }, [refreshProfile])

  return (
    <AdminAuthContext.Provider value={{ user, loading, isAdmin, refreshProfile, refreshAuthUser, authRevision }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
