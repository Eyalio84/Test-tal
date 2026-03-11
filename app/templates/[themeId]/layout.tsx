import { notFound } from "next/navigation"
import { THEMES } from "@/lib/theme"
import { resolveTheme } from "@/lib/themeImages"
import { ThemeApplierStatic } from "@/components/layout/ThemeApplierStatic"
import { TemplateAriaContext } from "@/components/templates/TemplateAriaContext"

export default async function TemplateLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ themeId: string }>
}) {
  const { themeId } = await params
  const theme = await resolveTheme(themeId).catch(() => null)
  if (!theme) notFound()

  return (
    <>
      <TemplateAriaContext />
      <ThemeApplierStatic theme={theme} />
      {children}
    </>
  )
}
