"use client"

import React from "react"
import * as devLogger from "@/lib/devLogger"

export function R2Tab() {
  const [entries, setEntries] = React.useState(devLogger.getBySource("r2"))
  const [serverLogs, setServerLogs] = React.useState<devLogger.LogEntry[]>([])

  React.useEffect(() => {
    return devLogger.subscribe(() => setEntries([...devLogger.getBySource("r2")]))
  }, [])

  React.useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/dev/logs?source=r2")
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

  const totalUploads  = all.filter(e => e.level === "info").length
  const totalErrors   = all.filter(e => e.level === "error").length

  return (
    <div style={{ fontSize: 10, fontFamily: "monospace" }}>
      {/* Stats bar */}
      <div style={{
        padding: "4px 8px",
        background: "#0f172a",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        gap: 12,
        color: "#475569",
        fontSize: 9,
      }}>
        <span>uploads: <span style={{ color: "#22c55e" }}>{totalUploads}</span></span>
        <span>errors: <span style={{ color: totalErrors > 0 ? "#ef4444" : "#475569" }}>{totalErrors}</span></span>
      </div>

      {all.length === 0 ? (
        <div style={{ color: "#6b7280", textAlign: "center", padding: "24px 0" }}>
          No R2 activity yet.
          <div style={{ fontSize: 9, color: "#334155", marginTop: 4 }}>
            Upload events from compress + R2 will appear here.
          </div>
        </div>
      ) : (
        [...all].reverse().map(e => (
          <div key={e.id} style={{
            padding: "4px 8px",
            borderLeft: `3px solid ${e.level === "error" ? "#ef4444" : "#22c55e"}`,
            borderBottom: "1px solid #0f172a",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#e2e8f0" }}>{e.message}</span>
              {e.duration != null && (
                <span style={{ color: "#475569" }}>{e.duration}ms</span>
              )}
            </div>
            {e.data != null && (
              <div style={{ color: "#64748b", fontSize: 9, wordBreak: "break-all" }}>
                {JSON.stringify(e.data).slice(0, 150)}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
