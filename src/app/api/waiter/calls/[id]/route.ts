import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { WaiterCallStatus } from '@prisma/client'

interface RouteContext {
  params: Promise<{ id: string }>
}

// PATCH /api/waiter/calls/[id] - Update call status (ACKNOWLEDGED, RESOLVED, CANCELLED)
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession()
    const allowedRoles = ['WAITER', 'ADMIN', 'KITCHEN', 'JUICE_MAKER', 'DELIVERY']
    if (!session || !allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Staff access required.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status, resolvedBy } = body

    if (!status || !Object.values(WaiterCallStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid waiter call status.' },
        { status: 400 }
      )
    }

    const currentCall = await db.waiterCall.findUnique({
      where: { id },
    })

    if (!currentCall) {
      return NextResponse.json(
        { error: 'Waiter call not found.' },
        { status: 404 }
      )
    }

    const updateData: {
      status: WaiterCallStatus
      resolvedBy?: string | null
    } = {
      status,
    }

    if (resolvedBy !== undefined) {
      updateData.resolvedBy = resolvedBy
    } else if (status === WaiterCallStatus.ACKNOWLEDGED || status === WaiterCallStatus.RESOLVED) {
      updateData.resolvedBy = session.name || session.email || 'Waiter'
    }

    const updated = await db.waiterCall.update({
      where: { id },
      data: updateData,
      include: {
        table: { select: { id: true, number: true } },
        order: { select: { id: true, status: true } },
      },
    })

    return NextResponse.json({
      success: true,
      call: updated,
    })
  } catch (error) {
    console.error('Error updating waiter call:', error)
    return NextResponse.json(
      { error: 'Failed to update waiter call status' },
      { status: 500 }
    )
  }
}

// DELETE /api/waiter/calls/[id] - Cancel/Dismiss call
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSession()
    const { id } = await params

    // If staff session exists, allow delete
    // Or if customer wishes to cancel their pending call, allow cancellation
    const call = await db.waiterCall.findUnique({ where: { id } })
    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    if (!session) {
      // If customer cancels, only allow if still PENDING
      if (call.status !== WaiterCallStatus.PENDING) {
        return NextResponse.json(
          { error: 'Call is already being attended by staff' },
          { status: 400 }
        )
      }
    }

    await db.waiterCall.update({
      where: { id },
      data: { status: WaiterCallStatus.CANCELLED },
    })

    return NextResponse.json({ success: true, message: 'Call cancelled' })
  } catch (error) {
    console.error('Error deleting waiter call:', error)
    return NextResponse.json(
      { error: 'Failed to cancel call' },
      { status: 500 }
    )
  }
}
