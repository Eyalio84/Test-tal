import { z } from "zod"
import { THEME_IDS } from "@/lib/theme"

// ── Media upload ───────────────────────────────────────────────────────────
export const uploadSchema = z.object({
  themeId: z.enum(THEME_IDS as [string, ...string[]]),
  slot:    z.string().min(1).max(64).regex(/^[a-z0-9-]+$/, "slot must be lowercase letters, numbers, hyphens"),
  alt:     z.string().max(256).optional().default(""),
})

export type UploadInput = z.infer<typeof uploadSchema>
