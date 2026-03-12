"use client"

import { useState } from "react"
import { useReportPad } from "@/store/reportPad"

export function ReportPad() {
  const entries       = useReportPad((state) => state.entries)
  const isOpen        = useReportPad((state) => state.isOpen)
  const clearAll      = useReportPad((state) => state.clearAll)
  const exportMarkdown = useReportPad((state) => state.exportMarkdown)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopyMarkdown = async () => {
    const markdown = exportMarkdown()
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: create a download instead
      handleExportFile()
    }
  }

  const handleExportFile = () => {
    const markdown = exportMarkdown()
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `session-report-${new Date().toISOString().split("T")[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const typeColors: Record<string, string> = {
    bug: "border-l-red-500 bg-red-50",
    observation: "border-l-blue-500 bg-blue-50",
    navigation: "border-l-gray-400 bg-stone-50",
    test: "border-l-green-500 bg-green-50",
    summary: "border-l-purple-500 bg-purple-50",
    aria_note: "border-l-amber-500 bg-amber-50",
  }

  return (
    <div className="fixed bottom-20 left-6 w-96 max-h-[60vh] bg-white border border-stone-200 rounded-lg shadow-lg flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50">
        <h2 className="text-sm font-medium text-ink">Session Report Pad</h2>
        <button
          onClick={() => useReportPad.getState().toggleOpen()}
          className="text-xs text-ink/50 hover:text-ink transition"
          aria-label="Close report pad"
        >
          ✕
        </button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {entries.length === 0 ? (
          <p className="text-xs text-ink/40 italic">No entries yet. Ask Aria to document your test session.</p>
        ) : (
          entries.map((entry, i) => (
            <div
              key={i}
              className={`text-xs p-2 border-l-2 rounded ${typeColors[entry.type] || "border-l-stone-300 bg-stone-50"}`}
            >
              <div className="flex items-start gap-2">
                <span className="text-ink/40 whitespace-nowrap">{entry.timestamp}</span>
                <div className="flex-1">
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-ink/60 mb-1">
                    {entry.type}
                  </span>
                  <p className="text-ink/70 leading-relaxed">{entry.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-stone-200 px-4 py-3 bg-stone-50 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="flex-1 text-xs tracking-widest uppercase text-ink/50 hover:text-ink transition border border-current px-2 py-1.5 hover:bg-ink/5"
          >
            {copied ? "✓ Copied" : "Copy Markdown"}
          </button>
          <button
            onClick={handleExportFile}
            className="flex-1 text-xs tracking-widest uppercase text-ink/50 hover:text-ink transition border border-current px-2 py-1.5 hover:bg-ink/5"
          >
            Export .md
          </button>
        </div>
        {entries.length > 0 && (
          <button
            onClick={clearAll}
            className="w-full text-xs tracking-widest uppercase text-red-600 hover:text-red-700 transition border border-red-200 px-2 py-1.5 hover:bg-red-50"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  )
}
