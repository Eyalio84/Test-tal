import Link  from "next/link"
import Image from "next/image"
import { THEMES } from "@/lib/theme"

const INDUSTRY_LABELS: Record<string, string> = {
  jewelry:    "Luxury Retail",
  candy:      "Food & Confectionery",
  bakery:     "Artisan Food",
  flowers:    "Floristry",
  wine:       "Wine & Spirits",
  restaurant: "Fine Dining",
  portfolio:  "Photography",
  saas:       "Software / SaaS",
}

export function DemoShowcase() {
  const themes = Object.values(THEMES)

  return (
    <section className="bg-zinc-950 px-6 py-20">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="mb-10 flex flex-col gap-2">
          <h2 className="text-white font-serif text-3xl">Live demos</h2>
          <p className="text-zinc-500 text-sm">
            Each demo is a real working store — with Aria in character.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {themes.map((theme) => (
            <Link
              key={theme.id}
              href={`/demos/${theme.id}`}
              className="group relative h-48 overflow-hidden bg-zinc-900 rounded-sm"
            >
              {/* Cover image */}
              <Image
                src={theme.hero.image}
                alt={theme.hero.imageAlt}
                fill
                className="object-cover opacity-50 transition-all duration-500 group-hover:opacity-70 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, ${theme.colors.accentDark}80, transparent 50%)`,
                }}
              />

              {/* Card bottom content */}
              <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                <p className="text-zinc-400 text-[10px] uppercase tracking-widest mb-0.5">
                  {INDUSTRY_LABELS[theme.id] ?? theme.id}
                </p>
                <p className="text-white font-serif text-sm leading-tight">
                  {theme.brand.name}
                </p>
              </div>

              {/* Accent bar */}
              <div
                className="absolute bottom-0 left-0 right-0 z-20"
                style={{
                  height: "1.5px",
                  backgroundColor: theme.colors.accent,
                }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
