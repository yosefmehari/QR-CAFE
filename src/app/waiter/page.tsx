import { requireAuth } from '@/lib/authGuard'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import { Bell, ChefHat, CupSoda, ShieldCheck } from 'lucide-react'
import prisma from '@/lib/db'
import { OrderStatus } from '@prisma/client'
import WaiterDisplayClient, { WaiterOrder } from '@/components/waiter/WaiterDisplayClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Waiter Floor & Delivery Service | Aroma & Fork Cafe',
  description: 'Floor management and live table delivery queue for cafe waitstaff.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WaiterDashboardPage() {
  // Allows both WAITER staff and ADMIN users
  const session = await requireAuth(['WAITER', 'ADMIN'])

  // Fetch all active dining tables
  const tables = await prisma.table.findMany({
    where: { isActive: true },
    orderBy: { number: 'asc' },
    select: {
      id: true,
      number: true,
      isActive: true,
    },
  })

  // Fetch active tickets
  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        in: [
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
        ],
      },
    },
    include: {
      table: {
        select: {
          id: true,
          number: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              category: {
                select: {
                  name: true,
                  slug: true,
                  emoji: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc', // FIFO
    },
  })

  // Serialize Decimals and Dates
  const initialOrders: WaiterOrder[] = activeOrders.map((order) => ({
    id: order.id,
    status: order.status as WaiterOrder['status'],
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentReference: order.paymentReference,
    totalPrice: order.totalPrice.toNumber(),
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    table: {
      id: order.table.id,
      number: order.table.number,
    },
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      notes: item.notes,
      product: {
        id: item.product.id,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
        category: item.product.category
          ? {
              name: item.product.category.name,
              slug: item.product.category.slug,
              emoji: item.product.category.emoji,
            }
          : null,
      },
    })),
  }))

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Waiter Navbar */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 font-black">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg text-white tracking-tight">
                  Waiter Floor &amp; Service
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {session.role === 'WAITER' ? 'Waiter' : session.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Staff: {session.name} ({session.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {session.role === 'ADMIN' && (
              <div className="hidden md:flex items-center gap-1.5 bg-zinc-800/80 p-1 rounded-2xl border border-zinc-700/60">
                <Link
                  href="/admin"
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 hover:bg-zinc-700 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Admin
                </Link>
                <Link
                  href="/kitchen"
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 hover:bg-zinc-700 transition-colors"
                >
                  <ChefHat className="w-3.5 h-3.5 text-orange-400" />
                  Kitchen
                </Link>
                <Link
                  href="/juice"
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 hover:bg-zinc-700 transition-colors"
                >
                  <CupSoda className="w-3.5 h-3.5 text-emerald-400" />
                  Juice Bar
                </Link>
              </div>
            )}
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 border border-zinc-700 transition-colors hidden sm:inline-block"
            >
              Customer Menu
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Waiter Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <WaiterDisplayClient initialOrders={initialOrders} tables={tables} />
      </main>
    </div>
  )
}
