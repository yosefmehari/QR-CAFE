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
  Check,
  Coffee,
  Sparkles,
  CupSoda,
  Utensils,
  History,
} from 'lucide-react'

export type JuiceOrderItem = {
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

export type JuiceOrder = {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED'
  paymentMethod?: string
  paymentStatus?: string
  paymentReference?: string | null
  totalPrice: number | string
  notes?: string | null
  createdAt: string
  table: {
    id: string
    number: number
  }
  items: JuiceOrderItem[]
}

interface JuiceDisplayClientProps {
  initialOrders: JuiceOrder[]
}

// Check if an item belongs to the Juice / Barista station
export function isDrinkItem(item: JuiceOrderItem): boolean {
  const catSlug = item.product.category?.slug?.toLowerCase() || ''
  const catName = item.product.category?.name?.toLowerCase() || ''
  const prodName = item.product.name.toLowerCase()

  const drinkKeywords = [
    'drink',
    'juice',
    'smoothie',
    'coffee',
    'latte',
    'espresso',
    'cappuccino',
    'tea',
    'soda',
    'cola',
    'water',
    'lemonade',
    'shake',
    'beverage',
    'mojito',
  ]

  if (catSlug === 'drinks' || catSlug === 'coffee' || catName.includes('drink') || catName.includes('coffee')) {
    return true
  }

  return drinkKeywords.some((kw) => prodName.includes(kw))
}

export default function JuiceDisplayClient({ initialOrders }: JuiceDisplayClientProps) {
  const [orders, setOrders] = useState<JuiceOrder[]>(initialOrders)
  const [activeTab, setActiveTab] = useState<'all' | 'PENDING' | 'PREPARING' | 'READY' | 'history'>('all')
  const [filterOnlyDrinks, setFilterOnlyDrinks] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [, setLastUpdated] = useState<Date>(() => new Date())
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  // Track known order IDs to trigger sound when a new drink order arrives
  const previousOrderIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.id)))
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  // Web Audio chime for incoming drink tickets
  const playChime = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const now = ctx.currentTime

      const osc1 = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()

      // Bright melodic chime (G5 -> C6)
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(783.99, now) // G5
      osc1.frequency.setValueAtTime(1046.5, now + 0.15) // C6

      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(392.0, now) // G4

      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.6)
      osc2.stop(now + 0.6)
    } catch {
      // Audio context might be restricted before interaction
    }
  }, [soundEnabled])

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }, [])

  // Fetch updated orders from API
  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!silent) setIsRefreshing(true)
      try {
        const isHistoryTab = activeTab === 'history'
        const res = await fetch(`/api/kitchen/orders?view=${isHistoryTab ? 'history' : 'active'}`)
        if (!res.ok) return
        const data = await res.json()
        const fetched: JuiceOrder[] = data.orders || []

        if (!isHistoryTab) {
          const newIncoming = fetched.filter(
            (o) =>
              !previousOrderIdsRef.current.has(o.id) &&
              (o.status === 'PENDING' || o.status === 'CONFIRMED') &&
              o.items.some(isDrinkItem)
          )
          if (newIncoming.length > 0) {
            playChime()
            showToast(`🍹 ${newIncoming.length} new drink order received!`)
          }
        }

        previousOrderIdsRef.current = new Set(fetched.map((o) => o.id))
        setOrders(fetched)
        setLastUpdated(new Date())
      } catch (err) {
        console.error('Failed to poll juice orders:', err)
      } finally {
        if (!silent) setIsRefreshing(false)
      }
    },
    [activeTab, playChime, showToast]
  )

  // Live polling every 3.5s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true)
      setCurrentTime(Date.now())
    }, 3500)
    return () => clearInterval(interval)
  }, [fetchOrders])

  // Update order status
  const updateStatus = async (
    orderId: string,
    newStatus: 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED'
  ) => {
    setUpdatingOrderId(orderId)
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )

      const res = await fetch(`/api/kitchen/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        throw new Error('Failed to update ticket status')
      }

      showToast(`Ticket #${orderId.slice(-4).toUpperCase()} marked as ${newStatus}`)
    } catch {
      showToast('⚠️ Error updating ticket status')
      fetchOrders(false)
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const toggleCheckItem = (itemId: string) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  // Filter orders
  const relevantOrders = orders.filter((o) => {
    if (filterOnlyDrinks) {
      return o.items.some(isDrinkItem)
    }
    return true
  })

  const displayedOrders = relevantOrders.filter((order) => {
    if (activeTab === 'all') return order.status !== 'SERVED' && order.status !== 'CANCELLED'
    if (activeTab === 'history') return order.status === 'SERVED' || order.status === 'CANCELLED'
    if (activeTab === 'PENDING') return order.status === 'PENDING' || order.status === 'CONFIRMED'
    return order.status === activeTab
  })

  // Station counts
  const countPending = relevantOrders.filter(
    (o) => o.status === 'PENDING' || o.status === 'CONFIRMED'
  ).length
  const countPreparing = relevantOrders.filter((o) => o.status === 'PREPARING').length
  const countReady = relevantOrders.filter((o) => o.status === 'READY').length
  const totalActive = countPending + countPreparing + countReady

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top duration-300 bg-emerald-500 text-zinc-950 font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-400">
          <Sparkles className="w-5 h-5 text-zinc-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Station Header & Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Drink Queue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CupSoda className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{totalActive}</span>
            <span className="text-xs text-zinc-500">tickets with drinks</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              To Squeeze / Blend
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{countPending}</span>
            <span className="text-xs text-zinc-500">awaiting prep</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              In Blender / Press
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{countPreparing}</span>
            <span className="text-xs text-zinc-500">being prepared</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Ready at Drink Bar
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400">{countReady}</span>
            <span className="text-xs text-zinc-500">awaiting waiter</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Active Tickets ({totalActive})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Pending ({countPending})
          </button>
          <button
            onClick={() => setActiveTab('PREPARING')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'PREPARING'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Preparing ({countPreparing})
          </button>
          <button
            onClick={() => setActiveTab('READY')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'READY'
                ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Ready for Pickup ({countReady})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-zinc-200 text-zinc-900 shadow-md'
                : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Completed</span>
          </button>
        </div>

        {/* Right Station Controls */}
        <div className="flex items-center gap-2">
          {/* Drink only filter toggle */}
          <button
            onClick={() => setFilterOnlyDrinks((prev) => !prev)}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              filterOnlyDrinks
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            <CupSoda className="w-3.5 h-3.5" />
            <span>{filterOnlyDrinks ? 'Drinks Only' : 'All Kitchen Items'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-2 rounded-2xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-zinc-800 border-zinc-700 text-emerald-400 hover:bg-zinc-700'
                : 'bg-zinc-800/50 border-zinc-800 text-zinc-500 hover:text-zinc-400'
            }`}
            title={soundEnabled ? 'Disable order chime' : 'Enable order chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchOrders(false)}
            disabled={isRefreshing}
            className="p-2 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Poll tickets now"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {displayedOrders.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CupSoda className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Juice Bar is Clear!</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              No orders currently waiting for preparation in this view. New beverage orders will appear
              with a live chime alert automatically.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {displayedOrders.map((order) => {
            const elapsedMins = Math.floor(
              (currentTime - new Date(order.createdAt).getTime()) / (1000 * 60)
            )
            const isUrgent = elapsedMins >= 10 && order.status !== 'READY' && order.status !== 'SERVED'
            const drinkItems = order.items.filter(isDrinkItem)
            const nonDrinkItems = order.items.filter((item) => !isDrinkItem(item))
            const isUpdating = updatingOrderId === order.id

            return (
              <div
                key={order.id}
                className={`bg-zinc-900/90 rounded-3xl border flex flex-col justify-between transition-all duration-200 overflow-hidden shadow-xl ${
                  order.status === 'READY'
                    ? 'border-cyan-500/40 ring-1 ring-cyan-500/20'
                    : order.status === 'PREPARING'
                    ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : isUrgent
                    ? 'border-rose-500/60 ring-2 ring-rose-500/20 animate-pulse'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Ticket Header */}
                <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-950/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-2xl bg-emerald-500 text-zinc-950 font-black text-sm flex items-center justify-center shadow-md shadow-emerald-500/20">
                        T{order.table.number}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-white tracking-wide">
                          Table {order.table.number}
                        </span>
                        <div className="text-[10px] text-zinc-500">
                          #{order.id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Elapsed Timer */}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 ${
                          isUrgent
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : elapsedMins >= 5
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {elapsedMins}m ago
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          order.status === 'READY'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : order.status === 'PREPARING'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : order.status === 'SERVED'
                            ? 'bg-zinc-800 text-zinc-400'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {order.notes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span className="font-medium">{order.notes}</span>
                    </div>
                  )}
                </div>

                {/* Ticket Items List */}
                <div className="p-4 sm:p-5 flex-1 space-y-4">
                  {/* Drinks Section */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-zinc-800/60">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        <CupSoda className="w-3.5 h-3.5" />
                        <span>Fresh Juices &amp; Drinks ({drinkItems.length})</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Tap item when ready</span>
                    </div>

                    {drinkItems.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic py-1">No drinks in this order</p>
                    ) : (
                      <ul className="space-y-2">
                        {drinkItems.map((item) => {
                          const isDone = !!checkedItems[item.id]
                          return (
                            <li
                              key={item.id}
                              onClick={() => toggleCheckItem(item.id)}
                              className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isDone
                                  ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-400 line-through'
                                  : 'bg-zinc-950/60 border-zinc-800/80 text-white hover:border-emerald-500/40'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                                    isDone
                                      ? 'bg-zinc-800 text-zinc-500'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}
                                >
                                  {item.quantity}x
                                </span>
                                <div>
                                  <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                                    <span>{item.product.name}</span>
                                    {item.product.category?.name && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                                        {item.product.category.name}
                                      </span>
                                    )}
                                  </div>
                                  {item.notes && (
                                    <div className="text-[11px] text-amber-400 font-medium">
                                      Pref: {item.notes}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div
                                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                  isDone
                                    ? 'bg-emerald-500 border-emerald-500 text-zinc-950'
                                    : 'border-zinc-700 text-transparent hover:border-emerald-400'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Kitchen Food Items (subtle preview) */}
                  {nonDrinkItems.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/50">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        <Utensils className="w-3 h-3 text-zinc-600" />
                        <span>Kitchen Food ({nonDrinkItems.length} items)</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 space-y-1">
                        {nonDrinkItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-1.5 opacity-60">
                            <span>• {item.quantity}x</span>
                            <span>{item.product.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Action Buttons */}
                <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center gap-2">
                  {order.status === 'PENDING' || order.status === 'CONFIRMED' ? (
                    <button
                      onClick={() => updateStatus(order.id, 'PREPARING')}
                      disabled={isUpdating}
                      className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Coffee className="w-4 h-4" />
                      <span>Start Blending / Squeezing</span>
                    </button>
                  ) : order.status === 'PREPARING' ? (
                    <button
                      onClick={() => updateStatus(order.id, 'READY')}
                      disabled={isUpdating}
                      className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-zinc-950 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ready at Drink Bar 🍹</span>
                    </button>
                  ) : order.status === 'READY' ? (
                    <div className="w-full flex items-center justify-between text-xs py-1">
                      <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Ready for Waiter Delivery
                      </span>
                      <button
                        onClick={() => updateStatus(order.id, 'PREPARING')}
                        disabled={isUpdating}
                        className="text-[11px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
                      >
                        Revert to Prep
                      </button>
                    </div>
                  ) : (
                    <div className="w-full text-center text-xs text-zinc-500 py-1">
                      Order {order.status.toLowerCase()}
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
