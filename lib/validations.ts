import { z } from "zod"
import { THEME_IDS } from "@/lib/theme"

// ── Media upload ───────────────────────────────────────────────────────────
export const uploadSchema = z.object({
  themeId: z.enum(THEME_IDS as [string, ...string[]]),
  slot:    z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, "slot must be lowercase letters, numbers, hyphens"),
  alt:     z.string().max(256).optional().default(""),
})

export type UploadInput = z.infer<typeof uploadSchema>

// ── Component registry ─────────────────────────────────────────────────────
export const COMPONENT_CATEGORIES = [
  "button", "input", "select", "card", "overlay", "nav", "section",
  "badge", "data-display", "feedback", "form", "image", "dropdown", "slider",
  "modal", "popover", "tooltip", "dialog", "alert-dialog", "breadcrumb",
  "pagination", "tabs", "sidebar", "hero", "features", "testimonials",
  "cta", "table", "skeleton", "spinner", "empty-state", "avatar",
  "tag", "chip", "progress-bar", "toast", "checkbox", "radio"
] as const

export const componentPropsSchema = z.record(
  z.string(),
  z.object({
    type: z.enum(["string", "number", "boolean", "color", "enum"]),
    required: z.boolean().optional(),
    default: z.unknown().optional(),
    enum: z.array(z.string()).optional(),
    description: z.string().optional(),
  })
)

export const createComponentSchema = z.object({
  slug: z.string()
    .min(1).max(64)
    .regex(/^[a-z0-9_-]+$/, "slug must be lowercase letters, numbers, hyphens, underscores"),
  name: z.string().min(1).max(100),
  category: z.string().refine((val) => COMPONENT_CATEGORIES.includes(val as never), {
    message: "Invalid component category"
  }),
  description: z.string().max(500).optional(),
  ariaName: z.string()
    .min(1).max(64)
    .regex(/^[a-z0-9_]+$/, "ariaName must be lowercase letters, numbers, underscores"),
  propsSchema: componentPropsSchema.optional().default({}),
  previewImage: z.string().optional(),
})

export const updateComponentSchema = createComponentSchema.partial()

export type CreateComponentInput = z.infer<typeof createComponentSchema>
export type UpdateComponentInput = z.infer<typeof updateComponentSchema>

// ── Pages ───────────────────────────────────────────────────────────────────
export const createPageSchema = z.object({
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, hyphens"),
  title: z.string().min(1).max(200),
  isVisible: z.boolean().optional().default(true),
  order: z.number().int().min(0).optional().default(0),
})

export const updatePageSchema = createPageSchema.partial()

export const createSectionSchema = z.object({
  componentSlug: z.string().min(1).max(64),
  props: z.record(z.string(), z.any()).optional().default({}),
  order: z.number().int().min(0).optional().default(0),
  isVisible: z.boolean().optional().default(true),
})

export const updateSectionSchema = createSectionSchema.partial()

export type CreatePageInput = z.infer<typeof createPageSchema>
export type UpdatePageInput = z.infer<typeof updatePageSchema>
export type CreateSectionInput = z.infer<typeof createSectionSchema>
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>
