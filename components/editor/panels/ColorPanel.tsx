"use client"

import { useState } from "react"
import toast from "react-hot-toast"

interface ColorPanelProps {
  contentKey: string
  currentValue: string
  onSave: (key: string, value: string) => Promise<void>
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export function ColorPanel({ contentKey, currentValue, onSave }: ColorPanelProps) {
  const [color, setColor] = useState(currentValue || "#c9a96e")
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setColor(newColor)
    // Optimistic update: apply color to theme variable
    document.documentElement.style.setProperty("--theme-accent", newColor)
  }

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHex = e.target.value
    if (isValidHex(newHex) || newHex === "") {
      setColor(newHex || color)
      if (isValidHex(newHex)) {
        document.documentElement.style.setProperty("--theme-accent", newHex)
      }
    }
  }

  const handleSave = async () => {
    if (!isValidHex(color)) {
      toast.error("Invalid hex color")
      return
    }
    setIsSaving(true)
    try {
      await onSave(contentKey, color)
      setShowSaved(true)
      toast.success("Color saved ✓")
      setTimeout(() => setShowSaved(false), 2000)
    } catch (err) {
      toast.error("Save failed")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-stone-800 rounded">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-stone-300">Color Picker</label>
        <input
          type="color"
          value={color}
          onChange={handleColorChange}
          className="w-full h-12 rounded cursor-pointer border border-stone-600"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-stone-300">Hex Value</label>
        <input
          type="text"
          value={color}
          onChange={handleHexChange}
          placeholder="#c9a96e"
          className="w-full px-3 py-2 rounded border border-stone-600 bg-stone-700 text-stone-100 text-sm font-mono"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving || !isValidHex(color)}
        className="w-full px-3 py-2 bg-amber-400 text-stone-900 font-medium rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-300 transition"
      >
        {showSaved ? "Saved ✓" : isSaving ? "Saving…" : "Save"}
      </button>
    </div>
  )
}
