'use client'

import { useCart } from '@/context/CartContext'
import { ShoppingBag, ArrowRight } from 'lucide-react'

export default function FloatingCartBar() {
  const { items, totalCount, totalPrice, openCart } = useCart()

  if (items.length === 0) return null

  return (
    <aside aria-label="Current Order summary" className="fixed bottom-5 left-0 right-0 z-30 px-4 pointer-events-none animate-in slide-in-from-bottom-5 duration-200">
      <div className="max-w-xl mx-auto pointer-events-auto">
        <button
          type="button"
          onClick={openCart}
          className="w-full bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 p-3.5 sm:p-4 rounded-3xl shadow-2xl shadow-zinc-900/40 dark:shadow-black/70 flex items-center justify-between gap-4 border border-zinc-800 dark:border-zinc-300 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center relative shadow-sm">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-zinc-950 dark:border-zinc-100">
                {totalCount}
              </span>
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-600">
                Current Order
              </div>
              <div className="text-sm sm:text-base font-black tracking-tight">
                {totalCount} item{totalCount === 1 ? '' : 's'} • ${totalPrice.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 text-white font-bold text-xs sm:text-sm group-hover:bg-amber-600 transition-colors">
            <span>View Cart</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </aside>
  )
}
