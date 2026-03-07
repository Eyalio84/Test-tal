"use client"

import { useEffect } from "react"
import { useAria } from "@/store/aria"

export function PlatformAriaContext() {
  const setAriaContext = useAria((s) => s.setAriaContext)
  useEffect(() => {
    setAriaContext("platform")
  }, [setAriaContext])
  return null
}
