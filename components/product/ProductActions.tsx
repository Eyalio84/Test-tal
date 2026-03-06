"use client"

import { useEffect } from "react"
import toast from "react-hot-toast"
import { useCart } from "@/store/cart"
import { useRecentlyViewed } from "@/store/recentlyViewed"

interface ProductActionsProps {
  id: string
  name: string
  price: number
  image: string
  slug: string
  inStock: boolean
  stockCount: number | null
  whatsappNumber?: string
}

export function ProductActions({
  id, name, price, image, slug, inStock, stockCount, whatsappNumber,
}: ProductActionsProps) {
  const addItem  = useCart((s) => s.addItem)
  const addRecent = useRecentlyViewed((s) => s.add)

  useEffect(() => {
    // Track recently viewed
    addRecent({ id, name, slug, price, image, category: null })
    // Inject product context for Aria voice narration (Task 8)
    document.body.dataset.productSlug  = slug
    document.body.dataset.productName  = name
    document.body.dataset.productPrice = String(price)
    return () => {
      delete document.body.dataset.productSlug
      delete document.body.dataset.productName
      delete document.body.dataset.productPrice
    }
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAddToCart() {
    addItem({ id, name, price, image, slug })
    toast.success(`${name} added to cart`)
  }

  const waText = encodeURIComponent(`Hi, I'm interested in the ${name}`)
  const waHref = `https://wa.me/${whatsappNumber}?text=${waText}`

  return (
    <div className="flex flex-col gap-4">
      {/* Stock urgency signal */}
      {inStock && stockCount !== null && stockCount <= 5 && (
        <p role="status" className="text-xs tracking-widest uppercase text-amber-600">
          Only {stockCount} left in stock
        </p>
      )}

      {/* Add to cart */}
      <button
        onClick={handleAddToCart}
        disabled={!inStock}
        aria-label={inStock ? `Add ${name} to cart` : `${name} is out of stock`}
        className="w-full bg-ink text-white py-4 text-xs tracking-widest uppercase hover:bg-ink/80 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {inStock ? "Add to Cart" : "Out of Stock"}
      </button>

      {/* WhatsApp CTA */}
      {whatsappNumber && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ask about ${name} on WhatsApp`}
          className="w-full border border-stone-200 py-3.5 text-xs tracking-widest uppercase text-ink/60 hover:border-ink hover:text-ink transition text-center flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
               className="w-3.5 h-3.5" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Ask about this piece
        </a>
      )}
    </div>
  )
}
