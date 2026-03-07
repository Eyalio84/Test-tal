# Day 6: Shop Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 9 high-value e-commerce features (wishlist, search, recently viewed, newsletter, shipping banner, admin dashboard) plus 3 Aria voice extensions (cart readback, stock check + price filter, product narration).

**Architecture:** Features are grouped by dependency. UI-only features (banner, newsletter) first, then localStorage stores (wishlist, recently viewed), then search (URL-param driven server filtering), then Aria extensions (new function declarations + tool responses), then admin (protected server component). Low-stock badge is already implemented in ProductCard — skip it.

**Tech Stack:** Next.js 16 App Router, Zustand + persist, Prisma/SQLite, NextAuth v5 session, Gemini Live API (raw WebSocket already wired in `hooks/useAriaLive.ts`), react-hot-toast, Tailwind v4.

**Key file aliases used throughout:**
- Prisma singleton: `@/lib/db` (exports `prisma`)
- Cart store: `@/store/cart` (exports `useCart`, `useCart.getState()` works outside React)
- Aria store: `@/store/aria` (exports `useAria`, `useAria.getState()` works outside React)
- Aria Live hook: `hooks/useAriaLive.ts` (module-level singletons `_ws`, `ARIA_FUNCTIONS`, `executeCommand`)
- Auth: `auth` from `@/auth` (NextAuth v5 server-side `auth()` call)

---

## Task 1: Shipping & Returns Trust Banner

**Files:**
- Create: `components/ui/ShippingBanner.tsx`
- Modify: `app/layout.tsx`

**Step 1: Create the banner component**

```tsx
// components/ui/ShippingBanner.tsx
export function ShippingBanner() {
  return (
    <div className="bg-ink text-white text-xs tracking-widest uppercase text-center py-2.5 px-4">
      <div className="flex items-center justify-center gap-6 flex-wrap">
        <span>Free shipping on orders over $150</span>
        <span className="text-white/30 hidden sm:inline">·</span>
        <span>Easy 30-day returns</span>
        <span className="text-white/30 hidden sm:inline">·</span>
        <span>SSL secured checkout</span>
      </div>
    </div>
  )
}
```

**Step 2: Add to layout above Navbar**

In `app/layout.tsx`, import `ShippingBanner` and render it as the very first element inside `<body>` (before `<SkipLink />` and `<Navbar />`):

```tsx
import { ShippingBanner } from "@/components/ui/ShippingBanner"

// Inside <Providers>:
<ShippingBanner />
<SkipLink />
<Navbar />
```

**Note:** The Navbar has `fixed top-0` positioning — the banner sits above it and pushes page content down. Update the Navbar's top offset if it overlaps: the banner is ~40px tall. Actually the Navbar uses `fixed top-0` so it will overlap the banner. Solution: change Navbar to `top-[40px]` — check `components/layout/Navbar.tsx` for its className and update `top-0` to `top-10`. Also update `pt-24` on pages to `pt-28` if needed. Simpler: make the banner also `fixed top-0` and Navbar `fixed top-10`.

**Simpler solution:** Place banner inside a sticky container, add its height to the Navbar's top offset. In `components/layout/Navbar.tsx`, change the nav's `top-0` to `top-10`. In `app/layout.tsx` keep order: ShippingBanner (not fixed) → Navbar (fixed, top-10).

**Step 3: Verify**
```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/
# Expected: 200
# Visual: dark banner strip at top, then navbar below it
```

**Step 4: Commit**
```bash
cd /root/tal-boilerplate
git add components/ui/ShippingBanner.tsx app/layout.tsx components/layout/Navbar.tsx
git commit -m "feat: shipping/returns trust banner + navbar top offset fix"
```

---

## Task 2: Newsletter Email Capture

**Files:**
- Create: `app/api/newsletter/route.ts`
- Create: `components/ui/NewsletterCapture.tsx`
- Modify: `components/layout/Footer.tsx` (replace existing newsletter HTML with the component)

**Step 1: Create the API route**

```typescript
// app/api/newsletter/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  // Store subscribers as JSON array in SiteContent
  const existing = await prisma.siteContent.findUnique({ where: { id: "newsletter_subscribers" } })
  const list: string[] = existing ? JSON.parse(existing.value) : []

  if (list.includes(email)) {
    return NextResponse.json({ message: "Already subscribed" })
  }

  list.push(email)
  await prisma.siteContent.upsert({
    where: { id: "newsletter_subscribers" },
    update: { value: JSON.stringify(list), updatedAt: new Date() },
    create: { id: "newsletter_subscribers", value: JSON.stringify(list), updatedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
```

**Step 2: Create the capture component**

```tsx
// components/ui/NewsletterCapture.tsx
"use client"

import { useState } from "react"
import toast from "react-hot-toast"

export function NewsletterCapture() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success || data.message === "Already subscribed") {
        toast.success("You're on the list — thank you.")
        setEmail("")
      } else {
        toast.error(data.error ?? "Something went wrong")
      }
    } catch {
      toast.error("Couldn't subscribe — try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        required
        className="flex-1 bg-transparent border border-white/20 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/60"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 text-xs tracking-widest uppercase bg-white text-ink hover:bg-stone-100 transition disabled:opacity-50"
      >
        {loading ? "..." : "Subscribe"}
      </button>
    </form>
  )
}
```

**Step 3: Replace newsletter markup in Footer**

Read `components/layout/Footer.tsx` to find the newsletter `<form>` element. Replace it with `<NewsletterCapture />`. Add `"use client"` directive to Footer if not already present — OR keep Footer as server component and move just the newsletter section to a sub-component (already done via `NewsletterCapture`). Since Footer likely has `<Link>` elements, it may already be client. If Footer is a server component, keep it that way and just import `NewsletterCapture` (client components can be imported by server components).

**Step 4: Verify**
```bash
curl -s -X POST http://localhost:3001/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
# Expected: {"success":true}
```

**Step 5: Commit**
```bash
git add app/api/newsletter/route.ts components/ui/NewsletterCapture.tsx components/layout/Footer.tsx
git commit -m "feat: newsletter email capture — API + inline form in footer"
```

---

## Task 3: Wishlist Store + Heart Icon + Wishlist Page

**Files:**
- Create: `store/wishlist.ts`
- Modify: `components/product/ProductCard.tsx`
- Create: `app/wishlist/page.tsx`

**Step 1: Create Wishlist Zustand store**

```typescript
// store/wishlist.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

interface WishlistStore {
  slugs: string[]
  toggle: (slug: string) => void
  isWished: (slug: string) => boolean
  clear: () => void
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      slugs: [],
      toggle: (slug) =>
        set((s) => ({
          slugs: s.slugs.includes(slug)
            ? s.slugs.filter((s2) => s2 !== slug)
            : [...s.slugs, slug],
        })),
      isWished: (slug) => get().slugs.includes(slug),
      clear: () => set({ slugs: [] }),
    }),
    { name: "wishlist-storage" }
  )
)
```

**Step 2: Add heart button to ProductCard**

In `components/product/ProductCard.tsx`, import `useWishlist` and add a heart button overlaid on the top-right of the image. Insert it inside the `<div className="relative aspect-square ...">` div, after the out-of-stock overlay:

```tsx
import { useWishlist } from "@/store/wishlist"

// Inside ProductCard, before the return:
const isWished = useWishlist((s) => s.isWished(slug))
const toggle   = useWishlist((s) => s.toggle)

// Inside the image container div, add:
<button
  onClick={(e) => { e.preventDefault(); toggle(slug) }}
  aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
  className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white transition"
>
  <svg viewBox="0 0 24 24" className={`w-4 h-4 transition ${isWished ? "fill-rose-500 stroke-rose-500" : "fill-none stroke-ink"}`} strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
  </svg>
</button>
```

**Step 3: Create Wishlist page**

```tsx
// app/wishlist/page.tsx
"use client"

import type { Metadata } from "next"
import { useWishlist } from "@/store/wishlist"
import { useEffect, useState } from "react"
import { ProductCard } from "@/components/product/ProductCard"
import Link from "next/link"

// Note: metadata export can't be in "use client" — create a separate metadata.ts or use title tag via <title>
// For simplicity, set page title via document.title in useEffect

interface Product {
  id: string; name: string; slug: string; price: number
  images: string; category: string | null; inStock: boolean; stockCount: number | null
}

export default function WishlistPage() {
  const slugs = useWishlist((s) => s.slugs)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = "Wishlist | Store"
    if (slugs.length === 0) { setLoading(false); return }
    Promise.all(slugs.map((slug) => fetch(`/api/product/${slug}`).then((r) => r.json())))
      .then((results) => setProducts(results.filter((p) => p?.id)))
      .finally(() => setLoading(false))
  }, [slugs])

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="font-serif text-3xl text-ink mb-10">Your Wishlist</h1>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-stone-100 rounded" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-ink/40 text-sm mb-4">Your wishlist is empty.</p>
            <Link href="/products" className="text-xs tracking-widest uppercase border border-ink px-4 py-2 hover:bg-ink hover:text-white transition">
              Browse the shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => <ProductCard key={p.id} {...p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 4: Add wishlist link to Navbar**

In `components/layout/Navbar.tsx`, add a small heart icon link next to the cart button. Read the file first to find the right insertion point.

**Step 5: Commit**
```bash
git add store/wishlist.ts components/product/ProductCard.tsx app/wishlist/page.tsx components/layout/Navbar.tsx
git commit -m "feat: wishlist — Zustand persist store, heart toggle on cards, /wishlist page"
```

---

## Task 4: Product Search Bar

**Files:**
- Create: `components/products/SearchInput.tsx`
- Modify: `app/products/page.tsx`

**Step 1: Create client-side search input**

This component lives on the products page, reads the current `q` URL param, and updates it as the user types (debounced 300ms).

```tsx
// components/products/SearchInput.tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

export function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set("q", value)
      } else {
        params.delete("q")
      }
      router.push(`/products?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [value, router, searchParams])

  return (
    <div className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search jewelry..."
        aria-label="Search products"
        className="w-full sm:w-64 border border-stone-200 px-4 py-2 text-sm text-ink placeholder-ink/40 focus:outline-none focus:border-ink pr-10"
      />
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.697 5.697a7.5 7.5 0 0 0 10.606 10.606Z" />
      </svg>
    </div>
  )
}
```

**Step 2: Update Products page to support `q` search param and `maxPrice` param**

Modify `app/products/page.tsx`:

```typescript
// In the Props interface:
interface Props {
  searchParams: Promise<{ category?: string; q?: string; maxPrice?: string }>
}

// In the page function:
const { category, q, maxPrice } = await searchParams

const products = await prisma.product.findMany({
  where: {
    ...(category ? { category } : {}),
    ...(q ? { name: { contains: q } } : {}),
    ...(maxPrice ? { price: { lte: parseFloat(maxPrice) } } : {}),
  },
  orderBy: { createdAt: "asc" },
})
```

Also add the `SearchInput` component to the page header, next to the category tabs. Wrap `SearchInput` in `<Suspense>` (required because it uses `useSearchParams`):

```tsx
import { Suspense } from "react"
import { SearchInput } from "@/components/products/SearchInput"

// In the JSX, add this row above or alongside the category tabs:
<div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
  <Suspense>
    <SearchInput />
  </Suspense>
  <div className="flex flex-wrap gap-3">
    {/* existing category tabs */}
  </div>
</div>
```

**Step 3: Verify**
```bash
curl -s "http://localhost:3001/api/product/sapphire-statement-ring" | grep -c '"id"'
# Expected: 1 (API still works)
```

**Step 4: Commit**
```bash
git add components/products/SearchInput.tsx app/products/page.tsx
git commit -m "feat: product search — URL-param driven server filter + debounced search input"
```

---

## Task 5: Recently Viewed Strip

**Files:**
- Create: `store/recentlyViewed.ts`
- Create: `components/product/RecentlyViewed.tsx`
- Modify: `components/product/ProductActions.tsx` (client component on detail page)
- Modify: `app/products/[slug]/page.tsx`

**Step 1: Create recently viewed store**

```typescript
// store/recentlyViewed.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface RecentProduct {
  id: string; name: string; slug: string; price: number
  image: string; category: string | null
}

interface RecentlyViewedStore {
  items: RecentProduct[]
  add: (product: RecentProduct) => void
  clear: () => void
}

export const useRecentlyViewed = create<RecentlyViewedStore>()(
  persist(
    (set) => ({
      items: [],
      add: (product) =>
        set((s) => {
          const filtered = s.items.filter((i) => i.slug !== product.slug)
          return { items: [product, ...filtered].slice(0, 6) }
        }),
      clear: () => set({ items: [] }),
    }),
    { name: "recently-viewed-storage" }
  )
)
```

**Step 2: Add tracking to ProductActions**

Read `components/product/ProductActions.tsx` first. It's a `"use client"` component that receives product props. Add a `useEffect` that calls `useRecentlyViewed().add(product)` on mount, AND sets `document.body.dataset` for Aria (needed by Task 8):

```tsx
import { useRecentlyViewed } from "@/store/recentlyViewed"

// Props should include: id, name, slug, price, image (first image URL), category
// Inside the component:
const addRecent = useRecentlyViewed((s) => s.add)

useEffect(() => {
  addRecent({ id, name, slug, price, image, category: category ?? null })
  // Aria context injection — Task 8 uses this
  document.body.dataset.productSlug = slug
  document.body.dataset.productName = name
  document.body.dataset.productPrice = String(price)
  return () => {
    delete document.body.dataset.productSlug
    delete document.body.dataset.productName
    delete document.body.dataset.productPrice
  }
}, [slug]) // eslint-disable-line react-hooks/exhaustive-deps
```

**Step 3: Create RecentlyViewed component**

```tsx
// components/product/RecentlyViewed.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { useRecentlyViewed } from "@/store/recentlyViewed"

interface Props { currentSlug: string }

export function RecentlyViewed({ currentSlug }: Props) {
  const items = useRecentlyViewed((s) => s.items).filter((i) => i.slug !== currentSlug)
  if (items.length === 0) return null

  return (
    <section className="mt-20 pt-12 border-t border-stone-100">
      <h2 className="font-serif text-xl text-ink mb-6">Recently Viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/products/${item.slug}`}
            className="snap-start flex-shrink-0 w-36 group"
          >
            <div className="aspect-square bg-stone-100 overflow-hidden mb-2">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={144}
                  height={144}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div className="w-full h-full bg-stone-200" />
              )}
            </div>
            <p className="text-xs text-ink/70 leading-tight line-clamp-1">{item.name}</p>
            <p className="text-xs text-ink/50 mt-0.5">${item.price.toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
```

**Step 4: Add RecentlyViewed to product detail page**

In `app/products/[slug]/page.tsx`, after the `<RelatedProducts />` component, add:

```tsx
import { RecentlyViewed } from "@/components/product/RecentlyViewed"

// After RelatedProducts:
<RecentlyViewed currentSlug={slug} />
```

Also ensure `ProductActions` receives `image` prop (first image URL). Read the current ProductActions props to confirm.

**Step 5: Commit**
```bash
git add store/recentlyViewed.ts components/product/RecentlyViewed.tsx components/product/ProductActions.tsx app/products/\[slug\]/page.tsx
git commit -m "feat: recently viewed strip — Zustand persist, tracks on detail page, horizontal scroll strip"
```

---

## Task 6: Aria — Cart Readback ("Read me my cart")

**Files:**
- Modify: `hooks/useAriaLive.ts`

**Context:** When Gemini calls `read_cart`, the `executeCommand` function must NOT dispatch a UI command — instead it reads cart state directly via `useCart.getState()` and sends the data back to Gemini as a tool response. Gemini then verbally recites the cart.

**Step 1: Add read_cart to ARIA_FUNCTIONS**

In `hooks/useAriaLive.ts`, find `ARIA_FUNCTIONS` and add:

```typescript
{ name: "read_cart", description: "Read the current cart contents aloud — items, quantities, and total", parameters: { type: "OBJECT", properties: {} } },
```

**Step 2: Update handleMessage to pass slug+id with tool calls**

The `handleMessage` function dispatches tool calls. For `read_cart`, we need to send a tool response immediately (before Gemini speaks). Currently `executeCommand` fires-and-forgets. For `read_cart` we need to intercept and respond.

Replace the tool call loop in `handleMessage`:

```typescript
for (const call of calls) {
  const result = await executeCommand(call.name, call.args ?? {})
  _ws?.send(JSON.stringify({
    tool_response: {
      function_responses: [{
        id: call.id,
        name: call.name,
        response: { result: result ?? "success" }
      }]
    }
  }))
}
```

Make `executeCommand` `async` and return a value for data-returning functions:

```typescript
async function executeCommand(name: string, args: Record<string, unknown>): Promise<string | undefined> {
  const { dispatchCommand } = aria()
  switch (name) {
    case "navigate":        dispatchCommand({ type: "NAVIGATE",    url: args.url as string }); return undefined
    case "scroll_page":     dispatchCommand({ type: "SCROLL",      direction: args.direction as "up"|"down"|"top"|"bottom", amount: (args.amount as number) ?? 400 }); return undefined
    case "add_to_cart":     dispatchCommand({ type: "ADD_TO_CART", slug: args.slug as string, name: args.name as string }); return undefined
    case "open_cart":       dispatchCommand({ type: "OPEN_CART" }); return undefined
    case "filter_products": dispatchCommand({ type: "FILTER",      category: args.category as string }); return undefined
    case "start_tour":      dispatchCommand({ type: "START_TOUR" }); return undefined

    case "read_cart": {
      const { items, totalPrice } = useCart.getState()
      if (items.length === 0) return "The cart is empty."
      const list = items.map((i) => `${i.quantity}× ${i.name} at $${i.price.toFixed(2)}`).join(", ")
      return `Cart contains: ${list}. Total: $${totalPrice().toFixed(2)}.`
    }

    case "check_stock": {
      const slug = args.slug as string
      const res = await fetch(`/api/product/${slug}`)
      const p = await res.json()
      if (!p?.id) return "I couldn't find that product."
      if (!p.inStock) return `${p.name} is currently out of stock.`
      if (p.stockCount !== null && p.stockCount <= 5) return `${p.name} is in stock — only ${p.stockCount} remaining.`
      return `${p.name} is in stock.`
    }

    case "filter_by_price": {
      const max = args.maxPrice as number
      dispatchCommand({ type: "NAVIGATE", url: `/products?maxPrice=${max}` })
      return undefined
    }

    case "describe_current_product": {
      const slug = document.body.dataset.productSlug
      if (!slug) return "I can't see a product on this page. Navigate to a product to hear about it."
      const res = await fetch(`/api/product/${slug}`)
      const p = await res.json()
      if (!p?.id) return "I couldn't load the product details."
      return JSON.stringify({
        name: p.name,
        price: p.price,
        category: p.category,
        description: p.description,
        inStock: p.inStock,
        stockCount: p.stockCount,
      })
    }
  }
}
```

**Also update the handleMessage tool call loop** to await executeCommand and use the return value:

```typescript
// Replace the for loop in handleMessage:
if (data.toolCall) {
  const calls = ((data.toolCall as Record<string,unknown>).functionCalls ?? []) as Array<{id:string;name:string;args:Record<string,unknown>}>
  for (const call of calls) {
    const result = await executeCommand(call.name, call.args ?? {})
    _ws?.send(JSON.stringify({
      tool_response: {
        function_responses: [{
          id: call.id,
          name: call.name,
          response: { result: result ?? "success" }
        }]
      }
    }))
  }
}
```

**Step 3: Commit**
```bash
git add hooks/useAriaLive.ts
git commit -m "feat: Aria read_cart — async executeCommand returns data to Gemini for verbal readback"
```

---

## Task 7: Aria — Stock Check + Price Filter

**Files:**
- Modify: `hooks/useAriaLive.ts` (continued from Task 6 — both done in same edit)

**Context:** Task 6 already adds `check_stock` and `filter_by_price` in the big `executeCommand` rewrite. This task adds them to `ARIA_FUNCTIONS` and updates `SYSTEM_PROMPT`.

**Step 1: Add to ARIA_FUNCTIONS**

```typescript
{ name: "check_stock", description: "Check if a product is in stock", parameters: { type: "OBJECT", properties: { slug: { type: "STRING", description: "gold-bracelet-set | pearl-drop-earrings | sapphire-statement-ring | diamond-solitaire-pendant | rose-gold-chain-necklace | emerald-stud-earrings | vintage-gold-brooch | sterling-silver-cuff" } }, required: ["slug"] } },
{ name: "filter_by_price", description: "Filter shop products by maximum price", parameters: { type: "OBJECT", properties: { maxPrice: { type: "NUMBER", description: "Maximum price in USD, e.g. 100" } }, required: ["maxPrice"] } },
```

**Step 2: Update SYSTEM_PROMPT**

Add to the Products / capabilities section:

```
- check_stock: Check if a specific product is available. Use when customer asks "is X in stock?" or "do you have X?".
- filter_by_price: Filter shop by max price. Use for "show me something under $100" or "find gifts under $X".
- read_cart: Read cart contents aloud. Use when customer asks "what's in my cart?" or "read me my cart".
```

Also add silence rules for filter_by_price and check_stock and read_cart:
- `filter_by_price`: one brief sentence "Here are pieces under $X."
- `check_stock`: speak the result naturally.
- `read_cart`: speak the result naturally.

**Step 3: Commit** (part of Task 6 commit — already included above)

---

## Task 8: Aria — Product Narration on Detail Page

**Files:**
- Modify: `hooks/useAriaLive.ts` (add describe_current_product to ARIA_FUNCTIONS — done in Task 6)
- Modify: `components/product/ProductActions.tsx` (set body dataset — done in Task 5)

**Context:** Both prerequisites were added in Tasks 5 and 6. This task just adds the ARIA_FUNCTIONS entry and updates SYSTEM_PROMPT.

**Step 1: Add describe_current_product to ARIA_FUNCTIONS**

```typescript
{ name: "describe_current_product", description: "Describe the product currently shown on the page — materials, price, story", parameters: { type: "OBJECT", properties: {} } },
```

**Step 2: Update SYSTEM_PROMPT silence rules**

```
- describe_current_product: speak the product description naturally and warmly in 2-3 sentences. Include price and whether it's in stock.
```

**Step 3: Verify the data flow**
- Navigate to `/products/sapphire-statement-ring` in browser
- Check `document.body.dataset` in console: should have `productSlug`, `productName`, `productPrice`
- Ask Aria: "Tell me about this piece" → Gemini calls `describe_current_product` → returns JSON → Gemini narrates

**Step 4: Commit**
```bash
git add hooks/useAriaLive.ts components/product/ProductActions.tsx
git commit -m "feat: Aria voice extensions — stock check, price filter, product narration, cart readback"
```

---

## Task 9: Admin Dashboard

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Modify: `components/layout/Navbar.tsx` (add Admin link when authenticated)

**Context:** NextAuth v5 server-side session check: `import { auth } from "@/auth"` then `const session = await auth()`. Redirect to `/api/auth/signin` if no session. For demo, any logged-in user can access admin (no role system needed).

**Step 1: Create admin layout**

```tsx
// app/admin/layout.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/api/auth/signin")

  return (
    <div className="pt-24 pb-20 min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-2xl text-ink">Admin Dashboard</h1>
          <span className="text-xs text-ink/40">{session.user?.email}</span>
        </div>
        {children}
      </div>
    </div>
  )
}
```

**Step 2: Create admin page**

```tsx
// app/admin/page.tsx
import type { Metadata } from "next"
import { prisma } from "@/lib/db"

export const metadata: Metadata = { title: "Admin" }

export default async function AdminPage() {
  const [orders, products, totalRevenue] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { User: { select: { email: true, name: true } } },
    }),
    prisma.product.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: "paid" } }),
  ])

  const revenue = totalRevenue._sum.total ?? 0
  const paid = orders.filter((o) => o.status === "paid").length

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Orders",   value: orders.length },
          { label: "Paid Orders",    value: paid },
          { label: "Revenue",        value: `$${revenue.toFixed(2)}` },
          { label: "Products",       value: products },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-stone-100 p-5">
            <p className="text-xs tracking-widest uppercase text-ink/40 mb-1">{stat.label}</p>
            <p className="font-serif text-2xl text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white border border-stone-100">
        <div className="px-5 py-4 border-b border-stone-100">
          <h2 className="font-serif text-lg text-ink">Recent Orders</h2>
        </div>
        {orders.length === 0 ? (
          <p className="text-ink/40 text-sm p-6">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-xs tracking-widest uppercase text-ink/40">
                  <th className="text-left px-5 py-3">Customer</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-right px-5 py-3">Total</th>
                  <th className="text-right px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-stone-50 hover:bg-stone-50 transition">
                    <td className="px-5 py-3 text-ink">{order.User.name ?? order.User.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        order.status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">${order.total.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-ink/40">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 3: Add Admin link to Navbar**

In `components/layout/Navbar.tsx`, read the file and find where the session-based auth buttons are rendered (Sign In / avatar). Add an "Admin" link next to them, only visible when session exists:

```tsx
{session && (
  <Link href="/admin" className="text-xs tracking-widest uppercase text-ink/50 hover:text-ink transition hidden md:block">
    Admin
  </Link>
)}
```

**Step 4: Verify**
```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/admin
# Expected: 307 (redirect to signin — not logged in)
# After login: 200
```

**Step 5: Commit**
```bash
git add app/admin/layout.tsx app/admin/page.tsx components/layout/Navbar.tsx
git commit -m "feat: admin dashboard — orders + revenue stats + table, session-protected"
```

---

## Task 10: Final Verification + Day 6 Commit

**Step 1: Restart dev server to clear any caches**
```bash
pkill -f "next-server" 2>/dev/null; sleep 2
nohup /tmp/start-tal.sh > /tmp/tal-dev.log 2>&1 &
sleep 5
tail -5 /tmp/tal-dev.log
```

**Step 2: Smoke-test all routes**
```bash
for path in "" products about contact collections cart wishlist admin; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3001/$path")
  echo "$path: $code"
done
# Expected: all 200 (admin → 307 redirect is fine — means auth guard works)
```

**Step 3: Test newsletter API**
```bash
curl -s -X POST http://localhost:3001/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"tal@example.com"}'
# Expected: {"success":true}
```

**Step 4: Final commit**
```bash
git add -A
git status  # verify nothing sensitive (no .env)
git commit -m "Day 6: search, wishlist, recently viewed, newsletter, shipping banner, admin dashboard, Aria voice extensions"
```

---

## Day 6 Definition of Done

| # | Feature | How to verify |
|---|---------|---------------|
| 1 | Shipping banner | Dark strip visible at top of every page |
| 2 | Newsletter | Footer form → toast success → check SiteContent in DB |
| 3 | Wishlist | Heart icon on cards, toggles fill, /wishlist shows items |
| 4 | Search | `/products?q=sapphire` returns only sapphire ring |
| 5 | Recently viewed | Visit 3 detail pages → strip appears on 4th |
| 6 | Aria cart readback | Say "read me my cart" → Aria recites items + total |
| 7 | Aria stock check | Say "is the gold bracelet in stock?" → Aria answers |
| 8 | Aria price filter | Say "show me items under $80" → products page filtered |
| 9 | Aria narration | On product detail page, say "tell me about this" → Aria narrates |
| 10 | Admin dashboard | `/admin` → 307 when logged out, orders table when logged in |

---

## Architecture Notes for Day 7

- `/admin` is expandable: add product CRUD, stock update form, mark-order-paid button
- Wishlist can be server-persisted: add `Wishlist` model to schema + sync on login
- Search is SQLite LIKE — for production swap to Prisma full-text search or Typesense
- Aria `describe_current_product` uses `document.body.dataset` — survives all navigation patterns
- Newsletter subscribers in SiteContent → exportable via admin page later
