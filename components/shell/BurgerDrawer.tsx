"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useShell } from "@/store/shell"

// ── Icons ──────────────────────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

// ── Accordion section ──────────────────────────────────────────────────────
function DrawerSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-xs tracking-[0.2em] uppercase text-white/60 hover:text-white transition"
      >
        {title}
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="px-6 pb-4 flex flex-col gap-1">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Link item ──────────────────────────────────────────────────────────────
function DrawerLink({
  href,
  children,
  onClose,
}: {
  href: string
  children: React.ReactNode
  onClose: () => void
}) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href))

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`block py-2.5 px-3 rounded-lg text-sm transition ${
        isActive
          ? "text-white bg-white/10 font-medium"
          : "text-white/80 hover:text-white hover:bg-white/5"
      }`}
    >
      {children}
    </Link>
  )
}

// ── BurgerDrawer ───────────────────────────────────────────────────────────
export function BurgerDrawer() {
  const drawerOpen = useShell((s) => s.drawerOpen)
  const setDrawerOpen = useShell((s) => s.setDrawerOpen)
  const { data: session } = useSession()
  const isOwner = !!session?.user

  const close = useCallback(() => setDrawerOpen(false), [setDrawerOpen])

  // Close on Escape
  useEffect(() => {
    if (!drawerOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [drawerOpen, close])

  // Prevent body scroll when open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [drawerOpen])

  if (!drawerOpen) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation menu">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Drawer panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-stone-950 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <span className="font-serif text-lg tracking-wider text-white">
            STOREKIT
          </span>
          <button
            onClick={close}
            aria-label="Close menu"
            className="p-1 text-white/60 hover:text-white transition"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Sections */}
        <nav>
          {/* Pages — owner only */}
          {isOwner && (
            <DrawerSection title="Pages" defaultOpen>
              <DrawerLink href="/pages" onClose={close}>Manage Pages</DrawerLink>
              <DrawerLink href="/pages?new=1" onClose={close}>+ New Page</DrawerLink>
            </DrawerSection>
          )}

          {/* Editor — owner only */}
          {isOwner && (
            <DrawerSection title="Editor">
              <DrawerLink href="/admin/editor" onClose={close}>Media Library</DrawerLink>
              <DrawerLink href="/admin/components" onClose={close}>Components</DrawerLink>
              <DrawerLink href="/admin/image-scout" onClose={close}>Image Scout</DrawerLink>
            </DrawerSection>
          )}

          {/* Settings — owner only */}
          {isOwner && (
            <DrawerSection title="Settings">
              <DrawerLink href="/admin/themes" onClose={close}>Theme Switcher</DrawerLink>
              <DrawerLink href="/dashboard/site" onClose={close}>Site Settings</DrawerLink>
            </DrawerSection>
          )}

          {/* Store — always visible */}
          <DrawerSection title="Store" defaultOpen={!isOwner}>
            <DrawerLink href="/products" onClose={close}>Shop</DrawerLink>
            <DrawerLink href="/collections" onClose={close}>Collections</DrawerLink>
            <DrawerLink href="/about" onClose={close}>About</DrawerLink>
            <DrawerLink href="/contact" onClose={close}>Contact</DrawerLink>
          </DrawerSection>

          {/* Account */}
          <DrawerSection title="Account">
            {isOwner ? (
              <>
                <DrawerLink href="/dashboard" onClose={close}>Dashboard</DrawerLink>
                <DrawerLink href="/templates" onClose={close}>Templates</DrawerLink>
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); close() }}
                  className="block w-full text-left py-2.5 px-3 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/5 transition"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <DrawerLink href="/api/auth/signin" onClose={close}>Sign in</DrawerLink>
                <DrawerLink href="/templates" onClose={close}>Start free</DrawerLink>
              </>
            )}
          </DrawerSection>
        </nav>
      </div>
    </div>
  )
}
