"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/store/cart"
import type { ThemeProduct } from "@/lib/theme"

interface TemplateAddToCartProps {
  product: ThemeProduct
  themeId: string
  onAdded?: () => void
}

export function TemplateAddToCart({ product, themeId, onAdded }: TemplateAddToCartProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const addItem = useCart((state) => state.addItem)
  const openCart = useCart((state) => state.openCart)

  const handleAdd = () => {
    addItem({
      id: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      slug: product.slug,
    })
    setShowConfirm(true)
    onAdded?.()
    setTimeout(() => setShowConfirm(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleAdd}
        className="text-[10px] tracking-widest uppercase text-ink/50 hover:text-ink transition border border-current px-3 py-2 hover:bg-ink/5"
      >
        {showConfirm ? "✓ Added to cart" : "Add to cart"}
      </button>
      {showConfirm && (
        <Link
          href={`/templates/${themeId}/cart`}
          className="text-[10px] tracking-widest uppercase text-ink/60 hover:text-ink transition border border-current px-3 py-2 text-center hover:bg-ink/5"
        >
          View cart
        </Link>
      )}
    </div>
  )
}
