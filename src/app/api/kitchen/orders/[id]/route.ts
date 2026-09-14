import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { updateOrderStatusSchema, formatZodError } from '@/lib/validations'

// PATCH /api/kitchen/orders/[id] - Update order status from kitchen
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    const allowedRoles = ['KITCHEN', 'JUICE_MAKER', 'WAITER', 'ADMIN']
    if (!session || !allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Staff access required.' }, { status: 401 })
    }

    const { id } = await context.params
    const rawBody = await request.json()
    const parsed = updateOrderStatusSchema.safeParse(rawBody)

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const { status } = parsed.data

    const updatedOrder = await db.order.update({
      where: { id },
      data: { status },
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
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    })
  } catch (error) {
    console.error('Error updating order status in kitchen:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
