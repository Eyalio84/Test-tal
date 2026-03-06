"use client"

import { useState } from "react"
import Link from "next/link"
import { AuthButtons } from "@/components/ui/AuthButtons"
import { CartButton } from "@/components/ui/CartButton"

const navLinks = [
  { label: "Shop",        href: "/products" },
  { label: "Collections", href: "/collections" },
  { label: "About",       href: "/about" },
  { label: "Contact",     href: "/contact" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-xl tracking-wider text-ink">
          STORE
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
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
          <CartButton />
          <div className="hidden md:block">
            <AuthButtons />
          </div>
          {/* Burger — mobile only */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-1 text-ink/70 hover:text-ink transition"
            aria-label="Toggle menu"
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
        <div className="md:hidden bg-white border-b border-stone-100 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
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
