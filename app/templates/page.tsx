import Image from "next/image"
import Link from "next/link"
import { THEMES } from "@/lib/theme"

export default function TemplatesPage() {
  const themes = Object.values(THEMES)

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="font-serif text-4xl text-white mb-4">Templates</h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            8 fully-voiced storefronts, powered by Aria. Each is a real, working theme you can launch.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {themes.map((theme) => (
            <Link key={theme.id} href={`/templates/${theme.id}`} className="group block">
              <div className="relative h-56 overflow-hidden mb-4 bg-zinc-900">
                <Image
                  src={theme.hero.image}
                  alt={theme.hero.imageAlt}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <p className="font-serif text-white text-lg">{theme.brand.name}</p>
                  <p className="text-white/60 text-xs mt-0.5">{theme.brand.tagline}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs tracking-widest uppercase text-zinc-500 group-hover:text-zinc-300 transition">
                  View demo →
                </span>
                <span className="text-[10px] tracking-widest uppercase text-zinc-600">
                  {theme.products.length} products
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
