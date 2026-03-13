"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useShell } from "@/store/shell"
import { CartButton } from "@/components/ui/CartButton"
import { THEMES } from "@/lib/theme"

function BurgerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

export function TopBar() {
  const toggleDrawer = useShell((s) => s.toggleDrawer)
  const path = usePathname()

  // Determine brand name from context
  const templateMatch = path.match(/^\/templates\/([^/]+)/)
  const themeId = templateMatch?.[1]
  const brandName = themeId
    ? (THEMES[themeId]?.brand.name.toUpperCase() ?? "STOREKIT")
    : "STOREKIT"

  // Show cart on store/template pages
  const showCart = !!themeId || path.startsWith("/products") || path.startsWith("/collections")

  return (
    <header
      aria-label="Site header"
      className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-100"
    >
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href={themeId ? `/templates/${themeId}` : "/"} className="font-serif text-lg tracking-wider text-ink">
          {brandName}
        </Link>

        <div className="flex items-center gap-2">
          {showCart && <CartButton />}
          <button
            onClick={toggleDrawer}
            aria-label="Open menu"
            className="p-2 text-ink/70 hover:text-ink transition"
          >
            <BurgerIcon />
          </button>
        </div>
      </div>
    </header>
  )
}
