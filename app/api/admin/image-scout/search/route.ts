import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { env } from "@/env"
import { searchPexels } from "@/lib/pexels"

// POST /api/admin/image-scout/search
// Body: { query, themeId, slot, orientation?, source? }
// Returns: { photos: PexelsPhoto[] } or { images: GeminiImageResult[] }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user?.email !== env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { query, orientation = "landscape", source = "pexels" } = await req.json() as {
    query:       string
    themeId?:    string
    slot?:       string
    orientation?: "landscape" | "portrait" | "square"
    source?:     "pexels" | "gemini"
  }

  if (!query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 })
  }

  if (source === "pexels") {
    const photos = await searchPexels(query, { perPage: 12, orientation })
    return NextResponse.json({ photos, source: "pexels" })
  }

  // Gemini web search grounding — returns text response with image suggestions
  if (source === "gemini") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Find 8 high-quality stock photo search terms for: "${query}". Return as JSON array of strings. Just the array, no explanation.` }] }],
          tools: [{ google_search: {} }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    )
    if (!res.ok) return NextResponse.json({ error: "Gemini search failed" }, { status: 502 })
    const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]"

    // Use the refined search terms to fetch from Pexels
    let terms: string[] = []
    try { terms = JSON.parse(text) as string[] } catch { terms = [query] }

    const primaryTerm = terms[0] ?? query
    const photos = await searchPexels(primaryTerm, { perPage: 12, orientation })
    return NextResponse.json({ photos, source: "gemini-refined", refinedQuery: primaryTerm })
  }

  return NextResponse.json({ error: "Unknown source" }, { status: 400 })
}
