import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/authGuard'
import { updateCafeSettingsSchema, formatZodError } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAuth(['ADMIN'])

    let settings = await db.cafeSetting.findUnique({
      where: { id: 'default' },
    })

    if (!settings) {
      settings = await db.cafeSetting.create({
        data: {
          id: 'default',
          bankName: 'Commercial Bank of Ethiopia (CBE)',
          bankAccountNumber: '1000234567890',
          accountHolderName: 'Aroma & Fork Cafe LLC',
          telebirrNumber: '0911000000',
          paymentInstructions: 'Transfer the total order amount and enter the transaction confirmation code / receipt number below.',
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Failed to get cafe settings:', error)
    return NextResponse.json({ error: 'Failed to get cafe settings' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    await requireAuth(['ADMIN'])

    const body = await req.json()
    const parsed = updateCafeSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      )
    }

    const { bankName, bankAccountNumber, accountHolderName, telebirrNumber, paymentInstructions } = parsed.data

    const updated = await db.cafeSetting.upsert({
      where: { id: 'default' },
      update: {
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
        telebirrNumber: telebirrNumber?.trim() || null,
        paymentInstructions: paymentInstructions?.trim() || null,
      },
      create: {
        id: 'default',
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
        telebirrNumber: telebirrNumber?.trim() || null,
        paymentInstructions: paymentInstructions?.trim() || null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Response) return error
    console.error('Failed to update cafe settings:', error)
    return NextResponse.json({ error: 'Failed to update cafe settings' }, { status: 500 })
  }
}
