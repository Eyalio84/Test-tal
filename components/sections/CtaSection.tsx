"use client"

export default function CtaSection(_props: Record<string, unknown>) {
  return (
    <section className="bg-white px-6 py-16">
      <div className="max-w-7xl mx-auto text-center">
        <div className="bg-stone-50 rounded-2xl px-8 py-14 flex flex-col items-center gap-6">
          <h2 className="text-2xl font-serif tracking-wider text-ink">
            Ready to get started?
          </h2>
          <p className="text-stone-500 max-w-md text-sm leading-relaxed">
            Join thousands of businesses building beautiful storefronts with voice.
          </p>
          <div className="bg-stone-200 rounded-full h-11 w-44" />
        </div>
      </div>
    </section>
  )
}
