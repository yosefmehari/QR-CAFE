import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateQRCodeDataUrl } from '@/lib/qr'

interface RouteContext {
  params: Promise<{ number: string }>
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { number } = await params
  const tableNumber = parseInt(number, 10)

  if (isNaN(tableNumber) || tableNumber <= 0) {
    return NextResponse.json(
      { error: 'Invalid table number' },
      { status: 400 }
    )
  }

  // Look up table in PostgreSQL
  const table = await db.table.findUnique({
    where: { number: tableNumber },
  })

  if (!table) {
    return NextResponse.json(
      { error: `Table #${tableNumber} not found in database` },
      { status: 404 }
    )
  }

  // Build the target dining URL
  const searchParams = request.nextUrl.searchParams
  const customTargetUrl = searchParams.get('targetUrl') || searchParams.get('url')

  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const hostOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.nextUrl.origin
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL?.trim() || hostOrigin).replace(/\/$/, '')

  const targetUrl = customTargetUrl || `${baseUrl}/table/${table.number}`

  // Generate Base64 QR code image
  const qrDataUrl = await generateQRCodeDataUrl(targetUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: '#18181b',
      light: '#ffffff',
    },
  })

  return NextResponse.json({
    tableId: table.id,
    tableNumber: table.number,
    isActive: table.isActive,
    targetUrl,
    qrDataUrl,
  })
}
