import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createProductSchema, formatZodError } from '@/lib/validations'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const products = await db.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    products.map((p) => ({
      ...p,
      price: Number(p.price),
    }))
  )
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody = await request.json()
    const parsed = createProductSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const { name, description, price, categoryId, isAvailable, imageUrl } = parsed.data

    const newProduct = await db.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price,
        categoryId,
        isAvailable: isAvailable !== false,
        imageUrl: imageUrl?.trim() || null,
      },
      include: { category: true },
    })

    return NextResponse.json(
      {
        ...newProduct,
        price: Number(newProduct.price),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
