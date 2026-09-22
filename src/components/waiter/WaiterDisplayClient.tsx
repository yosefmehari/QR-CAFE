'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Check,
  MapPin,
  Utensils,
  CupSoda,
  Sparkles,
  History,
  Layers,
  Bike,
  Phone,
  User,
  Send,
  AlertTriangle,
} from 'lucide-react'

export type WaiterOrderItem = {
  id: string
  quantity: number
  unitPrice: number | string
  notes?: string | null
  product: {
    id: string
    name: string
    imageUrl?: string | null
    category?: {
      name: string
      slug: string
      emoji?: string | null
    } | null
  }
}

export type WaiterComplaint = {
  id: string
  category: string
  items?: string | null
  details: string
  desiredAction?: string | null
  status: string
  staffNotes?: string | null
  createdAt: string
}

export type WaiterOrder = {
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
  complaints?: WaiterComplaint[]
  items: WaiterOrderItem[]
}

export type CafeTable = {
  id: string
  number: number
  isActive: boolean
}

interface WaiterDisplayClientProps {
  initialOrders: WaiterOrder[]
  tables: CafeTable[]
}

export default function WaiterDisplayClient({
  initialOrders,
  tables,
}: WaiterDisplayClientProps) {
  const [orders, setOrders] = useState<WaiterOrder[]>(initialOrders)
  const [activeTab, setActiveTab] = useState<'ready' | 'delivery' | 'preparing' | 'all' | 'history'>('ready')
  const [selectedTableNumber, setSelectedTableNumber] = useState<number | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [, setLastUpdated] = useState<Date>(() => new Date())
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  // Keep track of orders that were READY previously to chime when a new one is READY
  const previousReadyIdsRef = useRef<Set<string>>(
    new Set(initialOrders.filter((o) => o.status === 'READY').map((o) => o.id))
  )

  // Service bell synthesized chime for orders READY for table delivery
  const playServiceBell = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const now = ctx.currentTime

      // Two crisp service bell pings (1200Hz & 1800Hz)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(1480, now) // F#6 bell
      osc.frequency.setValueAtTime(1760, now + 0.08) // A6

      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.8)
    } catch {
      // Audio context may be restricted before interaction
    }
  }, [soundEnabled])

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }, [])

  // Poll orders
  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!silent) setIsRefreshing(true)
      try {
        const isHistoryTab = activeTab === 'history'
        const res = await fetch(`/api/kitchen/orders?view=${isHistoryTab ? 'history' : 'active'}`)
        if (!res.ok) return
        const data = await res.json()
        const fetched: WaiterOrder[] = data.orders || []

        if (!isHistoryTab) {
          const newlyReady = fetched.filter(
            (o) => o.status === 'READY' && !previousReadyIdsRef.current.has(o.id)
          )
          if (newlyReady.length > 0) {
            playServiceBell()
            const destination = newlyReady[0].table
              ? `Table #${newlyReady[0].table.number}`
              : `Delivery to ${newlyReady[0].deliveryAddress || 'Address'}`
            showToast(`🔔 ${destination} order is READY for delivery!`)
          }
        }

        previousReadyIdsRef.current = new Set(
          fetched.filter((o) => o.status === 'READY').map((o) => o.id)
        )
        setOrders(fetched)
        setLastUpdated(new Date())
      } catch (err) {
        console.error('Failed to poll waiter orders:', err)
      } finally {
        if (!silent) setIsRefreshing(false)
      }
    },
    [activeTab, playServiceBell, showToast]
  )

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true)
      setCurrentTime(Date.now())
    }, 3500)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // General Status Update action for Waiters
  const updateOrderStatus = async (
    orderId: string,
    newStatus: WaiterOrder['status'],
    successMsg: string
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

      showToast(successMsg)
    } catch {
      showToast('⚠️ Error updating order status')
      fetchOrders(false)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  // Table status calculation
  const getTableStatus = (tableNum: number) => {
    const tableOrders = orders.filter((o) => o.table?.number === tableNum)
    const hasReady = tableOrders.some((o) => o.status === 'READY')
    if (hasReady) return 'READY'
    const hasPrep = tableOrders.some(
      (o) =>
        o.status === 'PREPARING' ||
        o.status === 'PENDING' ||
        o.status === 'CONFIRMED' ||
        o.status === 'OUT_FOR_DELIVERY'
    )
    if (hasPrep) return 'PREPARING'
    const hasServed = tableOrders.some((o) => o.status === 'SERVED')
    if (hasServed) return 'SERVED'
    return 'AVAILABLE'
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (selectedTableNumber !== null) {
      if (selectedTableNumber === -1) {
        if (order.orderType !== 'DELIVERY') return false
      } else if (order.table?.number !== selectedTableNumber) {
        return false
      }
    }

    if (activeTab === 'ready') return order.status === 'READY'
    if (activeTab === 'delivery')
      return (
        order.orderType === 'DELIVERY' &&
        order.status !== 'SERVED' &&
        order.status !== 'CANCELLED'
      )
    if (activeTab === 'preparing')
      return (
        order.status === 'PREPARING' ||
        order.status === 'PENDING' ||
        order.status === 'CONFIRMED' ||
        order.status === 'OUT_FOR_DELIVERY'
      )
    if (activeTab === 'all')
      return order.status !== 'SERVED' && order.status !== 'CANCELLED'
    if (activeTab === 'history')
      return order.status === 'SERVED' || order.status === 'CANCELLED'
    return true
  })

  // Counters
  const countReady = orders.filter((o) => o.status === 'READY').length
  const countDeliveries = orders.filter(
    (o) =>
      o.orderType === 'DELIVERY' &&
      o.status !== 'SERVED' &&
      o.status !== 'CANCELLED'
  ).length
  const countPreparing = orders.filter(
    (o) =>
      o.status === 'PREPARING' ||
      o.status === 'PENDING' ||
      o.status === 'CONFIRMED' ||
      o.status === 'OUT_FOR_DELIVERY'
  ).length
  const countServed = orders.filter((o) => o.status === 'SERVED').length

  const pendingComplaints = orders.flatMap((o) =>
    (o.complaints || [])
      .filter((c) => c.status !== 'RESOLVED')
      .map((c) => ({ complaint: c, order: o }))
  )

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top duration-300 bg-blue-500 text-white font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-blue-400">
          <Sparkles className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Urgent Floor Return / Complaint Banner */}
      {pendingComplaints.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-950/80 border-2 border-rose-600 shadow-xl shadow-rose-950/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300 font-black text-sm uppercase tracking-wider">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
              <span>
                Floor Alert: {pendingComplaints.length} Customer Return / Quality Issue{pendingComplaints.length > 1 ? 's' : ''}!
              </span>
            </div>
            <span className="text-xs bg-rose-600 text-white font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Immediate Attention
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {pendingComplaints.map(({ complaint, order }) => (
              <div
                key={complaint.id}
                className="p-3.5 rounded-2xl bg-zinc-900 border border-rose-500/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <span className="font-black text-white text-sm block">
                    {order.table ? `Table #${order.table.number}` : order.deliveryAddress || 'Delivery'}:{' '}
                    <span className="text-rose-400">
                      {complaint.category === 'DISLIKE_FOOD'
                        ? "Don't Like Food / Taste"
                        : complaint.category === 'RETURN_DISH'
                        ? 'Return Dish Requested'
                        : complaint.category.replace(/_/g, ' ')}
                    </span>
                  </span>
                  <p className="text-zinc-300 text-[11px] italic mt-0.5">
                    &quot;{complaint.details}&quot;
                  </p>
                  <div className="text-[11px] text-amber-400 font-semibold mt-1">
                    Action: {complaint.desiredAction?.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {complaint.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/admin/complaints/${complaint.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            status: 'REVIEWING',
                            staffNotes: 'Waiter attending table now',
                          }),
                        })
                        fetchOrders(false)
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition-colors"
                    >
                      Heading to Table
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      const note = window.prompt(
                        'Resolution note (e.g. Dish collected from table and replacement delivered):'
                      )
                      if (note === null) return
                      await fetch(`/api/admin/complaints/${complaint.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          status: 'RESOLVED',
                          staffNotes: note || 'Resolved at table by waiter',
                        }),
                      })
                      fetchOrders(false)
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer transition-colors"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Floor Metrics */}
      {/* Top Floor & Delivery Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-950/40 to-zinc-900 border border-blue-500/30 rounded-3xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Ready to Deliver
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-400">{countReady}</span>
            <span className="text-xs text-zinc-400">urgent delivery runs</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-950/30 to-zinc-900 border border-amber-500/30 rounded-3xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Outside Deliveries
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{countDeliveries}</span>
            <span className="text-xs text-zinc-400">to external addresses</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              In Kitchen / Bar
            </span>
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-200">{countPreparing}</span>
            <span className="text-xs text-zinc-500">being prepared</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Delivered &amp; Served
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{countServed}</span>
            <span className="text-xs text-zinc-500">completed</span>
          </div>
        </div>
      </div>

      {/* Interactive Table Floor Map & Delivery Station */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Floor &amp; Delivery Overview</h2>
            <span className="text-xs text-zinc-400 hidden sm:inline">
              (Click any table or Outside Delivery to filter)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-blue-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping inline-block mr-0.5" />
              Ready
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Cooking
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Free
            </span>
            {selectedTableNumber !== null && (
              <button
                onClick={() => setSelectedTableNumber(null)}
                className="px-2.5 py-1 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Tables & Deliveries Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3">
          {/* Outside Delivery Filter Tile */}
          <button
            onClick={() => setSelectedTableNumber(selectedTableNumber === -1 ? null : -1)}
            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer col-span-2 sm:col-span-2 ${
              selectedTableNumber === -1
                ? 'ring-2 ring-amber-400 scale-105 bg-amber-500/20 border-amber-500'
                : countDeliveries > 0
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-md animate-pulse'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 flex items-center gap-1">
              <Bike className="w-3.5 h-3.5 text-amber-400" /> Outside
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400">
              {countDeliveries}
            </span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-amber-500/20 text-amber-300">
              {countDeliveries > 0 ? 'DELIVERIES' : 'NO ORDERS'}
            </span>
          </button>

          {tables.map((tbl) => {
            const status = getTableStatus(tbl.number)
            const isSelected = selectedTableNumber === tbl.number

            return (
              <button
                key={tbl.id}
                onClick={() =>
                  setSelectedTableNumber(isSelected ? null : tbl.number)
                }
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-blue-400 scale-105'
                    : 'hover:scale-102'
                } ${
                  status === 'READY'
                    ? 'bg-blue-950/60 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/20 animate-pulse'
                    : status === 'PREPARING'
                    ? 'bg-amber-950/30 border-amber-500/50 text-amber-300'
                    : status === 'SERVED'
                    ? 'bg-zinc-800/60 border-zinc-700 text-zinc-300'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                  Table
                </span>
                <span className="text-xl sm:text-2xl font-black text-white">
                  {tbl.number}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                    status === 'READY'
                      ? 'bg-blue-500 text-white'
                      : status === 'PREPARING'
                      ? 'bg-amber-500/20 text-amber-300'
                      : status === 'SERVED'
                      ? 'bg-zinc-700 text-zinc-300'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {status === 'READY' ? 'DELIVER' : status === 'AVAILABLE' ? 'FREE' : status}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          <button
            onClick={() => setActiveTab('ready')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ready'
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Ready for Delivery ({countReady})</span>
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'delivery'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Outside Deliveries ({countDeliveries})</span>
          </button>
          <button
            onClick={() => setActiveTab('preparing')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'preparing'
                ? 'bg-zinc-200 text-zinc-950 shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            In Preparation ({countPreparing})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-zinc-100 text-zinc-900 shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            All Active Orders
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Served History ({countServed})</span>
          </button>
        </div>

        {/* Right Station Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2 rounded-2xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-zinc-800 border-zinc-700 text-blue-400 hover:bg-zinc-700'
                : 'bg-zinc-800/50 border-zinc-800 text-zinc-500 hover:text-zinc-400'
            }`}
            title={soundEnabled ? 'Disable service bell' : 'Enable service bell'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchOrders(false)}
            disabled={isRefreshing}
            className="p-2 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Poll orders now"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">All Clear on Table Deliveries!</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {activeTab === 'ready'
                ? 'No tickets currently waiting for pickup. The service bell will ding when Kitchen or Juice Bar finishes an order!'
                : 'No orders found matching this filter.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredOrders.map((order) => {
            const elapsedMins = Math.floor(
              (currentTime - new Date(order.createdAt).getTime()) / (1000 * 60)
            )
            const isReady = order.status === 'READY'
            const isUpdating = updatingOrderId === order.id

            return (
              <div
                key={order.id}
                className={`bg-zinc-900/90 rounded-3xl border flex flex-col justify-between transition-all duration-200 overflow-hidden shadow-xl ${
                  isReady
                    ? 'border-blue-500/70 ring-2 ring-blue-500/30 shadow-blue-500/10'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header */}
                <div
                  className={`p-4 sm:p-5 border-b border-zinc-800/80 ${
                    isReady ? 'bg-blue-950/30' : 'bg-zinc-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {order.orderType === 'DELIVERY' ? (
                        <div
                          className={`w-12 h-12 rounded-2xl font-black text-xs flex flex-col items-center justify-center shadow-lg ${
                            isReady
                              ? 'bg-blue-500 text-white shadow-blue-500/30 animate-pulse'
                              : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white'
                          }`}
                        >
                          <Bike className="w-5 h-5" />
                          <span className="text-[9px] font-extrabold uppercase">DELIV</span>
                        </div>
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center shadow-lg ${
                            isReady
                              ? 'bg-blue-500 text-white shadow-blue-500/30 animate-pulse'
                              : 'bg-zinc-800 text-white'
                          }`}
                        >
                          T{order.table ? order.table.number : '?'}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-base text-white">
                            {order.orderType === 'DELIVERY'
                              ? order.customerName || 'Outside Delivery'
                              : `Table ${order.table ? order.table.number : '?'}`}
                          </span>
                          {order.orderType === 'DELIVERY' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-zinc-950">
                              DELIVERY
                            </span>
                          )}
                          {isReady && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white animate-pulse">
                              READY NOW
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          Order #{order.id.slice(-6).toUpperCase()} • {order.items.length} items
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsedMins}m ago</span>
                    </div>
                  </div>

                  {/* Outside Delivery Address Card */}
                  {order.orderType === 'DELIVERY' && (
                    <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 text-xs">
                      <div className="flex items-start gap-1.5 text-amber-300">
                        <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="font-bold text-white leading-tight">
                          {order.deliveryAddress || 'Address not specified'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-500/20 text-[11px]">
                        <div className="flex items-center gap-1 text-zinc-300">
                          <User className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{order.customerName || 'Guest'}</span>
                        </div>
                        {order.customerPhone && (
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="flex items-center gap-1 font-mono text-amber-400 hover:underline font-bold bg-amber-500/15 px-2 py-0.5 rounded-md transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{order.customerPhone}</span>
                          </a>
                        )}
                      </div>
                      {order.deliveryNotes && (
                        <div className="text-[11px] text-zinc-400 italic pt-0.5">
                          Note: &quot;{order.deliveryNotes}&quot;
                        </div>
                      )}
                      {order.acceptedBy && (
                        <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
                          <Check className="w-3 h-3" />
                          <span>Accepted by {order.acceptedBy}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Customer General Notes */}
                  {order.notes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="font-medium">{order.notes}</span>
                    </div>
                  )}
                </div>

                {/* Customer Complaints & Food Return Requests */}
                {order.complaints && order.complaints.length > 0 && (
                  <div className="p-3.5 mx-4 mt-3 rounded-2xl bg-rose-950/70 border-2 border-rose-500/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-rose-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                        <span>
                          {order.complaints[0].desiredAction?.startsWith('RETURN') ||
                          order.complaints[0].category === 'RETURN_DISH'
                            ? '🚨 Food Return Request'
                            : '⚠️ Food Issue Reported'}
                        </span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.complaints[0].status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : order.complaints[0].status === 'REVIEWING'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
                            : 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                        }`}
                      >
                        {order.complaints[0].status}
                      </span>
                    </div>

                    <div className="text-zinc-200">
                      <span className="font-bold text-rose-300 block">
                        {order.complaints[0].category === 'DISLIKE_FOOD'
                          ? "Don't Like Food / Taste"
                          : order.complaints[0].category === 'RETURN_DISH'
                          ? 'Return Dish Requested'
                          : order.complaints[0].category.replace(/_/g, ' ')}
                        {order.complaints[0].items ? ` — Dish: ${order.complaints[0].items}` : ''}
                      </span>
                      <p className="text-[11px] text-zinc-300 italic bg-zinc-950/80 p-2 rounded-xl mt-1 border border-zinc-800">
                        &quot;{order.complaints[0].details}&quot;
                      </p>
                    </div>

                    <div className="text-[11px] text-amber-300">
                      Requested: <strong>{order.complaints[0].desiredAction?.replace(/_/g, ' ')}</strong>
                    </div>

                    {order.complaints[0].staffNotes && (
                      <div className="text-[10px] text-emerald-300 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-900/50">
                        Resolution: {order.complaints[0].staffNotes}
                      </div>
                    )}

                    {order.complaints[0].status !== 'RESOLVED' && (
                      <div className="flex items-center gap-2 pt-1">
                        {order.complaints[0].status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch(`/api/admin/complaints/${order.complaints![0].id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  status: 'REVIEWING',
                                  staffNotes: 'Waiter dispatched to table',
                                }),
                              })
                              fetchOrders(false)
                            }}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer transition-colors"
                          >
                            Attend Table
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            const note = window.prompt(
                              'Resolution note (e.g. Dish collected from table and replaced/refunded):'
                            )
                            if (note === null) return
                            await fetch(`/api/admin/complaints/${order.complaints![0].id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                status: 'RESOLVED',
                                staffNotes: note || 'Resolved by waiter',
                              }),
                            })
                            fetchOrders(false)
                          }}
                          className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer transition-colors"
                        >
                          Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Items to deliver */}
                <div className="p-4 sm:p-5 flex-1 space-y-3">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Dishes &amp; Drinks to Deliver:
                  </div>

                  <ul className="space-y-2">
                    {order.items.map((item) => {
                      const isDrink =
                        item.product.category?.slug === 'drinks' ||
                        item.product.category?.slug === 'coffee'

                      return (
                        <li
                          key={item.id}
                          className="p-2.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/70 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            {item.product.imageUrl && (
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/60">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <span className="w-6 h-6 rounded-lg bg-zinc-800 font-bold text-zinc-200 flex items-center justify-center text-[11px]">
                              {item.quantity}x
                            </span>
                            <div>
                              <span className="font-semibold text-white">
                                {item.product.name}
                              </span>
                              {item.notes && (
                                <div className="text-[10px] text-amber-400">
                                  Note: {item.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                            {isDrink ? (
                              <>
                                <CupSoda className="w-3 h-3 text-emerald-400" />
                                <span>Juice Bar</span>
                              </>
                            ) : (
                              <>
                                <Utensils className="w-3 h-3 text-orange-400" />
                                <span>Kitchen</span>
                              </>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* Delivery Action Button */}
                <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-950/60">
                  {order.orderType === 'DELIVERY' ? (
                    /* Delivery Order Workflow */
                    order.status === 'PENDING' ? (
                      <button
                        onClick={() =>
                          updateOrderStatus(
                            order.id,
                            'CONFIRMED',
                            `✓ Accepted delivery for ${order.customerName || 'Customer'}! Kitchen notified.`
                          )
                        }
                        disabled={isUpdating}
                        className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] text-white shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 animate-pulse"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Delivery Order (Notify Kitchen)</span>
                      </button>
                    ) : order.status === 'CONFIRMED' || order.status === 'PREPARING' ? (
                      <div className="flex items-center justify-between text-xs py-1 text-zinc-400">
                        <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                          <Clock className="w-4 h-4 animate-spin" />
                          Accepted • In Prep
                        </span>
                        <button
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              'OUT_FOR_DELIVERY',
                              `🛵 Out for delivery to ${order.deliveryAddress || 'Address'}!`
                            )
                          }
                          disabled={isUpdating}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                        >
                          Start Delivery Now
                        </button>
                      </div>
                    ) : order.status === 'READY' ? (
                      <button
                        onClick={() =>
                          updateOrderStatus(
                            order.id,
                            'OUT_FOR_DELIVERY',
                            `🛵 Order is Out for Delivery to ${order.deliveryAddress || 'Address'}!`
                          )
                        }
                        disabled={isUpdating}
                        className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-[0.98] text-white shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Start Delivery (Take to Address)</span>
                      </button>
                    ) : order.status === 'OUT_FOR_DELIVERY' ? (
                      <button
                        onClick={() =>
                          updateOrderStatus(
                            order.id,
                            'SERVED',
                            `✓ Order marked as DELIVERED to ${order.deliveryAddress || 'Address'}!`
                          )
                        }
                        disabled={isUpdating}
                        className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark as Delivered ✓ (Arrived at Address)</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold py-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Delivered to Address</span>
                      </div>
                    )
                  ) : (
                    /* Dine-In Order Workflow */
                    order.status === 'READY' ? (
                      <button
                        onClick={() =>
                          updateOrderStatus(
                            order.id,
                            'SERVED',
                            `✓ Table ${order.table ? order.table.number : '?'} marked as SERVED!`
                          )
                        }
                        disabled={isUpdating}
                        className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-[0.98] text-white shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>Mark as Served ✓ (Delivered to Table)</span>
                      </button>
                    ) : order.status === 'PREPARING' ||
                      order.status === 'PENDING' ||
                      order.status === 'CONFIRMED' ? (
                      <div className="flex items-center justify-between text-xs py-1 text-zinc-400">
                        <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                          <Clock className="w-4 h-4 animate-spin" />
                          In Preparation ({order.status})
                        </span>
                        <button
                          onClick={() =>
                            updateOrderStatus(
                              order.id,
                              'SERVED',
                              `✓ Table ${order.table ? order.table.number : '?'} marked as SERVED!`
                            )
                          }
                          disabled={isUpdating}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
                        >
                          Force Mark Served
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold py-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Delivered &amp; Served</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
