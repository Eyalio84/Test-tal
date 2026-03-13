import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createSectionSchema, updateSectionSchema } from "@/lib/validations"
import { z } from "zod"

type Params = { params: Promise<{ pageId: string }> }

async function verifyPageOwnership(userId: string, pageId: string) {
  const site = await prisma.site.findFirst({ where: { ownerId: userId }, select: { id: true } })
  if (!site) return { error: NextResponse.json({ error: "no site found" }, { status: 404 }) }

  const page = await prisma.page.findFirst({ where: { id: pageId, siteId: site.id }, select: { id: true } })
  if (!page) return { error: NextResponse.json({ error: "page not found" }, { status: 404 }) }

  return { pageId: page.id }
}

// POST /api/pages/[pageId]/sections — add section to page
export async function POST(req: NextRequest, { params }: Params) {
  const { pageId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const result = await verifyPageOwnership(session.user.id, pageId)
  if (result.error) return result.error

  const body = await req.json()
  const parsed = createSectionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const section = await prisma.pageSection.create({
    data: {
      pageId,
      componentSlug: parsed.data.componentSlug,
      props: parsed.data.props as Prisma.InputJsonValue,
      order: parsed.data.order,
      isVisible: parsed.data.isVisible,
    },
  })

  return NextResponse.json({ section }, { status: 201 })
}

const bulkUpdateSchema = z.object({
  sections: z.array(z.object({ id: z.string() }).merge(updateSectionSchema)),
})

// PATCH /api/pages/[pageId]/sections — bulk update/reorder sections
export async function PATCH(req: NextRequest, { params }: Params) {
  const { pageId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const result = await verifyPageOwnership(session.user.id, pageId)
  if (result.error) return result.error

  const body = await req.json()
  const parsed = bulkUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.$transaction(
    parsed.data.sections.map(({ id, props, ...rest }) =>
      prisma.pageSection.update({
        where: { id, pageId },
        data: {
          ...rest,
          ...(props !== undefined ? { props: props as Prisma.InputJsonValue } : {}),
        },
      })
    )
  )

  return NextResponse.json({ sections: updated })
}

// DELETE /api/pages/[pageId]/sections?sectionId=xxx — delete a section
export async function DELETE(req: NextRequest, { params }: Params) {
  const { pageId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const result = await verifyPageOwnership(session.user.id, pageId)
  if (result.error) return result.error

  const sectionId = new URL(req.url).searchParams.get("sectionId")
  if (!sectionId) return NextResponse.json({ error: "sectionId query param required" }, { status: 400 })

  const section = await prisma.pageSection.findFirst({ where: { id: sectionId, pageId } })
  if (!section) return NextResponse.json({ error: "section not found" }, { status: 404 })

  await prisma.pageSection.delete({ where: { id: sectionId } })

  return NextResponse.json({ ok: true })
}
