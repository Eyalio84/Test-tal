"use client"
import * as React from "react"
import { cn } from "@/lib/cn"

interface TabsContextValue {
  value: string
  setValue: (v: string) => void
}
const TabsContext = React.createContext<TabsContextValue | null>(null)
function useTabs() {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error("Tab components must be used within <Tabs>")
  return ctx
}

export function Tabs({
  defaultValue,
  value: controlled,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
  children: React.ReactNode
  className?: string
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const value = controlled ?? internal
  function setValue(v: string) {
    if (!controlled) setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="tablist" className={cn("flex items-center gap-1 flex-wrap", className)}>
      {children}
    </div>
  )
}

export function Tab({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: activeValue, setValue } = useTabs()
  const isActive = activeValue === value
  const id = `tab-${value}`
  return (
    <button
      role="tab"
      id={id}
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        "px-3 py-1 text-xs rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none",
        isActive
          ? "bg-ink text-white border-ink"
          : "border-stone-200 text-ink/60 hover:border-stone-300 hover:text-ink",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabPanel({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: activeValue } = useTabs()
  if (activeValue !== value) return null
  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      className={className}
    >
      {children}
    </div>
  )
}
