import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { CartItem } from './types'

interface CartContextValue {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (bookId: string) => void
  updateQuantity: (bookId: string, qty: number) => void
  clearCart: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'kitoblar_cart'

export function CartProvider({ children }: { children: ReactNode }) {
  // Read localStorage synchronously as the initial state, instead of in a
  // mount effect. Loading it in an effect raced with the save-on-change
  // effect below (most visibly under React.StrictMode's dev double-effect
  // invocation): the save effect could fire with the stale empty closure
  // and overwrite the just-loaded cart before the load's setItems landed,
  // which is why a hard refresh could wipe the cart.
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore (e.g. storage disabled/full)
    }
  }, [items])

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.book_id === item.book_id)
      if (existing) {
        return prev.map(i =>
          i.book_id === item.book_id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeItem = (bookId: string) => {
    setItems(prev => prev.filter(i => i.book_id !== bookId))
  }

  const updateQuantity = (bookId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(bookId)
      return
    }
    setItems(prev => prev.map(i => i.book_id === bookId ? { ...i, quantity: qty } : i))
  }

  const clearCart = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
