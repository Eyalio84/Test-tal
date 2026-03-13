"use client"

/**
 * DevHub — StoreKit centralized development panel.
 *
 * Admin-only, dev-only. Portal-rendered at document.body, z-[99999].
 * Toggle pill: top-left corner.
 * Tabs: Query | Aria | Components | Logs | Zod | R2
 *
 * Replaces the standalone TanStack Query DevTools float button.
 */

import React from "react"
import { createPortal } from "react-dom"
import * as devLogger   from "@/lib/devLogger"
import * as devHubStore from "@/lib/devHubStore"
import { useEditMode }  from "@/store/editMode"
import { QueryTab }      from "./tabs/QueryTab"
import { AriaTab }       from "./tabs/AriaTab"
import { AriaConfigTab } from "./tabs/AriaConfigTab"
import { ComponentsTab } from "./tabs/ComponentsTab"
import { LogsTab }       from "./tabs/LogsTab"
import { ZodTab }        from "./tabs/ZodTab"
import { R2Tab }         from "./tabs/R2Tab"
import { NextTab }       from "./tabs/NextTab"

type Tab = "query" | "aria" | "aria-config" | "components" | "logs" | "zod" | "r2" | "next"

const hdrBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "#94a3b8",
  border: "none",
  padding: "2px 6px",
  borderRadius: 3,
  cursor: "pointer",
  fontSize: 9,
  fontWeight: "bold",
  fontFamily: "monospace",
}

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: "query",       label: "Query",  color: "#3b82f6" },
  { id: "aria",        label: "Aria",   color: "#ec4899" },
  { id: "aria-config", label: "A.Cfg",  color: "#a855f7" },
  { id: "components",  label: "Comps",  color: "#f59e0b" },
  { id: "logs",        label: "Logs",   color: "#94a3b8" },
  { id: "zod",         label: "Zod",    color: "#f97316" },
  { id: "r2",          label: "R2",     color: "#22c55e" },
  { id: "next",        label: "Next",   color: "#64748b" },
]

export function DevHub() {
  const [open, setOpen]   = React.useState(devHubStore.isOpen)
  const [tab, setTab]     = React.useState<Tab>("query")
  const [stats, setStats] = React.useState(devLogger.getStats())
  const [mounted, setMounted] = React.useState(false)
  const editMode       = useEditMode((s) => s.editMode)
  const showPalette    = useEditMode((s) => s.showPalette)
  const toggleEditMode = useEditMode((s) => s.toggleEditMode)
  const togglePalette  = useEditMode((s) => s.togglePalette)

  React.useEffect(() => { setMounted(true) }, [])

  // Sync with devHubStore so Navbar toggle works
  React.useEffect(() => {
    return devHubStore.subscribe(() => setOpen(devHubStore.isOpen()))
  }, [])

  React.useEffect(() => {
    return devLogger.subscribe(() => setStats(devLogger.getStats()))
  }, [])

  const handleClear = () => {
    devLogger.clear()
    setStats(devLogger.getStats())
  }

  const handleClose = () => devHubStore.close()

  const handleCopyReport = () => {
    const lines = devLogger.getAll().map(e =>
      `[${new Date(e.timestamp).toLocaleTimeString()}] [${e.source}] [${e.level}] ${e.component} — ${e.message}` +
      (e.data ? `\n  ${JSON.stringify(e.data).slice(0, 200)}` : "")
    )
    const text = lines.join("\n")
    navigator.clipboard?.writeText(text).catch(() => {
      const ta = document.createElement("textarea")
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    })
    devLogger.log("system", "system", "DevHub", "Log report copied to clipboard")
  }

  if (!mounted || !open) return null

  return createPortal(
    <>
      <div style={{
        position: "fixed",
        top: 32,
        left: 8,
        width: 340,
        maxWidth: "calc(100vw - 16px)",
        height: 440,
        maxHeight: "calc(100vh - 48px)",
        background: "#020617",
        border: "1px solid #1e293b",
        borderRadius: 6,
        zIndex: 99998,
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          background: "#0f172a",
          borderBottom: "1px solid #1e293b",
          padding: "5px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{
            color: "#3b82f6",
            fontSize: 10,
            fontFamily: "monospace",
            fontWeight: "bold",
            letterSpacing: 1,
          }}>
            STOREKIT DEV
          </span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <button
              onClick={toggleEditMode}
              title="Toggle inline section editor"
              style={{
                ...hdrBtnStyle,
                background: editMode ? "#f59e0b" : "rgba(255,255,255,0.08)",
                color: editMode ? "#0f172a" : "#94a3b8",
                fontWeight: "bold",
              }}
            >
              {editMode ? "✕ EDIT" : "✏ EDIT"}
            </button>
            <button
              onClick={togglePalette}
              title="Toggle component palette"
              style={{
                ...hdrBtnStyle,
                background: showPalette ? "#6366f1" : "rgba(255,255,255,0.08)",
                color: showPalette ? "#fff" : "#94a3b8",
                fontWeight: "bold",
              }}
            >
              ⊞ COMPS
            </button>
            <button onClick={handleCopyReport} style={hdrBtnStyle} title="Copy log report">CPY</button>
            <button onClick={handleClear}      style={hdrBtnStyle} title="Clear all logs">CLR</button>
            <button onClick={handleClose} style={{ ...hdrBtnStyle, color: "#ef4444" }}>×</button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex",
          background: "#0f172a",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0,
        }}>
          {TABS.map(t => {
            const count = (stats.bySource as Record<string, number>)[t.id] ?? 0
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  borderBottom: tab === t.id ? `2px solid ${t.color}` : "2px solid transparent",
                  color: tab === t.id ? t.color : "#475569",
                  padding: "4px 2px",
                  fontSize: 9,
                  fontFamily: "monospace",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
              >
                {t.label}
                {count > 0 && (
                  <span style={{ marginLeft: 2, color: "#475569", fontSize: 8 }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {tab === "query"       && <QueryTab />}
          {tab === "aria"        && <AriaTab />}
          {tab === "aria-config" && <AriaConfigTab />}
          {tab === "components"  && <ComponentsTab />}
          {tab === "logs"        && <LogsTab />}
          {tab === "zod"         && <ZodTab />}
          {tab === "r2"          && <R2Tab />}
          {tab === "next"        && <NextTab />}
        </div>

        {/* Footer stats */}
        <div style={{
          background: "#0f172a",
          borderTop: "1px solid #1e293b",
          padding: "3px 8px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          fontFamily: "monospace",
          flexShrink: 0,
        }}>
          <span>
            {stats.errors   > 0 && <span style={{ color: "#ef4444" }}>{stats.errors}E </span>}
            {stats.warnings > 0 && <span style={{ color: "#f59e0b" }}>{stats.warnings}W </span>}
            <span style={{ color: "#334155" }}>{stats.total} entries</span>
          </span>
          <span style={{ color: "#334155" }}>
            {stats.bySource.aria}A · {stats.bySource.query}Q · {stats.bySource.r2}R2
          </span>
        </div>
      </div>
    </>,
    document.body
  )
}
