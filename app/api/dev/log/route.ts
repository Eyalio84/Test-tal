/**
 * POST /api/dev/log — server-side log ingestion (dev only).
 * Server-side code (Zod validators, R2 uploads) POST here.
 * Entries survive page navigation — stored in Node.js module cache.
 */
import { NextRequest, NextResponse } from "next/server"

if (process.env.NODE_ENV !== "development") {
  // Entire module is excluded in production builds
}

interface ServerLogEntry {
  id:        string
  timestamp: number
  source:    string
  level:     string
  component: string
  message:   string
  data?:     unknown
  duration?: number
}

// Module-level ring buffer — persists across requests in dev server process
const MAX = 300
// biome-ignore lint: global dev-only store
declare global { var __devLogs: ServerLogEntry[] | undefined }
// eslint-disable-next-line no-var
global.__devLogs ??= []

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const body = await request.json() as ServerLogEntry
    const logs = global.__devLogs!

    if (logs.length >= MAX) logs.splice(0, logs.length - MAX + 1)
    logs.push({ ...body, id: body.id ?? `srv-${Date.now()}` })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
}
