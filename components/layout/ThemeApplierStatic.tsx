import type { ThemeConfig } from "@/lib/theme"

// Server component — injects CSS variables into <head> at render time.
// Values come only from build-time theme config (no user input), so no XSS risk.
export function ThemeApplierStatic({ theme }: { theme: ThemeConfig }) {
  const { colors, fonts } = theme
  const lines = [
    `--theme-accent:${colors.accent}`,
    `--theme-accent-light:${colors.accentLight}`,
    `--theme-accent-dark:${colors.accentDark}`,
    `--theme-bg:${colors.background}`,
    `--theme-font-heading:${fonts.heading}`,
  ].join(";")
  const css = `:root{${lines}}body{background-color:${colors.background}}`
  /* eslint-disable-next-line react/no-danger -- values are build-time constants, not user input */
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
