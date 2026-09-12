import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createOrderSchema, formatZodError } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json()

    // 1. Zod Schema Validation
    const parsed = createOrderSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      )
    }

    const { tableNumber, notes, items, paymentMethod, cardDetails } = parsed.data

    // 2. Validate physical table in PostgreSQL
    const table = await db.table.findUnique({
      where: { number: tableNumber },
    })

    if (!table || !table.isActive) {
      return NextResponse.json(
        { error: `Table #${tableNumber} does not exist or is currently inactive` },
        { status: 400 }
      )
    }

    // 3. Look up real products in PostgreSQL to verify existence, availability, and authentic prices
    const productIds = items.map((i) => i.productId)
    const dbProducts = await db.product.findMany({
      where: {
        id: { in: productIds },
      },
    })

    const productMap = new Map(dbProducts.map((p) => [p.id, p]))

    let calculatedTotal = 0
    const validatedItems: Array<{
      productId: string
      quantity: number
      unitPrice: number
      notes?: string | null
    }> = []

    for (const item of items) {
      const product = productMap.get(item.productId)

      if (!product) {
        return NextResponse.json(
          { error: `Menu item with ID "${item.productId}" is not recognized` },
          { status: 400 }
        )
      }

      if (!product.isAvailable) {
        return NextResponse.json(
          { error: `"${product.name}" is currently sold out. Please remove it from your cart.` },
          { status: 400 }
        )
      }

      const unitPrice = Number(product.price)
      calculatedTotal += unitPrice * item.quantity

      validatedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        notes: item.notes?.trim() || null,
      })
    }

    // 4. Determine Payment Resolution
    let paymentStatus: 'PAID' | 'PENDING' = 'PENDING'
    let paymentReference = 'Pay at Counter / Table'

    if (paymentMethod === 'CARD') {
      paymentStatus = 'PAID'
      const cleanNum = cardDetails?.cardNumber?.replace(/\s+/g, '') || '4242'
      const last4 = cleanNum.slice(-4) || '4242'
      const cardBrand = cleanNum.startsWith('5') ? 'Mastercard' : cleanNum.startsWith('3') ? 'Amex' : 'Visa'
      paymentReference = `${cardBrand} •••• ${last4} (TXN-${Date.now().toString(36).toUpperCase()})`
    } else if (paymentMethod === 'APPLE_PAY') {
      paymentStatus = 'PAID'
      paymentReference = `Apple Pay (TXN-${Date.now().toString(36).toUpperCase()})`
    } else if (paymentMethod === 'GOOGLE_PAY') {
      paymentStatus = 'PAID'
      paymentReference = `Google Pay (TXN-${Date.now().toString(36).toUpperCase()})`
    } else {
      paymentStatus = 'PENDING'
      paymentReference = 'Pay with Cash at Counter'
    }

    // 5. Execute Atomic PostgreSQL Transaction via Prisma
    const newOrder = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          tableId: table.id,
          totalPrice: calculatedTotal,
          notes: notes?.trim() || null,
          status: 'PENDING',
          paymentMethod,
          paymentStatus,
          paymentReference,
          items: {
            create: validatedItems.map((vi) => ({
              productId: vi.productId,
              quantity: vi.quantity,
              unitPrice: vi.unitPrice,
              notes: vi.notes,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          table: true,
        },
      })

      return order
    })

    return NextResponse.json(
      {
        success: true,
        orderId: newOrder.id,
        tableNumber: table.number,
        totalPrice: Number(newOrder.totalPrice),
        status: newOrder.status,
        paymentMethod: newOrder.paymentMethod,
        paymentStatus: newOrder.paymentStatus,
        paymentReference: newOrder.paymentReference,
        createdAt: newOrder.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create order:', error)
    return NextResponse.json(
      { error: 'Internal server error while creating your order' },
      { status: 500 }
    )
  }
}
