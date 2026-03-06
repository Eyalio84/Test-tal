"use client"

import { useState, useEffect } from "react"
import { useAria } from "@/store/aria"
import { useA11y } from "@/store/a11y"
import { useAriaLive } from "@/hooks/useAriaLive"

// ── Orb state styles ──────────────────────────────────────────────────────
function useOrbStyle(state: string) {
  switch (state) {
    case "connecting":  return { bg: "bg-amber-400",  ring: "ring-amber-300/40",  pulse: true  }
    case "listening":   return { bg: "bg-yellow-400", ring: "ring-yellow-300/50", pulse: true  }
    case "thinking":    return { bg: "bg-blue-400",   ring: "ring-blue-300/50",   pulse: true  }
    case "speaking":    return { bg: "bg-white",      ring: "ring-white/50",      pulse: true  }
    default:            return { bg: "bg-[#c9a96e]",  ring: "ring-[#c9a96e]/30",  pulse: false }
  }
}

// ── Sub-action button ──────────────────────────────────────────────────────
function DockAction({
  icon, label, onClick, color = "bg-white text-ink",
}: {
  icon: React.ReactNode; label: string; onClick: () => void; color?: string
}) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <span className="text-[10px] tracking-widest uppercase text-white/80 whitespace-nowrap">
        {label}
      </span>
      <button
        onClick={onClick}
        aria-label={label}
        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition hover:scale-105 ${color}`}
      >
        {icon}
      </button>
    </div>
  )
}

// ── Transcript bubble ──────────────────────────────────────────────────────
function TranscriptBubble() {
  const { userTranscript, ariaTranscript, ariaState } = useAria()
  const text = ariaState === "speaking" ? ariaTranscript : userTranscript
  if (!text || ariaState === "idle") return null

  return (
    <div className="absolute bottom-16 right-0 w-64 bg-ink/90 text-white text-xs leading-relaxed p-3 rounded-xl rounded-br-none shadow-xl">
      <p className="opacity-50 text-[10px] uppercase tracking-widest mb-1">
        {ariaState === "speaking" ? "Aria" : "You"}
      </p>
      <p>{text}</p>
    </div>
  )
}

// ── Main FloatingDock ──────────────────────────────────────────────────────
export function FloatingDock() {
  const { ariaState, isConnected, isOpen, setOpen } = useAria()
  const { openPanel } = useA11y()
  const { connect, disconnect } = useAriaLive()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const orb = useOrbStyle(ariaState)
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

  function handleAriaToggle() {
    if (isConnected) {
      disconnect()
    } else {
      connect()
    }
  }

  const actions = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm8 7h-5v13h-2v-6h-2v6H9V9H4V7h16v2z" />
        </svg>
      ),
      label:   "Accessibility",
      onClick: () => { openPanel(); setOpen(false) },
      color:   "bg-[#c9a96e] text-white",
    },
    ...(whatsapp ? [{
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
      ),
      label:   "WhatsApp",
      onClick: () => {
        window.open(`https://wa.me/${whatsapp}`, "_blank", "noopener,noreferrer")
        setOpen(false)
      },
      color: "bg-green-500 text-white",
    }] : []),
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 0 1-7 7m0 0a7 7 0 0 1-7-7m7 7v4m0 0H8m4 0h4M9 11V7a3 3 0 1 1 6 0v4" />
        </svg>
      ),
      label:   isConnected ? "Stop Aria" : "Talk to Aria",
      onClick: () => { handleAriaToggle(); setOpen(false) },
      color:   isConnected ? "bg-red-400 text-white" : "bg-ink text-white",
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

      {/* Main orb button */}
      <button
        onClick={() => setOpen(!isOpen)}
        aria-label={isOpen ? "Close assistant menu" : "Open assistant menu"}
        aria-expanded={isOpen}
        className={`
          relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl
          transition-all duration-300 hover:scale-105
          ring-4 ${orb.ring} ${orb.bg}
          ${orb.pulse ? "animate-pulse" : ""}
        `}
      >
        {isOpen ? (
          /* X when open */
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : ariaState !== "idle" ? (
          /* Mic when active */
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 0 1-7 7m0 0a7 7 0 0 1-7-7m7 7v4m0 0H8m4 0h4M9 11V7a3 3 0 1 1 6 0v4" />
          </svg>
        ) : (
          /* Gemstone / sparkle when idle */
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
            <path d="M12 2L9.5 8.5H3L8.3 12.7L6.2 19.5L12 15.3L17.8 19.5L15.7 12.7L21 8.5H14.5L12 2Z"/>
          </svg>
        )}

        {/* Speaking ripple rings */}
        {ariaState === "speaking" && (
          <>
            <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
            <span className="absolute -inset-2 rounded-full bg-white/10 animate-ping [animation-delay:150ms]" />
          </>
        )}
      </button>
    </div>
  )
}
