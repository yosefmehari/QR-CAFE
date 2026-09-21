'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  QrCode,
  Check,
  X,
  Trash2,
  Printer,
  Download,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'

export interface AdminTable {
  id: string
  number: number
  isActive: boolean
  _count?: { orders: number }
}

import TableQRModal, { QRCodeSVG, QRCode, getAbsoluteTableUrl } from './TableQRModal'
export { TableQRModal, QRCodeSVG, QRCode, getAbsoluteTableUrl }

interface Props {
  initialTables: AdminTable[]
  onRefresh: () => void
  showToast: (msg: string) => void
}

export default function TablesManager({
  initialTables,
  onRefresh,
  showToast,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTableNumber, setNewTableNumber] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // QR Code preview modal
  const [previewTable, setPreviewTable] = useState<AdminTable | null>(null)

  // 1-Click Active Toggle
  const handleToggleActive = async (table: AdminTable) => {
    try {
      const res = await fetch(`/api/admin/tables/${table.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !table.isActive }),
      })

      if (!res.ok) throw new Error('Failed to toggle table')

      showToast(`Table #${table.number} is now ${!table.isActive ? 'Active' : 'Inactive'}`)
      onRefresh()
    } catch (e) {
      console.error(e)
      alert('Failed to update table status')
    }
  }

  const handleOpenQr = (table: AdminTable) => {
    setPreviewTable(table)
  }

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const num = typeof newTableNumber === 'number' ? newTableNumber : parseInt(String(newTableNumber), 10)

    if (isNaN(num) || num <= 0) {
      setErrorMessage('Please enter a valid positive table number')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: num, isActive: true }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create table')
      }

      showToast(`Table #${num} added successfully!`)
      setIsModalOpen(false)
      setNewTableNumber('')
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (table: AdminTable) => {
    const confirmed = window.confirm(`Are you sure you want to delete Table #${table.number}?`)
    if (!confirmed) return

    try {
      const res = await fetch(`/api/admin/tables/${table.id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to delete table')
        return
      }

      showToast(data.message || `Table #${table.number} removed`)
      onRefresh()
    } catch (e) {
      console.error(e)
      alert('Failed to delete table')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-500" />
            <span>Tables & QR Stand Management ({initialTables.length})</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure dining tables, generate scannable QR codes, and toggle seating status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tables"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print All Stands ↗</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              setNewTableNumber(initialTables.length + 1)
              setErrorMessage(null)
              setIsModalOpen(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Tables List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {initialTables.map((t) => (
          <div
            key={t.id}
            className="bg-zinc-900 rounded-3xl border border-zinc-800 p-5 space-y-4 shadow-xl hover:border-zinc-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-black text-white">
                Table #{t.number}
              </span>
              <button
                type="button"
                onClick={() => handleToggleActive(t)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                  t.isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                }`}
                title="Toggle Table Seating Status"
              >
                {t.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                <span>{t.isActive ? 'Active' : 'Inactive'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 py-2 border-y border-zinc-800/80">
              <span>Past Orders</span>
              <span className="font-bold text-amber-400">
                {t._count?.orders ?? 0} orders
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleOpenQr(t)}
                className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>View QR</span>
              </button>

              <Link
                href={`/table/${t.number}`}
                target="_blank"
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Simulate customer scan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => handleDelete(t)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 transition-colors cursor-pointer"
                title="Delete Table"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* QR Preview Modal */}
      {previewTable && (
        <TableQRModal
          table={previewTable}
          onClose={() => setPreviewTable(null)}
        />
      )}

      {/* Create Table Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-zinc-900 rounded-3xl border border-zinc-800 p-6 space-y-4 animate-in zoom-in-95 duration-200 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-base font-bold text-white">Add New Table</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Physical Table Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  placeholder="e.g. 9"
                  value={newTableNumber}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : ''
                    setNewTableNumber(val)
                  }}
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono text-center text-lg font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Table</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
