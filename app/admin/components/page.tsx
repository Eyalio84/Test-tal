"use client"

import React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ComponentModal } from "@/components/admin/ComponentModal"
import type { Component } from "@prisma/client"

export default function AdminComponentsPage() {
  const [search, setSearch] = React.useState("")
  const [category, setCategory] = React.useState("")
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedComponent, setSelectedComponent] = React.useState<Component | null>(null)
  const queryClient = useQueryClient()

  // Fetch components
  const { data: components = [] } = useQuery<Component[]>({
    queryKey: ["components", { search, category }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (category) params.append("category", category)
      const res = await fetch(`/api/components?${params}`)
      return res.json()
    },
  })

  // Delete mutation
  const { mutate: deleteComponent } = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/components/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["components"] })
    },
  })

  function openNewComponent() {
    setSelectedComponent(null)
    setIsModalOpen(true)
  }

  function openEditComponent(component: Component) {
    setSelectedComponent(component)
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedComponent(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif text-ink mb-1">Component Registry</h2>
          <p className="text-xs text-ink/50">
            Manage the component library used in the editor and Aria integrations.
          </p>
        </div>
        <button
          onClick={openNewComponent}
          className="px-3 py-1.5 bg-stone-900 text-white rounded text-sm hover:bg-stone-700 transition"
        >
          + New Component
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by name, description, or ariaName..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-ink/10 rounded text-sm placeholder-ink/40"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-ink/10 rounded text-sm"
        >
          <option value="">All Categories</option>
          <option value="button">Button</option>
          <option value="input">Input</option>
          <option value="card">Card</option>
          <option value="overlay">Overlay</option>
          <option value="nav">Navigation</option>
          <option value="section">Section</option>
          <option value="badge">Badge</option>
          <option value="modal">Modal</option>
        </select>
      </div>

      {/* Components grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {components.map((comp) => (
          <div
            key={comp.id}
            className="p-3 border border-ink/10 rounded-lg hover:border-ink/30 transition"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-ink truncate">{comp.name}</p>
                <p className="text-xs text-ink/50 truncate">{comp.slug}</p>
              </div>
            </div>

            <div className="mb-3">
              <span className="inline-block px-1.5 py-0.5 text-[10px] bg-ink/5 border border-ink/10 rounded text-ink/70">
                {comp.category}
              </span>
            </div>

            {comp.description && (
              <p className="text-xs text-ink/60 mb-3 line-clamp-2">{comp.description}</p>
            )}

            <div className="text-xs text-ink/50 mb-3">
              <p>aria: <code className="font-mono">{comp.ariaName}</code></p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEditComponent(comp)}
                className="flex-1 px-2 py-1 text-xs border border-ink/10 rounded hover:bg-ink/5 transition"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${comp.name}?`)) {
                    deleteComponent(comp.id)
                  }
                }}
                className="flex-1 px-2 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {components.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink/50 text-sm">No components found.</p>
        </div>
      )}

      <ComponentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        component={selectedComponent}
      />
    </div>
  )
}
