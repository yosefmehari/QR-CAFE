import Link from 'next/link'
import { Coffee, ArrowLeft, QrCode } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Animated Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
          <Coffee className="w-10 h-10 text-amber-400 animate-pulse" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
            404 • Page Not Found
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-2">
            Lost Your Table?
          </h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            The page you are looking for might have been moved, or perhaps your cafe table session timed out.
          </p>
        </div>

        {/* Navigation Options */}
        <div className="space-y-3 pt-2">
          <Link
            href="/"
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Cafe Menu</span>
          </Link>

          <Link
            href="/tables"
            className="w-full py-3.5 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>View Table Stands Directory</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
