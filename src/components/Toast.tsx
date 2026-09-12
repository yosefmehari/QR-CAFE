'use client'

import { useCart } from '@/context/CartContext'
import { CheckCircle2 } from 'lucide-react'

export default function Toast() {
  const { toastMessage } = useCart()

  if (!toastMessage) return null

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none animate-in slide-in-from-top-3 fade-in duration-200">
      <div className="bg-zinc-900/95 dark:bg-white/95 text-white dark:text-zinc-950 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-zinc-800 dark:border-zinc-200">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
        <span>{toastMessage}</span>
      </div>
    </div>
  )
}
