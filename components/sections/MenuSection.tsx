"use client"

export default function MenuSection(_props: Record<string, unknown>) {
  const categories = ["Starters", "Mains", "Desserts"]

  return (
    <section className="bg-white px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif tracking-wider text-ink mb-10 text-center">
          Menu
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {categories.map((cat) => (
            <div key={cat} className="flex flex-col gap-4">
              <h3 className="font-serif text-lg tracking-wide text-ink border-b border-stone-200 pb-2">
                {cat}
              </h3>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="bg-stone-100 rounded h-4 w-3/4" />
                    <div className="bg-stone-100 rounded h-3 w-1/2" />
                  </div>
                  <div className="bg-stone-100 rounded h-4 w-12 shrink-0" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
