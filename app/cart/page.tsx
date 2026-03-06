import type { Metadata } from "next"
import { CartContents } from "@/components/cart/CartContents"

export const metadata: Metadata = { title: "Cart" }

export default function CartPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-ink mb-10">Your Cart</h1>
        <CartContents />
      </div>
    </div>
  )
}
