/**
 * GET /api/dev/logs?source=zod&level=error — read server-side log buffer.
 * DevHub polls this every 2s to merge server logs with client devLogger.
 */
import { NextRequest, NextResponse } from "next/server"

// biome-ignore lint: global dev-only store
interface ServerLogEntry { id: string; timestamp: number; source: string; level: string; component: string; message: string; data?: unknown; duration?: number }
declare global { var __devLogs: ServerLogEntry[] | undefined }

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const source = searchParams.get("source")
  const level  = searchParams.get("level")

  let logs = global.__devLogs ?? []

  if (source) logs = logs.filter(e => e.source === source)
  if (level)  logs = logs.filter(e => e.level === level)

  return NextResponse.json(logs)
}
