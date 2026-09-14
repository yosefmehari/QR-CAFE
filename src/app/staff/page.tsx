'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  ArrowLeft,
} from 'lucide-react'

export default function StaffPortalPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.')
      }

      // Automatically route based on staff role
      router.push(data.redirectUrl || '/admin')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password.'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

      {/* Top Header Link */}
      <div className="max-w-md w-full mx-auto pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Cafe Menu</span>
        </Link>
      </div>

      {/* Main Staff Sign In Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-zinc-900/90 backdrop-blur-xl rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Staff Portal Access
            </h1>
            <p className="text-xs text-zinc-400">
              Sign in with your staff email and password to access your station.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="staff-email"
                className="block text-xs font-bold text-zinc-300 uppercase tracking-wider"
              >
                Staff Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="staff-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@qrcafe.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="staff-password"
                className="block text-xs font-bold text-zinc-300 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="staff-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-zinc-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Station</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Staff Accounts Helper */}
          <div className="pt-3 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Staff Accounts
              </span>
              <span className="text-[10px] text-zinc-500">
                Select account to fill email
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@qrcafe.dev')
                  setErrorMessage(null)
                }}
                className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all text-center cursor-pointer"
              >
                <div className="font-bold text-white">Administrator</div>
                <div className="text-[10px] text-zinc-500 truncate">admin@qrcafe.dev</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('kitchen@qrcafe.dev')
                  setErrorMessage(null)
                }}
                className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 hover:text-orange-400 hover:border-orange-500/30 transition-all text-center cursor-pointer"
              >
                <div className="font-bold text-white">Kitchen Chef</div>
                <div className="text-[10px] text-zinc-500 truncate">kitchen@qrcafe.dev</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('juice@qrcafe.dev')
                  setErrorMessage(null)
                }}
                className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all text-center cursor-pointer"
              >
                <div className="font-bold text-white">Juice Maker</div>
                <div className="text-[10px] text-zinc-500 truncate">juice@qrcafe.dev</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('waiter@qrcafe.dev')
                  setErrorMessage(null)
                }}
                className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 hover:text-blue-400 hover:border-blue-500/30 transition-all text-center cursor-pointer"
              >
                <div className="font-bold text-white">Waiter Staff</div>
                <div className="text-[10px] text-zinc-500 truncate">waiter@qrcafe.dev</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-zinc-600 pb-2">
        Aroma &amp; Fork Staff Security System
      </div>
    </div>
  )
}
