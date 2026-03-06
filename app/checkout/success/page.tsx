import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Order Confirmed" }

export default function CheckoutSuccessPage() {
  return (
    <div className="pt-32 pb-20 min-h-screen">
      <div className="max-w-lg mx-auto px-6 text-center">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-ink"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="font-serif text-3xl text-ink mb-3">Thank you for your order</h1>
        <p className="text-sm text-ink/50 mb-8 leading-relaxed">
          Your order has been confirmed. You&apos;ll receive an email confirmation shortly.
          Each piece is carefully prepared and shipped within 3&ndash;5 business days.
        </p>

        <Link
          href="/products"
          className="text-xs tracking-widest uppercase border border-ink px-8 py-3 hover:bg-ink hover:text-white transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
