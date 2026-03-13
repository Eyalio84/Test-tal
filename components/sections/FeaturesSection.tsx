"use client"

export default function FeaturesSection(_props: Record<string, unknown>) {
  const features = [
    { icon: "⚡", title: "Lightning Fast", desc: "Built for speed from the ground up." },
    { icon: "🔒", title: "Secure by Default", desc: "Enterprise-grade security included." },
    { icon: "📈", title: "Built to Scale", desc: "Grows with your business seamlessly." },
  ]

  return (
    <section className="bg-white px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-serif tracking-wider text-ink mb-4 text-center">
          Features
        </h2>
        <p className="text-stone-500 text-sm text-center mb-12 max-w-lg mx-auto">
          Everything you need to build, launch, and grow your SaaS product.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="bg-stone-50 rounded-xl p-8 flex flex-col items-center text-center gap-4">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-serif text-lg tracking-wide text-ink">{f.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
