'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Building2,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Info,
  Check,
  Copy,
  RefreshCw,
  Clock,
  Utensils,
  Sparkles,
  Camera,
  Eye,
  X,
} from 'lucide-react'

export interface CafeBankSettings {
  id?: string
  bankName: string
  bankAccountNumber: string
  accountHolderName: string
  telebirrNumber?: string | null
  paymentInstructions?: string | null
}

export interface PendingOrderRecord {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'SERVED' | 'CANCELLED'
  orderType?: 'DINE_IN' | 'DELIVERY'
  deliveryAddress?: string | null
  customerName?: string | null
  customerPhone?: string | null
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
  items: {
    id: string
    quantity: number
    unitPrice: number
    product: {
      id: string
      name: string
    }
  }[]
}

interface Props {
  initialSettings: CafeBankSettings
  showToast: (msg: string) => void
  onOrderVerified?: () => void
}

export default function BankSettingsManager({ initialSettings, showToast, onOrderVerified }: Props) {
  // Bank details form state
  const [bankName, setBankName] = useState(initialSettings.bankName || '')
  const [bankAccountNumber, setBankAccountNumber] = useState(initialSettings.bankAccountNumber || '')
  const [accountHolderName, setAccountHolderName] = useState(initialSettings.accountHolderName || '')
  const [telebirrNumber, setTelebirrNumber] = useState(initialSettings.telebirrNumber || '')
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialSettings.paymentInstructions || ''
  )

  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Pending payments state
  const [pendingOrders, setPendingOrders] = useState<PendingOrderRecord[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [checkingOrderId, setCheckingOrderId] = useState<string | null>(null)
  const [checkingAll, setCheckingAll] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeScreenshotModal, setActiveScreenshotModal] = useState<string | null>(null)

  const fetchPendingOrders = useCallback(async () => {
    try {
      setLoadingOrders(true)
      const res = await fetch('/api/admin/orders?paymentStatus=PENDING&limit=50')
      if (res.status === 401) {
        return
      }
      if (res.ok) {
        const data = await res.json()
        setPendingOrders(data.orders || [])
      }
    } catch (err) {
      console.error('Failed to fetch pending orders', err)
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      fetchPendingOrders()
    })
  }, [fetchPendingOrders])

  // Handle checking a single order payment
  const handleCheckPayment = async (order: PendingOrderRecord) => {
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
        const label = order.orderType === 'DELIVERY'
          ? `Delivery #${order.id.slice(-4).toUpperCase()}`
          : `Table #${order.table?.number ?? '?'}`
        showToast(`Payment Checked ✓ ${label} ($${Number(order.totalPrice).toFixed(2)}) is approved!`)
        if (onOrderVerified) onOrderVerified()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to verify payment')
      }
    } catch (err) {
      console.error('Error verifying payment', err)
      showToast('Error connecting to server to verify payment')
    } finally {
      setCheckingOrderId(null)
    }
  }

  // Handle checking all pending payments
  const handleCheckAll = async () => {
    if (pendingOrders.length === 0) return
    setCheckingAll(true)
    try {
      let approvedCount = 0
      for (const order of pendingOrders) {
        const res = await fetch(`/api/admin/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentStatus: 'PAID',
            status: 'CONFIRMED',
          }),
        })
        if (res.ok) approvedCount++
      }

      setPendingOrders([])
      showToast(`All ${approvedCount} pending payments successfully checked and confirmed!`)
      if (onOrderVerified) onOrderVerified()
    } catch (err) {
      console.error('Error checking all payments', err)
      showToast('Failed to check some payments')
    } finally {
      setCheckingAll(false)
      fetchPendingOrders()
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    showToast('Transaction reference copied to clipboard')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: bankName.trim(),
          bankAccountNumber: bankAccountNumber.trim(),
          accountHolderName: accountHolderName.trim(),
          telebirrNumber: telebirrNumber.trim() || null,
          paymentInstructions: paymentInstructions.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update bank settings')
      }

      setSuccessMessage('Cafe bank details & payment settings updated successfully!')
      showToast('Bank details updated! Customers will now see your new account number.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred'
      setErrorMessage(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-10">
      {/* ======================================================== */}
      {/* SECTION 1: ORDERS AWAITING PAYMENT CHECK                 */}
      {/* ======================================================== */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-zinc-900 border border-amber-500/30 shadow-lg shadow-amber-500/5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                {pendingOrders.length > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${pendingOrders.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              </span>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Orders Awaiting Payment Check</span>
                {pendingOrders.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-zinc-950">
                    {pendingOrders.length} Need Check
                  </span>
                )}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Verify customer bank transfers &amp; CBE transaction codes below. Customers are held on the tracking screen until you click <strong className="text-emerald-400 font-bold">&quot;Checked ✓&quot;</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={fetchPendingOrders}
              disabled={loadingOrders}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {pendingOrders.length > 0 && (
              <button
                type="button"
                onClick={handleCheckAll}
                disabled={checkingAll}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
              >
                {checkingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking All...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Check All ({pendingOrders.length}) ✓</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Loading Skeleton */}
        {loadingOrders && pendingOrders.length === 0 && (
          <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
            <p className="text-xs text-zinc-400">Loading pending payments...</p>
          </div>
        )}

        {/* Empty State */}
        {!loadingOrders && pendingOrders.length === 0 && (
          <div className="p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/20 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">All Payments Checked &amp; Verified!</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              There are currently no customer bank transfers waiting for review. When a customer places a bank transfer or card order, it will appear here immediately with a &quot;Checked ✓&quot; button.
            </p>
          </div>
        )}

        {/* Pending Orders List */}
        {pendingOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingOrders.map((order) => {
              const isChecking = checkingOrderId === order.id
              const createdDate = new Date(order.createdAt)
              const timeFormatted = isNaN(createdDate.getTime())
                ? ''
                : createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

              return (
                <div
                  key={order.id}
                  className="p-5 rounded-3xl bg-zinc-900 border border-amber-500/40 shadow-lg shadow-black/40 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:border-amber-500 transition-colors"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {order.orderType === 'DELIVERY' ? (
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950">
                          🛵 Delivery
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-amber-500 text-zinc-950">
                          Table {order.table?.number ?? '?'}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                        {order.paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : order.paymentMethod || 'Payment'}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-emerald-400">
                        ${Number(order.totalPrice).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        <span>{timeFormatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Reference / CBE Code Card */}
                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                      <span>Transaction Code / Reference</span>
                      {order.paymentReference && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.paymentReference || '', order.id)}
                          className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === order.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="font-mono text-xs font-bold text-amber-300 break-all">
                      {order.paymentReference || 'No reference provided (Manual Check)'}
                    </div>
                  </div>

                  {/* Payment Receipt Screenshot Preview */}
                  {order.paymentScreenshot && (
                    <div className="p-3 rounded-2xl bg-zinc-950 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Receipt Screenshot Attached</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveScreenshotModal(order.paymentScreenshot || null)}
                          className="font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Full Photo</span>
                        </button>
                      </div>

                      <div
                        onClick={() => setActiveScreenshotModal(order.paymentScreenshot || null)}
                        className="w-full h-36 rounded-xl overflow-hidden bg-black/60 border border-zinc-800 relative cursor-pointer group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.paymentScreenshot}
                          alt="Customer payment screenshot"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1.5">
                          <Eye className="w-4 h-4 text-amber-400" />
                          <span>Click to Enlarge</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Items summary */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                      <Utensils className="w-3 h-3" />
                      <span>Order Items ({order.items.reduce((s, i) => s + i.quantity, 0)})</span>
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-2">
                      {order.items.map((it) => `${it.quantity}x ${it.product.name}`).join(', ')}
                    </p>
                    {order.notes && (
                      <p className="text-[11px] text-zinc-400 italic">
                        Note: &ldquo;{order.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* THE CHECK BUTTON */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                    <div className="text-[10px] text-zinc-500 font-mono">
                      #{order.id.slice(-6).toUpperCase()}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCheckPayment(order)}
                      disabled={isChecking || checkingAll}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-zinc-950 shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      {isChecking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Approving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Checked ✓ (Approve Payment)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* SECTION 2: CAFE BANK ACCOUNT SETTINGS FORM               */}
      {/* ======================================================== */}
      <section className="space-y-6 pt-6 border-t border-zinc-800">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span>Cafe Bank &amp; Payment Details</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure your cafe bank name, account number, Telebirr number, and payment instructions. Customers will see this information when they pay at the table.
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Grid */}
        <form onSubmit={handleSave} className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Bank Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Commercial Bank of Ethiopia (CBE), Awash Bank"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Bank Account Number *
              </label>
              <input
                type="text"
                required
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="e.g. 1000234567890"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Account Holder Name */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                Account Holder / Business Name *
              </label>
              <input
                type="text"
                required
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="e.g. Aroma & Fork Cafe LLC"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Telebirr / Mobile Money Number */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>Telebirr / Mobile Wallet (Optional)</span>
              </label>
              <input
                type="text"
                value={telebirrNumber}
                onChange={(e) => setTelebirrNumber(e.target.value)}
                placeholder="e.g. 0911000000"
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white font-mono placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Transfer Instructions */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-500" />
              <span>Instructions shown to Customers</span>
            </label>
            <textarea
              rows={3}
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              placeholder="Transfer the total order amount and enter the transaction confirmation code / receipt number below."
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
            />
          </div>

          {/* Live Preview Card */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Customer Checkout Preview</span>
            </div>
            <div className="text-xs text-zinc-300 space-y-1 font-mono">
              <div><span className="text-zinc-500 font-sans">Bank:</span> {bankName || 'Not configured'}</div>
              <div><span className="text-zinc-500 font-sans">Account No:</span> <span className="text-amber-400 font-bold">{bankAccountNumber || 'Not configured'}</span></div>
              <div><span className="text-zinc-500 font-sans">Account Name:</span> {accountHolderName || 'Not configured'}</div>
              {telebirrNumber && (
                <div><span className="text-zinc-500 font-sans">Telebirr:</span> <span className="text-amber-400 font-bold">{telebirrNumber}</span></div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-zinc-950 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Bank Details...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Bank Information</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Screenshot Lightbox Modal */}
      {activeScreenshotModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveScreenshotModal(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 max-w-2xl w-full max-h-[90vh] flex flex-col space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">Payment Receipt Proof</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveScreenshotModal(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-zinc-950 flex items-center justify-center p-2 min-h-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeScreenshotModal}
                alt="Full receipt screenshot proof"
                className="max-h-[70vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <a
                href={activeScreenshotModal}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
              >
                Open in new tab ↗
              </a>
              <button
                type="button"
                onClick={() => setActiveScreenshotModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

