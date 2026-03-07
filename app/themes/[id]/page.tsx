import type { Metadata } from "next"
import Image from "next/image"
import Link  from "next/link"
import { notFound } from "next/navigation"
import { THEMES } from "@/lib/theme"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return Object.keys(THEMES).map((id) => ({ id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const theme = THEMES[id]
  if (!theme) return {}
  return { title: `${theme.brand.name} Theme Preview` }
}

export default async function ThemePreviewPage({ params }: Props) {
  const { id } = await params
  const theme = THEMES[id]
  if (!theme) notFound()

  const { brand, hero, about, aria: ariaConfig, products, collections, colors } = theme

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">

        {/* Back */}
        <Link href="/themes" className="text-xs text-ink/40 hover:text-ink/60 transition mb-8 inline-block">
          ← All themes
        </Link>

        {/* Hero card */}
        <div className="relative h-64 md:h-80 overflow-hidden rounded-xl mb-10">
          <Image src={hero.image} alt={brand.name} fill className="object-cover opacity-70" />
          <div
            className="absolute inset-0 opacity-50"
            style={{ background: `linear-gradient(135deg, ${colors.accentDark}, transparent)` }}
          />
          <div className="absolute inset-0 flex flex-col justify-end p-8">
            <h1 className="font-serif text-4xl text-white mb-1">{brand.name}</h1>
            <p className="text-white/70 text-sm">{brand.tagline}</p>
          </div>
        </div>

        {/* Two-col layout */}
        <div className="grid md:grid-cols-2 gap-10 mb-12">

          {/* Brand & Aria */}
          <div>
            <h2 className="font-serif text-xl text-ink mb-4">Aria Voice Assistant</h2>
            <div className="bg-stone-50 rounded-lg p-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/50">Name</span>
                <span className="font-medium text-ink">{ariaConfig.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/50">Voice</span>
                <span className="font-medium text-ink">{ariaConfig.voice}</span>
              </div>
              <div className="pt-2 border-t border-stone-200">
                <span className="text-ink/50 block mb-1">Personality</span>
                <span className="text-ink/80 leading-snug">{ariaConfig.personality}</span>
              </div>
            </div>

            <h2 className="font-serif text-xl text-ink mt-8 mb-4">Color Palette</h2>
            <div className="flex gap-3">
              {[colors.accentDark, colors.accent, colors.accentLight, colors.background].map((c) => (
                <div key={c} className="flex-1">
                  <div className="h-10 rounded border border-stone-200" style={{ background: c }} />
                  <p className="text-xs text-ink/40 mt-1 text-center truncate">{c}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Story */}
          <div>
            <h2 className="font-serif text-xl text-ink mb-4">Brand Story</h2>
            <p className="text-ink/70 text-sm leading-relaxed">{about.story}</p>

            <h2 className="font-serif text-xl text-ink mt-8 mb-4">Values</h2>
            <ul className="space-y-3">
              {about.values.map((v) => (
                <li key={v.title}>
                  <span className="font-medium text-sm text-ink">{v.title}</span>
                  <p className="text-xs text-ink/50 leading-snug">{v.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Collections */}
        <h2 className="font-serif text-xl text-ink mb-4">Collections ({collections.length})</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-12">
          {collections.map((c) => (
            <div key={c.slug} className="relative h-20 overflow-hidden rounded">
              <Image src={c.image} alt={c.name} fill className="object-cover opacity-80" />
              <div className="absolute inset-0 bg-ink/30 flex items-end p-2">
                <span className="text-white text-xs font-medium leading-none">{c.name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Products sample */}
        <h2 className="font-serif text-xl text-ink mb-4">Products ({products.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.slice(0, 4).map((p) => (
            <div key={p.slug} className="bg-white border border-stone-100 p-4">
              <div className="relative h-24 mb-3 overflow-hidden bg-stone-50">
                <Image src={p.image} alt={p.name} fill className="object-cover opacity-70" />
              </div>
              <p className="text-sm font-medium text-ink leading-tight">{p.name}</p>
              <p className="text-xs text-ink/40 mt-0.5">{p.category}</p>
              <p className="text-sm font-medium mt-1" style={{ color: colors.accent }}>${p.price.toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Activate CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/admin/themes"
            className="inline-block px-8 py-3 text-white text-sm font-medium rounded transition hover:opacity-90"
            style={{ background: colors.accent }}
          >
            Activate this theme →
          </Link>
        </div>

      </div>
    </div>
  )
}
