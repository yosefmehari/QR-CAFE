import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { OrderStatus } from '@prisma/client'

// GET /api/admin/orders - Full orders list with filtering & pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as OrderStatus | null
    const tableNumber = searchParams.get('table')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const where: any = {}

    if (status && Object.values(OrderStatus).includes(status)) {
      where.status = status
    }

    if (tableNumber) {
      const num = parseInt(tableNumber, 10)
      if (!isNaN(num)) {
        where.table = { number: num }
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    const orders = await db.order.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const serializedOrders = orders.map((o) => ({
      id: o.id,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      paymentReference: o.paymentReference,
      totalPrice: Number(o.totalPrice),
      notes: o.notes,
      createdAt: o.createdAt.toISOString(),
      table: {
        id: o.table.id,
        number: o.table.number,
      },
      items: o.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        notes: i.notes,
        product: {
          id: i.product.id,
          name: i.product.name,
          imageUrl: i.product.imageUrl,
        },
      })),
    }))

    return NextResponse.json({ orders: serializedOrders })
  } catch (error) {
    console.error('Error fetching admin orders:', error)
    return NextResponse.json({ error: 'Failed to retrieve orders' }, { status: 500 })
  }
}
