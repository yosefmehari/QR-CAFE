import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import OrderTrackerClient, { TrackedOrder } from '@/components/OrderTrackerClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ orderId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params
  return {
    title: `Order #${orderId.slice(-6).toUpperCase()} Live Tracking | Aroma & Fork`,
    description: 'Track the live preparation and delivery status of your order.',
  }
}

export const revalidate = 0

export default async function OrderPage({ params }: Props) {
  const { orderId } = await params

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      table: true,
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    notFound()
  }

  const initialTrackedOrder: TrackedOrder = {
    id: order.id,
    shortId: order.id.slice(-6).toUpperCase(),
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentReference: order.paymentReference,
    totalPrice: Number(order.totalPrice),
    notes: order.notes,
    tableNumber: order.table.number,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.product.name,
      emoji: item.product.category?.emoji || '🍽️',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      notes: item.notes,
    })),
  }

  return <OrderTrackerClient initialOrder={initialTrackedOrder} />
}
