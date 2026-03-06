"use client"

import { create } from "zustand"

export type AriaState = "idle" | "connecting" | "listening" | "thinking" | "speaking"

export type AriaCommand =
  | { type: "NAVIGATE";      url: string }
  | { type: "SCROLL";        direction: "up" | "down" | "top" | "bottom"; amount?: number }
  | { type: "ADD_TO_CART";   slug: string; name: string }
  | { type: "OPEN_CART" }
  | { type: "FILTER";        category: string }
  | { type: "START_TOUR" }
  | { type: "END_TOUR" }

export interface TourStep {
  selector?: string         // CSS selector to spotlight — if absent, no dark overlay (page visible)
  url?: string              // Navigate here when step is shown
  title: string
  description: string
  narration: string         // What Aria says aloud at this step
}

interface AriaStore {
  // Connection & state
  ariaState:    AriaState
  isConnected:  boolean
  isOpen:       boolean      // FloatingDock expanded

  // Conversation
  userTranscript:  string
  ariaTranscript:  string
  currentPage:     string

  // Guided tour
  isTourActive: boolean
  tourStep:     number
  tourSteps:    TourStep[]

  // Pending command (consumed by AriaCommandDispatcher)
  pendingCommand: AriaCommand | null

  // Actions
  setAriaState:       (s: AriaState) => void
  setConnected:       (v: boolean)   => void
  setOpen:            (v: boolean)   => void
  toggleOpen:         ()             => void
  setUserTranscript:  (t: string)    => void
  setAriaTranscript:  (t: string)    => void
  setCurrentPage:     (p: string)    => void
  dispatchCommand:    (c: AriaCommand) => void
  clearCommand:       ()             => void
  startTour:          (steps: TourStep[]) => void
  nextTourStep:       ()             => void
  endTour:            ()             => void
}

export const useAria = create<AriaStore>((set, get) => ({
  ariaState:       "idle",
  isConnected:     false,
  isOpen:          false,
  userTranscript:  "",
  ariaTranscript:  "",
  currentPage:     "/",
  isTourActive:    false,
  tourStep:        0,
  tourSteps:       [],
  pendingCommand:  null,

  setAriaState:       (ariaState)      => set({ ariaState }),
  setConnected:       (isConnected)    => set({ isConnected }),
  setOpen:            (isOpen)         => set({ isOpen }),
  toggleOpen:         ()               => set((s) => ({ isOpen: !s.isOpen })),
  setUserTranscript:  (userTranscript) => set({ userTranscript }),
  setAriaTranscript:  (ariaTranscript) => set({ ariaTranscript }),
  setCurrentPage:     (currentPage)    => set({ currentPage }),
  dispatchCommand:    (pendingCommand) => set({ pendingCommand }),
  clearCommand:       ()               => set({ pendingCommand: null }),

  startTour: (tourSteps) => set({ isTourActive: true, tourStep: 0, tourSteps }),
  nextTourStep: () => {
    const { tourStep, tourSteps } = get()
    if (tourStep + 1 >= tourSteps.length) {
      set({ isTourActive: false, tourStep: 0, tourSteps: [] })
    } else {
      set({ tourStep: tourStep + 1 })
    }
  },
  endTour: () => set({ isTourActive: false, tourStep: 0, tourSteps: [] }),
}))
