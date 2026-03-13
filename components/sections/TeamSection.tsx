"use client"

export default function TeamSection(_props: Record<string, unknown>) {
  return (
    <section className="bg-stone-50 px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif tracking-wider text-ink mb-8 text-center">
          Our Team
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="bg-stone-100 rounded-full w-24 h-24" />
              <div className="bg-stone-100 rounded h-4 w-24" />
              <div className="bg-stone-200 rounded h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
