"use client"

import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/store/cart"

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCart()

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <h2 className="font-serif text-lg text-ink">Your Cart</h2>
          <button
            onClick={closeCart}
            className="text-ink/40 hover:text-ink transition text-2xl leading-none"
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-ink/50 text-sm">Your cart is empty.</p>
              <Link
                href="/products"
                onClick={closeCart}
                className="text-xs tracking-widest uppercase border border-ink px-4 py-2 hover:bg-ink hover:text-white transition"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {items.map((item) => (
                <li key={item.id} className="py-4 flex gap-4">
                  <div className="relative w-16 h-16 bg-stone-100 flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="w-full h-full bg-stone-200" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-ink truncate">{item.name}</p>
                    <p className="text-xs text-ink/60 mt-0.5">${item.price.toFixed(2)}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 border border-stone-200 text-ink/60 hover:text-ink flex items-center justify-center text-sm"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="text-sm w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 border border-stone-200 text-ink/60 hover:text-ink flex items-center justify-center text-sm"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-stone-300 hover:text-ink transition text-xl leading-none self-start mt-0.5"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-stone-100">
            <div className="flex justify-between text-sm mb-4">
              <span className="text-ink/60">Subtotal</span>
              <span className="font-medium text-ink">${totalPrice().toFixed(2)}</span>
            </div>
            <button
              disabled
              className="w-full bg-ink text-white py-3 text-xs tracking-widest uppercase opacity-50 cursor-not-allowed"
            >
              Checkout — Coming Soon
            </button>
          </div>
        )}
      </div>
    </>
  )
}
