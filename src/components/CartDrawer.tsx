'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import {
  X,
  Plus,
  Minus,
  Trash2,
  UtensilsCrossed,
  Clock,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

type PaymentMethodType = 'CARD' | 'APPLE_PAY' | 'GOOGLE_PAY' | 'CASH'

interface CartDrawerProps {
  currentTableNumber?: number | null
}

export default function CartDrawer({ currentTableNumber }: CartDrawerProps = {}) {
  const router = useRouter()
  const {
    items,
    isCartOpen,
    totalCount,
    totalPrice,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart()

  const [tableInput, setTableInput] = useState<number | ''>(currentTableNumber || '')
  const [orderNotes, setOrderNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [paymentPhase, setPaymentPhase] = useState<string | null>(null)

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CARD')
  const [cardholderName, setCardholderName] = useState('Alex Morgan')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')

  // Sync internal tableInput with context
  useEffect(() => {
    if (currentTableNumber) {
      setTableInput(currentTableNumber)
    }
  }, [currentTableNumber])

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isCartOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) closeCart()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCartOpen, closeCart])

  if (!isCartOpen) return null

  const fillDemoCard = () => {
    setCardholderName('Alex Morgan')
    setCardNumber('4242 4242 4242 4242')
    setCardExpiry('12/28')
    setCardCvc('123')
  }

  const handlePlaceOrder = async () => {
    setErrorMessage(null)

    const finalTable = typeof tableInput === 'number' ? tableInput : currentTableNumber

    if (!finalTable || finalTable <= 0) {
      setErrorMessage('Please enter your Table Number to proceed with order.')
      return
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add items to order.')
      return
    }

    if (paymentMethod === 'CARD' && cardNumber.replace(/\s+/g, '').length < 12) {
      setErrorMessage('Please enter a valid card number (or click "⚡ Use Demo Card").')
      return
    }

    setIsSubmitting(true)

    // Simulate payment authorization sequence
    if (paymentMethod === 'CARD' || paymentMethod === 'APPLE_PAY' || paymentMethod === 'GOOGLE_PAY') {
      setPaymentPhase('Authorizing Payment...')
      await new Promise((r) => setTimeout(r, 600))
      setPaymentPhase('Payment Approved!')
      await new Promise((r) => setTimeout(r, 400))
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: finalTable,
          notes: orderNotes.trim() || undefined,
          paymentMethod,
          cardDetails:
            paymentMethod === 'CARD'
              ? {
                  cardholderName,
                  cardNumber,
                  expiry: cardExpiry,
                  cvc: cardCvc,
                }
              : undefined,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit order')
      }

      // Order placed successfully!
      clearCart()
      closeCart()
      router.push(`/order/${data.orderId}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
      setPaymentPhase(null)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={closeCart}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-zinc-950 h-full flex flex-col shadow-2xl border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-300 overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                Your Order Cart
              </h2>
              <p className="text-xs text-zinc-500">
                {totalCount} item{totalCount === 1 ? '' : 's'} selected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeCart}
            className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Table Verification Bar */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Dine-In Table Number
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500 font-medium">Table #</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={tableInput}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : ''
                    setTableInput(val)
                  }}
                  placeholder="e.g. 3"
                  className="w-16 px-2 py-1 text-center font-bold text-sm bg-white dark:bg-zinc-900 border border-amber-400 rounded-lg focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1.5">
              The kitchen delivers directly to this table.
            </p>
          </div>

          {/* Items List or Empty State */}
          {items.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8 stroke-1" />
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Your cart is empty
              </p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Discover our delicious dishes and tap &quot;Add to Cart&quot; to begin your order.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Selected Items ({totalCount})
                </span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {items.map((item) => {
                const lineTotal = (item.price * item.quantity).toFixed(2)

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3 relative group"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-14 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-2xl select-none shrink-0">
                      {item.emoji || '🍽️'}
                    </div>

                    {/* Item Information */}
                    <div className="flex-1 min-w-0 pr-6">
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                        ${item.price.toFixed(2)} each
                      </p>

                      {/* Special instructions preview */}
                      {item.notes && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 italic line-clamp-1">
                          &quot;{item.notes}&quot;
                        </p>
                      )}

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="inline-flex items-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-md cursor-pointer transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="w-7 text-center font-bold text-xs text-zinc-900 dark:text-zinc-100">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-md cursor-pointer transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remove Item Button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="absolute top-3 right-3 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Line Total Price */}
                    <div className="absolute bottom-3 right-3 text-right">
                      <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                        ${lineTotal}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Special Order Notes */}
          {items.length > 0 && (
            <div className="space-y-1.5">
              <label
                htmlFor="order-notes"
                className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider"
              >
                Order Instructions (Optional)
              </label>
              <textarea
                id="order-notes"
                rows={2}
                placeholder="e.g. Please bring drinks first, extra napkins, allergy notice..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500 transition-colors resize-none"
              />
            </div>
          )}

          {/* Payment Section */}
          {items.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>Payment Method</span>
                </span>
                <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>256-bit Encrypted</span>
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('APPLE_PAY')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'APPLE_PAY'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'CASH'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Pay Counter</span>
                </button>
              </div>

              {/* Card Form */}
              {paymentMethod === 'CARD' && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-500">
                      Card Details
                    </span>
                    <button
                      type="button"
                      onClick={fillDemoCard}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Use Demo Card</span>
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Cardholder Name"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()
                        setCardNumber(val)
                      }}
                      className="w-full px-3 py-2 font-mono text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 font-mono text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500 text-center"
                    />
                    <input
                      type="password"
                      placeholder="CVC"
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-2 font-mono text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500 text-center"
                    />
                  </div>
                </div>
              )}

              {/* Digital Wallet Notice */}
              {paymentMethod === 'APPLE_PAY' && (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-center space-y-1">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Apple Pay / Google Pay Ready
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Your device wallet will authorize upon tapping the button below.
                  </p>
                </div>
              )}

              {/* Cash at Counter Notice */}
              {paymentMethod === 'CASH' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-center space-y-1">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    Pay at Table or Counter
                  </p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                    Our waitstaff will bring your order and collect cash or card at Table #{tableInput || '?'}.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-zinc-500">
                <span>Estimated Prep Time</span>
                <span className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> 15 – 20 mins
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>Subtotal ({totalCount} items)</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-black text-zinc-950 dark:text-zinc-50 pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                <span>Total Due</span>
                <span className="text-xl text-amber-600 dark:text-amber-400">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{paymentPhase || 'Processing Order...'}</span>
                </>
              ) : (
                <>
                  <span>
                    Pay ${totalPrice.toFixed(2)} &amp; Order for Table #{tableInput || '?'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
