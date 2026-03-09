import * as React from "react"
import { cn } from "@/lib/cn"

// ── FormContainer ──
export interface FormContainerProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string
  description?: string
}

export const FormContainer = React.forwardRef<HTMLFormElement, FormContainerProps>(
  ({ title, description, children, className, ...props }, ref) => (
    <form ref={ref} className={cn("space-y-6", className)} {...props}>
      {title && (
        <div>
          <h2 className="text-lg font-serif text-ink mb-1">{title}</h2>
          {description && (
            <p className="text-xs text-ink/50">{description}</p>
          )}
        </div>
      )}
      {children}
    </form>
  )
)
FormContainer.displayName = "FormContainer"

// ── FormField ──
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  name: string
  error?: string
  required?: boolean
  helper?: string
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, name, error, required, helper, children, className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5", className)} {...props}>
      <label htmlFor={name} className="text-xs font-medium text-ink/70 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      {children}
      {helper && !error && (
        <p className="text-xs text-ink/40">{helper}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  )
)
FormField.displayName = "FormField"

// ── FormFieldGroup ──
export function FormFieldGroup({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <fieldset className={cn("space-y-4", className)}>
      {children}
    </fieldset>
  )
}

// ── FormError ──
export function FormError({ message }: { message: string }) {
  return (
    <div
      className="px-3 py-2 rounded bg-red-50 border border-red-200 text-xs text-red-700"
      role="alert"
    >
      {message}
    </div>
  )
}

// ── FormSuccess ──
export function FormSuccess({ message }: { message: string }) {
  return (
    <div
      className="px-3 py-2 rounded bg-green-50 border border-green-200 text-xs text-green-700"
      role="status"
    >
      {message}
    </div>
  )
}
