"use client"

import { useEffect } from "react"
import { useAria } from "@/store/aria"

export function TemplateAriaContext() {
  const setAriaContext = useAria((s) => s.setAriaContext)
  useEffect(() => {
    setAriaContext("template")
  }, [setAriaContext])
  return null
}
