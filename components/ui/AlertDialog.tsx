"use client"

import * as React from "react"
import { cn } from "@/lib/cn"
import { Button } from "@/components/ui/Button"

export interface AlertDialogProps {
  isOpen: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDangerous?: boolean
}

export function AlertDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDangerous = false,
}: AlertDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative bg-paper rounded-lg shadow-lg max-w-md w-full mx-4 p-6"
        role="alertdialog"
        aria-labelledby="alert-title"
        aria-describedby={description ? "alert-description" : undefined}
      >
        <h2 id="alert-title" className="text-lg font-serif text-ink mb-2">
          {title}
        </h2>

        {description && (
          <p id="alert-description" className="text-sm text-ink/70 mb-4">
            {description}
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={isDangerous ? "destructive" : "primary"}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
