'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Receipt,
  Search,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  Utensils,
  CheckCircle2,
  Camera,
  ExternalLink,
  MapPin,
  Bike,
} from 'lucide-react'

export interface AdminOrderItem {
  id: string
  quantity: number
  unitPrice: number
  notes?: string | null
  product: {
    id: string
    name: string
    imageUrl?: string | null
  }
}

export interface AdminComplaintRecord {
  id: string
  category: string
  items?: string | null
  details: string
  desiredAction?: string | null
  status: string
  staffNotes?: string | null
  createdAt: string
}

export interface AdminOrderRecord {
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
  paymentScreenshot?: string | null
  totalPrice: number
  notes?: string | null
  createdAt: string
  table?: {
    id: string
    number: number
  } | null
  complaints?: AdminComplaintRecord[]
  items: AdminOrderItem[]
}

interface OrdersManagerProps {
  onOrderUpdated?: () => void
}

export default function OrdersManager({ onOrderUpdated }: OrdersManagerProps) {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      let url = '/api/admin/orders?'
      if (statusFilter !== 'ALL' && statusFilter !== 'COMPLAINTS') url += `status=${statusFilter}&`
      if (paymentFilter !== 'ALL') url += `paymentStatus=${paymentFilter}&`
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery)}&`

      const res = await fetch(url)
      if (res.status === 401) return
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (err) {
      console.error('Failed to fetch admin orders', err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, paymentFilter, searchQuery])

  useEffect(() => {
    queueMicrotask(() => {
      fetchOrders()
    })
  }, [fetchOrders])

  const handleRefresh = () => {
    setLoading(true)
    fetchOrders()
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    fetchOrders()
  }

  const updateOrderStatus = async (orderId: string, newStatus: AdminOrderRecord['status']) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        // Update locally
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        )
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
        if (onOrderUpdated) onOrderUpdated()
      }
    } catch (err) {
      console.error('Failed to update status', err)
    } finally {
      setActionLoading(false)
    }
  }

  const verifyPayment = async (orderId: string, newPaymentStatus: 'PAID' | 'PENDING') => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: newPaymentStatus,
          status: newPaymentStatus === 'PAID' ? 'CONFIRMED' : undefined,
        }),
      })

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  paymentStatus: newPaymentStatus,
                  status: newPaymentStatus === 'PAID' && o.status === 'PENDING' ? 'CONFIRMED' : o.status,
                }
              : o
          )
        )
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            paymentStatus: newPaymentStatus,
            status: newPaymentStatus === 'PAID' && selectedOrder.status === 'PENDING' ? 'CONFIRMED' : selectedOrder.status,
          })
        }
        if (onOrderUpdated) onOrderUpdated()
      }
    } catch (err) {
      console.error('Failed to verify payment', err)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'PREPARING':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'READY':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'SERVED':
        return 'bg-zinc-800 text-zinc-300 border-zinc-700'
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700'
    }
  }

  const displayedOrders =
    statusFilter === 'COMPLAINTS'
      ? orders.filter((o) => o.complaints && o.complaints.length > 0)
      : orders

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-amber-500" />
              <span>Orders Management</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Track customer orders, check receipts, and update order statuses.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="self-start md:self-auto px-3.5 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Table, Product, Order ID, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1 cursor-pointer transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['ALL', 'COMPLAINTS', 'PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'].map((st) => {
              const complaintsCount = orders.filter((o) => o.complaints && o.complaints.length > 0).length
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === st
                      ? st === 'COMPLAINTS'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-amber-500 text-white shadow'
                      : st === 'COMPLAINTS'
                      ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-500/30'
                      : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <span>{st === 'COMPLAINTS' ? '🚨 RETURNS / ISSUES' : st}</span>
                  {st === 'COMPLAINTS' && complaintsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
                      {complaintsCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Payment Verification Filter & Batch Check Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <span>Payment Verification:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  paymentFilter === 'ALL'
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('PENDING')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  paymentFilter === 'PENDING'
                    ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                    : 'bg-zinc-800/60 text-amber-400/90 hover:bg-amber-500/20'
                }`}
              >
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Needs Check</span>
                {orders.filter((o) => o.paymentStatus !== 'PAID').length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 text-[10px] font-mono">
                    {orders.filter((o) => o.paymentStatus !== 'PAID').length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('PAID')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  paymentFilter === 'PAID'
                    ? 'bg-emerald-500 text-zinc-950 font-black shadow-md'
                    : 'bg-zinc-800/60 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Checked &amp; Paid</span>
              </button>
            </div>
          </div>

          {/* Quick Check All Pending Payments Button */}
          {orders.some((o) => o.paymentStatus !== 'PAID') && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={async () => {
                const unverified = orders.filter((o) => o.paymentStatus !== 'PAID')
                if (!unverified.length) return
                if (confirm(`Mark all ${unverified.length} pending payments as Checked / Verified?`)) {
                  setActionLoading(true)
                  try {
                    for (const o of unverified) {
                      await fetch(`/api/admin/orders/${o.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentStatus: 'PAID', status: 'CONFIRMED' }),
                      })
                    }
                    fetchOrders()
                    if (onOrderUpdated) onOrderUpdated()
                  } finally {
                    setActionLoading(false)
                  }
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Check All Pending Payments</span>
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-zinc-500 text-sm flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span>Loading orders...</span>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 text-sm flex flex-col items-center gap-3">
            <Utensils className="w-8 h-8 text-zinc-600" />
            <span>No orders match the selected filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/60 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3.5">Order / Table</th>
                  <th className="px-5 py-3.5">Time</th>
                  <th className="px-5 py-3.5">Items Summary</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {displayedOrders.map((order) => {
                  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
                  return (
                    <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          {order.orderType === 'DELIVERY' ? (
                            <span className="px-2 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black text-[10px] tracking-wider whitespace-nowrap">
                              🛵 DELIV
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs">
                              T-{order.table ? order.table.number : '?'}
                            </span>
                          )}
                          <div>
                            <span className="font-mono font-bold text-white block">
                              #{order.id.slice(-6).toUpperCase()}
                            </span>
                            {order.orderType === 'DELIVERY' && order.deliveryAddress && (
                              <span className="text-[10px] text-amber-300 font-medium truncate max-w-[140px] block">
                                📍 {order.deliveryAddress}
                              </span>
                            )}
                            {order.notes && (
                              <span className="text-[10px] text-amber-400/90 truncate max-w-[120px] block">
                                💬 {order.notes}
                              </span>
                            )}
                            {order.complaints && order.complaints.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.5 rounded-md mt-1 animate-pulse">
                                <AlertCircle className="w-3 h-3 text-rose-400" />
                                <span>
                                  {order.complaints[0].desiredAction?.startsWith('RETURN') || order.complaints[0].category === 'RETURN_DISH'
                                    ? '🚨 Return: '
                                    : 'Issue: '}
                                  {order.complaints[0].category === 'DISLIKE_FOOD'
                                    ? "Don't Like Food"
                                    : order.complaints[0].category.replace(/_/g, ' ')}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 block">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-zinc-200">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-xs">
                          {order.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', ')}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-white text-sm block">
                          ${order.totalPrice.toFixed(2)}
                        </span>
                        <div className="mt-1">
                          {order.paymentStatus === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Checked / Paid</span>
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                <Clock className="w-3 h-3 animate-pulse" />
                                <span>Awaiting Check</span>
                              </span>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  verifyPayment(order.id, 'PAID')
                                }}
                                className="px-2 py-0.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[10px] transition-all flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                                title="Click when you have checked the bank payment"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Checked ✓</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {order.paymentStatus !== 'PAID' ? (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={(e) => {
                                e.stopPropagation()
                                verifyPayment(order.id, 'PAID')
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                              title="Click to check and approve payment"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Checked ✓</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={(e) => {
                                e.stopPropagation()
                                verifyPayment(order.id, 'PENDING')
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 border border-zinc-700 text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Revert back to pending check"
                            >
                              <span>Uncheck</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-400 border border-zinc-700 hover:border-amber-500/30 transition-all font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Itemized Order Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {selectedOrder.orderType === 'DELIVERY' ? (
                  <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-sm">
                    <Bike className="w-3.5 h-3.5" />
                    OUTSIDE DELIVERY
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs">
                    TABLE {selectedOrder.table?.number ?? 'N/A'}
                  </span>
                )}
                <div>
                  <h3 className="font-black text-white text-sm">
                    Order #{selectedOrder.id.slice(-6).toUpperCase()}
                  </h3>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Delivery Details Banner */}
              {selectedOrder.orderType === 'DELIVERY' && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-black text-amber-400 text-xs">
                      <Bike className="w-4 h-4" />
                      <span>Delivery Information</span>
                    </div>
                    {selectedOrder.acceptedBy ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        Waiter: {selectedOrder.acceptedBy}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        Awaiting Waiter
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-zinc-300">
                    {selectedOrder.customerName && (
                      <p>
                        <span className="text-zinc-500 font-medium">Customer:</span>{' '}
                        <span className="font-bold text-white">{selectedOrder.customerName}</span>
                      </p>
                    )}
                    {selectedOrder.customerPhone && (
                      <p>
                        <span className="text-zinc-500 font-medium">Phone:</span>{' '}
                        <a
                          href={`tel:${selectedOrder.customerPhone}`}
                          className="text-amber-400 font-mono font-bold hover:underline"
                        >
                          {selectedOrder.customerPhone}
                        </a>
                      </p>
                    )}
                    {selectedOrder.deliveryAddress && (
                      <div className="flex items-start gap-1 text-zinc-200 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="font-semibold text-white">{selectedOrder.deliveryAddress}</span>
                      </div>
                    )}
                    {selectedOrder.deliveryNotes && (
                      <p className="text-amber-200/90 text-[11px] bg-zinc-900/80 p-2 rounded-xl border border-amber-500/20 mt-1">
                        <span className="font-bold text-amber-400">Directions/Notes:</span>{' '}
                        {selectedOrder.deliveryNotes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Notes Banner */}
              {selectedOrder.notes && (
                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-900/40 text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Customer Instructions:</span> {selectedOrder.notes}
                  </div>
                </div>
              )}

              {/* Customer Complaints & Food Quality Issues */}
              {selectedOrder.complaints && selectedOrder.complaints.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border-2 border-rose-900/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>Customer Food Issue ({selectedOrder.complaints.length})</span>
                    </span>
                  </div>

                  {selectedOrder.complaints.map((c) => (
                    <div key={c.id} className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800 text-xs space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-white block">
                            {c.category === 'DISLIKE_FOOD'
                              ? "Don't Like Food / Taste"
                              : c.category === 'RETURN_DISH'
                              ? 'Return Food Request'
                              : c.category.replace(/_/g, ' ')}
                          </span>
                          {c.items && <span className="text-[11px] text-zinc-400 block">Affected dish: {c.items}</span>}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : c.status === 'REVIEWING'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {c.status}
                        </span>
                      </div>

                      <p className="text-zinc-200 italic bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                        &quot;{c.details}&quot;
                      </p>

                      {c.desiredAction && (
                        <div className="text-[11px] text-zinc-400">
                          Customer requested: <strong className="text-amber-400 font-bold">{c.desiredAction.replace(/_/g, ' ')}</strong>
                        </div>
                      )}

                      {c.staffNotes && (
                        <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/40">
                          <span className="font-bold block">Resolution Note:</span>
                          <p>{c.staffNotes}</p>
                        </div>
                      )}

                      {c.status !== 'RESOLVED' && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={async () => {
                              const note = window.prompt('Resolution note for customer (e.g. Dish remade and sent to table):')
                              if (note === null) return
                              await fetch(`/api/admin/complaints/${c.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: 'RESOLVED', staffNotes: note || 'Resolved by staff' }),
                              })
                              fetchOrders()
                              setSelectedOrder(null)
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Resolved</span>
                          </button>

                          {selectedOrder.paymentStatus !== 'REFUNDED' && (
                            <button
                              type="button"
                              onClick={async () => {
                                const confirmRefund = window.confirm(
                                  `Process refund for Order #${selectedOrder.id.slice(-6).toUpperCase()} ($${Number(selectedOrder.totalPrice).toFixed(2)}) and resolve this issue?`
                                )
                                if (!confirmRefund) return
                                await fetch(`/api/admin/orders/${selectedOrder.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ paymentStatus: 'REFUNDED' }),
                                })
                                await fetch(`/api/admin/complaints/${c.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    status: 'RESOLVED',
                                    staffNotes: 'Dish returned. Payment refunded to customer.',
                                  }),
                                })
                                fetchOrders()
                                setSelectedOrder(null)
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                            >
                              <span>💰 Refund &amp; Resolve</span>
                            </button>
                          )}

                          {c.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await fetch(`/api/admin/complaints/${c.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'REVIEWING' }),
                                })
                                fetchOrders()
                                setSelectedOrder(null)
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] cursor-pointer transition-colors"
                            >
                              <span>Mark Reviewing</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Itemized Receipt
                </h4>
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/80 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      {item.product.imageUrl && (
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/60">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <span className="w-6 h-6 rounded-lg bg-zinc-800 text-amber-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {item.quantity}x
                      </span>
                      <div>
                        <p className="font-bold text-xs text-zinc-100">{item.product.name}</p>
                        {item.notes && (
                          <p className="text-[10px] text-amber-300/80 mt-0.5">⚠️ {item.notes}</p>
                        )}
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          ${item.unitPrice.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-white">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment Verification Card */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider">Payment Status</span>
                  <span className={`font-bold flex items-center gap-1 ${selectedOrder.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {selectedOrder.paymentStatus === 'PAID' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Payment Checked &amp; Verified</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-pulse" />
                        <span>Awaiting Admin Check</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono">
                  <div className="text-[10px] text-zinc-500 font-sans uppercase font-bold">Transaction Reference:</div>
                  <div className="text-amber-400 font-bold break-all mt-0.5">
                    {selectedOrder.paymentReference || 'No reference recorded'}
                  </div>
                </div>

                {/* Customer Uploaded Receipt Screenshot */}
                {selectedOrder.paymentScreenshot && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-zinc-900 border border-amber-500/30">
                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-400">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Receipt Screenshot Attached</span>
                      </span>
                      <a
                        href={selectedOrder.paymentScreenshot}
                        target="_blank"
                        rel="noreferrer"
                        className="underline flex items-center gap-1 hover:text-amber-300"
                      >
                        <span>Open Full</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="w-full h-44 rounded-lg overflow-hidden bg-black/40 border border-zinc-800 flex items-center justify-center p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedOrder.paymentScreenshot}
                        alt="Customer receipt proof"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {selectedOrder.paymentStatus !== 'PAID' ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => verifyPayment(selectedOrder.id, 'PAID')}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Checked ✓ (Approve &amp; Confirm Order)</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Payment confirmed by admin
                    </span>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => verifyPayment(selectedOrder.id, 'PENDING')}
                      className="text-zinc-500 hover:text-amber-400 underline text-[10px] cursor-pointer"
                    >
                      Revert to Pending
                    </button>
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400">Total Charged:</span>
                <span className="text-lg font-mono font-black text-amber-400">
                  ${selectedOrder.totalPrice.toFixed(2)}
                </span>
              </div>

              {/* Status Stepper Override Controls */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Update Order Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    selectedOrder.orderType === 'DELIVERY'
                      ? (['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'SERVED', 'CANCELLED'] as const)
                      : (['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'] as const)
                  ).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateOrderStatus(selectedOrder.id, st)}
                      disabled={actionLoading || selectedOrder.status === st}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold transition-all border ${
                        selectedOrder.status === st
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 border-zinc-700'
                      } disabled:opacity-40`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
