import { db } from '@/lib/db'
import MenuFeed from '@/components/MenuFeed'
import type { CategoryWithProducts, ProductItem } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QR Cafe Menu | Fresh Handcrafted Food & Drinks',
  description: 'Explore our artisan bistro menu. Handcrafted burgers, fresh stone-baked pizza, specialty coffee, and decadent desserts.',
}

// Ensure the page gets fresh database updates
export const revalidate = 0

export default async function HomePage() {
  // Fetch real categories and their products from PostgreSQL
  const categoriesDb = await db.category.findMany({
    include: {
      products: {
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  // Fetch all products with their parent category info
  const allProductsDb = await db.product.findMany({
    include: {
      category: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Serialize Prisma Decimal types to numbers for Client Component compatibility
  const categories: CategoryWithProducts[] = categoriesDb.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    emoji: cat.emoji,
    sortOrder: cat.sortOrder,
    products: cat.products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      imageUrl: p.imageUrl,
      isAvailable: p.isAvailable,
      categoryId: p.categoryId,
    })),
  }))

  const allProducts: ProductItem[] = allProductsDb.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    imageUrl: p.imageUrl,
    isAvailable: p.isAvailable,
    categoryId: p.categoryId,
    category: p.category
      ? {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
          emoji: p.category.emoji,
        }
      : undefined,
  }))

  return <MenuFeed categories={categories} allProducts={allProducts} />
}
