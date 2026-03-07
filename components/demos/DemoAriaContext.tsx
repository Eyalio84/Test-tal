"use client"

import { useEffect } from "react"
import { useAria } from "@/store/aria"

export function DemoAriaContext() {
  const setAriaContext = useAria((s) => s.setAriaContext)
  useEffect(() => {
    setAriaContext("demo")
  }, [setAriaContext])
  return null
}
