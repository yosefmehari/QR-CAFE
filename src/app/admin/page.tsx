import { db } from '@/lib/db'
import { requireAuth } from '@/lib/authGuard'
import { isOwner } from '@/lib/owner'
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

  // 6. Fetch real Staff from PostgreSQL
  const isCurrentUserOwner = isOwner(session)

  const allStaff = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // The admin owner cannot be viewed by regular admins, but the owner can view all
  const staff = isCurrentUserOwner
    ? allStaff
    : allStaff.filter((s) => !isOwner(s))

  // Serialize types for client component
  const serializedProducts = products.map((p) => ({
    ...p,
    price: Number(p.price),
  }))

  const serializedStaff = staff.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }))

  // 7. Fetch Cafe Bank Settings
  let settings = await db.cafeSetting.findUnique({
    where: { id: 'default' },
  })

  if (!settings) {
    settings = await db.cafeSetting.create({
      data: {
        id: 'default',
        bankName: 'Commercial Bank of Ethiopia (CBE)',
        bankAccountNumber: '1000234567890',
        accountHolderName: 'Aroma & Fork Cafe LLC',
        telebirrNumber: '0911000000',
        paymentInstructions: 'Transfer the total order amount and enter the transaction confirmation code / receipt number below.',
      },
    })
  }

  const serializedSettings = {
    id: settings.id,
    bankName: settings.bankName,
    bankAccountNumber: settings.bankAccountNumber,
    accountHolderName: settings.accountHolderName,
    telebirrNumber: settings.telebirrNumber,
    paymentInstructions: settings.paymentInstructions,
  }

  return (
    <AdminDashboardClient
      initialCategories={categories}
      initialProducts={serializedProducts}
      initialTables={tables}
      initialStaff={serializedStaff}
      initialSettings={serializedSettings}
      initialStats={stats}
      adminUser={{
        id: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
      }}
    />
  )
}
