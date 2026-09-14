'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, FolderTree, AlertCircle, X, Loader2 } from 'lucide-react'

export interface AdminCategory {
  id: string
  name: string
  slug: string
  emoji: string | null
  sortOrder: number
  _count?: { products: number }
}

interface Props {
  initialCategories: AdminCategory[]
  onRefresh: () => void
  showToast: (msg: string) => void
}

export default function CategoriesManager({
  initialCategories,
  onRefresh,
  showToast,
}: Props) {
  const categories = initialCategories
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [emoji, setEmoji] = useState('')
  const [sortOrder, setSortOrder] = useState(0)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const openCreateModal = () => {
    setEditingCategory(null)
    setName('')
    setSlug('')
    setEmoji('🍽️')
    setSortOrder(categories.length + 1)
    setErrorMessage(null)
    setIsModalOpen(true)
  }

  const openEditModal = (cat: AdminCategory) => {
    setEditingCategory(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setEmoji(cat.emoji || '🍽️')
    setSortOrder(cat.sortOrder)
    setErrorMessage(null)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim()) {
      setErrorMessage('Category name is required')
      return
    }

    setIsSubmitting(true)

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories'

      const method = editingCategory ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          emoji: emoji.trim() || null,
          sortOrder: Number(sortOrder),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save category')
      }

      showToast(
        editingCategory
          ? `Category "${name}" updated!`
          : `Category "${name}" created!`
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

  const handleDelete = async (cat: AdminCategory) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete category "${cat.name}"?`
    )
    if (!confirmed) return

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Failed to delete category')
        return
      }

      showToast(`Category "${cat.name}" deleted!`)
      onRefresh()
    } catch (e) {
      console.error(e)
      alert('Failed to delete category')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-amber-500" />
            <span>Menu Categories ({initialCategories.length})</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Organize customer menu items into visible food & beverage groups.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-800/60 uppercase tracking-wider text-[11px] text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Emoji</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4 text-center">Products</th>
                <th className="py-3.5 px-4 text-center">Sort Order</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {initialCategories.map((cat) => (
                <tr
                  key={cat.id}
                  className="hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="py-4 px-4 sm:px-6">
                    <span className="text-2xl select-none">{cat.emoji || '🍽️'}</span>
                  </td>
                  <td className="py-4 px-4 font-bold text-white text-sm">
                    {cat.name}
                  </td>
                  <td className="py-4 px-4 font-mono text-zinc-400">
                    /{cat.slug}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-800 text-amber-400">
                      {cat._count?.products ?? 0} items
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-zinc-400">
                    {cat.sortOrder}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
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
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Specialty Pastries"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Display Emoji
                  </label>
                  <input
                    type="text"
                    placeholder="🥐"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 text-sm bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  URL Slug (Optional)
                </label>
                <input
                  type="text"
                  placeholder="pastries (auto-generated if empty)"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 focus:outline-none focus:border-amber-500"
                />
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
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
