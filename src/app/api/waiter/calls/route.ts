import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { WaiterCallStatus } from '@prisma/client'

// POST /api/waiter/calls - Customer requests a waiter to their table
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tableNumber, reason = 'ASSISTANCE', notes, orderId } = body

    const parsedTableNum = parseInt(String(tableNumber), 10)
    if (isNaN(parsedTableNum) || parsedTableNum <= 0) {
      return NextResponse.json(
        { error: 'Valid table number is required to call a waiter.' },
        { status: 400 }
      )
    }

    // Find the Table entity if registered
    const tableRecord = await db.table.findUnique({
      where: { number: parsedTableNum },
    })

    // Validate order if provided
    let validOrderId: string | null = null
    if (orderId && typeof orderId === 'string') {
      const orderRecord = await db.order.findUnique({
        where: { id: orderId },
        select: { id: true },
      })
      if (orderRecord) {
        validOrderId = orderRecord.id
      }
    }

    const cleanReason = String(reason || 'ASSISTANCE').trim().toUpperCase()
    const cleanNotes = notes && typeof notes === 'string' ? notes.trim() : null

    // Check if there is an existing pending call for this table within the last 90 seconds
    const recentCall = await db.waiterCall.findFirst({
      where: {
        tableNumber: parsedTableNum,
        status: WaiterCallStatus.PENDING,
        createdAt: {
          gte: new Date(Date.now() - 90 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (recentCall) {
      // If customer is just re-alerting or adding a note, update it
      const updated = await db.waiterCall.update({
        where: { id: recentCall.id },
        data: {
          reason: cleanReason,
          notes: cleanNotes || recentCall.notes,
          orderId: validOrderId || recentCall.orderId,
          tableId: tableRecord?.id || recentCall.tableId,
        },
        include: {
          table: { select: { id: true, number: true } },
          order: { select: { id: true, status: true } },
        },
      })

      return NextResponse.json({
        success: true,
        isExisting: true,
        message: `Waitstaff already notified for Table #${parsedTableNum}! Alert refreshed.`,
        call: updated,
      })
    }

    // Create new waiter call
    const call = await db.waiterCall.create({
      data: {
        tableNumber: parsedTableNum,
        tableId: tableRecord?.id || null,
        orderId: validOrderId,
        reason: cleanReason,
        notes: cleanNotes,
        status: WaiterCallStatus.PENDING,
      },
      include: {
        table: { select: { id: true, number: true } },
        order: { select: { id: true, status: true } },
      },
    })

    return NextResponse.json({
      success: true,
      message: `A floor waiter has been notified and is heading to Table #${parsedTableNum}!`,
      call,
    })
  } catch (error) {
    console.error('Error creating waiter call:', error)
    return NextResponse.json(
      { error: 'Failed to call waiter. Please request assistance in person.' },
      { status: 500 }
    )
  }
}

// GET /api/waiter/calls - Query active or historical waiter calls
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view') || 'active' // 'active' | 'history' | 'all'
    const tableParam = searchParams.get('tableNumber')
    const orderParam = searchParams.get('orderId')

    const tableNum = tableParam ? parseInt(tableParam, 10) : undefined

    // If query is for a specific table/order, public customer check is allowed
    const isCustomerQuery = Boolean(tableNum || orderParam)

    if (!isCustomerQuery) {
      const session = await getSession()
      const allowedRoles = ['WAITER', 'ADMIN', 'KITCHEN', 'JUICE_MAKER', 'DELIVERY']
      if (!session || !allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: 'Unauthorized. Staff access required.' },
          { status: 401 }
        )
      }
    }

    let statusFilter: WaiterCallStatus[] | undefined

    if (view === 'active') {
      statusFilter = [WaiterCallStatus.PENDING, WaiterCallStatus.ACKNOWLEDGED]
    } else if (view === 'history') {
      statusFilter = [WaiterCallStatus.RESOLVED, WaiterCallStatus.CANCELLED]
    }

    const calls = await db.waiterCall.findMany({
      where: {
        ...(statusFilter ? { status: { in: statusFilter } } : {}),
        ...(tableNum ? { tableNumber: tableNum } : {}),
        ...(orderParam ? { orderId: orderParam } : {}),
      },
      include: {
        table: { select: { id: true, number: true } },
        order: { select: { id: true, status: true, totalPrice: true } },
      },
      orderBy: {
        createdAt: view === 'history' ? 'desc' : 'asc', // FIFO for active, LIFO for history
      },
      take: view === 'history' ? 40 : 100,
    })

    return NextResponse.json({
      calls,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching waiter calls:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve waiter calls' },
      { status: 500 }
    )
  }
}
