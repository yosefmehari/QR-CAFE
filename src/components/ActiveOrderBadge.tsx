'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, ArrowRight, X, AlertTriangle } from 'lucide-react'

export default function ActiveOrderBadge() {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [activeOrderTable, setActiveOrderTable] = useState<string | null>(null)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  const [lastOrderTable, setLastOrderTable] = useState<string | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window !== 'undefined') {
        const storedActiveId = localStorage.getItem('qr_cafe_active_order_id')
        const storedActiveTable = localStorage.getItem('qr_cafe_active_order_table')
        const storedLastId = localStorage.getItem('qr_cafe_last_order_id')
        const storedLastTable = localStorage.getItem('qr_cafe_last_order_table')
        const storedTime = localStorage.getItem('qr_cafe_last_order_time')

        if (storedActiveId) {
          setActiveOrderId(storedActiveId)
          setActiveOrderTable(storedActiveTable)
        } else if (storedLastId) {
          // Check if last order was placed recently (within last 3 hours)
          const now = Date.now()
          const time = storedTime ? parseInt(storedTime, 10) : 0
          if (!time || now - time < 3 * 60 * 60 * 1000) {
            setLastOrderId(storedLastId)
            setLastOrderTable(storedLastTable)
          }
        }
      }
    })
  }, [])

  if (isDismissed) return null
  if (!activeOrderId && !lastOrderId) return null

  if (activeOrderId) {
    const shortId = activeOrderId.slice(-6).toUpperCase()
    return (
      <aside aria-label="Active order notification" className="fixed top-24 right-4 z-30 animate-in slide-in-from-right-4 duration-300">
        <div className="bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-950 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-zinc-800 dark:border-zinc-200 flex items-center gap-3 text-xs font-semibold max-w-sm">
          <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5 animate-bounce" />
          </div>

          <Link
            href={`/order/${activeOrderId}`}
            className="hover:underline flex items-center gap-1.5 flex-1 min-w-0"
          >
            <span className="truncate">
              Order #{shortId} in progress {activeOrderTable ? `(Table #${activeOrderTable})` : ''}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          </Link>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-zinc-400 hover:text-white dark:hover:text-black p-0.5 cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    )
  }

  if (lastOrderId) {
    const shortId = lastOrderId.slice(-6).toUpperCase()
    return (
      <aside aria-label="Order support notification" className="fixed top-24 right-4 z-30 animate-in slide-in-from-right-4 duration-300">
        <div className="bg-zinc-900/95 dark:bg-zinc-100/95 text-white dark:text-zinc-950 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-rose-500/40 flex items-center gap-3 text-xs font-semibold max-w-sm">
          <div className="w-7 h-7 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>

          <Link
            href={`/order/${lastOrderId}?report=true`}
            className="hover:underline flex items-center gap-1.5 flex-1 min-w-0"
          >
            <span className="truncate">
              Order #{shortId} {lastOrderTable ? `(Table #${lastOrderTable})` : ''} • Food issue or return?
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          </Link>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-zinc-400 hover:text-white dark:hover:text-black p-0.5 cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    )
  }

  return null
}
