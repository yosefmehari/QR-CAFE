import { db } from '@/lib/db'
import { requireAuth } from '@/lib/authGuard'
import AdminDashboardClient, { AdminStats } from '@/components/admin/AdminDashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Control Center | Aroma & Fork Cafe',
  description: 'Manage menu catalog, prices, categories, and physical QR tables.',
}

export const revalidate = 0

export default async function AdminPage() {
  // 1. Enforce ADMIN authentication
  const session = await requireAuth(['ADMIN'])

  // 2. Fetch real Categories from PostgreSQL
  const categories = await db.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  // 3. Fetch real Products from PostgreSQL
  const products = await db.product.findMany({
    include: {
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // 4. Fetch real Tables from PostgreSQL
  const tables = await db.table.findMany({
    include: {
      _count: {
        select: { orders: true },
      },
    },
    orderBy: { number: 'asc' },
  })

  // 5. Fetch real Order Stats from PostgreSQL
  const orders = await db.order.findMany({
    select: { totalPrice: true },
  })

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalPrice), 0)

  const stats: AdminStats = {
    totalOrders: orders.length,
    totalRevenue,
    totalProducts: products.length,
    totalCategories: categories.length,
    totalTables: tables.length,
    activeTables: tables.filter((t) => t.isActive).length,
  }

  // Serialize types for client component
  const serializedProducts = products.map((p) => ({
    ...p,
    price: Number(p.price),
  }))

  return (
    <AdminDashboardClient
      initialCategories={categories}
      initialProducts={serializedProducts}
      initialTables={tables}
      initialStats={stats}
      adminUser={{
        name: session.name,
        email: session.email,
        role: session.role,
      }}
    />
  )
}
