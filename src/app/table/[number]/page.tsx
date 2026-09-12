import { db } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TableSessionSetter from './TableSessionSetter'
import { UtensilsCrossed, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

interface TablePageProps {
  params: Promise<{ number: string }>
}

export async function generateMetadata({ params }: TablePageProps): Promise<Metadata> {
  const { number } = await params
  return {
    title: `Table #${number} | Aroma & Fork Cafe`,
    description: `Order table-side from Table #${number}. Browse menu and place orders.`,
  }
}

export default async function TableScanPage({ params }: TablePageProps) {
  const { number } = await params
  const tableNumber = parseInt(number, 10)

  if (isNaN(tableNumber) || tableNumber <= 0) {
    notFound()
  }

  // Verify against real PostgreSQL database
  const table = await db.table.findUnique({
    where: { number: tableNumber },
  })

  // Inactive or non-existent table state
  if (!table || !table.isActive) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4 sm:p-6 text-zinc-900 dark:text-zinc-100">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-zinc-950 dark:text-zinc-50">
            Table #{tableNumber} Not Available
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            This table is currently inactive or does not exist in our system. Please ask our staff for assistance.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-all text-center"
            >
              Browse General Menu
            </Link>
            <Link
              href="/tables"
              className="w-full py-3 px-5 rounded-2xl font-medium text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 text-center"
            >
              View Available Tables Directory
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4 sm:p-6 text-zinc-900 dark:text-zinc-100">
      {/* Client component that automatically writes table number to localStorage and cookie */}
      <TableSessionSetter tableNumber={table.number} />

      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-10 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/25">
          <UtensilsCrossed className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 mb-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>QR Code Verified</span>
        </div>

        <h1 className="text-3xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight">
          Welcome to Table #{table.number}
        </h1>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Your table is linked! Any items you order will be prepared by the kitchen and delivered straight to Table #{table.number}.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href={`/?table=${table.number}`}
            className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 transition-all cursor-pointer group"
          >
            <span>Start Ordering</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Redirecting to menu automatically in 2 seconds...
          </p>
        </div>
      </div>
    </div>
  )
}
