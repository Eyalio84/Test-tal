import { THEMES, type ThemeConfig } from "@/lib/theme"
import { prisma } from "@/lib/db"

/**
 * Server-side helper. Reads the active theme ID from SiteContent.live
 * (id = 'active_theme'), falls back to NEXT_PUBLIC_THEME env var, then 'jewelry'.
 *
 * Use this in all server components instead of importing `activeTheme` directly
 * so that runtime theme switching via the admin panel works without a rebuild.
 */
export async function getActiveTheme(): Promise<ThemeConfig> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { id: "active_theme" } })
    if (row?.live && THEMES[row.live]) return THEMES[row.live]
  } catch {
    // DB unavailable — fall through to env var
  }

  const envKey = (process.env.NEXT_PUBLIC_THEME ?? "jewelry").toLowerCase()
  return THEMES[envKey] ?? THEMES["jewelry"]
}
