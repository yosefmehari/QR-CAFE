'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bike,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Check,
  MapPin,
  Phone,
  User,
  ExternalLink,
  Navigation,
  Sparkles,
  History,
  Bell,
  Utensils,
  CupSoda,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'

export type DeliveryOrderItem = {
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

export type DeliveryOrder = {
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
  items: DeliveryOrderItem[]
}

interface DeliveryDisplayClientProps {
  initialOrders: DeliveryOrder[]
  courierName: string
}

export default function DeliveryDisplayClient({
  initialOrders,
  courierName,
}: DeliveryDisplayClientProps) {
  // Only filter delivery orders initially
  const [orders, setOrders] = useState<DeliveryOrder[]>(
    initialOrders.filter((o) => o.orderType === 'DELIVERY')
  )
  const [activeTab, setActiveTab] = useState<'ready' | 'transit' | 'preparing' | 'all' | 'history'>('ready')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [, setLastUpdated] = useState<Date>(() => new Date())
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  // Store known ready order IDs to detect newly ready tickets
  const previousReadyIdsRef = useRef<Set<string>>(
    new Set(
      initialOrders
        .filter((o) => o.orderType === 'DELIVERY' && o.status === 'READY')
        .map((o) => o.id)
    )
  )

  // Track if audio context is unlocked by user interaction
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // Request browser notification permission
  const requestNotificationAccess = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission()
        setNotificationPermission(perm)
        if (perm === 'granted') {
          showToast('✓ Browser notifications enabled for new deliveries!')
          new Notification('🛵 Aroma & Fork Delivery Alert', {
            body: 'You will receive alerts here when orders are completed by the kitchen.',
            icon: '/favicon.ico',
          })
        }
      } catch (err) {
        console.error('Error requesting notification permission:', err)
      }
    }
  }

  // Synthesized Delivery Dispatch Chime (Two-tone loud courier horn/chime)
  const playDeliveryNotificationSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const now = ctx.currentTime

      // First Tone: High crisp chime (880 Hz - A5)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(880, now)
      gain1.gain.setValueAtTime(0.5, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.3)

      // Second Tone: Harmonic lift (1320 Hz - E6)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(1320, now + 0.12)
      gain2.gain.setValueAtTime(0.6, now + 0.12)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.12)
      osc2.stop(now + 0.7)

      // Third Tone: Bell accent (1760 Hz - A6)
      const osc3 = ctx.createOscillator()
      const gain3 = ctx.createGain()
      osc3.type = 'sine'
      osc3.frequency.setValueAtTime(1760, now + 0.25)
      gain3.gain.setValueAtTime(0.4, now + 0.25)
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9)
      osc3.connect(gain3)
      gain3.connect(ctx.destination)
      osc3.start(now + 0.25)
      osc3.stop(now + 0.9)

      setAudioUnlocked(true)
    } catch {
      // Audio context may be restricted before user clicks
    }
  }, [soundEnabled])

  // Fire all notification channels (Audio + Notification API + Vibration)
  const triggerReadyAlert = useCallback(
    (order: DeliveryOrder) => {
      // 1. Play synthesized audio chime
      playDeliveryNotificationSound()

      // 2. Mobile haptic vibration pattern
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([300, 100, 300, 100, 500])
        } catch {
          // ignore
        }
      }

      // 3. Desktop HTML5 notification
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification('🛵 Order Ready for Delivery!', {
            body: `Order #${order.id.slice(-4).toUpperCase()} for ${
              order.customerName || 'Customer'
            } (${order.deliveryAddress || 'Address'}) is ready for pickup!`,
            icon: '/favicon.ico',
          })
        } catch {
          // ignore
        }
      }

      // 4. In-app toast
      showToast(
        `🔔 Order #${order.id.slice(-4).toUpperCase()} is READY! Pick up from kitchen counter.`
      )
    },
    [playDeliveryNotificationSound]
  )

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4500)
  }

  // Poll orders
  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!silent) setIsRefreshing(true)
      try {
        const isHistoryTab = activeTab === 'history'
        const res = await fetch(`/api/kitchen/orders?view=${isHistoryTab ? 'history' : 'active'}`)
        if (!res.ok) return
        const data = await res.json()
        const fetchedAll: DeliveryOrder[] = data.orders || []

        // Keep only DELIVERY orders
        const fetchedDeliveries = fetchedAll.filter((o) => o.orderType === 'DELIVERY')

        if (!isHistoryTab) {
          // Check if any delivery order transitioned to READY
          const newlyReady = fetchedDeliveries.filter(
            (o) => o.status === 'READY' && !previousReadyIdsRef.current.has(o.id)
          )

          if (newlyReady.length > 0) {
            triggerReadyAlert(newlyReady[0])
          }
        }

        previousReadyIdsRef.current = new Set(
          fetchedDeliveries.filter((o) => o.status === 'READY').map((o) => o.id)
        )
        setOrders(fetchedDeliveries)
        setLastUpdated(new Date())
      } catch (err) {
        console.error('Failed to poll delivery orders:', err)
      } finally {
        if (!silent) setIsRefreshing(false)
      }
    },
    [activeTab, triggerReadyAlert]
  )

  // Polling loop
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true)
      setCurrentTime(Date.now())
    }, 3500)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Update order status
  const updateDeliveryStatus = async (
    orderId: string,
    newStatus: DeliveryOrder['status'],
    successMsg: string,
    markPaid = false
  ) => {
    setUpdatingOrderId(orderId)
    try {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                acceptedBy: courierName || o.acceptedBy,
                paymentStatus: markPaid ? 'PAID' : o.paymentStatus,
              }
            : o
        )
      )

      const body: Record<string, unknown> = {
        status: newStatus,
        acceptedBy: courierName,
      }
      if (markPaid) {
        body.paymentStatus = 'PAID'
      }

      const res = await fetch(`/api/kitchen/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  // Filter orders by tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'ready') return order.status === 'READY'
    if (activeTab === 'transit') return order.status === 'OUT_FOR_DELIVERY'
    if (activeTab === 'preparing')
      return (
        order.status === 'PREPARING' ||
        order.status === 'PENDING' ||
        order.status === 'CONFIRMED'
      )
    if (activeTab === 'all')
      return order.status !== 'SERVED' && order.status !== 'CANCELLED'
    if (activeTab === 'history')
      return order.status === 'SERVED' || order.status === 'CANCELLED'
    return true
  })

  // Counters
  const countReady = orders.filter((o) => o.status === 'READY').length
  const countTransit = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length
  const countPreparing = orders.filter(
    (o) =>
      o.status === 'PREPARING' ||
      o.status === 'PENDING' ||
      o.status === 'CONFIRMED'
  ).length
  const countDelivered = orders.filter((o) => o.status === 'SERVED').length

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top duration-300 bg-amber-500 text-zinc-950 font-bold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border-2 border-amber-300">
          <Sparkles className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Flashing Urgent Banner: Orders Ready for Pickup */}
      {countReady > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-2 border-amber-400/80 shadow-2xl shadow-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30 shrink-0">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-white">
                  {countReady} Delivery Order{countReady > 1 ? 's' : ''} Completed &amp; Ready!
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-zinc-950 uppercase tracking-wider">
                  Pickup from Counter
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-0.5">
                The kitchen or juice bar has packed these orders. Accept below and depart for the customer&apos;s address.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('ready')}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            View Ready Orders ({countReady}) →
          </button>
        </div>
      )}

      {/* Permission & Sound Helper Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-zinc-400">
            Courier: <strong className="text-white">{courierName}</strong>
          </span>

          {notificationPermission !== 'granted' && (
            <button
              onClick={requestNotificationAccess}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Enable Background System Notifications</span>
            </button>
          )}

          {!audioUnlocked && (
            <button
              onClick={playDeliveryNotificationSound}
              className="px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/25 transition-all font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Test Audio Dispatch Chime</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2 rounded-2xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700'
                : 'bg-zinc-800/50 border-zinc-800 text-zinc-500 hover:text-zinc-400'
            }`}
            title={soundEnabled ? 'Disable dispatch alert chime' : 'Enable dispatch alert chime'}
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
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('ready')}
          className={`rounded-3xl p-4 sm:p-5 border cursor-pointer transition-all ${
            activeTab === 'ready'
              ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/10'
              : 'bg-gradient-to-br from-amber-950/40 to-zinc-900 border-amber-500/30 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Ready for Pickup
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{countReady}</span>
            <span className="text-xs text-zinc-400">waiting at counter</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('transit')}
          className={`rounded-3xl p-4 sm:p-5 border cursor-pointer transition-all ${
            activeTab === 'transit'
              ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/10'
              : 'bg-gradient-to-br from-blue-950/40 to-zinc-900 border-blue-500/30 hover:border-blue-500/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Out on the Road
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-400">{countTransit}</span>
            <span className="text-xs text-zinc-400">in transit</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('preparing')}
          className={`rounded-3xl p-4 sm:p-5 border cursor-pointer transition-all ${
            activeTab === 'preparing'
              ? 'bg-zinc-800 border-zinc-600'
              : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              In Kitchen / Bar
            </span>
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-orange-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-200">{countPreparing}</span>
            <span className="text-xs text-zinc-500">being prepared</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('history')}
          className={`rounded-3xl p-4 sm:p-5 border cursor-pointer transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/10'
              : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Delivered
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{countDelivered}</span>
            <span className="text-xs text-zinc-500">completed</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('ready')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ready'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Ready for Delivery ({countReady})</span>
        </button>

        <button
          onClick={() => setActiveTab('transit')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'transit'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Out on the Road ({countTransit})</span>
        </button>

        <button
          onClick={() => setActiveTab('preparing')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'preparing'
              ? 'bg-zinc-200 text-zinc-950 shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Cooking / In Prep ({countPreparing})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'all'
              ? 'bg-zinc-100 text-zinc-900 shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          All Active Deliveries
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-zinc-950 shadow-md'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Delivered History ({countDelivered})</span>
        </button>
      </div>

      {/* Delivery Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Deliveries in this View</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {activeTab === 'ready'
                ? 'No packages currently waiting on the counter. When the kitchen or juice bar completes an order, your screen will chime and alert you here!'
                : 'No delivery tickets found matching this filter.'}
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
            const isTransit = order.status === 'OUT_FOR_DELIVERY'
            const isUpdating = updatingOrderId === order.id
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              order.deliveryAddress || ''
            )}`

            return (
              <div
                key={order.id}
                className={`bg-zinc-900/95 rounded-3xl border flex flex-col justify-between transition-all duration-200 overflow-hidden shadow-xl ${
                  isReady
                    ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-amber-500/10'
                    : isTransit
                    ? 'border-blue-500/70 ring-2 ring-blue-500/20'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header */}
                <div
                  className={`p-4 sm:p-5 border-b border-zinc-800/80 ${
                    isReady ? 'bg-amber-500/15' : isTransit ? 'bg-blue-950/30' : 'bg-zinc-950/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl font-black text-xs flex flex-col items-center justify-center shadow-lg shrink-0 ${
                          isReady
                            ? 'bg-amber-500 text-zinc-950 shadow-amber-500/30 animate-pulse'
                            : isTransit
                            ? 'bg-blue-500 text-white shadow-blue-500/30'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <Bike className="w-5 h-5" />
                        <span className="text-[9px] font-extrabold uppercase">
                          #{order.id.slice(-4).toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-base text-white">
                            {order.customerName || 'Customer Delivery'}
                          </span>
                          {isReady && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-zinc-950 animate-bounce">
                              READY FOR PICKUP
                            </span>
                          )}
                          {isTransit && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                              ON THE ROAD
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Ordered {elapsedMins}m ago • {order.items.length} dishes/drinks
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-emerald-400">
                        ${Number(order.totalPrice).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {order.paymentMethod || 'CARD'}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address & Navigation Card */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 text-zinc-200">
                        <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="font-bold text-white leading-snug">
                          {order.deliveryAddress || 'Address not specified'}
                        </span>
                      </div>

                      {order.deliveryAddress && (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-bold text-[11px] transition-colors shrink-0"
                          title="Open address in Google Maps"
                        >
                          <Navigation className="w-3 h-3 text-amber-400" />
                          <span>Maps</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      )}
                    </div>

                    {/* Customer phone & Tap to Call */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80 text-[11px]">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{order.customerName || 'Guest'}</span>
                      </div>

                      {order.customerPhone ? (
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="flex items-center gap-1 font-mono text-emerald-400 hover:underline font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{order.customerPhone}</span>
                        </a>
                      ) : (
                        <span className="text-zinc-500 text-[10px]">No phone</span>
                      )}
                    </div>

                    {/* Special Delivery Instructions */}
                    {order.deliveryNotes && (
                      <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                        <span className="font-bold">Instructions:</span> {order.deliveryNotes}
                      </div>
                    )}

                    {/* Courier Tag */}
                    {order.acceptedBy && (
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1 pt-0.5">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Courier: {order.acceptedBy}</span>
                      </div>
                    )}
                  </div>

                  {/* General order notes */}
                  {order.notes && (
                    <div className="mt-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-300 text-[11px] flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{order.notes}</span>
                    </div>
                  )}
                </div>

                {/* Items to Deliver */}
                <div className="p-4 sm:p-5 flex-1 space-y-3">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Order Contents ({order.items.length} items):</span>
                    <span className="text-[10px] text-zinc-500">
                      Check items before departing
                    </span>
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
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/60">
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
                                <span>Bar</span>
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

                {/* Courier Action Area */}
                <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-950/60 space-y-2">
                  {order.status === 'READY' ? (
                    <button
                      onClick={() =>
                        updateDeliveryStatus(
                          order.id,
                          'OUT_FOR_DELIVERY',
                          `🛵 You departed for ${order.deliveryAddress || 'customer address'}!`
                        )
                      }
                      disabled={isUpdating}
                      className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] text-zinc-950 shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Bike className="w-4 h-4" />
                      <span>Pick Up &amp; Start Delivery (Depart Now)</span>
                    </button>
                  ) : order.status === 'OUT_FOR_DELIVERY' ? (
                    <button
                      onClick={() =>
                        updateDeliveryStatus(
                          order.id,
                          'SERVED',
                          `✓ Order marked as DELIVERED to ${order.deliveryAddress || 'customer'}!`,
                          true
                        )
                      }
                      disabled={isUpdating}
                      className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Delivered ✓ (Handed to Customer)</span>
                    </button>
                  ) : order.status === 'PENDING' ||
                    order.status === 'CONFIRMED' ||
                    order.status === 'PREPARING' ? (
                    <div className="flex items-center justify-between text-xs py-1 text-zinc-400">
                      <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <Clock className="w-4 h-4 animate-spin" />
                        In Kitchen Prep ({order.status})
                      </span>
                      <button
                        onClick={() =>
                          updateDeliveryStatus(
                            order.id,
                            'OUT_FOR_DELIVERY',
                            `🛵 Departed for ${order.deliveryAddress || 'customer address'}!`
                          )
                        }
                        disabled={isUpdating}
                        className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                      >
                        Pick Up Early
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-bold py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Delivered Successfully</span>
                    </div>
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
