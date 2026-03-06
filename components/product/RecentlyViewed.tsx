"use client"

import Link from "next/link"
import Image from "next/image"
import { useRecentlyViewed } from "@/store/recentlyViewed"

interface Props { currentSlug: string }

export function RecentlyViewed({ currentSlug }: Props) {
  const items = useRecentlyViewed((s) => s.items).filter((i) => i.slug !== currentSlug)
  if (items.length === 0) return null

  return (
    <section className="mt-20 pt-12 border-t border-stone-100">
      <h2 className="font-serif text-xl text-ink mb-6">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/products/${item.slug}`}
            className="snap-start flex-shrink-0 w-36 group"
          >
            <div className="aspect-square bg-stone-100 overflow-hidden mb-2 relative">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                  sizes="144px"
                />
              ) : (
                <div className="w-full h-full bg-stone-200" />
              )}
            </div>
            <p className="text-xs text-ink/70 leading-tight line-clamp-2">{item.name}</p>
            <p className="text-xs text-ink/50 mt-0.5">${item.price.toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
