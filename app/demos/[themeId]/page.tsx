import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { THEMES } from "@/lib/theme"
import { resolveTheme } from "@/lib/themeImages"

export async function generateStaticParams() {
  return Object.keys(THEMES).map((id) => ({ themeId: id }))
}

export default async function DemoHomePage({ params }: { params: Promise<{ themeId: string }> }) {
  const { themeId } = await params
  const theme = await resolveTheme(themeId).catch(() => null)
  if (!theme) notFound()

  const featured = theme.products.slice(0, 4)

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-96 flex items-center justify-center overflow-hidden">
        <Image
          src={theme.hero.image}
          alt={theme.hero.imageAlt}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.colors.accentDark}cc, ${theme.colors.accent}88)` }} />
        <div className="relative z-10 text-center px-6">
          <p className="text-white/70 text-xs tracking-widest uppercase mb-3">{theme.brand.name}</p>
          <h1 className="font-serif text-4xl md:text-6xl text-white mb-4">{theme.hero.headline}</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">{theme.hero.subline}</p>
          <Link
            href={`/demos/${themeId}/products`}
            className="inline-block px-8 py-3 text-sm tracking-widest uppercase text-white border border-white/60 hover:bg-white hover:text-zinc-900 transition"
          >
            {theme.hero.ctaText}
          </Link>
        </div>
      </section>

      {/* Featured products */}
      <section className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-serif text-2xl text-ink mb-8">Featured</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map((product) => (
              <div key={product.slug} className="group">
                <div className="relative h-56 overflow-hidden mb-3">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="text-ink text-sm font-medium">{product.name}</p>
                <p className="text-ink/50 text-xs mt-0.5">${product.price.toFixed(2)}</p>
                <Link
                  href={`/demos/${themeId}/products`}
                  className="mt-2 inline-block text-xs tracking-widest uppercase text-ink/50 hover:text-ink transition"
                >
                  View all →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
