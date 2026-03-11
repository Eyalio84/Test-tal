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

  // Cache-buster: ?v=timestamp ensures browsers fetch fresh content after Scout uploads
  const bySlot = new Map(overrides.map((r) => [r.slot, `${r.url}?v=${r.updatedAt.getTime()}`]))

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
