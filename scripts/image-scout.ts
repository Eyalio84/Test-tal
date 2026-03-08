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
