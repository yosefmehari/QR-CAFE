'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import CategoriesManager, { AdminCategory } from './CategoriesManager'
import ProductsManager, { AdminProduct } from './ProductsManager'
import TablesManager, { AdminTable } from './TablesManager'
import OrdersManager from './OrdersManager'
import AnalyticsManager from './AnalyticsManager'
import StaffManager, { AdminStaffUser } from './StaffManager'
import BankSettingsManager, { CafeBankSettings } from './BankSettingsManager'
import LogoutButton from '@/components/LogoutButton'
import {
  ShieldCheck,
  LayoutDashboard,
  Utensils,
  FolderTree,
  QrCode,
  DollarSign,
  Receipt,
  CheckCircle2,
  ExternalLink,
  ChefHat,
  BarChart3,
  Users,
  Building2,
  Loader2,
  Clock,
  CupSoda,
  Bell,
} from 'lucide-react'

export interface AdminStats {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalCategories: number
  totalTables: number
  activeTables: number
}

interface Props {
  initialCategories: AdminCategory[]
  initialProducts: AdminProduct[]
  initialTables: AdminTable[]
  initialStaff?: AdminStaffUser[]
  initialSettings?: CafeBankSettings
  initialStats: AdminStats
  adminUser: {
    name: string
    email: string
    role: string
  }
}

type TabKey = 'overview' | 'orders' | 'analytics' | 'products' | 'categories' | 'tables' | 'staff' | 'settings'

interface PendingPaymentQuickItem {
  id: string
  totalPrice: number
  paymentMethod?: string
  paymentReference?: string | null
  createdAt: string
  table: {
    number: number
  }
  items: {
    quantity: number
    product: {
      name: string
    }
  }[]
}

export default function AdminDashboardClient({
  initialCategories,
  initialProducts,
  initialTables,
  initialStaff = [],
  initialSettings = {
    bankName: 'Commercial Bank of Ethiopia (CBE)',
    bankAccountNumber: '1000234567890',
    accountHolderName: 'Aroma & Fork Cafe LLC',
    telebirrNumber: '0911000000',
    paymentInstructions: 'Transfer the total order amount and enter the transaction confirmation code / receipt number below.',
  },
  initialStats,
  adminUser,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const [categories, setCategories] = useState<AdminCategory[]>(initialCategories)
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts)
  const [tables, setTables] = useState<AdminTable[]>(initialTables)
  const [staff, setStaff] = useState<AdminStaffUser[]>(initialStaff)
  const [stats, setStats] = useState<AdminStats>(initialStats)

  // Live pending orders awaiting check
  const [pendingOrders, setPendingOrders] = useState<PendingPaymentQuickItem[]>([])
  const [checkingOrderId, setCheckingOrderId] = useState<string | null>(null)

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c))
    }, 3000)
  }

  const fetchPendingPayments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/orders?paymentStatus=PENDING&limit=20')
      if (res.status === 401) {
        return
      }
      if (res.ok) {
        const data = await res.json()
        setPendingOrders(data.orders || [])
      }
    } catch (err) {
      console.error('Failed to load pending payments', err)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      fetchPendingPayments()
    })
    const interval = setInterval(fetchPendingPayments, 8000)
    return () => clearInterval(interval)
  }, [fetchPendingPayments])

  const handleOverviewCheckPayment = async (order: PendingPaymentQuickItem) => {
    setCheckingOrderId(order.id)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
        }),
      })
      if (res.ok) {
        setPendingOrders((prev) => prev.filter((o) => o.id !== order.id))
        showToast(`Payment Checked ✓ Table #${order.table.number} ($${Number(order.totalPrice).toFixed(2)}) approved!`)
        refreshAll()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to verify payment')
      }
    } catch (err) {
      console.error('Error approving payment', err)
      showToast('Error connecting to server')
    } finally {
      setCheckingOrderId(null)
    }
  }

  const refreshAll = async () => {
    try {
      fetchPendingPayments()
      const [catRes, prodRes, tabRes, staffRes, ordRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/products'),
        fetch('/api/admin/tables'),
        fetch('/api/admin/staff'),
        fetch('/api/admin/orders?limit=100'),
      ])

      if (catRes.ok) setCategories(await catRes.json())
      if (prodRes.ok) setProducts(await prodRes.json())
      if (tabRes.ok) setTables(await tabRes.json())
      if (staffRes.ok) setStaff(await staffRes.json())
      if (ordRes.ok) {
        const odata = await ordRes.json()
        const orderList = odata.orders || []
        const rev = orderList.reduce((sum: number, o: { totalPrice: number }) => sum + Number(o.totalPrice), 0)
        setStats((prev) => ({
          ...prev,
          totalOrders: orderList.length,
          totalRevenue: rev,
        }))
      }
    } catch (e) {
      console.error('Failed to refresh admin data', e)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div className="bg-zinc-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-zinc-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-30 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-white">
                  Aroma &amp; Fork Admin
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {adminUser.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                Signed in as {adminUser.name} ({adminUser.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <span>Customer Menu</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </Link>

            <Link
              href="/kitchen"
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-orange-400 hover:text-orange-300 bg-orange-950/40 border border-orange-900/60 transition-colors flex items-center gap-1.5"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kitchen</span>
            </Link>

            <Link
              href="/juice"
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-900/60 transition-colors flex items-center gap-1.5"
            >
              <CupSoda className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Juice Bar</span>
            </Link>

            <Link
              href="/waiter"
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-950/40 border border-blue-900/60 transition-colors flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Waiter Floor</span>
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Admin Tab Navigation Bar */}
      <nav aria-label="Admin Sections" className="border-b border-zinc-800 bg-zinc-900/40 sticky top-16 sm:top-20 z-20 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Orders</span>
            {pendingOrders.length > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] font-black text-white animate-pulse">
                {pendingOrders.length} to check
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
                {stats.totalOrders}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Products</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Categories</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
              {categories.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tables'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Tables &amp; QR</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
              {tables.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'staff'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
              {staff.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bank &amp; Payment</span>
            {pendingOrders.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-[10px] font-black text-zinc-950 animate-pulse">
                {pendingOrders.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Action Banner: Payments Awaiting Check */}
            {pendingOrders.length > 0 && (
              <div className="p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-500/50 shadow-xl shadow-amber-500/5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center font-black">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">
                          {pendingOrders.length} Payment{pendingOrders.length > 1 ? 's' : ''} Awaiting Admin Check
                        </h3>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-[10px] font-black text-zinc-950 uppercase tracking-wider">
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        Customers are held on the tracking screen waiting for you to verify their bank transfer / payment. Click <strong className="text-emerald-400 font-bold">&quot;Checked ✓&quot;</strong> to approve.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>Bank &amp; Payment Screen →</span>
                  </button>
                </div>

                {/* Quick Check Orders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {pendingOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-3 group hover:border-amber-500/40 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-amber-500 text-zinc-950">
                            Table #{ord.table?.number}
                          </span>
                          <span className="text-xs font-black text-emerald-400">
                            ${Number(ord.totalPrice).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-amber-300 truncate">
                          {ord.paymentReference || 'Bank Transfer (Awaiting Check)'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOverviewCheckPayment(ord)}
                        disabled={checkingOrderId === ord.id}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                      >
                        {checkingOrderId === ord.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Approving...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Checked ✓</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-medium">Recorded Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">
                  ${stats.totalRevenue.toFixed(2)}
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  from {stats.totalOrders} total orders
                </div>
              </div>

              <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-medium">Total Orders</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">
                  {stats.totalOrders} orders
                </div>
                <div className="text-[11px] text-zinc-500">
                  lifetime cafe volume
                </div>
              </div>

              <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-medium">Active Menu Items</span>
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center">
                    <Utensils className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">
                  {products.length} items
                </div>
                <div className="text-[11px] text-zinc-500">
                  in {categories.length} active categories
                </div>
              </div>

              <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-medium">Physical Tables</span>
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white">
                  {tables.length} tables
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  {tables.filter((t) => t.isActive).length} active for seating
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
                Management Modules
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                    Orders Management →
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Inspect itemized receipts, customer notes, and override statuses.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                    Performance Analytics →
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Review revenue trends, top 5 best-sellers, and table velocity.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                    Products Catalog →
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Add dishes, modify prices, and toggle 1-click availability.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('categories')}
                  className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                    Categories Manager →
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Create and rearrange food &amp; drink sections with icons.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tables')}
                  className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors">
                    Tables &amp; QR Stands →
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Add tables, preview live QR codes, and print table stands.
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="animate-in fade-in duration-200">
            <OrdersManager onOrderUpdated={refreshAll} />
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-200">
            <AnalyticsManager />
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="animate-in fade-in duration-200">
            <ProductsManager
              initialProducts={products}
              categories={categories}
              onRefresh={refreshAll}
              showToast={showToast}
            />
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="animate-in fade-in duration-200">
            <CategoriesManager
              initialCategories={categories}
              onRefresh={refreshAll}
              showToast={showToast}
            />
          </div>
        )}

        {/* TABLES TAB */}
        {activeTab === 'tables' && (
          <div className="animate-in fade-in duration-200">
            <TablesManager
              initialTables={tables}
              onRefresh={refreshAll}
              showToast={showToast}
            />
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <div className="animate-in fade-in duration-200">
            <StaffManager
              initialStaff={staff}
              currentUserId={adminUser.email}
              onRefresh={refreshAll}
              showToast={showToast}
            />
          </div>
        )}

        {/* BANK & PAYMENT SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-200">
            <BankSettingsManager
              initialSettings={initialSettings}
              showToast={showToast}
              onOrderVerified={refreshAll}
            />
          </div>
        )}
      </main>
    </div>
  )
}
