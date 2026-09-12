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
    const body = await request.json()
    const { name, description, price, categoryId, isAvailable, imageUrl } = body

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (price !== undefined) updateData.price = Number(price)
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (isAvailable !== undefined) updateData.isAvailable = Boolean(isAvailable)
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null

    const updated = await db.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    })

    return NextResponse.json({
      ...updated,
      price: Number(updated.price),
    })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if product is referenced in order items
    const orderItemsCount = await db.orderItem.count({
      where: { productId: id },
    })

    if (orderItemsCount > 0) {
      // Instead of hard deleting and breaking past order history, mark as unavailable
      await db.product.update({
        where: { id },
        data: { isAvailable: false },
      })
      return NextResponse.json({
        success: true,
        message: 'Product has past order history. It has been marked as Unavailable instead of deleted to protect order receipts.',
      })
    }

    await db.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
