export default function Loading() {
  return (
    <div className="pt-16 animate-pulse">
      {/* Navbar spacer */}
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-6 py-16 space-y-6">
        <div className="h-8 bg-stone-100 rounded w-48" />
        <div className="h-4 bg-stone-100 rounded w-72" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-square bg-stone-100 rounded" />
              <div className="h-4 bg-stone-100 rounded mt-3 w-3/4" />
              <div className="h-3 bg-stone-100 rounded mt-2 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
