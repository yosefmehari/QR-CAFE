'use client'

import Link from 'next/link'
import { UtensilsCrossed, QrCode, X, CheckCircle2 } from 'lucide-react'

interface TableBannerProps {
  tableNumber: number | null
  onClearTable: () => void
}

export default function TableBanner({ tableNumber, onClearTable }: TableBannerProps) {
  if (tableNumber) {
    return (
      <div className="bg-emerald-500 text-white py-2.5 px-4 shadow-sm transition-all animate-in slide-in-from-top-2 duration-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs sm:text-sm font-semibold gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <div className="flex items-center gap-1.5">
              <UtensilsCrossed className="w-4 h-4" />
              <span>Ordering for Table #{tableNumber}</span>
            </div>
            <span className="hidden md:inline text-emerald-100 font-normal">
              • Orders will be delivered straight to your table
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/tables"
              className="text-[11px] underline underline-offset-2 hover:text-emerald-100 font-medium"
            >
              Switch Table
            </Link>
            <button
              type="button"
              onClick={onClearTable}
              className="inline-flex items-center gap-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 px-2 py-0.5 rounded-full text-white cursor-pointer transition-colors"
              title="Clear table selection"
            >
              <X className="w-3 h-3" />
              <span>Leave Table</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 dark:bg-zinc-950 text-zinc-200 py-2.5 px-4 text-xs">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-300">
          <QrCode className="w-4 h-4 text-amber-500" />
          <span>
            Sitting at a table? Scan the physical QR code on your table to link your seat.
          </span>
        </div>
        <Link
          href="/tables"
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white shrink-0 transition-colors"
        >
          <span>Select Table</span>
        </Link>
      </div>
    </div>
  )
}
