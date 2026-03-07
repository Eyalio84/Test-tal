"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { AuthButtons } from "@/components/ui/AuthButtons"
import { CartButton } from "@/components/ui/CartButton"
import { useWishlist } from "@/store/wishlist"
import { THEMES } from "@/lib/theme"

function WishlistButton() {
  const count = useWishlist((s) => s.slugs.length)
  return (
    <Link href="/wishlist" aria-label="Wishlist" className="relative p-1 text-ink/60 hover:text-ink transition">
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-medium">
          {count}
        </span>
      )}
    </Link>
  )
}

const storeNavLinks = [
  { label: "Shop",        href: "/products" },
  { label: "Collections", href: "/collections" },
  { label: "About",       href: "/about" },
  { label: "Contact",     href: "/contact" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const path = usePathname()

  // Context detection
  const isPlatform = path === "/" || path === "/demos" || path.startsWith("/pricing")
  const isDemoMatch = path.match(/^\/demos\/([^/]+)/)
  const isDemo = !!isDemoMatch
  const themeIdFromPath = isDemoMatch?.[1] ?? null
  const isMember = path.startsWith("/dashboard")

  // Demo brand name (static lookup, no Zustand needed)
  const demoBrand = themeIdFromPath ? (THEMES[themeIdFromPath]?.brand.name ?? themeIdFromPath) : ""

  // ── Platform nav ──────────────────────────────────────────────────────────
  if (isPlatform) {
    return (
      <header aria-label="Site header" className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl tracking-wider text-ink">
            STOREKIT
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            <Link href="/demos" className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">
              Demos
            </Link>
            <Link href="/pricing" className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/api/auth/signin"
              className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition hidden md:inline"
            >
              Sign in
            </Link>
            <Link
              href="/demos"
              className="text-xs tracking-widest uppercase bg-stone-900 text-white px-4 py-2 rounded hover:bg-stone-700 transition"
            >
              Start free →
            </Link>
            {/* Burger — mobile only */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="md:hidden p-1 text-ink/70 hover:text-ink transition"
            >
              {mobileOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div id="mobile-menu" role="navigation" aria-label="Mobile navigation" className="md:hidden bg-white border-b border-stone-100 px-6 py-4 flex flex-col gap-4">
            <Link href="/demos" onClick={() => setMobileOpen(false)} className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">Demos</Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">Pricing</Link>
            <Link href="/api/auth/signin" onClick={() => setMobileOpen(false)} className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">Sign in</Link>
          </div>
        )}
      </header>
    )
  }

  // ── Demo nav ──────────────────────────────────────────────────────────────
  if (isDemo && themeIdFromPath) {
    const base = `/demos/${themeIdFromPath}`
    return (
      <header aria-label="Site header" className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={base} className="font-serif text-xl tracking-wider text-ink">
            {demoBrand.toUpperCase()}
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            <Link href={`${base}/products`} className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">Shop</Link>
            <Link href={`${base}/collections`} className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">Collections</Link>
            <Link href={`${base}/about`} className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">About</Link>
          </nav>

          <div className="flex items-center gap-3">
            <WishlistButton />
            <CartButton />
            <Link
              href="/demos"
              className="text-xs tracking-widest uppercase text-ink/50 hover:text-ink transition hidden md:inline"
            >
              ← All demos
            </Link>
            {/* Burger — mobile only */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="md:hidden p-1 text-ink/70 hover:text-ink transition"
            >
              {mobileOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div id="mobile-menu" role="navigation" aria-label="Mobile navigation" className="md:hidden bg-white border-b border-stone-100 px-6 py-4 flex flex-col gap-4">
            <Link href={`${base}/products`} onClick={() => setMobileOpen(false)} className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">Shop</Link>
            <Link href={`${base}/collections`} onClick={() => setMobileOpen(false)} className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">Collections</Link>
            <Link href={`${base}/about`} onClick={() => setMobileOpen(false)} className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">About</Link>
            <Link href="/demos" onClick={() => setMobileOpen(false)} className="text-xs tracking-widest uppercase text-ink/50 hover:text-ink transition">← All demos</Link>
          </div>
        )}
      </header>
    )
  }

  // ── Member nav ────────────────────────────────────────────────────────────
  if (isMember) {
    return (
      <header aria-label="Site header" className="fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="font-serif text-xl tracking-wider text-ink">
            STOREKIT
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">Dashboard</Link>
            <Link href="/dashboard/site" className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">My Site</Link>
            <Link href="/admin/editor" className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">Editor</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => signOut()}
              className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition hidden md:inline"
            >
              Sign out
            </button>
            {/* Burger — mobile only */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="md:hidden p-1 text-ink/70 hover:text-ink transition"
            >
              {mobileOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div id="mobile-menu" role="navigation" aria-label="Mobile navigation" className="md:hidden bg-white border-b border-stone-100 px-6 py-4 flex flex-col gap-4">
            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">Dashboard</Link>
            <Link href="/dashboard/site" onClick={() => setMobileOpen(false)} className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">My Site</Link>
            <Link href="/admin/editor" onClick={() => setMobileOpen(false)} className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition">Editor</Link>
            <button
              onClick={() => { signOut(); setMobileOpen(false) }}
              className="text-left text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition"
            >
              Sign out
            </button>
          </div>
        )}
      </header>
    )
  }

  // ── Default / store nav ───────────────────────────────────────────────────
  return (
    <header aria-label="Site header" className="fixed top-8 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl tracking-wider text-ink">
          {(THEMES[(process.env.NEXT_PUBLIC_THEME ?? "jewelry").toLowerCase()] ?? THEMES["jewelry"])?.brand.name.toUpperCase()}
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
          {storeNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <WishlistButton />
          <CartButton />
          <div className="hidden md:block">
            <AuthButtons />
          </div>
          {/* Burger — mobile only */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="md:hidden p-1 text-ink/70 hover:text-ink transition"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-menu" role="navigation" aria-label="Mobile navigation" className="md:hidden bg-white border-b border-stone-100 px-6 py-4 flex flex-col gap-4">
          {storeNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-xs tracking-widest uppercase text-ink/60 hover:text-ink transition"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-stone-100">
            <AuthButtons />
          </div>
        </div>
      )}
    </header>
  )
}
