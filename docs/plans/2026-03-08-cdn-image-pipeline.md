# CDN Image Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all hardcoded Unsplash image URLs with a self-hosted Cloudflare R2 CDN, add an admin media upload UI, and build a terminal Image Scout Agent that uses Gemini 2.5 Flash + Pexels to find and download image candidates for manual review.

**Architecture:** Four layers — (1) `ThemeImage` DB model stores R2 URL overrides per theme/slot, (2) `resolveTheme()` server helper merges static fallbacks with DB overrides so demos always render, (3) `/api/media/upload` handles file→R2→DB in one request, (4) `scripts/image-scout.ts` is a standalone Gemini-powered terminal agent that generates search queries, hits Pexels, and downloads candidates locally. Static theme TS files remain as fallbacks throughout — the DB wins when an override exists.

**Tech Stack:** Next.js 16 App Router, Prisma v5, Neon PostgreSQL, `@aws-sdk/client-s3` (R2 is S3-compatible), `@google/genai` (already installed), Pexels REST API, `node-fetch` / native fetch

---

## Phase 1: R2 Client + DB Schema

### Task 1: Install AWS SDK and create R2 client

**Files:**
- Create: `lib/r2.ts`
- Modify: `package.json` (add dependency)

**Step 1: Install the AWS SDK S3 client**

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
```

Expected: installs cleanly with no peer dep errors.

**Step 2: Create `lib/r2.ts`**

```ts
import { S3Client } from "@aws-sdk/client-s3"

// R2 is S3-compatible — use the standard AWS SDK pointed at Cloudflare's endpoint.
// All env vars are set in .env.local. Never import this file client-side.
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET     = process.env.CLOUDFLARE_R2_BUCKET_NAME!
export const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!

/** Canonical R2 object key for a theme image slot */
export function r2Key(themeId: string, slot: string, ext = "jpg"): string {
  return `themes/${themeId}/${slot}.${ext}`
}

/** Full public URL for an R2 object key */
export function r2Url(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}
```

**Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add lib/r2.ts package.json package-lock.json
git commit -m "Add R2 client (lib/r2.ts) and install @aws-sdk/client-s3"
```

---

### Task 2: Add ThemeImage model to Prisma schema and migrate

**Files:**
- Modify: `prisma/schema.prisma`

**Context:** `ThemeImage` stores one R2 URL per (themeId, slot) pair. `slot` is either `"hero"` or a product slug like `"gold-bracelet-set"`. The `@@unique([themeId, slot])` constraint means upsert-by-slot works cleanly. This table has no `siteId` — it's global demo data shared across all visitors.

**Step 1: Add the model to `prisma/schema.prisma`**

Add after the `AriaMemory` model:

```prisma
model ThemeImage {
  id        String   @id @default(cuid())
  themeId   String   // e.g. "jewelry" | "candy" | "bakery" ...
  slot      String   // "hero" | product slug e.g. "gold-bracelet-set"
  r2Key     String   // object key in R2 bucket e.g. "themes/jewelry/gold-bracelet-set.jpg"
  url       String   // full public CDN URL
  alt       String   @default("")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([themeId, slot])
}
```

**Step 2: Run migration**

```bash
npx prisma migrate dev --name add_theme_image
```

Expected output: `✔  Your database is now in sync with your schema.`

**Step 3: Verify Prisma client regenerated**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "Add ThemeImage model: per-slot R2 URL overrides for theme images"
```

---

## Phase 2: Path A — Backend Migration Script

### Task 3: Create the migration script (fetch Unsplash → upload R2)

**Files:**
- Create: `scripts/migrate-images.ts`
- Modify: `package.json` (add `migrate:images` script)

**Context:** This script runs once. It reads all 8 theme configs, fetches each image URL (currently Unsplash), streams it into R2, then upserts a `ThemeImage` row. Safe to re-run — upsert is idempotent. Skips any slot that already has a `ThemeImage` row unless `--force` flag is passed.

**Step 1: Create `scripts/migrate-images.ts`**

```ts
/**
 * One-time migration: upload all theme images to Cloudflare R2.
 *
 * Usage:
 *   npm run migrate:images              # skip slots already in DB
 *   npm run migrate:images -- --force   # re-upload everything
 *
 * Requires .env.local with all CLOUDFLARE_R2_* keys set.
 */
import "dotenv/config"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2, R2_BUCKET, r2Key, r2Url } from "../lib/r2"
import { THEMES } from "../lib/theme"
import { prisma } from "../lib/db"

const FORCE = process.argv.includes("--force")

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const contentType = res.headers.get("content-type") ?? "image/jpeg"
  const buffer = Buffer.from(await res.arrayBuffer())
  return { buffer, contentType }
}

function extFromContentType(ct: string): string {
  if (ct.includes("png"))  return "png"
  if (ct.includes("webp")) return "webp"
  return "jpg"
}

async function uploadSlot(themeId: string, slot: string, imageUrl: string, alt = "") {
  // Skip if already migrated and not forcing
  if (!FORCE) {
    const existing = await prisma.themeImage.findUnique({ where: { themeId_slot: { themeId, slot } } })
    if (existing) {
      console.log(`  ↩  skip  ${themeId}/${slot} (already in DB)`)
      return
    }
  }

  console.log(`  ↑  upload ${themeId}/${slot}`)
  const { buffer, contentType } = await fetchImageBuffer(imageUrl)
  const ext = extFromContentType(contentType)
  const key = r2Key(themeId, slot, ext)

  await r2.send(new PutObjectCommand({
    Bucket:      R2_BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }))

  const url = r2Url(key)
  await prisma.themeImage.upsert({
    where:  { themeId_slot: { themeId, slot } },
    update: { r2Key: key, url, alt },
    create: { themeId, slot, r2Key: key, url, alt },
  })
  console.log(`  ✓  done  ${url}`)
}

async function main() {
  console.log(`\nMigrating theme images to R2${FORCE ? " (force mode)" : ""}...\n`)
  let total = 0

  for (const [themeId, theme] of Object.entries(THEMES)) {
    console.log(`\n[${themeId}]`)

    // Hero
    await uploadSlot(themeId, "hero", theme.hero.image, theme.hero.imageAlt)
    total++

    // Products
    for (const product of theme.products) {
      await uploadSlot(themeId, product.slug, product.image, product.name)
      total++
    }
  }

  console.log(`\n✓ Migration complete — ${total} slots processed.\n`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

**Step 2: Add npm script to `package.json`**

In the `"scripts"` block, add:
```json
"migrate:images": "tsx --env-file=.env.local scripts/migrate-images.ts"
```

**Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add scripts/migrate-images.ts package.json
git commit -m "Add migrate:images script: upload all theme images to R2"
```

> **Note:** Do NOT run `npm run migrate:images` yet — wait until after Task 4 (theme resolution) so the app immediately benefits from the migration when it runs.

---

### Task 4: Create theme image resolver (DB overrides merge with static fallbacks)

**Files:**
- Create: `lib/themeImages.ts`

**Context:** Every page that shows theme images must call `resolveTheme(themeId)` on the server. It returns a `ThemeConfig` where image URLs are replaced with R2 URLs when a `ThemeImage` row exists. Static TS fallbacks remain when no DB override exists — so the demos never break mid-migration.

**Step 1: Create `lib/themeImages.ts`**

```ts
import { prisma } from "@/lib/db"
import { THEMES, type ThemeConfig } from "@/lib/theme"

/**
 * Returns a ThemeConfig with image URLs replaced by R2 CDN URLs where available.
 * Falls back to static theme data when no DB override exists.
 * Server-only — never import in client components.
 */
export async function resolveTheme(themeId: string): Promise<ThemeConfig> {
  const base = THEMES[themeId]
  if (!base) throw new Error(`Unknown themeId: ${themeId}`)

  const overrides = await prisma.themeImage.findMany({ where: { themeId } })
  if (overrides.length === 0) return base

  const bySlot = new Map(overrides.map((r) => [r.slot, r.url]))

  return {
    ...base,
    hero: {
      ...base.hero,
      image: bySlot.get("hero") ?? base.hero.image,
    },
    products: base.products.map((p) => ({
      ...p,
      image: bySlot.get(p.slug) ?? p.image,
    })),
  }
}

/**
 * Returns only the image URL overrides as a plain map — useful for
 * lightweight reads (e.g. admin media page).
 */
export async function getThemeImageMap(themeId: string): Promise<Map<string, { url: string; r2Key: string }>> {
  const rows = await prisma.themeImage.findMany({ where: { themeId } })
  return new Map(rows.map((r) => [r.slot, { url: r.url, r2Key: r.r2Key }]))
}
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 3: Update demo pages to use `resolveTheme`**

In `app/demos/[themeId]/page.tsx` (and any other demo page server components that currently call `THEMES[themeId]` directly), replace:

```ts
// Before
const theme = THEMES[themeId]
```

With:

```ts
// After
import { resolveTheme } from "@/lib/themeImages"
const theme = await resolveTheme(themeId)
```

Find all demo server pages that need this:

```bash
grep -r "THEMES\[" app/demos/ --include="*.tsx" -l
```

Update each file found.

**Step 4: TypeScript check again**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add lib/themeImages.ts app/demos/
git commit -m "Add resolveTheme(): DB image overrides with static fallbacks"
```

**Step 6: Now run the migration**

```bash
npm run migrate:images
```

Expected: each theme's hero + 8 products uploads (72 slots total). Watch for any fetch errors — note the slot names, fix the source URL if needed.

---

## Phase 3: Path B — Admin Upload UI

### Task 5: Create `/api/media/upload` route

**Files:**
- Create: `app/api/media/upload/route.ts`

**Context:** Accepts `multipart/form-data` with fields `file` (the image), `themeId`, `slot`, and `alt`. Uploads to R2 at `themes/{themeId}/{slot}.{ext}`, then upserts the `ThemeImage` row. Returns `{ url }`. Requires admin auth. Max file size: 5MB enforced server-side.

**Step 1: Create `app/api/media/upload/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2, R2_BUCKET, r2Key, r2Url } from "@/lib/r2"
import { prisma } from "@/lib/db"

const MAX_BYTES = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const form = await req.formData()
  const file    = form.get("file")    as File   | null
  const themeId = form.get("themeId") as string | null
  const slot    = form.get("slot")    as string | null
  const alt     = (form.get("alt")    as string | null) ?? ""

  if (!file || !themeId || !slot) {
    return NextResponse.json({ error: "file, themeId, and slot are required" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large — max 5MB" }, { status: 413 })
  }

  const validThemes = ["jewelry","candy","bakery","flowers","wine","restaurant","portfolio","saas"]
  if (!validThemes.includes(themeId)) {
    return NextResponse.json({ error: "Invalid themeId" }, { status: 400 })
  }

  const contentType = file.type || "image/jpeg"
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"
  const key = r2Key(themeId, slot, ext)
  const buffer = Buffer.from(await file.arrayBuffer())

  await r2.send(new PutObjectCommand({
    Bucket:       R2_BUCKET,
    Key:          key,
    Body:         buffer,
    ContentType:  contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }))

  const url = r2Url(key)

  await prisma.themeImage.upsert({
    where:  { themeId_slot: { themeId, slot } },
    update: { r2Key: key, url, alt },
    create: { themeId, slot, r2Key: key, url, alt },
  })

  return NextResponse.json({ ok: true, url })
}
```

**Step 2: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add app/api/media/upload/route.ts
git commit -m "Add /api/media/upload: file → R2 → ThemeImage upsert"
```

---

### Task 6: Build Admin Media page

**Files:**
- Create: `app/admin/media/page.tsx`
- Modify: `components/admin/AdminNav.tsx`

**Context:** The page renders a grid of all 8 themes. Selecting a theme shows 9 upload slots (1 hero + 8 products). Each slot shows the current image (from DB or static fallback), a "Replace" button that opens a file picker, and a drag-drop overlay. On upload, it calls `/api/media/upload`, then refreshes the slot image. No page reload — uses React state.

**Step 1: Read `components/admin/AdminNav.tsx` to understand the nav structure before editing**

```bash
cat components/admin/AdminNav.tsx
```

**Step 2: Create `app/admin/media/page.tsx`**

```tsx
"use client"

import { useState, useRef, useTransition } from "react"
import Image from "next/image"
import { THEMES } from "@/lib/theme"

const THEME_IDS = Object.keys(THEMES)

type SlotImages = Record<string, string> // slot → current URL

export default function AdminMediaPage() {
  const [activeTheme, setActiveTheme] = useState<string>("jewelry")
  const [slotImages, setSlotImages]   = useState<SlotImages>({})
  const [uploading, setUploading]     = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingSlot  = useRef<string | null>(null)
  const [, startTransition] = useTransition()

  const theme = THEMES[activeTheme]

  const slots = [
    { slot: "hero", label: "Hero Image", defaultImg: theme.hero.image },
    ...theme.products.map((p) => ({ slot: p.slug, label: p.name, defaultImg: p.image })),
  ]

  function currentUrl(slot: string, defaultImg: string): string {
    return slotImages[`${activeTheme}:${slot}`] ?? defaultImg
  }

  async function uploadFile(slot: string, file: File) {
    setUploading(slot)
    setError(null)
    const form = new FormData()
    form.append("file",    file)
    form.append("themeId", activeTheme)
    form.append("slot",    slot)
    form.append("alt",     slot)

    try {
      const res  = await fetch("/api/media/upload", { method: "POST", body: form })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      if (data.url) {
        startTransition(() => {
          setSlotImages((prev) => ({ ...prev, [`${activeTheme}:${slot}`]: data.url! }))
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(null)
    }
  }

  function openPicker(slot: string) {
    pendingSlot.current = slot
    fileInputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const slot = pendingSlot.current
    if (file && slot) uploadFile(slot, file)
    e.target.value = ""
  }

  function onDrop(slot: string, e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(slot, file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif text-ink mb-1">Media Library</h2>
        <p className="text-xs text-ink/50">Upload images to Cloudflare R2. Changes apply to all demo visitors immediately.</p>
      </div>

      {/* Theme tabs */}
      <div className="flex flex-wrap gap-2">
        {THEME_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setActiveTheme(id)}
            className={`px-3 py-1 text-xs rounded-full border transition ${
              activeTheme === id
                ? "bg-ink text-white border-ink"
                : "border-ink/20 text-ink/60 hover:border-ink/40"
            }`}
          >
            {THEMES[id].brand.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      {/* Slot grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {slots.map(({ slot, label, defaultImg }) => {
          const imgUrl   = currentUrl(slot, defaultImg)
          const isUploading = uploading === slot

          return (
            <div
              key={slot}
              className="group relative border border-ink/10 rounded-lg overflow-hidden bg-stone-100 cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(slot, e)}
              onClick={() => openPicker(slot)}
            >
              <div className="aspect-square relative">
                <Image
                  src={imgUrl}
                  alt={label}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                  {isUploading ? "Uploading…" : "Replace"}
                </span>
              </div>
              <div className="px-2 py-1.5 bg-white border-t border-ink/10">
                <p className="text-[11px] text-ink/70 truncate">{label}</p>
                <p className="text-[10px] text-ink/30 font-mono truncate">{slot}</p>
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  )
}
```

**Step 3: Add "Media" link to `components/admin/AdminNav.tsx`**

Read the file first, then add a `{ href: "/admin/media", label: "Media" }` entry to the nav items array following the same pattern as existing items.

**Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 5: Manual test**

- Visit `/admin/media`
- Select any theme tab — 9 slots (1 hero + 8 products) appear with current images
- Drag an image onto a slot OR click "Replace" → file picker opens → upload → slot image updates without page reload

**Step 6: Commit**

```bash
git add app/admin/media/page.tsx components/admin/AdminNav.tsx
git commit -m "Add admin media page: per-slot image upload to R2 with drag-drop"
```

---

## Phase 4: Validate Themes Script Update

### Task 7: Add URL-format check to validate:themes

**Files:**
- Modify: `scripts/validate-themes.ts`

**Context:** After migration, all product image URLs should point to R2 (`CLOUDFLARE_R2_PUBLIC_URL`), not Unsplash. Add an optional `--strict` flag that warns when Unsplash URLs are still present. This doesn't block the script — it's a reminder.

**Step 1: Add the check in `scripts/validate-themes.ts`**

After the existing checks, add inside each theme loop:

```ts
const STRICT = process.argv.includes("--strict")

// Inside the per-theme loop, after existing checks:
if (STRICT) {
  check("no product images still pointing at Unsplash", () => {
    const unsplash = theme.products.filter(p => p.image.includes("unsplash.com"))
    assert.deepEqual(
      unsplash.map(p => p.name),
      [],
      `Still on Unsplash: ${unsplash.map(p => p.name).join(", ")}`
    )
  })
}
```

**Step 2: Add to `package.json`**

```json
"validate:themes:strict": "tsx scripts/validate-themes.ts --strict"
```

**Step 3: Run to confirm current state (before migration, should warn on all)**

```bash
npm run validate:themes:strict
```

Expected: all Unsplash warnings visible. After `npm run migrate:images`, run again — all should pass.

**Step 4: Commit**

```bash
git add scripts/validate-themes.ts package.json
git commit -m "Add --strict flag to validate:themes: warns on remaining Unsplash URLs"
```

---

## Phase 5: Image Scout Agent

### Task 8: Create the Image Scout agent core

**Files:**
- Create: `scripts/image-scout.ts`
- Create: `scripts/image-scout-prompt.ts`
- Modify: `package.json`

**Context:** The agent has two stages. Stage 1: Gemini 2.5 Flash reads each theme's products and generates optimized Pexels search queries — 3 per product, chosen to maximise accuracy given the store's aesthetic. Stage 2: For each query, the script calls the Pexels API, downloads the top 2 images per query (6 candidates per slot), and saves them to `media/candidates/{themeId}/{slot}/001.jpg`. All heavy logic lives in `image-scout.ts`; the prompt template is isolated in `image-scout-prompt.ts` so it's easy to iterate on independently.

**Step 1: Create `scripts/image-scout-prompt.ts`**

```ts
/**
 * Prompt template for the Image Scout Gemini agent.
 *
 * Design principles:
 * - Queries must be 2-5 words (Pexels performs best on short, precise queries)
 * - Focus on SUBJECT (what the product IS), not adjectives
 * - Prioritise product-on-white or clean background photography
 * - Avoid lifestyle shots with people unless the product IS a person (portraits)
 * - Match the aesthetic descriptor of the store
 * - Generate query VARIETY — don't just rephrase the same query 3 times
 */

export interface ScoutProduct {
  slot:        string  // "hero" | product slug
  name:        string
  description: string
}

export interface ScoutTheme {
  themeId:   string
  aesthetic: string  // e.g. "dark, moody, luxury fine jewelry"
  products:  ScoutProduct[]
}

export function buildScoutPrompt(theme: ScoutTheme): string {
  const productLines = theme.products
    .map((p) => `- slot: "${p.slot}" | name: "${p.name}" | description: "${p.description}"`)
    .join("\n")

  return `You are an expert image curator for a demo e-commerce platform called StoreKit.

Store: ${theme.themeId}
Aesthetic: ${theme.aesthetic}

Your job is to generate Pexels search queries for each product slot listed below.
Each query will be sent to the Pexels API to find real stock photography.

RULES:
1. Each slot gets exactly 3 queries.
2. Queries must be 2-5 words — short and precise beats long and descriptive on Pexels.
3. Focus on the subject itself. NOT adjectives. "sourdough bread loaf" beats "rustic artisan freshly baked bread".
4. The 3 queries per slot must be meaningfully different (not rephrases):
   - Query 1: the product subject directly (e.g. "sourdough bread")
   - Query 2: the product in context (e.g. "bread bakery counter")
   - Query 3: an aesthetic/mood angle (e.g. "artisan bread closeup")
5. For "hero" slots: return queries for a wide atmospheric shot, not a product shot.
6. Avoid queries that commonly return: people's faces, restaurant dining rooms, generic office stock.
7. Match the store aesthetic — a fine jewelry store wants dark, moody, minimal; a candy shop wants bright, colorful.

Products:
${productLines}

Respond ONLY with valid JSON in this exact shape (no markdown, no explanation):
[
  { "slot": "hero", "queries": ["...", "...", "..."] },
  { "slot": "gold-bracelet-set", "queries": ["...", "...", "..."] }
]`
}

/** Aesthetic descriptions for each theme — tuned for Pexels query effectiveness */
export const THEME_AESTHETICS: Record<string, string> = {
  jewelry:    "dark moody minimal, luxury product photography, black or dark background",
  candy:      "bright colorful playful, white or pastel background, overhead flat lay",
  bakery:     "warm natural light, rustic wood surfaces, food photography closeup",
  flowers:    "soft light pastel tones, botanical, fresh flowers on white or light surface",
  wine:       "dark elegant, moody cellar, dramatic lighting, bottle photography",
  restaurant: "fine dining plated food, restaurant photography, dramatic lighting",
  portfolio:  "photography studio, camera equipment, editorial, black and white option",
  saas:       "clean tech, laptop code, dashboard UI, minimal white or dark background",
}
```

**Step 2: Create `scripts/image-scout.ts`**

```ts
/**
 * Image Scout — Gemini 2.5 Flash + Pexels API
 *
 * Usage:
 *   npm run scout                     # all themes, all slots
 *   npm run scout -- --theme jewelry  # one theme only
 *   npm run scout -- --slot hero      # hero slots only across all themes
 *
 * Downloads 3-6 candidates per slot into:
 *   media/candidates/{themeId}/{slot}/001.jpg
 *
 * After reviewing, move chosen files to:
 *   media/approved/{themeId}/{slot}.jpg
 *
 * Then run: npm run upload:approved
 */
import "dotenv/config"
import fs   from "node:fs"
import path from "node:path"
import { GoogleGenAI }  from "@google/genai"
import { THEMES }       from "../lib/theme"
import { buildScoutPrompt, THEME_AESTHETICS, type ScoutTheme } from "./image-scout-prompt"

const genai      = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
const PEXELS_KEY = process.env.PEXEL_API_KEY!
const OUT_BASE   = path.join(process.cwd(), "media", "candidates")

// ── CLI args ──────────────────────────────────────────────────────────────
const ARG_THEME = (() => { const i = process.argv.indexOf("--theme"); return i !== -1 ? process.argv[i+1] : null })()
const ARG_SLOT  = (() => { const i = process.argv.indexOf("--slot");  return i !== -1 ? process.argv[i+1] : null })()

// ── Gemini query generation ───────────────────────────────────────────────
async function generateQueries(theme: ScoutTheme): Promise<{ slot: string; queries: string[] }[]> {
  const prompt = buildScoutPrompt(theme)
  const model  = genai.models
  const res = await model.generateContent({
    model:    "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  })
  const text = res.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]"
  // Strip markdown fences if present
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
  return JSON.parse(clean) as { slot: string; queries: string[] }[]
}

// ── Pexels search ─────────────────────────────────────────────────────────
interface PexelsPhoto {
  id: number
  src: { large: string; medium: string }
  photographer: string
}

async function searchPexels(query: string, perPage = 2): Promise<PexelsPhoto[]> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&size=medium`
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } })
  if (!res.ok) throw new Error(`Pexels error ${res.status} for query: "${query}"`)
  const data = await res.json() as { photos: PexelsPhoto[] }
  return data.photos ?? []
}

// ── Download image to disk ────────────────────────────────────────────────
async function downloadImage(url: string, dest: string): Promise<void> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, buf)
}

// ── Main ──────────────────────────────────────────────────────────────────
async function scoutTheme(themeId: string) {
  const theme = THEMES[themeId]
  if (!theme) { console.error(`Unknown theme: ${themeId}`); return }

  console.log(`\n[${themeId}] Generating queries via Gemini 2.5 Flash...`)

  const slots: ScoutTheme["products"] = [
    { slot: "hero", name: "Hero Image", description: theme.hero.headline + " — " + theme.hero.subline },
    ...theme.products.map((p) => ({ slot: p.slug, name: p.name, description: p.description })),
  ].filter((s) => !ARG_SLOT || s.slot === ARG_SLOT)

  if (slots.length === 0) { console.log(`  No matching slots for --slot ${ARG_SLOT}`); return }

  const scoutThemeData: ScoutTheme = {
    themeId,
    aesthetic: THEME_AESTHETICS[themeId] ?? "clean, professional product photography",
    products:  slots,
  }

  const queryGroups = await generateQueries(scoutThemeData)
  console.log(`  Generated queries for ${queryGroups.length} slots`)

  for (const { slot, queries } of queryGroups) {
    console.log(`\n  [${slot}]`)
    let candidateIndex = 1

    for (const query of queries) {
      console.log(`    Search: "${query}"`)
      const photos = await searchPexels(query, 2)

      for (const photo of photos) {
        const dest = path.join(OUT_BASE, themeId, slot, `${String(candidateIndex).padStart(3, "0")}.jpg`)
        await downloadImage(photo.src.large, dest)
        console.log(`      ↓ ${dest.replace(process.cwd(), ".")} (by ${photo.photographer})`)
        candidateIndex++
      }

      // Pexels rate limit — be polite
      await new Promise((r) => setTimeout(r, 300))
    }
  }
}

async function main() {
  fs.mkdirSync(OUT_BASE, { recursive: true })

  const themeIds = ARG_THEME
    ? [ARG_THEME]
    : Object.keys(THEMES)

  for (const themeId of themeIds) {
    await scoutTheme(themeId)
  }

  console.log(`\n✓ Scout complete. Review images in media/candidates/ then move chosen to media/approved/\n`)
}

main().catch((e) => { console.error(e); process.exit(1) })
```

**Step 3: Add npm scripts to `package.json`**

```json
"scout": "tsx --env-file=.env.local scripts/image-scout.ts"
```

**Step 4: Create `.gitignore` entry for downloaded media**

Add to `.gitignore`:
```
# Image scout downloads — not committed, uploaded to R2 directly
media/candidates/
media/approved/
```

**Step 5: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add scripts/image-scout.ts scripts/image-scout-prompt.ts package.json .gitignore
git commit -m "Add image-scout agent: Gemini 2.5 Flash + Pexels downloads image candidates"
```

---

### Task 9: Create the upload-approved script

**Files:**
- Create: `scripts/upload-approved.ts`
- Modify: `package.json`

**Context:** After the user reviews `media/candidates/` and moves chosen images to `media/approved/{themeId}/{slot}.jpg`, this script uploads each file to R2 and upserts the `ThemeImage` row. The naming convention `{slot}.jpg` in the approved folder is the contract — the script derives themeId from the folder name and slot from the filename.

**Step 1: Create `scripts/upload-approved.ts`**

```ts
/**
 * Upload approved images to R2 and update ThemeImage in DB.
 *
 * File convention:
 *   media/approved/{themeId}/{slot}.jpg   ← your approved image
 *
 * Usage:
 *   npm run upload:approved
 *   npm run upload:approved -- --theme bakery   # one theme only
 */
import "dotenv/config"
import fs   from "node:fs"
import path from "node:path"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2, R2_BUCKET, r2Key, r2Url } from "../lib/r2"
import { prisma } from "../lib/db"

const APPROVED_DIR = path.join(process.cwd(), "media", "approved")
const ARG_THEME    = (() => { const i = process.argv.indexOf("--theme"); return i !== -1 ? process.argv[i+1] : null })()

function mimeFromExt(ext: string): string {
  if (ext === "png")  return "image/png"
  if (ext === "webp") return "image/webp"
  return "image/jpeg"
}

async function main() {
  if (!fs.existsSync(APPROVED_DIR)) {
    console.log("No media/approved/ directory found. Nothing to upload.")
    return
  }

  const themeDirs = fs.readdirSync(APPROVED_DIR).filter((d) => {
    if (ARG_THEME && d !== ARG_THEME) return false
    return fs.statSync(path.join(APPROVED_DIR, d)).isDirectory()
  })

  let uploaded = 0

  for (const themeId of themeDirs) {
    console.log(`\n[${themeId}]`)
    const themeDir = path.join(APPROVED_DIR, themeId)
    const files = fs.readdirSync(themeDir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))

    for (const file of files) {
      const ext  = path.extname(file).replace(".", "").toLowerCase()
      const slot = path.basename(file, path.extname(file)) // filename without ext = slot
      const key  = r2Key(themeId, slot, ext === "jpeg" ? "jpg" : ext)
      const mime = mimeFromExt(ext === "jpeg" ? "jpg" : ext)

      console.log(`  ↑ upload ${themeId}/${slot}`)
      const buffer = fs.readFileSync(path.join(themeDir, file))

      await r2.send(new PutObjectCommand({
        Bucket:       R2_BUCKET,
        Key:          key,
        Body:         buffer,
        ContentType:  mime,
        CacheControl: "public, max-age=31536000, immutable",
      }))

      const url = r2Url(key)
      await prisma.themeImage.upsert({
        where:  { themeId_slot: { themeId, slot } },
        update: { r2Key: key, url },
        create: { themeId, slot, r2Key: key, url, alt: slot },
      })

      console.log(`  ✓ ${url}`)
      uploaded++
    }
  }

  console.log(`\n✓ Uploaded ${uploaded} approved image(s).\n`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

**Step 2: Add npm script**

```json
"upload:approved": "tsx --env-file=.env.local scripts/upload-approved.ts"
```

**Step 3: TypeScript check**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add scripts/upload-approved.ts package.json
git commit -m "Add upload:approved script: move reviewed images from local folder to R2"
```

---

### Task 10: Test the full scout pipeline end-to-end

**Goal:** Confirm the full flow works: scout one theme → review candidates → approve one image → upload-approved → verify ThemeImage row in DB → visit demo page → see new image.

**Step 1: Run scout for one theme**

```bash
npm run scout -- --theme bakery
```

Expected: `media/candidates/bakery/` populated with ~54 images (9 slots × ~6 candidates).

**Step 2: Review and approve one image**

```bash
mkdir -p media/approved/bakery
# Copy your favourite hero candidate
cp media/candidates/bakery/hero/001.jpg media/approved/bakery/hero.jpg
```

**Step 3: Upload approved**

```bash
npm run upload:approved -- --theme bakery
```

Expected output: `✓ https://pub-xxx.r2.dev/themes/bakery/hero.jpg`

**Step 4: Verify in DB**

```bash
npx prisma studio
```

Open `ThemeImage` table → confirm row with `themeId=bakery, slot=hero` exists with correct URL.

**Step 5: Visit `/demos/bakery`**

The hero image should now load from R2, not Unsplash.

**Step 6: Run full validation**

```bash
npm run validate:themes
npm run validate:themes:strict   # will still warn about non-bakery Unsplash URLs
```

---

## Full Pipeline Summary

```
npm run scout [-- --theme X] [-- --slot Y]
   → media/candidates/{themeId}/{slot}/001.jpg ... 006.jpg

   [manual review — pick best images]

cp media/candidates/X/Y/002.jpg media/approved/X/Y.jpg

npm run upload:approved [-- --theme X]
   → R2 upload + ThemeImage DB upsert

npm run validate:themes:strict
   → confirm no Unsplash URLs remain

[Admin UI alternative: /admin/media → drag-drop → live update]
```

## Image Source Guide for the Scout Agent

| Source | Best for | Notes |
|---|---|---|
| **Pexels** (primary) | All product categories | Free commercial license, clean API, consistent quality |
| **Unsplash** (pending API) | Hero images, lifestyle shots | Higher artistic quality than Pexels for atmospherics |
| **Pixabay** (optional) | Fallback, food/objects | Add `PIXABAY_API_KEY` to .env.local and a second search pass |

To add Unsplash search once your account is approved: in `image-scout.ts`, add a second search function after `searchPexels`:

```ts
async function searchUnsplash(query: string, perPage = 2) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } })
  const data = await res.json() as { results: { urls: { regular: string } }[] }
  return data.results
}
```

Then call both `searchPexels` and `searchUnsplash` per query and pool the results.
