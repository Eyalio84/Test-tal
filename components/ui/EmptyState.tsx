import type * as React from "react"
import { Button } from "@/components/ui/Button"
import { cn } from "@/lib/cn"

export type EmptyStateVariant = "default" | "search" | "error"

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick?: () => void; href?: string }
  variant?: EmptyStateVariant
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 gap-4",
        className
      )}
    >
      {icon && <div className="text-ink/20 text-4xl">{icon}</div>}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-sans text-ink">{title}</p>
        {description && <p className="text-xs text-ink/50">{description}</p>}
      </div>
      {action &&
        (action.href ? (
          <a
            href={action.href}
            className="text-xs tracking-widest uppercase underline text-ink/60 hover:text-ink transition"
          >
            {action.label}
          </a>
        ) : (
          <Button variant="secondary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  )
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center text-center py-12 px-6 gap-4", className)}
    >
      <p className="text-sm font-sans text-ink">{title}</p>
      {description && <p className="text-xs text-red-600">{description}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
