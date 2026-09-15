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
  Sparkles,
  Building2,
  Copy,
  Check,
  Camera,
  UploadCloud,
  MapPin,
  Bike,
  Phone,
  User,
} from 'lucide-react'

type PaymentMethodType = 'CARD' | 'BANK_TRANSFER' | 'APPLE_PAY' | 'CASH'

interface CartDrawerProps {
  currentTableNumber?: number | null
}

interface CafeBankSettings {
  bankName: string
  bankAccountNumber: string
  accountHolderName: string
  telebirrNumber?: string | null
  paymentInstructions?: string | null
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

  const [orderType, setOrderType] = useState<'DINE_IN' | 'DELIVERY'>('DINE_IN')
  const [tableInput, setTableInput] = useState<number | ''>(currentTableNumber || '')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [paymentPhase, setPaymentPhase] = useState<string | null>(null)

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CARD')
  const [cardholderName, setCardholderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')

  // Bank transfer states
  const [bankTxnRef, setBankTxnRef] = useState('')
  const [senderName, setSenderName] = useState('')
  const [cafeSettings, setCafeSettings] = useState<CafeBankSettings | null>(null)
  const [copiedBank, setCopiedBank] = useState(false)
  const [copiedTelebirr, setCopiedTelebirr] = useState(false)

  // Payment screenshot upload states
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false)

  const [prevTableNumber, setPrevTableNumber] = useState(currentTableNumber)

  // Fetch cafe bank settings on mount & restore customer details
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCafeSettings(data)
      })
      .catch((err) => console.error('Failed to load bank settings', err))

    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('qr_cafe_customer_name')
      const savedPhone = localStorage.getItem('qr_cafe_customer_phone')
      const savedAddress = localStorage.getItem('qr_cafe_delivery_address')
      if (savedName) setCustomerName(savedName)
      if (savedPhone) setCustomerPhone(savedPhone)
      if (savedAddress) setDeliveryAddress(savedAddress)

      const savedTable = localStorage.getItem('qr_cafe_table_number')
      if (!currentTableNumber && !savedTable) {
        setOrderType('DELIVERY')
      } else if (currentTableNumber || savedTable) {
        setOrderType('DINE_IN')
      }
    }
  }, [currentTableNumber])

  // Sync internal tableInput with context
  if (currentTableNumber !== prevTableNumber) {
    setPrevTableNumber(currentTableNumber)
    if (currentTableNumber) {
      setTableInput(currentTableNumber)
      setOrderType('DINE_IN')
    }
  }

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

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, or WEBP).')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 10MB limit.')
      return
    }

    setScreenshotFile(file)
    const previewUrl = URL.createObjectURL(file)
    setScreenshotPreview(previewUrl)
    setErrorMessage(null)

    // Pre-upload in background
    try {
      setIsUploadingScreenshot(true)
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setScreenshotUrl(data.url)
      }
    } catch (err) {
      console.error('Screenshot pre-upload failed', err)
    } finally {
      setIsUploadingScreenshot(false)
    }
  }

  const removeScreenshot = () => {
    setScreenshotFile(null)
    setScreenshotPreview(null)
    setScreenshotUrl(null)
  }

  const handlePlaceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)

    const finalTable = typeof tableInput === 'number' ? tableInput : null

    if (orderType === 'DINE_IN') {
      if (!finalTable || finalTable <= 0) {
        setErrorMessage('Please enter a valid dining table number (e.g. Table 1, Table 2).')
        return
      }
    } else {
      if (!deliveryAddress.trim() || deliveryAddress.trim().length < 3) {
        setErrorMessage('Please provide your delivery address or location (e.g. office, room, or landmark).')
        return
      }
      if (!customerPhone.trim() || customerPhone.trim().length < 5) {
        setErrorMessage('Please enter your phone number so our waiter can coordinate your delivery.')
        return
      }
      if (!customerName.trim() || customerName.trim().length < 2) {
        setErrorMessage('Please enter your name for delivery.')
        return
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('qr_cafe_customer_name', customerName.trim())
        localStorage.setItem('qr_cafe_customer_phone', customerPhone.trim())
        localStorage.setItem('qr_cafe_delivery_address', deliveryAddress.trim())
      }
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before checking out.')
      return
    }

    // Strict Security & Payment Validations
    if (paymentMethod === 'CARD') {
      const cleanNum = cardNumber.replace(/\s|-/g, '')

      // Card Length
      if (cleanNum.length < 13 || cleanNum.length > 19) {
        setErrorMessage('Please enter a valid 13 to 19 digit card number.')
        return
      }

      // Luhn check
      let sum = 0
      let shouldDouble = false
      for (let i = cleanNum.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNum.charAt(i), 10)
        if (shouldDouble) {
          digit *= 2
          if (digit > 9) digit -= 9
        }
        sum += digit
        shouldDouble = !shouldDouble
      }
      if (sum % 10 !== 0) {
        setErrorMessage('Invalid card number. Please check the digits and try again.')
        return
      }

      // Expiry Check
      if (!cardExpiry || !cardExpiry.includes('/')) {
        setErrorMessage('Please enter card expiration date (MM/YY).')
        return
      }
      const [mStr, yStr] = cardExpiry.split('/')
      const month = parseInt(mStr, 10)
      const year = parseInt('20' + yStr, 10)
      const now = new Date()
      if (isNaN(month) || month < 1 || month > 12) {
        setErrorMessage('Invalid expiration month (must be 01-12).')
        return
      }
      if (isNaN(year) || year < now.getFullYear() || (year === now.getFullYear() && month < (now.getMonth() + 1))) {
        setErrorMessage('This card has expired. Please enter a valid card.')
        return
      }

      // CVC Check
      if (!cardCvc || cardCvc.trim().length < 3) {
        setErrorMessage('Please enter a valid 3 or 4 digit security code (CVC).')
        return
      }
    }

    if (paymentMethod === 'BANK_TRANSFER') {
      if (!bankTxnRef.trim() && !screenshotFile && !screenshotUrl) {
        setErrorMessage('Please enter your transaction confirmation code or upload a receipt screenshot.')
        return
      }
      if (bankTxnRef.trim() && bankTxnRef.trim().length < 3 && !screenshotFile && !screenshotUrl) {
        setErrorMessage('Transaction reference must be at least 3 characters long, or upload a receipt screenshot.')
        return
      }
    }

    setIsSubmitting(true)

    // Upload screenshot if not yet uploaded
    let finalScreenshotUrl = screenshotUrl
    if (screenshotFile && !finalScreenshotUrl) {
      try {
        setPaymentPhase('Uploading receipt screenshot...')
        const fd = new FormData()
        fd.append('file', screenshotFile)
        const upRes = await fetch('/api/upload', {
          method: 'POST',
          body: fd,
        })
        if (upRes.ok) {
          const upData = await upRes.json()
          finalScreenshotUrl = upData.url
        }
      } catch (err) {
        console.error('Failed to upload screenshot', err)
      }
    }

    // Simulate payment authorization sequence
    if (paymentMethod === 'CARD' || paymentMethod === 'APPLE_PAY') {
      setPaymentPhase('Authorizing Payment...')
      await new Promise((r) => setTimeout(r, 600))
      setPaymentPhase('Payment Approved!')
      await new Promise((r) => setTimeout(r, 400))
    } else if (paymentMethod === 'BANK_TRANSFER') {
      setPaymentPhase('Verifying Bank Transfer...')
      await new Promise((r) => setTimeout(r, 600))
      setPaymentPhase('Transfer Code Recorded!')
      await new Promise((r) => setTimeout(r, 400))
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          tableNumber: orderType === 'DINE_IN' ? finalTable : undefined,
          customerName: orderType === 'DELIVERY' ? customerName.trim() : undefined,
          customerPhone: orderType === 'DELIVERY' ? customerPhone.trim() : undefined,
          deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress.trim() : undefined,
          deliveryNotes: orderType === 'DELIVERY' ? deliveryNotes.trim() : undefined,
          notes: orderNotes.trim() || undefined,
          paymentMethod,
          paymentScreenshot: finalScreenshotUrl || undefined,
          cardDetails:
            paymentMethod === 'CARD'
              ? {
                  cardholderName,
                  cardNumber,
                  expiry: cardExpiry,
                  cvc: cardCvc,
                }
              : undefined,
          bankTransferDetails:
            paymentMethod === 'BANK_TRANSFER'
              ? {
                  transactionReference: bankTxnRef.trim() || (finalScreenshotUrl ? 'Receipt Screenshot Attached' : undefined),
                  screenshotUrl: finalScreenshotUrl || undefined,
                  senderName: senderName.trim() || undefined,
                  bankUsed: cafeSettings?.bankName || 'Bank Transfer',
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
      removeScreenshot()
      clearCart()
      closeCart()
      router.push(`/order/${data.id || data.orderId}`)
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
          {/* Order Mode Selector: Dine-In vs Outside Delivery */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setOrderType('DINE_IN')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  orderType === 'DINE_IN'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                <span>Dine-In Table</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('DELIVERY')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  orderType === 'DELIVERY'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Outside Delivery</span>
              </button>
            </div>

            {/* If Dine-In */}
            {orderType === 'DINE_IN' ? (
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
                  The kitchen delivers directly to your cafe table.
                </p>
              </div>
            ) : (
              /* If Outside Delivery */
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>Outside Delivery Details</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                    No Table Needed
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Where is your place? (Address / Location) *
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. Office #302, Sunlight Tower or Across the street, bench #2"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Your Name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="e.g. Alex"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                        <input
                          type="tel"
                          placeholder="0911234567"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full pl-8 pr-2.5 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Delivery Directions / Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near blue gate, 2nd floor, call on arrival"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 flex items-center gap-1.5 pt-0.5">
                  <Check className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Our waiter will accept your order and deliver straight to your address.</span>
                </p>
              </div>
            )}
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
                    <div className="w-14 h-14 rounded-xl bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center border border-zinc-200/60 dark:border-zinc-700/60">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl select-none">{item.emoji || '🍽️'}</span>
                      )}
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
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
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
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Bank / Telebirr</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('APPLE_PAY')}
                  className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
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
                  className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'CASH'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Cash</span>
                </button>
              </div>

              {/* Bank Transfer Details Form */}
              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                  {/* Bank Account Info Card */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Cafe Bank Details</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-semibold">
                        Direct Deposit
                      </span>
                    </div>

                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                        <span className="text-zinc-500 font-sans">Bank:</span>
                        <span className="font-bold">{cafeSettings?.bankName || 'Commercial Bank of Ethiopia'}</span>
                      </div>

                      <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                        <span className="text-zinc-500 font-sans">Account Name:</span>
                        <span className="font-semibold">{cafeSettings?.accountHolderName || 'Aroma & Fork Cafe'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
                        <span className="text-zinc-500 font-sans">Account No:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-amber-600 dark:text-amber-400 tracking-wider">
                            {cafeSettings?.bankAccountNumber || '1000234567890'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (cafeSettings?.bankAccountNumber) {
                                navigator.clipboard.writeText(cafeSettings.bankAccountNumber)
                                setCopiedBank(true)
                                setTimeout(() => setCopiedBank(false), 2000)
                              }
                            }}
                            className="p-1 rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 transition-colors cursor-pointer"
                            title="Copy Account Number"
                          >
                            {copiedBank ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {cafeSettings?.telebirrNumber && (
                        <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
                          <span className="text-zinc-500 font-sans">Telebirr:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-amber-600 dark:text-amber-400">
                              {cafeSettings.telebirrNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cafeSettings.telebirrNumber || '')
                                setCopiedTelebirr(true)
                                setTimeout(() => setCopiedTelebirr(false), 2000)
                              }}
                              className="p-1 rounded-md bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-amber-500 transition-colors cursor-pointer"
                              title="Copy Telebirr"
                            >
                              {copiedTelebirr ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed pt-1">
                      {cafeSettings?.paymentInstructions || 'Please transfer the exact total amount and enter your transaction / receipt number below to confirm your order.'}
                    </p>
                  </div>

                  {/* Screenshot Upload Dropzone */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-amber-500" />
                        <span>Payment Receipt Screenshot</span>
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        {screenshotPreview ? '✓ Attached' : '(Accepts Screenshot)'}
                      </span>
                    </label>

                    {!screenshotPreview ? (
                      <label className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center cursor-pointer bg-zinc-50 dark:bg-zinc-900/40 hover:bg-amber-500/5 transition-all group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          className="hidden"
                        />
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            Upload CBE or Telebirr Receipt Screenshot
                          </p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            Tap to browse or take photo (PNG, JPG, WEBP)
                          </p>
                        </div>
                      </label>
                    ) : (
                      <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-amber-500/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/10 shrink-0 border border-zinc-300 dark:border-zinc-700 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={screenshotPreview}
                              alt="Payment receipt preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {screenshotFile?.name || 'Receipt Screenshot'}
                            </p>
                            <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                              {isUploadingScreenshot ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Uploading...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Screenshot Attached</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={removeScreenshot}
                          className="p-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove screenshot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Transaction Code Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1">
                      Transaction Confirmation Code {screenshotPreview ? '(Optional if Screenshot Attached)' : '*'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TXN-98421038 or CBE Ref #"
                      value={bankTxnRef}
                      onChange={(e) => setBankTxnRef(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Sender Name (Optional)"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

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

              {/* Cash Notice */}
              {paymentMethod === 'CASH' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-center space-y-1">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    {orderType === 'DELIVERY' ? 'Cash on Delivery' : 'Pay at Table or Counter'}
                  </p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                    {orderType === 'DELIVERY'
                      ? 'Our waiter / courier will bring your order to your address and collect cash upon arrival.'
                      : `Our waitstaff will bring your order and collect cash or card at Table #${tableInput || '?'}.`}
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
                    {paymentMethod === 'BANK_TRANSFER'
                      ? `Confirm Transfer ($${totalPrice.toFixed(2)}) & Place Order`
                      : paymentMethod === 'CASH'
                        ? orderType === 'DELIVERY'
                          ? `Order for Delivery ($${totalPrice.toFixed(2)} Cash on Delivery)`
                          : `Place Order for Table #${tableInput || '?'} (Pay at Counter)`
                        : orderType === 'DELIVERY'
                          ? `Pay $${totalPrice.toFixed(2)} & Order Delivery`
                          : `Pay $${totalPrice.toFixed(2)} & Order for Table #${tableInput || '?'}`}
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
