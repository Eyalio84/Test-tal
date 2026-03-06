"use client"

import { useCart } from "@/store/cart"

export function CartButton() {
  const { openCart, totalItems } = useCart()
  const count = totalItems()

  return (
    <button
      onClick={openCart}
      className="relative p-1 text-ink/70 hover:text-ink transition"
      aria-label="Open cart"
    >
      {/* Shopping bag icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
        />
      </svg>

      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  )
}
