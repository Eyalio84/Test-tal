import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { TEMPLATE_PAGES } from "@/lib/templatePages"
import { THEME_IDS } from "@/lib/theme"

const cloneSchema = z.object({
  themeId: z.enum(THEME_IDS as [string, ...string[]]),
})

// POST /api/sites/clone — clone template pages + sections into user's site
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = cloneSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { themeId } = parsed.data

  const site = await prisma.site.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true },
  })

  if (!site) return NextResponse.json({ error: "no site found" }, { status: 404 })

  // Update site theme
  await prisma.site.update({ where: { id: site.id }, data: { themeId } })

  // Delete existing pages (fresh clone)
  await prisma.page.deleteMany({ where: { siteId: site.id } })

  const pageDefs = TEMPLATE_PAGES[themeId] ?? TEMPLATE_PAGES.jewelry

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

  return NextResponse.json({ siteId: site.id, pageCount, sectionCount })
}
