export interface ChangelogEntry {
  date: string
  version: string
  capability: string
  description: string
}

export const ARIA_CHANGELOG: ChangelogEntry[] = [
  { date: "2026-03-12", version: "P5+", capability: "Guided platform tour",  description: "Can walk the owner through the entire platform step-by-step, logging each phase to the Report Pad." },
  { date: "2026-03-12", version: "P5+", capability: "Platform status report", description: "Can give a full structured status of what's built, what's live, and what's next on request." },
  { date: "2026-03-11", version: "P5", capability: "Template navigation",    description: "Can navigate to any product in all 8 template stores by name." },
  { date: "2026-03-11", version: "P5", capability: "Session Report Pad",     description: "Can write structured test notes to the Report Pad and generate session summaries." },
  { date: "2026-03-11", version: "P5", capability: "Individual product pages", description: "All 8 template stores now have full product detail pages with add-to-cart." },
  { date: "2026-03-09", version: "P4", capability: "Component registry",     description: "Knows the full component library and can describe any component by name." },
  { date: "2026-03-08", version: "DI", capability: "Private CDN",            description: "All theme images served from Cloudflare R2 — permanent, fast URLs." },
  { date: "2026-03-07", version: "P3", capability: "Theme switching",        description: "Can switch the active store theme by voice." },
  { date: "2026-03-07", version: "P2", capability: "Voice site editing",     description: "Can edit site content, change colors, add/remove sections, and publish by voice." },
  { date: "2026-03-07", version: "P1", capability: "Aria memory",            description: "Remembers personal details across sessions using save_memory." },
]

export function buildChangelogPrompt(): string {
  const recent = ARIA_CHANGELOG.slice(0, 6)
  return `\n## Your Recent Upgrades\n${recent.map((e) => `- [${e.date} · ${e.version}] ${e.capability}: ${e.description}`).join("\n")}`
}
