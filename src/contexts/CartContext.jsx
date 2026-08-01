import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { api } from '../api'

const CartContext = createContext(null)

export function useCart() {
  return useContext(CartContext)
}

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([])
      return
    }
    try {
      setLoading(true)
      const data = await api.getCart(user.uid)
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setItems([])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addToCart = async (course) => {
    if (!user) return { ok: false, duplicate: false }
    const result = await api.addToCart(user.uid, course)
    if (result.ok) {
      setItems(result.items || [])
    }
    return result
  }

  const removeFromCart = async (courseId) => {
    if (!user) return { ok: false }
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
