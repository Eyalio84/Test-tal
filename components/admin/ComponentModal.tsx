"use client"

import React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createComponentSchema, updateComponentSchema } from "@/lib/validations"
import type { Component } from "@prisma/client"

interface ComponentModalProps {
  isOpen: boolean
  onClose: () => void
  component?: Component | null
}

export function ComponentModal({ isOpen, onClose, component }: ComponentModalProps) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = React.useState({
    slug: component?.slug ?? "",
    name: component?.name ?? "",
    category: component?.category ?? "button",
    description: component?.description ?? "",
    ariaName: component?.ariaName ?? "",
    propsSchema: component?.propsSchema ?? {},
  })
  const [error, setError] = React.useState<string | null>(null)

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const url = component
        ? `/api/admin/components/${component.id}`
        : "/api/admin/components"
      const method = component ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to save")
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["components"] })
      onClose()
    },
    onError: (err) => {
      setError((err as Error).message)
    },
  })

  if (!isOpen) return null

  const isEdit = !!component

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50">
      <div className="bg-paper rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-ink/10">
          <h2 className="text-lg font-serif text-ink">
            {isEdit ? "Edit Component" : "New Component"}
          </h2>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              disabled={isEdit}
              className="w-full px-2 py-1.5 border border-ink/10 rounded text-sm disabled:bg-ink/5"
              placeholder="primary-button"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2 py-1.5 border border-ink/10 rounded text-sm"
              placeholder="Primary Button"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-2 py-1.5 border border-ink/10 rounded text-sm"
            >
              <option>button</option>
              <option>input</option>
              <option>card</option>
              <option>overlay</option>
              <option>nav</option>
              <option>section</option>
              <option>badge</option>
              <option>modal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Aria Name</label>
            <input
              type="text"
              value={formData.ariaName}
              onChange={(e) => setFormData({ ...formData, ariaName: e.target.value })}
              className="w-full px-2 py-1.5 border border-ink/10 rounded text-sm"
              placeholder="primary_button"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-2 py-1.5 border border-ink/10 rounded text-sm"
              rows={3}
              placeholder="Component description..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/70 mb-1">Props Schema (JSON)</label>
            <textarea
              value={JSON.stringify(formData.propsSchema, null, 2)}
              onChange={(e) => {
                try {
                  setFormData({ ...formData, propsSchema: JSON.parse(e.target.value) })
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              className="w-full px-2 py-1.5 border border-ink/10 rounded text-xs font-mono"
              rows={4}
              placeholder="{}"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-ink/10 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-ink/10 rounded hover:bg-ink/5 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => save()}
            disabled={isPending}
            className="px-3 py-1.5 text-sm bg-ink text-paper rounded hover:bg-ink/90 disabled:opacity-50 transition"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
