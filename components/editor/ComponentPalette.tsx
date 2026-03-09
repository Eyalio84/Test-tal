"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import type { Component } from "@prisma/client"
import { cn } from "@/lib/cn"

export interface ComponentPaletteProps {
  onComponentSelect?: (component: Component) => void
  className?: string
}

export function ComponentPalette({
  onComponentSelect,
  className,
}: ComponentPaletteProps) {
  const [search, setSearch] = React.useState("")
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set()
  )

  const { data: components = [] } = useQuery<Component[]>({
    queryKey: ["palette-components", search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      const res = await fetch(`/api/components?${params}`)
      return res.json()
    },
  })

  const categories = Array.from(
    new Set(components.map((c) => c.category))
  ).sort()

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const componentsByCategory = React.useMemo(
    () =>
      categories.reduce(
        (acc, cat) => {
          acc[cat] = components.filter((c) => c.category === cat)
          return acc
        },
        {} as Record<string, Component[]>
      ),
    [components, categories]
  )

  return (
    <div
      className={cn(
        "w-64 bg-white border-r border-stone-200 flex flex-col h-full",
        className
      )}
    >
      {/* Search */}
      <div className="p-3 border-b border-stone-200">
        <input
          type="text"
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-ink"
        />
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto">
        {categories.length === 0 ? (
          <div className="p-4 text-center text-xs text-ink/50">
            No components found
          </div>
        ) : (
          categories.map((category) => (
            <div key={category} className="border-b border-stone-100 last:border-0">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-stone-50 transition text-sm font-medium text-ink"
              >
                <span className="capitalize">{category}</span>
                <span className="text-xs text-ink/40">
                  {expandedCategories.has(category) ? "▼" : "▶"}
                </span>
              </button>

              {/* Components */}
              {expandedCategories.has(category) && (
                <div className="bg-stone-50">
                  {componentsByCategory[category]?.map((comp) => (
                    <div
                      key={comp.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer?.setData(
                          "application/json",
                          JSON.stringify({
                            id: comp.id,
                            slug: comp.slug,
                            name: comp.name,
                            ariaName: comp.ariaName,
                            propsSchema: comp.propsSchema,
                          })
                        )
                      }}
                      onClick={() => onComponentSelect?.(comp)}
                      className="px-3 py-2 text-xs text-ink/70 hover:bg-stone-100 hover:text-ink cursor-move transition flex items-center gap-2 border-l-2 border-transparent hover:border-ink/20"
                    >
                      <span className="text-[10px]">⋮⋮</span>
                      <span className="truncate">{comp.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-stone-200 p-2 text-[10px] text-ink/40 bg-stone-50">
        Drag components to canvas
      </div>
    </div>
  )
}
