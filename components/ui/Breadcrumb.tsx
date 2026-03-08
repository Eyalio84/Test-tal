import * as React from "react"
import { cn } from "@/lib/cn"

export function Breadcrumb({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1 text-xs text-ink/50">
        {children}
      </ol>
    </nav>
  )
}

export function BreadcrumbItem({
  href, current, children, className,
}: { href?: string; current?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <li>
      {href && !current
        ? <a href={href} className={cn("hover:text-ink transition", className)}>{children}</a>
        : <span aria-current={current ? "page" : undefined} className={cn(current ? "text-ink" : "", className)}>{children}</span>
      }
    </li>
  )
}

export function BreadcrumbSeparator({ className }: { className?: string }) {
  return <li aria-hidden="true" className={cn("text-ink/30 select-none", className)}>/</li>
}
