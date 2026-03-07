import { notFound } from "next/navigation"
import Image from "next/image"
import { THEMES } from "@/lib/theme"

export async function generateStaticParams() {
  return Object.keys(THEMES).map((id) => ({ themeId: id }))
}

export default async function DemoAboutPage({ params }: { params: Promise<{ themeId: string }> }) {
  const { themeId } = await params
  const theme = THEMES[themeId]
  if (!theme) notFound()

  const { about } = theme

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-xs tracking-widest uppercase text-ink/40 mb-2">About</p>
        <h1 className="font-serif text-3xl text-ink mb-8">{theme.brand.name}</h1>

        <p className="text-ink/70 text-base leading-relaxed mb-12">{about.story}</p>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {about.values.map((v) => (
            <div key={v.title}>
              <p className="font-medium text-ink text-sm mb-2">{v.title}</p>
              <p className="text-ink/60 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        {about.team.length > 0 && (
          <>
            <h2 className="font-serif text-2xl text-ink mb-6">Team</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {about.team.map((member) => (
                <div key={member.name} className="text-center">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mx-auto mb-3">
                    <Image src={member.image ?? "/placeholder-avatar.jpg"} alt={member.name} fill className="object-cover" />
                  </div>
                  <p className="text-ink text-sm font-medium">{member.name}</p>
                  <p className="text-ink/50 text-xs mt-0.5">{member.role}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
