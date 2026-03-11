/**
 * devHubStore — tiny module-level store for DevHub open state.
 * Navbar calls toggle(), DevHub subscribes and reacts.
 * No React, no Zustand — just a shared boolean with pub/sub.
 */

let _open = false
const _listeners = new Set<() => void>()

export function isOpen() { return _open }

export function toggle() {
  _open = !_open
  _listeners.forEach(fn => fn())
}

export function open()  { _open = true;  _listeners.forEach(fn => fn()) }
export function close() { _open = false; _listeners.forEach(fn => fn()) }

export function subscribe(cb: () => void): () => void {
  _listeners.add(cb)
  return () => _listeners.delete(cb)
}
