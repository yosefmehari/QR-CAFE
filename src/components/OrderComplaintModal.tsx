'use client'

import { useState } from 'react'
import {
  X,
  AlertTriangle,
  Send,
  Loader2,
  CheckCircle2,
  UtensilsCrossed,
  Sparkles,
  RefreshCw,
  PhoneCall,
  Flame,
  Snowflake,
  Clock,
  HelpCircle,
} from 'lucide-react'
import type { TrackedOrder, TrackedItem } from './OrderTrackerClient'

interface OrderComplaintModalProps {
  order: TrackedOrder
  isOpen: boolean
  onClose: () => void
  onComplaintSubmitted: () => void
}

const ISSUE_CATEGORIES = [
  {
    id: 'DISLIKE_FOOD',
    label: "Don't Like Food / Taste",
    desc: 'Taste, seasoning, or texture not to liking',
    icon: Flame,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  },
  {
    id: 'FOOD_QUALITY',
    label: 'Food Not Good / Undercooked',
    desc: 'Undercooked, burnt, bad smell, or strange taste',
    icon: AlertTriangle,
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
  },
  {
    id: 'RETURN_DISH',
    label: 'Return Food / Send Back',
    desc: 'Want to return this meal to the kitchen',
    icon: RefreshCw,
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
    desc: 'An item, sauce, or side was missing',
    icon: AlertTriangle,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  },
  {
    id: 'HYGIENE',
    label: 'Hygiene / Foreign Object',
    desc: 'Cleanliness issue, hair, or packaging problem',
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
    desc: 'Cutlery, packaging, or general issue',
    icon: HelpCircle,
    color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
  },
]

const DESIRED_ACTIONS = [
  {
    id: 'RETURN_REFUND',
    title: 'Return Dish & Refund / Deduct',
    desc: 'Take dish back & refund or deduct from my bill',
    icon: Sparkles,
  },
  {
    id: 'RETURN_EXCHANGE',
    title: 'Return & Replace with Different Dish',
    desc: 'Take dish back & let me pick another item',
    icon: RefreshCw,
  },
  {
    id: 'REMAKE',
    title: 'Remake Same Dish Fresh',
    desc: 'Kitchen will prepare a fresh, hot replacement',
    icon: Flame,
  },
  {
    id: 'CALL_STAFF',
    title: 'Send Waiter to Table Now',
    desc: 'Have a waiter come inspect/collect the dish immediately',
    icon: PhoneCall,
  },
  {
    id: 'FEEDBACK',
    title: 'Kitchen Feedback Only',
    desc: 'No return needed, just letting kitchen know',
    icon: Send,
  },
]

const QUICK_TAGS = [
  'Don\'t like the taste',
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

export default function OrderComplaintModal({
  order,
  isOpen,
  onClose,
  onComplaintSubmitted,
}: OrderComplaintModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('FOOD_QUALITY')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [details, setDetails] = useState('')
  const [desiredAction, setDesiredAction] = useState<string>('REMAKE')
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  if (!isOpen) return null

  const toggleItem = (itemName: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((i) => i !== itemName)
        : [...prev, itemName]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!details.trim()) {
      setErrorMessage('Please describe the issue with your meal.')
      return
    }

    setIsSubmitting(true)

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

      setIsSuccess(true)
      onComplaintSubmitted()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while submitting'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-zinc-950 dark:text-zinc-50">
                  Report an Issue with Order #{order.shortId}
                </h3>
                <p className="text-xs text-zinc-500">
                  {order.tableNumber ? `Table #${order.tableNumber}` : 'Delivery Order'} • We want to make your experience perfect!
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-zinc-950 dark:text-zinc-50">
                {desiredAction.startsWith('RETURN') || selectedCategory === 'RETURN_DISH'
                  ? 'Return Request Received'
                  : 'Issue Reported Successfully'}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Our kitchen and floor team have been notified.
                {desiredAction.startsWith('RETURN') || selectedCategory === 'RETURN_DISH'
                  ? ' Please keep the dish on your table. A waiter is on their way right now to collect it and assist with your replacement or refund!'
                  : ' A staff member is reviewing your feedback and will attend to you shortly.'}
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Back to Order Tracking
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Satisfaction Guarantee Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block text-amber-900 dark:text-amber-300">
                  100% Satisfaction &amp; Freshness Guarantee
                </span>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-200/80 mt-0.5">
                  If you don&apos;t like the food, if anything is not cooked right, or if you want to return a dish, we will gladly take it back, remake it fresh, or give you a refund.
                </p>
              </div>
            </div>

            {/* Step 1: Issue Category */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                1. What went wrong?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ISSUE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${cat.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                          {cat.label}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight line-clamp-1">
                          {cat.desc}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Affected Items */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                  2. Which dish / item had the problem? (Optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item: TrackedItem) => {
                    const itemName = `${item.quantity}x ${item.name}`
                    const isChecked = selectedItems.includes(itemName)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleItem(itemName)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isChecked
                            ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold shadow-xs'
                            : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                        }`}
                      >
                        <span>{item.emoji}</span>
                        <span>{itemName}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Explanation Details & Quick Tags */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                  3. Tell us what was wrong
                </label>
                <span className="text-[10px] text-zinc-400">Tap quick tags to add:</span>
              </div>

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setDetails((prev) =>
                        prev.trim().length > 0
                          ? `${prev.trim().replace(/,\s*$/, '')}, ${tag}`
                          : tag
                      )
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500/15 hover:border-amber-500/40 hover:text-amber-700 dark:hover:text-amber-300 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <textarea
                required
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="e.g. The burger was cold and undercooked, I don't like it and want to return it..."
                className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>

            {/* Step 4: Desired Action */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                4. What can we do to fix this?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DESIRED_ACTIONS.map((action) => {
                  const Icon = action.icon
                  const isSelected = desiredAction === action.id
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => setDesiredAction(action.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-amber-500">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                          {action.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 block leading-tight">
                          {action.desc}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {(desiredAction.startsWith('RETURN') || selectedCategory === 'RETURN_DISH') && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2.5">
                  <RefreshCw className="w-4 h-4 text-rose-500 shrink-0 mt-0.5 animate-spin" />
                  <div className="text-[11px] leading-relaxed">
                    <strong className="font-bold block">Dish Return Notice:</strong>
                    Please leave the dish on your table. A waiter will be notified to collect it immediately and process your {desiredAction === 'RETURN_REFUND' ? 'refund' : desiredAction === 'RETURN_EXCHANGE' ? 'exchange' : 'return'}.
                  </div>
                </div>
              )}
            </div>

            {/* Optional Phone Contact */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                Contact Phone (for waiter/manager follow-up)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 0911000000"
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to Kitchen &amp; Staff</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
