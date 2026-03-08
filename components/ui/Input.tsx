import * as React from "react"
import { cn } from "@/lib/cn"

const inputBase =
  "w-full border border-stone-200 px-3 py-2 text-sm text-ink bg-white placeholder:text-ink/40 " +
  "focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink " +
  "disabled:opacity-40 disabled:cursor-not-allowed " +
  "aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-200"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, helper, error, className, ...props }, ref) => {
    const helperId = helper ? `${id}-helper` : undefined
    const errorId = error ? `${id}-error` : undefined
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-xs tracking-widest uppercase text-ink/60">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : undefined}
          className={cn(inputBase, "rounded", className)}
          {...props}
        />
        {helper && !error && (
          <p id={helperId} className="text-xs text-ink/40">
            {helper}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="text-xs text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helper?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, helper, error, className, ...props }, ref) => {
    const helperId = helper ? `${id}-helper` : undefined
    const errorId = error ? `${id}-error` : undefined
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-xs tracking-widest uppercase text-ink/60">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? "true" : undefined}
          className={cn(inputBase, "rounded min-h-[80px] resize-y", className)}
          {...props}
        />
        {helper && !error && (
          <p id={helperId} className="text-xs text-ink/40">
            {helper}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="text-xs text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"
