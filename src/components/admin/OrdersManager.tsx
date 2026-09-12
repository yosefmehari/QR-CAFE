'use client'

import { useState, useEffect } from 'react'
import {
  Receipt,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  ArrowUpDown,
  Utensils,
  ChefHat,
  ChevronDown,
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

export interface AdminOrderRecord {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED'
  paymentMethod?: string
  paymentStatus?: string
  paymentReference?: string | null
  totalPrice: number
  notes?: string | null
  createdAt: string
  table: {
    id: string
    number: number
  }
  items: AdminOrderItem[]
}

interface OrdersManagerProps {
  onOrderUpdated?: () => void
}

export default function OrdersManager({ onOrderUpdated }: OrdersManagerProps) {
  const [orders, setOrders] = useState<AdminOrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedTable, setSelectedTable] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchOrders = async () => {
    setLoading(true)
    try {
      let url = '/api/admin/orders?'
      if (statusFilter !== 'ALL') url += `status=${statusFilter}&`
      if (selectedTable !== 'ALL') url += `table=${selectedTable}&`
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery)}&`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (err) {
      console.error('Failed to fetch admin orders', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, selectedTable])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders()
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
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
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
        )
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus as any })
        }
        if (onOrderUpdated) onOrderUpdated()
      }
    } catch (err) {
      console.error('Failed to update status', err)
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
            onClick={() => fetchOrders()}
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
              placeholder="Search by Order ID or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </form>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {['ALL', 'PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-amber-500 text-white shadow'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-zinc-500 text-sm flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span>Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
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
                {orders.map((order) => {
                  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0)
                  return (
                    <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs">
                            T-{order.table.number}
                          </span>
                          <div>
                            <span className="font-mono font-bold text-white block">
                              #{order.id.slice(-6).toUpperCase()}
                            </span>
                            {order.notes && (
                              <span className="text-[10px] text-amber-400/90 truncate max-w-[120px] block">
                                💬 {order.notes}
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
                        <span className="text-[10px] text-zinc-400 block font-medium">
                          {order.paymentStatus === 'PAID' ? '✓ Paid Online' : '⚠️ Unpaid / Cash'}
                        </span>
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
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-400 border border-zinc-700 hover:border-amber-500/30 transition-all font-semibold inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
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
                <span className="px-3 py-1 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs">
                  TABLE {selectedOrder.table.number}
                </span>
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
              {/* Customer Notes Banner */}
              {selectedOrder.notes && (
                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-900/40 text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Customer Instructions:</span> {selectedOrder.notes}
                  </div>
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

              {/* Payment Details */}
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-semibold">Payment Info:</span>
                <span className={`font-bold ${selectedOrder.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedOrder.paymentStatus === 'PAID'
                    ? `✓ ${selectedOrder.paymentReference || 'Paid Online'}`
                    : '⚠️ Pay at Counter / Unpaid'}
                </span>
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
                  {(['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'] as const).map((st) => (
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
                      {st}
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
