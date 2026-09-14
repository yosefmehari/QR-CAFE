import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
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

    return NextResponse.json({
      bankName: settings.bankName,
      bankAccountNumber: settings.bankAccountNumber,
      accountHolderName: settings.accountHolderName,
      telebirrNumber: settings.telebirrNumber,
      paymentInstructions: settings.paymentInstructions,
    })
  } catch (error) {
    console.error('Failed to fetch public cafe settings:', error)
    return NextResponse.json(
      {
        bankName: 'Commercial Bank of Ethiopia (CBE)',
        bankAccountNumber: '1000234567890',
        accountHolderName: 'Aroma & Fork Cafe LLC',
        telebirrNumber: '0911000000',
        paymentInstructions: 'Transfer the total order amount and enter the transaction confirmation code / receipt number below.',
      },
      { status: 200 }
    )
  }
}
