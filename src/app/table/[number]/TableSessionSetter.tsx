'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  tableNumber: number
}

export default function TableSessionSetter({ tableNumber }: Props) {
  const router = useRouter()

  useEffect(() => {
    // Persist table number in browser local storage
    if (typeof window !== 'undefined') {
      localStorage.setItem('qr_cafe_table_number', String(tableNumber))
      // Also set in document.cookie so server-rendered requests can read it if needed
      document.cookie = `qr_cafe_table_number=${tableNumber}; path=/; max-age=86400; SameSite=Lax`
    }

    // Auto-navigate to menu after 2 seconds
    const timer = setTimeout(() => {
      router.push(`/?table=${tableNumber}`)
    }, 2000)

    return () => clearTimeout(timer)
  }, [tableNumber, router])

  return null
}
