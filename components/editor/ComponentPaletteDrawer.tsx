"use client"

import toast from "react-hot-toast"
import { useQuery } from "@tanstack/react-query"
import { useEditMode } from "@/store/editMode"
import { useCanvas } from "@/store/canvas"

interface Component {
  id: string
  slug: string
  name: string
  category: string
  description?: string
}

export function ComponentPaletteDrawer() {
  const showPalette = useEditMode((s) => s.showPalette)
  const { addComponent } = useCanvas()

  const { data: components = [] } = useQuery<Component[]>({
    queryKey: ["components"],
    queryFn: async () => {
      const res = await fetch("/api/components")
      if (!res.ok) throw new Error("Failed to fetch components")
      return res.json()
    },
  })

  // Group by category
  const grouped = components.reduce(
    (acc, comp) => {
      if (!acc[comp.category]) acc[comp.category] = []
      acc[comp.category].push(comp)
      return acc
    },
    {} as Record<string, Component[]>
  )

  const handleAddComponent = (slug: string, name: string) => {
    addComponent(slug, {})
    toast.success(`Added ${name} ✓`)
  }

  if (!showPalette) return null

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-60 bg-stone-900 text-white overflow-y-auto transition-transform border-r border-stone-700">
      <div className="p-4">
        <h2 className="text-sm font-semibold mb-4 text-amber-400">Components</h2>

        {Object.entries(grouped).map(([category, comps]) => (
          <div key={category} className="mb-5">
            <h3 className="text-xs font-medium text-stone-400 mb-2 uppercase tracking-wide">
              {category}
            </h3>
            <div className="flex flex-col gap-2">
              {comps.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => handleAddComponent(comp.slug, comp.name)}
                  className="text-left px-3 py-2 rounded text-sm hover:bg-stone-800 transition flex items-center justify-between group"
                >
                  <span>{comp.name}</span>
                  <span className="text-xs bg-stone-700 group-hover:bg-amber-400 group-hover:text-stone-900 rounded px-2 py-1 transition">
                    +
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {components.length === 0 && (
          <p className="text-xs text-stone-500">No components available</p>
        )}
      </div>
    </div>
  )
}
