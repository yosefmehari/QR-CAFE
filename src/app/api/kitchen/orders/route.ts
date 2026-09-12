import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { OrderStatus } from '@prisma/client'

// GET /api/kitchen/orders - Fetch kitchen orders stream
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'KITCHEN' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Kitchen access required.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'active' // 'active' | 'history' | 'all'

    let statusFilter: OrderStatus[] | undefined

    if (view === 'active') {
      statusFilter = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
      ]
    } else if (view === 'history') {
      statusFilter = [OrderStatus.SERVED, OrderStatus.CANCELLED]
    }

    const orders = await db.order.findMany({
      where: statusFilter ? { status: { in: statusFilter } } : undefined,
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
        // Active orders: FIFO (oldest first so longest waiting is at top)
        // History orders: LIFO (newest first)
        createdAt: view === 'history' ? 'desc' : 'asc',
      },
      take: view === 'history' ? 40 : 100,
    })

    return NextResponse.json({
      orders,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching kitchen orders:', error)
    return NextResponse.json({ error: 'Failed to retrieve kitchen orders' }, { status: 500 })
  }
}
