/**
 * devLogger — client-side singleton ring buffer for the StoreKit DevHub.
 *
 * Sources map to DevHub tabs: aria | query | zod | r2 | components | system
 * Max 500 entries — circular, never grows.
 * Pub/sub: DevHub subscribes once, re-renders on every log call.
 * No-op guard: only active in development builds.
 */

export type LogSource = "aria" | "query" | "zod" | "r2" | "components" | "system"
export type LogLevel  = "debug" | "info" | "warn" | "error" | "system"

export interface LogEntry {
  id:        string
  timestamp: number
  source:    LogSource
  level:     LogLevel
  component: string
  message:   string
  data?:     unknown
  duration?: number
}

const MAX_ENTRIES = 500
const IS_DEV = process.env.NODE_ENV === "development"

// ── Module-level state (survives React re-renders and navigation) ──────────
let _entries: LogEntry[]       = []
let _counter  = 0
const _listeners = new Set<() => void>()

function _notify() {
  _listeners.forEach(fn => fn())
}

// ── Public API ────────────────────────────────────────────────────────────

export function log(
  source:    LogSource,
  level:     LogLevel,
  component: string,
  message:   string,
  data?:     unknown,
  duration?: number,
): void {
  if (!IS_DEV) return

  const entry: LogEntry = {
    id:        `${Date.now()}-${_counter++}`,
    timestamp: Date.now(),
    source,
    level,
    component,
    message,
    data,
    duration,
  }

  if (_entries.length >= MAX_ENTRIES) {
    _entries = _entries.slice(-MAX_ENTRIES + 1)
  }
  _entries.push(entry)
  _notify()
}

export function getAll(): LogEntry[] {
  return _entries
}

export function getBySource(source: LogSource): LogEntry[] {
  return _entries.filter(e => e.source === source)
}

export function getStats() {
  return {
    total:    _entries.length,
    errors:   _entries.filter(e => e.level === "error").length,
    warnings: _entries.filter(e => e.level === "warn").length,
    bySource: {
      aria:       _entries.filter(e => e.source === "aria").length,
      query:      _entries.filter(e => e.source === "query").length,
      zod:        _entries.filter(e => e.source === "zod").length,
      r2:         _entries.filter(e => e.source === "r2").length,
      components: _entries.filter(e => e.source === "components").length,
      system:     _entries.filter(e => e.source === "system").length,
    },
  }
}

export function clear(): void {
  _entries = []
  _notify()
}

export function subscribe(listener: () => void): () => void {
  _listeners.add(listener)
  return () => _listeners.delete(listener)
}
