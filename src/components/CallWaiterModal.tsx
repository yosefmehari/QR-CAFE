'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  X,
  Bell,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  Droplets,
  CreditCard,
  UtensilsCrossed,
  Sparkle,
  AlertTriangle,
  Clock,
  Loader2,
  Trash2,
} from 'lucide-react'

export interface CallWaiterModalProps {
  isOpen: boolean
  onClose: () => void
  tableNumber?: number | null
  orderId?: string | null
  initialReason?: string
  onCallPlaced?: () => void
}

const CALL_REASONS = [
  {
    id: 'ASSISTANCE',
    title: 'General Assistance',
    desc: 'Need help with menu, order, or service',
    icon: PhoneCall,
    color: 'border-amber-500/40 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20',
  },
  {
    id: 'BILL',
    title: 'Bill & Payment',
    desc: 'Ready to pay by cash, card, or transfer',
    icon: CreditCard,
    color: 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20',
  },
  {
    id: 'WATER',
    title: 'Water & Refills',
    desc: 'Drinking water, glasses, or ice refill',
    icon: Droplets,
    color: 'border-blue-500/40 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20',
  },
  {
    id: 'CUTLERY',
    title: 'Cutlery & Napkins',
    desc: 'Forks, spoons, straws, or extra napkins',
    icon: UtensilsCrossed,
    color: 'border-purple-500/40 text-purple-500 bg-purple-500/10 hover:bg-purple-500/20',
  },
  {
    id: 'CLEANING',
    title: 'Clean Table',
    desc: 'Clear empty plates or wipe table clean',
    icon: Sparkle,
    color: 'border-teal-500/40 text-teal-500 bg-teal-500/10 hover:bg-teal-500/20',
  },
  {
    id: 'COMPLAINT',
    title: 'Food Issue / Return',
    desc: 'Dish is cold, wrong, or need replacement',
    icon: AlertTriangle,
    color: 'border-rose-500/40 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20',
  },
]

export interface ActiveCallData {
  id: string
  tableNumber: number
  reason: string
  notes?: string | null
  status: 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CANCELLED'
  resolvedBy?: string | null
  createdAt: string
}

export default function CallWaiterModal({
  isOpen,
  onClose,
  tableNumber: initialTableNumber,
  orderId,
  initialReason = 'ASSISTANCE',
  onCallPlaced,
}: CallWaiterModalProps) {
  const [selectedTable, setSelectedTable] = useState<number | null>(initialTableNumber || null)
  const [selectedReason, setSelectedReason] = useState<string>(initialReason)
  const [customNote, setCustomNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeCall, setActiveCall] = useState<ActiveCallData | null>(null)
  const [isCheckingActive, setIsCheckingActive] = useState(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Resolve table number from prop, localStorage, or state
  useEffect(() => {
    if (initialTableNumber) {
      setSelectedTable(initialTableNumber)
    } else if (typeof window !== 'undefined') {
      const stored =
        localStorage.getItem('qr_cafe_active_order_table') ||
        localStorage.getItem('qr_cafe_table_number') ||
        localStorage.getItem('qr_cafe_last_order_table')
      if (stored) {
        const num = parseInt(stored, 10)
        if (!isNaN(num)) setSelectedTable(num)
      }
    }
  }, [initialTableNumber, isOpen])

  // Play confirmation chime
  const playPingSound = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(880, now) // A5
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15) // A6
      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.4)
    } catch {
      // Audio might fail if no gesture yet
    }
  }, [])

  // Poll for status of active call
  const checkActiveCall = useCallback(async (tableNum: number) => {
    try {
      const res = await fetch(`/api/waiter/calls?tableNumber=${tableNum}&view=active`)
      if (!res.ok) return
      const data = await res.json()
      const calls: ActiveCallData[] = data.calls || []
      const latest = calls.find(
        (c) => c.status === 'PENDING' || c.status === 'ACKNOWLEDGED'
      )
      if (latest) {
        setActiveCall(latest)
      } else {
        // If we had an active call that is no longer pending/acknowledged, it might be resolved
        setActiveCall((prev) => {
          if (prev && prev.status !== 'RESOLVED') {
            return { ...prev, status: 'RESOLVED' }
          }
          return null
        })
      }
    } catch (e) {
      console.error('Error polling waiter call:', e)
    }
  }, [])

  // Poll active call when modal is open and table is known
  useEffect(() => {
    if (!isOpen || !selectedTable) return

    setIsCheckingActive(true)
    checkActiveCall(selectedTable).finally(() => setIsCheckingActive(false))

    pollIntervalRef.current = setInterval(() => {
      checkActiveCall(selectedTable)
    }, 4000)

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [isOpen, selectedTable, checkActiveCall])

  if (!isOpen) return null

  const handleCallWaiter = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)

    if (!selectedTable || selectedTable <= 0) {
      setErrorMessage('Please enter or select your Table Number.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/waiter/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: selectedTable,
          reason: selectedReason,
          notes: customNote.trim() || undefined,
          orderId: orderId || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to call waiter')
      }

      playPingSound()
      setActiveCall(data.call)
      if (onCallPlaced) onCallPlaced()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending call'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelCall = async () => {
    if (!activeCall) return
    try {
      await fetch(`/api/waiter/calls/${activeCall.id}`, {
        method: 'DELETE',
      })
      setActiveCall(null)
    } catch (e) {
      console.error('Error cancelling call:', e)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <span>Call Waiter to Table</span>
                {selectedTable && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold">
                    Table #{selectedTable}
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-500">
                Floor staff will be notified immediately on their floor screen
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ACTIVE CALL STATUS VIEW (If user already has an active call) */}
        {activeCall && activeCall.status !== 'CANCELLED' ? (
          <div className="space-y-4">
            <div
              className={`p-5 rounded-3xl border text-center space-y-3 ${
                activeCall.status === 'ACKNOWLEDGED'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-100'
                  : activeCall.status === 'RESOLVED'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center font-bold">
                {activeCall.status === 'ACKNOWLEDGED' ? (
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <PhoneCall className="w-6 h-6 animate-pulse" />
                  </div>
                ) : activeCall.status === 'RESOLVED' ? (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Bell className="w-6 h-6 animate-bounce" />
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-base font-black">
                  {activeCall.status === 'ACKNOWLEDGED'
                    ? `🏃 Waiter is heading to Table #${activeCall.tableNumber}!`
                    : activeCall.status === 'RESOLVED'
                    ? `✅ Table #${activeCall.tableNumber} Request Completed!`
                    : `🔔 Waiter Call Dispatched for Table #${activeCall.tableNumber}`}
                </h4>

                <p className="text-xs mt-1 text-zinc-600 dark:text-zinc-300">
                  {activeCall.status === 'ACKNOWLEDGED'
                    ? `${activeCall.resolvedBy || 'Our waiter'} acknowledged your call and is walking to your table right now.`
                    : activeCall.status === 'RESOLVED'
                    ? 'Waitstaff has attended to your table. Feel free to call again if you need anything else!'
                    : 'The service bell rang on the waiter dashboard. A staff member will attend to your table shortly.'}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 dark:bg-black/40 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Reason: <strong>{activeCall.reason.replace(/_/g, ' ')}</strong>
                  {activeCall.notes ? ` ("${activeCall.notes}")` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {activeCall.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={handleCancelCall}
                  className="flex-1 py-3 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Cancel Request</span>
                </button>
              )}

              {activeCall.status === 'RESOLVED' ? (
                <button
                  type="button"
                  onClick={() => setActiveCall(null)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Call Waiter Again</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Close Window</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* NEW WAITER CALL FORM */
          <form onSubmit={handleCallWaiter} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Table Number Selector if not set */}
            {!initialTableNumber && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                  Your Table Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={selectedTable || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    setSelectedTable(isNaN(val) ? null : val)
                  }}
                  placeholder="e.g. 4"
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {/* Call Reason Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                What do you need assistance with?
              </label>

              <div className="grid grid-cols-2 gap-2">
                {CALL_REASONS.map((reason) => {
                  const Icon = reason.icon
                  const isSelected = selectedReason === reason.id
                  return (
                    <button
                      key={reason.id}
                      type="button"
                      onClick={() => setSelectedReason(reason.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30 shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${reason.color}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {reason.title}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">
                          {reason.desc}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Optional Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                Additional Note (Optional)
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Please bring 2 glasses with ice, and the bill"
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-500 placeholder:text-zinc-400"
              />
            </div>

            {/* Quick Guarantees & Submit */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  Our floor waitstaff will receive this notification and sound alert instantly!
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTable}
                  className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Alerting Floor Waiters...</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 animate-bounce" />
                      <span>
                        Call Waiter to Table #{selectedTable || '...'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
