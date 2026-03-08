"use client"

import { useState, useRef, useTransition } from "react"
import Image from "next/image"
import { THEMES } from "@/lib/theme"

const THEME_IDS = Object.keys(THEMES)

type SlotImages = Record<string, string> // slot → current URL

export default function AdminMediaPage() {
  const [activeTheme, setActiveTheme] = useState<string>("jewelry")
  const [slotImages, setSlotImages]   = useState<SlotImages>({})
  const [uploading, setUploading]     = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingSlot  = useRef<string | null>(null)
  const [, startTransition] = useTransition()

  const theme = THEMES[activeTheme]

  const slots = [
    { slot: "hero", label: "Hero Image", defaultImg: theme.hero.image },
    ...theme.products.map((p) => ({ slot: p.slug, label: p.name, defaultImg: p.image })),
  ]

  function currentUrl(slot: string, defaultImg: string): string {
    return slotImages[`${activeTheme}:${slot}`] ?? defaultImg
  }

  async function uploadFile(slot: string, file: File) {
    setUploading(slot)
    setError(null)
    const form = new FormData()
    form.append("file",    file)
    form.append("themeId", activeTheme)
    form.append("slot",    slot)
    form.append("alt",     slot)

    try {
      const res  = await fetch("/api/media/upload", { method: "POST", body: form })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      if (data.url) {
        startTransition(() => {
          setSlotImages((prev) => ({ ...prev, [`${activeTheme}:${slot}`]: data.url! }))
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(null)
    }
  }

  function openPicker(slot: string) {
    pendingSlot.current = slot
    fileInputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const slot = pendingSlot.current
    if (file && slot) uploadFile(slot, file)
    e.target.value = ""
  }

  function onDrop(slot: string, e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(slot, file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif text-ink mb-1">Media Library</h2>
        <p className="text-xs text-ink/50">Upload images to Cloudflare R2. Changes apply to all demo visitors immediately.</p>
      </div>

      {/* Theme tabs */}
      <div className="flex flex-wrap gap-2">
        {THEME_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setActiveTheme(id)}
            className={`px-3 py-1 text-xs rounded-full border transition ${
              activeTheme === id
                ? "bg-ink text-white border-ink"
                : "border-ink/20 text-ink/60 hover:border-ink/40"
            }`}
          >
            {THEMES[id].brand.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
      )}

      {/* Slot grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {slots.map(({ slot, label, defaultImg }) => {
          const imgUrl   = currentUrl(slot, defaultImg)
          const isUploading = uploading === slot

          return (
            <div
              key={slot}
              className="group relative border border-ink/10 rounded-lg overflow-hidden bg-stone-100 cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(slot, e)}
              onClick={() => openPicker(slot)}
            >
              <div className="aspect-square relative">
                <Image
                  src={imgUrl}
                  alt={label}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition">
                  {isUploading ? "Uploading…" : "Replace"}
                </span>
              </div>
              <div className="px-2 py-1.5 bg-white border-t border-ink/10">
                <p className="text-[11px] text-ink/70 truncate">{label}</p>
                <p className="text-[10px] text-ink/30 font-mono truncate">{slot}</p>
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  )
}
