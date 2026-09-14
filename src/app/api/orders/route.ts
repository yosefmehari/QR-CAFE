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

    const {
      tableNumber,
      notes,
      items,
      paymentMethod,
      cardDetails,
      bankTransferDetails,
      paymentScreenshot: bodyScreenshot,
    } = parsed.data

    const screenshot =
      bodyScreenshot?.trim() ||
      bankTransferDetails?.screenshotUrl?.trim() ||
      null

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

    // 3. Strict Payment Validation: Do not let invalid payments pass
    if (paymentMethod === 'CARD') {
      const cleanNum = cardDetails?.cardNumber?.replace(/\D/g, '') || ''
      if (cleanNum.length < 13 || cleanNum.length > 19) {
        return NextResponse.json(
          { error: 'Payment declined: Card number must be between 13 and 19 digits.' },
          { status: 400 }
        )
      }

      // Luhn algorithm verification
      let sum = 0
      let shouldDouble = false
      for (let i = cleanNum.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNum.charAt(i), 10)
        if (shouldDouble) {
          digit *= 2
          if (digit > 9) digit -= 9
        }
        sum += digit
        shouldDouble = !shouldDouble
      }

      if (sum % 10 !== 0) {
        return NextResponse.json(
          { error: 'Payment declined: Invalid card number check digit. Please check your card number.' },
          { status: 400 }
        )
      }

      // Expiration check (MM/YY)
      const expiry = cardDetails?.expiry?.trim() || ''
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        return NextResponse.json(
          { error: 'Payment declined: Invalid expiration date format. Use MM/YY.' },
          { status: 400 }
        )
      }

      const [expMonth, expYear] = expiry.split('/').map(Number)
      if (expMonth < 1 || expMonth > 12) {
        return NextResponse.json(
          { error: 'Payment declined: Invalid expiration month.' },
          { status: 400 }
        )
      }

      const now = new Date()
      const currentYear = now.getFullYear() % 100 // 2-digit year
      const currentMonth = now.getMonth() + 1

      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        return NextResponse.json(
          { error: 'Payment declined: Card has expired.' },
          { status: 400 }
        )
      }

      // CVC check
      const cvc = cardDetails?.cvc?.trim() || ''
      if (cvc.length < 3 || cvc.length > 4) {
        return NextResponse.json(
          { error: 'Payment declined: Invalid card security code (CVC).' },
          { status: 400 }
        )
      }
    } else if (paymentMethod === 'BANK_TRANSFER') {
      const ref = bankTransferDetails?.transactionReference?.trim()
      if (!ref && !screenshot) {
        return NextResponse.json(
          { error: 'Please enter a transaction confirmation code or upload a receipt screenshot.' },
          { status: 400 }
        )
      }
      if (ref && ref.length < 3 && !screenshot) {
        return NextResponse.json(
          { error: 'Transaction reference must be at least 3 characters long, or upload a receipt screenshot.' },
          { status: 400 }
        )
      }
    }

    // 4. Batch query and validate menu products
    const productIds = items.map((i) => i.productId)
    const dbProducts = await db.product.findMany({
      where: { id: { in: productIds } },
    })

    const productMap = new Map(dbProducts.map((p) => [p.id, p]))

    let calculatedTotal = 0
    const validatedItems: {
      productId: string
      quantity: number
      unitPrice: number
      notes: string | null
    }[] = []

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
          { error: `"${product.name}" is currently sold out and unavailable` },
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

    // 5. Determine Payment Resolution
    let paymentStatus: 'PAID' | 'PENDING' = 'PENDING'
    let paymentReference = 'Pay at Counter / Table'

    if (paymentMethod === 'CARD') {
      paymentStatus = 'PAID'
      const cleanNum = cardDetails?.cardNumber?.replace(/\D/g, '') || '4242'
      const last4 = cleanNum.slice(-4) || '4242'
      const cardBrand = cleanNum.startsWith('5') ? 'Mastercard' : cleanNum.startsWith('3') ? 'Amex' : 'Visa'
      paymentReference = `${cardBrand} •••• ${last4} (TXN-${Date.now().toString(36).toUpperCase()})`
    } else if (paymentMethod === 'BANK_TRANSFER') {
      paymentStatus = 'PENDING'
      const ref = bankTransferDetails?.transactionReference?.trim()
      const bank = bankTransferDetails?.bankUsed?.trim() || 'Bank Transfer'
      if (ref && screenshot) {
        paymentReference = `${bank}: TXN #${ref} (Screenshot Attached)`
      } else if (ref) {
        paymentReference = `${bank}: TXN #${ref}`
      } else {
        paymentReference = `${bank}: [Receipt Screenshot Attached]`
      }
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

    // 6. Execute Atomic PostgreSQL Transaction via Prisma
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
          paymentScreenshot: screenshot,
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
        id: newOrder.id,
        tableNumber: table.number,
        totalPrice: Number(newOrder.totalPrice),
        status: newOrder.status,
        paymentStatus: newOrder.paymentStatus,
        paymentReference: newOrder.paymentReference,
        paymentScreenshot: newOrder.paymentScreenshot,
        createdAt: newOrder.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Order creation error:', error)
    const message = error instanceof Error ? error.message : 'Unknown internal server error'
    return NextResponse.json(
      { error: 'An unexpected error occurred while placing your order', details: message },
      { status: 500 }
    )
  }
}
