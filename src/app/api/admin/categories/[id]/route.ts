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
    const { name, slug, emoji, sortOrder } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const updated = await db.category.update({
      where: { id },
      data: {
        name: name.trim(),
        slug: slug?.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        emoji: emoji?.trim() || null,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
      include: {
        _count: { select: { products: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Check if category has products
    const count = await db.product.count({
      where: { categoryId: id },
    })

    if (count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: category has ${count} product(s) linked to it. Please reassign or delete the products first.` },
        { status: 400 }
      )
    }

    await db.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
