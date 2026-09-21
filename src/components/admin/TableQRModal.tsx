'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Download,
  Copy,
  CheckCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { generateQRCodeSvg, generateQRCodeDataUrl } from '@/lib/qr'
import type { AdminTable } from './TablesManager'

/**
 * Builds the full absolute URL for a table dining page.
 * Prioritizes process.env.NEXT_PUBLIC_APP_URL and falls back dynamically to window.location.origin.
 */
export function getAbsoluteTableUrl(tableNumber: number | string): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (envUrl) {
    return `${envUrl.replace(/\/$/, '')}/table/${tableNumber}`
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin.replace(/\/$/, '')}/table/${tableNumber}`
  }
  return `/table/${tableNumber}`
}

/**
 * Reusable SVG QR Code component
 */
export function QRCodeSVG({
  value,
  size = 200,
  className = '',
}: {
  value: string
  size?: number
  className?: string
}) {
  const [svgHtml, setSvgHtml] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!value) return

    setLoading(true)
    generateQRCodeSvg(value, {
      width: size,
      margin: 2,
      color: {
        dark: '#18181b',
        light: '#ffffff',
      },
    })
      .then((svg) => {
        if (active) {
          setSvgHtml(svg)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to generate SVG QR code:', err)
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [value, size])

  if (loading || !svgHtml) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-white rounded-2xl ${className}`}
      >
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center justify-center [&>svg]:w-full [&>svg]:h-full ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  )
}

// Alias for flexibility
export const QRCode = QRCodeSVG

export interface TableQRModalProps {
  table: AdminTable | null
  onClose: () => void
}

export default function TableQRModal({ table, onClose }: TableQRModalProps) {
  const [pngDataUrl, setPngDataUrl] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [targetUrl, setTargetUrl] = useState<string>('')

  // Compute absolute URL on mount / table change
  useEffect(() => {
    if (table) {
      const fullUrl = getAbsoluteTableUrl(table.number)
      setTargetUrl(fullUrl)

      // Also generate high-resolution PNG data URL for downloading
      generateQRCodeDataUrl(fullUrl, {
        width: 500,
        margin: 2,
        color: {
          dark: '#18181b',
          light: '#ffffff',
        },
      })
        .then((url) => setPngDataUrl(url))
        .catch((err) => console.error('Failed to generate PNG QR:', err))
    }
  }, [table])

  if (!table) return null

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && targetUrl) {
      navigator.clipboard.writeText(targetUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-zinc-900 rounded-3xl border border-zinc-800 p-6 text-center space-y-4 animate-in zoom-in-95 duration-200 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="text-left">
            <h3 className="text-base font-bold text-white">
              Table #{table.number} QR Stand
            </h3>
            <p className="text-[11px] text-zinc-400">
              Scannable customer dining link
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Display (SVG) */}
        <div className="p-4 bg-white rounded-2xl flex items-center justify-center min-h-[216px] shadow-inner">
          <QRCodeSVG value={targetUrl} size={192} />
        </div>

        {/* Target URL Display */}
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-2.5 text-left">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-0.5">
            Target URL
          </span>
          <p className="text-xs font-mono text-amber-400 break-all select-all font-medium">
            {targetUrl}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {pngDataUrl && (
            <a
              href={pngDataUrl}
              download={`table-${table.number}-qr.png`}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG Stand</span>
            </a>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isCopied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy URL</span>
                </>
              )}
            </button>

            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Test Link</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
