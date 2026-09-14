import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { updateOrderStatusSchema, formatZodError } from '@/lib/validations'
import { Prisma } from '@prisma/client'

// PATCH /api/admin/orders/[id] - Update order status or details
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const { id } = await context.params
    const rawBody = await request.json()
    const parsed = updateOrderStatusSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const { status, paymentStatus, paymentReference, notes } = parsed.data
    const data: Prisma.OrderUpdateInput = {}

    if (status) {
      data.status = status
    }

    if (paymentStatus) {
      data.paymentStatus = paymentStatus
      // If admin marks payment as verified/PAID and status is PENDING, auto confirm the order
      if (paymentStatus === 'PAID' && !status) {
        data.status = 'CONFIRMED'
      }
    }

    if (paymentReference !== undefined) {
      data.paymentReference = paymentReference
    }

    if (notes !== undefined) {
      data.notes = notes
    }

    const updated = await db.order.update({
      where: { id },
      data,
      include: {
        table: { select: { id: true, number: true } },
        items: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Order updated successfully',
      order: {
        ...updated,
        totalPrice: Number(updated.totalPrice),
      },
    })
  } catch (error) {
    console.error('Error updating admin order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
