"use client"

import React from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { Query } from "@tanstack/react-query"

const STATUS_COLOR: Record<string, string> = {
  success: "#22c55e",
  error:   "#ef4444",
  pending: "#f59e0b",
}

const FETCH_COLOR: Record<string, string> = {
  fetching: "#3b82f6",
  paused:   "#a855f7",
  idle:     "#6b7280",
}

function fmt(ms: number): string {
  if (!ms) return "—"
  const diff = Date.now() - ms
  if (diff < 2000)  return `${diff}ms ago`
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`
  return `${Math.round(diff / 60000)}m ago`
}

export function QueryTab() {
  const queryClient = useQueryClient()
  const [queries, setQueries] = React.useState<Query[]>([])
  const [expanded, setExpanded] = React.useState<string | null>(null)

  React.useEffect(() => {
    const cache = queryClient.getQueryCache()
    setQueries(cache.getAll())
    return cache.subscribe(() => setQueries([...cache.getAll()]))
  }, [queryClient])

  if (queries.length === 0) {
    return (
      <div style={{ color: "#6b7280", textAlign: "center", padding: "24px 0", fontSize: 11 }}>
        No queries yet
      </div>
    )
  }

  return (
    <div style={{ fontSize: 10, fontFamily: "monospace" }}>
      {queries.map(q => {
        const key    = JSON.stringify(q.queryKey)
        const status = q.state.status
        const fetch  = q.state.fetchStatus
        const isExp  = expanded === key

        return (
          <div
            key={key}
            onClick={() => setExpanded(isExp ? null : key)}
            style={{
              padding: "5px 8px",
              borderBottom: "1px solid #1e293b",
              cursor: "pointer",
              background: isExp ? "#0f172a" : "transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* status dot */}
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: fetch === "fetching"
                  ? FETCH_COLOR.fetching
                  : STATUS_COLOR[status] ?? "#6b7280",
                flexShrink: 0,
              }} />
              <span style={{ color: "#e2e8f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {key}
              </span>
              <span style={{ color: "#475569", fontSize: 9 }}>
                {fmt(q.state.dataUpdatedAt)}
              </span>
            </div>

            {isExp && (
              <div style={{ marginTop: 4, paddingLeft: 13, color: "#94a3b8" }}>
                <div>
                  status: <span style={{ color: STATUS_COLOR[status] ?? "#fff" }}>{status}</span>
                  {" · "}
                  fetch: <span style={{ color: FETCH_COLOR[fetch] ?? "#fff" }}>{fetch}</span>
                  {" · "}
                  observers: <span style={{ color: "#e2e8f0" }}>{q.getObserversCount()}</span>
                </div>
                {q.state.error && (
                  <div style={{ color: "#ef4444", marginTop: 2 }}>
                    error: {String((q.state.error as Error).message ?? q.state.error)}
                  </div>
                )}
                {q.state.data !== undefined && (
                  <div style={{ color: "#64748b", marginTop: 2, wordBreak: "break-all" }}>
                    data: {JSON.stringify(q.state.data).slice(0, 120)}
                    {JSON.stringify(q.state.data).length > 120 ? "…" : ""}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
