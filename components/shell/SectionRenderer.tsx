"use client"

import { Suspense } from "react"
import { SECTION_REGISTRY } from "@/lib/sectionRegistry"
import { useEditMode } from "@/store/editMode"

interface Section {
  id: string
  componentSlug: string
  props: Record<string, unknown>
  order: number
  isVisible: boolean
}

function SectionPlaceholder({ slug }: { slug: string }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="bg-stone-100 rounded-xl p-8 text-center">
        <p className="text-stone-400 text-sm">
          Unknown section: <code className="bg-stone-200 px-2 py-0.5 rounded text-xs">{slug}</code>
        </p>
      </div>
    </section>
  )
}

function SectionLoading() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="bg-stone-50 rounded-xl p-8 animate-pulse h-48" />
    </section>
  )
}

export function SectionRenderer({
  sections,
  insertSlot,
}: {
  sections: Section[]
  insertSlot?: (index: number) => React.ReactNode
}) {
  const editMode = useEditMode((s) => s.editMode)

  const visible = sections.filter((s) => s.isVisible || editMode)

  return (
    <div>
      {visible.map((section, idx) => {
        const Component = SECTION_REGISTRY[section.componentSlug]

        return (
          <div key={section.id} data-section-id={section.id}>
            {/* Insert slot before this section (edit mode only) */}
            {editMode && insertSlot?.(idx)}

            {/* Section with optional opacity for hidden sections in edit mode */}
            <div className={!section.isVisible && editMode ? "opacity-40" : ""}>
              {Component ? (
                <Suspense fallback={<SectionLoading />}>
                  <Component {...section.props} />
                </Suspense>
              ) : (
                <SectionPlaceholder slug={section.componentSlug} />
              )}
            </div>
          </div>
        )
      })}

      {/* Insert slot after last section */}
      {editMode && insertSlot?.(visible.length)}
    </div>
  )
}
