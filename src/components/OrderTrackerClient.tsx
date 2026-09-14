'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bell,
  UtensilsCrossed,
  ArrowLeft,
  Receipt,
  XCircle,
  RefreshCw,
  Sparkles,
  Camera,
} from 'lucide-react'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'CANCELLED'

export interface TrackedItem {
  id: string
  name: string
  emoji: string
  quantity: number
  unitPrice: number
  notes?: string | null
}

export interface TrackedOrder {
  id: string
  shortId: string
  status: OrderStatus
  paymentMethod?: string
  paymentStatus?: string
  paymentReference?: string | null
  paymentScreenshot?: string | null
  totalPrice: number
  notes?: string | null
  tableNumber: number
  createdAt: string | Date
  updatedAt: string | Date
  items: TrackedItem[]
}

interface Props {
  initialOrder: TrackedOrder
}

const STATUS_STEPS: Array<{
  key: OrderStatus
  title: string
  description: string
  icon: React.ElementType
}> = [
  {
    key: 'PENDING',
    title: 'Order Received',
    description: 'Received by our kitchen team',
    icon: Clock,
  },
  {
    key: 'CONFIRMED',
    title: 'Confirmed',
    description: 'Kitchen acknowledged order',
    icon: CheckCircle2,
  },
  {
    key: 'PREPARING',
    title: 'Preparing',
    description: 'Chefs & baristas crafting dishes',
    icon: ChefHat,
  },
  {
    key: 'READY',
    title: 'Ready',
    description: 'Plated and ready to dispatch',
    icon: Bell,
  },
  {
    key: 'SERVED',
    title: 'Served',
    description: 'Delivered to your table',
    icon: UtensilsCrossed,
  },
]

export default function OrderTrackerClient({ initialOrder }: Props) {
  const [order, setOrder] = useState<TrackedOrder>(initialOrder)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Save active order to local storage for quick access from the menu
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (order.status !== 'SERVED' && order.status !== 'CANCELLED') {
        localStorage.setItem('qr_cafe_active_order_id', order.id)
        localStorage.setItem('qr_cafe_active_order_table', String(order.tableNumber))
      } else {
        localStorage.removeItem('qr_cafe_active_order_id')
      }
    }
  }, [order.id, order.status, order.tableNumber])

  // Poll database every 4 seconds for live status updates
  useEffect(() => {
    let isMounted = true

    // Stop polling if final state reached
    if (order.status === 'SERVED' || order.status === 'CANCELLED') {
      return
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`)
        if (res.ok) {
          const freshData: TrackedOrder = await res.json()
          if (isMounted) {
            setOrder(freshData)
            setLastUpdated(new Date())
          }
        }
      } catch (err) {
        console.error('Error polling order status:', err)
      }
    }, 4000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [order.id, order.status])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`)
      if (res.ok) {
        const freshData: TrackedOrder = await res.json()
        setOrder(freshData)
        setLastUpdated(new Date())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  // Calculate progress percentage
  const currentStepIndex = useMemo(() => {
    if (order.status === 'CANCELLED') return -1
    return STATUS_STEPS.findIndex((s) => s.key === order.status)
  }, [order.status])

  const progressPercentage = useMemo(() => {
    if (order.status === 'CANCELLED') return 0
    if (currentStepIndex === -1) return 0
    return Math.round((currentStepIndex / (STATUS_STEPS.length - 1)) * 100)
  }, [currentStepIndex, order.status])

  const isCompleted = order.status === 'SERVED'
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href={`/?table=${order.tableNumber}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Menu (Table #{order.tableNumber})</span>
          </Link>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`}
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Live Sync'}</span>
          </button>
        </div>

        {/* Main Status Hero Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 border-b border-zinc-100 dark:border-zinc-800 relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-transparent to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Live Order Tracking
                  </span>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                  Order #{order.shortId}
                </h1>
                <p className="text-xs text-zinc-500 mt-1">
                  Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' • '}Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>

              {/* Table Seating & Payment Badges */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 font-bold text-sm shrink-0 shadow-xs">
                  <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                  <span>Table #{order.tableNumber}</span>
                </div>

                {order.paymentStatus === 'PAID' ? (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs shrink-0 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>{order.paymentReference || 'Paid Online'}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-bold text-xs shrink-0 shadow-xs">
                    <span>
                      {order.paymentMethod === 'BANK_TRANSFER'
                        ? `🏦 ${order.paymentReference || 'Bank Transfer Pending'}`
                        : '💵 Pay at Counter / Table'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Awaiting Admin Payment Check Notice */}
            {order.paymentStatus !== 'PAID' && !isCancelled && (
              <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 dark:border-amber-500/40 flex items-start gap-3 text-amber-900 dark:text-amber-200 animate-in fade-in duration-300">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0 font-bold shadow-md shadow-amber-500/20">
                  <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <span>Wait, your payment is checking...</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      Pending Admin Review
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                    Our cafe admin is currently verifying your bank transfer / payment details. Once the admin clicks <strong>Checked</strong>, your order will automatically be confirmed and the kitchen will begin preparing your food.
                  </p>
                  {order.paymentReference && (
                    <div className="pt-1 font-mono text-[11px] text-amber-700 dark:text-amber-400">
                      Recorded Ref: <span className="font-bold underline">{order.paymentReference}</span>
                    </div>
                  )}
                  {order.paymentScreenshot && (
                    <div className="pt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Payment receipt screenshot attached &amp; sent to admin</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cancelled Alert Banner */}
            {isCancelled && (
              <div className="mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
                <XCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <div>
                  <h4 className="font-bold text-sm">Order Cancelled</h4>
                  <p className="mt-0.5">
                    This order was cancelled by the kitchen or staff. If this is an error, please speak with our café floor team.
                  </p>
                </div>
              </div>
            )}

            {/* Visual Progress Timeline (when not cancelled) */}
            {!isCancelled && (
              <div className="mt-8 space-y-6">
                {/* Progress Bar Line */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-zinc-500">Order Progress</span>
                    <span className="text-amber-600 font-bold">{progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Vertical Stepper */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
                  {STATUS_STEPS.map((step, index) => {
                    const isStepCompleted = index < currentStepIndex
                    const isStepCurrent = index === currentStepIndex
                    const Icon = step.icon

                    return (
                      <div
                        key={step.key}
                        className={`p-3 rounded-2xl border transition-all flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 ${
                          isStepCurrent
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/20 shadow-xs'
                            : isStepCompleted
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-900 dark:text-zinc-200'
                            : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/60 opacity-40 text-zinc-400'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isStepCurrent
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 animate-pulse'
                              : isStepCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold leading-tight">
                            {step.title}
                          </h4>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 hidden sm:block mt-0.5 leading-tight">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Current Status Message Box */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isCompleted
                  ? 'Your meal has been served! Enjoy your visit.'
                  : isCancelled
                  ? 'Order is cancelled.'
                  : order.paymentStatus !== 'PAID'
                  ? 'Wait, your payment is checking... Please stay on this screen.'
                  : order.status === 'READY'
                  ? 'Plated! Server is bringing dishes to Table #' + order.tableNumber
                  : order.status === 'PREPARING'
                  ? 'Our chefs are currently preparing your fresh items.'
                  : order.status === 'CONFIRMED'
                  ? 'Order confirmed. In queue for kitchen preparation.'
                  : 'Order received. Awaiting kitchen review.'}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isCompleted
                  ? 'Need anything else? You can order more items anytime.'
                  : order.paymentStatus !== 'PAID'
                  ? 'The admin is verifying your transfer or counter payment. As soon as the admin clicks "Checked", your order unlocks.'
                  : 'This screen updates automatically as the kitchen changes order status.'}
              </p>
            </div>
          </div>

          {/* Itemized Order Breakdown */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Items in Order ({order.items.length})
              </span>
              <span className="text-xs font-medium text-zinc-400">
                Total: ${order.totalPrice.toFixed(2)}
              </span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl select-none">{item.emoji}</span>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-amber-600">
                          {item.quantity}x
                        </span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-zinc-500 italic mt-0.5">
                          &quot;{item.notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    ${(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Special Instructions Note */}
            {order.notes && (
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-xs border border-zinc-100 dark:border-zinc-800">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">
                  Order Note:
                </span>
                <p className="text-zinc-500 dark:text-zinc-400 italic">
                  &quot;{order.notes}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href={`/?table=${order.tableNumber}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Order More for Table #{order.tableNumber}</span>
            </Link>

            <Link
              href="/tables"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              View Table QR Stands
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
