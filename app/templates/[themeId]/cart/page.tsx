"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useCart } from "@/store/cart"
import { resolveTheme } from "@/lib/themeImages"
import type { ThemeConfig } from "@/lib/theme"

export default function TemplateCartPage({ params }: { params: Promise<{ themeId: string }> }) {
  const [hydrated, setHydrated] = useState(false)
  const [theme, setTheme] = useState<ThemeConfig | null>(null)
  const [themeId, setThemeId] = useState<string>("")
  const items = useCart((state) => state.items)
  const removeItem = useCart((state) => state.removeItem)
  const updateQuantity = useCart((state) => state.updateQuantity)
  const clearCart = useCart((state) => state.clearCart)

  useEffect(() => {
    const initTheme = async () => {
      const resolvedParams = await params
      setThemeId(resolvedParams.themeId)
      const resolvedTheme = await resolveTheme(resolvedParams.themeId)
      setTheme(resolvedTheme)
      setHydrated(true)
    }
    initTheme()
  }, [params])

  if (!hydrated || !theme || !themeId) {
    return (
      <div className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-ink/50">Loading cart...</p>
        </div>
      </div>
    )
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-ink mb-2">Your Cart</h1>
        <p className="text-sm text-ink/50 mb-8">
          This is a live demo of {theme.brand.name}. Items you add here stay in your browser.
        </p>

        {items.length === 0 ? (
          <div className="border border-stone-200 rounded-lg p-12 text-center">
            <p className="text-ink/60 mb-6">Your cart is empty</p>
            <Link
              href={`/templates/${themeId}/products`}
              className="inline-block text-xs tracking-widest uppercase text-ink/50 hover:text-ink transition border border-current px-4 py-2 hover:bg-ink/5"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="mb-8 border-b border-stone-200 pb-8">
              {items.map((item) => (
                <div key={item.id} className="flex gap-6 mb-8 pb-8 border-b border-stone-100 last:border-b-0 last:mb-0 last:pb-0">
                  {/* Image */}
                  <div className="flex-shrink-0 w-20 h-20 bg-stone-50">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1">
                    <Link
                      href={`/templates/${themeId}/products/${item.slug}`}
                      className="text-sm font-medium text-ink hover:text-ink/70 transition"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-ink/50 mt-1">${item.price.toFixed(2)} each</p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 text-xs text-ink/50 hover:text-ink transition border border-current flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-xs text-ink min-w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 text-xs text-ink/50 hover:text-ink transition border border-current flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Price & Remove */}
                  <div className="flex flex-col items-end gap-3">
                    <p className="font-medium text-ink">${(item.price * item.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-red-600 hover:text-red-700 transition uppercase tracking-widest"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mb-8 pb-8 border-b border-stone-200">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-ink/60">Subtotal</span>
                <span className="text-sm font-medium text-ink">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink/60">Shipping (demo)</span>
                <span className="text-sm text-ink/60">—</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 mb-8">
              <button
                onClick={clearCart}
                className="w-full text-xs tracking-widest uppercase text-ink/50 hover:text-ink/70 transition border border-current py-2"
              >
                Clear Cart
              </button>
              <Link
                href={`/templates/${themeId}/products`}
                className="block text-center text-xs tracking-widest uppercase text-ink/50 hover:text-ink transition border border-current px-4 py-2 hover:bg-ink/5"
              >
                Continue Shopping
              </Link>
            </div>

            {/* Demo CTA */}
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-8 text-center">
              <h2 className="font-serif text-xl text-ink mb-2">Like what you see?</h2>
              <p className="text-sm text-ink/60 mb-6">
                This is a live demo of {theme.brand.name}. Create your own store to start selling online.
              </p>
              <Link
                href="/pricing"
                className="inline-block text-xs tracking-widest uppercase text-white bg-ink hover:bg-ink/90 transition px-6 py-3 rounded"
              >
                Create Your Store
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
