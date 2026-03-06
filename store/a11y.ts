import { create } from "zustand"
import { persist } from "zustand/middleware"

type FontSize   = "normal" | "large" | "xlarge"
type Spacing    = "normal" | "relaxed" | "loose"
type Saturation = "normal" | "grayscale" | "high"

interface A11yStore {
  fontSize:     FontSize
  highContrast: boolean
  dyslexiaFont: boolean
  reduceMotion: boolean
  spacing:      Spacing
  saturation:   Saturation
  isOpen:       boolean

  setFontSize:     (v: FontSize)   => void
  setHighContrast: (v: boolean)    => void
  setDyslexiaFont: (v: boolean)    => void
  setReduceMotion: (v: boolean)    => void
  setSpacing:      (v: Spacing)    => void
  setSaturation:   (v: Saturation) => void
  openPanel:  () => void
  closePanel: () => void
  resetAll:   () => void
}

const defaults = {
  fontSize:     "normal" as FontSize,
  highContrast: false,
  dyslexiaFont: false,
  reduceMotion: false,
  spacing:      "normal" as Spacing,
  saturation:   "normal" as Saturation,
}

export const useA11y = create<A11yStore>()(
  persist(
    (set) => ({
      ...defaults,
      isOpen: false,

      setFontSize:     (v) => set({ fontSize: v }),
      setHighContrast: (v) => set({ highContrast: v }),
      setDyslexiaFont: (v) => set({ dyslexiaFont: v }),
      setReduceMotion: (v) => set({ reduceMotion: v }),
      setSpacing:      (v) => set({ spacing: v }),
      setSaturation:   (v) => set({ saturation: v }),
      openPanel:  () => set({ isOpen: true }),
      closePanel: () => set({ isOpen: false }),
      resetAll:   () => set({ ...defaults }),
    }),
    {
      name: "a11y-prefs",
      // isOpen is transient — never persisted
      partialize: (state) => ({
        fontSize:     state.fontSize,
        highContrast: state.highContrast,
        dyslexiaFont: state.dyslexiaFont,
        reduceMotion: state.reduceMotion,
        spacing:      state.spacing,
        saturation:   state.saturation,
      }),
    }
  )
)
