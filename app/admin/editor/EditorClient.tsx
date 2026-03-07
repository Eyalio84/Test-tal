"use client"

import { useEffect, useCallback, useState } from "react"
import { useAria }        from "@/store/aria"
import { EditorToolbar }  from "./EditorToolbar"
import { ConfirmModal }   from "./ConfirmModal"
import { toastPublish, toastError, toastUndo } from "@/lib/toast"

interface Snapshot { id: string; createdAt: string }

interface Props {
  initialDraft: Record<string, string>
}

// ── Inline editable field ───────────────────────────────────────────────────
function EditableField({
  label, value, onSave, multiline = false
}: {
  label: string
  value: string
  onSave: (v: string) => void
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value)

  useEffect(() => { setVal(value) }, [value])

  const commit = () => {
    setEditing(false)
    if (val !== value) onSave(val)
  }

  if (editing) {
    return (
      <div className="group relative">
        <label className="block text-xs font-medium text-stone-400 mb-1">{label}</label>
        {multiline ? (
          <textarea
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commit}
            rows={3}
            className="w-full border border-amber-400 rounded px-3 py-2 text-sm text-stone-800 outline-none resize-none focus:ring-2 focus:ring-amber-300"
          />
        ) : (
          <input
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="w-full border border-amber-400 rounded px-3 py-2 text-sm text-stone-800 outline-none focus:ring-2 focus:ring-amber-300"
          />
        )}
        <p className="text-xs text-stone-400 mt-1">Press Enter or click outside to save</p>
      </div>
    )
  }

  return (
    <div
      className="group relative cursor-pointer rounded border border-transparent hover:border-amber-300 hover:bg-amber-50/50 px-3 py-2 transition"
      onClick={() => setEditing(true)}
    >
      <label className="block text-xs font-medium text-stone-400 mb-1">{label}</label>
      <p className="text-sm text-stone-800">{value || <span className="text-stone-400 italic">empty</span>}</p>
      <span className="absolute top-2 right-2 text-xs text-amber-500 opacity-0 group-hover:opacity-100 transition">
        ✏ edit
      </span>
    </div>
  )
}

// ── Main editor ─────────────────────────────────────────────────────────────
export function EditorClient({ initialDraft }: Props) {
  const {
    setEditorMode, setDraftContent, draftContent, updateDraftKey,
    undoStack, redoStack,
    pushUndo, popUndo, pushRedo, popRedo, clearRedoStack,
    pendingConfirm, setPendingConfirm, clearPendingConfirm,
    isPublishing, setPublishing,
    pendingCommand, clearCommand,
  } = useAria()

  const [snapshots, setSnapshots] = useState<Snapshot[]>([])

  // On mount: activate editor mode, load initial content + history
  useEffect(() => {
    setEditorMode(true)
    setDraftContent(initialDraft)

    fetch("/api/content/snapshot")
      .then((r) => r.json())
      .then((d: { snapshots: Snapshot[] }) => setSnapshots(d.snapshots ?? []))
      .catch(() => {})

    return () => { setEditorMode(false) }
  }, [setEditorMode, setDraftContent, initialDraft])

  // Handle UNDO / REDO / PENDING_CONFIRM commands dispatched from voice
  useEffect(() => {
    if (!pendingCommand) return
    if (pendingCommand.type !== "UNDO" && pendingCommand.type !== "REDO" && pendingCommand.type !== "PENDING_CONFIRM") return
    clearCommand()
    if (pendingCommand.type === "UNDO") handleUndo()
    if (pendingCommand.type === "REDO") handleRedo()
    // PENDING_CONFIRM: already set in pendingConfirm store via setPendingConfirm — modal renders
  })

  // Keyboard shortcuts: Cmd+Z → undo, Cmd+Y / Cmd+Shift+Z → redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); handleUndo() }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) { e.preventDefault(); handleRedo() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  })

  // ── Undo / Redo ─────────────────────────────────────────────────────────
  const handleUndo = useCallback(async () => {
    const snapshotId = popUndo()
    if (!snapshotId) return
    try {
      const saveRes  = await fetch("/api/content/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create" }) })
      const saveData = await saveRes.json() as { id?: string }
      if (saveData.id) pushRedo(saveData.id)
      const r    = await fetch("/api/content/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ snapshotId }) })
      const data = await r.json() as { content?: Record<string, string> }
      if (data.content) { setDraftContent(data.content); toastUndo("Undone") }
    } catch { toastError("Undo failed") }
  }, [popUndo, pushRedo, setDraftContent])

  const handleRedo = useCallback(async () => {
    const snapshotId = popRedo()
    if (!snapshotId) return
    try {
      const saveRes  = await fetch("/api/content/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create" }) })
      const saveData = await saveRes.json() as { id?: string }
      if (saveData.id) pushUndo(saveData.id)
      const r    = await fetch("/api/content/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ snapshotId }) })
      const data = await r.json() as { content?: Record<string, string> }
      if (data.content) { setDraftContent(data.content); toastUndo("Redone") }
    } catch { toastError("Redo failed") }
  }, [popRedo, pushUndo, setDraftContent])

  // ── Publish ──────────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    setPublishing(true)
    try {
      const r    = await fetch("/api/content/publish", { method: "POST" })
      const data = await r.json() as { ok: boolean; published: number; message?: string }
      if (data.ok) toastPublish(data.message ?? `${data.published} changes published`)
      else         toastError("Publish failed — try again")
    } catch { toastError("Publish failed — network error") }
    finally { setPublishing(false) }
  }, [setPublishing])

  // ── Restore snapshot from history ────────────────────────────────────────
  const handleRestoreSnapshot = useCallback(async (id: string) => {
    try {
      const r    = await fetch("/api/content/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ snapshotId: id }) })
      const data = await r.json() as { content?: Record<string, string> }
      if (data.content) { setDraftContent(data.content); toastUndo("Snapshot restored") }
    } catch { toastError("Restore failed") }
  }, [setDraftContent])

  // ── Inline mouse/touch edit ───────────────────────────────────────────────
  const handleSaveKey = useCallback(async (key: string, value: string) => {
    try {
      const r    = await fetch("/api/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) })
      const data = await r.json() as { snapshotId?: string }
      updateDraftKey(key, value)
      if (data.snapshotId) { pushUndo(data.snapshotId); clearRedoStack() }
    } catch { toastError("Save failed") }
  }, [updateDraftKey, pushUndo, clearRedoStack])

  // ── Confirm modal handlers ────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (!pendingConfirm) return
    const { action, args } = pendingConfirm
    clearPendingConfirm()

    if (action === "remove_section") {
      const cRes  = await fetch("/api/content")
      const cData = await cRes.json() as { content: Record<string, string> }
      const current = JSON.parse(cData.content["sections_order"] || "[]") as string[]
      const updated = current.filter((id) => id !== (args.sectionId as string))
      handleSaveKey("sections_order", JSON.stringify(updated))
    }
    if (action === "reorder_section") {
      const cRes  = await fetch("/api/content")
      const cData = await cRes.json() as { content: Record<string, string> }
      const sections = JSON.parse(cData.content["sections_order"] || "[]") as string[]
      const idx = sections.indexOf(args.sectionId as string)
      if (idx === -1) return
      const dir = args.direction as string
      if (dir === "up"   && idx > 0)                   [sections[idx - 1], sections[idx]] = [sections[idx], sections[idx - 1]]
      if (dir === "down" && idx < sections.length - 1) [sections[idx + 1], sections[idx]] = [sections[idx], sections[idx + 1]]
      handleSaveKey("sections_order", JSON.stringify(sections))
    }
  }, [pendingConfirm, clearPendingConfirm, handleSaveKey])

  const handleCancel = useCallback(() => { clearPendingConfirm() }, [clearPendingConfirm])

  // Current draft values (optimistic from Zustand, seeded from server)
  const heroHeadline = draftContent.hero_headline ?? initialDraft.hero_headline ?? ""
  const heroSubline  = draftContent.hero_subline  ?? initialDraft.hero_subline  ?? ""
  const sections     = JSON.parse(draftContent.sections_order ?? initialDraft.sections_order ?? '["hero","featured_products","collections","cta"]') as string[]

  return (
    <>
      {/* Fixed full-screen overlay — covers admin layout container */}
      <div className="fixed inset-0 z-40 bg-stone-50 flex flex-col overflow-hidden">

        {/* Toolbar */}
        <EditorToolbar
          onUndo={handleUndo}
          onRedo={handleRedo}
          onPublish={handlePublish}
          snapshots={snapshots}
          onRestoreSnapshot={handleRestoreSnapshot}
        />

        {/* Editor body — scrollable, padded below toolbar */}
        <div className="flex-1 overflow-y-auto pt-12">
          <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

            {/* Section: Text content */}
            <section>
              <h2 className="font-serif text-lg text-stone-700 mb-4 pb-2 border-b border-stone-200">
                Hero Section
              </h2>
              <div className="space-y-3">
                <EditableField
                  label="Headline"
                  value={heroHeadline}
                  onSave={(v) => handleSaveKey("hero_headline", v)}
                />
                <EditableField
                  label="Subline"
                  value={heroSubline}
                  onSave={(v) => handleSaveKey("hero_subline", v)}
                  multiline
                />
              </div>
              <p className="mt-3 text-xs text-stone-400">
                Click any field to edit with mouse/touch · or ask Aria to change it by voice
              </p>
            </section>

            {/* Section: Sections order */}
            <section>
              <h2 className="font-serif text-lg text-stone-700 mb-4 pb-2 border-b border-stone-200">
                Page Sections
              </h2>
              <ul className="space-y-2">
                {sections.map((id, i) => (
                  <li key={id} className="flex items-center justify-between px-4 py-2.5 bg-white border border-stone-200 rounded text-sm text-stone-700">
                    <span className="flex items-center gap-3">
                      <span className="text-stone-400 text-xs w-4 text-right">{i + 1}</span>
                      <span className="capitalize">{id.replace(/_\d+$/, "").replace(/_/g, " ")}</span>
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const updated = [...sections]
                          if (i > 0) { [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]]; handleSaveKey("sections_order", JSON.stringify(updated)) }
                        }}
                        disabled={i === 0}
                        className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 transition"
                        title="Move up"
                      >↑</button>
                      <button
                        onClick={() => {
                          const updated = [...sections]
                          if (i < updated.length - 1) { [updated[i + 1], updated[i]] = [updated[i], updated[i + 1]]; handleSaveKey("sections_order", JSON.stringify(updated)) }
                        }}
                        disabled={i === sections.length - 1}
                        className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 transition"
                        title="Move down"
                      >↓</button>
                      <button
                        onClick={() => { setPendingConfirm({ action: "remove_section", args: { sectionId: id } }) }}
                        className="p-1 text-stone-300 hover:text-red-500 transition"
                        title="Remove section"
                      >✕</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Live preview link */}
            <section className="border border-stone-200 rounded-lg p-5 bg-white">
              <h2 className="font-serif text-lg text-stone-700 mb-2">Preview</h2>
              <p className="text-sm text-stone-500 mb-3">
                See your draft changes on the live site layout.
              </p>
              <a
                href="/?draft=1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-zinc-800 hover:bg-zinc-700 rounded transition"
              >
                Open draft preview
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </section>

          </div>
        </div>
      </div>

      {/* Confirm modal — renders above the editor overlay */}
      <ConfirmModal onConfirm={handleConfirm} onCancel={handleCancel} />
    </>
  )
}
