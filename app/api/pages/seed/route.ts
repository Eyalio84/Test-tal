import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { TEMPLATE_PAGES } from "@/lib/templatePages"

// POST /api/pages/seed — create default pages + sections for the user's site
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const site = await prisma.site.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, themeId: true },
  })

  if (!site) {
    return NextResponse.json({ error: "no site found" }, { status: 404 })
  }

  // Check if site already has pages
  const existingCount = await prisma.page.count({
    where: { siteId: site.id },
  })

  if (existingCount > 0) {
    return NextResponse.json(
      { error: "Pages already exist" },
      { status: 409 },
    )
  }

  const pageDefs = TEMPLATE_PAGES[site.themeId] ?? TEMPLATE_PAGES.jewelry

  // Create all pages and sections in a single transaction
  let pageCount = 0
  let sectionCount = 0

  await prisma.$transaction(async (tx) => {
    for (let pageIdx = 0; pageIdx < pageDefs.length; pageIdx++) {
      const def = pageDefs[pageIdx]
      const page = await tx.page.create({
        data: {
          siteId: site.id,
          slug: def.slug,
          title: def.title,
          order: pageIdx,
        },
      })
      pageCount++

      for (let secIdx = 0; secIdx < def.sections.length; secIdx++) {
        const sec = def.sections[secIdx]
        await tx.pageSection.create({
          data: {
            pageId: page.id,
            componentSlug: sec.componentSlug,
            props: sec.props as Prisma.InputJsonValue,
            order: secIdx,
          },
        })
        sectionCount++
      }
    }
  })

  return NextResponse.json({ pageCount, sectionCount })
}
