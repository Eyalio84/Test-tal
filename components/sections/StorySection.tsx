"use client"

export default function StorySection(_props: Record<string, unknown>) {
  return (
    <section className="bg-white px-6 py-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-5">
          <h2 className="text-2xl font-serif tracking-wider text-ink">
            Our Story
          </h2>
          <div className="flex flex-col gap-3">
            <div className="bg-stone-100 rounded h-4 w-full" />
            <div className="bg-stone-100 rounded h-4 w-full" />
            <div className="bg-stone-100 rounded h-4 w-5/6" />
            <div className="bg-stone-100 rounded h-4 w-full" />
            <div className="bg-stone-100 rounded h-4 w-2/3" />
          </div>
        </div>
        <div className="bg-stone-100 rounded-xl aspect-[4/3]" />
      </div>
    </section>
  )
}
