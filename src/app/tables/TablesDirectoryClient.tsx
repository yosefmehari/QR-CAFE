'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  QrCode,
  Printer,
  Download,
  ExternalLink,
  ArrowLeft,
  Coffee,
  CheckCircle,
  Copy,
} from 'lucide-react'

interface TableItem {
  id: string
  number: number
  isActive: boolean
  targetUrl: string
  qrDataUrl: string
}

interface Props {
  tables: TableItem[]
}

export default function TablesDirectoryClient({ tables }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (url: string, id: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(url)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      {/* Printable CSS overrides */}
      <style jsx global>{`
        @media print {
          header,
          footer,
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
          .table-stand-card {
            page-break-inside: avoid !important;
            border: 2px dashed #999 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-600" />
                <span>Table QR Management</span>
              </h1>
              <p className="text-xs text-zinc-500">
                {tables.length} physical tables registered in PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 no-print">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Table Stands</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Informational banner */}
        <div className="no-print bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 sm:p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Phase 4: Contactless Table QR Identification
              </h2>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5 max-w-xl leading-relaxed">
                Each table has a dedicated QR code pointing to <code>/table/[number]</code>. When scanned, the customer&apos;s device is tied to that table so orders automatically dispatch to their physical location.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            Visit Customer Menu
          </Link>
        </div>

        {/* Table Cards Grid */}
        <div className="print-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tables.map((table) => {
            const isCopied = copiedId === table.id

            return (
              <div
                key={table.id}
                className="table-stand-card bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 flex flex-col items-center text-center shadow-lg shadow-zinc-200/40 dark:shadow-black/60 hover:shadow-xl transition-all"
              >
                {/* Table Stand Badge Top */}
                <div className="w-full flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Aroma & Fork Cafe
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Active
                  </span>
                </div>

                {/* Table Number Title */}
                <h3 className="text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight">
                  TABLE #{table.number}
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Scan to view menu & order
                </p>

                {/* QR Code Display */}
                <div className="mt-4 p-3 bg-white rounded-2xl border border-zinc-200/80 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={table.qrDataUrl}
                    alt={`QR code for Table ${table.number}`}
                    className="w-44 h-44 object-contain"
                  />
                </div>

                <p className="mt-3 text-[11px] font-mono text-zinc-400 break-all px-2 select-all">
                  /table/{table.number}
                </p>

                {/* Actions (hidden in print mode) */}
                <div className="w-full mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2 no-print">
                  {/* Test Dine-In Button */}
                  <Link
                    href={`/table/${table.number}`}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Test Table #{table.number}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {/* Download QR image */}
                    <a
                      href={table.qrDataUrl}
                      download={`table-${table.number}-qr.png`}
                      className="flex-1 py-2 px-2 rounded-xl text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1 transition-colors"
                      title="Download high-res PNG"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </a>

                    {/* Copy Link */}
                    <button
                      type="button"
                      onClick={() => handleCopy(table.targetUrl, table.id)}
                      className="flex-1 py-2 px-2 rounded-xl text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
