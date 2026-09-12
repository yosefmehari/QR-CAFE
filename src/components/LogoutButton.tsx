'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/staff')
      router.refresh()
    } catch (e) {
      console.error('Logout error:', e)
      setIsLoggingOut(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-rose-950/60 hover:text-rose-400 text-zinc-300 border border-zinc-700/60 transition-colors cursor-pointer disabled:opacity-50"
      title="Log out of session"
    >
      {isLoggingOut ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      <span>Log Out</span>
    </button>
  )
}
