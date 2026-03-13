"use client"

import { useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import { useQuery } from "@tanstack/react-query"

interface ImageCatalogItem {
  id: string
  url: string
  alt: string
}

interface ImagePanelProps {
  contentKey: string
  currentValue: string
  onSave: (key: string, value: string) => Promise<void>
}

export function ImagePanel({ contentKey, currentValue, onSave }: ImagePanelProps) {
  const [query, setQuery] = useState("")
  const [selectedImage, setSelectedImage] = useState(currentValue || "")
  const [isSaving, setIsSaving] = useState(false)

  const { data: images = [], isLoading } = useQuery<ImageCatalogItem[]>({
    queryKey: ["image-scout-catalog", query],
    queryFn: async () => {
      if (!query) return []
      const res = await fetch(`/api/admin/image-scout/catalog?q=${encodeURIComponent(query)}`)
      if (!res.ok) return []
      const data = await res.json()
      return data.results || []
    },
    enabled: query.length > 0,
  })

  const handleImageSelect = async (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setIsSaving(true)
    try {
      await onSave(contentKey, imageUrl)
      toast.success("Image selected ✓")
    } catch (err) {
      toast.error("Save failed")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-stone-800 rounded max-w-md">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-stone-300">Search Images</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., jewelry, gold, elegant"
          className="w-full px-3 py-2 rounded border border-stone-600 bg-stone-700 text-stone-100 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-stone-300">Results</label>
        {!query ? (
          <p className="text-xs text-stone-400">Search for an image above</p>
        ) : isLoading ? (
          <p className="text-xs text-stone-400">Loading…</p>
        ) : images.length === 0 ? (
          <p className="text-xs text-stone-400">No images found</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => handleImageSelect(img.url)}
                disabled={isSaving}
                className={`relative rounded overflow-hidden border-2 transition ${
                  selectedImage === img.url
                    ? "border-amber-400"
                    : "border-stone-600 hover:border-stone-500"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Image
                  src={img.url}
                  alt={img.alt}
                  width={120}
                  height={120}
                  className="w-full h-28 object-cover"
                />
                {selectedImage === img.url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-white text-sm font-medium">✓ Selected</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
