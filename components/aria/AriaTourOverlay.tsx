"use client"

import { useEffect, useState, useRef } from "react"
import { useAria, type TourStep } from "@/store/aria"
import { STORE_TOUR } from "@/lib/ariaTourSteps"
import { ariaConnect, sendTextToAria } from "@/hooks/useAriaLive"

function useSpotlight(selector: string) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  useEffect(() => {
    function measure() {
      const el = document.querySelector(selector)
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

function TourCard({ step, index, total, onNext, onEnd }: {
  step: TourStep; index: number; total: number; onNext: () => void; onEnd: () => void
}) {
  const rect = useSpotlight(step.selector)
  const [vh, setVh] = useState(0)

  useEffect(() => {
    setVh(window.innerHeight)
    const onResize = () => setVh(window.innerHeight)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  if (vh === 0) return null
  const PAD = 14
  const spotlight = rect ?? new DOMRect(window.innerWidth / 2 - 80, vh / 2 - 50, 160, 100)

  const cardBelow = spotlight.top < vh * 0.55
  const rawTop    = cardBelow ? spotlight.bottom + PAD + 8 : spotlight.top - PAD - 230
  const cardTop   = Math.min(Math.max(rawTop, 72), vh - 250)

  return (
    <>
      {/* Overlay with spotlight hole */}
      <svg className="fixed inset-0 z-[60] pointer-events-none" width="100%" height={vh} style={{ position:"fixed", top:0, left:0 }}>
        <defs>
          <mask id="aria-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={spotlight.left-PAD} y={spotlight.top-PAD} width={spotlight.width+PAD*2} height={spotlight.height+PAD*2} rx="16" fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#aria-tour-mask)" />
        <rect
          x={spotlight.left-PAD} y={spotlight.top-PAD}
          width={spotlight.width+PAD*2} height={spotlight.height+PAD*2}
          rx="16" fill="none" stroke="#c9a96e" strokeWidth="2.5"
        />
      </svg>

      {/* Info card */}
      <div className="fixed z-[62] left-4 right-4 pointer-events-auto" style={{ top: cardTop }}>
        <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background:"rgba(10,10,10,0.93)", backdropFilter:"blur(16px)", border:"1px solid rgba(201,169,110,0.3)" }}>
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

            <h3 className="text-white font-serif text-lg mb-1">{step.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">{step.description}</p>

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
      </div>
    </>
  )
}

export function AriaTourOverlay() {
  const { isTourActive, tourStep, tourSteps, isConnected, nextTourStep, endTour } = useAria()
  const narrationSentRef = useRef<number>(-1)

  const steps = tourSteps.length > 0 ? tourSteps : STORE_TOUR
  const step  = steps[tourStep]

  // Auto-connect Aria when tour starts
  useEffect(() => {
    if (isTourActive && !isConnected) {
      ariaConnect()
    }
  }, [isTourActive, isConnected])

  // Narrate each step once — wait for connection if needed
  useEffect(() => {
    if (!isTourActive || !step?.narration) return
    if (narrationSentRef.current === tourStep) return

    if (!isConnected) return  // will re-run when isConnected flips true

    // Small delay so Aria isn't still saying the greeting when step 0 fires
    const delay = tourStep === 0 ? 1800 : 400
    const timer = setTimeout(() => {
      sendTextToAria(step.narration!)
      narrationSentRef.current = tourStep
    }, delay)
    return () => clearTimeout(timer)
  }, [isTourActive, isConnected, tourStep, step])

  // Reset tracker when tour ends
  useEffect(() => {
    if (!isTourActive) narrationSentRef.current = -1
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
