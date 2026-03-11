/**
 * GET /api/dev/nextinfo — server runtime stats for the DevHub Next.js tab.
 */
import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  let nextVersion = "unknown"
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8")) as { dependencies?: Record<string, string> }
    nextVersion = pkg.dependencies?.next ?? "unknown"
  } catch { /* ignore */ }

  const mem = process.memoryUsage()

  return NextResponse.json({
    nodeEnv:      process.env.NODE_ENV,
    nextRuntime:  process.env.NEXT_RUNTIME ?? "nodejs",
    nextVersion,
    uptime:       Math.round(process.uptime()),
    memHeapUsed:  Math.round(mem.heapUsed  / 1024 / 1024),
    memHeapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    memRss:       Math.round(mem.rss       / 1024 / 1024),
    timestamp:    Date.now(),
  })
}
