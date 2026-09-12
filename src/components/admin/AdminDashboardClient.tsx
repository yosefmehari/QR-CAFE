'use client'

import { useState } from 'react'
import Link from 'next/link'
import CategoriesManager, { AdminCategory } from './CategoriesManager'
import ProductsManager, { AdminProduct } from './ProductsManager'
import TablesManager, { AdminTable } from './TablesManager'
import OrdersManager from './OrdersManager'
import AnalyticsManager from './AnalyticsManager'
import LogoutButton from '@/components/LogoutButton'
import {
  ShieldCheck,
  LayoutDashboard,
  Utensils,
  FolderTree,
  QrCode,
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  ExternalLink,
  ChefHat,
  BarChart3,
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
  initialStats: AdminStats
  adminUser: {
    name: string
    email: string
    role: string
  }
}

type TabKey = 'overview' | 'orders' | 'analytics' | 'products' | 'categories' | 'tables'

export default function AdminDashboardClient({
  initialCategories,
  initialProducts,
  initialTables,
  initialStats,
  adminUser,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const [categories, setCategories] = useState<AdminCategory[]>(initialCategories)
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts)
  const [tables, setTables] = useState<AdminTable[]>(initialTables)
  const [stats, setStats] = useState<AdminStats>(initialStats)

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage((c) => (c === msg ? null : c))
    }, 3000)
  }

  const refreshAll = async () => {
    try {
      const [catRes, prodRes, tabRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/products'),
        fetch('/api/admin/tables'),
      ])

      if (catRes.ok) setCategories(await catRes.json())
      if (prodRes.ok) setProducts(await prodRes.json())
      if (tabRes.ok) setTables(await tabRes.json())
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
              <span>Kitchen Screen</span>
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
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
              {stats.totalOrders}
            </span>
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
            <span>Tables & QR</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300">
              {tables.length}
            </span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
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
      </main>
    </div>
  )
}
