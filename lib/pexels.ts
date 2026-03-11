/**
 * Pexels API client — typed wrapper for image search.
 * Pexels provides free, licensed stock photography.
 * Docs: https://www.pexels.com/api/documentation/
 */
import { env } from "@/env"

export interface PexelsPhoto {
  id:           number
  url:          string          // Pexels page URL
  photographer: string
  avg_color:    string          // dominant color hex
  src: {
    original:  string
    large2x:   string           // ~1880px
    large:     string           // ~940px
    medium:    string           // ~350px
    small:     string           // ~130px
    portrait:  string
    landscape: string
    tiny:      string
  }
  alt: string
}

interface PexelsSearchResponse {
  photos:       PexelsPhoto[]
  total_results: number
  page:          number
  per_page:      number
}

export async function searchPexels(
  query: string,
  options: {
    perPage?:    number
    orientation?: "landscape" | "portrait" | "square"
    size?:       "large" | "medium" | "small"
  } = {}
): Promise<PexelsPhoto[]> {
  const { perPage = 12, orientation = "landscape", size = "large" } = options

  const params = new URLSearchParams({
    query,
    per_page:    String(perPage),
    orientation,
    size,
  })

  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { Authorization: env.PEXEL_API_KEY },
    next: { revalidate: 0 }, // always fresh
  })

  if (!res.ok) {
    throw new Error(`Pexels API error: ${res.status} ${await res.text()}`)
  }

  const data = await res.json() as PexelsSearchResponse
  return data.photos
}
