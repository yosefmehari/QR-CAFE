'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Plus, Minus, Check, Sparkles, ExternalLink } from 'lucide-react'
import type { ProductItem } from '@/lib/types'

import { useCart } from '@/context/CartContext'

interface ProductModalProps {
  product: ProductItem | null
  onClose: () => void
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [specialNote, setSpecialNote] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)

  const [prevProductId, setPrevProductId] = useState(product?.id)

  // Reset local state whenever a new product is selected
  if (product && product.id !== prevProductId) {
    setPrevProductId(product.id)
    setQuantity(1)
    setSpecialNote('')
    setShowConfirmation(false)
  }

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!product) return null

  const unitPrice =
    typeof product.price === 'number'
      ? product.price
      : parseFloat(String(product.price)) || 0

  const totalPrice = (unitPrice * quantity).toFixed(2)

  const handleAddToCart = () => {
    addItem(product, quantity, specialNote)
    setShowConfirmation(true)
    setTimeout(() => {
      setShowConfirmation(false)
      onClose()
    }, 600)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Banner Header */}
        <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-red-500/10 flex flex-col items-center justify-center relative p-6">
          <span className="text-6xl sm:text-7xl filter drop-shadow-md select-none">
            {product.category?.emoji || '🍽️'}
          </span>
          {product.category && (
            <div className="absolute bottom-3 left-4 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-zinc-950/80 backdrop-blur-sm text-zinc-800 dark:text-zinc-200">
              {product.category.name}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-zinc-50">
                {product.name}
              </h2>
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400 shrink-0">
                ${unitPrice.toFixed(2)}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {product.description ||
                'Handcrafted to order with high quality local produce and ingredients.'}
            </p>
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
              <Sparkles className="w-3.5 h-3.5" /> Freshly Prepared
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              Dine-In Ready
            </span>
            <Link
              href={`/products/${product.id}`}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-zinc-500 hover:text-amber-600 hover:underline transition-colors"
            >
              <span>Full Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Special Instructions Input */}
          <div>
            <label
              htmlFor="special-instructions"
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5"
            >
              Kitchen Notes / Requests (Optional)
            </label>
            <input
              id="special-instructions"
              type="text"
              placeholder="e.g. Extra sauce, no onions, gluten allergy..."
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Quantity
            </span>
            <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/80 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Button */}
        <div className="p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.isAvailable || showConfirmation}
            className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              showConfirmation
                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                : 'bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white shadow-amber-500/25'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {showConfirmation ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Selected {quantity} Item(s)</span>
              </>
            ) : (
              <>
                <span>Select for Order</span>
                <span>•</span>
                <span>${totalPrice}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
