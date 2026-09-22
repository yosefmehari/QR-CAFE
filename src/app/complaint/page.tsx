import { Suspense } from 'react'
import type { Metadata } from 'next'
import ComplaintPageClient from '@/components/ComplaintPageClient'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Food Return & Quality Complaint Desk | Aroma & Fork Cafe',
  description:
    'Report food issues, don\'t like your order, or request a food return, fresh remake, or refund under our 100% Satisfaction Guarantee.',
}

export const revalidate = 0

function ComplaintLoadingFallback() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-zinc-500 text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        <span>Loading Guest Return &amp; Complaint Desk...</span>
      </div>
    </div>
  )
}

export default function ComplaintPage() {
  return (
    <Suspense fallback={<ComplaintLoadingFallback />}>
      <ComplaintPageClient />
    </Suspense>
  )
}
