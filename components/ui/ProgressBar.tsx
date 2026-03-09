import * as React from "react"
import { cn } from "@/lib/cn"

export interface ProgressBarProps {
  value: number // 0-100
  label?: string
  className?: string
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, label, className }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-ink">{label}</label>
          <span className="text-xs text-ink/50">{Math.round(value)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-ink transition-all duration-300 ease-in-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
)
ProgressBar.displayName = "ProgressBar"
