'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UtensilsCrossed, Search, Coffee, ShoppingBag, X, RotateCcw } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import OrderHelpModal from './OrderHelpModal'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  tableNumber?: number | null
}

export default function Header({ searchQuery, onSearchChange, tableNumber }: HeaderProps) {
  const { totalCount, openCart } = useCart()
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Cafe Identity */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
                  AROMA & FORK
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Open
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                Artisan Bistro & Specialty Coffee
              </p>
            </div>
          </Link>

          {/* Search bar on desktop/tablet */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search burgers, pizzas, coffee, desserts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onSearchChange('')
              }}
              className="w-full pl-10 pr-9 py-2 text-sm bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-amber-500 dark:focus:border-amber-500 rounded-full focus:bg-white dark:focus:bg-black focus:outline-none transition-all placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer transition-colors"
                title="Clear search (Esc)"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Side Info & Staff Access */}
          <div className="flex items-center gap-2 sm:gap-3">
            {tableNumber ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs font-semibold">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                <span>Table #{tableNumber}</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                <UtensilsCrossed className="w-3.5 h-3.5 text-zinc-400" />
                <span>Dine-in Menu</span>
              </div>
            )}

            {/* Returns & Order Help Button */}
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
              title="Return food, report quality issue, or request refund"
              aria-label="Return food or report issue"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Returns &amp; Help</span>
            </button>

            {/* Shopping Cart Header Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer flex items-center gap-2"
              title="View your order cart"
              aria-label="View your order cart"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-black flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search input */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search burgers, pizzas, coffee..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') onSearchChange('')
              }}
              className="w-full pl-10 pr-9 py-2 text-sm bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-amber-500 rounded-full focus:bg-white dark:focus:bg-black focus:outline-none transition-all placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-pointer transition-colors"
                title="Clear search (Esc)"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Food Returns & Help Modal */}
      <OrderHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </header>
  )
}
