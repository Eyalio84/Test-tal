"use client"

import Image from "next/image"
import Link from "next/link"
import toast from "react-hot-toast"
import { useCart } from "@/store/cart"
import { useWishlist } from "@/store/wishlist"

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  images: string
  category?: string | null
  inStock: boolean
  stockCount?: number | null
}

// Derive the voice trigger phrase from the slug (all words except last = category)
// e.g. "gold-bracelet-set" → "Gold Bracelet"
function getVoiceTrigger(slug: string): string {
  const words = slug.split("-").slice(0, -1)
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

// Renders the product name with the trigger phrase bolded
function VoiceName({ name, slug }: { name: string; slug: string }) {
  const trigger = getVoiceTrigger(slug)
  const idx = name.toLowerCase().indexOf(trigger.toLowerCase())
  if (idx === -1) return <h3 className="font-serif text-ink text-base leading-tight">{name}</h3>

  return (
    <h3 className="font-serif text-ink text-base leading-tight" title={`Say: "${trigger}"`}>
      <strong className="font-bold">{name.slice(0, idx + trigger.length)}</strong>
      {name.slice(idx + trigger.length)}
    </h3>
  )
}

export function ProductCard({ id, name, slug, price, images, category, inStock, stockCount }: ProductCardProps) {
  const addItem    = useCart((s) => s.addItem)
  const isWished   = useWishlist((s) => s.isWished(slug))
  const toggleWish = useWishlist((s) => s.toggle)

  const imageUrl = (() => {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) && parsed[0] ? parsed[0] : null
    } catch {
      return null
    }
  })()

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem({ id, name, price, image: imageUrl ?? "", slug })
    toast.success(`${name} added to cart`)
  }

  return (
    <Link href={`/products/${slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-stone-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-stone-200 flex items-center justify-center">
            <span className="text-stone-400 text-xs">No image</span>
          </div>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs tracking-widest uppercase text-ink/60">Out of Stock</span>
          </div>
        )}

        {stockCount !== null && stockCount !== undefined && stockCount <= 5 && inStock && (
          <span className="absolute bottom-3 left-3 bg-amber-50 text-amber-700 px-2 py-1 text-xs">
            Only {stockCount} left
          </span>
        )}

        {category && (
          <span className="absolute top-3 left-3 bg-white/90 px-2 py-1 text-xs tracking-widest uppercase text-ink/70">
            {category}
          </span>
        )}

        <button
          onClick={(e) => { e.preventDefault(); toggleWish(slug) }}
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white transition"
        >
          <svg viewBox="0 0 24 24" className={`w-4 h-4 transition ${isWished ? "fill-rose-500 stroke-rose-500" : "fill-none stroke-ink"}`} strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </button>
      </div>

      <div className="pt-3 pb-1">
        <VoiceName name={name} slug={slug} />

        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-ink/70">${price.toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="text-xs tracking-widest uppercase px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  )
}
