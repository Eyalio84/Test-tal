"use client"

import { useCart } from "@/store/cart"

export function LiveRegion() {
  const announcement = useCart((s) => s.announcement)

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}
