"use client"

import { useState } from "react"
import toast from "react-hot-toast"

interface TextPanelProps {
  keys: string[]
  values: Record<string, string>
  onSave: (key: string, value: string) => Promise<void>
}

function labelFor(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function TextPanel({ keys, values, onSave }: TextPanelProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(keys.map((k) => [k, values[k] ?? ""]))
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const handleSave = async (key: string) => {
    setSaving((s) => ({ ...s, [key]: true }))
    try {
      await onSave(key, drafts[key])
      toast.success("Saved ✓")
    } catch {
      toast.error("Save failed")
    } finally {
      setSaving((s) => ({ ...s, [key]: false }))
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-stone-800 rounded">
      {keys.map((key) => (
        <div key={key} className="flex flex-col gap-2">
          <label className="text-xs font-medium text-stone-300">{labelFor(key)}</label>
          <textarea
            value={drafts[key]}
            onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded border border-stone-600 bg-stone-700 text-stone-100 text-sm resize-none"
          />
          <button
            onClick={() => handleSave(key)}
            disabled={saving[key]}
            className="self-end px-3 py-1.5 bg-amber-400 text-stone-900 font-medium rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-300 transition"
          >
            {saving[key] ? "Saving…" : "Save"}
          </button>
        </div>
      ))}
    </div>
  )
}
