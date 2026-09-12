'use client'

interface Category {
  id: string
  name: string
  slug: string
  emoji: string | null
  productCount?: number
}

interface CategoryNavProps {
  categories: Category[]
  activeCategory: string
  onSelectCategory: (slug: string) => void
  totalProductsCount: number
}

export default function CategoryNav({
  categories,
  activeCategory,
  onSelectCategory,
  totalProductsCount,
}: CategoryNavProps) {
  return (
    <nav aria-label="Menu categories" className="sticky top-16 sm:top-20 z-20 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 py-3 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1 -mb-1">
          {/* "All" button */}
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 shadow-sm shadow-zinc-900/10'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <span>✨ All</span>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
                activeCategory === 'all'
                  ? 'bg-white/20 text-white dark:bg-black/15 dark:text-zinc-900'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {totalProductsCount}
            </span>
          </button>

          {/* Individual Category buttons */}
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
                {typeof cat.productCount === 'number' && (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {cat.productCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
