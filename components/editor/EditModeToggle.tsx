"use client"

import { useEffect } from "react"
import { useEditMode } from "@/store/editMode"

export function EditModeToggle({ isOwner }: { isOwner: boolean }) {
  const { editMode, toggleEditMode } = useEditMode()

  useEffect(() => {
    if (sessionStorage.getItem("storekit_edit_mode") === "1") {
      toggleEditMode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggle = () => {
    const next = !editMode
    sessionStorage.setItem("storekit_edit_mode", next ? "1" : "0")
    toggleEditMode()
  }

  if (!isOwner) return null

  return (
    <button
      onClick={handleToggle}
      className={`fixed top-4 right-4 z-50 px-3 py-1.5 text-xs tracking-widest uppercase font-medium rounded transition ${
        editMode
          ? "bg-amber-400 text-stone-900 shadow-lg"
          : "bg-stone-900/80 text-white hover:bg-stone-900"
      }`}
    >
      {editMode ? "✕ Exit Edit" : "✏ Edit"}
    </button>
  )
}
