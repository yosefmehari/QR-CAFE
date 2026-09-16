'use client'

import { useState, useMemo } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Utensils,
  Search,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { AdminCategory } from './CategoriesManager'
import { getProductImage } from '@/lib/images'

export interface AdminProduct {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  isAvailable: boolean
  categoryId: string
  category?: {
    id: string
    name: string
    slug: string
    emoji: string | null
  }
}

interface Props {
  initialProducts: AdminProduct[]
  categories: AdminCategory[]
  onRefresh: () => void
  showToast: (msg: string) => void
}

export default function ProductsManager({
  initialProducts,
  categories,
  onRefresh,
  showToast,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [imageUrl, setImageUrl] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fast availability toggle state tracker
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const terms = q.split(/\s+/).filter(Boolean)

    return initialProducts.filter((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)
      const matchesCategory =
        selectedCategoryFilter === 'all' || p.categoryId === selectedCategoryFilter

      const matchesSearch =
        terms.length === 0 ||
        terms.every(
          (term) =>
            p.name.toLowerCase().includes(term) ||
            (p.description && p.description.toLowerCase().includes(term)) ||
            (cat && cat.name.toLowerCase().includes(term))
        )

      return matchesCategory && matchesSearch
    })
  }, [initialProducts, categories, selectedCategoryFilter, searchQuery])

  const openCreateModal = () => {
    setEditingProduct(null)
    setName('')
    setDescription('')
    setPrice('')
    setImageUrl('')
    setCategoryId(categories[0]?.id || '')
    setIsAvailable(true)
    setErrorMessage(null)
    setIsModalOpen(true)
  }

  const openEditModal = (p: AdminProduct) => {
    setEditingProduct(p)
    setName(p.name)
    setDescription(p.description || '')
    setPrice(p.price)
    setImageUrl(p.imageUrl || '')
    setCategoryId(p.categoryId)
    setIsAvailable(p.isAvailable)
    setErrorMessage(null)
    setIsModalOpen(true)
  }

  // 1-Click Availability Toggle
  const handleToggleAvailability = async (p: AdminProduct) => {
    setTogglingId(p.id)
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !p.isAvailable }),
      })

      if (!res.ok) throw new Error('Failed to toggle availability')

      showToast(`"${p.name}" is now ${!p.isAvailable ? 'Available' : 'Sold Out'}`)
      onRefresh()
    } catch (e) {
      console.error(e)
      alert('Failed to update product availability')
    } finally {
      setTogglingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage('Product name is required')
      return
    }

    if (typeof price !== 'number' || price <= 0) {
      setErrorMessage('Please enter a valid price greater than 0')
      return
    }

    if (!categoryId) {
      setErrorMessage('Please select a category')
      return
    }

    setIsSubmitting(true)

    try {
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products'

      const method = editingProduct ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          price: Number(price),
          imageUrl: imageUrl.trim() || null,
          categoryId,
          isAvailable,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product')
      }

      showToast(
        editingProduct ? `Product "${name}" updated!` : `Product "${name}" created!`
      )

      setIsModalOpen(false)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (p: AdminProduct) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${p.name}"?`)
    if (!confirmed) return

    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to delete product')
        return
      }

      showToast(data.message || `Product "${p.name}" removed`)
      onRefresh()
    } catch (e) {
      console.error(e)
      alert('Failed to delete product')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Search Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-amber-500" />
            <span>Menu Products ({initialProducts.length})</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage dishes, pricing, descriptions, and real-time inventory status.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search products by name, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchQuery('');
            }}
            className="w-full pl-10 pr-9 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-0.5"
              aria-label="Clear search"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 text-xs bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-800/60 uppercase tracking-wider text-[11px] text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 font-bold">Price</th>
                <th className="py-3.5 px-4 text-center">Availability</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredProducts.map((prod) => {
                const isToggling = togglingId === prod.id

                return (
                  <tr
                    key={prod.id}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/60 flex items-center justify-center">
                          <img
                            src={getProductImage(prod.imageUrl, prod.category?.slug)}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {prod.name}
                          </div>
                          {prod.description && (
                            <p className="text-zinc-400 text-[11px] line-clamp-1 max-w-xs mt-0.5">
                              {prod.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300">
                        <span>{prod.category?.emoji}</span>
                        <span>{prod.category?.name || 'General'}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 font-black text-sm text-amber-400">
                      ${prod.price.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(prod)}
                        disabled={isToggling}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          prod.isAvailable
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                        } disabled:opacity-50`}
                        title="Click to toggle availability"
                      >
                        {isToggling ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : prod.isAvailable ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        <span>{prod.isAvailable ? 'Available' : 'Sold Out'}</span>
                      </button>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(prod)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Product Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProduct ? 'Edit Product' : 'Create New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Truffle Mushroom Burger"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Price ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="12.99"
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : ''
                      setPrice(val)
                    }}
                    className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Photo URL (Real Food Photo)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  {imageUrl && (
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Enter a direct web image link (Unsplash or image hosting URL).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe ingredients, preparation style, allergen info..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-200 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="avail-check"
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-zinc-800 border-zinc-700 cursor-pointer"
                />
                <label
                  htmlFor="avail-check"
                  className="text-xs font-semibold text-zinc-300 cursor-pointer"
                >
                  Item is immediately available for ordering
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProduct ? 'Update Product' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
