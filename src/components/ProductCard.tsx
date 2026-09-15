'use client'

import { Plus, Eye } from 'lucide-react'
import type { ProductItem } from '@/lib/types'

interface ProductCardProps {
  product: ProductItem
  onOpenDetails: (product: ProductItem) => void
}

export default function ProductCard({ product, onOpenDetails }: ProductCardProps) {
  const formattedPrice =
    typeof product.price === 'number'
      ? product.price.toFixed(2)
      : parseFloat(String(product.price)).toFixed(2)

  // Curated category badge gradients for premium visual aesthetics
  const getGradientForCategory = (slug?: string) => {
    switch (slug) {
      case 'burgers':
        return 'from-amber-500/15 via-orange-500/10 to-red-500/5 text-amber-800 dark:text-amber-300'
      case 'pizza':
        return 'from-red-500/15 via-orange-500/10 to-yellow-500/5 text-red-800 dark:text-red-300'
      case 'drinks':
        return 'from-sky-500/15 via-blue-500/10 to-cyan-500/5 text-sky-800 dark:text-sky-300'
      case 'coffee':
        return 'from-amber-700/15 via-stone-600/10 to-amber-900/5 text-amber-900 dark:text-amber-200'
      case 'desserts':
        return 'from-pink-500/15 via-rose-500/10 to-purple-500/5 text-pink-800 dark:text-pink-300'
      default:
        return 'from-zinc-500/10 to-zinc-500/5 text-zinc-700 dark:text-zinc-300'
    }
  }

  const categorySlug = product.category?.slug

  return (
    <article
      onClick={() => onOpenDetails(product)}
      className="group relative flex flex-col bg-white dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 p-4 sm:p-5 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Visual Header / Banner */}
      <div className="w-full h-40 sm:h-48 rounded-2xl bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden mb-4">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${getGradientForCategory(
              categorySlug
            )} flex flex-col items-center justify-center`}
          >
            <span className="text-4xl sm:text-5xl select-none filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
              {product.category?.emoji || '🍽️'}
            </span>
          </div>
        )}

        {/* Soft bottom vignette for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Category tag pill */}
        {product.category && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-950/70 backdrop-blur-md border border-white/10 text-white flex items-center gap-1.5 shadow-sm">
            <span>{product.category.name}</span>
          </div>
        )}

        {/* Availability status */}
        {!product.isAvailable && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs">
            Sold Out
          </div>
        )}

        {/* Quick view hover button overlay */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 text-xs font-bold text-zinc-900 dark:text-zinc-100 shadow-xl">
            <Eye className="w-3.5 h-3.5" /> View Photo &amp; Details
          </span>
        </div>
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {product.description || 'Prepared fresh upon ordering with premium quality ingredients.'}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">Price</span>
            <span className="text-base sm:text-lg font-black text-zinc-950 dark:text-zinc-50">
              ${formattedPrice}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenDetails(product)
            }}
            disabled={!product.isAvailable}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-white transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>
        </div>
      </div>
    </article>
  )
}
