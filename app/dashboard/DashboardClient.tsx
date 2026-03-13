"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Props =
  | { action: "subscribe"; tier: "basic" | "builder" | "pro"; label: string }
  | { action: "portal"; label: string }
  | { action: "forget"; memoryKey: string; label: string }

export default function DashboardClient(props: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handle = async () => {
    setLoading(true)
    try {
      if (props.action === "subscribe") {
        const res = await fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: props.tier }),
        })
        if (res.ok) {
          const { url } = await res.json()
          if (url) window.location.href = url
        }

      } else if (props.action === "portal") {
        const res = await fetch("/api/subscription/portal", { method: "POST" })
        if (res.ok) {
          const { url } = await res.json()
          if (url) window.location.href = url
        }

      } else if (props.action === "forget") {
        await fetch("/api/aria/memory", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: props.memoryKey }),
        })
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const base = "text-xs px-3 py-1.5 border transition disabled:opacity-40"
  const styles = {
    subscribe: "border-ink text-ink hover:bg-ink hover:text-stone-50",
    portal:    "border-ink text-ink hover:bg-ink hover:text-stone-50",
    forget:    "border-stone-200 text-ink/40 hover:border-red-200 hover:text-red-500",
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={`${base} ${styles[props.action]}`}
    >
      {loading ? "..." : props.label}
    </button>
  )
}
