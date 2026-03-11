"use client"

import { useState, useCallback, useEffect } from "react"
import { SLOT_MAP, THEME_IDS, getSlotsForTheme, type ThemeSlot } from "@/lib/slotMap"
import type { PexelsPhoto } from "@/lib/pexels"
import toast from "react-hot-toast"

// ── Types ──────────────────────────────────────────────────────────────────

type ResultStatus = "pending" | "accepted" | "rejected"

interface SearchResult {
  photo:       PexelsPhoto
  status:      ResultStatus
  rejectReason?: string
}

const REJECT_REASONS = [
  "Wrong vibe",
  "Wrong color palette",
  "Too stock / generic",
  "Poor quality",
  "Wrong subject",
  "Too busy",
]

// ── Comparison panel ───────────────────────────────────────────────────────

function ComparisonPanel({
  themeId,
  slotLabel,
  currentUrl,
  replacingWith,
}: {
  themeId:      string
  slotLabel:    string
  currentUrl:   string | null
  replacingWith: PexelsPhoto | null
}) {
  const hasCurrent = !!currentUrl
  const hasNext    = !!replacingWith

  if (!hasCurrent && !hasNext) return null

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-4">
      <p className="text-[10px] tracking-widest uppercase text-ink/40 mb-3">
        {themeId} / {slotLabel}
      </p>
      <div className="flex gap-3 items-stretch">
        {/* Current */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-ink/40 mb-1.5 font-medium uppercase tracking-wide">Current</p>
          <div className="aspect-video rounded overflow-hidden bg-stone-100 border border-stone-200">
            {hasCurrent ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUrl} alt="Current CDN image" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-ink/30">
                No image yet
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center text-ink/30 text-lg self-center shrink-0">→</div>

        {/* Replacing with */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-ink/40 mb-1.5 font-medium uppercase tracking-wide">
            {hasNext ? "Replacing with" : "Select below"}
          </p>
          <div className={`aspect-video rounded overflow-hidden border ${hasNext ? "border-emerald-300 ring-1 ring-emerald-400" : "border-stone-200 bg-stone-50"}`}>
            {hasNext ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={replacingWith!.src.medium} alt={replacingWith!.alt} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-ink/30 gap-1">
                <span className="text-xl">↓</span>
                <span>Accept an image below</span>
              </div>
            )}
          </div>
          {hasNext && (
            <p className="text-[10px] text-ink/40 mt-1 truncate">📷 {replacingWith!.photographer}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SlotBadge({ slot, label }: { slot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 rounded">
      {label} <span className="opacity-50">({slot})</span>
    </span>
  )
}

function ResultCard({
  result,
  index,
  onAccept,
  onReject,
}: {
  result:    SearchResult
  index:     number
  onAccept:  (i: number) => void
  onReject:  (i: number, reason: string) => void
}) {
  const [showReasons, setShowReasons] = useState(false)
  const { photo, status } = result

  const ringColor = status === "accepted" ? "ring-2 ring-emerald-500"
    : status === "rejected"              ? "ring-2 ring-red-400 opacity-50"
    :                                     "ring-1 ring-stone-200"

  return (
    <div className={`relative rounded-lg overflow-hidden bg-stone-100 ${ringColor} transition-all`}>
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src.medium}
          alt={photo.alt || `Result ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        {/* Status overlay */}
        {status === "accepted" && (
          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
            <span className="text-2xl">✓</span>
          </div>
        )}
        {status === "rejected" && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
            <span className="text-xs text-red-700 font-medium bg-white/90 px-2 py-1 rounded">
              {result.rejectReason ?? "Rejected"}
            </span>
          </div>
        )}
        {/* Index badge */}
        <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center font-mono">
          {index + 1}
        </span>
      </div>

      {/* Photographer credit */}
      <div className="px-2 py-1 text-[10px] text-ink/40 truncate">
        📷 {photo.photographer}
      </div>

      {/* Action buttons */}
      {status === "pending" && (
        <div className="px-2 pb-2 flex gap-1.5">
          <button
            onClick={() => onAccept(index)}
            className="flex-1 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
          >
            ✓ Accept
          </button>
          <button
            onClick={() => setShowReasons(!showReasons)}
            className="flex-1 py-1.5 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            ✗ Reject
          </button>
        </div>
      )}

      {/* Reject reason picker */}
      {showReasons && status === "pending" && (
        <div className="px-2 pb-2 flex flex-wrap gap-1">
          {REJECT_REASONS.map(r => (
            <button
              key={r}
              onClick={() => { onReject(index, r); setShowReasons(false) }}
              className="text-[10px] px-2 py-0.5 bg-stone-200 hover:bg-red-100 hover:text-red-700 rounded transition"
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Re-evaluate if rejected */}
      {status !== "pending" && (
        <div className="px-2 pb-2">
          <button
            onClick={() => onAccept(index)}
            className="w-full py-1 text-[10px] text-ink/50 hover:text-ink border border-stone-200 rounded transition"
          >
            ↺ Re-evaluate
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ImageScoutPage() {
  const [themeId,   setThemeId]   = useState<string>(THEME_IDS[0])
  const [slot,      setSlot]      = useState<string>(getSlotsForTheme(THEME_IDS[0])[0]?.slot ?? "hero")
  const [prompt,    setPrompt]    = useState<string>(getSlotsForTheme(THEME_IDS[0])[0]?.promptHint ?? "")
  const [source,    setSource]    = useState<"pexels" | "gemini">("pexels")
  const [results,   setResults]   = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedSlots, setUploadedSlots] = useState<Set<string>>(new Set())
  const [currentCdnUrl, setCurrentCdnUrl] = useState<string | null>(null)

  const currentSlotDef: ThemeSlot | undefined =
    getSlotsForTheme(themeId).find(s => s.slot === slot)

  // Derived: first accepted photo (the "replacing with" preview)
  const replacingWith = results.find(r => r.status === "accepted")?.photo ?? null

  // ── Fetch current CDN image whenever theme/slot changes ─────────────────
  useEffect(() => {
    setCurrentCdnUrl(null)
    fetch(`/api/media/images?themeId=${themeId}`)
      .then(r => r.json())
      .then((map: Record<string, string>) => {
        setCurrentCdnUrl(map[slot] ?? null)
      })
      .catch(() => setCurrentCdnUrl(null))
  }, [themeId, slot])

  // ── Pre-fill from URL params (e.g. ?theme=flowers&slot=hero from Media page) ─
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const themeParam = params.get("theme")
    const slotParam  = params.get("slot")
    if (!themeParam || !THEME_IDS.includes(themeParam)) return
    const themeSlots = getSlotsForTheme(themeParam)
    const target = slotParam ? themeSlots.find(s => s.slot === slotParam) : themeSlots[0]
    if (!target) return
    setThemeId(themeParam)
    setSlot(target.slot)
    setPrompt(target.promptHint)
    setResults([])
  }, [])

  // ── Slot picker sync ────────────────────────────────────────────────────
  function handleThemeChange(id: string) {
    const slots = getSlotsForTheme(id)
    setThemeId(id)
    setSlot(slots[0]?.slot ?? "hero")
    setPrompt(slots[0]?.promptHint ?? "")
    setResults([])
  }

  function handleSlotChange(s: string) {
    setSlot(s)
    const def = getSlotsForTheme(themeId).find(sl => sl.slot === s)
    if (def) setPrompt(def.promptHint)
    setResults([])
  }

  // ── Search ──────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!prompt.trim()) return
    setSearching(true)
    setResults([])

    try {
      const res = await fetch("/api/admin/image-scout/search", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          query:       prompt,
          themeId,
          slot,
          orientation: currentSlotDef?.aspectRatio ?? "landscape",
          source,
        }),
      })
      const data = await res.json() as { photos?: PexelsPhoto[]; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? "Search failed")

      setResults((data.photos ?? []).map(photo => ({ photo, status: "pending" as ResultStatus })))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed")
    } finally {
      setSearching(false)
    }
  }, [prompt, themeId, slot, source, currentSlotDef])

  // ── Accept / Reject ─────────────────────────────────────────────────────
  function handleAccept(index: number) {
    setResults(prev => prev.map((r, i) =>
      i === index ? { ...r, status: "accepted", rejectReason: undefined } : r
    ))
  }

  function handleReject(index: number, reason: string) {
    setResults(prev => prev.map((r, i) =>
      i === index ? { ...r, status: "rejected", rejectReason: reason } : r
    ))
  }

  // ── Upload accepted ─────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    const accepted = results.filter(r => r.status === "accepted")
    if (!accepted.length) { toast.error("Accept at least one image first"); return }

    setUploading(true)
    const uploadTarget = accepted[0]   // upload the first accepted image to the current slot

    try {
      const res = await fetch("/api/admin/image-scout/upload", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          imageUrl: uploadTarget.photo.src.large2x,
          themeId,
          slot,
          altText:  uploadTarget.photo.alt || `${themeId} ${slot} image`,
          prompt,
          source:   source === "pexels" ? "pexels" : "gemini-search",
          pexelsId: String(uploadTarget.photo.id),
        }),
      })
      const data = await res.json() as { ok?: boolean; url?: string; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Upload failed")

      toast.success(`✓ Uploaded to ${themeId}/${slot}`)
      setUploadedSlots(prev => new Set([...prev, `${themeId}/${slot}`]))
      setCurrentCdnUrl(data.url ?? null)  // update "Current" panel immediately
      setResults([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }, [results, themeId, slot, prompt, source])

  // ── Next slot ───────────────────────────────────────────────────────────
  function handleNextSlot() {
    const slots = getSlotsForTheme(themeId)
    const currentIdx = slots.findIndex(s => s.slot === slot)
    const next = slots[currentIdx + 1]
    if (next) {
      setSlot(next.slot)
      setPrompt(next.promptHint)
      setResults([])
    } else {
      toast("All slots for this theme complete!")
    }
  }

  const acceptedCount = results.filter(r => r.status === "accepted").length
  const slots = getSlotsForTheme(themeId)

  return (
    <div className="space-y-6">
      {/* ── Slot picker ───────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Theme */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs text-ink/50 tracking-widest uppercase">Theme</label>
            <select
              value={themeId}
              onChange={e => handleThemeChange(e.target.value)}
              className="border border-stone-200 rounded px-3 py-1.5 text-sm bg-white text-ink focus:outline-none focus:border-[var(--theme-accent)]"
            >
              {THEME_IDS.map(id => (
                <option key={id} value={id}>{id.charAt(0).toUpperCase() + id.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Slot */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs text-ink/50 tracking-widest uppercase">Slot</label>
            <select
              value={slot}
              onChange={e => handleSlotChange(e.target.value)}
              className="border border-stone-200 rounded px-3 py-1.5 text-sm bg-white text-ink focus:outline-none focus:border-[var(--theme-accent)]"
            >
              {slots.map(s => (
                <option key={s.slot} value={s.slot}>
                  {s.label} {uploadedSlots.has(`${themeId}/${s.slot}`) ? "✓" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink/50 tracking-widest uppercase">Source</label>
            <div className="flex border border-stone-200 rounded overflow-hidden">
              {(["pexels", "gemini"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`px-3 py-1.5 text-xs transition ${source === s ? "bg-stone-900 text-white" : "bg-white text-ink/60 hover:text-ink"}`}
                >
                  {s === "pexels" ? "Pexels" : "Gemini"}
                </button>
              ))}
            </div>
          </div>

          {/* Target R2 key preview */}
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs text-ink/50 tracking-widest uppercase">R2 Target</label>
            <code className="text-xs text-ink/60 bg-stone-50 border border-stone-200 rounded px-3 py-2 font-mono">
              themes/{themeId}/{slot}.webp
            </code>
          </div>
        </div>

        {/* Slot progress */}
        <div className="flex gap-1.5 flex-wrap">
          {slots.map(s => (
            <button
              key={s.slot}
              onClick={() => handleSlotChange(s.slot)}
              className={`text-[10px] px-2 py-0.5 rounded border transition ${
                s.slot === slot
                  ? "bg-stone-900 text-white border-stone-900"
                  : uploadedSlots.has(`${themeId}/${s.slot}`)
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-white text-ink/50 border-stone-200 hover:border-stone-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Before / After comparison panel ──────────────────────────── */}
      <ComparisonPanel
        themeId={themeId}
        slotLabel={currentSlotDef?.label ?? slot}
        currentUrl={currentCdnUrl}
        replacingWith={replacingWith}
      />

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-lg p-4">
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <SlotBadge slot={slot} label={currentSlotDef?.label ?? slot} />
              <span className="text-xs text-ink/40">{currentSlotDef?.aspectRatio}</span>
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSearch() } }}
              rows={2}
              placeholder="Describe the image you need..."
              className="w-full border border-stone-200 rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-[var(--theme-accent)] text-ink"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !prompt.trim()}
            className="mt-6 px-5 py-2.5 bg-stone-900 text-white text-sm rounded hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      {/* ── Results grid ──────────────────────────────────────────────── */}
      {results.length > 0 && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink/60">
              {results.length} results · {acceptedCount} accepted
            </p>
            <div className="flex gap-2">
              {acceptedCount > 0 && (
                <>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    {uploading ? "Uploading…" : `↑ Upload to ${slot}`}
                  </button>
                  <button
                    onClick={handleNextSlot}
                    className="px-4 py-2 border border-stone-200 text-sm rounded hover:bg-stone-50 transition"
                  >
                    Next slot →
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result, i) => (
              <ResultCard
                key={result.photo.id}
                result={result}
                index={i}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────── */}
      {!searching && results.length === 0 && (
        <div className="text-center py-16 text-ink/30">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm">Select a theme + slot, refine the prompt, then search.</p>
          <p className="text-xs mt-1">Accepted images upload directly to R2 and update ThemeImage.</p>
        </div>
      )}

      {searching && (
        <div className="text-center py-16 text-ink/30">
          <p className="text-sm animate-pulse">Searching {source === "pexels" ? "Pexels" : "Gemini"}…</p>
        </div>
      )}
    </div>
  )
}
