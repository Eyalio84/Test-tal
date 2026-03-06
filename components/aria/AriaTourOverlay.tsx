"use client"

import { useEffect, useState, useRef } from "react"
import { useAria, type TourStep } from "@/store/aria"
import { STORE_TOUR } from "@/lib/ariaTourSteps"
import { ariaConnect, sendTextToAria } from "@/hooks/useAriaLive"

// ── Spotlight hook (only used when step.selector is set) ───────────────────
function useSpotlight(selector: string | undefined) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  useEffect(() => {
    if (!selector) { setRect(null); return }
    function measure() {
      const el = document.querySelector(selector!)
      setRect(el ? el.getBoundingClientRect() : null)
    }
    measure()
    window.addEventListener("resize", measure)
    window.addEventListener("scroll", measure, true)
    return () => {
      window.removeEventListener("resize", measure)
      window.removeEventListener("scroll", measure, true)
    }
  }, [selector])
  return rect
}

// ── Tour card (two visual modes) ───────────────────────────────────────────
function TourCard({ step, index, total, onNext, onEnd }: {
  step: TourStep; index: number; total: number; onNext: () => void; onEnd: () => void
}) {
  const rect      = useSpotlight(step.selector)
  const [vh, setVh] = useState(0)
  const isSpotlight = Boolean(step.selector)

  useEffect(() => {
    setVh(window.innerHeight)
    const fn = () => setVh(window.innerHeight)
    window.addEventListener("resize", fn)
    return () => window.removeEventListener("resize", fn)
  }, [])

  if (vh === 0) return null

  // ── Spotlight mode (dark overlay + hole around element) ──────────────────
  if (isSpotlight) {
    const PAD      = 14
    const spot     = rect ?? new DOMRect(window.innerWidth / 2 - 80, vh / 2 - 50, 160, 100)
    const below    = spot.top < vh * 0.55
    const rawTop   = below ? spot.bottom + PAD + 8 : spot.top - PAD - 230
    const cardTop  = Math.min(Math.max(rawTop, 72), vh - 250)

    return (
      <>
        <svg className="fixed inset-0 z-[60] pointer-events-none" width="100%" height={vh} style={{ position:"fixed", top:0, left:0 }}>
          <defs>
            <mask id="aria-tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect x={spot.left-PAD} y={spot.top-PAD} width={spot.width+PAD*2} height={spot.height+PAD*2} rx="16" fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#aria-tour-mask)" />
          <rect x={spot.left-PAD} y={spot.top-PAD} width={spot.width+PAD*2} height={spot.height+PAD*2} rx="16" fill="none" stroke="#c9a96e" strokeWidth="2.5" />
        </svg>
        <div className="fixed z-[62] left-4 right-4 pointer-events-auto" style={{ top: cardTop }}>
          <Card step={step} index={index} total={total} onNext={onNext} onEnd={onEnd} />
        </div>
      </>
    )
  }

  // ── Page tour mode (no overlay — page fully visible, card floats at bottom) ─
  return (
    <div className="fixed bottom-6 left-4 right-20 z-[62] pointer-events-auto">
      <Card step={step} index={index} total={total} onNext={onNext} onEnd={onEnd} />
    </div>
  )
}

// ── Shared card UI ─────────────────────────────────────────────────────────
function Card({ step, index, total, onNext, onEnd }: {
  step: TourStep; index: number; total: number; onNext: () => void; onEnd: () => void
}) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background:"rgba(10,10,10,0.93)", backdropFilter:"blur(16px)", border:"1px solid rgba(201,169,110,0.3)" }}>
      {/* Progress bar */}
      <div className="h-0.5 bg-white/10">
        <div className="h-full transition-all duration-500" style={{ width:`${((index+1)/total)*100}%`, background:"#c9a96e" }} />
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:"linear-gradient(135deg, #e0c080, #a07840)" }}>
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-white">
              <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z"/>
            </svg>
          </div>
          <span style={{ color:"#c9a96e", fontSize:"10px", letterSpacing:"0.15em", textTransform:"uppercase" }}>
            Aria · {index+1} of {total}
          </span>
        </div>

        <h3 className="text-white font-serif text-base mb-1">{step.title}</h3>
        <p className="text-white/60 text-xs leading-relaxed">{step.description}</p>

        <div className="flex items-center justify-between mt-4">
          <button onClick={onEnd} className="text-white/30 text-xs hover:text-white/60 transition">
            End tour
          </button>
          <button
            onClick={index+1 >= total ? onEnd : onNext}
            className="px-5 py-2 rounded-full text-xs font-medium tracking-wider transition hover:scale-105 active:scale-95"
            style={{ background:"linear-gradient(135deg, #e0c080, #a07840)", color:"#fff" }}
          >
            {index+1 >= total ? "Done ✦" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────
export function AriaTourOverlay() {
  const { isTourActive, tourStep, tourSteps, isConnected, dispatchCommand, nextTourStep, endTour } = useAria()
  const narrationSentRef = useRef<number>(-1)
  const navigatedRef     = useRef<number>(-1)

  const steps = tourSteps.length > 0 ? tourSteps : STORE_TOUR
  const step  = steps[tourStep]

  // Auto-connect Aria when tour starts
  useEffect(() => {
    if (isTourActive && !isConnected) ariaConnect()
  }, [isTourActive, isConnected])

  // Navigate when step has a url (once per step)
  useEffect(() => {
    if (!isTourActive || !step?.url) return
    if (navigatedRef.current === tourStep) return
    navigatedRef.current = tourStep
    dispatchCommand({ type: "NAVIGATE", url: step.url })
  }, [isTourActive, tourStep, step, dispatchCommand])

  // Narrate each step — wait for connection, delay after navigation
  useEffect(() => {
    if (!isTourActive || !step?.narration) return
    if (narrationSentRef.current === tourStep) return
    if (!isConnected) return

    // Longer delay when navigating to give the page time to load
    const delay = tourStep === 0 ? 1800 : step.url ? 1200 : 500
    const timer = setTimeout(() => {
      sendTextToAria(step.narration)
      narrationSentRef.current = tourStep
    }, delay)
    return () => clearTimeout(timer)
  }, [isTourActive, isConnected, tourStep, step])

  // Reset guards when tour ends
  useEffect(() => {
    if (!isTourActive) {
      narrationSentRef.current = -1
      navigatedRef.current = -1
    }
  }, [isTourActive])

  if (!isTourActive) return null
  if (!step) { endTour(); return null }

  return (
    <TourCard
      step={step}
      index={tourStep}
      total={steps.length}
      onNext={nextTourStep}
      onEnd={endTour}
    />
  )
}
