import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { activeTheme } from "@/lib/theme"

// POST /api/content/seed — upsert SiteContent rows from activeTheme defaults
// Only seeds keys that don't already have content (draft = "")
export async function POST() {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const { brand, aria: ariaTheme } = activeTheme

  const defaults: Record<string, string> = {
    hero_headline:    brand.tagline,
    hero_subline:     `${ariaTheme.products}. Shop our full collection.`,
    color_primary:    "var(--theme-accent)",
    color_secondary:  "var(--theme-bg)",
    color_accent:     "var(--theme-accent)",
    about_body:       `Welcome to ${brand.name}. ${brand.tagline}.`,
    sections_order:   JSON.stringify(["hero", "featured_products", "collections", "cta"]),
  }

  let seeded = 0
  for (const [key, value] of Object.entries(defaults)) {
    const existing = await prisma.siteContent.findUnique({ where: { id: key } })
    if (!existing || (existing.draft === "" && existing.live === "")) {
      await prisma.siteContent.upsert({
        where: { id: key },
        update: { draft: value, live: value },
        create: { id: key, draft: value, live: value },
      })
      seeded++
    }
  }

  return NextResponse.json({ ok: true, seeded })
}
