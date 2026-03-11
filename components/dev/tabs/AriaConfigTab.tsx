"use client"

/**
 * AriaConfigTab — live Aria configuration controls inside the DevHub.
 * Context, theme, voice, editor mode — all controllable without reloading.
 */

import React from "react"
import { useAria } from "@/store/aria"
import { THEME_IDS } from "@/lib/theme"
import * as devLogger from "@/lib/devLogger"

const ARIA_CONTEXTS = ["platform", "template", "member"] as const
const ARIA_VOICES   = ["Aoede", "Charon", "Fenrir", "Kore", "Puck", "Elise", "Noir"] as const

const rowStyle: React.CSSProperties = {
  padding: "6px 8px",
  borderBottom: "1px solid #0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
}

const labelStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 9,
  fontFamily: "monospace",
  flexShrink: 0,
  width: 80,
}

const selectStyle: React.CSSProperties = {
  background: "#1e293b",
  color: "#e2e8f0",
  border: "1px solid #334155",
  borderRadius: 3,
  padding: "2px 4px",
  fontSize: 9,
  fontFamily: "monospace",
  flex: 1,
}

const badgeStyle = (active: boolean): React.CSSProperties => ({
  background: active ? "#22c55e22" : "#1e293b",
  border: `1px solid ${active ? "#22c55e" : "#334155"}`,
  color: active ? "#22c55e" : "#64748b",
  borderRadius: 3,
  padding: "1px 6px",
  fontSize: 9,
  fontFamily: "monospace",
})

export function AriaConfigTab() {
  const {
    isConnected,
    ariaContext,
    setAriaContext,
    activeThemeId,
    setActiveThemeId,
    editorMode,
    setEditorMode,
    ariaState,
  } = useAria()

  function handleContextChange(ctx: string) {
    setAriaContext(ctx as "platform" | "template" | "member")
    devLogger.log("aria", "system", "AriaConfig", `context → ${ctx}`)
  }

  function handleThemeChange(themeId: string) {
    setActiveThemeId(themeId)
    devLogger.log("aria", "system", "AriaConfig", `theme → ${themeId}`)
  }

  function handleEditorToggle() {
    setEditorMode(!editorMode)
    devLogger.log("aria", "system", "AriaConfig", `editorMode → ${!editorMode}`)
  }

  return (
    <div style={{ fontSize: 10, fontFamily: "monospace" }}>

      {/* Connection status banner */}
      <div style={{
        padding: "5px 8px",
        background: isConnected ? "#052e16" : "#1c0a0a",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: isConnected ? "#22c55e" : "#ef4444",
          flexShrink: 0,
          display: "inline-block",
        }} />
        <span style={{ color: isConnected ? "#22c55e" : "#ef4444" }}>
          {isConnected ? `connected · ${ariaState}` : "disconnected"}
        </span>
      </div>

      {/* Context picker */}
      <div style={rowStyle}>
        <span style={labelStyle}>context</span>
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          {ARIA_CONTEXTS.map(ctx => (
            <button
              key={ctx}
              onClick={() => handleContextChange(ctx)}
              style={{
                ...badgeStyle(ariaContext === ctx),
                cursor: "pointer",
                flex: 1,
              }}
            >
              {ctx}
            </button>
          ))}
        </div>
      </div>

      {/* Theme picker */}
      <div style={rowStyle}>
        <span style={labelStyle}>theme</span>
        <select
          value={activeThemeId}
          onChange={e => handleThemeChange(e.target.value)}
          style={selectStyle}
        >
          {(THEME_IDS as readonly string[]).map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
      </div>

      {/* Editor mode toggle */}
      <div style={rowStyle}>
        <span style={labelStyle}>editor mode</span>
        <button
          onClick={handleEditorToggle}
          style={{
            ...badgeStyle(editorMode),
            cursor: "pointer",
            padding: "2px 12px",
          }}
        >
          {editorMode ? "ON" : "OFF"}
        </button>
      </div>

      {/* Divider */}
      <div style={{ padding: "5px 8px", color: "#334155", fontSize: 9, borderBottom: "1px solid #0f172a" }}>
        SYSTEM PROMPT FRAGMENTS
      </div>

      {/* Injected context info */}
      <div style={{ padding: "5px 8px", color: "#475569", fontSize: 9 }}>
        <div>
          context: <span style={{ color: "#a855f7" }}>{ariaContext}</span>
          {" · "}
          theme: <span style={{ color: "#f59e0b" }}>{activeThemeId}</span>
        </div>
        <div style={{ marginTop: 4, color: "#334155" }}>
          {ariaContext === "member" && editorMode
            ? "✓ component registry injected into system prompt"
            : "component registry: inactive (requires member ctx + editor mode)"}
        </div>
        <div style={{ marginTop: 2, color: "#334155" }}>
          {ariaContext === "member"
            ? "✓ full workspace navigation (editor, themes, admin)"
            : `${ariaContext} persona active`}
        </div>
      </div>

      {/* Note */}
      <div style={{
        padding: "6px 8px",
        color: "#334155",
        fontSize: 9,
        borderTop: "1px solid #1e293b",
        marginTop: 4,
      }}>
        ⚠ Changes apply to Zustand state immediately but Aria uses config at connect time.
        Reconnect Aria for voice + function changes to take effect.
      </div>
    </div>
  )
}
