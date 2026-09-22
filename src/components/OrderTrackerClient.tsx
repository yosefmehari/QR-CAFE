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
  Bike,
  MapPin,
  Phone,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react'
import { getProductImage } from '@/lib/images'
import OrderComplaintModal from './OrderComplaintModal'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'SERVED'
  | 'CANCELLED'

export interface TrackedItem {
  id: string
  name: string
  emoji: string
  imageUrl?: string | null
  quantity: number
  unitPrice: number
  notes?: string | null
}

export interface TrackedComplaint {
  id: string
  category: string
  items?: string | null
  details: string
  desiredAction?: string | null
  status: string
  staffNotes?: string | null
  createdAt: string | Date
}

export interface TrackedOrder {
  id: string
  shortId: string
  status: OrderStatus
  orderType?: 'DINE_IN' | 'DELIVERY'
  customerName?: string | null
  customerPhone?: string | null
  deliveryAddress?: string | null
  deliveryNotes?: string | null
  acceptedBy?: string | null
  paymentMethod?: string
  paymentStatus?: string
  paymentReference?: string | null
  paymentScreenshot?: string | null
  totalPrice: number
  notes?: string | null
  tableNumber?: number | null
  createdAt: string | Date
  updatedAt: string | Date
  complaints?: TrackedComplaint[]
  items: TrackedItem[]
}

interface Props {
  initialOrder: TrackedOrder
}

const DINE_IN_STATUS_STEPS: Array<{
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

const DELIVERY_STATUS_STEPS: Array<{
  key: OrderStatus
  title: string
  description: string
  icon: React.ElementType
}> = [
  {
    key: 'PENDING',
    title: 'Order Placed',
    description: 'Waiting for waiter to accept',
    icon: Clock,
  },
  {
    key: 'CONFIRMED',
    title: 'Accepted',
    description: 'Assigned to waitstaff',
    icon: CheckCircle2,
  },
  {
    key: 'PREPARING',
    title: 'Kitchen Prep',
    description: 'Chefs preparing your food',
    icon: ChefHat,
  },
  {
    key: 'OUT_FOR_DELIVERY',
    title: 'Out for Delivery',
    description: 'Waiter on the way to your place',
    icon: Bike,
  },
  {
    key: 'SERVED',
    title: 'Delivered',
    description: 'Delivered to your address',
    icon: CheckCircle2,
  },
]

export default function OrderTrackerClient({ initialOrder }: Props) {
  const [order, setOrder] = useState<TrackedOrder>(initialOrder)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false)

  const isDelivery = order.orderType === 'DELIVERY'
  const currentSteps = isDelivery ? DELIVERY_STATUS_STEPS : DINE_IN_STATUS_STEPS

  // Check URL query to automatically open complaint/return modal if requested
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('report') === 'true' || params.get('return') === 'true') {
        setIsComplaintModalOpen(true)
      }
    }
  }, [])

  // Save active and last order to local storage for quick access from the menu
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('qr_cafe_last_order_id', order.id)
      localStorage.setItem('qr_cafe_last_order_time', String(Date.now()))
      if (order.tableNumber) {
        localStorage.setItem('qr_cafe_last_order_table', String(order.tableNumber))
      }
      if (order.status !== 'SERVED' && order.status !== 'CANCELLED') {
        localStorage.setItem('qr_cafe_active_order_id', order.id)
        if (order.tableNumber) {
          localStorage.setItem('qr_cafe_active_order_table', String(order.tableNumber))
        } else {
          localStorage.removeItem('qr_cafe_active_order_table')
        }
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
    if (isDelivery) {
      if (order.status === 'READY') return 2 // Between PREPARING and OUT_FOR_DELIVERY
      return DELIVERY_STATUS_STEPS.findIndex((s) => s.key === order.status)
    }
    return DINE_IN_STATUS_STEPS.findIndex((s) => s.key === order.status)
  }, [order.status, isDelivery])

  const progressPercentage = useMemo(() => {
    if (order.status === 'CANCELLED') return 0
    if (currentStepIndex === -1) return 0
    const totalSteps = currentSteps.length - 1
    return Math.min(100, Math.round((currentStepIndex / totalSteps) * 100))
  }, [currentStepIndex, currentSteps.length, order.status])

  const isCompleted = order.status === 'SERVED'
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href={order.tableNumber ? `/?table=${order.tableNumber}` : '/'}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{order.tableNumber ? `Back to Menu (Table #${order.tableNumber})` : 'Back to Menu'}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsComplaintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/80 text-rose-600 dark:text-rose-400 transition-all cursor-pointer shadow-xs"
              title="Return food, request remake, or report an issue"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Return Food / Report Issue</span>
            </button>

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

              {/* Table Seating / Outside Delivery Badges */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                {isDelivery ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 font-bold text-sm shrink-0 shadow-xs">
                    <Bike className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Outside Delivery</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 font-bold text-sm shrink-0 shadow-xs">
                    <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                    <span>Table #{order.tableNumber ?? '?'}</span>
                  </div>
                )}

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
                        : '💵 Pay on Delivery / Counter'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Destination & Waiter Info Box */}
            {isDelivery && (
              <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    Delivery Destination
                  </span>
                  {order.acceptedBy ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Assigned Waiter: <strong>{order.acceptedBy}</strong>
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting Waiter Acceptance
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium block">Delivery Address / Place:</span>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                      {order.deliveryAddress || 'Address not specified'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium block">Recipient:</span>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {order.customerName && <span>{order.customerName}</span>}
                      {order.customerPhone && (
                        <div className="flex items-center gap-1 mt-0.5 text-amber-600 dark:text-amber-400 font-mono">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${order.customerPhone}`} className="hover:underline">
                            {order.customerPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {order.deliveryNotes && (
                  <div className="pt-2 border-t border-amber-500/15 text-xs text-amber-900 dark:text-amber-200">
                    <span className="font-bold">Landmark / Directions:</span> {order.deliveryNotes}
                  </div>
                )}
              </div>
            )}

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
                  {currentSteps.map((step, index) => {
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
                            {step.key === 'CONFIRMED' && isDelivery && order.acceptedBy
                              ? `Accepted by ${order.acceptedBy}`
                              : step.description}
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
                  ? isDelivery
                    ? `Order delivered to ${order.deliveryAddress || 'your address'}! Enjoy your meal!`
                    : 'Your meal has been served! Enjoy your visit.'
                  : isCancelled
                  ? 'Order is cancelled.'
                  : order.paymentStatus !== 'PAID'
                  ? 'Wait, your payment is checking... Please stay on this screen.'
                  : isDelivery
                  ? order.status === 'OUT_FOR_DELIVERY'
                    ? `Your order is on the way! ${order.acceptedBy ? order.acceptedBy + ' is delivering' : 'A waiter is delivering'} to your address.`
                    : order.status === 'READY'
                    ? 'Your meal is prepared and packed! Waitstaff is getting ready to deliver.'
                    : order.status === 'PREPARING'
                    ? 'Chefs are currently preparing your delivery order.'
                    : order.status === 'CONFIRMED'
                    ? `${order.acceptedBy ? `Accepted by ${order.acceptedBy}!` : 'Order accepted!'} Sent to kitchen.`
                    : 'Order placed! Waiting for a waiter to accept and verify your address.'
                  : order.status === 'READY'
                  ? 'Plated! Server is bringing dishes to Table #' + (order.tableNumber ?? '')
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
                  : isDelivery && order.status === 'OUT_FOR_DELIVERY'
                  ? 'Please ensure your phone is reachable so the waiter can hand over your food smoothly.'
                  : 'This screen updates automatically as waitstaff and kitchen change order status.'}
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
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                      <img
                        src={getProductImage(item.imageUrl)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
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

          {/* Customer Complaint & Food Quality Feedback Section */}
          <div className="p-6 sm:p-8 bg-zinc-50/50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            {order.complaints && order.complaints.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Reported Food / Order Issues ({order.complaints.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsComplaintModalOpen(true)}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>+ Report Another Issue</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {order.complaints.map((c) => {
                    const isReviewing = c.status === 'REVIEWING'
                    const isResolved = c.status === 'RESOLVED'

                    return (
                      <div
                        key={c.id}
                        className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                          isResolved
                            ? 'bg-emerald-500/5 border-emerald-500/30'
                            : isReviewing
                            ? 'bg-blue-500/5 border-blue-500/30 ring-1 ring-blue-500/20'
                            : 'bg-rose-500/5 border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-zinc-900 dark:text-zinc-100 block">
                              {c.category === 'DISLIKE_FOOD'
                                ? "👎 Don't Like Food / Taste"
                                : c.category === 'FOOD_QUALITY'
                                ? '🍲 Food Not Good / Quality Issue'
                                : c.category === 'RETURN_DISH'
                                ? '🔁 Food Return Requested'
                                : c.category === 'COLD_FOOD'
                                ? '❄️ Cold Food Issue'
                                : c.category === 'WRONG_ITEM'
                                ? '❌ Wrong Dish Received'
                                : c.category === 'MISSING_ITEM'
                                ? '🔍 Missing Item / Side'
                                : c.category === 'HYGIENE'
                                ? '⚠️ Hygiene / Quality Issue'
                                : c.category === 'DELAY'
                                ? '⏳ Excessive Delay'
                                : '💬 Order Issue'}
                            </span>
                            {c.items && (
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                Dish: {c.items}
                              </span>
                            )}
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                              isResolved
                                ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                                : isReviewing
                                ? 'bg-blue-500/15 text-blue-600 border-blue-500/30 animate-pulse'
                                : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                            }`}
                          >
                            {isResolved
                              ? '✓ Resolved'
                              : isReviewing
                              ? 'Staff Attending Table'
                              : (c.desiredAction?.startsWith('RETURN') || c.category === 'RETURN_DISH')
                              ? 'Pending Pickup'
                              : 'Pending Staff Response'}
                          </span>
                        </div>

                        <p className="text-zinc-600 dark:text-zinc-300 italic bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                          &quot;{c.details}&quot;
                        </p>

                        {c.desiredAction && (
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Requested action:{' '}
                            <strong className="text-zinc-800 dark:text-zinc-200">
                              {c.desiredAction === 'RETURN_REFUND'
                                ? '💰 Return Dish & Full Refund'
                                : c.desiredAction === 'RETURN_EXCHANGE'
                                ? '🔁 Return Dish & Replace with Another Dish'
                                : c.desiredAction === 'REMAKE'
                                ? '🔥 Remake Same Dish Fresh'
                                : c.desiredAction === 'CALL_STAFF'
                                ? '🙋 Waiter Coming to Table'
                                : c.desiredAction === 'FEEDBACK'
                                ? '💬 Kitchen Feedback Only'
                                : c.desiredAction}
                            </strong>
                          </div>
                        )}

                        {(c.desiredAction?.startsWith('RETURN') || c.category === 'RETURN_DISH') && !isResolved && (
                          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-[11px]">
                            <strong>Dish Return Notice:</strong> Please leave the dish on your table. Floor staff is notified to collect it.
                          </div>
                        )}

                        {c.staffNotes && (
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-[11px] space-y-0.5">
                            <span className="font-bold block">Response from Manager / Kitchen:</span>
                            <p>{c.staffNotes}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-dashed border-amber-500/30 dark:border-zinc-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Food not good, cold, don&apos;t like it, or want to return it?
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-md leading-relaxed">
                      <strong>100% Satisfaction Guarantee:</strong> If you don&apos;t enjoy your meal, we will gladly take the dish back, remake it fresh, exchange it, or refund you immediately!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsComplaintModalOpen(true)}
                  className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Return Food / Complain</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-6 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href={order.tableNumber ? `/?table=${order.tableNumber}` : '/'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              {isDelivery ? <Bike className="w-3.5 h-3.5" /> : <UtensilsCrossed className="w-3.5 h-3.5" />}
              <span>{order.tableNumber ? `Order More for Table #${order.tableNumber}` : 'Order More Items'}</span>
            </Link>

            <Link
              href="/tables"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              View Table QR Stands
            </Link>
          </div>
        </div>

        {/* Order Complaint Modal */}
        <OrderComplaintModal
          order={order}
          isOpen={isComplaintModalOpen}
          onClose={() => setIsComplaintModalOpen(false)}
          onComplaintSubmitted={handleManualRefresh}
        />
      </div>
    </div>
  )
}
