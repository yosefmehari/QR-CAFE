'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  X,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  PhoneCall,
  Clock,
  UtensilsCrossed,
  RotateCcw,
} from 'lucide-react'

interface OrderHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function OrderHelpModal({ isOpen, onClose }: OrderHelpModalProps) {
  const router = useRouter()
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null)
  const [recentTable, setRecentTable] = useState<string | null>(null)
  const [searchOrderId, setSearchOrderId] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeId = localStorage.getItem('qr_cafe_active_order_id')
      const lastId = localStorage.getItem('qr_cafe_last_order_id')
      const table =
        localStorage.getItem('qr_cafe_active_order_table') ||
        localStorage.getItem('qr_cafe_last_order_table') ||
        localStorage.getItem('qr_cafe_table_number')

      setRecentOrderId(activeId || lastId || null)
      setRecentTable(table || null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const clean = searchOrderId.trim()
    if (!clean) {
      setErrorMessage('Please enter your Order ID or order reference.')
      return
    }

    onClose()
    router.push(`/order/${clean}?report=true`)
  }

  const handleOpenRecent = (openReport = true) => {
    if (!recentOrderId) return
    onClose()
    router.push(`/order/${recentOrderId}${openReport ? '?report=true' : ''}`)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl my-8 overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-950 dark:text-zinc-50">
                Food Returns &amp; Order Help
              </h3>
              <p className="text-xs text-zinc-500">
                100% Quality &amp; Satisfaction Guarantee
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guarantee Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 text-xs text-amber-950 dark:text-amber-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Not happy with your order?</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-200/80">
            If you don&apos;t like your food, if it arrived cold or undercooked, or if you want to return a dish, we will gladly take it back, remake it fresh, or give you a full refund!
          </p>
        </div>

        {/* Recent Order Quick Action (if found) */}
        {recentOrderId && (
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Recent Order Found
              </span>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                #{recentOrderId.slice(-6).toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300">
              {recentTable ? `Table #${recentTable}` : 'Recent dine-in/delivery order'}. Ready to report an issue or return a dish?
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleOpenRecent(true)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Return Food / Complain</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenRecent(false)}
                className="py-2.5 px-3 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 font-semibold text-xs transition-colors cursor-pointer"
              >
                View Status
              </button>
            </div>
          </div>
        )}

        {/* Order ID Lookup Form */}
        <form onSubmit={handleLookup} className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
            Look up Order by ID
          </label>

          {errorMessage && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {errorMessage}
            </p>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              placeholder="Paste or enter full Order ID..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Open Order Support</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-1">
          <Link
            href="/complaint"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs transition-all flex items-center justify-center gap-2 text-center"
          >
            <span>Open Full Return &amp; Complaint Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Tips */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Floor waiters and managers are notified immediately.</span>
          </div>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Dish returns are collected directly from your table.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
