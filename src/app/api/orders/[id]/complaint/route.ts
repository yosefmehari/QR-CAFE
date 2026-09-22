import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/orders/[id]/complaint - Customer reports an issue or food complaint
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id: orderId } = await params

  try {
    const body = await request.json()
    const { category, items, details, desiredAction, customerPhone } = body

    if (!category || !details || typeof details !== 'string' || !details.trim()) {
      return NextResponse.json(
        { error: 'Please specify the complaint category and provide a brief description of the issue.' },
        { status: 400 }
      )
    }

    // Verify order exists
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Create complaint record
    const complaint = await db.orderComplaint.create({
      data: {
        orderId,
        category: String(category).trim(),
        items: items ? String(items).trim() : null,
        details: String(details).trim(),
        desiredAction: desiredAction ? String(desiredAction).trim() : 'REMAKE',
        status: 'PENDING',
      },
    })

    // Optionally update customer phone on order if provided and not set
    if (customerPhone && !order.customerPhone) {
      await db.order.update({
        where: { id: orderId },
        data: { customerPhone: String(customerPhone).trim() },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Your issue has been reported to the kitchen and floor staff. We will resolve it right away!',
      complaint: {
        id: complaint.id,
        category: complaint.category,
        items: complaint.items,
        details: complaint.details,
        desiredAction: complaint.desiredAction,
        status: complaint.status,
        createdAt: complaint.createdAt,
      },
    })
  } catch (error) {
    console.error('Error submitting order complaint:', error)
    return NextResponse.json(
      { error: 'Failed to record complaint. Please inform staff directly.' },
      { status: 500 }
    )
  }
}

// GET /api/orders/[id]/complaint - Fetch current complaints for the order
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id: orderId } = await params

  try {
    const complaints = await db.orderComplaint.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ complaints })
  } catch (error) {
    console.error('Error fetching complaints:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve complaints' },
      { status: 500 }
    )
  }
}
