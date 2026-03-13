"use client"

export default function ProductGrid(props: Record<string, unknown>) {
  const columns = typeof props.columns === "number" ? props.columns : 3

  return (
    <section className="bg-stone-50 px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif tracking-wider text-ink mb-8">
          All Products
        </h2>
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns * 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="bg-stone-100 rounded-xl aspect-square" />
              <div className="bg-stone-100 rounded h-4 w-3/4" />
              <div className="bg-stone-100 rounded h-3 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
