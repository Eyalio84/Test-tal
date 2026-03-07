import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { THEMES } from "@/lib/theme"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const row = await prisma.siteContent.findUnique({ where: { id: "active_theme" } })
    const themeId = (row?.live ?? process.env.NEXT_PUBLIC_THEME ?? "jewelry").toLowerCase()
    return NextResponse.json({ themeId, available: Object.keys(THEMES) })
  } catch {
    return NextResponse.json({
      themeId: (process.env.NEXT_PUBLIC_THEME ?? "jewelry").toLowerCase(),
      available: Object.keys(THEMES),
    })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { themeId } = await req.json() as { themeId?: string }
  if (!themeId || !THEMES[themeId]) {
    return NextResponse.json({ error: `Unknown theme: ${themeId}` }, { status: 400 })
  }

  const theme = THEMES[themeId]

  // Switch active theme
  await prisma.siteContent.upsert({
    where:  { id: "active_theme" },
    create: { id: "active_theme", draft: themeId, live: themeId, lastEditedBy: session.user?.email ?? "admin" },
    update: { draft: themeId, live: themeId, lastEditedBy: session.user?.email ?? "admin" },
  })

  // Sync theme products into DB so the shop page reflects the active theme
  await prisma.$transaction([
    prisma.product.deleteMany(),
    ...theme.products.map((p) =>
      prisma.product.create({
        data: {
          name:        p.name,
          slug:        p.slug,
          description: p.description,
          price:       p.price,
          category:    p.category,
          images:      JSON.stringify([p.image]),
          inStock:     true,
          stockCount:  p.stockCount ?? null,
        },
      })
    ),
  ])

  return NextResponse.json({ ok: true, themeId, productsSeeded: theme.products.length })
}
