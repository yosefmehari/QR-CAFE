import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders/lookup?query=... or ?table=... or ?orderId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('query') || '').trim()
  const tableParam = searchParams.get('table')
  const orderIdParam = searchParams.get('orderId')

  try {
    let order = null

    // 1. If explicit orderId provided
    if (orderIdParam) {
      order = await db.order.findUnique({
        where: { id: orderIdParam },
        include: {
          table: true,
          complaints: { orderBy: { createdAt: 'desc' } },
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      })
    }

    // 2. If table provided
    if (!order && tableParam) {
      const tableNum = parseInt(tableParam, 10)
      if (!isNaN(tableNum) && tableNum > 0) {
        order = await db.order.findFirst({
          where: {
            table: { number: tableNum },
          },
          orderBy: { createdAt: 'desc' },
          include: {
            table: true,
            complaints: { orderBy: { createdAt: 'desc' } },
            items: {
              include: {
                product: {
                  include: { category: true },
                },
              },
            },
          },
        })
      }
    }

    // 3. If generic search query provided
    if (!order && query) {
      // Check exact ID match
      order = await db.order.findUnique({
        where: { id: query },
        include: {
          table: true,
          complaints: { orderBy: { createdAt: 'desc' } },
          items: {
            include: {
              product: {
                include: { category: true },
              },
            },
          },
        },
      })

      // Check ID endsWith (shortId)
      if (!order) {
        order = await db.order.findFirst({
          where: {
            id: {
              endsWith: query,
              mode: 'insensitive',
            },
          },
          orderBy: { createdAt: 'desc' },
          include: {
            table: true,
            complaints: { orderBy: { createdAt: 'desc' } },
            items: {
              include: {
                product: {
                  include: { category: true },
                },
              },
            },
          },
        })
      }

      // Check Table number match
      if (!order) {
        const num = parseInt(query.replace(/\D/g, ''), 10)
        if (!isNaN(num) && num > 0) {
          order = await db.order.findFirst({
            where: {
              table: { number: num },
            },
            orderBy: { createdAt: 'desc' },
            include: {
              table: true,
              complaints: { orderBy: { createdAt: 'desc' } },
              items: {
                include: {
                  product: {
                    include: { category: true },
                  },
                },
              },
            },
          })
        }
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found. Please verify your order number or table number.' }, { status: 404 })
    }

    return NextResponse.json({
      id: order.id,
      shortId: order.id.slice(-6).toUpperCase(),
      status: order.status,
      orderType: order.orderType,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      deliveryAddress: order.deliveryAddress,
      deliveryNotes: order.deliveryNotes,
      acceptedBy: order.acceptedBy,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentReference: order.paymentReference,
      paymentScreenshot: order.paymentScreenshot,
      totalPrice: Number(order.totalPrice),
      notes: order.notes,
      tableNumber: order.table ? order.table.number : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      complaints: order.complaints || [],
      items: order.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
        emoji: item.product.category?.emoji || '🍽️',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        notes: item.notes,
      })),
    })
  } catch (error) {
    console.error('Error looking up order:', error)
    return NextResponse.json({ error: 'Failed to look up order' }, { status: 500 })
  }
}
