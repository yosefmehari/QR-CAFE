'use client'

import { useState, useMemo } from 'react'
import {
  Users,
  Plus,
  ShieldCheck,
  ChefHat,
  Trash2,
  KeyRound,
  Mail,
  AlertCircle,
  X,
  Loader2,
  Check,
  Coffee,
  Bell,
  Bike,
  Search,
  Edit2,
  Copy,
  Sparkles,
  RefreshCw,
} from 'lucide-react'

export interface AdminStaffUser {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'KITCHEN' | 'JUICE_MAKER' | 'WAITER' | 'DELIVERY'
  createdAt: string
}

interface Props {
  initialStaff: AdminStaffUser[]
  currentUserId: string
  onRefresh: () => void
  showToast: (msg: string) => void
}

function generateRandomPassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*'
  let pass = ''
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

export default function StaffManager({
  initialStaff,
  currentUserId,
  onRefresh,
  showToast,
}: Props) {
  const [staff, setStaff] = useState<AdminStaffUser[]>(initialStaff)
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'KITCHEN' | 'JUICE_MAKER' | 'WAITER' | 'DELIVERY'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [resetModalUser, setResetModalUser] = useState<AdminStaffUser | null>(null)
  const [editModalUser, setEditModalUser] = useState<AdminStaffUser | null>(null)

  // Form states for creating staff
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'KITCHEN' | 'JUICE_MAKER' | 'WAITER' | 'DELIVERY'>('KITCHEN')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Edit staff form states
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<'ADMIN' | 'KITCHEN' | 'JUICE_MAKER' | 'WAITER' | 'DELIVERY'>('KITCHEN')
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Reset password states
  const [newPassword, setNewPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)

  // Sync if initialStaff changes
  const [prevStaff, setPrevStaff] = useState(initialStaff)
  if (initialStaff !== prevStaff) {
    setPrevStaff(initialStaff)
    setStaff(initialStaff)
  }

  // Filter staff by role & search query
  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return staff.filter((s) => {
      const matchesRole = roleFilter === 'ALL' || s.role === roleFilter
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      return matchesRole && matchesSearch
    })
  }, [staff, roleFilter, searchQuery])

  // Count per role
  const counts = useMemo(() => {
    return {
      ALL: staff.length,
      ADMIN: staff.filter((s) => s.role === 'ADMIN').length,
      KITCHEN: staff.filter((s) => s.role === 'KITCHEN').length,
      JUICE_MAKER: staff.filter((s) => s.role === 'JUICE_MAKER').length,
      WAITER: staff.filter((s) => s.role === 'WAITER').length,
      DELIVERY: staff.filter((s) => s.role === 'DELIVERY').length,
    }
  }, [staff])

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add staff member')
      }

      showToast(`Staff member "${name}" added successfully!`)
      setIsAddModalOpen(false)
      setName('')
      setEmail('')
      setPassword('')
      setRole('KITCHEN')
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (member: AdminStaffUser) => {
    setEditModalUser(member)
    setEditName(member.name)
    setEditRole(member.role)
    setEditError(null)
  }

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editModalUser) return
    setEditError(null)

    if (!editName.trim()) {
      setEditError('Name cannot be empty.')
      return
    }

    setIsEditing(true)
    try {
      const res = await fetch(`/api/admin/staff/${editModalUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          role: editRole,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update staff member')
      }

      showToast(`Staff member "${editName}" updated successfully!`)
      setEditModalUser(null)
      onRefresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update staff'
      setEditError(msg)
    } finally {
      setIsEditing(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetModalUser || !newPassword.trim()) return

    setIsResetting(true)
    try {
      const res = await fetch(`/api/admin/staff/${resetModalUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reset password')
      }

      showToast(`Password successfully updated for ${resetModalUser.name}!`)
      setResetModalUser(null)
      setNewPassword('')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setIsResetting(false)
    }
  }

  const handleDeleteStaff = async (member: AdminStaffUser) => {
    const isCurrentUser = member.id === currentUserId || member.email === currentUserId
    if (isCurrentUser) {
      alert('You cannot delete your own active administrator account.')
      return
    }

    const confirmed = window.confirm(`Are you sure you want to permanently delete staff member ${member.name} (${member.email})?`)
    if (!confirmed) return

    try {
      const res = await fetch(`/api/admin/staff/${member.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete staff member')
      }

      showToast(`Removed staff member "${member.name}"`)
      onRefresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete staff member')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPassword(true)
    setTimeout(() => setCopiedPassword(false), 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-zinc-900 rounded-3xl p-5 sm:p-6 border border-zinc-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-500" />
            <span>Staff Management &amp; Access Control</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            View all staff members, assign roles, edit details, set individual passwords, or remove accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onRefresh()}
            className="p-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Staff List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setErrorMessage(null)
              setName('')
              setEmail('')
              setPassword(generateRandomPassword())
              setRole('KITCHEN')
              setIsAddModalOpen(true)
            }}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Staff</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { key: 'ALL', label: 'All Staff' },
              { key: 'ADMIN', label: 'Admins' },
              { key: 'KITCHEN', label: 'Kitchen' },
              { key: 'JUICE_MAKER', label: 'Juice Bar' },
              { key: 'WAITER', label: 'Waiters' },
              { key: 'DELIVERY', label: 'Delivery' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                roleFilter === tab.key
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  roleFilter === tab.key
                    ? 'bg-zinc-950/20 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search staff by name/email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-12 text-center">
          <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No Staff Members Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No staff match "${searchQuery}". Try a different search term.`
              : 'No staff accounts exist for this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => {
            const isCurrentUser = member.id === currentUserId || member.email === currentUserId
            const isAdmin = member.role === 'ADMIN'
            const isKitchen = member.role === 'KITCHEN'
            const isJuice = member.role === 'JUICE_MAKER'
            const isWaiter = member.role === 'WAITER'
            const isDelivery = member.role === 'DELIVERY'

            return (
              <div
                key={member.id}
                className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-lg relative flex flex-col justify-between group hover:border-zinc-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-white shrink-0">
                      {isAdmin && <ShieldCheck className="w-5 h-5 text-amber-400" />}
                      {isKitchen && <ChefHat className="w-5 h-5 text-orange-400" />}
                      {isJuice && <Coffee className="w-5 h-5 text-fuchsia-400" />}
                      {isWaiter && <Bell className="w-5 h-5 text-cyan-400" />}
                      {isDelivery && <Bike className="w-5 h-5 text-teal-400" />}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isAdmin
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : isKitchen
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                              : isJuice
                                ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
                                : isWaiter
                                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                  : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                        }`}
                      >
                        {member.role === 'JUICE_MAKER'
                          ? 'JUICE MAKER'
                          : member.role === 'DELIVERY'
                            ? 'DELIVERY'
                            : member.role}
                      </span>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          You
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-base text-white">{member.name}</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="truncate">{member.email}</span>
                  </p>
                  <div className="text-[11px] text-zinc-500 mt-2">
                    Joined {new Date(member.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Control Buttons */}
                <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Edit Staff Role & Name */}
                    <button
                      type="button"
                      onClick={() => openEditModal(member)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Edit role & details"
                    >
                      <Edit2 className="w-3 h-3 text-cyan-400" />
                      <span>Edit</span>
                    </button>

                    {/* Reset Password */}
                    <button
                      type="button"
                      onClick={() => {
                        setResetModalUser(member)
                        setNewPassword(generateRandomPassword())
                        setCopiedPassword(false)
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Set new password"
                    >
                      <KeyRound className="w-3 h-3 text-amber-400" />
                      <span>Set Password</span>
                    </button>
                  </div>

                  {/* Delete Button */}
                  {!isCurrentUser ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(member)}
                      className="p-1.5 rounded-xl bg-zinc-800/50 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete staff account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-zinc-500 font-medium italic">Active Session</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Add New Staff Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Add New Staff Member</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Waiter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@qrcafe.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Initial Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword(generateRandomPassword())}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter initial password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Assigned Station / Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('KITCHEN')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      role === 'KITCHEN'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>Kitchen Chef</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('JUICE_MAKER')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      role === 'JUICE_MAKER'
                        ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Coffee className="w-4 h-4" />
                    <span>Juice Maker</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('WAITER')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      role === 'WAITER'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span>Waiter Staff</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('DELIVERY')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      role === 'DELIVERY'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>Delivery Courier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all col-span-2 ${
                      role === 'ADMIN'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Administrator</span>
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Staff</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Staff Member Role & Details */}
      {editModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <span>Edit Staff Member</span>
              </h3>
              <button
                onClick={() => setEditModalUser(null)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Email Address (Read-only)
                </label>
                <input
                  type="email"
                  disabled
                  value={editModalUser.email}
                  className="w-full px-3.5 py-2.5 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl text-xs text-zinc-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">
                  Station / Role Assignment
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('KITCHEN')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      editRole === 'KITCHEN'
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>Kitchen Chef</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('JUICE_MAKER')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      editRole === 'JUICE_MAKER'
                        ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Coffee className="w-4 h-4" />
                    <span>Juice Maker</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('WAITER')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      editRole === 'WAITER'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                    <span>Waiter Staff</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('DELIVERY')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      editRole === 'DELIVERY'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>Delivery Courier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRole('ADMIN')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all col-span-2 ${
                      editRole === 'ADMIN'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Administrator</span>
                  </button>
                </div>
              </div>

              {editError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-zinc-950 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isEditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Reset Staff Password</span>
              </h3>
              <button
                onClick={() => setResetModalUser(null)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Set a new password for <strong className="text-white">{resetModalUser.name}</strong> ({resetModalUser.email}).
              </p>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const p = generateRandomPassword()
                      setNewPassword(p)
                      setCopiedPassword(false)
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-amber-500 pr-10"
                  />
                  {newPassword && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(newPassword)}
                      className="absolute right-2.5 top-2.5 p-1 text-zinc-400 hover:text-white cursor-pointer"
                      title="Copy password"
                    >
                      {copiedPassword ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
