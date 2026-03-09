"use client"

import * as React from "react"
import { cn } from "@/lib/cn"

export interface TooltipProps {
  children: React.ReactNode
  content: string
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}

export function Tooltip({
  children,
  content,
  side = "top",
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)

  const sideClasses = {
    top: "bottom-full mb-2",
    right: "left-full ml-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
  }

  const arrowClasses = {
    top: "top-full border-t-white border-l-transparent border-r-transparent border-b-transparent",
    right: "right-full border-r-white border-t-transparent border-b-transparent border-l-transparent",
    bottom: "bottom-full border-b-white border-t-transparent border-l-transparent border-r-transparent",
    left: "left-full border-l-white border-t-transparent border-b-transparent border-r-transparent",
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "absolute z-50 bg-ink text-white text-xs rounded px-2 py-1 pointer-events-none whitespace-nowrap",
            sideClasses[side],
            className
          )}
          role="tooltip"
        >
          {content}
          <div
            className={cn(
              "absolute w-0 h-0 border-4",
              arrowClasses[side]
            )}
          />
        </div>
      )}
    </div>
  )
}
