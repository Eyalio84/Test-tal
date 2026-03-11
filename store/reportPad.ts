import { create } from "zustand"
import { persist } from "zustand/middleware"

export type EntryType = "observation" | "bug" | "navigation" | "test" | "summary" | "aria_note"

export interface ReportEntry {
  timestamp: string // HH:MM:SS
  type: EntryType
  text: string
}

interface ReportPadStore {
  entries: ReportEntry[]
  isOpen: boolean
  sessionStart: string // ISO timestamp

  addEntry: (text: string, type: EntryType) => void
  clearAll: () => void
  toggleOpen: () => void
  exportMarkdown: () => string
}

export const useReportPad = create<ReportPadStore>()(
  persist(
    (set, get) => ({
      entries: [],
      isOpen: false,
      sessionStart: new Date().toISOString(),

      addEntry: (text, type) => {
        set((state) => {
          const now = new Date()
          const timestamp = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
          return {
            entries: [...state.entries, { timestamp, type, text }],
          }
        })
      },

      clearAll: () => set({ entries: [] }),

      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

      exportMarkdown: () => {
        const { entries, sessionStart } = get()
        if (entries.length === 0) return "# Session Report\n\nNo entries recorded."

        const startDate = new Date(sessionStart).toLocaleString()
        const lines = [
          `# Session Report\n`,
          `**Started:** ${startDate}\n`,
          `**Total entries:** ${entries.length}\n`,
        ]

        // Group by type
        const grouped = entries.reduce(
          (acc, entry) => {
            if (!acc[entry.type]) acc[entry.type] = []
            acc[entry.type].push(entry)
            return acc
          },
          {} as Record<EntryType, ReportEntry[]>
        )

        // Render each type section
        const typeLabels: Record<EntryType, string> = {
          observation: "Observations",
          bug: "Bugs Found",
          navigation: "Navigation",
          test: "Tests Performed",
          summary: "Summaries",
          aria_note: "Aria Notes",
        }

        for (const [type, typeLabel] of Object.entries(typeLabels)) {
          if (grouped[type as EntryType]) {
            lines.push(`\n## ${typeLabel}\n`)
            for (const entry of grouped[type as EntryType]) {
              lines.push(`- **${entry.timestamp}** ${entry.text}`)
            }
          }
        }

        return lines.join("\n")
      },
    }),
    {
      name: "report-pad-storage",
      partialize: (state) => ({ entries: state.entries, sessionStart: state.sessionStart }),
    }
  )
)
