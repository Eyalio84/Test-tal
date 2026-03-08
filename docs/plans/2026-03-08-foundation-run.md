# Foundation Run — Banners, Renames, Images & Aria Voice Commands

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up visual noise, rename brands/products to match real display names, fix broken images, and make Aria a fully capable voice shopping assistant in every demo.

**Architecture:** Changes are spread across 3 layers: (1) static theme data in `themes/*.ts`, (2) Aria function declarations + system prompts in `hooks/useAriaLive.ts`, (3) command execution in `AriaCommandDispatcher.tsx`. No DB schema changes — demos are fully static.

**Tech Stack:** Next.js 16 App Router, TypeScript, Zustand, Gemini Live API

---

## Task 1: Remove both black top banners

**Files:**
- Modify: `components/ui/ShippingBanner.tsx`
- Modify: `app/demos/[themeId]/layout.tsx`

**Step 1: Remove the ShippingBanner entirely**

In `components/ui/ShippingBanner.tsx`, replace the entire file with just:
```tsx
export function ShippingBanner() {
  return null
}
```
(Keep the export so nothing breaks — it's imported in layout. Will clean up the import later if desired.)

**Step 2: Remove demo context strip from demo layout**

In `app/demos/[themeId]/layout.tsx`, remove the entire `{/* Demo banner strip */}` block and also remove the `pt-7` wrapper:

Change:
```tsx
  return (
    <>
      <DemoAriaContext />
      <ThemeApplierStatic theme={theme} />
      {/* Demo banner strip */}
      <div className="fixed top-0 inset-x-0 z-50 h-7 bg-zinc-900 flex items-center justify-between px-6">
        <span className="text-[10px] tracking-widest uppercase text-zinc-400">
          Demo: {theme.brand.name} · Aria is in character
        </span>
        <Link href="/demos" className="text-[10px] tracking-widest uppercase text-zinc-400 hover:text-white transition">
          ← All demos
        </Link>
      </div>
      {/* Push content below banner + navbar */}
      <div className="pt-7">{children}</div>
    </>
  )
```

To:
```tsx
  return (
    <>
      <DemoAriaContext />
      <ThemeApplierStatic theme={theme} />
      {children}
    </>
  )
```

Also remove the `Link` import if it's only used by the banner.

**Step 3: Manual test**
- Visit `/` — no black bar at top
- Visit `/demos/jewelry` — no black bar at top, content not pushed down 7px
- Visit `/demos` listing — no shipping bar

**Step 4: Commit**
```bash
git add components/ui/ShippingBanner.tsx app/demos/[themeId]/layout.tsx
git commit -m "Remove top black banners from all pages"
```

---

## Task 2: Rename theme brands

**Files:**
- Modify: `themes/jewelry.ts`
- Modify: `themes/candy.ts`
- Modify: `themes/bakery.ts`
- Modify: `themes/restaurant.ts`
- Modify: `themes/portfolio.ts`

**Step 1: Jewelry — brand name**

In `themes/jewelry.ts`, change:
```ts
brand:  { name: "Store", tagline: "Handcrafted with intention" },
```
To:
```ts
brand:  { name: "Jewelry Store", tagline: "Handcrafted with intention" },
```
Also update `meta.title`:
```ts
title: "Jewelry Store — Handcrafted Jewelry",
```

**Step 2: Candy — brand name**

In `themes/candy.ts`, change:
```ts
brand:  { name: "Sweet Drops", tagline: "Candy for every occasion" },
```
To:
```ts
brand:  { name: "Sweet Drops Candy Shop", tagline: "Candy for every occasion" },
```

**Step 3: Bakery — brand name**

In `themes/bakery.ts`, change:
```ts
brand:  { name: "The Flour Studio", tagline: "Baked with love, every morning" },
```
To:
```ts
brand:  { name: "The Bakery", tagline: "Baked with love, every morning" },
```
Also update `meta.title` and `meta.description` to reference "The Bakery" instead of "The Flour Studio".

**Step 4: Restaurant — brand display name**

In `themes/restaurant.ts`, change:
```ts
brand:  { name: "Maison Dore", tagline: "Where every table tells a story" },
```
To:
```ts
brand:  { name: "Maison Dore Boutique Restaurant", tagline: "Where every table tells a story" },
```

**Step 5: Portfolio — brand name**

In `themes/portfolio.ts`, change:
```ts
brand:  { name: "Studio Noir", tagline: "Visual stories worth telling" },
```
To:
```ts
brand:  { name: "Photographer's Portfolio", tagline: "Visual stories worth telling" },
```
Also update `meta.title` and `meta.description`.

**Step 6: Manual test**
- Visit `/demos` — check all 8 cards show correct new names
- Visit each renamed demo — title/brand matches

**Step 7: Commit**
```bash
git add themes/jewelry.ts themes/candy.ts themes/bakery.ts themes/restaurant.ts themes/portfolio.ts
git commit -m "Rename theme brands: Jewelry Store, The Bakery, Sweet Drops Candy Shop, Maison Dore Boutique Restaurant, Photographer's Portfolio"
```

---

## Task 3: Fix product names in jewelry + bakery

**Files:**
- Modify: `themes/jewelry.ts`
- Modify: `themes/bakery.ts`

**Step 1: Jewelry — rename Sapphire Statement Ring**

In `themes/jewelry.ts`, find:
```ts
{ name: "Sapphire Statement Ring", slug: "sapphire-statement-ring", ...
```
Change name to:
```ts
{ name: "Sapphire Ring", slug: "sapphire-statement-ring", ...
```
(Keep slug unchanged — don't break URLs.)

**Step 2: Bakery — remove quantity suffixes from product names**

In `themes/bakery.ts`, make these two changes:

```ts
// Change:
{ name: "Chocolate Éclairs (4)", ...
// To:
{ name: "Chocolate Éclairs", ...

// Change:
{ name: "Croissant Box (6)", ...
// To:
{ name: "Croissant Box", ...
```

Keep slugs unchanged.

**Step 3: Commit**
```bash
git add themes/jewelry.ts themes/bakery.ts
git commit -m "Fix product names: Sapphire Ring, remove quantity counts from bakery items"
```

---

## Task 4: Fix broken images in Petal & Stem (flowers theme)

**Files:**
- Modify: `themes/flowers.ts`

The broken images are caused by reused/expired Unsplash photo IDs. Three images need replacing:

**Step 1: Fix hero image**

The hero image `photo-1487530811015-780d3f83cdd7` is broken. Replace with:
```ts
image: "https://images.unsplash.com/photo-1490750967868-88df5691cc0e?w=1600&q=80",
```
Wait — check this URL is also broken (it's reused in products). Use instead:
```ts
image: "https://images.unsplash.com/photo-1561181286-d5c73431a97b?w=1600&q=80",
```
(Fresh pink flower hero — test in browser first; if broken, use `photo-1606041011872-596597976b25`)

**Step 2: Fix Sunflower Arrangement image**

Find:
```ts
{ name: "Sunflower Arrangement", slug: "sunflower-arrangement", ... image: "https://images.unsplash.com/photo-1490750967868-88df5691cc0e?w=800&q=80", ...
```
Replace image with:
```ts
image: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&q=80",
```

**Step 3: Fix Mixed Wildflowers image**

Find:
```ts
{ name: "Mixed Wildflowers", slug: "mixed-wildflowers", ... image: "https://images.unsplash.com/photo-1487530811015-780d3f83cdd7?w=800&q=80", ...
```
Replace image with:
```ts
image: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=800&q=80",
```

**Step 4: Also check Tulip Collection** — it reuses the same broken sunflower URL. Update to:
```ts
image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800&q=80",
```

**Step 5: Manual test**
- Visit `/demos/flowers` — hero card on listing page loads
- Visit `/demos/flowers/products` — all 4 previously broken images now load

**Step 6: Commit**
```bash
git add themes/flowers.ts
git commit -m "Fix broken images in Petal & Stem (hero, Sunflower Arrangement, Mixed Wildflowers, Tulip Collection)"
```

---

## Task 5: Fix demo add-to-cart — use theme data instead of DB fetch

**Problem:** `AriaCommandDispatcher` dispatches `ADD_TO_CART` then fetches `/api/product/${slug}` from the DB. Demo products don't exist in the DB, so all cart adds silently fail in demo context.

**Files:**
- Modify: `store/aria.ts`
- Modify: `hooks/useAriaLive.ts`
- Modify: `components/aria/AriaCommandDispatcher.tsx`

**Step 1: Extend ADD_TO_CART command type in `store/aria.ts`**

Find:
```ts
| { type: "ADD_TO_CART";      slug: string; name: string }
```
Replace with:
```ts
| { type: "ADD_TO_CART";      slug: string; name: string; price?: number; image?: string }
```

**Step 2: Pass product data in executeCommand when in demo context**

In `hooks/useAriaLive.ts`, find the `add_to_cart` case:
```ts
case "add_to_cart": dispatchCommand({ type: "ADD_TO_CART", slug: args.slug as string, name: args.name as string }); return undefined
```

Replace with:
```ts
case "add_to_cart": {
  const slug = args.slug as string
  const name = args.name as string
  if (aria().ariaContext === "demo") {
    const theme = THEMES[aria().activeThemeId]
    const product = theme?.products.find(p => p.slug === slug)
    if (product) {
      dispatchCommand({ type: "ADD_TO_CART", slug, name: product.name, price: product.price, image: product.image })
      return undefined
    }
  }
  dispatchCommand({ type: "ADD_TO_CART", slug, name })
  return undefined
}
```

**Step 3: Use embedded data in AriaCommandDispatcher when available**

In `components/aria/AriaCommandDispatcher.tsx`, find the `ADD_TO_CART` case:
```ts
case "ADD_TO_CART":
  fetch(`/api/product/${pendingCommand.slug}`)
    .then((r) => r.json())
    .then((product) => {
      if (product?.id) {
        addItem({
          id:    product.id,
          name:  product.name,
          price: product.price,
          slug:  product.slug,
          image: product.images ? JSON.parse(product.images)[0] ?? null : null,
        })
        toast.success(`${product.name} added to cart`)
      }
    })
    .catch(() => toast.error("Couldn't add that item — try again"))
  break
```

Replace with:
```ts
case "ADD_TO_CART":
  // Demo products: data is embedded in the command — no DB fetch needed
  if (pendingCommand.price !== undefined) {
    addItem({
      id:    pendingCommand.slug,
      name:  pendingCommand.name,
      price: pendingCommand.price,
      slug:  pendingCommand.slug,
      image: pendingCommand.image ?? null,
    })
    toast.success(`${pendingCommand.name} added to cart`)
    break
  }
  // Member products: fetch from DB
  fetch(`/api/product/${pendingCommand.slug}`)
    .then((r) => r.json())
    .then((product) => {
      if (product?.id) {
        addItem({
          id:    product.id,
          name:  product.name,
          price: product.price,
          slug:  product.slug,
          image: product.images ? JSON.parse(product.images)[0] ?? null : null,
        })
        toast.success(`${product.name} added to cart`)
      }
    })
    .catch(() => toast.error("Couldn't add that item — try again"))
  break
```

**Step 4: Check cart store `addItem` type** — make sure it accepts `id: string` (not just number). Check `store/cart.ts`. If `id` is typed as `number`, change the demo path to use `pendingCommand.slug` as a string ID (most cart stores accept string IDs fine).

**Step 5: Manual test**
- Open `/demos/jewelry`, activate Aria, say "add the Gold Bracelet to my cart"
- Cart icon should show 1 item, correct name and price

**Step 6: Commit**
```bash
git add store/aria.ts hooks/useAriaLive.ts components/aria/AriaCommandDispatcher.tsx
git commit -m "Fix demo add-to-cart: use theme product data instead of DB fetch"
```

---

## Task 6: Add `describe_product` voice command ("tell me about X")

**Problem:** `describe_current_product` only works on a product detail page. "Tell me about the Gold Bracelet" from the homepage doesn't work.

**Files:**
- Modify: `hooks/useAriaLive.ts`

**Step 1: Add `describe_product` function declaration**

In `buildAriaConfig`, in the shared functions array (after `describe_current_product`), add:
```ts
{ name: "describe_product",
  description: "Describe any specific product by name — tell the user about it, price, and availability. Use this when the user asks 'tell me about X', 'what is X', 'describe X'.",
  parameters: { type: "OBJECT", properties: {
    slug: { type: "STRING", description: ariaTheme.products }
  }, required: ["slug"] } },
```

**Step 2: Add handler in executeCommand**

After the `describe_current_product` case, add:
```ts
case "describe_product": {
  const slug = args.slug as string
  // Demo context: look up from static theme data
  if (aria().ariaContext === "demo") {
    const theme = THEMES[aria().activeThemeId]
    const p = theme?.products.find(pr => pr.slug === slug)
    if (!p) return "I don't have a product with that name in my catalog."
    const stock = p.inStock === false
      ? "currently out of stock"
      : (p.stockCount !== undefined && p.stockCount <= 5)
        ? `only ${p.stockCount} left`
        : "in stock"
    return `${p.name} — ${p.description}. Priced at $${p.price.toFixed(2)}, ${stock}.`
  }
  // Member context: fetch from DB
  const res = await fetch(`/api/product/${slug}`)
  const p = await res.json()
  if (!p?.id) return "I couldn't find that product."
  const stock = !p.inStock ? "currently out of stock"
    : (p.stockCount !== null && p.stockCount <= 5) ? `only ${p.stockCount} left` : "in stock"
  return `${p.name} — ${p.description ?? "a handcrafted piece"}. Priced at $${p.price.toFixed(2)}, ${stock}.`
}
```

**Step 3: Update system prompt capability list**

In `buildAriaConfig`, in the system prompt's capabilities line, update:
```ts
Your capabilities: navigate pages, filter products, add items to cart, read cart, check stock, describe any product by name or the current page, scroll.
```

And add a silence rule:
```
- describe_product: describe the product warmly in 2-3 sentences. Include price and stock status.
```

**Step 4: Manual test**
- Visit `/demos/bakery`, activate Aria, say "tell me about the Cinnamon Babka"
- Aria should describe it with price from any page

**Step 5: Commit**
```bash
git add hooks/useAriaLive.ts
git commit -m "Add describe_product voice command: tell me about X works from any page"
```

---

## Task 7: Add `navigate_to_product` voice command

**Goal:** "Show me the Gold Bracelet" / "Take me to the Sapphire Ring" navigates to the product detail page.

**Files:**
- Modify: `hooks/useAriaLive.ts`

**Step 1: Add function declaration** (in shared functions array):
```ts
{ name: "navigate_to_product",
  description: "Navigate to a specific product's detail page. Use when the user says 'show me X', 'take me to X', 'open X', 'I want to see X'.",
  parameters: { type: "OBJECT", properties: {
    slug: { type: "STRING", description: ariaTheme.products }
  }, required: ["slug"] } },
```

**Step 2: Add handler in executeCommand** (after `navigate` case):
```ts
case "navigate_to_product":
  dispatchCommand({ type: "NAVIGATE", url: `/products/${args.slug as string}` })
  return undefined
```

**Step 3: Commit**
```bash
git add hooks/useAriaLive.ts
git commit -m "Add navigate_to_product voice command: 'show me the Gold Bracelet'"
```

---

## Task 8: Add `list_all_products` and `recommend_product` voice commands

**Files:**
- Modify: `hooks/useAriaLive.ts`

**Step 1: Add `list_all_products` function declaration**:
```ts
{ name: "list_all_products",
  description: "List all available products with prices. Use when the user asks 'what do you have?', 'show me everything', 'what's on your menu?', 'what are you selling?'",
  parameters: { type: "OBJECT", properties: {} } },
```

**Step 2: Add `list_all_products` handler**:
```ts
case "list_all_products": {
  const theme = THEMES[aria().activeThemeId]
  if (!theme) return "I couldn't load the product catalog."
  const list = theme.products
    .map(p => `${p.name} at $${p.price.toFixed(2)}`)
    .join(", ")
  return `Here's everything we carry: ${list}.`
}
```

**Step 3: Add `recommend_product` function declaration**:
```ts
{ name: "recommend_product",
  description: "Recommend a product. Use when the user asks 'what would you recommend?', 'surprise me', 'what's popular?', 'what's your best seller?', 'help me pick something'.",
  parameters: { type: "OBJECT", properties: {
    budget: { type: "NUMBER", description: "Optional maximum price hint from the user" }
  } } },
```

**Step 4: Add `recommend_product` handler**:
```ts
case "recommend_product": {
  const theme = THEMES[aria().activeThemeId]
  if (!theme) return "I couldn't load the products."
  const budget = args.budget as number | undefined
  const pool = budget
    ? theme.products.filter(p => p.price <= budget && p.inStock !== false)
    : theme.products.filter(p => p.inStock !== false)
  if (pool.length === 0) return "I don't have any products within that budget right now."
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return `I'd recommend the ${pick.name} — ${pick.description} It's $${pick.price.toFixed(2)} and it's one of my favorites.`
}
```

**Step 5: Update system prompt capabilities line** to include new commands.

**Step 6: Update silence rules** in system prompt:
```
- list_all_products: list all products warmly, mention prices naturally.
- recommend_product: speak your recommendation warmly in 2-3 sentences. Be enthusiastic.
- navigate_to_product: execute silently. Say NOTHING.
```

**Step 7: Commit**
```bash
git add hooks/useAriaLive.ts
git commit -m "Add list_all_products and recommend_product voice commands"
```

---

## Task 9: Update all 8 themes' Aria config strings to match renamed brands/products

**Goal:** The `aria.products` string in each theme is what Gemini uses to match spoken names to slugs. After renames, these must stay in sync.

**Files:**
- Modify: `themes/jewelry.ts` — update products string: rename "sapphire-statement-ring" description to "Sapphire Ring"
- Modify: `themes/bakery.ts` — update products string: "Chocolate Éclairs" and "Croissant Box" (no counts)
- Modify: `themes/candy.ts` — update personality string to reference new brand name if mentioned
- Modify: `themes/bakery.ts` — update personality to reference "The Bakery" not "The Flour Studio"
- Modify: `themes/portfolio.ts` — update personality to reference "Photographer's Portfolio"
- Modify: `themes/restaurant.ts` — update personality to reference "Maison Dore Boutique Restaurant"

**Step 1: Jewelry `aria.products` string**

In `themes/jewelry.ts`, find the `products:` line in the `aria:` block and ensure "Sapphire Ring" replaces "Sapphire Statement Ring" in the description (the slug stays the same):
```ts
products: "gold-bracelet-set ($89, Gold Bracelet Set), pearl-drop-earrings ($65, Pearl Drop Earrings), sapphire-statement-ring ($245, Sapphire Ring), diamond-solitaire-pendant ($185, Diamond Solitaire Pendant), rose-gold-chain-necklace ($125), emerald-stud-earrings ($145), vintage-gold-brooch ($75), sterling-silver-cuff ($55)",
```

**Step 2: Bakery `aria.products` string**

Update to remove `(4)` and `(6)`:
```ts
products: "sourdough-boule ($8.50), croissant-box-6 ($14.99, Croissant Box), cinnamon-babka ($16.99), chocolate-eclair-4pack ($18.99, Chocolate Éclairs), almond-croissant ($5.99), pain-au-chocolat ($13.99), kouign-amann ($9.99), seasonal-tart ($12.99)",
```

**Step 3: Update `aria.personality` strings that reference old brand names**

- In `themes/bakery.ts`: replace "The Flour Studio" with "The Bakery" in `personality`
- In `themes/portfolio.ts`: replace "Studio Noir" with "Photographer's Portfolio" in `personality` if present
- In `themes/restaurant.ts`: check and update if "Maison Dore" alone is mentioned

**Step 4: Update platform context system prompt in `hooks/useAriaLive.ts`**

In the platform context `systemPrompt`, update the demo descriptions:
```ts
const systemPrompt = `You are Aria, the AI assistant powering a web-building platform called StoreKit.
...
Available demos:
- jewelry → "Jewelry Store"
- candy → "Sweet Drops Candy Shop"
- bakery → "The Bakery"
- flowers → "Petal & Stem" (also say "Petal and Stem")
- wine → "The Cellar"
- restaurant → "Maison Dore Boutique Restaurant" (also just "Maison Dore")
- portfolio → "Photographer's Portfolio"
- saas → "Velo"
...`
```

**Step 5: Run TypeScript check**
```bash
npx tsc --noEmit
```
Expected: no errors

**Step 6: Commit**
```bash
git add themes/ hooks/useAriaLive.ts
git commit -m "Sync all Aria config strings with renamed brands and products"
```

---

## Suggested Extra Aria Features (propose to user before implementing)

These would make Aria significantly more capable. Suggest after Task 9 is done:

| Feature | Voice trigger | How it works |
|---|---|---|
| `remove_from_cart` | "Remove the X", "Take the X out of my cart" | Dispatch new REMOVE_FROM_CART command, use `removeItem` from cart store |
| `clear_cart` | "Empty my cart", "Clear everything" | `clearCart()` from cart store |
| `price_check` | "How much is the Gold Bracelet?" | Returns price only, no navigation — uses theme data |
| `go_to_checkout` | "Checkout", "I'm ready to buy" | Navigate to `/checkout` |
| `share_this_page` | "Share this", "Copy the link" | `navigator.clipboard.writeText(window.location.href)` |
| `search_products` | "Do you have anything with roses?" | Filter by keyword match across product names/descriptions |

---

## Final: TypeScript check + full manual smoke test

```bash
npx tsc --noEmit
npm run dev
```

Manual checks:
- [ ] No black banners on any page
- [ ] `/demos` listing: all 8 cards show correct names, all images load
- [ ] `/demos/jewelry`: Aria can add to cart, describe product, navigate to product
- [ ] `/demos/bakery`: product names show without `(4)` or `(6)`
- [ ] `/demos/flowers`: all images load including hero card
- [ ] Say "what do you have?" — Aria lists products
- [ ] Say "recommend something" — Aria picks and describes an item
- [ ] Say "tell me about the [product]" — Aria describes from any page
