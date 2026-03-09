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
  addComponent: (slug: string, props: Record<string, unknown>, position?: string) => string
  updateComponent: (id: string, props: Record<string, unknown>) => void
  removeComponent: (id: string) => void
  reorderComponent: (id: string, newIndex: number) => void
  clearCanvas: () => void
  getInstance: (id: string) => ComponentInstance | undefined
}

const generateId = () => Math.random().toString(36).substring(2, 11)

export const useCanvas = create<CanvasStore>((set, get) => ({
  instances: [],

  addComponent: (slug, props, position) => {
    const id = generateId()
    const instance: ComponentInstance = { id, slug, props, position }
    set((state) => ({
      instances: [...state.instances, instance],
    }))
    return id
  },

  updateComponent: (id, props) => {
    set((state) => ({
      instances: state.instances.map((inst) =>
        inst.id === id ? { ...inst, props: { ...inst.props, ...props } } : inst
      ),
    }))
  },

  removeComponent: (id) => {
    set((state) => ({
      instances: state.instances.filter((inst) => inst.id !== id),
    }))
  },

  reorderComponent: (id, newIndex) => {
    set((state) => {
      const current = state.instances.findIndex((inst) => inst.id === id)
      if (current === -1) return state

      const instances = [...state.instances]
      const [moved] = instances.splice(current, 1)
      instances.splice(newIndex, 0, moved)
      return { instances }
    })
  },

  clearCanvas: () => {
    set({ instances: [] })
  },

  getInstance: (id) => {
    return get().instances.find((inst) => inst.id === id)
  },
}))
