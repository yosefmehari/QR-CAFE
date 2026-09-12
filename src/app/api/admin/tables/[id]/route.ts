import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const { number, isActive } = await request.json()
    const updateData: Record<string, unknown> = {}

    if (number !== undefined) updateData.number = parseInt(String(number), 10)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const updated = await db.table.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { orders: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update table error:', error)
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const ordersCount = await db.order.count({
      where: { tableId: id },
    })

    if (ordersCount > 0) {
      // Deactivate instead of deleting to preserve order history
      await db.table.update({
        where: { id },
        data: { isActive: false },
      })
      return NextResponse.json({
        success: true,
        message: `Table has ${ordersCount} past order(s). It has been marked as Inactive instead of deleted to preserve receipts.`,
      })
    }

    await db.table.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Table deleted successfully' })
  } catch (error) {
    console.error('Delete table error:', error)
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
  }
}
