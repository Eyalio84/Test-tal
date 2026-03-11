"use client"

import React from "react"
import { usePathname, useSearchParams } from "next/navigation"

interface NextInfo {
  nodeEnv:      string
  nextRuntime:  string
  nextVersion:  string
  uptime:       number
  memHeapUsed:  number
  memHeapTotal: number
  memRss:       number
  timestamp:    number
}

const rowStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderBottom: "1px solid #0f172a",
  display: "flex",
  justifyContent: "space-between",
  fontSize: 10,
  fontFamily: "monospace",
}

const labelStyle: React.CSSProperties = { color: "#475569" }
const valueStyle: React.CSSProperties = { color: "#e2e8f0" }

function formatUptime(s: number): string {
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

export function NextTab() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [info, setInfo]     = React.useState<NextInfo | null>(null)
  const [fetchedAt, setFetchedAt] = React.useState<number | null>(null)

  React.useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/dev/nextinfo")
        if (res.ok) {
          setInfo(await res.json())
          setFetchedAt(Date.now())
        }
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [])

  const params = searchParams.toString()

  return (
    <div>
      {/* Section: Route */}
      <div style={{ padding: "4px 8px", background: "#0f172a", color: "#3b82f6", fontSize: 9, fontFamily: "monospace", fontWeight: "bold", letterSpacing: 1 }}>
        ROUTE
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>pathname</span>
        <span style={{ ...valueStyle, color: "#a855f7", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {pathname}
        </span>
      </div>
      {params && (
        <div style={rowStyle}>
          <span style={labelStyle}>search</span>
          <span style={{ ...valueStyle, color: "#f59e0b" }}>{params}</span>
        </div>
      )}

      {/* Section: Build */}
      <div style={{ padding: "4px 8px", background: "#0f172a", color: "#3b82f6", fontSize: 9, fontFamily: "monospace", fontWeight: "bold", letterSpacing: 1, marginTop: 4 }}>
        BUILD
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>next.js</span>
        <span style={valueStyle}>{info?.nextVersion ?? "…"}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>env</span>
        <span style={{ ...valueStyle, color: "#22c55e" }}>{info?.nodeEnv ?? "…"}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>runtime</span>
        <span style={valueStyle}>{info?.nextRuntime ?? "…"}</span>
      </div>

      {/* Section: Server */}
      <div style={{ padding: "4px 8px", background: "#0f172a", color: "#3b82f6", fontSize: 9, fontFamily: "monospace", fontWeight: "bold", letterSpacing: 1, marginTop: 4 }}>
        SERVER PROCESS
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>uptime</span>
        <span style={valueStyle}>{info ? formatUptime(info.uptime) : "…"}</span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>heap</span>
        <span style={valueStyle}>
          {info ? `${info.memHeapUsed}MB / ${info.memHeapTotal}MB` : "…"}
        </span>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>rss</span>
        <span style={valueStyle}>{info ? `${info.memRss}MB` : "…"}</span>
      </div>

      {/* Section: Public env vars */}
      <div style={{ padding: "4px 8px", background: "#0f172a", color: "#3b82f6", fontSize: 9, fontFamily: "monospace", fontWeight: "bold", letterSpacing: 1, marginTop: 4 }}>
        NEXT_PUBLIC_ VARS
      </div>
      {[
        ["SITE_URL",     process.env.NEXT_PUBLIC_SITE_URL],
        ["THEME",        process.env.NEXT_PUBLIC_THEME],
        ["WHATSAPP",     process.env.NEXT_PUBLIC_WHATSAPP_NUMBER],
        ["GEMINI_KEY",   process.env.NEXT_PUBLIC_GEMINI_API_KEY ? "set ✓" : "missing ✗"],
        ["STRIPE_KEY",   process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "set ✓" : "missing ✗"],
      ].map(([key, val]) => (
        <div key={key} style={rowStyle}>
          <span style={labelStyle}>{key}</span>
          <span style={{
            ...valueStyle,
            color: val?.includes("missing") ? "#ef4444" : val?.includes("set") ? "#22c55e" : "#94a3b8",
            maxWidth: 180,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {val ?? "—"}
          </span>
        </div>
      ))}

      {fetchedAt && (
        <div style={{ padding: "4px 8px", color: "#334155", fontSize: 9, fontFamily: "monospace" }}>
          last poll: {new Date(fetchedAt).toLocaleTimeString()} · refreshes every 5s
        </div>
      )}
    </div>
  )
}
