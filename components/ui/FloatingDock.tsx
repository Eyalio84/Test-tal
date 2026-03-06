"use client"

import { useState, useEffect } from "react"
import { useAria } from "@/store/aria"
import { useA11y } from "@/store/a11y"
import { useAriaLive } from "@/hooks/useAriaLive"

// ── Icons ──────────────────────────────────────────────────────────────────
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 0 1-7 7m0 0a7 7 0 0 1-7-7m7 7v4m0 0H8m4 0h4M9 11V7a3 3 0 1 1 6 0v4" />
  </svg>
)
const StopIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
)
const A11yIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8 7h-5v13h-2v-6h-2v6H9V9H4V7h16v2z" />
  </svg>
)
const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2zm0 0"/>
    <path d="M5 3l.9 2.6L8.5 6l-2.6.9L5 9.5l-.9-2.6L1.5 6l2.6-.9L5 3zm14 0l.9 2.6L22.5 6l-2.6.9L19 9.5l-.9-2.6L15.5 6l2.6-.9L19 3z" opacity=".6"/>
  </svg>
)
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// ── Transcript bubble ──────────────────────────────────────────────────────
function TranscriptBubble() {
  const { userTranscript, ariaTranscript, ariaState } = useAria()
  const text = ariaState === "speaking" ? ariaTranscript : userTranscript
  if (!text || ariaState === "idle" || ariaState === "connecting") return null

  const isAria = ariaState === "speaking"
  return (
    <div
      className="absolute bottom-20 right-0 w-60 rounded-2xl rounded-br-sm shadow-2xl overflow-hidden"
      style={{
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(201,169,110,0.2)",
      }}
    >
      <div className="px-3 pt-2.5 pb-2">
        <p className="text-[9px] tracking-[0.15em] uppercase mb-1" style={{ color: "rgba(201,169,110,0.7)" }}>
          {isAria ? "✦ Aria" : "You"}
        </p>
        <p className="text-white text-xs leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

// ── Sub-action button (glassmorphism) ──────────────────────────────────────
function DockAction({
  icon, label, onClick, accent,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  accent: string
}) {
  return (
    <div className="flex items-center gap-3 justify-end">
      <span
        className="text-[9px] tracking-[0.15em] uppercase font-medium px-2 py-1 rounded-full"
        style={{
          background: "rgba(10,10,10,0.6)",
          backdropFilter: "blur(8px)",
          color: "rgba(255,255,255,0.75)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {label}
      </span>
      <button
        onClick={onClick}
        aria-label={label}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          background: accent,
          boxShadow: `0 4px 20px ${accent}55`,
        }}
      >
        {icon}
      </button>
    </div>
  )
}

// ── Main orb ───────────────────────────────────────────────────────────────
function MainOrb({
  ariaState, isConnected, isOpen, onClick,
}: {
  ariaState: string; isConnected: boolean; isOpen: boolean; onClick: () => void
}) {
  const gradient = (() => {
    if (isOpen)          return "linear-gradient(135deg, #d4b483 0%, #b8923a 50%, #c9a96e 100%)"
    if (ariaState === "speaking")  return "linear-gradient(135deg, #f0f0f0 0%, #d0d0d0 50%, #ffffff 100%)"
    if (ariaState === "listening" || ariaState === "thinking")
                         return "linear-gradient(135deg, #ffe066 0%, #c9a96e 50%, #a07840 100%)"
    if (ariaState === "connecting") return "linear-gradient(135deg, #ffd700 0%, #c9a96e 100%)"
    // idle — rich gold
    return "linear-gradient(135deg, #e0c080 0%, #c9a96e 40%, #a07840 70%, #c9a96e 100%)"
  })()

  const glowColor = (() => {
    if (ariaState === "speaking")  return "0 0 0 3px rgba(255,255,255,0.4), 0 0 30px rgba(255,255,255,0.3), 0 8px 32px rgba(0,0,0,0.4)"
    if (ariaState === "listening") return "0 0 0 3px rgba(255,220,80,0.5), 0 0 30px rgba(201,169,110,0.4), 0 8px 32px rgba(0,0,0,0.4)"
    if (ariaState === "connecting")return "0 0 0 3px rgba(255,215,0,0.4), 0 0 20px rgba(201,169,110,0.3), 0 8px 32px rgba(0,0,0,0.4)"
    return "0 0 0 2px rgba(201,169,110,0.3), 0 4px 24px rgba(160,120,64,0.3), 0 8px 32px rgba(0,0,0,0.3)"
  })()

  const isAnimating = ["connecting","listening","speaking"].includes(ariaState)

  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? "Close assistant menu" : "Open assistant menu"}
      aria-expanded={isOpen}
      className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${isAnimating ? "animate-pulse" : ""}`}
      style={{ background: gradient, boxShadow: glowColor }}
    >
      {/* Inner highlight */}
      <span
        className="absolute inset-1 rounded-full pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 60%)" }}
      />

      {/* Icon */}
      <span className="relative z-10" style={{ color: ariaState === "speaking" ? "#555" : "#fff", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }}>
        {isOpen ? <CloseIcon /> : isConnected ? <MicIcon /> : <SparkleIcon />}
      </span>

      {/* Speaking ripple rings */}
      {ariaState === "speaking" && (
        <>
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(255,255,255,0.15)" }} />
          <span className="absolute -inset-2 rounded-full animate-ping [animation-delay:200ms]" style={{ background: "rgba(255,255,255,0.08)" }} />
        </>
      )}
      {ariaState === "listening" && (
        <span className="absolute -inset-1.5 rounded-full animate-ping" style={{ background: "rgba(255,220,80,0.12)" }} />
      )}
    </button>
  )
}

// ── FloatingDock ───────────────────────────────────────────────────────────
export function FloatingDock() {
  const { ariaState, isConnected, isOpen, setOpen } = useAria()
  const { openPanel } = useA11y()
  const { connect, disconnect } = useAriaLive()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

  function handleAriaToggle() {
    if (isConnected) disconnect()
    else connect()
  }

  const actions = [
    {
      icon:    <span className="text-white"><A11yIcon /></span>,
      label:   "Accessibility",
      onClick: () => { openPanel(); setOpen(false) },
      accent:  "linear-gradient(135deg, #c9a96e, #a07840)",
    },
    ...(whatsapp ? [{
      icon:    <span className="text-white"><WhatsAppIcon /></span>,
      label:   "WhatsApp",
      onClick: () => { window.open(`https://wa.me/${whatsapp}`, "_blank", "noopener,noreferrer"); setOpen(false) },
      accent:  "linear-gradient(135deg, #25d366, #128c7e)",
    }] : []),
    {
      icon:    <span className={isConnected ? "text-white" : "text-white"}>{isConnected ? <StopIcon /> : <MicIcon />}</span>,
      label:   isConnected ? "Stop Aria" : "Talk to Aria",
      onClick: () => { handleAriaToggle(); setOpen(false) },
      accent:  isConnected
        ? "linear-gradient(135deg, #ef4444, #b91c1c)"
        : "linear-gradient(135deg, #1a1a1a, #0a0a0a)",
    },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Transcript bubble */}
      {isConnected && <TranscriptBubble />}

      {/* Expanded actions */}
      {isOpen && (
        <div className="flex flex-col gap-3">
          {actions.map((a) => (
            <DockAction key={a.label} {...a} />
          ))}
        </div>
      )}

      <MainOrb
        ariaState={ariaState}
        isConnected={isConnected}
        isOpen={isOpen}
        onClick={() => setOpen(!isOpen)}
      />
    </div>
  )
}
