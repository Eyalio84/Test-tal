import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { updatePageSchema } from "@/lib/validations"

type Params = { params: Promise<{ pageId: string }> }

async function getOwnedPage(userId: string, pageId: string) {
  const site = await prisma.site.findFirst({ where: { ownerId: userId }, select: { id: true } })
  if (!site) return { error: NextResponse.json({ error: "no site found" }, { status: 404 }) }

  const page = await prisma.page.findFirst({
    where: { id: pageId, siteId: site.id },
    include: { sections: { orderBy: { order: "asc" } } },
  })
  if (!page) return { error: NextResponse.json({ error: "page not found" }, { status: 404 }) }

  return { page, siteId: site.id }
}

// GET /api/pages/[pageId] — get single page with sections
export async function GET(_req: NextRequest, { params }: Params) {
  const { pageId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const result = await getOwnedPage(session.user.id, pageId)
  if (result.error) return result.error

  return NextResponse.json({ page: result.page })
}

// PATCH /api/pages/[pageId] — update page fields
export async function PATCH(req: NextRequest, { params }: Params) {
  const { pageId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const result = await getOwnedPage(session.user.id, pageId)
  if (result.error) return result.error

  const body = await req.json()
  const parsed = updatePageSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.page.update({
    where: { id: pageId },
    data: parsed.data,
    include: { sections: { orderBy: { order: "asc" } } },
  })

  return NextResponse.json({ page: updated })
}

// DELETE /api/pages/[pageId] — delete page
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { pageId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const result = await getOwnedPage(session.user.id, pageId)
  if (result.error) return result.error

  await prisma.page.delete({ where: { id: pageId } })

  return NextResponse.json({ ok: true })
}
