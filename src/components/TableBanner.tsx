'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UtensilsCrossed, QrCode, X, Bike, MapPin } from 'lucide-react'
import { useCart } from '@/context/CartContext'

interface TableBannerProps {
  tableNumber: number | null
  onClearTable: () => void
}

export default function TableBanner({ tableNumber, onClearTable }: TableBannerProps) {
  const { openCart } = useCart()
  const [deliveryAddress, setDeliveryAddress] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qr_cafe_delivery_address')
      if (saved) setDeliveryAddress(saved)
    }
  }, [])

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
    <div className="bg-zinc-900 dark:bg-zinc-950 text-zinc-200 py-2.5 px-4 text-xs border-b border-zinc-800">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-zinc-300">
          <Bike className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            {deliveryAddress ? (
              <span className="flex items-center gap-1.5 flex-wrap">
                <span>Delivering outside to:</span>
                <span className="font-bold text-amber-400 max-w-[200px] sm:max-w-xs truncate inline-block">
                  {deliveryAddress}
                </span>
              </span>
            ) : (
              <span>
                Ordering from outside? Tell us your address and our waiter will deliver right to you!
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openCart}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer"
          >
            <MapPin className="w-3 h-3" />
            <span>{deliveryAddress ? 'Change Delivery Info' : 'Order for Delivery'}</span>
          </button>

          <Link
            href="/tables"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
          >
            <QrCode className="w-3 h-3 text-amber-400" />
            <span>At a Table?</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
