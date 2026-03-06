# Day 3: Product Detail Page + Accessibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the `/products/[slug]` detail page with editorial layout, image gallery, JSON-LD, OG tags, cart enhancements, and full WCAG 2.1 AA accessibility compliance across the entire site.

**Architecture:** Product detail is a server component with `generateMetadata` for per-product OG/SEO, with client islands (`ProductGallery`, `ProductActions`) for interactivity. Accessibility is layered site-wide via a SkipLink, ARIA live region, focus trap, and CSS `prefers-reduced-motion`. Gap fixes extract client logic from page files so server metadata exports can work.

**Tech Stack:** Next.js 16 App Router, Prisma v5 SQLite, Zustand v5, Tailwind v4, TypeScript

---

## Files Created Today

```
app/
  products/[slug]/page.tsx          <- product detail (server, metadata, JSON-LD)
components/
  product/
    ProductGallery.tsx              <- image gallery + zoom (client)
    ProductActions.tsx              <- Add to Cart + WhatsApp CTA (client)
    RelatedProducts.tsx             <- related products grid (server)
    JsonLd.tsx                      <- JSON-LD structured data (server, sanitized)
  contact/
    ContactForm.tsx                 <- extracted "use client" form
  cart/
    CartContents.tsx                <- extracted "use client" cart page
  ui/
    SkipLink.tsx                    <- accessibility skip-to-main link
    LiveRegion.tsx                  <- ARIA live region for cart announcements
```

## Files Modified Today

```
prisma/schema.prisma                <- add stockCount to Product
prisma/seed.ts                      <- seed stockCount on some products
store/cart.ts                       <- add giftNote + announcement fields
app/contact/page.tsx                <- server wrapper (exports metadata) + ContactForm
app/cart/page.tsx                   <- server wrapper (exports metadata) + CartContents
app/layout.tsx                      <- SkipLink + id="main-content" + LiveRegion
app/globals.css                     <- focus-visible ring, prefers-reduced-motion
components/layout/Navbar.tsx        <- aria-expanded, aria-label on nav
components/ui/CartButton.tsx        <- aria-label with item count
components/ui/CartDrawer.tsx        <- focus trap + role="dialog"
components/product/ProductCard.tsx  <- "Only X left" badge
app/products/page.tsx               <- pass stockCount to ProductCard
```

---

## BLOCK 1: Schema + Gap Fixes (~25 min)

### Task 1 -- Add stockCount to Product schema

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`

**Step 1: Add `stockCount` field to Product model**

In `prisma/schema.prisma`, add after `inStock`:
```prisma
model Product {
  id            String      @id @default(cuid())
  name          String
  slug          String      @unique
  description   String?
  price         Float
  images        String      @default("[]")
  category      String?
  inStock       Boolean     @default(true)
  stockCount    Int?                           // null = unlimited stock
  stripePriceId String?
  orderItems    OrderItem[]
  createdAt     DateTime    @default(now())
}
```

**Step 2: Push schema + regenerate client**
```bash
cd /root/tal-boilerplate
node_modules/.bin/prisma db push
```
Expected: `Your database is now in sync`

**Step 3: Update seed with stockCount on 3 products**

In `prisma/seed.ts`, add `stockCount` to these products (others stay null):
```typescript
{ slug: "sapphire-statement-ring",   ..., stockCount: 2  },
{ slug: "diamond-solitaire-pendant", ..., stockCount: 3  },
{ slug: "emerald-stud-earrings",     ..., stockCount: 1  },
```

**Step 4: Re-run seed**
```bash
node_modules/.bin/tsx prisma/seed.ts
```
Expected: all 8 products seeded, 3 have stockCount

**Step 5: Commit**
```bash
git add prisma/schema.prisma prisma/seed.ts
git commit -m "feat: add stockCount to Product schema"
```

---

### Task 2 -- Fix contact page metadata (extract client form)

**Problem:** `app/contact/page.tsx` is `"use client"` so Next.js cannot export `metadata` from
it. Browser tab and Google search show a blank title.

**Fix pattern:** server page exports `metadata` + renders a client child component.

**Files:**
- Create: `components/contact/ContactForm.tsx`
- Modify: `app/contact/page.tsx`

**Step 1: Create `components/contact/ContactForm.tsx`**

Move all `useState`, `handleSubmit`, and `toast` logic from `app/contact/page.tsx` into this
file. The component renders only the 2-column grid (form left + info panel right):

```typescript
"use client"

import { useState } from "react"
import toast from "react-hot-toast"

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Message sent! We'll be in touch soon.")
        setForm({ name: "", email: "", subject: "", message: "" })
      } else {
        toast.error(data.error ?? "Something went wrong.")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-16">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label htmlFor="contact-name" className="block text-xs tracking-widest uppercase text-ink/50 mb-1.5">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-stone-200 px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-xs tracking-widest uppercase text-ink/50 mb-1.5">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full border border-stone-200 px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="contact-subject" className="block text-xs tracking-widest uppercase text-ink/50 mb-1.5">
            Subject
          </label>
          <select
            id="contact-subject"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            className="w-full border border-stone-200 px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition bg-white"
          >
            <option value="">Select a subject</option>
            <option value="order">Order inquiry</option>
            <option value="product">Product question</option>
            <option value="custom">Custom order</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="contact-message" className="block text-xs tracking-widest uppercase text-ink/50 mb-1.5">
            Message
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full border border-stone-200 px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition resize-none"
            placeholder="How can we help?"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-ink text-white py-3 text-xs tracking-widest uppercase hover:bg-ink/80 transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>

      <div className="flex flex-col gap-8 text-sm text-ink/60">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink/40 mb-2">Address</p>
          <p>14 Artisan Lane</p>
          <p>Tel Aviv, 6100001</p>
          <p>Israel</p>
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-ink/40 mb-2">Email</p>
          <a href="mailto:hello@store.com" className="hover:text-ink transition">hello@store.com</a>
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-ink/40 mb-2">Phone</p>
          <p>+972 50 123 4567</p>
        </div>
        <div>
          <p className="text-xs tracking-widest uppercase text-ink/40 mb-2">Hours</p>
          <p>Monday - Friday: 9am - 6pm</p>
          <p>Saturday: 10am - 4pm</p>
          <p>Sunday: Closed</p>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Rewrite `app/contact/page.tsx` as server component**

```typescript
import type { Metadata } from "next"
import { ContactForm } from "@/components/contact/ContactForm"

export const metadata: Metadata = { title: "Contact" }

export default function ContactPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-ink mb-2">Get in touch</h1>
        <p className="text-ink/50 text-sm mb-12">
          We&apos;d love to hear from you.
        </p>
        <ContactForm />
      </div>
    </div>
  )
}
```

**Step 3: Verify**
```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/contact
```
Expected: `200`

---

### Task 3 -- Fix cart page metadata + add gift note

**Files:**
- Create: `components/cart/CartContents.tsx`
- Modify: `app/cart/page.tsx`
- Modify: `store/cart.ts`

**Step 1: Create `components/cart/CartContents.tsx`**

Move all `"use client"` logic from `app/cart/page.tsx` here. Add gift note textarea below
the item list. Reads `giftNote` / `setGiftNote` from Zustand.

```typescript
"use client"

import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/store/cart"

export function CartContents() {
  const { items, removeItem, updateQuantity, totalPrice, giftNote, setGiftNote } = useCart()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
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
    <div className="grid lg:grid-cols-3 gap-12">
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
                    aria-label={`Decrease quantity of ${item.name}`}
                    className="w-7 h-7 border border-stone-200 flex items-center justify-center text-ink/60 hover:text-ink hover:border-ink transition"
                  >-</button>
                  <span className="w-5 text-center text-sm" aria-label={`Quantity: ${item.quantity}`}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label={`Increase quantity of ${item.name}`}
                    className="w-7 h-7 border border-stone-200 flex items-center justify-center text-ink/60 hover:text-ink hover:border-ink transition"
                  >+</button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <span className="text-sm text-ink font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name} from cart`}
                  className="text-stone-300 hover:text-ink transition text-sm"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Gift note */}
        <div className="mt-6 pt-6 border-t border-stone-100">
          <label
            htmlFor="gift-note"
            className="block text-xs tracking-widest uppercase text-ink/50 mb-2"
          >
            Gift message / engraving note
          </label>
          <textarea
            id="gift-note"
            rows={3}
            value={giftNote}
            onChange={(e) => setGiftNote(e.target.value)}
            placeholder="Add a personal message or engraving instruction..."
            className="w-full border border-stone-200 px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition resize-none"
          />
        </div>
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
            aria-disabled="true"
            aria-describedby="checkout-note"
            className="w-full bg-ink text-white py-3 text-xs tracking-widest uppercase opacity-50 cursor-not-allowed"
          >
            Proceed to Checkout
          </button>
          <p id="checkout-note" className="text-center text-xs text-ink/30 mt-3">
            Stripe integration coming in Day 4
          </p>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Rewrite `app/cart/page.tsx`**

```typescript
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
```

**Step 3: Add `giftNote` to `store/cart.ts`**

```typescript
// Add to CartStore interface:
giftNote: string
setGiftNote: (note: string) => void

// Add to implementation (set):
giftNote: "",
setGiftNote: (note) => set({ giftNote: note }),

// Update partialize to persist giftNote:
partialize: (state) => ({ items: state.items, giftNote: state.giftNote }),
```

**Step 4: Verify**
```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/cart
```
Expected: `200`

**Step 5: Commit**
```bash
git add app/contact/page.tsx app/cart/page.tsx \
        components/contact/ContactForm.tsx \
        components/cart/CartContents.tsx \
        store/cart.ts
git commit -m "fix: metadata for contact+cart, gift note in cart"
```

---

## BLOCK 2: Accessibility Foundation (~35 min)

> WCAG 2.1 AA compliance applied site-wide. Every change benefits ALL pages.

### Task 4 -- Focus styles + reduced motion in globals.css

**Files:**
- Modify: `app/globals.css`

**Step 1: Add focus-visible ring + reduced motion**

Append inside the existing `@layer base {}` block:
```css
/* Keyboard focus ring: visible for keyboard nav only, not mouse clicks */
:focus-visible {
  outline: 2px solid var(--color-gold);
  outline-offset: 3px;
  border-radius: 2px;
}

/* Respect user motion preferences (WCAG 2.3.3) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Step 2: Verify server still starts**
```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/
```
Expected: `200`

---

### Task 5 -- SkipLink component

**Why:** Screen reader and keyboard users must skip the navbar and jump to main content.
This is WCAG 2.4.1 (Level A) -- the most important single a11y feature.

**Files:**
- Create: `components/ui/SkipLink.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create `components/ui/SkipLink.tsx`**

```typescript
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only fixed top-4 left-4 z-[100] bg-white text-ink border border-ink px-4 py-2 text-xs tracking-widest uppercase"
    >
      Skip to main content
    </a>
  )
}
```

**Step 2: Update `app/layout.tsx`**

Add `SkipLink` as first child of `<body>` and `id="main-content"` to `<main>`:

```tsx
import { SkipLink } from "@/components/ui/SkipLink"

// In the JSX:
<body>
  <Providers>
    <SkipLink />
    <Navbar />
    <main id="main-content">{children}</main>
    <Footer />
    <WhatsAppButton />
  </Providers>
</body>
```

---

### Task 6 -- ARIA live region for cart announcements

**Why:** When a user clicks "Add to Cart", sighted users see the badge increment and toast.
Screen reader users hear nothing. A live region announces changes to assistive technology (WCAG 4.1.3).

**Files:**
- Create: `components/ui/LiveRegion.tsx`
- Modify: `store/cart.ts` (add `announcement` + `announce`)
- Modify: `app/layout.tsx` (add LiveRegion)

**Step 1: Create `components/ui/LiveRegion.tsx`**

```typescript
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
```

**Step 2: Add `announcement` to `store/cart.ts`**

```typescript
// Add to CartStore interface:
announcement: string
announce: (msg: string) => void

// Add to implementation:
announcement: "",
announce: (msg) => set({ announcement: msg }),

// Update addItem to announce:
addItem: (item) => {
  set((state) => {
    const existing = state.items.find((i) => i.id === item.id)
    if (existing) {
      return {
        items: state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }
    }
    return { items: [...state.items, { ...item, quantity: 1 }] }
  })
  get().announce(`${item.name} added to cart`)
},

// Update removeItem to announce:
removeItem: (id) => {
  const item = get().items.find((i) => i.id === id)
  set((state) => ({ items: state.items.filter((i) => i.id !== id) }))
  if (item) get().announce(`${item.name} removed from cart`)
},

// announcement is NOT persisted -- keep out of partialize
```

**Step 3: Add `<LiveRegion />` to `app/layout.tsx`**

```tsx
import { LiveRegion } from "@/components/ui/LiveRegion"
// Add after WhatsAppButton inside Providers:
<LiveRegion />
```

---

### Task 7 -- Accessible Navbar + CartButton + CartDrawer

**Files:**
- Modify: `components/layout/Navbar.tsx`
- Modify: `components/ui/CartButton.tsx`
- Modify: `components/ui/CartDrawer.tsx`

**Step 1: Update Navbar with ARIA attributes**

```tsx
// Add aria-label to <header>:
<header aria-label="Site header" className="...">

// Wrap desktop links in <nav> with label:
<nav aria-label="Main navigation" className="...">

// Update burger button:
<button
  onClick={() => setMobileOpen((v) => !v)}
  aria-expanded={mobileOpen}
  aria-controls="mobile-menu"
  aria-label={mobileOpen ? "Close menu" : "Open menu"}
  className="..."
>

// Add id + role to mobile menu div:
<div id="mobile-menu" role="navigation" aria-label="Mobile navigation" ...>
```

**Step 2: Update CartButton aria-label**

```tsx
<button
  onClick={openCart}
  aria-label={count > 0
    ? `Open cart, ${count} item${count !== 1 ? "s" : ""}`
    : "Open cart"}
  className="..."
>
```

**Step 3: Add focus trap + role="dialog" to CartDrawer**

When the drawer opens: focus moves to close button.
While open: Tab cycles only within the drawer.
Escape key: closes the drawer.

```typescript
"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/store/cart"

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCart()
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Move focus to close button when drawer opens
  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus()
  }, [isOpen])

  // Focus trap + Escape key handler
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { closeCart(); return }
    if (e.key !== "Tab") return

    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable || focusable.length === 0) return

    const first = focusable[0]
    const last  = focusable[focusable.length - 1]

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus()
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={closeCart} aria-hidden="true" />
      )}

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        onKeyDown={handleKeyDown}
        className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <h2 className="font-serif text-lg text-ink">Your Cart</h2>
          <button
            ref={closeButtonRef}
            onClick={closeCart}
            aria-label="Close cart"
            className="text-ink/40 hover:text-ink transition text-2xl leading-none"
          >
            x
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-ink/50 text-sm">Your cart is empty.</p>
              <Link
                href="/products"
                onClick={closeCart}
                className="text-xs tracking-widest uppercase border border-ink px-4 py-2 hover:bg-ink hover:text-white transition"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <ul aria-label="Cart items" className="divide-y divide-stone-100">
              {items.map((item) => (
                <li key={item.id} className="py-4 flex gap-4">
                  <div className="relative w-16 h-16 bg-stone-100 flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="w-full h-full bg-stone-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm text-ink truncate">{item.name}</p>
                    <p className="text-xs text-ink/60 mt-0.5">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease ${item.name} quantity`}
                        className="w-6 h-6 border border-stone-200 text-ink/60 hover:text-ink flex items-center justify-center text-sm"
                      >-</button>
                      <span className="text-sm w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase ${item.name} quantity`}
                        className="w-6 h-6 border border-stone-200 text-ink/60 hover:text-ink flex items-center justify-center text-sm"
                      >+</button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="text-stone-300 hover:text-ink transition text-xl leading-none self-start mt-0.5"
                  >x</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-stone-100">
            <div className="flex justify-between text-sm mb-4">
              <span className="text-ink/60">Subtotal</span>
              <span className="font-medium text-ink">${totalPrice().toFixed(2)}</span>
            </div>
            <button
              disabled
              aria-disabled="true"
              className="w-full bg-ink text-white py-3 text-xs tracking-widest uppercase opacity-50 cursor-not-allowed"
            >
              Checkout - Coming Soon
            </button>
          </div>
        )}
      </div>
    </>
  )
}
```

**Step 4: Commit**
```bash
git add app/globals.css app/layout.tsx \
        components/ui/SkipLink.tsx \
        components/ui/LiveRegion.tsx \
        components/layout/Navbar.tsx \
        components/ui/CartButton.tsx \
        components/ui/CartDrawer.tsx \
        store/cart.ts
git commit -m "feat: WCAG 2.1 AA -- skip link, live region, focus trap, ARIA labels"
```

---

## BLOCK 3: Product Detail Page (~65 min)

### Task 8 -- ProductGallery component (client)

**Files:**
- Create: `components/product/ProductGallery.tsx`

```typescript
"use client"

import { useState, useCallback } from "react"
import Image from "next/image"

interface ProductGalleryProps {
  images: string[]
  name: string
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") setActive((i) => Math.min(i + 1, images.length - 1))
    if (e.key === "ArrowLeft")  setActive((i) => Math.max(i - 1, 0))
    if (e.key === "Escape")     setZoomed(false)
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setZoomed((v) => !v) }
  }, [images.length])

  const src = images[active] ?? ""

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${name} image ${active + 1} of ${images.length}. Press Enter to zoom, arrow keys to navigate.`}
        onKeyDown={handleKeyDown}
        onClick={() => setZoomed(true)}
        className="relative aspect-square bg-stone-100 cursor-zoom-in overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        {src && (
          <Image
            src={src}
            alt={`${name}, view ${active + 1}`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
      </div>

      {/* Thumbnails -- only if multiple images */}
      {images.length > 1 && (
        <div role="tablist" aria-label="Product views" className="flex gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={active === i}
              aria-label={`View ${i + 1}`}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 border-2 transition overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                active === i ? "border-ink" : "border-transparent hover:border-stone-300"
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom lightbox */}
      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed product image"
          onClick={() => setZoomed(false)}
          onKeyDown={(e) => e.key === "Escape" && setZoomed(false)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 cursor-zoom-out"
        >
          <div className="relative w-full max-w-2xl aspect-square">
            <Image src={src} alt={name} fill className="object-contain" sizes="672px" />
          </div>
          <button
            autoFocus
            onClick={(e) => { e.stopPropagation(); setZoomed(false) }}
            className="absolute top-6 right-6 text-white/70 hover:text-white text-3xl leading-none"
            aria-label="Close zoomed image"
          >
            x
          </button>
        </div>
      )}
    </div>
  )
}
```

---

### Task 9 -- ProductActions component (client)

**Files:**
- Create: `components/product/ProductActions.tsx`

```typescript
"use client"

import toast from "react-hot-toast"
import { useCart } from "@/store/cart"

interface ProductActionsProps {
  id: string
  name: string
  price: number
  image: string
  slug: string
  inStock: boolean
  stockCount: number | null
  whatsappNumber?: string
}

export function ProductActions({
  id, name, price, image, slug, inStock, stockCount, whatsappNumber,
}: ProductActionsProps) {
  const addItem = useCart((s) => s.addItem)

  function handleAddToCart() {
    addItem({ id, name, price, image, slug })
    toast.success(`${name} added to cart`)
  }

  const waText   = encodeURIComponent(`Hi, I'm interested in the ${name}`)
  const waHref   = `https://wa.me/${whatsappNumber}?text=${waText}`

  return (
    <div className="flex flex-col gap-4">
      {/* Stock urgency signal */}
      {inStock && stockCount !== null && stockCount <= 5 && (
        <p role="status" className="text-xs tracking-widest uppercase text-amber-600">
          Only {stockCount} left in stock
        </p>
      )}

      {/* Add to cart */}
      <button
        onClick={handleAddToCart}
        disabled={!inStock}
        aria-label={inStock ? `Add ${name} to cart` : `${name} is out of stock`}
        className="w-full bg-ink text-white py-4 text-xs tracking-widest uppercase hover:bg-ink/80 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {inStock ? "Add to Cart" : "Out of Stock"}
      </button>

      {/* WhatsApp CTA */}
      {whatsappNumber && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ask about ${name} on WhatsApp`}
          className="w-full border border-stone-200 py-3.5 text-xs tracking-widest uppercase text-ink/60 hover:border-ink hover:text-ink transition text-center flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
               className="w-3.5 h-3.5" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Ask about this piece
        </a>
      )}
    </div>
  )
}
```

---

### Task 10 -- RelatedProducts + JsonLd components

**Files:**
- Create: `components/product/RelatedProducts.tsx`
- Create: `components/product/JsonLd.tsx`

**Step 1: Create `components/product/RelatedProducts.tsx`** (server component)

```typescript
import { prisma } from "@/lib/db"
import { ProductCard } from "@/components/product/ProductCard"

interface Props {
  category: string | null
  excludeSlug: string
}

export async function RelatedProducts({ category, excludeSlug }: Props) {
  if (!category) return null

  const products = await prisma.product.findMany({
    where: { category, slug: { not: excludeSlug }, inStock: true },
    take: 4,
    orderBy: { createdAt: "asc" },
  })

  if (products.length === 0) return null

  return (
    <section aria-labelledby="related-heading" className="mt-20 pt-16 border-t border-stone-100">
      <h2 id="related-heading" className="font-serif text-2xl text-ink mb-8">
        You may also love
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            slug={p.slug}
            price={p.price}
            images={p.images}
            category={p.category}
            inStock={p.inStock}
          />
        ))}
      </div>
    </section>
  )
}
```

**Step 2: Create `components/product/JsonLd.tsx`** (server component)

NOTE: dangerouslySetInnerHTML is safe here because:
1. All values come from our own Prisma database, not raw user input
2. We sanitize the serialized string to prevent </script> injection

```typescript
function sanitizeForScript(json: string): string {
  // Prevent </script> tag injection in JSON-LD blocks
  return json.replace(/<\/script>/gi, "<\\/script>")
}

interface JsonLdProps {
  name: string
  description: string | null
  price: number
  image: string
  slug: string
  inStock: boolean
}

export function JsonLd({ name, description, price, image, slug, inStock }: JsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description ?? "",
    image,
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: "USD",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"}/products/${slug}`,
    },
  }

  const serialized = sanitizeForScript(JSON.stringify(data))

  return (
    <script
      type="application/ld+json"
      // Safe: data is from our DB, serialized via JSON.stringify,
      // and </script> sequences are escaped
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  )
}
```

---

### Task 11 -- Product detail page `/products/[slug]`

**Files:**
- Create: `app/products/[slug]/page.tsx`

```typescript
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db"
import { ProductGallery } from "@/components/product/ProductGallery"
import { ProductActions } from "@/components/product/ProductActions"
import { RelatedProducts } from "@/components/product/RelatedProducts"
import { JsonLd } from "@/components/product/JsonLd"

interface Props {
  params: Promise<{ slug: string }>
}

// Pre-render all product pages at build time (SSG)
export async function generateStaticParams() {
  const products = await prisma.product.findMany({ select: { slug: true } })
  return products.map((p) => ({ slug: p.slug }))
}

// Per-product Open Graph + Twitter card metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) return { title: "Not Found" }

  const images = JSON.parse(product.images) as string[]
  return {
    title: product.name,
    description: product.description ?? `${product.name} -- handcrafted jewelry.`,
    openGraph: {
      title: product.name,
      description: product.description ?? "",
      images: images[0] ? [{ url: images[0], width: 800, height: 800, alt: product.name }] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await prisma.product.findUnique({ where: { slug } })
  if (!product) notFound()

  const images = JSON.parse(product.images) as string[]
  const firstImage = images[0] ?? ""

  return (
    <div className="pt-24 pb-20">
      <JsonLd
        name={product.name}
        description={product.description}
        price={product.price}
        image={firstImage}
        slug={slug}
        inStock={product.inStock}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumb navigation */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-xs text-ink/40 tracking-wide">
            <li><Link href="/products" className="hover:text-ink transition">Shop</Link></li>
            <li aria-hidden="true">&#8250;</li>
            {product.category && (
              <>
                <li>
                  <Link
                    href={`/products?category=${product.category}`}
                    className="hover:text-ink transition"
                  >
                    {product.category}
                  </Link>
                </li>
                <li aria-hidden="true">&#8250;</li>
              </>
            )}
            <li className="text-ink/70" aria-current="page">{product.name}</li>
          </ol>
        </nav>

        {/* 2-column layout: gallery left, info right */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          <ProductGallery images={images} name={product.name} />

          <div className="flex flex-col justify-center">
            {product.category && (
              <p className="text-xs tracking-widest uppercase text-ink/40 mb-3">
                {product.category}
              </p>
            )}
            <h1 className="font-serif text-3xl md:text-4xl text-ink leading-tight mb-4">
              {product.name}
            </h1>
            <p className="text-2xl text-ink mb-6">${product.price.toFixed(2)}</p>

            {product.description && (
              <p className="text-sm text-ink/60 leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            <ProductActions
              id={product.id}
              name={product.name}
              price={product.price}
              image={firstImage}
              slug={slug}
              inStock={product.inStock}
              stockCount={product.stockCount}
              whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
            />

            {/* Trust signals */}
            <ul
              aria-label="Store policies"
              className="mt-8 pt-8 border-t border-stone-100 flex flex-col gap-3"
            >
              {[
                "Free shipping on orders over $150",
                "30-day hassle-free returns",
                "Certificate of authenticity included",
              ].map((signal) => (
                <li key={signal} className="flex items-center gap-3 text-xs text-ink/50">
                  <span aria-hidden="true" className="text-gold">+</span>
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <RelatedProducts category={product.category} excludeSlug={slug} />
      </div>
    </div>
  )
}
```

**Step 2: Add stockCount to ProductCard + products page**

In `components/product/ProductCard.tsx`, add `stockCount?: number | null` to props and badge:
```tsx
// Props interface:
stockCount?: number | null

// Inside image div (alongside out-of-stock overlay):
{stockCount !== null && stockCount !== undefined && stockCount <= 5 && inStock && (
  <span className="absolute bottom-3 left-3 bg-amber-50 text-amber-700 px-2 py-1 text-xs">
    Only {stockCount} left
  </span>
)}
```

In `app/products/page.tsx`, add `stockCount` to the Prisma query result and pass it to ProductCard:
```typescript
// ProductCard JSX:
<ProductCard
  key={product.id}
  id={product.id}
  name={product.name}
  slug={product.slug}
  price={product.price}
  images={product.images}
  category={product.category}
  inStock={product.inStock}
  stockCount={product.stockCount}  // ADD THIS
/>
```

**Step 3: Verify product detail page**
```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/products/gold-bracelet-set
curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/products/nonexistent-slug
```
Expected: `200` then `404`

**Step 4: Verify JSON-LD + OG tags**
```bash
curl -s http://localhost:3001/products/gold-bracelet-set | grep -c 'application/ld+json'
curl -s http://localhost:3001/products/gold-bracelet-set | grep -c 'og:title'
```
Expected: `1` for both

**Step 5: Commit**
```bash
git add app/products/ \
        components/product/ProductGallery.tsx \
        components/product/ProductActions.tsx \
        components/product/RelatedProducts.tsx \
        components/product/JsonLd.tsx \
        components/product/ProductCard.tsx
git commit -m "feat: product detail page -- gallery, JSON-LD, OG, breadcrumb, related, WhatsApp CTA"
```

---

## BLOCK 4: Full Verification + Commit (~15 min)

### Task 12 -- Verify everything

**Step 1: TypeScript check (zero errors required)**
```bash
cd /root/tal-boilerplate
node_modules/.bin/tsc --noEmit 2>&1 | head -30
```
Expected: no output

**Step 2: All routes correct status**
```bash
for path in "" products products/gold-bracelet-set products/sapphire-statement-ring \
            about contact collections cart nonexistent; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3001/$path")
  echo "$path -> $code"
done
```
Expected: all 200 except `nonexistent` which is 404

**Step 3: Final commit**
```bash
git add .
git commit -m "Day 3: product detail, WCAG 2.1 AA accessibility, gap fixes, JSON-LD, OG tags"
```

---

## Definition of Done -- Day 3

| # | Check | How to verify |
|---|-------|---------------|
| 1 | Contact page title | Browser tab shows "Contact | Store" |
| 2 | Cart page title | Browser tab shows "Cart | Store" |
| 3 | stockCount seeded | 3 products show amber "Only X left" badge on grid |
| 4 | Gift note textarea | Cart page -> textarea visible, persists on refresh |
| 5 | Skip link on Tab | Press Tab on any page -> "Skip to main content" appears |
| 6 | Gold focus ring | Tab through any page -> gold ring on focused elements |
| 7 | Reduced motion | DevTools -> Rendering -> prefers-reduced-motion -> transitions stop |
| 8 | Cart focus trap | Open cart -> Tab stays inside drawer, Escape closes it |
| 9 | Screen reader announcement | Add item -> aria live region div text updates in DOM |
| 10 | Product detail 200 | /products/gold-bracelet-set -> 200 |
| 11 | Gallery keyboard nav | Focus gallery -> Arrow keys change image, Enter zooms |
| 12 | Zoom lightbox | Click gallery image -> full-screen overlay, Escape dismisses |
| 13 | WhatsApp CTA pre-filled | Click "Ask about this piece" -> WhatsApp opens with product name |
| 14 | Breadcrumb navigable | Click category -> /products?category=Earrings |
| 15 | Related products | Earrings detail page -> other earrings in "You may also love" |
| 16 | JSON-LD in HTML | curl product page -> application/ld+json present |
| 17 | OG tags per product | curl product page -> og:title + og:image with product image |
| 18 | Zero TypeScript errors | tsc --noEmit -> no output |

---

## Architecture Notes for Day 4 (Stripe)

- `stockCount` is in schema -- Stripe webhook can decrement on successful payment
- `giftNote` persists in Zustand -- pass as Stripe `metadata.gift_note` in checkout session
- `generateStaticParams` means product pages are SSG -- fast load, SEO-ready
- JSON-LD `offers.url` uses `NEXT_PUBLIC_SITE_URL` -- add to `.env.local` before Vercel deploy
- Add `NEXT_PUBLIC_SITE_URL=http://localhost:3001` to `.env.local` for correct JSON-LD URLs
