import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { env } from "@/env"
import { prisma } from "@/lib/db"
import { findSimilar } from "@/lib/embeddings"

// GET /api/admin/image-scout/catalog
// ?themeId=jewelry  → all images for a theme
// ?q=warm+hero      → semantic similarity search
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.email !== env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const themeId = searchParams.get("themeId")
  const query   = searchParams.get("q")

  // Semantic search mode
  if (query) {
    const results = await findSimilar(query, 10)
    return NextResponse.json({ results, mode: "semantic" })
  }

  // Browse by theme
  const images = await prisma.cdnImage.findMany({
    where:   themeId ? { themeId } : undefined,
    orderBy: { uploadedAt: "desc" },
    take:    50,
  })
  return NextResponse.json({ images, mode: "browse" })
}
