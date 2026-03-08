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

export type CardVariant = NonNullable<VariantProps<typeof cardVariants>["variant"]>

// Context lets sub-components (CardHeader/Body/Footer) adapt to the parent variant
const CardContext = React.createContext<CardVariant>("default")

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return (
    <CardContext.Provider value={variant ?? "default"}>
      <div
        data-variant={variant ?? "default"}
        className={cn(cardVariants({ variant, padding }), className)}
        {...props}
      />
    </CardContext.Provider>
  )
}

// Sub-component border colours adapt to the parent variant:
//   default/shortcut → stone-200 (medium)
//   stat             → stone-100 (light, matching the stat card aesthetic)
//   flat             → stone-100
const headerBorder: Record<CardVariant, string> = {
  default:  "border-stone-200",
  stat:     "border-stone-100",
  shortcut: "border-stone-200",
  flat:     "border-stone-100",
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const variant = React.useContext(CardContext)
  return (
    <div
      className={cn(
        "px-5 py-3 border-b text-xs tracking-widest uppercase text-ink/60",
        headerBorder[variant],
        className
      )}
      {...props}
    />
  )
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const variant = React.useContext(CardContext)
  return (
    <div
      className={cn(
        "px-5 py-3 border-t flex items-center justify-between",
        headerBorder[variant],
        className
      )}
      {...props}
    />
  )
}
