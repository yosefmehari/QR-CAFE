import { requireAuth } from '@/lib/authGuard'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import { Bike, ChefHat, CupSoda, Bell, ShieldCheck } from 'lucide-react'
import prisma from '@/lib/db'
import { OrderStatus } from '@prisma/client'
import DeliveryDisplayClient, { DeliveryOrder } from '@/components/delivery/DeliveryDisplayClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Delivery Courier Station | Aroma & Fork Cafe',
  description: 'Live order dispatch and notification station for delivery staff.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DeliveryDashboardPage() {
  // Allows DELIVERY courier and ADMIN users
  const session = await requireAuth(['DELIVERY', 'ADMIN'])

  // Fetch active delivery tickets
  const activeOrders = await prisma.order.findMany({
    where: {
      orderType: 'DELIVERY',
      status: {
        in: [
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
          OrderStatus.OUT_FOR_DELIVERY,
        ],
      },
    },
    include: {
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
      createdAt: 'asc', // FIFO: oldest first
    },
  })

  // Serialize Decimals and Dates for Client Component
  const initialOrders: DeliveryOrder[] = activeOrders.map((order) => ({
    id: order.id,
    status: order.status as DeliveryOrder['status'],
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
    table: null,
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
      {/* Top Delivery Navbar */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black">
              <Bike className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg text-white tracking-tight">
                  Delivery Courier Station
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-zinc-950">
                  {session.role === 'DELIVERY' ? 'Courier' : session.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Courier: {session.name} ({session.email})
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
                  Juice
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

      {/* Main Delivery Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <DeliveryDisplayClient initialOrders={initialOrders} courierName={session.name} />
      </main>
    </div>
  )
}
