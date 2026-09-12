import { db } from '@/lib/db'
import { generateQRCodeDataUrl } from '@/lib/qr'
import TablesDirectoryClient from './TablesDirectoryClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Table QR Management & Stands | Aroma & Fork Cafe',
  description: 'Manage and print table QR codes for customer dine-in ordering.',
}

export const revalidate = 0

export default async function TablesPage() {
  const tables = await db.table.findMany({
    orderBy: { number: 'asc' },
  })

  // Pre-generate QR code data URLs for each table using our local origin / path
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const tablesWithQr = await Promise.all(
    tables.map(async (table) => {
      const targetUrl = `${baseUrl}/table/${table.number}`
      const qrDataUrl = await generateQRCodeDataUrl(targetUrl, {
        width: 480,
        margin: 2,
        color: {
          dark: '#18181b',
          light: '#ffffff',
        },
      })

      return {
        id: table.id,
        number: table.number,
        isActive: table.isActive,
        targetUrl,
        qrDataUrl,
      }
    })
  )

  return <TablesDirectoryClient tables={tablesWithQr} />
}
