import type { Metadata } from "next"
import Image from "next/image"
import { getActiveTheme } from "@/lib/getActiveTheme"

const icons = ["✦", "◎", "◈"]

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getActiveTheme()
  return { title: `About | ${theme.brand.name}` }
}

export default async function AboutPage() {
  const theme = await getActiveTheme()
  const { about, brand, hero } = theme

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative h-80 md:h-96 bg-stone-900 flex items-center justify-center overflow-hidden">
        <Image
          src={hero.image}
          alt={`${brand.name} story`}
          fill
          className="object-cover opacity-40"
        />
        <div className="relative z-10 text-center px-6">
          <h1 className="font-serif text-4xl md:text-5xl text-white tracking-wide">Our Story</h1>
          <p className="mt-3 text-white/70 text-sm tracking-widest uppercase">{brand.tagline}</p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-serif text-3xl text-ink mb-6">{brand.name}</h2>
          <p className="text-ink/70 text-sm leading-relaxed">{about.story}</p>
        </div>
        <div className="relative h-72 md:h-96 overflow-hidden">
          <Image
            src={hero.image}
            alt={hero.imageAlt}
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
            {about.values.map((v, i) => (
              <div key={v.title} className="text-center">
                <span className="text-3xl text-gold block mb-4">{icons[i % icons.length]}</span>
                <h3 className="font-serif text-lg text-ink mb-3">{v.title}</h3>
                <p className="text-sm text-ink/60 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      {about.team.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="font-serif text-2xl text-ink text-center mb-12">The people behind {brand.name}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {about.team.map((member) => (
              <div key={member.name} className="text-center">
                {member.image && (
                  <div className="relative w-40 h-40 rounded-full overflow-hidden mx-auto mb-4">
                    <Image src={member.image} alt={member.name} fill className="object-cover" />
                  </div>
                )}
                <h3 className="font-serif text-base text-ink">{member.name}</h3>
                <p className="text-xs tracking-wide text-ink/50 mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
