"use client"

import * as React from "react"
import { cn } from "@/lib/cn"

export interface PopoverProps {
  trigger: React.ReactNode
  content: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  className?: string
  contentClassName?: string
}

export function Popover({
  trigger,
  content,
  side = "bottom",
  className,
  contentClassName,
}: PopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Close popover when clicking outside
  React.useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current?.contains(event.target as Node) ||
        contentRef.current?.contains(event.target as Node)
      ) {
        return
      }
      setIsOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const sideClasses = {
    top: "bottom-full mb-2",
    right: "left-full ml-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          ref={contentRef}
          className={cn(
            "absolute z-50 bg-white border border-stone-200 rounded-lg shadow-lg p-3 min-w-max",
            sideClasses[side],
            contentClassName
          )}
          role="dialog"
          aria-label="Popover"
        >
          {content}
        </div>
      )}
    </div>
  )
}
