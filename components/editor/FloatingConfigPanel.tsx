"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useEditMode } from "@/store/editMode"
import { SECTION_MAP } from "@/lib/sectionMap"
import { TextPanel } from "./panels/TextPanel"
import { ImagePanel } from "./panels/ImagePanel"
import { ColorPanel } from "./panels/ColorPanel"
import { SectionOrderPanel } from "./panels/SectionOrderPanel"

const PANEL_WIDTH  = 300
const PANEL_MARGIN = 12

export function FloatingConfigPanel() {
  const selectedSection = useEditMode((s) => s.selectedSection)
  const panelAnchor     = useEditMode((s) => s.panelAnchor)
  const clearSelection  = useEditMode((s) => s.clearSelection)

  const [mounted, setMounted]   = useState(false)
  const [content, setContent]   = useState<Record<string, string>>({})

  // Portal requires DOM — skip on server render
  useEffect(() => { setMounted(true) }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") clearSelection() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [clearSelection])

  // Fetch draft content whenever a section is selected
  useEffect(() => {
    if (!selectedSection) { setContent({}); return }
    fetch("/api/content?view=draft")
      .then((r) => r.json())
      .then((data) => setContent(data.content ?? {}))
      .catch(() => {/* editor-only, silent fail */})
  }, [selectedSection])

  if (!mounted || !selectedSection || !panelAnchor) return null

  const config = SECTION_MAP[selectedSection]
  if (!config) return null

  // ── Position: right of section, flip left if it overflows, clamp both axes ─
  const scrollY        = window.scrollY
  const viewportWidth  = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = panelAnchor.left + panelAnchor.width + PANEL_MARGIN
  if (left + PANEL_WIDTH > viewportWidth - PANEL_MARGIN) {
    left = panelAnchor.left - PANEL_WIDTH - PANEL_MARGIN
  }
  left = Math.max(PANEL_MARGIN, left)

  let top = panelAnchor.top + scrollY
  const maxTop = scrollY + viewportHeight - 420 - PANEL_MARGIN
  top = Math.min(Math.max(scrollY + PANEL_MARGIN, top), maxTop)

  // ── Save handler — routes through existing PATCH /api/content ──────────────
  const handleSave = async (key: string, value: string) => {
    const res = await fetch("/api/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    })
    if (!res.ok) throw new Error("Save failed")
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  // ── Pick the right panel module ────────────────────────────────────────────
  const panel = (() => {
    switch (config.module) {
      case "text":
        return (
          <TextPanel
            keys={config.keys}
            values={content}
            onSave={handleSave}
          />
        )
      case "image":
        return (
          <ImagePanel
            contentKey={config.keys[0]}
            currentValue={content[config.keys[0]] ?? ""}
            onSave={handleSave}
          />
        )
      case "color":
        return (
          <ColorPanel
            contentKey={config.keys[0]}
            currentValue={content[config.keys[0]] ?? ""}
            onSave={handleSave}
          />
        )
      case "order": {
        const raw = content["sections_order"]
        const currentOrder = raw
          ? (JSON.parse(raw) as string[])
          : Object.keys(SECTION_MAP)
        return (
          <SectionOrderPanel
            currentOrder={currentOrder}
            onSave={handleSave}
          />
        )
      }
    }
  })()

  return createPortal(
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: PANEL_WIDTH,
        zIndex: 9999,
      }}
      className="rounded-lg shadow-2xl border border-stone-700 overflow-hidden"
      // Stop clicks inside the panel from propagating to the overlay below
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-900 border-b border-stone-700">
        <span className="text-xs font-semibold text-stone-200 uppercase tracking-wider">
          {config.label}
        </span>
        <button
          onClick={clearSelection}
          className="text-stone-400 hover:text-stone-200 transition text-sm leading-none"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {panel}
    </div>,
    document.body,
  )
}
