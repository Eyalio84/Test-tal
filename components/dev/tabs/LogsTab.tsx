"use client"

import React from "react"
import * as devLogger from "@/lib/devLogger"
import type { LogLevel, LogSource } from "@/lib/devLogger"

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug:  "#6b7280",
  info:   "#3b82f6",
  warn:   "#f59e0b",
  error:  "#ef4444",
  system: "#a855f7",
}

const SOURCE_COLOR: Record<LogSource, string> = {
  aria:       "#ec4899",
  query:      "#3b82f6",
  zod:        "#f97316",
  r2:         "#22c55e",
  components: "#f59e0b",
  system:     "#a855f7",
}

export function LogsTab() {
  const [entries, setEntries] = React.useState(devLogger.getAll())
  const [levelFilter, setLevelFilter] = React.useState<LogLevel | "all">("all")
  const [sourceFilter, setSourceFilter] = React.useState<LogSource | "all">("all")
  const [serverLogs, setServerLogs] = React.useState<devLogger.LogEntry[]>([])
  const bottomRef = React.useRef<HTMLDivElement>(null)

  // Client logs — subscribe to devLogger
  React.useEffect(() => {
    return devLogger.subscribe(() => setEntries([...devLogger.getAll()]))
  }, [])

  // Server logs — poll /api/dev/logs every 2s
  React.useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/dev/logs")
        if (res.ok) setServerLogs(await res.json())
      } catch { /* network error, ignore */ }
    }
    poll()
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [])

  // Merge + deduplicate + sort
  const merged = [...entries, ...serverLogs]
    .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
    .filter(e => levelFilter === "all"  || e.level  === levelFilter)
    .filter(e => sourceFilter === "all" || e.source === sourceFilter)
    .sort((a, b) => a.timestamp - b.timestamp)

  // Auto-scroll
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [merged.length])

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Filters */}
      <div style={{
        display: "flex",
        gap: 4,
        padding: "4px 6px",
        borderBottom: "1px solid #1e293b",
        background: "#0f172a",
        flexShrink: 0,
      }}>
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value as LogLevel | "all")}
          style={selectStyle}
        >
          <option value="all">all levels</option>
          <option value="error">error</option>
          <option value="warn">warn</option>
          <option value="info">info</option>
          <option value="debug">debug</option>
          <option value="system">system</option>
        </select>
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value as LogSource | "all")}
          style={selectStyle}
        >
          <option value="all">all sources</option>
          <option value="aria">aria</option>
          <option value="query">query</option>
          <option value="zod">zod</option>
          <option value="r2">r2</option>
          <option value="components">components</option>
          <option value="system">system</option>
        </select>
      </div>

      {/* Log stream */}
      <div style={{ flex: 1, overflowY: "auto", fontSize: 10, fontFamily: "monospace" }}>
        {merged.length === 0 && (
          <div style={{ color: "#6b7280", textAlign: "center", padding: "20px 0" }}>
            No logs yet
          </div>
        )}
        {merged.map(e => (
          <div key={e.id} style={{
            padding: "2px 6px",
            borderLeft: `3px solid ${LEVEL_COLOR[e.level as LogLevel]}`,
            borderBottom: "1px solid #0f172a",
          }}>
            <span style={{ color: "#334155", fontSize: 9 }}>
              {new Date(e.timestamp).toLocaleTimeString()}
            </span>
            {" "}
            <span style={{ color: SOURCE_COLOR[e.source as LogSource], fontWeight: "bold" }}>
              {e.source}
            </span>
            {" "}
            <span style={{ color: "#94a3b8" }}>{e.component}</span>
            {" "}
            <span style={{ color: LEVEL_COLOR[e.level as LogLevel] }}>{e.message}</span>
            {e.duration != null && (
              <span style={{ color: "#475569" }}> {e.duration}ms</span>
            )}
            {e.data != null && (
              <div style={{ color: "#64748b", paddingLeft: 8, fontSize: 9, wordBreak: "break-all" }}>
                {typeof e.data === "string" ? e.data : JSON.stringify(e.data).slice(0, 120)}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: "#1e293b",
  color: "#94a3b8",
  border: "1px solid #334155",
  borderRadius: 3,
  padding: "1px 4px",
  fontSize: 9,
  fontFamily: "monospace",
  flex: 1,
}
