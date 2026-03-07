import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

// POST /api/content/publish — copy all draft → live + revalidate public pages
// NOTE: This is the admin editor path — publishes global (siteId: null) content only.
//       Per-site publish flows are future work once member content writes are supported.
export async function POST() {
  const session = await auth()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  const rows = await prisma.siteContent.findMany()

  // Check if there are any draft changes vs live
  const hasDiff = rows.some((r) => r.draft !== r.live)
  if (!hasDiff) {
    return NextResponse.json({ ok: true, published: 0, message: "no changes to publish" })
  }

  // Copy draft → live for all rows
  await Promise.all(
    rows.map((r) =>
      prisma.siteContent.update({
        where: { id: r.id },
        data: { live: r.draft },
      })
    )
  )

  // Revalidate all public pages that render SiteContent
  revalidatePath("/")
  revalidatePath("/about")
  revalidatePath("/products")
  revalidatePath("/collections")

  return NextResponse.json({ ok: true, published: rows.length })
}
