"use client"

import { useEffect } from "react"
import { useAria }   from "@/store/aria"
import { sendTextToAria } from "@/hooks/useAriaLive"

interface Props {
  onConfirm: () => void
  onCancel:  () => void
}

export function ConfirmModal({ onConfirm, onCancel }: Props) {
  const { pendingConfirm, ariaTranscript } = useAria()

  // Listen for voice "yes" / "no" in Aria transcript
  useEffect(() => {
    if (!pendingConfirm) return
    const lower = ariaTranscript.toLowerCase().trim()
    if (lower === "yes" || lower === "yeah" || lower === "confirm") onConfirm()
    if (lower === "no"  || lower === "nope" || lower === "cancel")  onCancel()
  }, [ariaTranscript, pendingConfirm, onConfirm, onCancel])

  if (!pendingConfirm) return null

  const label = pendingConfirm.action === "remove_section"
    ? `Delete "${pendingConfirm.args.sectionId as string}" section?`
    : `Move "${pendingConfirm.args.sectionId as string}" section ${pendingConfirm.args.direction as string}?`

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full mx-4 border border-stone-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚠️</span>
          <h3 className="font-serif text-xl text-stone-900">Confirm change</h3>
        </div>
        <p className="text-stone-600 mb-6">{label}</p>
        <p className="text-xs text-stone-400 mb-6">You can also say <strong>yes</strong> or <strong>no</strong> to Aria.</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2 text-sm text-stone-600 border border-stone-300 rounded hover:bg-stone-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
