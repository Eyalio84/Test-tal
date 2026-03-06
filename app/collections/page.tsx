import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Collections",
}

const collections = [
  {
    name: "Rings",
    category: "Rings",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
  },
  {
    name: "Necklaces",
    category: "Necklaces",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
  },
  {
    name: "Earrings",
    category: "Earrings",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
  },
  {
    name: "Bracelets",
    category: "Bracelets",
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
  },
  {
    name: "Pendants",
    category: "Pendants",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
  },
]

export default function CollectionsPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-3xl text-ink mb-2">Collections</h1>
          <p className="text-ink/50 text-sm">Explore our curated jewelry families</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <Link
              key={col.name}
              href={`/products?category=${col.category}`}
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
      </div>
    </div>
  )
}
