"use client"

import React from "react"
import { useAria } from "@/store/aria"
import * as devLogger from "@/lib/devLogger"

const LEVEL_COLOR: Record<string, string> = {
  debug:  "#6b7280",
  info:   "#3b82f6",
  warn:   "#f59e0b",
  error:  "#ef4444",
  system: "#a855f7",
}

export function AriaTab() {
  const { isConnected, ariaContext, activeThemeId } = useAria()
  const [entries, setEntries] = React.useState(devLogger.getBySource("aria"))

  React.useEffect(() => {
    return devLogger.subscribe(() => setEntries([...devLogger.getBySource("aria")]))
  }, [])

  return (
    <div style={{ fontSize: 10, fontFamily: "monospace" }}>
      {/* Live connection status */}
      <div style={{
        padding: "5px 8px",
        background: "#0f172a",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        gap: 12,
      }}>
        <span>
          ws:{" "}
          <span style={{ color: isConnected ? "#22c55e" : "#ef4444" }}>
            {isConnected ? "connected" : "disconnected"}
          </span>
        </span>
        <span>ctx: <span style={{ color: "#a855f7" }}>{ariaContext}</span></span>
        <span>theme: <span style={{ color: "#f59e0b" }}>{activeThemeId}</span></span>
      </div>

      {/* Event log */}
      <div>
        {entries.length === 0 && (
          <div style={{ color: "#6b7280", textAlign: "center", padding: "20px 0" }}>
            No Aria events yet. Connect Aria to see events.
          </div>
        )}
        {[...entries].reverse().map(e => (
          <div key={e.id} style={{
            padding: "3px 8px",
            borderBottom: "1px solid #0f172a",
            borderLeft: `3px solid ${LEVEL_COLOR[e.level]}`,
          }}>
            <span style={{ color: "#475569", fontSize: 9 }}>
              {new Date(e.timestamp).toLocaleTimeString()}
            </span>
            {" "}
            <span style={{ color: LEVEL_COLOR[e.level] }}>{e.component}</span>
            {" "}
            <span style={{ color: "#cbd5e1" }}>{e.message}</span>
            {e.duration != null && (
              <span style={{ color: "#475569" }}> {e.duration}ms</span>
            )}
            {e.data != null && (
              <div style={{ color: "#64748b", paddingLeft: 8, fontSize: 9, wordBreak: "break-all" }}>
                {JSON.stringify(e.data).slice(0, 150)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
