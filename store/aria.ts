"use client"

import { create } from "zustand"

export type AriaState = "idle" | "connecting" | "listening" | "thinking" | "speaking"

export type AriaCommand =
  | { type: "NAVIGATE";         url: string }
  | { type: "SCROLL";           direction: "up" | "down" | "top" | "bottom"; amount?: number }
  | { type: "ADD_TO_CART";      slug: string; name: string }
  | { type: "OPEN_CART" }
  | { type: "FILTER";           category: string }
  | { type: "START_TOUR" }
  | { type: "END_TOUR" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "PENDING_CONFIRM";  action: string; args: Record<string, unknown> }

export interface PendingConfirm {
  action: string
  args: Record<string, unknown>
}

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

  // Theme
  activeThemeId:  string
  setActiveThemeId: (id: string) => void

  // ── Editor mode ──────────────────────────────────────────────────────────
  editorMode:     boolean
  draftContent:   Record<string, string>   // optimistic local cache
  undoStack:      string[]                 // SiteSnapshot IDs (oldest→newest)
  redoStack:      string[]                 // SiteSnapshot IDs for redo
  pendingConfirm: PendingConfirm | null    // destructive action awaiting confirm
  isPublishing:   boolean

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

  // Editor actions
  setEditorMode:      (v: boolean)                   => void
  setDraftContent:    (c: Record<string, string>)    => void
  updateDraftKey:     (key: string, value: string)   => void
  setPendingConfirm:  (c: PendingConfirm | null)     => void
  clearPendingConfirm: ()                            => void
  pushUndo:           (snapshotId: string)           => void
  popUndo:            ()                             => string | undefined
  pushRedo:           (snapshotId: string)           => void
  popRedo:            ()                             => string | undefined
  clearRedoStack:     ()                             => void
  setPublishing:      (v: boolean)                   => void
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

  // Theme
  activeThemeId: (process.env.NEXT_PUBLIC_THEME ?? "jewelry").toLowerCase(),
  setActiveThemeId: (activeThemeId) => set({ activeThemeId }),

  // Editor initial state
  editorMode:      false,
  draftContent:    {},
  undoStack:       [],
  redoStack:       [],
  pendingConfirm:  null,
  isPublishing:    false,

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

  // Editor actions
  setEditorMode:   (editorMode)   => set({ editorMode }),
  setDraftContent: (draftContent) => set({ draftContent }),
  updateDraftKey:  (key, value)   => set((s) => ({ draftContent: { ...s.draftContent, [key]: value } })),
  setPendingConfirm:   (pendingConfirm) => set({ pendingConfirm }),
  clearPendingConfirm: ()               => set({ pendingConfirm: null }),

  pushUndo: (snapshotId) => set((s) => ({
    undoStack: [...s.undoStack, snapshotId].slice(-10),
  })),
  popUndo: () => {
    const { undoStack } = get()
    if (undoStack.length === 0) return undefined
    const id = undoStack[undoStack.length - 1]
    set((s) => ({ undoStack: s.undoStack.slice(0, -1) }))
    return id
  },
  pushRedo: (snapshotId) => set((s) => ({
    redoStack: [...s.redoStack, snapshotId].slice(-10),
  })),
  popRedo: () => {
    const { redoStack } = get()
    if (redoStack.length === 0) return undefined
    const id = redoStack[redoStack.length - 1]
    set((s) => ({ redoStack: s.redoStack.slice(0, -1) }))
    return id
  },
  clearRedoStack: () => set({ redoStack: [] }),
  setPublishing:  (isPublishing) => set({ isPublishing }),
}))
