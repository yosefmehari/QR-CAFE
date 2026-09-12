import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createTableSchema, formatZodError } from '@/lib/validations'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tables = await db.table.findMany({
    include: {
      _count: {
        select: { orders: true },
      },
    },
    orderBy: { number: 'asc' },
  })

  return NextResponse.json(tables)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rawBody = await request.json()
    const parsed = createTableSchema.safeParse({
      ...rawBody,
      number: typeof rawBody.number === 'string' ? parseInt(rawBody.number, 10) : rawBody.number,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const { number: tableNumber, isActive } = parsed.data

    // Check if table number already exists
    const existing = await db.table.findUnique({
      where: { number: tableNumber },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Table #${tableNumber} already exists` },
        { status: 400 }
      )
    }

    const newTable = await db.table.create({
      data: {
        number: tableNumber,
        isActive: isActive !== false,
      },
      include: {
        _count: { select: { orders: true } },
      },
    })

    return NextResponse.json(newTable, { status: 201 })
  } catch (error) {
    console.error('Create table error:', error)
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
  }
}
