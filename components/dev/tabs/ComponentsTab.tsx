"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import type { Component } from "@prisma/client"

const CAT_COLOR: Record<string, string> = {
  button:       "#3b82f6",
  input:        "#22c55e",
  card:         "#f59e0b",
  overlay:      "#a855f7",
  nav:          "#ec4899",
  section:      "#06b6d4",
  badge:        "#14b8a6",
  "data-display": "#f97316",
  feedback:     "#ef4444",
  form:         "#84cc16",
  image:        "#0ea5e9",
  select:       "#8b5cf6",
  checkbox:     "#10b981",
  radio:        "#10b981",
}

export function ComponentsTab() {
  const [filter, setFilter] = React.useState("")

  const { data: components = [], status } = useQuery<Component[]>({
    queryKey: ["components", { search: "", category: "" }],
    staleTime: 60_000,
  })

  const filtered = filter
    ? components.filter(c =>
        c.name.toLowerCase().includes(filter.toLowerCase()) ||
        c.ariaName.toLowerCase().includes(filter.toLowerCase()) ||
        c.category.toLowerCase().includes(filter.toLowerCase())
      )
    : components

  // Group by category
  const grouped = filtered.reduce<Record<string, Component[]>>((acc, c) => {
    acc[c.category] ??= []
    acc[c.category].push(c)
    return acc
  }, {})

  const cats = Object.keys(grouped).sort()

  return (
    <div style={{ fontSize: 10, fontFamily: "monospace" }}>
      {/* Filter bar */}
      <div style={{ padding: "4px 8px", borderBottom: "1px solid #1e293b", background: "#0f172a" }}>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="filter by name, category, ariaName…"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#e2e8f0",
            fontSize: 10,
            fontFamily: "monospace",
          }}
        />
      </div>

      {/* Stats bar */}
      <div style={{
        padding: "3px 8px",
        borderBottom: "1px solid #1e293b",
        color: "#475569",
        fontSize: 9,
        display: "flex",
        gap: 8,
      }}>
        <span style={{ color: status === "success" ? "#22c55e" : status === "error" ? "#ef4444" : "#f59e0b" }}>
          {status}
        </span>
        <span>{filtered.length}/{components.length} components</span>
        <span>{cats.length} categories</span>
      </div>

      {/* Grouped list */}
      <div>
        {cats.map(cat => (
          <div key={cat}>
            <div style={{
              padding: "3px 8px",
              background: "#0f172a",
              color: CAT_COLOR[cat] ?? "#94a3b8",
              fontWeight: "bold",
              fontSize: 9,
              letterSpacing: 1,
            }}>
              {cat.toUpperCase()} ({grouped[cat].length})
            </div>
            {grouped[cat].map(c => (
              <div key={c.id} style={{
                padding: "2px 8px 2px 16px",
                borderBottom: "1px solid #0f172a",
                display: "flex",
                justifyContent: "space-between",
              }}>
                <span style={{ color: "#e2e8f0" }}>{c.name}</span>
                <span style={{ color: "#475569" }}>{c.ariaName}</span>
              </div>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ color: "#6b7280", textAlign: "center", padding: "20px 0" }}>
            {filter ? "No matches" : "Loading…"}
          </div>
        )}
      </div>
    </div>
  )
}
