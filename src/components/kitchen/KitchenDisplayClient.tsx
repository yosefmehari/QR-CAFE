'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Flame,
  Bell,
  Utensils,
  Check,
  XCircle,
  History,
  AlertTriangle,
} from 'lucide-react'

export type KitchenOrderItem = {
  id: string
  quantity: number
  unitPrice: number | string
  notes?: string | null
  product: {
    id: string
    name: string
    imageUrl?: string | null
  }
}

export type KitchenComplaint = {
  id: string
  category: string
  items?: string | null
  details: string
  desiredAction?: string | null
  status: string
  staffNotes?: string | null
  createdAt: string
}

export type KitchenOrder = {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'SERVED' | 'CANCELLED'
  orderType?: 'DINE_IN' | 'DELIVERY'
  customerName?: string | null
  customerPhone?: string | null
  deliveryAddress?: string | null
  deliveryNotes?: string | null
  acceptedBy?: string | null
  paymentMethod?: string
  paymentStatus?: string
  paymentReference?: string | null
  totalPrice: number | string
  notes?: string | null
  createdAt: string
  table?: {
    id: string
    number: number
  } | null
  complaints?: KitchenComplaint[]
  items: KitchenOrderItem[]
}

interface KitchenDisplayClientProps {
  initialOrders: KitchenOrder[]
}

export default function KitchenDisplayClient({ initialOrders }: KitchenDisplayClientProps) {
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders)
  const [activeTab, setActiveTab] = useState<'all' | 'PENDING' | 'PREPARING' | 'READY' | 'history'>('all')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Track known order IDs to trigger sound when a genuinely new order arrives
  const previousOrderIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)))
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  // Synthesized Web Audio chime (no external audio files required)
  const playChime = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      
      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(587.33, now) // D5
      osc1.frequency.setValueAtTime(880, now + 0.12) // A5

      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(293.66, now) // D4

      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.55)
      osc2.stop(now + 0.55)
    } catch {
      // Audio context might be restricted before user interaction
    }
  }, [soundEnabled])

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }, [])

  // Fetch updated orders from API
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    try {
      const isHistoryTab = activeTab === 'history'
      const res = await fetch(`/api/kitchen/orders?view=${isHistoryTab ? 'history' : 'active'}`)
      if (!res.ok) return
      const data = await res.json()
      const fetched: KitchenOrder[] = data.orders || []

      // Check for new incoming pending orders to trigger alert chime
      if (!isHistoryTab) {
        const newIncoming = fetched.filter(
          (o) => !previousOrderIdsRef.current.has(o.id) && (o.status === 'PENDING' || o.status === 'CONFIRMED')
        )
        if (newIncoming.length > 0) {
          playChime()
          showToast(`🔔 ${newIncoming.length} new incoming order!`)
        }
      }

      previousOrderIdsRef.current = new Set(fetched.map((o) => o.id))
      setOrders(fetched)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to poll kitchen orders:', err)
    } finally {
      if (!silent) setIsRefreshing(false)
    }
  }, [activeTab, playChime, showToast])

  // 3.5-second live polling loop for real-time ticket delivery
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true)
      setCurrentTime(Date.now())
    }, 3500)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Status progression action
  const updateStatus = async (
    orderId: string,
    newStatus: 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED'
  ) => {
    setUpdatingOrderId(orderId)
    try {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )

      const res = await fetch(`/api/kitchen/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        throw new Error('Failed to update status')
      }

      const statusLabels: Record<string, string> = {
        PREPARING: 'Started cooking',
        READY: 'Marked as Ready to Serve',
        SERVED: 'Order completed & served',
        CANCELLED: 'Order cancelled',
      }
      showToast(`Order #${orderId.slice(-4).toUpperCase()}: ${statusLabels[newStatus] || newStatus}`)

      // Refresh to synchronize
      fetchOrders(true)
    } catch (err) {
      console.error('Error transitioning order status:', err)
      showToast('❌ Failed to update order status. Please retry.')
      fetchOrders(true)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Calculate elapsed time formatted string
  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = currentTime - new Date(dateStr).getTime()
    return Math.max(0, Math.floor(diffMs / 60000))
  }

  // Filter orders based on active tab
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return o.status !== 'SERVED' && o.status !== 'CANCELLED'
    if (activeTab === 'history') return o.status === 'SERVED' || o.status === 'CANCELLED'
    if (activeTab === 'PENDING') return o.status === 'PENDING' || o.status === 'CONFIRMED'
    return o.status === activeTab
  })

  // Counts for tabs
  const pendingCount = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length
  const readyCount = orders.filter((o) => o.status === 'READY').length
  const activeTotal = pendingCount + preparingCount + readyCount

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-bounce bg-zinc-900 border-2 border-orange-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <Bell className="w-5 h-5 text-orange-400 shrink-0" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Control Bar: Tabs, Sound, Sync & Stats */}
      <div className="bg-zinc-900/90 backdrop-blur-md rounded-3xl p-4 sm:p-5 border border-zinc-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span>All Active</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-white font-mono">
              {activeTotal}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'PENDING'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/30'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {pendingCount > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              )}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>New Tickets</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-white font-mono">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('PREPARING')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'PREPARING'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Cooking</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-white font-mono">
              {preparingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('READY')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'READY'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready for Pickup</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 text-white font-mono">
              {readyCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-zinc-700 text-white shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Completed</span>
          </button>
        </div>

        {/* Sync & Audio Controls */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden sm:inline">Synced</span>
            <span className="font-mono text-zinc-300">
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled
                setSoundEnabled(next)
                if (next) playChime()
              }}
              title={soundEnabled ? 'Audio alerts active (click to mute)' : 'Audio muted (click to unmute)'}
              className={`p-2.5 rounded-2xl border transition-colors ${
                soundEnabled
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={() => fetchOrders(false)}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-12 text-center max-w-lg mx-auto my-12">
          <div className="w-16 h-16 rounded-3xl bg-zinc-800/80 text-zinc-500 flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Tickets in this Queue</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            {activeTab === 'history'
              ? 'No completed orders recorded yet.'
              : 'All caught up! New orders placed by cafe tables will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const elapsedMinutes = getElapsedMinutes(order.createdAt)
            const isUrgent = elapsedMinutes >= 15 && (order.status === 'PENDING' || order.status === 'PREPARING')
            const isWarning = elapsedMinutes >= 8 && elapsedMinutes < 15

            return (
              <div
                key={order.id}
                className={`bg-zinc-900 rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-200 ${
                  order.status === 'READY'
                    ? 'border-emerald-500/40 shadow-emerald-950/30'
                    : order.status === 'PREPARING'
                    ? 'border-blue-500/40 shadow-blue-950/30'
                    : isUrgent
                    ? 'border-red-500/50 shadow-red-950/40 animate-pulse'
                    : 'border-zinc-800'
                }`}
              >
                {/* Header Ticket Banner */}
                <div>
                  <div
                    className={`p-4 sm:p-5 flex items-start justify-between border-b ${
                      order.status === 'READY'
                        ? 'bg-emerald-950/30 border-emerald-900/40'
                        : order.status === 'PREPARING'
                        ? 'bg-blue-950/30 border-blue-900/40'
                        : 'bg-zinc-800/40 border-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.orderType === 'DELIVERY' ? (
                          <span className="px-3 py-1 rounded-xl bg-amber-500 text-white font-black text-xs sm:text-sm tracking-wider shadow">
                            🛵 DELIVERY ({order.customerName || 'OUTSIDE'})
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl bg-orange-500 text-white font-black text-sm tracking-wider shadow">
                            TABLE {order.table ? order.table.number : '?'}
                          </span>
                        )}
                        <span className="text-xs font-mono font-semibold text-zinc-400">
                          #{order.id.slice(-4).toUpperCase()}
                        </span>
                        {order.paymentStatus === 'PAID' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            PAID ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                            ⏳ AWAITING PAYMENT CHECK
                          </span>
                        )}
                      </div>
                      {order.deliveryAddress && (
                        <div className="text-xs text-amber-300 font-semibold mt-1 flex items-center gap-1">
                          <span>📍 {order.deliveryAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 text-xs">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span
                          className={`font-semibold ${
                            isUrgent
                              ? 'text-red-400'
                              : isWarning
                              ? 'text-amber-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          {elapsedMinutes === 0 ? 'Just now' : `${elapsedMinutes}m ago`}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide border ${
                        order.status === 'READY'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : order.status === 'PREPARING'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : order.status === 'SERVED'
                          ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {order.status === 'PENDING'
                        ? 'NEW ORDER'
                        : order.status === 'PREPARING'
                        ? 'COOKING'
                        : order.status}
                    </span>
                  </div>

                  {/* General Order Notes Banner */}
                  {order.notes && (
                    <div className="bg-amber-950/40 border-b border-amber-900/40 px-4 py-2 flex items-start gap-2 text-xs text-amber-200">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Customer Note:</span> {order.notes}
                      </div>
                    </div>
                  )}

                  {/* Food Quality / Remake Alert Banner */}
                  {order.complaints && order.complaints.length > 0 && (
                    <div className="bg-rose-950/60 border-y border-rose-600/60 px-4 py-2.5 space-y-1 text-xs text-rose-200">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-rose-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                          <span>
                            {order.complaints[0].desiredAction === 'REMAKE'
                              ? '🔥 URGENT REMAKE REQUESTED'
                              : '⚠️ CUSTOMER FOOD ISSUE'}
                          </span>
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          {order.complaints[0].status}
                        </span>
                      </div>
                      <div className="text-[11px]">
                        <strong className="text-white block">
                          {order.complaints[0].items ? `Item: ${order.complaints[0].items}` : order.complaints[0].category.replace(/_/g, ' ')}
                        </strong>
                        <p className="italic text-zinc-300">&quot;{order.complaints[0].details}&quot;</p>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="p-4 sm:p-5 space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-2xl bg-zinc-800/40 border border-zinc-800/80 flex items-start gap-3"
                      >
                        {item.product.imageUrl && (
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="w-8 h-8 rounded-xl bg-zinc-800 text-orange-400 font-extrabold text-sm flex items-center justify-center shrink-0 border border-zinc-700">
                          {item.quantity}x
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-zinc-100 leading-snug">
                            {item.product.name}
                          </p>
                          {item.notes && (
                            <div className="mt-1 inline-block px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-semibold text-amber-300">
                              ⚠️ {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action Stepper */}
                <div className="p-4 sm:p-5 pt-0 border-t border-zinc-800/60 mt-2">
                  <div className="flex items-center justify-between gap-2 pt-3">
                    {/* Status progression triggers */}
                    {order.status === 'PENDING' || order.status === 'CONFIRMED' ? (
                      order.paymentStatus !== 'PAID' ? (
                        <div className="w-full py-2.5 px-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Hold: Admin checking payment...</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => updateStatus(order.id, 'PREPARING')}
                          disabled={updatingOrderId === order.id}
                          className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <Flame className="w-4 h-4" />
                          <span>Start Cooking</span>
                        </button>
                      )
                    ) : order.status === 'PREPARING' ? (
                      <button
                        onClick={() => updateStatus(order.id, 'READY')}
                        disabled={updatingOrderId === order.id}
                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark as Ready to Serve</span>
                      </button>
                    ) : order.status === 'READY' ? (
                      <button
                        onClick={() => updateStatus(order.id, 'SERVED')}
                        disabled={updatingOrderId === order.id}
                        className="w-full py-3 rounded-2xl bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark Order Served / Done</span>
                      </button>
                    ) : (
                      <div className="w-full text-center py-2 text-xs font-semibold text-zinc-500">
                        Completed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}

                    {/* Void / Cancel option for non-served orders */}
                    {order.status !== 'SERVED' && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => {
                          const dest = order.orderType === 'DELIVERY'
                            ? `Delivery #${order.id.slice(-4).toUpperCase()}`
                            : `Table ${order.table ? order.table.number : '?'}`
                          if (confirm(`Cancel ticket for ${dest}?`)) {
                            updateStatus(order.id, 'CANCELLED')
                          }
                        }}
                        disabled={updatingOrderId === order.id}
                        title="Cancel order"
                        className="p-3 rounded-2xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors shrink-0"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
