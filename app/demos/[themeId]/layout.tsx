import { notFound } from "next/navigation"
import Link from "next/link"
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
      {/* Demo banner strip */}
      <div className="fixed top-0 inset-x-0 z-50 h-7 bg-zinc-900 flex items-center justify-between px-6">
        <span className="text-[10px] tracking-widest uppercase text-zinc-400">
          Demo: {theme.brand.name} · Aria is in character
        </span>
        <Link href="/demos" className="text-[10px] tracking-widest uppercase text-zinc-400 hover:text-white transition">
          ← All demos
        </Link>
      </div>
      {/* Push content below banner + navbar */}
      <div className="pt-7">{children}</div>
    </>
  )
}
