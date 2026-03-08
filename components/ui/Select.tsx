"use client"
import * as React from "react"
import { cn } from "@/lib/cn"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function Select({
  options,
  value: controlled,
  defaultValue,
  onValueChange,
  placeholder = "Select...",
  label,
  error,
  disabled,
  className,
  id,
}: SelectProps) {
  // Native <select> as the accessible foundation — avoids re-implementing APG listbox from scratch.
  const [internal, setInternal] = React.useState(defaultValue ?? "")
  const value = controlled ?? internal

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!controlled) setInternal(e.target.value)
    onValueChange?.(e.target.value)
  }

  const errorId = error && id ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs tracking-widest uppercase text-ink/60">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId}
          className={cn(
            "w-full appearance-none border border-stone-200 px-3 py-2 pr-8 text-sm text-ink bg-white rounded",
            "focus:outline-none focus:ring-2 focus:ring-ink focus:border-ink",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            error && "border-red-400",
            className
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom chevron */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-ink/40"
          aria-hidden="true"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
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
