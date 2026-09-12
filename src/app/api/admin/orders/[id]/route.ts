import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { updateOrderStatusSchema, formatZodError } from '@/lib/validations'

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
    const { status, notes } = rawBody

    const data: any = {}
    if (status) {
      const parsed = updateOrderStatusSchema.safeParse({ status })
      if (!parsed.success) {
        return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
      }
      data.status = parsed.data.status
    }

    if (typeof notes === 'string') {
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
