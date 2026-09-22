import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { OrderStatus, Prisma } from '@prisma/client'

// GET /api/admin/orders - Full orders list with filtering & pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as OrderStatus | null
    const paymentStatus = searchParams.get('paymentStatus') as 'PAID' | 'PENDING' | 'REFUNDED' | null
    const tableNumber = searchParams.get('table')
    const search = searchParams.get('search')
    const orderType = searchParams.get('orderType') as 'DINE_IN' | 'DELIVERY' | null
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const where: Prisma.OrderWhereInput = {}

    if (orderType && ['DINE_IN', 'DELIVERY'].includes(orderType)) {
      where.orderType = orderType
    }

    if (status && Object.values(OrderStatus).includes(status)) {
      where.status = status
    }

    if (paymentStatus && ['PAID', 'PENDING', 'REFUNDED'].includes(paymentStatus)) {
      where.paymentStatus = paymentStatus
    }

    if (tableNumber) {
      const num = parseInt(tableNumber, 10)
      if (!isNaN(num)) {
        where.table = { number: num }
      }
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim()
      const searchNum = parseInt(cleanSearch.replace(/\D/g, ''), 10)

      const orConditions: Prisma.OrderWhereInput[] = [
        { id: { contains: cleanSearch, mode: 'insensitive' } },
        { notes: { contains: cleanSearch, mode: 'insensitive' } },
        { paymentReference: { contains: cleanSearch, mode: 'insensitive' } },
        { customerName: { contains: cleanSearch, mode: 'insensitive' } },
        { customerPhone: { contains: cleanSearch, mode: 'insensitive' } },
        { deliveryAddress: { contains: cleanSearch, mode: 'insensitive' } },
        {
          items: {
            some: {
              product: {
                name: { contains: cleanSearch, mode: 'insensitive' },
              },
            },
          },
        },
      ]

      if (!isNaN(searchNum) && searchNum > 0) {
        orConditions.push({ table: { number: searchNum } })
      }

      where.OR = orConditions
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
        complaints: {
          orderBy: { createdAt: 'desc' },
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
      orderType: o.orderType,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      deliveryAddress: o.deliveryAddress,
      deliveryNotes: o.deliveryNotes,
      acceptedBy: o.acceptedBy,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      paymentReference: o.paymentReference,
      paymentScreenshot: o.paymentScreenshot,
      totalPrice: Number(o.totalPrice),
      notes: o.notes,
      complaints: (o.complaints || []).map((c) => ({
        id: c.id,
        category: c.category,
        items: c.items,
        details: c.details,
        desiredAction: c.desiredAction,
        status: c.status,
        staffNotes: c.staffNotes,
        createdAt: c.createdAt.toISOString(),
      })),
      createdAt: o.createdAt.toISOString(),
      table: o.table
        ? {
            id: o.table.id,
            number: o.table.number,
          }
        : null,
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
