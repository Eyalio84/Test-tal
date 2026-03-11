"use client"

import React from "react"
import * as devLogger from "@/lib/devLogger"

export function ZodTab() {
  const [entries, setEntries] = React.useState(devLogger.getBySource("zod"))
  const [serverLogs, setServerLogs] = React.useState<devLogger.LogEntry[]>([])

  React.useEffect(() => {
    return devLogger.subscribe(() => setEntries([...devLogger.getBySource("zod")]))
  }, [])

  React.useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/dev/logs?source=zod")
        if (res.ok) setServerLogs(await res.json())
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [])

  const all = [...entries, ...serverLogs]
    .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
    .sort((a, b) => a.timestamp - b.timestamp)

  return (
    <div style={{ fontSize: 10, fontFamily: "monospace" }}>
      {all.length === 0 ? (
        <div style={{ color: "#6b7280", textAlign: "center", padding: "24px 0" }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>✓</div>
          No validation errors.
          <div style={{ fontSize: 9, color: "#334155", marginTop: 4 }}>
            Zod failures from API routes will appear here.
          </div>
        </div>
      ) : (
        [...all].reverse().map(e => (
          <div key={e.id} style={{
            padding: "5px 8px",
            borderLeft: "3px solid #f97316",
            borderBottom: "1px solid #0f172a",
          }}>
            <div style={{ color: "#f97316", fontWeight: "bold" }}>
              {e.component}
            </div>
            <div style={{ color: "#e2e8f0" }}>{e.message}</div>
            {e.data != null && (
              <div style={{ color: "#64748b", fontSize: 9, marginTop: 2, wordBreak: "break-all" }}>
                {JSON.stringify(e.data).slice(0, 200)}
              </div>
            )}
            <div style={{ color: "#334155", fontSize: 9, marginTop: 2 }}>
              {new Date(e.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
