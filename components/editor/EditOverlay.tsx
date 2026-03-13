"use client"

import { useEditMode } from "@/store/editMode"
import { SECTION_MAP } from "@/lib/sectionMap"

interface EditOverlayProps {
  sectionId: string
  children: React.ReactNode
  className?: string
}

export function EditOverlay({ sectionId, children, className }: EditOverlayProps) {
  const { editMode, selectedSection, selectSection } = useEditMode()
  const sectionLabel = SECTION_MAP[sectionId]?.label || "Section"

  if (!editMode) {
    return <div className={className}>{children}</div>
  }

  const isSelected = selectedSection === sectionId

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    selectSection(sectionId, {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    })
  }

  return (
    <div
      onClick={handleClick}
      className={`relative cursor-pointer transition ${
        isSelected
          ? "ring-2 ring-amber-500 ring-offset-0"
          : "hover:ring-2 hover:ring-amber-400 hover:ring-offset-2"
      } ${className || ""}`}
    >
      {/* Label badge */}
      <div className="absolute top-2 right-2 z-40 bg-amber-400 text-stone-900 text-xs font-medium px-2 py-1 rounded pointer-events-none">
        ✏ {sectionLabel}
      </div>

      {children}
    </div>
  )
}
