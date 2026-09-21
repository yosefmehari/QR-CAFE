import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { isOwner } from '@/lib/owner'
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
    const targetUser = await db.user.findUnique({
      where: { id },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    const isCurrentUserOwner = isOwner(session)
    const isTargetOwner = isOwner(targetUser)

    // Admin cannot view, modify, or reset password of the owner account
    if (isTargetOwner && !isCurrentUserOwner) {
      return NextResponse.json(
        { error: 'Unauthorized. Admins cannot view or modify the admin owner account.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, role, password } = body

    // Non-owner cannot rename someone to Owner
    if (!isCurrentUserOwner && name && isOwner({ name })) {
      return NextResponse.json(
        { error: 'Unauthorized. Only the owner can designate owner status.' },
        { status: 403 }
      )
    }

    const data: { name?: string; role?: 'ADMIN' | 'KITCHEN' | 'JUICE_MAKER' | 'WAITER' | 'DELIVERY'; password?: string } = {}

    if (name?.trim()) data.name = name.trim()
    if (['ADMIN', 'KITCHEN', 'JUICE_MAKER', 'WAITER', 'DELIVERY'].includes(role)) data.role = role
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

    const targetUser = await db.user.findUnique({
      where: { id },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Protect owner account from deletion by anyone
    if (isOwner(targetUser)) {
      return NextResponse.json(
        { error: 'The admin owner account is protected and cannot be deleted.' },
        { status: 403 }
      )
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
