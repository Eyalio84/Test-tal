"use client"
import * as React from "react"
import { cn } from "@/lib/cn"
import { Slot } from "@/components/ui/Slot"

interface DialogContextValue {
  open: boolean
  setOpen: (v: boolean) => void
  titleId: string
  descId: string
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialog() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error("Dialog components must be used within <Dialog>")
  return ctx
}

let dialogIdCounter = 0

export function Dialog({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const id = React.useRef(++dialogIdCounter)
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  function setOpen(v: boolean) {
    if (!isControlled) setInternalOpen(v)
    onOpenChange?.(v)
  }

  return (
    <DialogContext.Provider value={{
      open, setOpen,
      titleId: `dialog-title-${id.current}`,
      descId:  `dialog-desc-${id.current}`,
    }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { setOpen } = useDialog()
  const Comp = asChild ? Slot : "button"
  return (
    <Comp onClick={() => setOpen(true)}>
      {children}
    </Comp>
  )
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, setOpen, titleId, descId } = useDialog()
  const contentRef = React.useRef<HTMLDivElement>(null)

  // Escape key handler
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, setOpen])

  // Focus first focusable on open
  React.useEffect(() => {
    if (open && contentRef.current) {
      const focusable = contentRef.current.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      )
      focusable[0]?.focus()
    }
  }, [open])

  // Body scroll lock
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Dialog */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className={cn(
          "relative bg-white rounded-lg shadow-2xl border border-stone-200 w-full max-w-md p-8",
          className
        )}>
          {children}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close dialog"
            className="absolute top-4 right-4 text-ink/40 hover:text-ink transition p-1 rounded"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  )
}

export function DialogTitle({ className, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialog()
  return (
    <h2
      id={id ?? titleId}
      className={cn("font-serif text-xl text-ink mb-2", className)}
      {...props}
    />
  )
}

export function DialogDescription({ className, id, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descId } = useDialog()
  return (
    <p
      id={id ?? descId}
      className={cn("text-sm text-ink/60 mb-6", className)}
      {...props}
    />
  )
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-end gap-3 mt-6 pt-4 border-t border-stone-100", className)} {...props} />
  )
}
