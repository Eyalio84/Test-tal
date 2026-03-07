"use client"

import { useState }       from "react"
import Link               from "next/link"
import { useAria }        from "@/store/aria"
import { toastPublish, toastError, toastUndo } from "@/lib/toast"

interface Snapshot { id: string; createdAt: string }

interface Props {
  onUndo:    () => void
  onRedo:    () => void
  onPublish: () => void
  snapshots: Snapshot[]
  onRestoreSnapshot: (id: string) => void
}

const UndoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
  </svg>
)
const RedoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
  </svg>
)
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
  </svg>
)

function relativeTime(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (secs < 60)   return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

export function EditorToolbar({ onUndo, onRedo, onPublish, snapshots, onRestoreSnapshot }: Props) {
  const { undoStack, redoStack, isPublishing } = useAria()
  const [histOpen, setHistOpen] = useState(false)

  return (
    <div className="fixed top-0 left-0 right-0 z-[150] h-12 bg-zinc-900 border-b border-zinc-700 flex items-center px-4 gap-2 select-none">
      {/* Back */}
      <Link
        href="/admin"
        className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs transition mr-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Admin
      </Link>

      <div className="w-px h-5 bg-zinc-700" />

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={undoStack.length === 0}
        title="Undo (⌘Z)"
        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <UndoIcon /> Undo
      </button>

      {/* Redo */}
      <button
        onClick={onRedo}
        disabled={redoStack.length === 0}
        title="Redo (⌘Y)"
        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <RedoIcon /> Redo
      </button>

      {/* History */}
      <div className="relative">
        <button
          onClick={() => setHistOpen((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition"
        >
          History <ChevronDown />
        </button>
        {histOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-zinc-800 border border-zinc-700 rounded shadow-2xl z-10">
            {snapshots.length === 0 ? (
              <p className="px-4 py-3 text-xs text-zinc-500">No edit history yet</p>
            ) : (
              snapshots.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onRestoreSnapshot(s.id); setHistOpen(false) }}
                  className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition flex items-center justify-between"
                >
                  <span>Snapshot</span>
                  <span className="text-zinc-500">{relativeTime(s.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Draft badge */}
      <div className="flex-1 flex justify-center">
        <span className="px-3 py-0.5 text-xs font-medium tracking-widest uppercase text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full">
          Draft Mode
        </span>
      </div>

      {/* Publish */}
      <button
        onClick={onPublish}
        disabled={isPublishing}
        className="flex items-center gap-2 px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded transition"
      >
        {isPublishing ? (
          <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {isPublishing ? "Publishing…" : "Publish"}
      </button>
    </div>
  )
}
