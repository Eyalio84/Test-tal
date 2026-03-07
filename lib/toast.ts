"use client"

import toast from "react-hot-toast"

const dark = {
  style: {
    background: "#18181b",
    color: "#fafafa",
    borderRadius: "6px",
    fontSize: "13px",
    padding: "12px 16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  },
}

export const toastSuccess = (msg: string) =>
  toast.success(msg, { ...dark, duration: 4000, iconTheme: { primary: "#22c55e", secondary: "#18181b" } })

export const toastError = (msg: string) =>
  toast.error(msg, { ...dark, duration: 6000, iconTheme: { primary: "#ef4444", secondary: "#18181b" } })

export const toastInfo = (msg: string) =>
  toast(msg, { ...dark, duration: 3500, icon: "✦" })

export const toastPublish = (msg: string) =>
  toast.success(msg, {
    duration: 5000,
    icon: "✓",
    style: { ...dark.style, background: "#14532d", borderLeft: "3px solid #22c55e" },
    iconTheme: { primary: "#22c55e", secondary: "#14532d" },
  })

export const toastUndo = (msg: string) =>
  toast(msg, { ...dark, duration: 3000, icon: "↩" })
