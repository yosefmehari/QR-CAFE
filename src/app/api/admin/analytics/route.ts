import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { OrderStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    // 1. Fetch all orders with minimal fields for fast aggregation
    const orders = await db.order.findMany({
      select: {
        id: true,
        status: true,
        totalPrice: true,
        createdAt: true,
        table: {
          select: {
            number: true,
          },
        },
      },
    })

    const totalOrders = orders.length
    const nonCancelledOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED)
    const servedOrders = orders.filter((o) => o.status === OrderStatus.SERVED)

    const totalRevenue = nonCancelledOrders.reduce(
      (sum, o) => sum + Number(o.totalPrice),
      0
    )

    const aov = nonCancelledOrders.length > 0 ? totalRevenue / nonCancelledOrders.length : 0

    // Today's orders
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= startOfToday)
    const todayRevenue = todayOrders
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + Number(o.totalPrice), 0)

    // Status distribution
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      PREPARING: 0,
      READY: 0,
      SERVED: 0,
      CANCELLED: 0,
    }
    orders.forEach((o) => {
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++
      }
    })

    // Table activity
    const tableActivityMap: Record<number, number> = {}
    orders.forEach((o) => {
      const num = o.table.number
      tableActivityMap[num] = (tableActivityMap[num] || 0) + 1
    })

    const tableRankings = Object.entries(tableActivityMap)
      .map(([num, count]) => ({ tableNumber: Number(num), orderCount: count }))
      .sort((a, b) => b.orderCount - a.orderCount)

    // Top selling products
    const orderItems = await db.orderItem.findMany({
      where: {
        order: {
          status: { not: OrderStatus.CANCELLED },
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
          },
        },
      },
    })

    const productSalesMap: Record<
      string,
      { id: string; name: string; imageUrl?: string | null; quantity: number; revenue: number }
    > = {}

    orderItems.forEach((item) => {
      const pId = item.product.id
      const qty = item.quantity
      const rev = Number(item.unitPrice) * qty

      if (!productSalesMap[pId]) {
        productSalesMap[pId] = {
          id: pId,
          name: item.product.name,
          imageUrl: item.product.imageUrl,
          quantity: 0,
          revenue: 0,
        }
      }
      productSalesMap[pId].quantity += qty
      productSalesMap[pId].revenue += rev
    })

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    return NextResponse.json({
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        todayOrdersCount: todayOrders.length,
        totalOrders,
        servedOrdersCount: servedOrders.length,
        cancelledOrdersCount: statusCounts.CANCELLED || 0,
        averageOrderValue: Math.round(aov * 100) / 100,
      },
      statusCounts,
      tableRankings,
      topProducts,
    })
  } catch (error) {
    console.error('Error computing cafe analytics:', error)
    return NextResponse.json({ error: 'Failed to compute cafe analytics' }, { status: 500 })
  }
}
