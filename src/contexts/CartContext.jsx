import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { api } from '../api'
import { normalizeCartItem, readGuestCart, writeGuestCart } from '../utils/bookingStorage'

const CartContext = createContext(null)

export function useCart() {
  return useContext(CartContext)
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState(() => readGuestCart())
  const [loading, setLoading] = useState(false)
  const [syncError, setSyncError] = useState('')

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems(readGuestCart())
      setSyncError('')
      return
    }
    try {
      setLoading(true)
      setSyncError('')
      const guestItems = readGuestCart()
      let serverItems = await api.getCart(user.uid)
      serverItems = Array.isArray(serverItems) ? serverItems.map(normalizeCartItem).filter(Boolean) : []

      const unsynced = []
      for (const guestItem of guestItems) {
        try {
          const result = await api.addToCart(user.uid, guestItem)
          if (result?.ok) {
            serverItems = Array.isArray(result.items)
              ? result.items.map(normalizeCartItem).filter(Boolean)
              : serverItems
          } else {
            unsynced.push(guestItem)
          }
        } catch {
          unsynced.push(guestItem)
        }
      }

      writeGuestCart(unsynced)
      setItems(serverItems)
      if (unsynced.length) {
        setSyncError('Some selected packages could not be restored. Please review availability and try again.')
      }
    } catch {
      setItems(readGuestCart())
      setSyncError('We could not sync your cart. Your selection is saved on this device; please try again.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addToCart = async (course) => {
    const safeCourse = normalizeCartItem(course)
    if (!safeCourse) return { ok: false, duplicate: false, error: 'Invalid package details.' }
    if (!user) {
      const guestItems = readGuestCart()
      const duplicate = guestItems.some(item => String(item.id) === String(safeCourse.id))
      const nextItems = duplicate
        ? guestItems.map(item => String(item.id) === String(safeCourse.id) ? safeCourse : item)
        : [...guestItems, safeCourse]
      const storedItems = writeGuestCart(nextItems)
      setItems(storedItems)
      return { ok: true, duplicate, items: storedItems, guest: true }
    }
    const result = await api.addToCart(user.uid, safeCourse)
    if (result.ok) {
      setItems(result.items || [])
    }
    return result
  }

  const removeFromCart = async (courseId) => {
    if (!user) {
      const nextItems = writeGuestCart(readGuestCart().filter(item => String(item.id) !== String(courseId)))
      setItems(nextItems)
      return { ok: true, items: nextItems, guest: true }
    }
    const result = await api.removeFromCart(user.uid, courseId)
    if (result.ok) {
      setItems(result.items || [])
    }
    return result
  }

  const enrollAll = async () => {
    if (!user) return { ok: false, enrolled: 0 }
    const result = await api.enrollAllCart(user.uid)
    if (result.ok) {
      setItems([])
    }
    return result
  }

  const value = {
    items,
    count: items.length,
    loading,
    syncError,
    refreshCart,
    addToCart,
    removeFromCart,
    enrollAll,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}
