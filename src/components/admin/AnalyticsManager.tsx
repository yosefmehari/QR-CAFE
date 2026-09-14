'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Award,
  Users,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react'

export interface AnalyticsData {
  metrics: {
    totalRevenue: number
    todayRevenue: number
    todayOrdersCount: number
    totalOrders: number
    servedOrdersCount: number
    cancelledOrdersCount: number
    averageOrderValue: number
  }
  statusCounts: Record<string, number>
  topProducts: Array<{
    id: string
    name: string
    imageUrl?: string | null
    quantity: number
    revenue: number
  }>
  tableRankings: Array<{
    tableNumber: number
    orderCount: number
  }>
}

export default function AnalyticsManager() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Failed to load analytics', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchAnalytics()
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchAnalytics()
    })
  }, [])

  if (loading && !data) {
    return (
      <div className="py-24 text-center text-zinc-500 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-sm font-semibold">Aggregating Cafe Analytics...</span>
      </div>
    )
  }

  const metrics = data?.metrics || {
    totalRevenue: 0,
    todayRevenue: 0,
    todayOrdersCount: 0,
    totalOrders: 0,
    servedOrdersCount: 0,
    cancelledOrdersCount: 0,
    averageOrderValue: 0,
  }

  const topProducts = data?.topProducts || []
  const tableRankings = data?.tableRankings || []
  const statusCounts = data?.statusCounts || {}

  const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Sales & Cafe Performance Analytics</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time financial performance, popular products, and table velocity.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading}
          className="self-start sm:self-auto px-3.5 py-2 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Revenue */}
        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Gross Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white font-mono">
              ${metrics.totalRevenue.toFixed(2)}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">Across all completed orders</p>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Today&apos;s Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white font-mono">
              ${metrics.todayRevenue.toFixed(2)}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">
              {metrics.todayOrdersCount} orders placed today
            </p>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Average Order Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white font-mono">
              ${metrics.averageOrderValue.toFixed(2)}
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">Per paying table order</p>
          </div>
        </div>

        {/* Orders Completed */}
        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Completed Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-white font-mono">
              {metrics.servedOrdersCount}{' '}
              <span className="text-sm font-medium text-zinc-500">/ {metrics.totalOrders}</span>
            </span>
            <p className="text-[11px] text-zinc-500 mt-1">
              {metrics.cancelledOrdersCount} cancelled orders
            </p>
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Best Sellers */}
        <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Top 5 Best Sellers</span>
            </h3>
            <span className="text-xs text-zinc-500">Ranked by volume sold</span>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No product sales recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{rankEmojis[idx] || `#${idx + 1}`}</span>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-100">{p.name}</h4>
                      <span className="text-xs text-zinc-400">
                        {p.quantity} {p.quantity === 1 ? 'unit' : 'units'} sold
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-sm text-emerald-400 block">
                      ${p.revenue.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-500">total revenue</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Lifecycle Distribution & Table Velocity */}
        <div className="space-y-6">
          {/* Status Breakdown */}
          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-4">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Order Status Distribution</span>
            </h3>

            <div className="space-y-3">
              {[
                { label: 'Pending / New', count: statusCounts.PENDING || 0, color: 'bg-amber-500' },
                { label: 'Cooking', count: statusCounts.PREPARING || 0, color: 'bg-blue-500' },
                { label: 'Ready to Serve', count: statusCounts.READY || 0, color: 'bg-emerald-500' },
                { label: 'Served / Done', count: statusCounts.SERVED || 0, color: 'bg-zinc-400' },
                { label: 'Cancelled', count: statusCounts.CANCELLED || 0, color: 'bg-red-500' },
              ].map((item) => {
                const pct = metrics.totalOrders > 0 ? (item.count / metrics.totalOrders) * 100 : 0
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-300">{item.label}</span>
                      <span className="text-zinc-400 font-mono">
                        {item.count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Table Order Activity */}
          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-3">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-400" />
              <span>Table Activity & Velocity</span>
            </h3>

            {tableRankings.length === 0 ? (
              <p className="text-xs text-zinc-500">No table orders yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {tableRankings.slice(0, 8).map((t) => (
                  <div
                    key={t.tableNumber}
                    className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-center"
                  >
                    <span className="text-xs font-bold text-zinc-400 block">Table {t.tableNumber}</span>
                    <span className="text-lg font-black text-white font-mono block mt-0.5">
                      {t.orderCount}
                    </span>
                    <span className="text-[10px] text-zinc-500">orders placed</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
