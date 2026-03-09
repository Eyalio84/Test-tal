"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import type { Component } from "@prisma/client"

export default function ComponentDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const { data: component, isLoading } = useQuery<Component>({
    queryKey: ["component", params.slug],
    queryFn: async () => {
      // Since we don't have a GET /api/components/:slug endpoint, fetch all and filter
      const res = await fetch("/api/components")
      const components: Component[] = await res.json()
      const found = components.find((c) => c.slug === params.slug)
      if (!found) throw new Error("Component not found")
      return found
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-ink/50">Loading...</div>
      </div>
    )
  }

  if (!component) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-serif text-ink">Component not found</h1>
        <Link href="/components" className="text-blue-600 hover:underline">
          ← Back to library
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Breadcrumb */}
      <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/components" className="text-sm text-blue-600 hover:underline">
          ← Components
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-serif text-ink mb-2">
                {component.name}
              </h1>
              <p className="text-lg text-ink/60">{component.description}</p>
            </div>
            <span className="px-3 py-1 bg-stone-100 text-ink/70 rounded-full text-sm">
              {component.category}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Aria Information */}
        <section>
          <h2 className="text-2xl font-serif text-ink mb-4">Aria Integration</h2>
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
            <p className="text-sm text-ink/70 mb-2">Reference this component in Aria with:</p>
            <code className="block bg-white border border-stone-200 rounded px-3 py-2 font-mono text-sm text-ink overflow-x-auto">
              {component.ariaName}
            </code>
          </div>
        </section>

        {/* Props Schema */}
        <section>
          <h2 className="text-2xl font-serif text-ink mb-4">Props Schema</h2>
          <div className="bg-white border border-stone-200 rounded-lg p-6 overflow-x-auto">
            <pre className="font-mono text-sm text-ink/80 whitespace-pre-wrap break-words">
              {JSON.stringify(component.propsSchema, null, 2)}
            </pre>
          </div>
        </section>

        {/* Metadata */}
        <section className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-ink/70 mb-1 uppercase tracking-wider">
              Category
            </h3>
            <p className="text-lg text-ink">{component.category}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink/70 mb-1 uppercase tracking-wider">
              Created
            </h3>
            <p className="text-lg text-ink">
              {new Date(component.createdAt).toLocaleDateString()}
            </p>
          </div>
        </section>

        {/* Related Components */}
        <section>
          <h2 className="text-2xl font-serif text-ink mb-4">Related Components</h2>
          <Link
            href={`/components?category=${component.category}`}
            className="inline-flex items-center px-4 py-2 bg-ink text-white rounded hover:bg-ink/90 transition"
          >
            View {component.category} components →
          </Link>
        </section>
      </div>
    </div>
  )
}
