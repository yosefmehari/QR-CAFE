import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Check, Utensils } from 'lucide-react'
import type { Metadata } from 'next'
import { getProductImage } from '@/lib/images'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await db.product.findUnique({
    where: { id },
    include: { category: true },
  })

  if (!product) {
    return { title: 'Product Not Found | QR Cafe' }
  }

  return {
    title: `${product.name} | QR Cafe Menu`,
    description: product.description || `Order ${product.name} fresh at QR Cafe.`,
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params

  const product = await db.product.findUnique({
    where: { id },
    include: { category: true },
  })

  if (!product) {
    notFound()
  }

  const priceFormatted = Number(product.price).toFixed(2)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Kitchen Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white dark:bg-zinc-900/90 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-xl shadow-zinc-200/40 dark:shadow-black/60">
          {/* Visual Header */}
          <div className="w-full h-72 sm:h-96 bg-zinc-950 relative overflow-hidden flex items-center justify-center">
            <img
              src={getProductImage(product.imageUrl, product.category?.slug)}
              alt={product.name}
              className="w-full h-full object-cover"
            />

            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10 pointer-events-none" />

            {product.category && (
              <span className="absolute top-6 left-6 px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-950/80 backdrop-blur-md text-white border border-white/10 shadow-sm">
                {product.category.name}
              </span>
            )}
            <span
              className={`absolute top-6 right-6 px-3.5 py-1.5 rounded-full text-xs font-bold ${
                product.isAvailable
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-rose-500 text-white shadow-sm'
              }`}
            >
              {product.isAvailable ? 'Available Now' : 'Sold Out'}
            </span>
          </div>

          {/* Details Section */}
          <div className="p-6 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                  {product.name}
                </h1>
                <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                  {product.description ||
                    'Crafted fresh with locally sourced premium ingredients, prepared on order.'}
                </p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs text-zinc-400 block font-medium">Price</span>
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                  ${priceFormatted}
                </span>
              </div>
            </div>

            {/* Preparation Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Artisan Quality</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Prepared by our in-house culinary and barista team upon order.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-1">
                  <Utensils className="w-4 h-4" />
                  <span>Dine-In Ready</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Direct table delivery using our contactless QR ordering flow.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-sm mb-1">
                  <Check className="w-4 h-4" />
                  <span>Dietary Flexibility</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Special preparation instructions supported at checkout.
                </p>
              </div>
            </div>

            {/* Back CTA Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                <span>Return to Menu to Order</span>
              </Link>
              <span className="text-xs text-zinc-400">
                Category: {product.category?.name || 'General'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
