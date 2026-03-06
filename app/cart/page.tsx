"use client"

import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/store/cart"

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart()

  if (items.length === 0) {
    return (
      <div className="pt-16 min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="font-serif text-2xl text-ink">Your cart is empty</p>
        <p className="text-sm text-ink/50">Add some beautiful pieces to get started.</p>
        <Link
          href="/products"
          className="text-xs tracking-widest uppercase border border-ink px-6 py-2.5 hover:bg-ink hover:text-white transition"
        >
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-ink mb-10">Your Cart</h1>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Items */}
          <div className="lg:col-span-2">
            <ul className="divide-y divide-stone-100">
              {items.map((item) => (
                <li key={item.id} className="py-6 flex gap-5">
                  <div className="relative w-20 h-20 bg-stone-100 flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full bg-stone-200" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-serif text-base text-ink">{item.name}</p>
                    <p className="text-sm text-ink/50 mt-1">${item.price.toFixed(2)}</p>

                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 border border-stone-200 flex items-center justify-center text-ink/60 hover:text-ink hover:border-ink transition"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 border border-stone-200 flex items-center justify-center text-ink/60 hover:text-ink hover:border-ink transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <span className="text-sm text-ink font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-stone-300 hover:text-ink transition text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="border border-stone-100 p-6">
              <h2 className="font-serif text-lg text-ink mb-5">Order Summary</h2>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-ink/60">Subtotal</span>
                <span className="text-ink">${totalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-6 pb-5 border-b border-stone-100">
                <span className="text-ink/60">Shipping</span>
                <span className="text-ink/40 text-xs">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-base font-medium mb-6">
                <span className="text-ink">Total</span>
                <span className="text-ink">${totalPrice().toFixed(2)}</span>
              </div>

              <button
                disabled
                title="Stripe checkout coming in Day 5"
                className="w-full bg-ink text-white py-3 text-xs tracking-widest uppercase opacity-50 cursor-not-allowed"
              >
                Proceed to Checkout
              </button>
              <p className="text-center text-xs text-ink/30 mt-3">Stripe integration coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
