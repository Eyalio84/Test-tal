"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useAria } from "@/store/aria"
import { THEMES } from "@/lib/theme"
import toast from "react-hot-toast"

const THEME_PREVIEWS: Record<string, { label: string; emoji: string; desc: string }> = {
  jewelry:    { label: "Jewelry",    emoji: "💍", desc: "Luxury gold tones — Pearl & Gold" },
  candy:      { label: "Candy",      emoji: "🍬", desc: "Playful pastels — Sweet Drops" },
  bakery:     { label: "Bakery",     emoji: "🥐", desc: "Warm neutrals — The Flour Studio" },
  flowers:    { label: "Flowers",    emoji: "🌸", desc: "Soft pinks — Petal & Stem" },
  wine:       { label: "Wine",       emoji: "🍷", desc: "Deep burgundy — The Cellar" },
  restaurant: { label: "Restaurant", emoji: "🍽️", desc: "Amber warmth — Maison Dore" },
  portfolio:  { label: "Portfolio",  emoji: "📷", desc: "Minimal monochrome — Studio Noir" },
  saas:       { label: "SaaS",       emoji: "⚡", desc: "Electric violet — Velo" },
}

export default function AdminThemesPage() {
  const router               = useRouter()
  const [activeId, setActiveId] = useState<string | null>(null)
  const setStoreTheme        = useAria((s) => s.setActiveThemeId)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch("/api/theme")
      .then((r) => r.json())
      .then((d: { themeId: string }) => setActiveId(d.themeId))
      .catch(() => setActiveId("jewelry"))
  }, [])

  async function switchTheme(id: string) {
    const prev = activeId
    setActiveId(id) // optimistic
    setStoreTheme(id)

    try {
      const res = await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeId: id }),
      })
      if (!res.ok) throw new Error("Switch failed")
      toast.success(`Theme switched to ${THEME_PREVIEWS[id]?.label ?? id}`)
      startTransition(() => { router.refresh() })
    } catch {
      setActiveId(prev)
      setStoreTheme(prev ?? "jewelry")
      toast.error("Failed to switch theme — try again")
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-serif text-2xl text-ink mb-2">Theme Switcher</h1>
      <p className="text-ink/50 text-sm mb-8">
        Changes take effect immediately — no rebuild required.
        {isPending && <span className="ml-2 italic">Refreshing…</span>}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.keys(THEMES).map((id) => {
          const meta    = THEME_PREVIEWS[id]
          const theme   = THEMES[id]
          const isActive = id === activeId
          return (
            <button
              key={id}
              onClick={() => switchTheme(id)}
              disabled={isActive || isPending}
              className={[
                "relative rounded-xl border-2 p-4 text-left transition-all",
                isActive
                  ? "border-[var(--theme-accent)] bg-[var(--theme-accent)]/5 ring-2 ring-[var(--theme-accent)]/20"
                  : "border-stone-200 hover:border-stone-300 hover:shadow-sm bg-white",
                "disabled:cursor-default",
              ].join(" ")}
            >
              {isActive && (
                <span className="absolute top-2 right-2 text-[10px] font-medium bg-[var(--theme-accent)] text-white px-1.5 py-0.5 rounded-full">
                  Active
                </span>
              )}
              <div className="text-2xl mb-2">{meta?.emoji ?? "🎨"}</div>
              <div className="font-medium text-ink text-sm">{meta?.label ?? id}</div>
              <div className="text-xs text-ink/50 mt-0.5 leading-snug">{meta?.desc ?? theme.brand.tagline}</div>
              <div
                className="mt-3 h-1.5 rounded-full"
                style={{ background: theme.colors.accent }}
              />
            </button>
          )
        })}
      </div>

      <p className="mt-8 text-xs text-ink/30">
        Aria&apos;s voice, personality, and product knowledge update on next connect.
      </p>
    </div>
  )
}
