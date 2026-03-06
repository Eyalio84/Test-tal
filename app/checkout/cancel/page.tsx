import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Checkout Cancelled" }

export default function CheckoutCancelPage() {
  return (
    <div className="pt-32 pb-20 min-h-screen">
      <div className="max-w-lg mx-auto px-6 text-center">
        <h1 className="font-serif text-3xl text-ink mb-3">Checkout cancelled</h1>
        <p className="text-sm text-ink/50 mb-8 leading-relaxed">
          No worries — your cart is saved. Pick up where you left off.
        </p>
        <Link
          href="/cart"
          className="text-xs tracking-widest uppercase border border-ink px-8 py-3 hover:bg-ink hover:text-white transition"
        >
          Return to Cart
        </Link>
      </div>
    </div>
  )
}
