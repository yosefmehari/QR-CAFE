export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 sm:p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="max-w-6xl mx-auto flex items-center justify-between h-16 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-1.5">
            <div className="w-32 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-20 h-3 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="w-48 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 hidden md:block" />
        <div className="w-24 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Hero skeleton */}
      <div className="max-w-6xl mx-auto py-10 space-y-3">
        <div className="w-28 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="w-full max-w-xl h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="w-full max-w-md h-5 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {/* Category pills skeleton */}
      <div className="max-w-6xl mx-auto flex gap-3 pb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="w-24 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0"
          />
        ))}
      </div>

      {/* Cards grid skeleton */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 space-y-4"
          >
            <div className="w-full h-40 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-3/4 h-5 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="w-full h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex justify-between items-center pt-2">
              <div className="w-16 h-6 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="w-20 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
