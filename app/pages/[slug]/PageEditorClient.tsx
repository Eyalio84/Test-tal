"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useCanvas } from "@/store/canvas"
import { useEditMode } from "@/store/editMode"
import { SectionRenderer } from "@/components/shell/SectionRenderer"
import { SectionInserter } from "@/components/editor/SectionInserter"

interface PageSection {
  id: string
  componentSlug: string
  props: Record<string, unknown>
  order: number
  isVisible: boolean
}

interface PageData {
  id: string
  slug: string
  title: string
  sections: PageSection[]
}

type SaveStatus = "idle" | "unsaved" | "saving" | "saved"

const AUTO_SAVE_DELAY = 2000

export function PageEditorClient() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const editMode = useEditMode((s) => s.editMode)
  const toggleEditMode = useEditMode((s) => s.toggleEditMode)
  const togglePalette = useEditMode((s) => s.togglePalette)
  const { hydrateFromSections, persistToServer, isDirty, pageId } = useCanvas()

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [previewMode, setPreviewMode] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch pages then find the one matching slug
  const { data, isLoading, error } = useQuery<{ pages: PageData[] }>({
    queryKey: ["pages"],
    queryFn: async () => {
      const res = await fetch("/api/pages")
      if (!res.ok) throw new Error("Failed to fetch pages")
      return res.json()
    },
  })

  const page = data?.pages.find((p) => p.slug === slug)

  // Hydrate canvas when page loads
  useEffect(() => {
    if (page && page.id !== pageId) {
      hydrateFromSections(
        page.id,
        page.sections.map((s) => ({
          id: s.id,
          componentSlug: s.componentSlug,
          props: s.props as Record<string, unknown>,
          order: s.order,
        }))
      )
    }
  }, [page, pageId, hydrateFromSections])

  // Auto-save with debounce
  useEffect(() => {
    if (!isDirty) return

    setSaveStatus("unsaved")

    // Clear any pending save
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setSaveStatus("saving")
      await persistToServer()
      setSaveStatus("saved")
      // Clear "Saved" indicator after 2s
      setTimeout(() => setSaveStatus("idle"), 2000)
    }, AUTO_SAVE_DELAY)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isDirty, persistToServer])

  const handleManualSave = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSaveStatus("saving")
    await persistToServer()
    setSaveStatus("saved")
    setTimeout(() => setSaveStatus("idle"), 2000)
  }, [persistToServer])

  const handleInsert = useCallback((_index: number) => {
    togglePalette()
  }, [togglePalette])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-stone-100 rounded animate-pulse mb-8" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-stone-50 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-stone-500">Page not found.</p>
        <button onClick={() => router.push("/pages")} className="mt-4 text-sm text-stone-700 underline">
          Back to pages
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Page header bar — hidden in preview mode */}
      {!previewMode && (
        <div className="sticky top-12 z-30 bg-white/95 backdrop-blur-sm border-b border-stone-200">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/pages")}
                className="text-stone-400 hover:text-stone-700 transition"
                aria-label="Back to pages"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </button>
              <h1 className="font-serif text-lg text-ink">{page.title}</h1>
              <span className="text-xs text-stone-400">/{page.slug}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Save status indicator */}
              <SaveIndicator status={saveStatus} onManualSave={handleManualSave} />

              {/* Preview toggle */}
              <button
                onClick={() => setPreviewMode(true)}
                className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition"
              >
                Preview
              </button>

              {/* Edit toggle */}
              <button
                onClick={toggleEditMode}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  editMode
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
                }`}
              >
                {editMode ? "Editing" : "Edit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview mode exit bar */}
      {previewMode && (
        <div className="sticky top-12 z-30 bg-stone-900 text-white">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
            <span className="text-xs tracking-wide">Preview mode — viewing as visitor</span>
            <button
              onClick={() => setPreviewMode(false)}
              className="text-xs bg-white text-stone-900 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition"
            >
              Exit preview
            </button>
          </div>
        </div>
      )}

      {/* Page sections */}
      <div className="pb-20">
        {page.sections.length === 0 ? (
          <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <p className="text-stone-400 mb-4">This page has no sections yet.</p>
            <button
              onClick={() => { togglePalette() }}
              className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-700 transition"
            >
              Add first section
            </button>
          </div>
        ) : (
          <SectionRenderer
            sections={page.sections}
            insertSlot={previewMode ? undefined : (index) => (
              <SectionInserter key={`insert-${index}`} onInsert={() => handleInsert(index)} />
            )}
          />
        )}
      </div>
    </div>
  )
}

// ── Save status indicator ────────────────────────────────────────────────
function SaveIndicator({
  status,
  onManualSave,
}: {
  status: SaveStatus
  onManualSave: () => void
}) {
  switch (status) {
    case "unsaved":
      return (
        <button
          onClick={onManualSave}
          className="text-xs text-amber-600 font-medium hover:text-amber-800 transition flex items-center gap-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Unsaved
        </button>
      )
    case "saving":
      return (
        <span className="text-xs text-stone-400 flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          Saving...
        </span>
      )
    case "saved":
      return (
        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" />
          </svg>
          Saved
        </span>
      )
    default:
      return null
  }
}
