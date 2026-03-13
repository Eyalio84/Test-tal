"use client"

import { useEditMode } from "@/store/editMode"

export function SectionInserter({ onInsert }: { onInsert: () => void }) {
  const editMode = useEditMode((s) => s.editMode)

  if (!editMode) return null

  return (
    <div className="relative py-2 group">
      {/* Line */}
      <div className="absolute inset-x-6 top-1/2 h-px bg-stone-300 group-hover:bg-stone-500 transition" />

      {/* Plus button */}
      <div className="relative flex justify-center">
        <button
          onClick={onInsert}
          className="w-7 h-7 rounded-full bg-white border-2 border-stone-300 hover:border-stone-500 text-stone-400 hover:text-stone-700 flex items-center justify-center text-lg leading-none transition shadow-sm"
          aria-label="Add section here"
        >
          +
        </button>
      </div>
    </div>
  )
}
