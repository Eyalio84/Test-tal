import * as React from "react"
import { cn } from "@/lib/cn"

interface SkeletonProps {
  width?: string // Tailwind width class e.g. "w-48"
  height?: string // Tailwind height class e.g. "h-4"
  className?: string
  rounded?: "none" | "sm" | "base" | "lg" | "full"
}

const radiusMap = {
  none: "",
  sm: "rounded-sm",
  base: "rounded",
  lg: "rounded-lg",
  full: "rounded-full",
}

export function Skeleton({
  width = "w-full",
  height = "h-4",
  rounded = "base",
  className,
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading..."
      className={cn("animate-pulse bg-stone-200", width, height, radiusMap[rounded], className)}
    />
  )
}

interface SpinnerProps {
  label?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" }

export function Spinner({ label = "Loading...", size = "md", className }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex", className)}>
      <svg
        aria-hidden="true"
        className={cn("animate-spin text-ink/40", sizeMap[size])}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    </span>
  )
}
