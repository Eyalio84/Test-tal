"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

interface PageSection {
  id: string
  componentSlug: string
  order: number
  isVisible: boolean
}

interface Page {
  id: string
  slug: string
  title: string
  isVisible: boolean
  order: number
  sections: PageSection[]
}

// ── Icons ──────────────────────────────────────────────────────────────────
function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 opacity-40">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}
function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  )
}
function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

// ── Page card ──────────────────────────────────────────────────────────────
function PageCard({
  page,
  isFirst,
  isLast,
  onToggle,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  page: Page
  isFirst: boolean
  isLast: boolean
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}) {
  return (
    <div className={`bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4 ${!page.isVisible ? "opacity-60" : ""}`}>
      {/* Reorder */}
      <div className="flex flex-col gap-1">
        <button onClick={onMoveUp} disabled={isFirst} className="text-stone-400 hover:text-stone-700 disabled:opacity-20 transition" aria-label="Move up">
          <ArrowUpIcon />
        </button>
        <button onClick={onMoveDown} disabled={isLast} className="text-stone-400 hover:text-stone-700 disabled:opacity-20 transition" aria-label="Move down">
          <ArrowDownIcon />
        </button>
      </div>

      {/* Info — clickable to edit */}
      <Link href={`/pages/${page.slug}`} className="flex-1 min-w-0 group">
        <h3 className="font-medium text-sm text-ink truncate group-hover:text-stone-600 transition">{page.title}</h3>
        <p className="text-xs text-stone-400 mt-0.5">/{page.slug} · {page.sections.length} section{page.sections.length !== 1 ? "s" : ""}</p>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-stone-100 transition" aria-label={page.isVisible ? "Hide page" : "Show page"}>
          <EyeIcon visible={page.isVisible} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition" aria-label="Delete page">
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

// ── New page form ──────────────────────────────────────────────────────────
function NewPageForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }),
      })
      if (!res.ok) throw new Error("Failed to create page")
      return res.json()
    },
    onSuccess: () => {
      setTitle("")
      setSlug("")
      onCreated()
    },
  })

  return (
    <div id="new-page-form" className="bg-white rounded-xl border border-dashed border-stone-300 p-4">
      <h3 className="text-sm font-medium text-ink mb-3">New Page</h3>
      <div className="flex gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title"
          className="flex-1 text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug (auto)"
          className="w-32 text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
        <button
          onClick={() => createMut.mutate()}
          disabled={!title || createMut.isPending}
          className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition"
        >
          {createMut.isPending ? "..." : "Add"}
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function PageManagerClient() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ pages: Page[] }>({
    queryKey: ["pages"],
    queryFn: async () => {
      const res = await fetch("/api/pages")
      if (!res.ok) throw new Error("Failed to fetch pages")
      return res.json()
    },
  })

  const pages = data?.pages ?? []

  const updateMut = useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to update page")
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pages/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete page")
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  })

  const seedMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/pages/seed", { method: "POST" })
      if (!res.ok) throw new Error("Failed to seed pages")
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  })

  function handleReorder(pageId: string, direction: "up" | "down") {
    const idx = pages.findIndex((p) => p.id === pageId)
    if (idx === -1) return
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= pages.length) return

    // Swap orders
    updateMut.mutate({ id: pages[idx].id, order: pages[swapIdx].order })
    updateMut.mutate({ id: pages[swapIdx].id, order: pages[idx].order })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-serif tracking-wider text-ink">Pages</h1>
        {pages.length > 0 && (
          <span className="text-xs text-stone-400">{pages.length} page{pages.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-stone-100 rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && pages.length === 0 && (
        <div className="mb-8 rounded-2xl border border-stone-200 bg-white overflow-hidden">
          {/* Illustration area */}
          <div className="bg-gradient-to-br from-stone-50 to-stone-100 px-6 py-10 text-center">
            <div className="flex justify-center gap-3 mb-5">
              {["Home", "Products", "About"].map((label) => (
                <div key={label} className="w-20 h-14 rounded-lg bg-white border border-stone-200 shadow-sm flex items-center justify-center">
                  <span className="text-[10px] text-stone-400 font-medium">{label}</span>
                </div>
              ))}
            </div>
            <h2 className="font-serif text-xl text-ink mb-2">Build your site, page by page</h2>
            <p className="text-sm text-stone-500 max-w-sm mx-auto">
              Start from a template with pre-built pages, or create a blank canvas and add sections one at a time.
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 py-5 flex flex-col sm:flex-row items-center gap-3 border-t border-stone-100">
            <button
              onClick={() => seedMut.mutate()}
              disabled={seedMut.isPending}
              className="w-full sm:w-auto text-sm bg-stone-900 text-white px-6 py-2.5 rounded-lg hover:bg-stone-700 disabled:opacity-40 transition font-medium"
            >
              {seedMut.isPending ? "Setting up..." : "Start from template"}
            </button>
            <span className="text-xs text-stone-400">or</span>
            <button
              onClick={() => {
                const form = document.getElementById("new-page-form")
                form?.scrollIntoView({ behavior: "smooth" })
                form?.querySelector("input")?.focus()
              }}
              className="w-full sm:w-auto text-sm text-stone-600 px-6 py-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition font-medium"
            >
              Create blank page
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {pages.map((page, idx) => (
          <PageCard
            key={page.id}
            page={page}
            isFirst={idx === 0}
            isLast={idx === pages.length - 1}
            onToggle={() => updateMut.mutate({ id: page.id, isVisible: !page.isVisible })}
            onMoveUp={() => handleReorder(page.id, "up")}
            onMoveDown={() => handleReorder(page.id, "down")}
            onDelete={() => deleteMut.mutate(page.id)}
          />
        ))}
      </div>

      <NewPageForm onCreated={() => qc.invalidateQueries({ queryKey: ["pages"] })} />
    </div>
  )
}
