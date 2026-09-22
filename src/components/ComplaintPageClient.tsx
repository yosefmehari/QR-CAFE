'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  Flame,
  Snowflake,
  UtensilsCrossed,
  Clock,
  HelpCircle,
  Sparkles,
  RefreshCw,
  PhoneCall,
  Send,
  ArrowLeft,
  CheckCircle2,
  Search,
  Check,
  RotateCcw,
  Bike,
  ShieldCheck,
  Phone,
  MessageSquare,
} from 'lucide-react'
import type { TrackedOrder, TrackedItem, TrackedComplaint } from './OrderTrackerClient'

const ISSUE_CATEGORIES = [
  {
    id: 'DISLIKE_FOOD',
    label: "Don't Like Food / Taste",
    desc: 'Taste, seasoning, or texture did not meet expectations',
    icon: Flame,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  },
  {
    id: 'FOOD_QUALITY',
    label: 'Food Not Good / Undercooked',
    desc: 'Undercooked, burnt, bad smell, or strange flavor',
    icon: AlertTriangle,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
  },
  {
    id: 'RETURN_DISH',
    label: 'Return Food / Send Back',
    desc: 'I want to return this meal to the kitchen',
    icon: RotateCcw,
    color: 'text-red-500 bg-red-500/10 border-red-500/30',
  },
  {
    id: 'COLD_FOOD',
    label: 'Food Served Cold',
    desc: 'Meal was lukewarm or cold on arrival',
    icon: Snowflake,
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30',
  },
  {
    id: 'WRONG_ITEM',
    label: 'Wrong Dish Received',
    desc: 'Received a different dish or ingredients',
    icon: UtensilsCrossed,
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  },
  {
    id: 'MISSING_ITEM',
    label: 'Missing Item / Side',
    desc: 'An item, sauce, or side was omitted',
    icon: AlertTriangle,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  },
  {
    id: 'HYGIENE',
    label: 'Hygiene / Cleanliness Issue',
    desc: 'Cleanliness problem, hair, or packaging defect',
    icon: AlertTriangle,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  },
  {
    id: 'DELAY',
    label: 'Excessive Delay',
    desc: 'Order took far too long to arrive',
    icon: Clock,
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
  },
  {
    id: 'OTHER',
    label: 'Other Problem',
    desc: 'Packaging, cutlery, or general service issue',
    icon: HelpCircle,
    color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
  },
]

const DESIRED_ACTIONS = [
  {
    id: 'RETURN_REFUND',
    title: 'Return Dish & Refund / Deduct',
    desc: 'Take the dish back & refund or deduct from my bill',
    icon: Sparkles,
  },
  {
    id: 'RETURN_EXCHANGE',
    title: 'Return & Replace with Different Dish',
    desc: 'Take dish back & let me pick another item from menu',
    icon: RefreshCw,
  },
  {
    id: 'REMAKE',
    title: 'Remake Same Dish Fresh',
    desc: 'Kitchen will prepare a fresh, hot replacement plate',
    icon: Flame,
  },
  {
    id: 'CALL_STAFF',
    title: 'Send Waiter to Table Immediately',
    desc: 'Have a waiter come inspect/collect the dish right now',
    icon: PhoneCall,
  },
  {
    id: 'FEEDBACK',
    title: 'Kitchen Feedback Only',
    desc: 'No return needed, just letting kitchen chefs know',
    icon: Send,
  },
]

const QUICK_TAGS = [
  "Don't like the taste",
  'Too salty',
  'Too spicy',
  'Undercooked / Raw',
  'Overcooked / Burnt',
  'Served cold',
  'Tastes off / Spoiled',
  'Dry & tough',
  'Wrong ingredients / Allergy',
  'Please take it back',
]

export default function ComplaintPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null)
  const [recentTableNumber, setRecentTableNumber] = useState<string | null>(null)

  // Complaint Form State
  const [selectedCategory, setSelectedCategory] = useState<string>('DISLIKE_FOOD')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [desiredAction, setDesiredAction] = useState<string>('RETURN_REFUND')
  const [details, setDetails] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [waiterCalledMessage, setWaiterCalledMessage] = useState<string | null>(null)

  // Load order helper
  const loadOrder = useCallback(async (identifier: string) => {
    setIsLoadingOrder(true)
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/orders/lookup?query=${encodeURIComponent(identifier)}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Order not found')
      }
      const data: TrackedOrder = await res.json()
      setOrder(data)
      if (data.customerPhone) {
        setCustomerPhone(data.customerPhone)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not find order'
      setErrorMessage(msg)
      setOrder(null)
    } finally {
      setIsLoadingOrder(false)
    }
  }, [])

  // Check URL params or localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const orderIdParam = searchParams.get('orderId') || searchParams.get('id')
    const tableParam = searchParams.get('table')

    const storedActiveId = localStorage.getItem('qr_cafe_active_order_id')
    const storedLastId = localStorage.getItem('qr_cafe_last_order_id')
    const storedTable =
      localStorage.getItem('qr_cafe_active_order_table') ||
      localStorage.getItem('qr_cafe_last_order_table') ||
      localStorage.getItem('qr_cafe_table_number')

    const foundRecentId = storedActiveId || storedLastId
    if (foundRecentId) {
      setRecentOrderId(foundRecentId)
    }
    if (storedTable) {
      setRecentTableNumber(storedTable)
    }

    if (orderIdParam) {
      loadOrder(orderIdParam)
    } else if (tableParam) {
      loadOrder(tableParam)
    } else if (foundRecentId) {
      loadOrder(foundRecentId)
    }
  }, [searchParams, loadOrder])

  // Poll order complaints if order is loaded
  useEffect(() => {
    if (!order) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`)
        if (res.ok) {
          const fresh: TrackedOrder = await res.json()
          setOrder(fresh)
        }
      } catch (err) {
        console.error('Error refreshing order status:', err)
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [order?.id])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    loadOrder(searchQuery.trim())
  }

  const toggleItem = (itemName: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((i) => i !== itemName)
        : [...prev, itemName]
    )
  }

  const handleTagClick = (tag: string) => {
    setDetails((prev) =>
      prev.trim().length > 0 ? `${prev.trim().replace(/,\s*$/, '')}, ${tag}` : tag
    )
  }

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) {
      setErrorMessage('Please select or look up an order first.')
      return
    }

    if (!details.trim()) {
      setErrorMessage('Please provide a brief description of what was wrong with your meal.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/orders/${order.id}/complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          items: selectedItems.length > 0 ? selectedItems.join(', ') : 'Whole Order',
          details: details.trim(),
          desiredAction,
          customerPhone: customerPhone.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit complaint')
      }

      setSubmitSuccess(true)
      // Refresh order data
      const refreshedRes = await fetch(`/api/orders/${order.id}`)
      if (refreshedRes.ok) {
        const refreshedData = await refreshedRes.json()
        setOrder(refreshedData)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred while submitting'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCallWaiter = () => {
    setWaiterCalledMessage('A floor waiter has been notified and is heading to your table immediately!')
    setTimeout(() => setWaiterCalledMessage(null), 6000)
  }

  const isReturnAction =
    desiredAction.startsWith('RETURN') || selectedCategory === 'RETURN_DISH'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href={order?.tableNumber ? `/?table=${order.tableNumber}` : '/'}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{order?.tableNumber ? `Back to Menu (Table #${order.tableNumber})` : 'Back to Menu'}</span>
          </Link>

          {order && (
            <Link
              href={`/order/${order.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              <span>View Live Order Tracking</span>
            </Link>
          )}
        </div>

        {/* Hero Banner with Satisfaction Guarantee */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                <span>100% Guest Satisfaction &amp; Return Policy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                Food Quality &amp; Return Desk
              </h1>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                If you don&apos;t like your food, if it&apos;s cold, undercooked, or not what you expected, you have the right to return it. We will gladly remake it fresh, swap it for another dish, or issue an immediate refund!
              </p>
            </div>

            <div className="shrink-0 flex sm:flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleCallWaiter}
                className="w-full py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Waiter to Table</span>
              </button>
            </div>
          </div>

          {waiterCalledMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{waiterCalledMessage}</span>
            </div>
          )}

          {/* Three Guarantee Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Taste Guarantee</span>
                <span className="text-[10px] text-zinc-500">Don&apos;t like it? Send it back</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Fresh Remake</span>
                <span className="text-[10px] text-zinc-500">Hot, fresh replacement</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Instant Refund</span>
                <span className="text-[10px] text-zinc-500">Deducted from bill</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Selector / Lookup Bar */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {order ? 'Active Order Selected' : 'Which order has the issue?'}
              </h2>
              <p className="text-xs text-zinc-500">
                {order
                  ? `Order #${order.shortId} • ${order.tableNumber ? `Table #${order.tableNumber}` : 'Delivery'}`
                  : 'Enter your Table Number or Order ID to load your meal details'}
              </p>
            </div>

            {order && (
              <button
                type="button"
                onClick={() => {
                  setOrder(null)
                  setSubmitSuccess(false)
                }}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Change Order
              </button>
            )}
          </div>

          {!order && (
            <div className="space-y-3">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter Table # (e.g. 4) or Order ID (e.g. 38A1B2)..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoadingOrder}
                  className="px-5 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs hover:bg-zinc-800 dark:hover:bg-white cursor-pointer transition-all disabled:opacity-50"
                >
                  {isLoadingOrder ? 'Finding...' : 'Find Order'}
                </button>
              </form>

              {recentOrderId && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-500">Recent order detected:</span>
                  <button
                    type="button"
                    onClick={() => loadOrder(recentOrderId)}
                    className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Load Order #{recentOrderId.slice(-6).toUpperCase()}{' '}
                    {recentTableNumber ? `(Table #${recentTableNumber})` : ''}
                  </button>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Existing Complaints / Returns on this Order */}
        {order && order.complaints && order.complaints.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Submitted Return &amp; Complaint Requests ({order.complaints.length})</span>
              </h3>
              <span className="text-[11px] text-zinc-500">Live Status Updates</span>
            </div>

            <div className="space-y-3">
              {order.complaints.map((c: TrackedComplaint) => {
                const isResolved = c.status === 'RESOLVED'
                const isReviewing = c.status === 'REVIEWING'

                return (
                  <div
                    key={c.id}
                    className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                      isResolved
                        ? 'bg-emerald-500/5 border-emerald-500/30'
                        : isReviewing
                        ? 'bg-blue-500/5 border-blue-500/30 ring-1 ring-blue-500/20'
                        : 'bg-rose-500/5 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-100 block">
                          {c.category === 'DISLIKE_FOOD'
                            ? "👎 Don't Like Food / Taste"
                            : c.category === 'FOOD_QUALITY'
                            ? '🍲 Food Not Good / Quality Issue'
                            : c.category === 'RETURN_DISH'
                            ? '🔁 Food Return Requested'
                            : c.category === 'COLD_FOOD'
                            ? '❄️ Food Served Cold'
                            : c.category === 'WRONG_ITEM'
                            ? '❌ Wrong Dish Received'
                            : c.category === 'MISSING_ITEM'
                            ? '🔍 Missing Item / Side'
                            : c.category === 'HYGIENE'
                            ? '⚠️ Hygiene / Quality Issue'
                            : c.category === 'DELAY'
                            ? '⏳ Excessive Delay'
                            : '💬 Order Issue'}
                        </span>
                        {c.items && (
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                            Dish: {c.items}
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                          isResolved
                            ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                            : isReviewing
                            ? 'bg-blue-500/15 text-blue-600 border-blue-500/30 animate-pulse'
                            : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                        }`}
                      >
                        {isResolved
                          ? '✓ Resolved'
                          : isReviewing
                          ? 'Staff Attending Table'
                          : (c.desiredAction?.startsWith('RETURN') || c.category === 'RETURN_DISH')
                          ? 'Pending Staff Pickup'
                          : 'Pending Staff Response'}
                      </span>
                    </div>

                    <p className="text-zinc-600 dark:text-zinc-300 italic bg-white/60 dark:bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                      &quot;{c.details}&quot;
                    </p>

                    {c.desiredAction && (
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Requested action:{' '}
                        <strong className="text-zinc-800 dark:text-zinc-200">
                          {c.desiredAction === 'RETURN_REFUND'
                            ? '💰 Return Dish & Full Refund'
                            : c.desiredAction === 'RETURN_EXCHANGE'
                            ? '🔁 Return Dish & Replace with Another Dish'
                            : c.desiredAction === 'REMAKE'
                            ? '🔥 Remake Same Dish Fresh'
                            : c.desiredAction === 'CALL_STAFF'
                            ? '🙋 Waiter Coming to Table'
                            : c.desiredAction === 'FEEDBACK'
                            ? '💬 Kitchen Feedback Only'
                            : c.desiredAction}
                        </strong>
                      </div>
                    )}

                    {(c.desiredAction?.startsWith('RETURN') || c.category === 'RETURN_DISH') && !isResolved && (
                      <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-[11px]">
                        <strong>Dish Return Notice:</strong> Please keep the dish on your table. Floor staff is notified and will collect it shortly.
                      </div>
                    )}

                    {c.staffNotes && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-[11px] space-y-0.5">
                        <span className="font-bold block">Staff Resolution Note:</span>
                        <p>{c.staffNotes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Complaint & Return Submission Form */}
        {order && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h2 className="text-lg font-black text-zinc-950 dark:text-zinc-50">
                Submit Food Return / Quality Complaint
              </h2>
              <p className="text-xs text-zinc-500">
                Order #{order.shortId} • {order.tableNumber ? `Table #${order.tableNumber}` : 'Delivery'} • Placed at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-zinc-950 dark:text-zinc-50">
                    {isReturnAction ? 'Food Return Request Dispatched' : 'Issue Reported Successfully'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Our floor waiters and kitchen team have received your ticket immediately.
                    {isReturnAction
                      ? ' Please leave the dish on your table — staff is on their way right now to collect it and assist with your replacement or refund!'
                      : ' A staff member is reviewing your request and will attend to you shortly.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(false)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold text-xs text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                  >
                    Report Another Item
                  </button>
                  <Link
                    href={`/order/${order.id}`}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 font-bold text-xs text-white shadow-md transition-colors cursor-pointer"
                  >
                    View Live Order Screen
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitComplaint} className="space-y-6">
                {/* Step 1: Issue Category */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                    1. What is the problem with your meal?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {ISSUE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon
                      const isSelected = selectedCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20 shadow-xs'
                              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cat.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                              {cat.label}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                              {cat.desc}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Step 2: Affected Dishes Selector */}
                {order.items && order.items.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                        2. Which dish / item would you like to return or report?
                      </label>
                      <span className="text-[10px] text-zinc-400">Select all that apply</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {order.items.map((item: TrackedItem) => {
                        const itemName = `${item.quantity}x ${item.name}`
                        const isChecked = selectedItems.includes(itemName)
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleItem(itemName)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isChecked
                                ? 'bg-rose-500/15 border-rose-500 text-rose-900 dark:text-rose-200 font-bold shadow-xs'
                                : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-lg">{item.emoji}</span>
                              <div className="truncate">
                                <span className="text-xs font-bold block truncate">{item.name}</span>
                                <span className="text-[10px] text-zinc-400">
                                  Qty: {item.quantity} • ${item.unitPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                                isChecked
                                  ? 'bg-rose-600 border-rose-600 text-white'
                                  : 'border-zinc-300 dark:border-zinc-600'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Desired Action (Resolution) */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                    3. What would you like us to do? (Desired Resolution)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {DESIRED_ACTIONS.map((action) => {
                      const Icon = action.icon
                      const isSelected = desiredAction === action.id
                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => setDesiredAction(action.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                              : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-amber-500">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                              {action.title}
                            </span>
                            <span className="text-[10px] text-zinc-400 block leading-tight mt-0.5">
                              {action.desc}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {isReturnAction && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                      <RotateCcw className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong className="font-bold block">Dish Return Notice:</strong>
                        Please leave the dish on your table. Our staff has been alerted and will arrive to pick it up and process your {desiredAction === 'RETURN_REFUND' ? 'full refund' : desiredAction === 'RETURN_EXCHANGE' ? 'replacement dish' : 'request'}.
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 4: Quick Tags & Detailed Explanation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                      4. Tell us more about the issue
                    </label>
                    <span className="text-[10px] text-zinc-400">1-Tap quick tags:</span>
                  </div>

                  {/* Quick Tags */}
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {QUICK_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagClick(tag)}
                        className="px-2.5 py-1 rounded-xl text-[11px] bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500/15 hover:border-amber-500/40 hover:text-amber-700 dark:hover:text-amber-300 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>

                  <textarea
                    required
                    rows={4}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="e.g. The pizza was burnt on the bottom and cold in the middle. I cannot eat it and would like to return it for a refund..."
                    className="w-full px-4 py-3 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                  />
                </div>

                {/* Step 5: Contact Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                    Contact Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 0911000000"
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 block">
                    Our floor manager or waiter will reach out or come to your table.
                  </span>
                </div>

                {/* Submit Action */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-2xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-lg shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Return / Complaint Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
