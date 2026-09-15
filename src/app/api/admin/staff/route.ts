import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET /api/admin/staff - List all staff accounts
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const staff = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Failed to fetch staff members' }, { status: 500 })
  }
}

// POST /api/admin/staff - Create new staff account
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role } = body

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    const existing = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (existing) {
      return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10)
    const allowedRoles = ['ADMIN', 'KITCHEN', 'JUICE_MAKER', 'WAITER', 'DELIVERY']
    const validRole = allowedRoles.includes(role) ? role : 'KITCHEN'

    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: validRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating staff member:', error)
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
  }
}
