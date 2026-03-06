"use client"

import { useEffect } from "react"
import { useA11y } from "@/store/a11y"

// Applies persisted a11y preferences as CSS classes on <html> after mount
function A11yApplier() {
  const { fontSize, highContrast, dyslexiaFont, reduceMotion, spacing, saturation } = useA11y()

  useEffect(() => {
    const el = document.documentElement

    el.classList.remove("a11y-font-large", "a11y-font-xlarge")
    if (fontSize === "large")  el.classList.add("a11y-font-large")
    if (fontSize === "xlarge") el.classList.add("a11y-font-xlarge")

    el.classList.toggle("a11y-high-contrast", highContrast)
    el.classList.toggle("a11y-dyslexia",      dyslexiaFont)
    el.classList.toggle("a11y-reduce-motion",  reduceMotion)

    el.classList.remove("a11y-spacing-relaxed", "a11y-spacing-loose")
    if (spacing === "relaxed") el.classList.add("a11y-spacing-relaxed")
    if (spacing === "loose")   el.classList.add("a11y-spacing-loose")

    el.classList.remove("a11y-grayscale", "a11y-high-saturation")
    if (saturation === "grayscale") el.classList.add("a11y-grayscale")
    if (saturation === "high")      el.classList.add("a11y-high-saturation")
  }, [fontSize, highContrast, dyslexiaFont, reduceMotion, spacing, saturation])

  return null
}

export function AccessibilityPanel() {
  const {
    isOpen, openPanel, closePanel,
    fontSize,     setFontSize,
    highContrast, setHighContrast,
    dyslexiaFont, setDyslexiaFont,
    reduceMotion, setReduceMotion,
    spacing,      setSpacing,
    saturation,   setSaturation,
    resetAll,
  } = useA11y()

  return (
    <>
      <A11yApplier />

      {/* Panel — triggered from FloatingDock */}
      {isOpen && (
        <div
          id="a11y-panel"
          role="dialog"
          aria-label="Accessibility settings"
          aria-modal="false"
          className="fixed bottom-24 left-6 z-50 w-72 bg-white border border-stone-200 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <h2 className="text-[10px] tracking-widest uppercase text-ink/60 font-medium">
              Accessibility
            </h2>
            <button
              onClick={closePanel}
              aria-label="Close accessibility panel"
              className="text-ink/40 hover:text-ink transition text-xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="p-4 flex flex-col gap-5 max-h-[420px] overflow-y-auto">

            {/* ── Text size ── */}
            <div>
              <p className="text-[10px] tracking-widest uppercase text-ink/40 mb-2">Text Size</p>
              <div className="flex gap-2">
                {(["normal", "large", "xlarge"] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    aria-pressed={fontSize === size}
                    className={`flex-1 py-1.5 border text-sm font-medium transition ${
                      fontSize === size
                        ? "bg-ink text-white border-ink"
                        : "border-stone-200 text-ink/60 hover:border-ink hover:text-ink"
                    }`}
                  >
                    {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Toggle switches ── */}
            <div className="flex flex-col gap-3">
              {([
                { label: "High Contrast",         value: highContrast, onChange: setHighContrast },
                { label: "Dyslexia-Friendly Font", value: dyslexiaFont, onChange: setDyslexiaFont },
                { label: "Reduce Motion",           value: reduceMotion, onChange: setReduceMotion },
              ] as const).map(({ label, value, onChange }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-ink/70">{label}</span>
                  <button
                    role="switch"
                    aria-checked={value}
                    aria-label={label}
                    onClick={() => onChange(!value)}
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                      value ? "bg-ink" : "bg-stone-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        value ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* ── Line spacing ── */}
            <div>
              <p className="text-[10px] tracking-widest uppercase text-ink/40 mb-2">Line Spacing</p>
              <div className="flex gap-2">
                {(["normal", "relaxed", "loose"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpacing(s)}
                    aria-pressed={spacing === s}
                    className={`flex-1 py-1.5 border text-xs tracking-wide capitalize transition ${
                      spacing === s
                        ? "bg-ink text-white border-ink"
                        : "border-stone-200 text-ink/60 hover:border-ink hover:text-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Color / saturation ── */}
            <div>
              <p className="text-[10px] tracking-widest uppercase text-ink/40 mb-2">Color</p>
              <div className="flex gap-2">
                {(["normal", "grayscale", "high"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSaturation(s)}
                    aria-pressed={saturation === s}
                    className={`flex-1 py-1.5 border text-xs transition ${
                      saturation === s
                        ? "bg-ink text-white border-ink"
                        : "border-stone-200 text-ink/60 hover:border-ink hover:text-ink"
                    }`}
                  >
                    {s === "normal" ? "Normal" : s === "grayscale" ? "B&W" : "High"}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Reset ── */}
            <button
              onClick={resetAll}
              className="text-xs text-ink/40 hover:text-ink transition underline underline-offset-2 text-center"
            >
              Reset all settings
            </button>
          </div>
        </div>
      )}
    </>
  )
}
