import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/admin/complaints/[id] - Update complaint status and staff resolution notes
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession()
    if (!session || !['ADMIN', 'KITCHEN', 'WAITER'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized. Staff access required.' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, staffNotes } = body

    const updateData: { status?: string; staffNotes?: string } = {}
    if (status) updateData.status = String(status).trim()
    if (staffNotes !== undefined) updateData.staffNotes = String(staffNotes).trim()

    const updated = await db.orderComplaint.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Complaint status updated',
      complaint: updated,
    })
  } catch (error) {
    console.error('Error updating complaint:', error)
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 })
  }
}
