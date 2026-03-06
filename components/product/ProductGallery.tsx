"use client"

import { useState, useCallback } from "react"
import Image from "next/image"

interface ProductGalleryProps {
  images: string[]
  name: string
}

export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") setActive((i) => Math.min(i + 1, images.length - 1))
    if (e.key === "ArrowLeft")  setActive((i) => Math.max(i - 1, 0))
    if (e.key === "Escape")     setZoomed(false)
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setZoomed((v) => !v) }
  }, [images.length])

  const src = images[active] ?? ""

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${name} image ${active + 1} of ${images.length}. Press Enter to zoom, arrow keys to navigate.`}
        onKeyDown={handleKeyDown}
        onClick={() => setZoomed(true)}
        className="relative aspect-square bg-stone-100 cursor-zoom-in overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        {src && (
          <Image
            src={src}
            alt={`${name}, view ${active + 1}`}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
      </div>

      {/* Thumbnails — only if multiple images */}
      {images.length > 1 && (
        <div role="tablist" aria-label="Product views" className="flex gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={active === i}
              aria-label={`View ${i + 1}`}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 border-2 transition overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                active === i ? "border-ink" : "border-transparent hover:border-stone-300"
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom lightbox */}
      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed product image"
          onClick={() => setZoomed(false)}
          onKeyDown={(e) => e.key === "Escape" && setZoomed(false)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8 cursor-zoom-out"
        >
          <div className="relative w-full max-w-2xl aspect-square">
            <Image src={src} alt={name} fill className="object-contain" sizes="672px" />
          </div>
          <button
            autoFocus
            onClick={(e) => { e.stopPropagation(); setZoomed(false) }}
            className="absolute top-6 right-6 text-white/70 hover:text-white text-3xl leading-none"
            aria-label="Close zoomed image"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
