// Simplified Slot: merges props + ref onto the single child element.
import * as React from "react"
import { cn } from "@/lib/cn"

interface SlotProps {
  children?: React.ReactNode
  [key: string]: unknown
}

type AnyProps = Record<string, unknown>

export const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, ...props }, ref) => {
  // Find the first valid React element — siblings (e.g. loading spinner) are ignored
  const child = React.Children.toArray(children as React.ReactNode).find(
    (c): c is React.ReactElement => React.isValidElement(c)
  )
  if (!child) return null
  const childProps = child.props as AnyProps
  return React.cloneElement(child, {
    ...(props as AnyProps),
    ...childProps,
    ref,
    className: cn(
      (props as { className?: string }).className,
      (childProps as { className?: string }).className
    ),
  } as React.HTMLAttributes<HTMLElement>)
})
Slot.displayName = "Slot"
