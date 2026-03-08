import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/cn"

const cardVariants = cva(
  "bg-white border",
  {
    variants: {
      variant: {
        default:  "border-stone-200 rounded-lg",
        stat:     "border-stone-100",                     // no rounding — matches admin stats cards
        shortcut: "border-stone-200 rounded-lg hover:border-stone-300 hover:shadow-sm transition",
        flat:     "border-stone-100 rounded",
      },
      padding: {
        none: "",
        sm:   "p-3",
        md:   "p-5",
        lg:   "p-6",
      },
    },
    defaultVariants: { variant: "default", padding: "none" },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return (
    <div
      data-variant={variant ?? "default"}
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-3 border-b border-stone-100 text-xs tracking-widest uppercase text-ink/60", className)}
      {...props}
    />
  )
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-5 py-3 border-t border-stone-100 flex items-center justify-between", className)}
      {...props}
    />
  )
}
