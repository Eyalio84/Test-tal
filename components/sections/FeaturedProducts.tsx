"use client"

export default function FeaturedProducts(_props: Record<string, unknown>) {
  return (
    <section className="bg-white px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif tracking-wider text-ink mb-8">
          Featured Products
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="bg-stone-100 rounded-xl aspect-square" />
              <div className="bg-stone-100 rounded h-4 w-3/4" />
              <div className="bg-stone-100 rounded h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
