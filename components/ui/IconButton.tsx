import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"
import { cn } from "@/lib/cn"

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink",
  {
    variants: {
      variant: {
        default: "hover:bg-stone-100",
        primary: "bg-ink text-white hover:bg-ink/80",
        secondary: "border border-ink text-ink hover:bg-ink hover:text-white",
        ghost: "text-ink hover:bg-stone-100",
        destructive: "text-red-600 hover:bg-red-50",
      },
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  label: string // Required for a11y
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, label, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(iconButtonVariants({ variant, size }), className)}
      aria-label={label}
      {...props}
    />
  )
)
IconButton.displayName = "IconButton"

export { iconButtonVariants }
