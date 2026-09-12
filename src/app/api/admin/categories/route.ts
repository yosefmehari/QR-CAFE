import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createCategorySchema, formatZodError } from '@/lib/validations'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const categories = await db.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody = await request.json()
    const parsed = createCategorySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const { name, slug, emoji, sortOrder } = parsed.data

    const generatedSlug = (slug?.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'))

    // Check unique name / slug
    const existing = await db.category.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug: generatedSlug }],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name or slug already exists' },
        { status: 400 }
      )
    }

    const newCategory = await db.category.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        emoji: emoji?.trim() || null,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
      include: {
        _count: { select: { products: true } },
      },
    })

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
