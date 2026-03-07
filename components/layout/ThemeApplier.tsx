import { getActiveTheme } from "@/lib/getActiveTheme"

// Server component — injects CSS variables into <head> at render time.
// Values come only from build-time theme config (no user input), so no XSS risk.
export async function ThemeApplier() {
  const { colors, fonts } = await getActiveTheme()

  // All values are build-time constants from theme files — safe to inline.
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
