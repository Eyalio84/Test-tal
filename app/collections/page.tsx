import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { getActiveTheme } from "@/lib/getActiveTheme"

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getActiveTheme()
  return { title: `Collections | ${theme.brand.name}` }
}

export default async function CollectionsPage() {
  const theme = await getActiveTheme()
  const { collections, brand } = theme

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-3xl text-ink mb-2">Collections</h1>
          <p className="text-ink/50 text-sm">Explore {brand.name}&apos;s curated categories</p>
        </div>

        {collections.length === 0 ? (
          <p className="text-center text-ink/40 py-16">No collections yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((col) => (
              <Link
                key={col.slug}
                href={`/products?category=${col.slug}`}
                className="group relative h-72 overflow-hidden block"
              >
                <Image
                  src={col.image}
                  alt={col.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-ink/30 group-hover:bg-ink/40 transition" />
                <div className="absolute inset-0 flex items-end p-6 justify-between">
                  <span className="font-serif text-white text-xl">{col.name}</span>
                  <span className="text-white/70 text-xl group-hover:translate-x-1 transition">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
