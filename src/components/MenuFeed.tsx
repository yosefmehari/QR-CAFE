'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import TableBanner from '@/components/TableBanner'
import CategoryNav from '@/components/CategoryNav'
import ProductCard from '@/components/ProductCard'
import ProductModal from '@/components/ProductModal'
import CartDrawer from '@/components/CartDrawer'
import FloatingCartBar from '@/components/FloatingCartBar'
import ActiveOrderBadge from '@/components/ActiveOrderBadge'
import { Sparkles, Frown, RefreshCw } from 'lucide-react'
import type { CategoryWithProducts, ProductItem } from '@/lib/types'

interface MenuFeedProps {
  categories: CategoryWithProducts[]
  allProducts: ProductItem[]
}

export default function MenuFeed({ categories, allProducts }: MenuFeedProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null)
  const [tableNumber, setTableNumber] = useState<number | null>(null)

  // Sync table number from URL query parameter or localStorage
  useEffect(() => {
    queueMicrotask(() => {
      const tableParam = searchParams.get('table')
      if (tableParam) {
        const parsed = parseInt(tableParam, 10)
        if (!isNaN(parsed) && parsed > 0) {
          setTableNumber(parsed)
          if (typeof window !== 'undefined') {
            localStorage.setItem('qr_cafe_table_number', String(parsed))
            document.cookie = `qr_cafe_table_number=${parsed}; path=/; max-age=86400; SameSite=Lax`
          }
          return
        }
      }

      // Fallback to local storage if no query param
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('qr_cafe_table_number')
        if (stored) {
          const parsed = parseInt(stored, 10)
          if (!isNaN(parsed) && parsed > 0) {
            setTableNumber(parsed)
          }
        }
      }
    })
  }, [searchParams])

  const handleClearTable = () => {
    setTableNumber(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qr_cafe_table_number')
      document.cookie = 'qr_cafe_table_number=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    // Remove ?table= from URL
    router.replace('/')
  }

  // Handle search text change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    if (query.trim().length > 0 && activeCategory !== 'all') {
      setActiveCategory('all')
    }
  }

  // Compute products per category count for the category tabs
  const categoriesWithCounts = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase()
    const terms = cleanQuery.split(/\s+/).filter(Boolean)

    return categories.map((cat) => {
      const count =
        terms.length === 0
          ? cat.products.length
          : cat.products.filter((p) =>
              terms.every(
                (term) =>
                  p.name.toLowerCase().includes(term) ||
                  (p.description && p.description.toLowerCase().includes(term))
              )
            ).length

      return {
        ...cat,
        productCount: count,
      }
    })
  }, [categories, searchQuery])

  // Filter products by both category and search query
  const filteredProducts = useMemo(() => {
    const cleanQuery = searchQuery.trim().toLowerCase()
    const terms = cleanQuery.split(/\s+/).filter(Boolean)

    return allProducts.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.category?.slug === activeCategory

      const matchesSearch =
        terms.length === 0 ||
        terms.every((term) =>
          item.name.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term)) ||
          (item.category && item.category.name.toLowerCase().includes(term)) ||
          (item.category && item.category.slug.toLowerCase().includes(term))
        )

      return matchesCategory && matchesSearch
    })
  }, [allProducts, activeCategory, searchQuery])

  // Find active category label
  const currentCategoryObj = categories.find((c) => c.slug === activeCategory)

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* 1. Table Seating Banner (Phase 4) */}
      <TableBanner
        tableNumber={tableNumber}
        onClearTable={handleClearTable}
      />

      {/* 2. Sticky Navigation Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        tableNumber={tableNumber}
      />

      {/* 3. Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-transparent to-transparent py-8 sm:py-12 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {tableNumber
                  ? `Dine-In Active • Table #${tableNumber}`
                  : 'Table-Side Digital Ordering'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-[1.15]">
              Freshly crafted flavors, delivered right to your table.
            </h1>
            <p className="mt-3 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Browse our handcrafted menu items below. Made fresh to order with artisanal ingredients and roasted daily specialty coffee.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Sticky Categories Bar */}
      <CategoryNav
        categories={categoriesWithCounts}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        totalProductsCount={allProducts.length}
      />

      {/* 5. Main Menu Feed */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Section Heading & Result count */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>
                {searchQuery.trim()
                  ? `Search: "${searchQuery}"`
                  : activeCategory === 'all'
                  ? 'All Menu Items'
                  : `${currentCategoryObj?.emoji || ''} ${currentCategoryObj?.name || 'Category'}`}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Showing {filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>

          {(activeCategory !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all')
                setSearchQuery('')
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset filters</span>
            </button>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetails={setSelectedProduct}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 my-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-4">
              <Frown className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
              No menu items match your search
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
              We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Try searching for another ingredient or reset your filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all')
                setSearchQuery('')
              }}
              className="mt-5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 cursor-pointer transition-all"
            >
              Show All Menu Items
            </button>
          </div>
        )}
      </main>

      {/* 6. Product Details Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* 7. Slide-over Cart Drawer */}
      <CartDrawer currentTableNumber={tableNumber} />

      {/* 8. Floating Bottom Cart Summary Bar */}
      <FloatingCartBar />

      {/* 9. Floating Active Order Live Tracker Badge */}
      <ActiveOrderBadge />

      {/* 10. Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} QR Cafe & Bistro. Built with Next.js & PostgreSQL.</p>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            <Link href="/complaint" className="text-rose-600 dark:text-rose-400 font-bold hover:underline">
              Return Food / Complain
            </Link>
            <span>•</span>
            <Link href="/tables" className="text-amber-600 font-medium hover:underline">
              View Table QR Directory
            </Link>
            <span>•</span>
            <span>Table #{tableNumber || 'Unassigned'}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
