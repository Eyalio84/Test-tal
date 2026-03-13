"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ShellTab = "home" | "pages" | "aria" | "dashboard" | "manage"

interface ShellStore {
  drawerOpen: boolean
  activeTab: ShellTab
  toggleDrawer: () => void
  setDrawerOpen: (v: boolean) => void
  setActiveTab: (tab: ShellTab) => void
}

export const useShell = create<ShellStore>()(
  persist(
    (set) => ({
      drawerOpen: false,
      activeTab: "home",
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
      setActiveTab: (activeTab) => set({ activeTab }),
    }),
    {
      name: "storekit-shell",
      partialize: (state) => ({ activeTab: state.activeTab }),
    }
  )
)
