"use client"

import { useEffect } from "react"
import { useAriaLive } from "@/hooks/useAriaLive"
import { useAria } from "@/store/aria"

const EXAMPLE_PROMPTS = [
  "Change my hero headline",
  "Switch to bakery theme",
  "Add a product",
]

export default function DashboardAriaPanel() {
  const { connect } = useAriaLive()
  const setAriaContext = useAria((s) => s.setAriaContext)

  useEffect(() => {
    setAriaContext("member")
  }, [setAriaContext])

  return (
    <div className="bg-zinc-950 rounded-lg p-6 flex flex-col items-center gap-5 h-full min-h-[320px]">
      {/* Pulsing orb */}
      <div className="relative flex items-center justify-center w-20 h-20 mt-2">
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, color-mix(in srgb, var(--theme-accent, #c9a96e) 40%, transparent), transparent 70%)`,
            boxShadow: `0 0 32px 6px color-mix(in srgb, var(--theme-accent, #c9a96e) 25%, transparent)`,
          }}
        />
        <div className="relative z-10 w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-700">
          <span className="text-xl" style={{ color: "var(--theme-accent, #c9a96e)" }}>
            ◎
          </span>
        </div>
      </div>

      <p className="text-zinc-400 text-xs tracking-widest uppercase">Ready to help</p>

      {/* Example prompt chips */}
      <div className="flex flex-col gap-2 w-full">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={connect}
            className="text-left text-xs text-zinc-400 border border-zinc-800 rounded px-3 py-2 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
          >
            &ldquo;{prompt}&rdquo;
          </button>
        ))}
      </div>

      {/* Connect button */}
      <button
        onClick={connect}
        className="mt-auto w-full py-2.5 rounded text-sm font-medium text-zinc-900 transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--theme-accent, #c9a96e)" }}
      >
        Connect Aria
      </button>
    </div>
  )
}
