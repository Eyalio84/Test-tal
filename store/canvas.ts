"use client"

import { create } from "zustand"

export interface ComponentInstance {
  id: string
  slug: string
  props: Record<string, unknown>
  position?: string
  parentId?: string
}

interface CanvasStore {
  instances: ComponentInstance[]
  pageId: string | null
  isDirty: boolean
  addComponent: (slug: string, props: Record<string, unknown>, position?: string) => string
  updateComponent: (id: string, props: Record<string, unknown>) => void
  removeComponent: (id: string) => void
  reorderComponent: (id: string, newIndex: number) => void
  clearCanvas: () => void
  getInstance: (id: string) => ComponentInstance | undefined
  hydrateFromSections: (pageId: string, sections: Array<{ id: string; componentSlug: string; props: Record<string, unknown>; order: number }>) => void
  persistToServer: () => Promise<void>
}

const generateId = () => Math.random().toString(36).substring(2, 11)

export const useCanvas = create<CanvasStore>((set, get) => ({
  instances: [],
  pageId: null,
  isDirty: false,

  addComponent: (slug, props, position) => {
    const id = generateId()
    const instance: ComponentInstance = { id, slug, props, position }
    set((state) => ({
      instances: [...state.instances, instance],
      isDirty: true,
    }))
    return id
  },

  updateComponent: (id, props) => {
    set((state) => ({
      instances: state.instances.map((inst) =>
        inst.id === id ? { ...inst, props: { ...inst.props, ...props } } : inst
      ),
      isDirty: true,
    }))
  },

  removeComponent: (id) => {
    set((state) => ({
      instances: state.instances.filter((inst) => inst.id !== id),
      isDirty: true,
    }))
  },

  reorderComponent: (id, newIndex) => {
    set((state) => {
      const current = state.instances.findIndex((inst) => inst.id === id)
      if (current === -1) return state

      const instances = [...state.instances]
      const [moved] = instances.splice(current, 1)
      instances.splice(newIndex, 0, moved)
      return { instances, isDirty: true }
    })
  },

  clearCanvas: () => {
    set({ instances: [] })
  },

  getInstance: (id) => {
    return get().instances.find((inst) => inst.id === id)
  },

  hydrateFromSections: (pageId, sections) => {
    const instances: ComponentInstance[] = sections
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ id: s.id, slug: s.componentSlug, props: s.props }))
    set({ pageId, instances, isDirty: false })
  },

  persistToServer: async () => {
    const { pageId, instances } = get()
    if (!pageId) return

    const sections = instances.map((inst, idx) => ({
      id: inst.id,
      order: idx,
      props: inst.props,
    }))

    const res = await fetch(`/api/pages/${pageId}/sections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections }),
    })

    if (res.ok) set({ isDirty: false })
  },
}))
