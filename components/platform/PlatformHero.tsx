import Link from "next/link"

export function PlatformHero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #1a0f2e 0%, #0e0a18 50%, #080610 100%)" }}
    >
      {/* Outer ambient glow — large, warm */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div
          className="w-[700px] h-[700px] rounded-full blur-[140px]"
          style={{ backgroundColor: "color-mix(in srgb, var(--theme-accent, #c9a96e) 22%, transparent)" }}
        />
      </div>
      {/* Inner accent glow — tighter, brighter center */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div
          className="w-[280px] h-[280px] rounded-full blur-[80px]"
          style={{ backgroundColor: "color-mix(in srgb, var(--theme-accent, #c9a96e) 18%, transparent)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-7 text-center">

        {/* Label */}
        <p className="text-zinc-400 text-xs tracking-[0.25em] uppercase">
          Say hello to Aria
        </p>

        {/* Aria orb */}
        <div className="relative flex items-center justify-center w-28 h-28" aria-hidden="true">
          {/* Outermost slow pulse ring */}
          <div
            className="absolute inset-[-12px] rounded-full animate-pulse opacity-30"
            style={{
              background: `radial-gradient(circle, color-mix(in srgb, var(--theme-accent, #c9a96e) 25%, transparent), transparent 70%)`,
            }}
          />
          {/* Mid glow ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              boxShadow: `0 0 48px 12px color-mix(in srgb, var(--theme-accent, #c9a96e) 28%, transparent)`,
            }}
          />
          {/* Inner warm circle */}
          <div
            className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center border"
            style={{
              background: "radial-gradient(circle at 40% 35%, #2a1f3d, #120d22)",
              borderColor: "color-mix(in srgb, var(--theme-accent, #c9a96e) 40%, transparent)",
            }}
          >
            <span className="text-2xl" style={{ color: "var(--theme-accent, #c9a96e)" }}>◎</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-5xl md:text-7xl text-white leading-tight">
          Your website,
          <br />
          built by voice.
        </h1>

        {/* Sub-headline */}
        <p className="text-zinc-300 text-lg max-w-md text-center leading-relaxed">
          Just talk to Aria. She builds your site in real time — headlines, products, design — all by voice.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
          <Link
            href="/templates"
            className="px-7 py-3 rounded-full font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--theme-accent, #c9a96e)" }}
          >
            See live templates →
          </Link>
          <Link
            href="/dashboard"
            className="px-7 py-3 rounded-full font-medium border text-zinc-200 transition-colors hover:text-white"
            style={{ borderColor: "color-mix(in srgb, var(--theme-accent, #c9a96e) 35%, transparent)" }}
          >
            Start for free →
          </Link>
        </div>

        {/* Trust line */}
        <p className="text-zinc-500 text-xs tracking-wide">
          Free to start · No credit card · 8 live themes
        </p>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <span className="text-zinc-600 text-xs animate-bounce select-none">↓</span>
      </div>
    </section>
  )
}
