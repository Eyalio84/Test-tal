import { notFound } from "next/navigation"
import Image from "next/image"
import { THEMES } from "@/lib/theme"

export async function generateStaticParams() {
  return Object.keys(THEMES).map((id) => ({ themeId: id }))
}

export default async function DemoCollectionsPage({ params }: { params: Promise<{ themeId: string }> }) {
  const { themeId } = await params
  const theme = THEMES[themeId]
  if (!theme) notFound()

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-ink mb-3">Collections</h1>
        <p className="text-ink/50 text-sm mb-10">{theme.brand.name} — demo store</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {theme.collections.map((collection) => (
            <div key={collection.slug} className="group relative overflow-hidden">
              <div className="relative h-64">
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition" />
                <div className="absolute inset-0 flex items-end p-6">
                  <p className="font-serif text-white text-xl">{collection.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
