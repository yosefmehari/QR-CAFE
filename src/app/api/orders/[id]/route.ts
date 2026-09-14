import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params

  try {
    const order = await db.order.findUnique({
      where: { id },
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
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: order.id,
      shortId: order.id.slice(-6).toUpperCase(),
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentReference: order.paymentReference,
      paymentScreenshot: order.paymentScreenshot,
      totalPrice: Number(order.totalPrice),
      notes: order.notes,
      tableNumber: order.table.number,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        emoji: item.product.category?.emoji || '🍽️',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        notes: item.notes,
      })),
    })
  } catch (error) {
    console.error('Failed to retrieve order status:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve order status from database' },
      { status: 500 }
    )
  }
}
