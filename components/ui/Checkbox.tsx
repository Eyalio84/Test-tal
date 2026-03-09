import * as React from "react"
import { cn } from "@/lib/cn"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: string
  error?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, helper, error, className, ...props }, ref) => {
    const helperId = helper ? `${id}-helper` : undefined
    const errorId = error ? `${id}-error` : undefined
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            aria-describedby={describedBy}
            aria-invalid={error ? "true" : undefined}
            className={cn(
              "h-4 w-4 rounded border border-stone-200 accent-ink",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              error && "border-red-400",
              className
            )}
            {...props}
          />
          {label && (
            <label htmlFor={id} className="text-sm text-ink cursor-pointer select-none">
              {label}
            </label>
          )}
        </div>
        {helper && !error && (
          <p id={helperId} className="text-xs text-ink/40 ml-6">
            {helper}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="text-xs text-red-600 ml-6"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helper?: string
  error?: string
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ id, label, helper, error, className, ...props }, ref) => {
    const helperId = helper ? `${id}-helper` : undefined
    const errorId = error ? `${id}-error` : undefined
    const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            id={id}
            type="radio"
            aria-describedby={describedBy}
            aria-invalid={error ? "true" : undefined}
            className={cn(
              "h-4 w-4 rounded-full border border-stone-200 accent-ink",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ink",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              error && "border-red-400",
              className
            )}
            {...props}
          />
          {label && (
            <label htmlFor={id} className="text-sm text-ink cursor-pointer select-none">
              {label}
            </label>
          )}
        </div>
        {helper && !error && (
          <p id={helperId} className="text-xs text-ink/40 ml-6">
            {helper}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="text-xs text-red-600 ml-6"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
Radio.displayName = "Radio"
