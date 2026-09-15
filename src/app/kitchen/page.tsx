import { requireAuth } from '@/lib/authGuard'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import { ChefHat, CupSoda, Bell, ShieldCheck } from 'lucide-react'
import prisma from '@/lib/db'
import { OrderStatus } from '@prisma/client'
import KitchenDisplayClient, { KitchenOrder } from '@/components/kitchen/KitchenDisplayClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Kitchen Display System | Aroma & Fork Cafe',
  description: 'Live order fulfillment queue and preparation stepper for the kitchen team.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function KitchenDashboardPage() {
  // Allows both KITCHEN staff and ADMIN users
  const session = await requireAuth(['KITCHEN', 'ADMIN'])

  // Fetch initial active tickets directly from PostgreSQL
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
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc', // FIFO priority
    },
  })

  // Format Prisma Decimals and Dates for Client Component serialization
  const initialOrders: KitchenOrder[] = activeOrders.map((order) => ({
    id: order.id,
    status: order.status as KitchenOrder['status'],
    orderType: order.orderType,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    deliveryNotes: order.deliveryNotes,
    acceptedBy: order.acceptedBy,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentReference: order.paymentReference,
    totalPrice: order.totalPrice.toNumber(),
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    table: order.table
      ? {
          id: order.table.id,
          number: order.table.number,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      notes: item.notes,
      product: {
        id: item.product.id,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
      },
    })),
  }))

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Kitchen Navbar */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg text-white tracking-tight">
                  Kitchen Display System
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {session.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Station: {session.name} ({session.email})
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
                  href="/juice"
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 hover:bg-zinc-700 transition-colors"
                >
                  <CupSoda className="w-3.5 h-3.5 text-emerald-400" />
                  Juice Bar
                </Link>
                <Link
                  href="/waiter"
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 hover:bg-zinc-700 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5 text-blue-400" />
                  Waiter
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

      {/* Main KDS Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <KitchenDisplayClient initialOrders={initialOrders} />
      </main>
    </div>
  )
}
