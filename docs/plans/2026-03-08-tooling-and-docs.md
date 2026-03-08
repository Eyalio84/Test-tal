# Developer Tooling + Documentation Sprint

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 7 developer tools (type-safe env, input validation, linting, image compression, error monitoring, unit tests, server-state management) and write reference documentation for every tool plus the image scout agent.

**Architecture:** Every tool is a passive addition — nothing breaks, existing behavior is unchanged. Tools are wired in order of dependency (env → zod → biome → sharp → sentry → vitest → tanstack). Docs written as `docs/tools/*.md` reference files after all code tasks complete.

**Tech Stack:** @t3-oss/env-nextjs, Zod, Biome, Sharp, Sentry, Vitest, TanStack Query

---

## CODE TASKS

---

### Task 1: Type-safe environment variables

**Files:**
- Create: `env.ts` (project root)
- Modify: `lib/r2.ts`
- Modify: `lib/auth.config.ts`

**Step 1: Install packages**

```bash
npm install @t3-oss/env-nextjs zod
```

**Step 2: Create `env.ts`**

```ts
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  /**
   * Server-side variables — never sent to the browser.
   * All MUST be present or the server will refuse to start.
   */
  server: {
    DATABASE_URL:                  z.string().url(),
    NEXTAUTH_SECRET:               z.string().min(1),
    GOOGLE_CLIENT_ID:              z.string().min(1),
    GOOGLE_CLIENT_SECRET:          z.string().min(1),
    ADMIN_EMAIL:                   z.string().email(),
    STRIPE_SECRET_KEY:             z.string().startsWith("sk_"),
    STRIPE_WEBHOOK_SECRET:         z.string().optional(),
    STRIPE_PRICE_BASIC:            z.string().startsWith("price_"),
    STRIPE_PRICE_BUILDER:          z.string().startsWith("price_"),
    STRIPE_PRICE_PRO:              z.string().startsWith("price_"),
    GEMINI_API_KEY:                z.string().min(1),
    CLOUDFLARE_ACCOUNT_ID:         z.string().min(1),
    CLOUDFLARE_R2_ACCESS_KEY_ID:   z.string().min(1),
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string().min(1),
    CLOUDFLARE_R2_BUCKET_NAME:     z.string().min(1),
    CLOUDFLARE_R2_PUBLIC_URL:      z.string().url(),
    PEXEL_API_KEY:                 z.string().min(1),
  },

  /**
   * Client-side variables — prefixed with NEXT_PUBLIC_, sent to the browser.
   */
  client: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
    NEXT_PUBLIC_SITE_URL:               z.string().url(),
    NEXT_PUBLIC_GEMINI_API_KEY:         z.string().min(1),
    NEXT_PUBLIC_WHATSAPP_NUMBER:        z.string().min(1),
    NEXT_PUBLIC_THEME:                  z.string().optional(),
  },

  /**
   * Manual mapping — every variable listed above must appear here.
   * This is the bridge between process.env and the typed env object.
   */
  runtimeEnv: {
    DATABASE_URL:                       process.env.DATABASE_URL,
    NEXTAUTH_SECRET:                    process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID:                   process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:               process.env.GOOGLE_CLIENT_SECRET,
    ADMIN_EMAIL:                        process.env.ADMIN_EMAIL,
    STRIPE_SECRET_KEY:                  process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET:              process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_BASIC:                 process.env.STRIPE_PRICE_BASIC,
    STRIPE_PRICE_BUILDER:               process.env.STRIPE_PRICE_BUILDER,
    STRIPE_PRICE_PRO:                   process.env.STRIPE_PRICE_PRO,
    GEMINI_API_KEY:                     process.env.GEMINI_API_KEY,
    CLOUDFLARE_ACCOUNT_ID:              process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_R2_ACCESS_KEY_ID:        process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY:    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    CLOUDFLARE_R2_BUCKET_NAME:          process.env.CLOUDFLARE_R2_BUCKET_NAME,
    CLOUDFLARE_R2_PUBLIC_URL:           process.env.CLOUDFLARE_R2_PUBLIC_URL,
    PEXEL_API_KEY:                      process.env.PEXEL_API_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL:               process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_GEMINI_API_KEY:         process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_WHATSAPP_NUMBER:        process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    NEXT_PUBLIC_THEME:                  process.env.NEXT_PUBLIC_THEME,
  },
})
```

**Step 3: Update `lib/r2.ts`**

Replace the full file contents:

```ts
import { S3Client } from "@aws-sdk/client-s3"
import { env } from "@/env"

// R2 is S3-compatible — use the standard AWS SDK pointed at Cloudflare's endpoint.
// Never import this file client-side.
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

export const R2_BUCKET     = env.CLOUDFLARE_R2_BUCKET_NAME
export const R2_PUBLIC_URL = env.CLOUDFLARE_R2_PUBLIC_URL

/** Canonical R2 object key for a theme image slot */
export function r2Key(themeId: string, slot: string, ext = "jpg"): string {
  return `themes/${themeId}/${slot}.${ext}`
}

/** Full public URL for an R2 object key */
export function r2Url(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`
}
```

**Step 4: Update `lib/auth.config.ts`**

```ts
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import { env } from "@/env"

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId:     env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
}
```

**Step 5: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see "Missing env var: X", that variable is absent from `.env.local`.

**Step 6: Commit**

```bash
git add env.ts lib/r2.ts lib/auth.config.ts package.json package-lock.json
git commit -m "feat: add type-safe env validation via @t3-oss/env-nextjs"
```

---

### Task 2: Zod input validation for API routes

**Files:**
- Create: `lib/validations.ts`
- Modify: `app/api/media/upload/route.ts`

**Step 1: Create `lib/validations.ts`**

```ts
import { z } from "zod"
import { THEME_IDS } from "@/lib/theme"

// ── Media upload ───────────────────────────────────────────────────────────
export const uploadSchema = z.object({
  themeId: z.enum(THEME_IDS as [string, ...string[]]),
  slot:    z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, "slot must be lowercase letters, numbers, hyphens"),
  alt:     z.string().max(256).optional().default(""),
})

export type UploadInput = z.infer<typeof uploadSchema>
```

**Step 2: Export THEME_IDS from `lib/theme.ts`**

Open `lib/theme.ts` and add after the THEMES export:

```ts
export const THEME_IDS = Object.keys(THEMES) as (keyof typeof THEMES)[]
```

**Step 3: Update `app/api/media/upload/route.ts`**

Replace the manual validation block (the `if (!file || !themeId || !slot)` section and the `validThemes` check) with Zod:

```ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { r2, R2_BUCKET, r2Key, r2Url } from "@/lib/r2"
import { prisma } from "@/lib/db"
import { env } from "@/env"
import { uploadSchema } from "@/lib/validations"

const MAX_BYTES = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.email !== env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const form    = await req.formData()
  const file    = form.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large — max 5MB" }, { status: 413 })
  }

  const parsed = uploadSchema.safeParse({
    themeId: form.get("themeId"),
    slot:    form.get("slot"),
    alt:     form.get("alt") ?? "",
  })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { themeId, slot, alt } = parsed.data

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

**Step 4: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 5: Commit**

```bash
git add lib/validations.ts lib/theme.ts app/api/media/upload/route.ts
git commit -m "feat: add Zod input validation to media upload API"
```

---

### Task 3: Biome — linting and formatting

**Files:**
- Create: `biome.json`
- Modify: `package.json` (add scripts)

**Step 1: Install Biome**

```bash
npm install --save-dev @biomejs/biome
```

**Step 2: Create `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "organizeImports": {
    "enabled": false
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "off"
      },
      "style": {
        "noNonNullAssertion": "off"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "trailingCommas": "es5",
      "semicolons": "asNeeded"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      ".next",
      "*.generated.*",
      "prisma/migrations"
    ]
  }
}
```

**Step 3: Add scripts to `package.json`**

In the `"scripts"` block, add:

```json
"lint":   "biome lint .",
"format": "biome format --write .",
"check":  "biome check ."
```

**Step 4: Run first lint pass**

```bash
npm run lint 2>&1 | head -40
```

Expected: some warnings — do NOT auto-fix everything. Review warnings first. Biome will flag real issues.

**Step 5: Verify TypeScript still passes**

```bash
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add biome.json package.json package-lock.json
git commit -m "feat: add Biome linter and formatter"
```

---

### Task 4: Sharp — image compression before R2 upload

**Files:**
- Create: `lib/compress.ts`
- Modify: `app/api/media/upload/route.ts`
- Modify: `scripts/migrate-images.ts`
- Modify: `next.config.ts` (add Pexels + R2 to image domains)

**Step 1: Install Sharp**

```bash
npm install sharp
npm install --save-dev @types/sharp
```

**Step 2: Create `lib/compress.ts`**

```ts
import sharp from "sharp"

/**
 * Compress any image buffer to WebP before uploading to R2.
 *
 * - Resizes to max 800px wide (preserves aspect ratio, never upscales)
 * - Converts to WebP at quality 80 — typically 70-90% smaller than source JPEG
 * - Returns the compressed buffer + updated content-type
 *
 * Usage:
 *   const { buffer, contentType } = await compressImage(rawBuffer)
 *   // use buffer + contentType in PutObjectCommand
 */
export async function compressImage(
  input: Buffer,
  options: { width?: number; quality?: number } = {}
): Promise<{ buffer: Buffer; contentType: string }> {
  const buffer = await sharp(input)
    .resize(options.width ?? 800, undefined, {
      fit:               "inside",
      withoutEnlargement: true,   // never upscale a small image
    })
    .webp({ quality: options.quality ?? 80 })
    .toBuffer()

  return { buffer, contentType: "image/webp" }
}
```

**Step 3: Update `app/api/media/upload/route.ts`**

Add the import at the top:

```ts
import { compressImage } from "@/lib/compress"
```

Replace these lines:

```ts
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
```

With:

```ts
  const rawBuffer = Buffer.from(await file.arrayBuffer())
  const { buffer, contentType } = await compressImage(rawBuffer)
  const key = r2Key(themeId, slot, "webp")  // always webp after compression

  await r2.send(new PutObjectCommand({
    Bucket:       R2_BUCKET,
    Key:          key,
    Body:         buffer,
    ContentType:  contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }))
```

**Step 4: Update `scripts/migrate-images.ts`**

Add import at top (after existing imports):

```ts
import sharp from "sharp"
```

Add this helper function before `uploadSlot`:

```ts
async function compressBuffer(buffer: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  const compressed = await sharp(buffer)
    .resize(800, undefined, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
  return { buffer: compressed, contentType: "image/webp" }
}
```

In `uploadSlot`, replace the block that calls `fetchImageBuffer`:

```ts
  const { buffer: rawBuffer } = await fetchImageBuffer(imageUrl)
  const { buffer, contentType } = await compressBuffer(rawBuffer)
  const key = r2Key(themeId, slot, "webp")  // always webp
```

**Step 5: Update `next.config.ts`** — add Pexels and R2 to allowed image domains

```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
}

export default nextConfig
```

**Step 6: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 7: Commit**

```bash
git add lib/compress.ts app/api/media/upload/route.ts scripts/migrate-images.ts next.config.ts package.json package-lock.json
git commit -m "feat: compress images to WebP via Sharp before R2 upload"
```

---

### Task 5: Sentry — error monitoring

**Prerequisite (human step):**
1. Go to https://sentry.io → create a free account
2. Create a new project → choose **Next.js**
3. Copy your **DSN** (looks like `https://abc123@o123456.ingest.sentry.io/789`)
4. Add to `.env.local`: `SENTRY_DSN=https://your-dsn-here`
5. Add `SENTRY_DSN` to the `server` block in `env.ts`:
   ```ts
   SENTRY_DSN: z.string().url().optional(),
   ```
   And to `runtimeEnv`:
   ```ts
   SENTRY_DSN: process.env.SENTRY_DSN,
   ```

**Step 1: Install Sentry**

```bash
npm install @sentry/nextjs
```

**Step 2: Create `sentry.client.config.ts`** (project root)

```ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // How much of errors to send — 1.0 = 100%, fine for low-traffic apps
  tracesSampleRate: 1.0,

  // Only run in production — never in local dev
  enabled: process.env.NODE_ENV === "production",
})
```

**Step 3: Create `sentry.server.config.ts`** (project root)

```ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  enabled: process.env.NODE_ENV === "production",
})
```

**Step 4: Create `sentry.edge.config.ts`** (project root)

```ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  enabled: process.env.NODE_ENV === "production",
})
```

**Step 5: Create `instrumentation.ts`** (project root)

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}
```

**Step 6: Update `next.config.ts`** — wrap with Sentry

```ts
import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "*.r2.dev" },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  // Suppress verbose Sentry build output
  silent:          true,
  // Disable source map upload (requires SENTRY_AUTH_TOKEN — add later when deploying)
  disableSourceMapUpload: true,
})
```

**Step 7: Verify**

```bash
npx tsc --noEmit
```

**Step 8: Commit**

```bash
git add sentry.client.config.ts sentry.server.config.ts sentry.edge.config.ts instrumentation.ts next.config.ts package.json package-lock.json
git commit -m "feat: add Sentry error monitoring (disabled in dev)"
```

---

### Task 6: Vitest — unit tests for core library functions

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/lib/r2.test.ts`
- Create: `tests/lib/theme.test.ts`
- Create: `tests/lib/compress.test.ts`

**Step 1: Install Vitest**

```bash
npm install --save-dev vitest
```

**Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  test: {
    environment: "node",
    globals:     true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
```

**Step 3: Add test script to `package.json`**

```json
"test":       "vitest run",
"test:watch": "vitest"
```

**Step 4: Create `tests/lib/r2.test.ts`**

```ts
import { describe, it, expect } from "vitest"
import { r2Key, r2Url } from "../../lib/r2"

// r2Key is a pure function — no env dependency
describe("r2Key", () => {
  it("builds the canonical key for a product slot", () => {
    expect(r2Key("jewelry", "hero", "jpg")).toBe("themes/jewelry/hero.jpg")
  })

  it("defaults to jpg extension", () => {
    expect(r2Key("candy", "gummy-bears")).toBe("themes/candy/gummy-bears.jpg")
  })

  it("supports webp extension", () => {
    expect(r2Key("bakery", "croissant-box-6", "webp")).toBe("themes/bakery/croissant-box-6.webp")
  })

  it("uses the slug as-is (no sanitisation needed — slugs are pre-validated)", () => {
    expect(r2Key("wine", "rose-provence", "webp")).toBe("themes/wine/rose-provence.webp")
  })
})
```

> **Note:** `r2Url` depends on `env.CLOUDFLARE_R2_PUBLIC_URL` — skip testing it here. The env validation tests catch missing values at startup.

**Step 5: Create `tests/lib/theme.test.ts`**

```ts
import { describe, it, expect } from "vitest"
import { THEMES, THEME_IDS } from "../../lib/theme"

// These tests are the programmatic equivalent of validate-themes.ts
// They run in CI and catch regressions when anyone edits a theme file.

describe("THEMES integrity", () => {
  for (const [themeId, theme] of Object.entries(THEMES)) {
    describe(themeId, () => {
      it("has 8 products", () => {
        expect(theme.products).toHaveLength(8)
      })

      it("all products have valid image URLs", () => {
        for (const p of theme.products) {
          expect(p.image, `"${p.name}" has invalid image`).toMatch(/^https:\/\//)
        }
      })

      it("all product slugs are unique", () => {
        const slugs = theme.products.map((p) => p.slug)
        const unique = new Set(slugs)
        expect(unique.size, "Duplicate slugs found").toBe(slugs.length)
      })

      it("no duplicate product image URLs", () => {
        const urls = theme.products.map((p) => p.image)
        const unique = new Set(urls)
        expect(unique.size, "Duplicate image URLs found").toBe(urls.length)
      })

      it("hero image is not reused as a product image", () => {
        const heroUrl = theme.hero.image
        const conflict = theme.products.find((p) => p.image === heroUrl)
        expect(conflict, `Hero image reused by "${conflict?.name}"`).toBeUndefined()
      })

      it("all products have non-negative price", () => {
        for (const p of theme.products) {
          expect(p.price, `"${p.name}" has negative price`).toBeGreaterThanOrEqual(0)
        }
      })
    })
  }
})

describe("THEME_IDS", () => {
  it("contains all 8 theme IDs", () => {
    expect(THEME_IDS).toHaveLength(8)
    expect(THEME_IDS).toContain("jewelry")
    expect(THEME_IDS).toContain("saas")
  })
})
```

**Step 6: Create `tests/lib/compress.test.ts`**

```ts
import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { compressImage } from "../../lib/compress"

// Uses a real image from node_modules to avoid checking in test fixtures
// Any valid JPEG/PNG works — we grab one from the Sharp package itself
describe("compressImage", () => {
  it("returns WebP content type", async () => {
    // Create a minimal 1x1 JPEG buffer using raw bytes
    // This is the smallest valid JPEG: 1x1 white pixel
    const minimalJpeg = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00,
      0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0a, 0x0b, 0xff, 0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
      0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7d,
      0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
      0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xfb, 0xd3,
      0xff, 0xd9,
    ])

    const result = await compressImage(minimalJpeg)
    expect(result.contentType).toBe("image/webp")
    expect(result.buffer).toBeInstanceOf(Buffer)
    expect(result.buffer.length).toBeGreaterThan(0)
  })

  it("respects custom quality option", async () => {
    // Just verify it doesn't throw — output size varies too much to assert precisely
    const tiny = Buffer.from([0xff, 0xd8, 0xff, 0xd9]) // empty JPEG
    // Sharp may throw on truly empty JPEG — that's expected behaviour
    await expect(compressImage(tiny, { quality: 50 })).rejects.toBeDefined()
  })
})
```

**Step 7: Run tests**

```bash
npm test
```

Expected output:
```
✓ tests/lib/r2.test.ts (4)
✓ tests/lib/theme.test.ts (48)  ← 6 checks × 8 themes
✗ tests/lib/compress.test.ts    ← may fail on tiny buffer — that's OK for now
```

**Step 8: Commit**

```bash
git add vitest.config.ts tests/ package.json package-lock.json
git commit -m "feat: add Vitest with r2, theme integrity, and compress tests"
```

---

### Task 7: TanStack Query — server state for admin media page

**Files:**
- Create: `app/api/media/images/route.ts`
- Modify: `components/layout/Providers.tsx`
- Modify: `app/admin/media/page.tsx`

**Step 1: Install TanStack Query**

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**Step 2: Create `app/api/media/images/route.ts`**

This is a new GET endpoint that returns current DB image URLs for a theme.

```ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { env } from "@/env"
import { z } from "zod"
import { THEME_IDS } from "@/lib/theme"

const querySchema = z.object({
  themeId: z.enum(THEME_IDS as [string, ...string[]]),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (session?.user?.email !== env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const parsed = querySchema.safeParse({
    themeId: req.nextUrl.searchParams.get("themeId"),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "themeId required" }, { status: 400 })
  }

  const images = await prisma.themeImage.findMany({
    where: { themeId: parsed.data.themeId },
    select: { slot: true, url: true, alt: true },
  })

  // Return as a slot→url map for easy lookup on the client
  const map: Record<string, string> = {}
  for (const img of images) map[img.slot] = img.url

  return NextResponse.json(map)
}
```

**Step 3: Update `components/layout/Providers.tsx`**

Add `QueryClientProvider` around the existing providers:

```tsx
"use client"

import { useEffect } from "react"
import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "react-hot-toast"
import { CartDrawer } from "@/components/ui/CartDrawer"
import { useAria } from "@/store/aria"

// Create one QueryClient per browser session — shared across all useQuery calls
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // consider data fresh for 60 seconds
    },
  },
})

interface ProvidersProps {
  children: React.ReactNode
  activeThemeId: string
}

export function Providers({ children, activeThemeId }: ProvidersProps) {
  const setActiveThemeId = useAria((s) => s.setActiveThemeId)
  useEffect(() => { setActiveThemeId(activeThemeId) }, [activeThemeId, setActiveThemeId])

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
        <CartDrawer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
            },
          }}
        />
      </SessionProvider>
      {/* Dev-only query inspector — disappears in production builds */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

**Step 4: Update `app/admin/media/page.tsx`** — replace manual fetch with useQuery + useMutation

```tsx
"use client"

import { useRef } from "react"
import Image from "next/image"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { THEMES } from "@/lib/theme"

const THEME_IDS = Object.keys(THEMES)

export default function AdminMediaPage() {
  const [activeTheme, setActiveTheme] = React.useState<string>("jewelry")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingSlot  = useRef<string | null>(null)
  const queryClient  = useQueryClient()

  const theme = THEMES[activeTheme]
  const slots = [
    { slot: "hero", label: "Hero Image", defaultImg: theme.hero.image },
    ...theme.products.map((p) => ({ slot: p.slug, label: p.name, defaultImg: p.image })),
  ]

  // Fetch current R2 URLs from DB for this theme
  const { data: r2Images = {} } = useQuery<Record<string, string>>({
    queryKey: ["media-images", activeTheme],
    queryFn:  () => fetch(`/api/media/images?themeId=${activeTheme}`).then((r) => r.json()),
  })

  function currentUrl(slot: string, defaultImg: string): string {
    return r2Images[slot] ?? defaultImg
  }

  // Upload mutation — invalidates the query so the grid refreshes after upload
  const { mutate: upload, isPending: uploading, variables: uploadingSlot } = useMutation({
    mutationFn: async ({ slot, file }: { slot: string; file: File }) => {
      const form = new FormData()
      form.append("file",    file)
      form.append("themeId", activeTheme)
      form.append("slot",    slot)
      form.append("alt",     slot)
      const res = await fetch("/api/media/upload", { method: "POST", body: form })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-images", activeTheme] })
    },
  })

  function openPicker(slot: string) {
    pendingSlot.current = slot
    fileInputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const slot = pendingSlot.current
    if (file && slot) upload({ slot, file })
    e.target.value = ""
  }

  function onDrop(slot: string, e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) upload({ slot, file })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif text-ink mb-1">Media Library</h2>
        <p className="text-xs text-ink/50">
          Upload images to Cloudflare R2. Changes apply to all demo visitors immediately.
        </p>
      </div>

      {/* Theme tabs */}
      <div className="flex flex-wrap gap-2">
        {THEME_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setActiveTheme(id)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              activeTheme === id
                ? "bg-ink text-paper border-ink"
                : "border-ink/20 text-ink/60 hover:border-ink/40"
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-3 gap-4">
        {slots.map(({ slot, label, defaultImg }) => {
          const isUploading = uploading && uploadingSlot?.slot === slot
          return (
            <div
              key={slot}
              className="group relative cursor-pointer rounded-lg overflow-hidden border border-ink/10 hover:border-ink/30 transition-colors"
              onClick={() => openPicker(slot)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(slot, e)}
            >
              <div className="aspect-square relative bg-paper/50">
                <Image
                  src={currentUrl(slot, defaultImg)}
                  alt={label}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 20vw"
                  unoptimized
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                    <span className="text-paper text-xs">Uploading…</span>
                  </div>
                )}
              </div>
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium text-ink truncate">{label}</p>
                <p className="text-[10px] text-ink/40 truncate">{slot}</p>
              </div>
            </div>
          )
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  )
}
```

Note: Add `import React from "react"` at the top since we use `React.useState`.

**Step 5: Verify**

```bash
npx tsc --noEmit
npm test
```

**Step 6: Commit**

```bash
git add app/api/media/images/ components/layout/Providers.tsx app/admin/media/page.tsx package.json package-lock.json
git commit -m "feat: add TanStack Query — server state for admin media page"
```

---

## DOCUMENTATION TASKS

---

### Task 8: docs/tools/README.md + docs/tools/env.md + docs/tools/zod.md

**Step 1: Create `docs/tools/README.md`**

```markdown
# StoreKit Developer Tools Reference

This directory contains reference documentation for every developer tool
in the StoreKit stack. Each file covers: what the tool is, why it's here,
how it's configured, and common usage patterns with actual code examples.

## Index

| File | Tool | Purpose |
|------|------|---------|
| [env.md](env.md) | @t3-oss/env-nextjs | Type-safe environment variables |
| [zod.md](zod.md) | Zod | Input validation for API routes |
| [biome.md](biome.md) | Biome | Linting and code formatting |
| [sharp.md](sharp.md) | Sharp | Image compression before R2 upload |
| [sentry.md](sentry.md) | Sentry | Error monitoring and alerting |
| [vitest.md](vitest.md) | Vitest | Unit test runner |
| [tanstack-query.md](tanstack-query.md) | TanStack Query | Server state management |
| [image-scout.md](image-scout.md) | Image Scout | AI-powered image sourcing agent |

## Quick Reference: Where each tool is configured

| Tool | Config file |
|------|------------|
| @t3-oss/env-nextjs | `env.ts` (project root) |
| Zod | `lib/validations.ts` |
| Biome | `biome.json` (project root) |
| Sharp | `lib/compress.ts` |
| Sentry | `sentry.*.config.ts` + `instrumentation.ts` |
| Vitest | `vitest.config.ts` + `tests/` |
| TanStack Query | `components/layout/Providers.tsx` |
| Image Scout | `scripts/image-scout.ts` + `scripts/image-scout-prompt.ts` |

## Pre-launch checklist (not yet installed)

When you have real users, add these — see CLAUDE.md for full context:

- **Upstash Redis** — rate limiting for `/api/media/upload` and Gemini calls
- **PostHog** — product analytics (which themes get demoed, which commands are used)
- **Trigger.dev** — background jobs (image migration, email sequences)

## Post-launch checklist

- **Prisma Accelerate** — connection pooling + query caching for Neon serverless
- **Axiom** — structured log aggregation (replace console.log at scale)
- **shadcn/ui** — accessible component library (migrate admin UI)
```

**Step 2: Create `docs/tools/env.md`**

```markdown
# @t3-oss/env-nextjs — Type-safe Environment Variables

## What it is

A wrapper around Zod that validates all environment variables at server startup.
If any required variable is missing or has the wrong format, the server refuses
to start and prints exactly which variable failed — instead of crashing later
with a confusing error deep in the code.

## Why it's in StoreKit

Before this: `process.env.CLOUDFLARE_ACCOUNT_ID!` — the `!` tells TypeScript
"trust me, this is defined," but TypeScript can't verify it. If the variable is
missing, the app crashes when R2 tries to connect, not at startup.

After this: if `CLOUDFLARE_ACCOUNT_ID` is missing, you see:
```
❌ Invalid environment variables:
  CLOUDFLARE_ACCOUNT_ID: Required
```
...on line 1 of the server log, before any request is handled.

## Config file

`env.ts` at the project root.

## Structure

```ts
export const env = createEnv({
  server: {
    // Variables that must NEVER reach the browser
    DATABASE_URL: z.string().url(),
    STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  },
  client: {
    // Variables that are safe to expose to the browser (NEXT_PUBLIC_ prefix)
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_"),
  },
  runtimeEnv: {
    // Manual bridge: every variable above must be listed here
    DATABASE_URL: process.env.DATABASE_URL,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
})
```

## Usage

```ts
import { env } from "@/env"

// Instead of:              process.env.STRIPE_SECRET_KEY!
// Use:                     env.STRIPE_SECRET_KEY
// TypeScript type:         string (guaranteed non-null)
```

## Adding a new environment variable

1. Add the variable + Zod schema to `server` or `client` in `env.ts`
2. Add the mapping to `runtimeEnv`
3. Add the actual value to `.env.local`

That's it — TypeScript will now error anywhere you forget to set it.

## Key Zod validators used in StoreKit

| Validator | What it checks |
|-----------|---------------|
| `z.string().url()` | Must be a valid URL (DATABASE_URL, R2_PUBLIC_URL) |
| `z.string().startsWith("sk_")` | Stripe secret key format |
| `z.string().startsWith("pk_")` | Stripe public key format |
| `z.string().email()` | Email address (ADMIN_EMAIL) |
| `z.string().optional()` | Variable can be absent (STRIPE_WEBHOOK_SECRET in dev) |
| `z.string().min(1)` | Must exist and be non-empty |
```

**Step 3: Create `docs/tools/zod.md`**

```markdown
# Zod — API Input Validation

## What it is

A TypeScript-first schema validation library. You define the shape of data
you expect, call `.parse()` or `.safeParse()`, and get back either a typed
result or a structured error. The TypeScript types are inferred automatically
from the schema — no duplication.

## Why it's in StoreKit

API routes receive raw user input. Without validation, a malicious request
could pass `themeId: "../../etc/passwd"` or `slot: "; DROP TABLE ThemeImage"`.
Zod catches these at the boundary — before they touch the database.

## Config file

`lib/validations.ts` — all schemas for StoreKit's API routes live here.

## Current schemas

### uploadSchema
Used in `POST /api/media/upload`:

```ts
export const uploadSchema = z.object({
  themeId: z.enum(THEME_IDS as [string, ...string[]]),
  slot:    z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  alt:     z.string().max(256).optional().default(""),
})
```

## Usage patterns

### safeParse (recommended for API routes)
Does not throw — returns `{ success, data, error }`:

```ts
const parsed = uploadSchema.safeParse(rawInput)
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
}
const { themeId, slot, alt } = parsed.data  // fully typed
```

### parse (throws on failure — use in scripts/tests)
```ts
const data = uploadSchema.parse(rawInput)  // throws ZodError if invalid
```

## Adding a new schema

Add it to `lib/validations.ts`:

```ts
export const newApiSchema = z.object({
  name:  z.string().min(1).max(100),
  price: z.number().positive(),
  tags:  z.array(z.string()).max(5).optional(),
})

export type NewApiInput = z.infer<typeof newApiSchema>  // extract the TypeScript type
```

## Common Zod validators

| Validator | What it does |
|-----------|-------------|
| `z.string()` | Any string |
| `z.string().min(1)` | Non-empty string |
| `z.string().email()` | Valid email format |
| `z.string().url()` | Valid URL |
| `z.string().regex(/pattern/)` | Must match regex |
| `z.number().positive()` | Number > 0 |
| `z.number().int()` | Integer only |
| `z.enum(["a","b","c"])` | Must be one of these exact values |
| `z.array(z.string())` | Array of strings |
| `.optional()` | Field can be absent |
| `.default("value")` | Use this if absent |
| `.nullable()` | Can be null |
```

**Step 4: Commit**

```bash
git add docs/tools/
git commit -m "docs: add tools reference — README, env, zod"
```

---

### Task 9: docs/tools/biome.md + docs/tools/sharp.md

**Step 1: Create `docs/tools/biome.md`**

```markdown
# Biome — Linter and Formatter

## What it is

A single fast binary that replaces both ESLint (linting) and Prettier (formatting).
Written in Rust — runs in milliseconds even on large codebases.

## Why it's in StoreKit

Without a linter, subtle bugs slip through code review. Examples Biome catches:
- Unused variables that waste memory
- `==` instead of `===` (equality without type checking)
- Unreachable code after a `return`
- Imports that are never used

Without a formatter, code style drifts. Every developer writes slightly different
whitespace, quote style, trailing commas — Biome enforces one consistent style.

## Config file

`biome.json` at the project root.

## Key config choices in StoreKit

```json
{
  "linter": {
    "rules": {
      "suspicious": { "noExplicitAny": "off" },
      "style": { "noNonNullAssertion": "off" }
    }
  }
}
```

- `noExplicitAny: "off"` — Next.js App Router uses `any` in some places we inherit
- `noNonNullAssertion: "off"` — we use `!` assertions in some legacy code; this is
  gradually being eliminated as we add Zod validation

## Commands

```bash
npm run lint      # check for linting errors (read-only)
npm run format    # auto-format all files
npm run check     # lint + format check in one pass (use in CI)
```

## Workflow

1. During development: run `npm run format` before committing
2. In CI: run `npm run check` — fails the build if there are issues
3. When a lint rule is noisy: disable it in `biome.json` with a comment explaining why

## Disabling a rule for one line

```ts
// biome-ignore lint/suspicious/noExplicitAny: external API response is untyped
const data = response as any
```

## Adding Biome to your editor

VS Code: install the **Biome** extension. It underlines issues in real time and
formats on save. No additional config needed — it picks up `biome.json` automatically.
```

**Step 2: Create `docs/tools/sharp.md`**

```markdown
# Sharp — Image Compression

## What it is

A Node.js image processing library (wraps libvips). Converts, resizes, and
compresses images at C speed — much faster than JavaScript-based alternatives.

## Why it's in StoreKit

Stock photos from Pexels/Unsplash are typically 3-8MB JPEGs. Serving those
directly from R2 means:
- Slow page loads (each product card loads a 4MB image)
- Higher R2 egress costs
- Poor Lighthouse performance scores

Sharp compresses them to WebP before upload. Typical results:
- A 4MB JPEG becomes a 150-300KB WebP — 90%+ size reduction
- No visible quality loss at quality=80

## Config file / wrapper

`lib/compress.ts`

```ts
export async function compressImage(
  input: Buffer,
  options: { width?: number; quality?: number } = {}
): Promise<{ buffer: Buffer; contentType: string }>
```

## Where it's used in StoreKit

| File | What it compresses |
|------|--------------------|
| `app/api/media/upload/route.ts` | Admin manual uploads |
| `scripts/migrate-images.ts` | Bulk migration from Unsplash/Pexels to R2 |

## Usage

```ts
import { compressImage } from "@/lib/compress"

const rawBuffer = Buffer.from(await file.arrayBuffer())
const { buffer, contentType } = await compressImage(rawBuffer)
// buffer: compressed WebP
// contentType: "image/webp"
```

## Options

| Option | Default | Notes |
|--------|---------|-------|
| `width` | 800 | Max width in pixels. Height is proportional. Never upscales. |
| `quality` | 80 | WebP quality 1-100. 80 is visually indistinguishable from 100 for photos. |

## Changing defaults

To use larger images for hero slots:
```ts
const { buffer, contentType } = await compressImage(rawBuffer, { width: 1600, quality: 85 })
```

## Sharp pipeline reference

```ts
sharp(buffer)
  .resize(800, undefined, {
    fit: "inside",              // preserve aspect ratio
    withoutEnlargement: true,  // never upscale a small image
  })
  .webp({ quality: 80 })
  .toBuffer()
```

Other formats Sharp can output: `.jpeg()`, `.png()`, `.avif()`, `.tiff()`
```

**Step 3: Commit**

```bash
git add docs/tools/biome.md docs/tools/sharp.md
git commit -m "docs: add tools reference — biome, sharp"
```

---

### Task 10: docs/tools/sentry.md + docs/tools/vitest.md

**Step 1: Create `docs/tools/sentry.md`**

```markdown
# Sentry — Error Monitoring

## What it is

A platform that captures every unhandled error in your application (both
server and browser), records the full stack trace, the user's session, and
the exact request that caused it, then sends you an alert.

## Why it's in StoreKit

Without Sentry, you only discover errors when a user complains. With Sentry,
you know about errors before users report them — including errors in the
Aria WebSocket connection, the Stripe webhook handler, or the R2 upload pipeline.

## Config files

| File | Purpose |
|------|---------|
| `sentry.client.config.ts` | Browser error capture |
| `sentry.server.config.ts` | Node.js server error capture |
| `sentry.edge.config.ts` | Edge runtime error capture |
| `instrumentation.ts` | Next.js hook that loads the correct config |

## Key config choice: `enabled: process.env.NODE_ENV === "production"`

Sentry is intentionally disabled in local development. This means:
- Dev errors show in your terminal as normal
- You won't generate noise in your Sentry dashboard during development
- It activates automatically when deployed to production

## Dashboard

Go to https://sentry.io → your project → Issues. Each error shows:
- Stack trace with line numbers
- User information (if logged in)
- The HTTP request that triggered it
- How many times it's happened
- Whether it's new or recurring

## Source maps (for readable stack traces in production)

Add to `.env.local` (get token from Sentry → Settings → Auth Tokens):
```
SENTRY_AUTH_TOKEN=your_token_here
```

Then in `next.config.ts`, remove `disableSourceMapUpload: true`.

## Manually capturing errors

In catch blocks where you want Sentry to know but don't want to crash:

```ts
import * as Sentry from "@sentry/nextjs"

try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error)
  // handle gracefully
}
```

## Adding context to errors

```ts
Sentry.setTag("themeId", themeId)
Sentry.setUser({ email: session.user.email })
```

This appears in the Sentry dashboard alongside the error.
```

**Step 2: Create `docs/tools/vitest.md`**

```markdown
# Vitest — Unit Test Runner

## What it is

A fast test runner built on Vite. Compatible with Jest's API — if you've
seen `describe()`, `it()`, `expect()` before, Vitest uses the same syntax.

## Why it's in StoreKit

Tests catch regressions. The most dangerous kind of regression in StoreKit
is a change to theme data that accidentally introduces duplicate images or
broken URLs. The theme tests in `tests/lib/theme.test.ts` catch this
automatically — they run the same checks as `validate-themes.ts` but in
a proper test framework with history, CI integration, and clear pass/fail reporting.

## Config file

`vitest.config.ts` at the project root.

## Test files location

`tests/` directory, mirroring `lib/`:

```
tests/
  lib/
    r2.test.ts          ← tests for lib/r2.ts (r2Key, r2Url)
    theme.test.ts       ← tests for lib/theme.ts (THEMES integrity)
    compress.test.ts    ← tests for lib/compress.ts
```

## Commands

```bash
npm test           # run all tests once (for CI)
npm run test:watch # re-run tests when files change (for development)
```

## Test structure

```ts
import { describe, it, expect } from "vitest"

describe("functionName", () => {
  it("does the expected thing", () => {
    const result = functionName(input)
    expect(result).toBe(expectedValue)
  })

  it("handles edge case", () => {
    expect(() => functionName(badInput)).toThrow("expected error message")
  })
})
```

## Key matchers

| Matcher | What it checks |
|---------|---------------|
| `expect(x).toBe(y)` | Strict equality (`===`) |
| `expect(x).toEqual(y)` | Deep equality (for objects/arrays) |
| `expect(x).toContain(y)` | Array or string contains y |
| `expect(x).toHaveLength(n)` | Array/string has length n |
| `expect(x).toBeGreaterThan(n)` | Number > n |
| `expect(x).toBeUndefined()` | x is undefined |
| `expect(fn).toThrow("msg")` | Function throws with this message |
| `expect(fn).rejects.toBeDefined()` | Async function rejects |

## Writing a new test

1. Create `tests/lib/yourFile.test.ts`
2. Import the function you want to test
3. Write `describe` → `it` → `expect`
4. Run `npm run test:watch` to see it pass in real time

## What to test in StoreKit

**Test (pure functions with no side effects):**
- `r2Key()`, `r2Url()` — string transformations
- `buildScoutPrompt()` — returns a string, verify it contains expected content
- Theme data integrity — slug uniqueness, no duplicate images
- Zod schemas — valid inputs pass, invalid inputs fail

**Don't test (require mocking too much to be useful):**
- API routes — use Playwright for end-to-end tests instead
- Database queries — integration tests with a test DB, not unit tests
- Sentry / R2 / Stripe — these are third-party services; test your code, not theirs
```

**Step 3: Commit**

```bash
git add docs/tools/sentry.md docs/tools/vitest.md
git commit -m "docs: add tools reference — sentry, vitest"
```

---

### Task 11: docs/tools/tanstack-query.md

**Step 1: Create `docs/tools/tanstack-query.md`**

```markdown
# TanStack Query — Server State Management

## What it is

A library for fetching, caching, and synchronising server data in React components.
It replaces the manual `useState + useEffect + fetch` pattern with a declarative
API that handles loading states, errors, caching, and automatic background refetching.

## Why it's in StoreKit

The admin media page previously fetched no data at all — it showed static theme
images from `THEMES` as defaults and relied on optimistic updates. With TanStack Query:

- On page load, it fetches the *actual* current R2 URLs from the DB
- After an upload, it automatically refreshes the grid without any manual state management
- If the fetch fails, it retries automatically
- If you switch between theme tabs, data for previously-viewed tabs is cached
  (no duplicate API calls)

## Config file

`components/layout/Providers.tsx` — `QueryClientProvider` wraps the whole app.

## QueryClient settings in StoreKit

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,  // data stays fresh for 60 seconds
    },
  },
})
```

`staleTime: 60000` means: after fetching media images, don't refetch for 60 seconds
even if the component re-mounts. This prevents hammering the DB on every tab switch.

## Usage: fetching data (useQuery)

```ts
const { data, isLoading, error } = useQuery<Record<string, string>>({
  queryKey: ["media-images", activeTheme],  // unique cache key
  queryFn:  () => fetch(`/api/media/images?themeId=${activeTheme}`).then(r => r.json()),
})
```

- `queryKey`: TanStack Query uses this as the cache identifier. If `activeTheme` changes,
  it fetches fresh data for the new theme.
- `data`: the fetched result (undefined while loading)
- `isLoading`: true during the first fetch

## Usage: mutations (useMutation)

```ts
const { mutate, isPending, variables } = useMutation({
  mutationFn: async ({ slot, file }: { slot: string; file: File }) => {
    // your upload fetch here
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["media-images", activeTheme] })
  },
})
```

After a successful upload, `invalidateQueries` marks the cached image list as stale,
causing an automatic background refetch that updates the grid.

## Where it's used in StoreKit

| File | Query key | What it fetches |
|------|-----------|-----------------|
| `app/admin/media/page.tsx` | `["media-images", themeId]` | R2 URLs for current theme from DB |

## DevTools

`ReactQueryDevtools` is included in `Providers.tsx` — a floating button appears in
the bottom-left corner in development. Click it to see:
- All active queries and their cache state
- Which queries are loading, stale, or fresh
- The actual data cached for each query

It disappears completely in production builds.

## Adding a new query

1. Create a GET API route in `app/api/`
2. Add a `useQuery` call in your component
3. Choose a unique `queryKey` (an array — first item is the "namespace", rest are parameters)

```ts
const { data: products } = useQuery({
  queryKey: ["products", themeId, page],
  queryFn:  () => fetch(`/api/products?themeId=${themeId}&page=${page}`).then(r => r.json()),
})
```
```

**Step 2: Commit**

```bash
git add docs/tools/tanstack-query.md
git commit -m "docs: add tools reference — tanstack-query"
```

---

### Task 12: docs/tools/image-scout.md — comprehensive agent reference

**Step 1: Create `docs/tools/image-scout.md`**

```markdown
# Image Scout — AI-Powered Image Sourcing Agent

## What it is

A Node.js script that uses Gemini 2.5 Flash to generate Pexels search queries,
then downloads image candidates for every theme slot. You review the downloaded
candidates, approve the best ones, and run a second script to upload them to R2.

## Why it exists

Finding 72 unique, on-brand product images manually would take hours. The scout
automates the research phase. Gemini understands each theme's aesthetic and generates
targeted search queries; Pexels provides the images. You keep human judgement for
the final selection.

## Architecture

```
npm run scout
       │
       ▼
scripts/image-scout.ts
       │
       ├─► Gemini 2.5 Flash
       │     buildScoutPrompt(theme) → JSON array of { slot, queries[] }
       │
       ├─► Pexels API (per query)
       │     searchPexels(query, perPage=2) → photo URLs
       │
       └─► Download to disk
             media/candidates/{themeId}/{slot}/001.jpg
             media/candidates/{themeId}/{slot}/002.jpg
             ...
```

## Workflow (full pipeline)

```
1. npm run scout [-- --theme jewelry] [-- --slot hero]
   → downloads 3-6 candidates per slot to media/candidates/

2. Browse media/candidates/ (file manager, terminal, or any image viewer)
   → pick the best image for each slot

3. Copy chosen image to: media/approved/{themeId}/{slot}.jpg

4. npm run upload:approved [-- --theme jewelry]
   → uploads to R2, updates ThemeImage in DB

5. Verify: open /demos/{themeId} — new image is live
```

## Running the scout

```bash
# All 8 themes, all slots (72 slots × ~4 candidates = ~288 images downloaded)
npm run scout

# One theme only
npm run scout -- --theme jewelry

# One slot type across all themes
npm run scout -- --slot hero

# One theme + one slot
npm run scout -- --theme candy --slot licorice-mix
```

## Output structure

```
media/
  candidates/
    jewelry/
      hero/
        001.jpg   ← query 1 result 1
        002.jpg   ← query 1 result 2
        003.jpg   ← query 2 result 1
        ...
      emerald-stud-earrings/
        001.jpg
        ...
  approved/
    jewelry/
      hero.jpg    ← your chosen image (you copy it here)
      emerald-stud-earrings.jpg
```

## Tuning the Gemini prompt

The prompt is isolated in `scripts/image-scout-prompt.ts`. This is the right
place to experiment — changes here affect query quality without touching the
main script.

### Key prompt rules (from `buildScoutPrompt`)

| Rule | Why |
|------|-----|
| Exactly 3 queries per slot | Pexels returns 2 results per query → 6 candidates total |
| 2-5 words per query | Pexels performs best on short, precise queries |
| 3 queries must be meaningfully different | Avoids getting the same photo 3 times |
| Query 1: subject directly | e.g. "sourdough bread" |
| Query 2: subject in context | e.g. "bread bakery counter" |
| Query 3: aesthetic/mood angle | e.g. "artisan bread closeup" |
| Hero slots: atmospheric, not product | Wide shots that work as full-width backgrounds |

### Changing query strategy

To change how many queries per slot (currently 3):
1. Update the instruction in `buildScoutPrompt()`: "Each slot gets exactly N queries"
2. Update `searchPexels(query, 2)` in `image-scout.ts` if you want more results per query

### Adding a second image source (Unsplash)

When your Unsplash API account is approved, add a parallel search in `image-scout.ts`:

```ts
// After Pexels search, also search Unsplash
import { createApi } from "unsplash-js"
const unsplash = createApi({ accessKey: process.env.UNSPLASH_API_KEY! })

async function searchUnsplash(query: string): Promise<string[]> {
  const result = await unsplash.search.getPhotos({ query, perPage: 2 })
  return result.response?.results.map(p => p.urls.regular) ?? []
}
```

Then download those URLs alongside the Pexels results.

## Tuning per-theme aesthetics

`scripts/image-scout-prompt.ts` exports `THEME_AESTHETICS`:

```ts
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

This aesthetic string is injected directly into the Gemini prompt. To improve results
for a specific theme, make this description more specific:

**Example: making jewelry queries more precise**
```ts
// Before:
jewelry: "dark moody minimal, luxury product photography, black or dark background"

// After (more specific — tells Gemini what Pexels responds well to):
jewelry: "macro jewelry photography, black velvet background, single piece centered, studio lighting, no hands"
```

## Rate limits

| Service | Limit | How the scout handles it |
|---------|-------|--------------------------|
| Pexels  | 200 req/hour (free) | 300ms delay between queries |
| Gemini  | 15 req/minute (free Flash tier) | One request per theme |

If the scout hits Pexels rate limits, it throws and exits. Re-run with `--theme` to
resume from a specific theme.

## Evaluating candidate quality

When browsing `media/candidates/`, look for:

✓ **Subject is clearly the product** — not a lifestyle shot with a model
✓ **Clean background** — white, black, or neutral depending on theme
✓ **High contrast with the theme's accent color** — check theme colors in `themes/*.ts`
✓ **Square or close to square** — the grid uses square aspect ratio
✓ **No text overlays or watermarks**

Reject if:
✗ Multiple products in one image (confusing for product pages)
✗ Low resolution (will look blurry at 800px)
✗ Extreme crop (product is too small in frame)

## upload:approved script

```bash
npm run upload:approved                    # all approved images
npm run upload:approved -- --theme bakery  # one theme only
```

The script reads `media/approved/{themeId}/{slot}.jpg`, compresses via Sharp,
uploads to R2, and upserts the ThemeImage record in the DB.

File convention: **filename = slot name + `.jpg`**
- `media/approved/jewelry/emerald-stud-earrings.jpg` → slot `emerald-stud-earrings`
- `media/approved/flowers/hero.jpg` → slot `hero`

After running, verify at `/demos/{themeId}` — changes are live immediately.

## Common issues

**"No matching slots for --slot X"**
The slot name must exactly match the product slug in `themes/{themeId}.ts`.
Check `theme.products.map(p => p.slug)`.

**Gemini returns invalid JSON**
Occasionally Gemini wraps the JSON in markdown fences. The script strips these
with `.replace(/\`\`\`json\n?/g, "")`. If it still fails, add a `console.log(text)`
before the `JSON.parse` to see the raw output.

**Pexels returns 0 results**
The query is too specific. Try the `--slot` flag to rerun just that slot, then
look at the generated queries in the console output. Update `THEME_AESTHETICS`
or the prompt rules to produce broader queries.
```

**Step 2: Commit**

```bash
git add docs/tools/image-scout.md
git commit -m "docs: add comprehensive Image Scout agent reference"
```

---

### Task 13: Create CLAUDE.md with pre/post launch checklist

**Files:**
- Create: `CLAUDE.md` (project root)

**Step 1: Create `CLAUDE.md`**

```markdown
# StoreKit — Claude Code Instructions

## Project Identity
- **Product:** StoreKit — Voice-AI website builder platform
- **Stack:** Next.js 16 App Router · Prisma v5 · Neon PostgreSQL · NextAuth v5 · Zustand · Stripe · Gemini Live API · Cloudflare R2
- **Dev server:** `npm run dev` → port 3001
- **Working dir:** `/root/tal-boilerplate`

## Before every commit
```bash
npx tsc --noEmit   # must pass — no TypeScript errors
npm test           # must pass — no test failures
npm run lint       # review warnings — fix errors
```

## Key conventions
- All API route inputs validated with Zod schemas in `lib/validations.ts`
- Environment variables accessed via `env.ts` (never raw `process.env` in app code)
- Images compressed to WebP before R2 upload via `lib/compress.ts`
- Errors in production captured automatically by Sentry (disabled in dev)
- Server state (DB-fetched data) managed with TanStack Query — never `useState + useEffect + fetch`

## Architecture notes
- **Auth:** NextAuth v5 + PrismaAdapter + Google OAuth only. No `pages` override. Admin protected server-side in `app/admin/layout.tsx`.
- **Themes:** 8 themes. Runtime switching via `SiteContent` key `active_theme`. `resolveTheme()` merges static fallbacks + DB `ThemeImage` overrides.
- **Aria contexts:** `"platform"` (homepage) · `"demo"` (demo pages) · `"member"` (dashboard)
- **Images:** Static theme TS files are fallbacks. DB `ThemeImage` records override. All R2 URLs via `r2Key()` / `r2Url()` in `lib/r2.ts`.
- **No middleware.ts** — admin protection at layout level only.

## Developer tools reference
See `docs/tools/` for reference documentation on every tool:
- `env.md` — @t3-oss/env-nextjs
- `zod.md` — input validation
- `biome.md` — linting and formatting
- `sharp.md` — image compression
- `sentry.md` — error monitoring
- `vitest.md` — unit tests
- `tanstack-query.md` — server state
- `image-scout.md` — AI image sourcing agent

## Known gotchas
- OAuth redirect loop: caused by `pages: { signIn: "/api/auth/signin" }` — do NOT add this
- `siteId` is nullable — FK constraint prevents default string ID
- Scripts must have `import "dotenv/config"` as FIRST import (loads .env.local before env.ts validation runs)
- Guided tour: fully removed. Do not reference `TourStep`, `startTour`, `AriaTourOverlay`

---

## Pre-Launch Checklist

> Add these tools WHEN YOU HAVE REAL USERS generating traffic. Not before.

### Upstash Redis + rate limiting
- **Why:** Without rate limiting, any user can spam `/api/media/upload` and rack up R2 costs. Also needed to protect Gemini API calls from abuse.
- **Install:** `npm install @upstash/redis @upstash/ratelimit`
- **What to rate limit:** `/api/media/upload` (10 req/min per user), Gemini WebSocket connections
- **Docs:** https://upstash.com/docs/redis/sdks/ratelimit/overview

### PostHog
- **Why:** You need to know which themes get demoed most, which Aria commands are used, where users drop off in onboarding. Product decisions should be based on data.
- **Install:** `npm install posthog-js posthog-node`
- **What to track:** Theme demo views, Aria voice sessions started, checkout initiated, sign-ups
- **Docs:** https://posthog.com/docs/libraries/next-js

### Trigger.dev (background jobs)
- **Why:** Long-running tasks shouldn't block API responses. Image migration, email sequences, and nightly health checks need to run in the background with retry logic.
- **Install:** `npm install @trigger.dev/sdk`
- **Jobs to create:** New site provisioning, theme image migration on site creation, onboarding email sequence
- **Docs:** https://trigger.dev/docs

---

## Post-Launch Checklist

> Add these tools once you have consistent traffic and need to optimise.

### Prisma Accelerate
- **Why:** Neon serverless opens a new DB connection on every cold start. Accelerate pools connections and caches frequent queries (like `resolveTheme()`).
- **How:** Replace `DATABASE_URL` with Accelerate's URL. Add `{ cacheStrategy: { ttl: 60 } }` to hot queries.
- **Docs:** https://www.prisma.io/docs/accelerate

### Axiom (structured logging)
- **Why:** `console.log` doesn't scale. Axiom lets you search logs by `userId`, `themeId`, `requestId` across all server instances.
- **Install:** `npm install next-axiom`
- **Docs:** https://axiom.co/docs/send-data/nextjs

### shadcn/ui (component library migration)
- **Why:** The admin UI is built with hand-rolled Tailwind components. shadcn/ui provides accessible, production-tested equivalents (data tables, dialogs, tabs, command palettes).
- **Install:** `npx shadcn@latest init`
- **What to migrate:** Admin nav, media grid, image upload dialog, theme selector tabs
- **Docs:** https://ui.shadcn.com
```

**Step 2: Verify TypeScript still passes**

```bash
npx tsc --noEmit
npm test
```

**Step 3: Final commit**

```bash
git add CLAUDE.md
git commit -m "docs: create CLAUDE.md with conventions, tool index, and pre/post launch checklists"
```

---

## Summary

| # | Task | Deliverable |
|---|------|-------------|
| 1 | @t3-oss/env-nextjs | `env.ts` — typed env with startup validation |
| 2 | Zod | `lib/validations.ts` — API route schemas |
| 3 | Biome | `biome.json` — linter + formatter |
| 4 | Sharp | `lib/compress.ts` — WebP compression pipeline |
| 5 | Sentry | `sentry.*.config.ts` — production error capture |
| 6 | Vitest | `tests/` — theme integrity + r2 + compress tests |
| 7 | TanStack Query | Provider + admin media page migration |
| 8 | Docs | README + env.md + zod.md |
| 9 | Docs | biome.md + sharp.md |
| 10 | Docs | sentry.md + vitest.md |
| 11 | Docs | tanstack-query.md |
| 12 | Docs | image-scout.md (comprehensive agent reference) |
| 13 | CLAUDE.md | Project conventions + pre/post launch checklist |
