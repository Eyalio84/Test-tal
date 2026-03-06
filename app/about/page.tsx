import type { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
  title: "About Us",
}

const values = [
  {
    icon: "✦",
    title: "Craftsmanship",
    description: "Every piece is hand-finished by artisans who have spent decades perfecting their technique.",
  },
  {
    icon: "◎",
    title: "Sustainability",
    description: "Ethically sourced materials, recycled gold, and packaging that gives back to the earth.",
  },
  {
    icon: "◈",
    title: "Heritage",
    description: "Rooted in centuries-old jewelry traditions, reimagined for the modern wearer.",
  },
]

const team = [
  {
    name: "Sarah Chen",
    role: "Founder & Creative Director",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
  },
  {
    name: "Maya Levi",
    role: "Head of Design",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
  },
  {
    name: "Daniel Roth",
    role: "Master Goldsmith",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
]

export default function AboutPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative h-80 md:h-96 bg-stone-900 flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1400&q=80"
          alt="Our story"
          fill
          className="object-cover opacity-40"
        />
        <div className="relative z-10 text-center px-6">
          <h1 className="font-serif text-4xl md:text-5xl text-white tracking-wide">Our Story</h1>
          <p className="mt-3 text-white/70 text-sm tracking-widest uppercase">Founded with intention. Built to last.</p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-serif text-3xl text-ink mb-6">Jewelry that carries meaning</h2>
          <p className="text-ink/70 text-sm leading-relaxed mb-4">
            We believe the best jewelry is never just decoration — it&apos;s memory made tangible. Founded in 2018,
            we partner with artisan craftspeople who bring decades of skill and a deep love of their craft to every piece.
          </p>
          <p className="text-ink/70 text-sm leading-relaxed">
            Every stone is ethically sourced. Every setting is hand-finished. Every piece is made to become yours —
            to mark a moment, carry a story, and outlast trends.
          </p>
        </div>
        <div className="relative h-72 md:h-96 overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80"
            alt="Craftsmanship"
            fill
            className="object-cover"
          />
        </div>
      </section>

      {/* Values */}
      <section className="bg-stone-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-2xl text-ink text-center mb-12">What we stand for</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v) => (
              <div key={v.title} className="text-center">
                <span className="text-3xl text-gold block mb-4">{v.icon}</span>
                <h3 className="font-serif text-lg text-ink mb-3">{v.title}</h3>
                <p className="text-sm text-ink/60 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-serif text-2xl text-ink text-center mb-12">The people behind the pieces</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {team.map((member) => (
            <div key={member.name} className="text-center">
              <div className="relative w-40 h-40 rounded-full overflow-hidden mx-auto mb-4">
                <Image src={member.image} alt={member.name} fill className="object-cover" />
              </div>
              <h3 className="font-serif text-base text-ink">{member.name}</h3>
              <p className="text-xs tracking-wide text-ink/50 mt-1">{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
