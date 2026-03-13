"use client"

import { create } from "zustand"

export interface PanelAnchor {
  top: number
  left: number
  width: number
  height: number
}

export interface EditModeStore {
  editMode: boolean
  showPalette: boolean
  selectedSection: string | null
  panelAnchor: PanelAnchor | null
  toggleEditMode: () => void
  togglePalette: () => void
  selectSection: (id: string, anchor: PanelAnchor) => void
  clearSelection: () => void
}

export const useEditMode = create<EditModeStore>((set) => ({
  editMode: false,
  showPalette: false,
  selectedSection: null,
  panelAnchor: null,
  toggleEditMode: () =>
    set((s) => ({
      editMode: !s.editMode,
      selectedSection: null,
      panelAnchor: null,
    })),
  togglePalette: () => set((s) => ({ showPalette: !s.showPalette })),
  selectSection: (id, anchor) => set({ selectedSection: id, panelAnchor: anchor }),
  clearSelection: () => set({ selectedSection: null, panelAnchor: null }),
}))
