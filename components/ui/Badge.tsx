import { cva, type VariantProps } from "class-variance-authority"
import type * as React from "react"
import { cn } from "@/lib/cn"

const badgeVariants = cva("inline-flex items-center px-2 py-0.5 text-xs rounded-sm font-sans", {
  variants: {
    variant: {
      default: "bg-stone-100 text-ink",
      success: "bg-green-50 text-green-700",
      warning: "bg-amber-50 text-amber-700",
      error: "bg-red-50 text-red-600",
      active: "bg-ink text-white",
      outline: "border border-stone-200 text-ink",
    },
  },
  defaultVariants: { variant: "default" },
})

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export function CountBadge({ count, className }: { count: number; className?: string }) {
  const display = count > 99 ? "99+" : String(count)
  return (
    <output
      aria-label={`${count} items`}
      className={cn(
        "inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-sans",
        className
      )}
    >
      {display}
    </output>
  )
}
