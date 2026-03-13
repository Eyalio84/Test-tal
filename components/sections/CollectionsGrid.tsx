"use client"

export default function CollectionsGrid(_props: Record<string, unknown>) {
  return (
    <section className="bg-stone-50 px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif tracking-wider text-ink mb-8">
          Collections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-stone-100 rounded-xl aspect-[4/3] flex items-end p-6">
              <div className="bg-white/80 rounded h-5 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
