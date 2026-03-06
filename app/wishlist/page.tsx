"use client"

import { useWishlist } from "@/store/wishlist"
import { useEffect, useState } from "react"
import { ProductCard } from "@/components/product/ProductCard"
import Link from "next/link"

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: string
  category: string | null
  inStock: boolean
  stockCount: number | null
}

export default function WishlistPage() {
  const slugs = useWishlist((s) => s.slugs)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = "Wishlist | Store"
    if (slugs.length === 0) { setLoading(false); return }
    setLoading(true)
    Promise.all(slugs.map((slug) => fetch(`/api/product/${slug}`).then((r) => r.json())))
      .then((results) => setProducts(results.filter((p) => p?.id)))
      .finally(() => setLoading(false))
  }, [slugs])

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-ink mb-10">Your Wishlist</h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-stone-100 rounded" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-ink/40 text-sm mb-6">Your wishlist is empty.</p>
            <Link
              href="/products"
              className="text-xs tracking-widest uppercase border border-ink px-5 py-2.5 hover:bg-ink hover:text-white transition"
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} {...p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
