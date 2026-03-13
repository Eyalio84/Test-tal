"use client"

export default function GalleryGrid(_props: Record<string, unknown>) {
  const heights = ["aspect-square", "aspect-[3/4]", "aspect-[4/3]", "aspect-square", "aspect-[4/3]", "aspect-[3/4]"]

  return (
    <section className="bg-stone-50 px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif tracking-wider text-ink mb-8">
          Gallery
        </h2>
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {heights.map((aspect, i) => (
            <div key={i} className={`bg-stone-100 rounded-xl ${aspect} break-inside-avoid`} />
          ))}
        </div>
      </div>
    </section>
  )
}
