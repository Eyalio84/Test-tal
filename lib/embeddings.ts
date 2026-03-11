/**
 * Embeddings — semantic layer for the CDN catalog.
 *
 * Uses gemini-embedding-001 (768 dims, MRL-trained — can truncate without quality loss).
 * Stored in Neon PostgreSQL via pgvector: `embedding vector(768)` column.
 *
 * Three jobs:
 *   1. storeEmbedding()    — embed + save when uploading an image
 *   2. findSimilar()       — semantic CDN search (Aria: "find me a warm hero")
 *   3. checkDuplicate()    — cosine similarity > 0.92 warns before upload
 *
 * pgvector operator cheatsheet:
 *   <->  L2 distance      (Euclidean — good for normalized space)
 *   <=>  cosine distance  (0 = identical, 2 = opposite — we use this)
 *   <#>  inner product
 *
 * We use cosine distance because it measures *direction* (meaning), not magnitude.
 * ORDER BY embedding <=> $query LIMIT 5 = "find 5 nearest neighbors by meaning"
 */

import { env } from "@/env"
import { prisma } from "@/lib/db"

const EMBED_MODEL = "gemini-embedding-001"
const EMBED_DIMS  = 768          // MRL: 768 is cost-efficient and accurate
const DUPE_THRESHOLD = 0.08      // cosine distance < 0.08 = near-duplicate (> 0.92 similarity)

// ── Generate embedding via Gemini REST API ─────────────────────────────────
async function generateEmbedding(text: string, taskType: string = "RETRIEVAL_DOCUMENT"): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${env.GEMINI_API_KEY}`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model:   `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBED_DIMS,
      }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini embedding error: ${res.status} — ${err}`)
  }

  const data = await res.json() as { embedding: { values: number[] } }
  return data.embedding.values
}

// Format a float[] as a pgvector literal string: "[0.1,0.2,...]"
function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`
}

// ── Store embedding after upload ────────────────────────────────────────────
// Call this after a successful R2 upload + CdnImage DB insert.
// Embeds: prompt + altText (the richest semantic description of the image).
export async function storeEmbedding(cdnImageId: string, prompt: string, altText: string): Promise<void> {
  const text   = `${prompt}. ${altText}`.trim()
  const values = await generateEmbedding(text, "RETRIEVAL_DOCUMENT")
  const vector = toVectorLiteral(values)

  // Raw SQL: Prisma can't generate queries for the vector(768) Unsupported type
  await prisma.$executeRawUnsafe(
    `UPDATE "CdnImage" SET embedding = $1::vector WHERE id = $2`,
    vector,
    cdnImageId
  )
}

// ── Semantic CDN search — "find images similar to this query" ──────────────
export interface SimilarImage {
  id:       string
  r2Key:    string
  themeId:  string
  slot:     string
  altText:  string
  prompt:   string
  distance: number    // cosine distance: 0 = identical, lower = more similar
}

export async function findSimilar(query: string, limit = 5): Promise<SimilarImage[]> {
  const values = await generateEmbedding(query, "RETRIEVAL_QUERY")
  const vector = toVectorLiteral(values)

  const rows = await prisma.$queryRawUnsafe<SimilarImage[]>(
    `SELECT id, "r2Key", "themeId", slot, "altText", prompt,
            (embedding <=> $1::vector) as distance
     FROM "CdnImage"
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    vector,
    limit
  )

  return rows
}

// ── Duplicate detection — check before upload ──────────────────────────────
export interface DuplicateCheck {
  isDuplicate: boolean
  closest?:    SimilarImage
}

export async function checkDuplicate(prompt: string, altText: string): Promise<DuplicateCheck> {
  const text = `${prompt}. ${altText}`.trim()
  const values = await generateEmbedding(text, "RETRIEVAL_QUERY")
  const vector = toVectorLiteral(values)

  const rows = await prisma.$queryRawUnsafe<SimilarImage[]>(
    `SELECT id, "r2Key", "themeId", slot, "altText", prompt,
            (embedding <=> $1::vector) as distance
     FROM "CdnImage"
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT 1`,
    vector
  )

  if (!rows.length) return { isDuplicate: false }

  const closest = rows[0]
  const isDuplicate = closest.distance < DUPE_THRESHOLD

  return { isDuplicate, closest }
}
