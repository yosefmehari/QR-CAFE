import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// PATCH /api/admin/staff/[id] - Update staff role or reset password
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
    const body = await request.json()
    const { name, role, password } = body

    const data: { name?: string; role?: 'ADMIN' | 'KITCHEN' | 'JUICE_MAKER' | 'WAITER'; password?: string } = {}

    if (name?.trim()) data.name = name.trim()
    if (['ADMIN', 'KITCHEN', 'JUICE_MAKER', 'WAITER'].includes(role)) data.role = role
    if (password?.trim()) {
      data.password = await bcrypt.hash(password.trim(), 10)
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating staff member:', error)
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 })
  }
}

// DELETE /api/admin/staff/[id] - Delete a staff member
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
    }

    const { id } = await context.params

    if (session.userId === id) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }

    await db.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Staff member deleted successfully' })
  } catch (error) {
    console.error('Error deleting staff member:', error)
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 })
  }
}
