import { notFound } from "next/navigation"
import Image from "next/image"
import { THEMES } from "@/lib/theme"

export async function generateStaticParams() {
  return Object.keys(THEMES).map((id) => ({ themeId: id }))
}

export default async function DemoProductsPage({ params }: { params: Promise<{ themeId: string }> }) {
  const { themeId } = await params
  const theme = THEMES[themeId]
  if (!theme) notFound()

  const categories = ["All", ...Array.from(new Set(theme.products.map((p) => p.category)))]

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-ink mb-3">Shop</h1>
        <p className="text-ink/50 text-sm mb-8">{theme.brand.name} — demo store</p>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-3 mb-10">
          {categories.map((cat) => (
            <span key={cat} className="text-xs tracking-widest uppercase px-4 py-1.5 border border-stone-200 text-ink/60">
              {cat}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {theme.products.map((product) => (
            <div key={product.slug} className="group">
              <div className="relative h-56 overflow-hidden mb-3 bg-stone-50">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <p className="text-xs text-ink/40 uppercase tracking-wider mb-1">{product.category}</p>
              <p className="text-ink text-sm font-medium">{product.name}</p>
              <p className="text-ink/60 text-xs mt-0.5 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-ink font-medium text-sm">${product.price.toFixed(2)}</p>
                <button className="text-[10px] tracking-widest uppercase text-ink/50 hover:text-ink transition border border-current px-2 py-1">
                  Add to demo cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
