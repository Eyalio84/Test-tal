import type { Metadata } from "next"
import Image from "next/image"
import Link  from "next/link"
import { THEMES } from "@/lib/theme"

export const metadata: Metadata = {
  title: "Theme Showcase",
  description: "Browse all available store themes — 8 fully-voiced e-commerce experiences.",
}

export default function ThemesPage() {
  const themes = Object.values(THEMES)

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-3xl text-ink mb-3">Theme Showcase</h1>
          <p className="text-ink/50 text-sm max-w-md mx-auto">
            Every theme ships with a unique Aria voice, product catalog, and brand identity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {themes.map((theme) => (
            <Link
              key={theme.id}
              href={`/themes/${theme.id}`}
              className="group block bg-white border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all overflow-hidden"
            >
              {/* Hero image */}
              <div className="relative h-44 overflow-hidden">
                <Image
                  src={theme.hero.image}
                  alt={theme.brand.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105 opacity-80"
                />
                <div
                  className="absolute inset-0 opacity-40"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.accentDark}, ${theme.colors.accent})` }}
                />
                <div className="absolute inset-0 flex items-end p-4">
                  <div>
                    <p className="font-serif text-white text-lg leading-tight">{theme.brand.name}</p>
                    <p className="text-white/70 text-xs mt-0.5">{theme.aria.name} · {theme.aria.voice}</p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-ink/60 text-xs leading-relaxed">{theme.brand.tagline}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ background: theme.colors.accent }}
                  />
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ background: theme.colors.accentLight }}
                  />
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ background: theme.colors.background }}
                  />
                  <span className="ml-auto text-xs text-ink/30 uppercase tracking-wider">{theme.id}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
