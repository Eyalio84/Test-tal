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
   → compresses via Sharp, uploads to R2, updates ThemeImage in DB

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
