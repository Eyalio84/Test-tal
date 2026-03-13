"use client"

import { useState } from "react"
import toast from "react-hot-toast"

interface SectionOrderPanelProps {
  currentOrder: string[]
  onSave: (key: string, value: string) => Promise<void>
}

export function SectionOrderPanel({ currentOrder, onSave }: SectionOrderPanelProps) {
  const [order, setOrder] = useState<string[]>(currentOrder || [])
  const [isSaving, setIsSaving] = useState(false)

  const moveUp = (index: number) => {
    if (index <= 0) return
    const newOrder = [...order]
    ;[newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]]
    setOrder(newOrder)
  }

  const moveDown = (index: number) => {
    if (index >= order.length - 1) return
    const newOrder = [...order]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    setOrder(newOrder)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave("sections_order", JSON.stringify(order))
      toast.success("Order saved ✓")
    } catch (err) {
      toast.error("Save failed")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-stone-800 rounded">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-stone-300">Section Order</label>
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          {order.map((sectionId, index) => (
            <div
              key={`${sectionId}-${index}`}
              className="flex items-center gap-2 p-2 bg-stone-700 rounded text-sm text-stone-100"
            >
              <span className="flex-1 truncate">{sectionId}</span>
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="px-2 py-1 text-xs bg-stone-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-500"
              >
                ↑
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === order.length - 1}
                className="px-2 py-1 text-xs bg-stone-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-500"
              >
                ↓
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full px-3 py-2 bg-amber-400 text-stone-900 font-medium rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-300 transition"
      >
        {isSaving ? "Saving…" : "Save Order"}
      </button>
    </div>
  )
}
