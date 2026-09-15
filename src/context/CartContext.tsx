'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ProductItem } from '@/lib/types'

export interface CartItem {
  id: string // compound id: `${productId}-${notes}`
  productId: string
  name: string
  price: number
  quantity: number
  notes?: string
  imageUrl?: string | null
  emoji?: string | null
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: ProductItem, quantity?: number, notes?: string) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  totalCount: number
  totalPrice: number
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  toastMessage: string | null
  showToast: (msg: string) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'qr_cafe_cart_v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (stored) {
          setItems(JSON.parse(stored))
        }
      } catch (e) {
        console.error('Failed to load cart from storage', e)
      } finally {
        setIsHydrated(true)
      }
    })
  }, [])

  // Persist cart to localStorage on changes
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.error('Failed to save cart to storage', e)
    }
  }, [items, isHydrated])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current))
    }, 2500)
  }

  const addItem = (product: ProductItem, quantity = 1, notes = '') => {
    const trimmedNotes = notes.trim()
    const compoundId = `${product.id}-${trimmedNotes}`
    const priceNum =
      typeof product.price === 'number'
        ? product.price
        : parseFloat(String(product.price)) || 0

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === compoundId)
      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex].quantity += quantity
        return updated
      }
      return [
        ...prev,
        {
          id: compoundId,
          productId: product.id,
          name: product.name,
          price: priceNum,
          quantity,
          notes: trimmedNotes || undefined,
          imageUrl: product.imageUrl || null,
          emoji: product.category?.emoji || '🍽️',
        },
      ]
    })

    showToast(`Added ${quantity}x "${product.name}" to cart`)
  }

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    showToast('Item removed from cart')
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    setItems([])
    try {
      localStorage.removeItem(CART_STORAGE_KEY)
    } catch (e) {
      console.error(e)
    }
  }

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)
  const toggleCart = () => setIsCartOpen((prev) => !prev)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        totalPrice,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
