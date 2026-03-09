"use client"

import React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import type { Component } from "@prisma/client"

export default function ComponentsShowcase() {
  const [category, setCategory] = React.useState("")

  const { data: components = [] } = useQuery<Component[]>({
    queryKey: ["components", { category }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (category) params.append("category", category)
      const res = await fetch(`/api/components?${params}`)
      return res.json()
    },
  })

  const categories = Array.from(new Set(components.map((c) => c.category))).sort()

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="bg-ink text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-serif mb-3">Component Library</h1>
          <p className="text-white/80 text-lg">
            Explore our collection of {components.length} atomic components
          </p>
        </div>
      </div>

      {/* Filters & Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("")}
            className={`px-4 py-2 rounded-full text-sm transition ${
              category === ""
                ? "bg-ink text-white"
                : "bg-stone-100 text-ink/70 hover:bg-stone-200"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                category === cat
                  ? "bg-ink text-white"
                  : "bg-stone-100 text-ink/70 hover:bg-stone-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {components.map((component) => (
            <Link
              key={component.id}
              href={`/components/${component.slug}`}
              className="group p-6 border border-stone-200 rounded-lg hover:border-ink/30 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-ink group-hover:text-ink/80">
                  {component.name}
                </h3>
                <span className="inline-block px-2 py-1 text-xs bg-stone-100 text-ink/70 rounded">
                  {component.category}
                </span>
              </div>

              {component.description && (
                <p className="text-sm text-ink/60 mb-3 line-clamp-2">
                  {component.description}
                </p>
              )}

              <div className="text-xs text-ink/40 font-mono">
                aria: <code>{component.ariaName}</code>
              </div>

              <div className="mt-4 flex items-center text-xs text-ink/40 group-hover:text-ink/60 transition">
                View details →
              </div>
            </Link>
          ))}
        </div>

        {components.length === 0 && (
          <div className="text-center py-12">
            <p className="text-ink/50">No components found</p>
          </div>
        )}
      </div>
    </div>
  )
}
