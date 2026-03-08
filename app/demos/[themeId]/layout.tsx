import { notFound } from "next/navigation"
import { THEMES } from "@/lib/theme"
import { ThemeApplierStatic } from "@/components/layout/ThemeApplierStatic"
import { DemoAriaContext } from "@/components/demos/DemoAriaContext"

export default async function DemoLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ themeId: string }>
}) {
  const { themeId } = await params
  const theme = THEMES[themeId]
  if (!theme) notFound()

  return (
    <>
      <DemoAriaContext />
      <ThemeApplierStatic theme={theme} />
      {children}
    </>
  )
}
