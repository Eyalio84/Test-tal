"use client"

import React, { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { THEMES } from "@/lib/theme"

const THEME_IDS = Object.keys(THEMES)

export default function AdminMediaPage() {
  const [activeTheme, setActiveTheme] = React.useState<string>("jewelry")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingSlot  = useRef<string | null>(null)
  const queryClient  = useQueryClient()

  const theme = THEMES[activeTheme]
  const slots = [
    { slot: "hero", label: "Hero Image", defaultImg: theme.hero.image },
    ...theme.products.map((p) => ({ slot: p.slug, label: p.name, defaultImg: p.image })),
  ]

  // Fetch current R2 URLs from DB for this theme
  const { data: r2Images = {} } = useQuery<Record<string, string>>({
    queryKey: ["media-images", activeTheme],
    queryFn:  () => fetch(`/api/media/images?themeId=${activeTheme}`).then((r) => r.json()),
  })

  function currentUrl(slot: string, defaultImg: string): string {
    return r2Images[slot] ?? defaultImg
  }

  // Upload mutation — invalidates the query so the grid refreshes after upload
  const { mutate: upload, isPending: uploading, variables: uploadingSlot } = useMutation({
    mutationFn: async ({ slot, file }: { slot: string; file: File }) => {
      const form = new FormData()
      form.append("file",    file)
      form.append("themeId", activeTheme)
      form.append("slot",    slot)
      form.append("alt",     slot)
      const res = await fetch("/api/media/upload", { method: "POST", body: form })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Upload failed")
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-images", activeTheme] })
    },
  })

  function openPicker(slot: string) {
    pendingSlot.current = slot
    fileInputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const slot = pendingSlot.current
    if (file && slot) upload({ slot, file })
    e.target.value = ""
  }

  function onDrop(slot: string, e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) upload({ slot, file })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif text-ink mb-1">Media Library</h2>
        <p className="text-xs text-ink/50">
          Upload images to Cloudflare R2. Changes apply to all demo visitors immediately.
        </p>
      </div>

      {/* Theme tabs */}
      <div className="flex flex-wrap gap-2">
        {THEME_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTheme(id)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              activeTheme === id
                ? "bg-ink text-paper border-ink"
                : "border-ink/20 text-ink/60 hover:border-ink/40"
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-3 gap-4">
        {slots.map(({ slot, label, defaultImg }) => {
          const isUploading = uploading && uploadingSlot?.slot === slot
          return (
            <div
              key={slot}
              className="group relative cursor-pointer rounded-lg overflow-hidden border border-ink/10 hover:border-ink/30 transition-colors"
              onClick={() => openPicker(slot)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(slot, e)}
            >
              <div className="aspect-square relative bg-paper/50">
                <Image
                  src={currentUrl(slot, defaultImg)}
                  alt={label}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 20vw"
                  unoptimized
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-ink/40 flex items-center justify-center">
                    <span className="text-paper text-xs">Uploading…</span>
                  </div>
                )}
              </div>
              <div className="px-2 py-1.5 flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink truncate">{label}</p>
                  <p className="text-[10px] text-ink/40 truncate">{slot}</p>
                </div>
                <Link
                  href={`/admin/image-scout?theme=${activeTheme}&slot=${slot}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-2 py-0.5 bg-stone-900 text-white rounded hover:bg-stone-700"
                >
                  Scout →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  )
}
