"use client"

import { useReportPad } from "@/store/reportPad"

export function ReportPadToggle() {
  const { entries, isOpen, toggleOpen } = useReportPad((state) => ({
    entries: state.entries,
    isOpen: state.isOpen,
    toggleOpen: state.toggleOpen,
  }))

  return (
    <button
      onClick={toggleOpen}
      className="fixed bottom-6 left-6 w-12 h-12 rounded-full bg-ink text-white shadow-lg hover:bg-ink/90 transition flex items-center justify-center"
      aria-label="Toggle session report pad"
      title="Session Report Pad"
    >
      <div className="flex flex-col items-center justify-center gap-0.5">
        <span className="text-lg">📋</span>
        {entries.length > 0 && (
          <span className="text-[10px] font-semibold bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center absolute -top-1 -right-1">
            {entries.length > 99 ? "99+" : entries.length}
          </span>
        )}
      </div>
    </button>
  )
}
