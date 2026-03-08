"use client"

import { useCallback } from "react"
import toast from "react-hot-toast"
import { useAria } from "@/store/aria"

// ── Module-level singletons ────────────────────────────────────────────────
// These live OUTSIDE React — page navigation can never affect them
let _ws:        WebSocket | null          = null
let _audioCtx:  AudioContext | null       = null
let _playCtx:   AudioContext | null       = null
let _processor: ScriptProcessorNode | null = null
let _stream:    MediaStream | null        = null
let _queue:     Int16Array[]              = []
let _playing    = false
let _ready      = false
let _nextTime   = 0
let _silenceTimer: ReturnType<typeof setTimeout> | null = null

// ── Reach into Zustand from outside React ─────────────────────────────────
const aria = () => useAria.getState()

// ── Theme ──────────────────────────────────────────────────────────────────
import { THEMES } from "@/lib/theme"

// ── Gemini Live config ─────────────────────────────────────────────────────
const WS_URL      = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
const LIVE_MODEL  = "models/gemini-2.5-flash-native-audio-preview-12-2025"

// Build theme-aware + context-aware config at connect time
function buildAriaConfig(themeId: string) {
  const ariaContext = aria().ariaContext
  const theme   = THEMES[themeId] ?? THEMES["jewelry"]
  const { aria: ariaTheme, brand } = theme

  // ── Platform context: override functions + system prompt ─────────────────
  if (ariaContext === "platform") {
    const functions = [
      { name: "navigate_to_demo",
        description: "Navigate to a live demo of a specific theme",
        parameters: { type: "OBJECT", properties: {
          themeId: { type: "STRING", description: "jewelry | candy | bakery | flowers | wine | restaurant | portfolio | saas" }
        }, required: ["themeId"] } },
      { name: "navigate",
        description: "Navigate to a page",
        parameters: { type: "OBJECT", properties: { url: { type: "STRING", description: "/, /demos, /demos/[themeId], /themes, /about" } }, required: ["url"] } },
      { name: "scroll_page",
        description: "Scroll the page up, down, top, or bottom",
        parameters: { type: "OBJECT", properties: { direction: { type: "STRING", description: "up | down | top | bottom" }, amount: { type: "NUMBER" } }, required: ["direction"] } },
      { name: "explain_pricing",
        description: "Verbally explain the StoreKit pricing tiers to the visitor",
        parameters: { type: "OBJECT", properties: {} } },
    ]
    const systemPrompt = `You are Aria, the AI assistant powering a web-building platform called StoreKit.
You help visitors discover what's possible — show them demos, explain how voice editing works,
and guide them toward signing up. Never be salesy. Be genuinely helpful and curious.
Available demos: jewelry, candy, bakery, flowers, wine, restaurant, portfolio, saas.
Keep all responses under 3 sentences. Navigate silently without announcing URLs.`
    return { voice: ariaTheme.voice, functions, systemPrompt }
  }

  const functions = [
    { name: "save_memory",
      description: "Save something to remember about this user for next session",
      parameters: { type: "OBJECT", properties: {
        key:   { type: "STRING", description: "short identifier e.g. preferred_name, style_notes, size_preference" },
        value: { type: "STRING", description: "what to remember about the user" },
      }, required: ["key", "value"] } },
    { name: "navigate",                  description: "Navigate to any page on the site",                                     parameters: { type: "OBJECT", properties: { url:      { type: "STRING", description: ariaContext === "member" ? "/, /dashboard, /admin/editor, /admin/themes, /admin, /products, /collections, /about, /themes, /demos" : "/, /products, /collections, /about, /demos, /themes" } }, required: ["url"] } },
    { name: "scroll_page",               description: "Scroll the page up, down, top, or bottom",                             parameters: { type: "OBJECT", properties: { direction: { type: "STRING", description: "up | down | top | bottom" }, amount: { type: "NUMBER" } }, required: ["direction"] } },
    { name: "add_to_cart",               description: `Add a product to the cart`,                                            parameters: { type: "OBJECT", properties: { slug: { type: "STRING", description: ariaTheme.products }, name: { type: "STRING" } }, required: ["slug","name"] } },
    { name: "open_cart",                 description: "Open the shopping cart",                                               parameters: { type: "OBJECT", properties: {} } },
    { name: "filter_products",           description: `Filter shop by category`,                                              parameters: { type: "OBJECT", properties: { category: { type: "STRING", description: ariaTheme.categories } }, required: ["category"] } },
    { name: "read_cart",                 description: "Read the current cart contents aloud — items, quantities, and total",  parameters: { type: "OBJECT", properties: {} } },
    { name: "check_stock",               description: "Check if a specific product is in stock",                              parameters: { type: "OBJECT", properties: { slug: { type: "STRING", description: ariaTheme.products } }, required: ["slug"] } },
    { name: "filter_by_price",           description: "Filter shop products by maximum price — use for 'show me items under $X'", parameters: { type: "OBJECT", properties: { maxPrice: { type: "NUMBER", description: "Maximum price in USD e.g. 100" } }, required: ["maxPrice"] } },
    { name: "describe_current_product",  description: "Describe the product currently shown on the page — name, price, materials, story", parameters: { type: "OBJECT", properties: {} } },

    // ── Editor-mode functions (only active in /admin/editor) ─────────────────
    { name: "set_hero_text",     description: "Set the hero headline text",                                             parameters: { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] } },
    { name: "set_hero_subtitle", description: "Set the hero subtitle / subline text",                                  parameters: { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] } },
    { name: "set_color",         description: "Set a theme color — primary, secondary, accent, or background",          parameters: { type: "OBJECT", properties: { target: { type: "STRING", description: "primary | secondary | accent | background" }, value: { type: "STRING", description: "CSS color e.g. #D4AF37" } }, required: ["target","value"] } },
    { name: "add_section",       description: "Add a new content section to the page",                                 parameters: { type: "OBJECT", properties: { type: { type: "STRING", description: "features | testimonials | cta | gallery" }, position: { type: "STRING", description: "after_hero | before_footer" } }, required: ["type"] } },
    { name: "remove_section",    description: "Remove a section — always asks for confirmation first",                  parameters: { type: "OBJECT", properties: { sectionId: { type: "STRING" } }, required: ["sectionId"] } },
    { name: "reorder_section",   description: "Move a section up or down — always asks for confirmation first",        parameters: { type: "OBJECT", properties: { sectionId: { type: "STRING" }, direction: { type: "STRING", description: "up | down" } }, required: ["sectionId","direction"] } },
    { name: "publish_changes",   description: "Publish all draft changes to the live site",                            parameters: { type: "OBJECT", properties: {} } },
    { name: "undo_edit",         description: "Undo the last edit",                                                     parameters: { type: "OBJECT", properties: {} } },
    { name: "redo_edit",         description: "Redo the last undone edit",                                              parameters: { type: "OBJECT", properties: {} } },
  ]

  // Member context: override opening lines, keep rest of personality
  const personaOpening = ariaContext === "member"
    ? `You are Aria, a voice-powered site builder. You're helping a member build and manage their online store.\nYou can navigate anywhere on the site: dashboard, editor, themes, store pages, and more.\nPersonality: ${ariaTheme.personality}.`
    : `You are ${ariaTheme.name}, a voice shopping assistant for ${brand.name} — ${brand.tagline}.\nPersonality: ${ariaTheme.personality}.`

  const systemPrompt = `${personaOpening}
Voice style: concise (1-3 sentences), conversational, natural — never robotic.

Your capabilities: navigate pages, filter products, add items to cart, read cart, check stock, describe products, scroll.

Products: ${ariaTheme.products}
Categories: ${ariaTheme.categories}

STRICT SILENCE RULES — follow exactly:
- scroll_page: execute silently. Say NOTHING. Zero words. The page moves — that IS the response.
- navigate: execute silently. Say NOTHING. The page change is the response.
- add_to_cart: one warm confirmation sentence only.
- open_cart: one warm sentence.
- filter_products: one warm sentence naming the category shown.
- filter_by_price: one sentence naming the price limit.
- read_cart: speak the result naturally — list items and total warmly.
- check_stock: speak the result naturally in one sentence.
- describe_current_product: describe the item warmly in 2-3 sentences. Include price and stock status.

When first connected, greet the user warmly and briefly — 1-2 sentences max — then ask what they'd like to explore.`

  return { voice: ariaTheme.voice, functions, systemPrompt }
}

// ── PCM helpers ────────────────────────────────────────────────────────────
function floatTo16BitPCM(f32: Float32Array): ArrayBuffer {
  const buf = new ArrayBuffer(f32.length * 2)
  const dv  = new DataView(buf)
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]))
    dv.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return buf
}
function toBase64(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf); let s = ""
  for (let i = 0; i < b.byteLength; i++) s += String.fromCharCode(b[i])
  return btoa(s)
}
function fromBase64(b64: string): Int16Array {
  const bin = atob(b64); const b = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i)
  return new Int16Array(b.buffer)
}

// ── Seamless playback scheduler ────────────────────────────────────────────
function scheduleChunk(int16: Int16Array) {
  if (!_playCtx) return
  if (!_playing) {
    _playing = true
    aria().setAriaState("speaking")
    _nextTime = _playCtx.currentTime + 0.05
  }
  const f32 = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 0x8000
  const buf = _playCtx.createBuffer(1, f32.length, 24000)
  buf.copyToChannel(f32, 0)
  const src = _playCtx.createBufferSource()
  src.buffer = buf
  src.connect(_playCtx.destination)
  src.start(_nextTime)
  _nextTime += buf.duration

  if (_silenceTimer) clearTimeout(_silenceTimer)
  const msUntilDone = (_nextTime - _playCtx.currentTime) * 1000 + 400
  _silenceTimer = setTimeout(() => {
    _playing = false
    aria().setAriaState("listening")
  }, msUntilDone)
}

// ── Handle messages from Gemini ────────────────────────────────────────────
async function handleMessage(event: MessageEvent) {
  let data: Record<string, unknown>
  try {
    const text = event.data instanceof Blob ? await event.data.text() : event.data as string
    data = JSON.parse(text)
  } catch { return }

  if (data.setupComplete !== undefined) {
    _ready = true
    aria().setConnected(true)
    aria().setAriaState("listening")
    return
  }

  if (data.serverContent) {
    const sc = data.serverContent as Record<string, unknown>
    if (sc.modelTurn) {
      const parts = ((sc.modelTurn as Record<string,unknown>).parts ?? []) as Array<Record<string,unknown>>
      for (const part of parts) {
        if (part.inlineData) {
          const id = part.inlineData as Record<string,unknown>
          if (id.data) scheduleChunk(fromBase64(id.data as string))
        }
        if (part.text) aria().setAriaTranscript(part.text as string)
      }
    }
    if (sc.inputTranscription) {
      const t = (sc.inputTranscription as Record<string,unknown>).text as string | undefined
      if (t) aria().setUserTranscript(t)
    }
  }

  if (data.toolCall) {
    const calls = ((data.toolCall as Record<string,unknown>).functionCalls ?? []) as Array<{id:string;name:string;args:Record<string,unknown>}>
    for (const call of calls) {
      const result = await executeCommand(call.name, call.args ?? {})
      _ws?.send(JSON.stringify({
        tool_response: {
          function_responses: [{ id: call.id, name: call.name, response: { result: result ?? "success" } }]
        }
      }))
    }
  }
}

// ── Execute function calls (async — data-returning functions feed result back to Gemini) ──
async function executeCommand(name: string, args: Record<string, unknown>): Promise<string | undefined> {
  const { dispatchCommand } = aria()
  switch (name) {
    case "navigate_to_demo": dispatchCommand({ type: "NAVIGATE", url: `/demos/${args.themeId as string}` }); return undefined
    case "explain_pricing": return "StoreKit has three tiers: Starter is free and lets you build with Aria. Builder at $29/month adds a custom domain and priority support. Pro at $79/month adds team members, analytics, and advanced AI editing. All plans include Aria voice control."
    case "navigate":        dispatchCommand({ type: "NAVIGATE",    url: args.url as string }); return undefined
    case "scroll_page":     dispatchCommand({ type: "SCROLL",      direction: args.direction as "up"|"down"|"top"|"bottom", amount: (args.amount as number) ?? 400 }); return undefined
    case "add_to_cart": {
      const slug = args.slug as string
      const name = args.name as string
      if (aria().ariaContext === "demo") {
        const theme = THEMES[aria().activeThemeId]
        const product = theme?.products.find(p => p.slug === slug)
        if (product) {
          dispatchCommand({ type: "ADD_TO_CART", slug, name: product.name, price: product.price, image: product.image })
          return undefined
        }
      }
      dispatchCommand({ type: "ADD_TO_CART", slug, name })
      return undefined
    }
    case "open_cart":       dispatchCommand({ type: "OPEN_CART" }); return undefined
    case "filter_products": dispatchCommand({ type: "FILTER",      category: args.category as string }); return undefined

    case "filter_by_price":
      dispatchCommand({ type: "NAVIGATE", url: `/products?maxPrice=${args.maxPrice}` })
      return undefined

    case "read_cart": {
      const cartMod = await import("@/store/cart")
      const { items, totalPrice } = cartMod.useCart.getState()
      if (items.length === 0) return "The cart is empty."
      const list = items.map((i) => `${i.quantity}× ${i.name} at $${i.price.toFixed(2)}`).join(", ")
      return `Cart contains: ${list}. Total: $${totalPrice().toFixed(2)}.`
    }

    case "check_stock": {
      const res = await fetch(`/api/product/${args.slug as string}`)
      const p = await res.json()
      if (!p?.id) return "I couldn't find that product."
      if (!p.inStock) return `${p.name} is currently out of stock.`
      if (p.stockCount !== null && p.stockCount <= 5) return `${p.name} is in stock — only ${p.stockCount} remaining.`
      return `${p.name} is in stock.`
    }

    case "describe_current_product": {
      const slug = document.body.dataset.productSlug
      if (!slug) return "I can't see a product on this page — navigate to a product first."
      const res = await fetch(`/api/product/${slug}`)
      const p = await res.json()
      if (!p?.id) return "I couldn't load the product details."
      const stock = !p.inStock ? "currently out of stock" : (p.stockCount !== null && p.stockCount <= 5) ? `only ${p.stockCount} left` : "in stock"
      return `${p.name} — ${p.description ?? "a handcrafted piece"}. Priced at $${p.price.toFixed(2)}, ${stock}.`
    }

    case "save_memory": {
      await fetch("/api/aria/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: args.key, value: args.value }),
      })
      return undefined
    }

    // ── Editor commands ────────────────────────────────────────────────────

    case "set_hero_text": {
      if (!aria().editorMode) return undefined
      const text = args.text as string
      const r = await fetch("/api/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "hero_headline", value: text }) })
      const data = await r.json() as { snapshotId?: string }
      aria().updateDraftKey("hero_headline", text)
      if (data.snapshotId) { aria().pushUndo(data.snapshotId); aria().clearRedoStack() }
      return `Hero headline set to: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`
    }

    case "set_hero_subtitle": {
      if (!aria().editorMode) return undefined
      const text = args.text as string
      const r = await fetch("/api/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "hero_subline", value: text }) })
      const data = await r.json() as { snapshotId?: string }
      aria().updateDraftKey("hero_subline", text)
      if (data.snapshotId) { aria().pushUndo(data.snapshotId); aria().clearRedoStack() }
      return `Hero subtitle set to: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`
    }

    case "set_color": {
      if (!aria().editorMode) return undefined
      const target = args.target as string
      const value  = args.value  as string
      const key    = `color_${target}`
      const r    = await fetch("/api/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) })
      const data = await r.json() as { snapshotId?: string }
      aria().updateDraftKey(key, value)
      if (data.snapshotId) { aria().pushUndo(data.snapshotId); aria().clearRedoStack() }
      return `${target} color updated to ${value}`
    }

    case "add_section": {
      if (!aria().editorMode) return undefined
      const type     = args.type     as string
      const position = (args.position as string | undefined) ?? "before_footer"
      const cRes  = await fetch("/api/content")
      const cData = await cRes.json() as { content: Record<string, string> }
      const current = JSON.parse(cData.content["sections_order"] || '["hero","featured_products","collections","cta"]') as string[]
      const newId   = `${type}_${Date.now()}`
      const updated = position === "after_hero"
        ? [current[0], newId, ...current.slice(1)]
        : [...current.slice(0, -1), newId, current[current.length - 1]]
      const r    = await fetch("/api/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "sections_order", value: JSON.stringify(updated) }) })
      const data = await r.json() as { snapshotId?: string }
      aria().updateDraftKey("sections_order", JSON.stringify(updated))
      if (data.snapshotId) { aria().pushUndo(data.snapshotId); aria().clearRedoStack() }
      return `Added ${type} section ${position === "after_hero" ? "after the hero" : "before the footer"}`
    }

    case "remove_section": {
      if (!aria().editorMode) return undefined
      aria().setPendingConfirm({ action: "remove_section", args })
      aria().dispatchCommand({ type: "PENDING_CONFIRM", action: "remove_section", args })
      return `Are you sure you want to remove the "${args.sectionId as string}" section? Say yes to confirm or no to cancel.`
    }

    case "reorder_section": {
      if (!aria().editorMode) return undefined
      aria().setPendingConfirm({ action: "reorder_section", args })
      aria().dispatchCommand({ type: "PENDING_CONFIRM", action: "reorder_section", args })
      return `Move the "${args.sectionId as string}" section ${args.direction as string}? Say yes to confirm or no to cancel.`
    }

    case "publish_changes": {
      if (!aria().editorMode) return undefined
      aria().setPublishing(true)
      try {
        const r    = await fetch("/api/content/publish", { method: "POST" })
        const data = await r.json() as { ok: boolean; published: number; message?: string }
        return data.ok ? (data.message ?? `Published ${data.published} changes to the live site.`) : "Publish failed — please try again."
      } finally {
        aria().setPublishing(false)
      }
    }

    case "undo_edit": {
      if (!aria().editorMode) return undefined
      const snapshotId = aria().popUndo()
      if (!snapshotId) return "Nothing to undo."
      // Save current state for redo
      const saveRes  = await fetch("/api/content/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create" }) })
      const saveData = await saveRes.json() as { id?: string }
      if (saveData.id) aria().pushRedo(saveData.id)
      // Restore
      const r    = await fetch("/api/content/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ snapshotId }) })
      const data = await r.json() as { content?: Record<string, string> }
      if (data.content) aria().setDraftContent(data.content)
      return undefined
    }

    case "redo_edit": {
      if (!aria().editorMode) return undefined
      const snapshotId = aria().popRedo()
      if (!snapshotId) return "Nothing to redo."
      const saveRes  = await fetch("/api/content/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create" }) })
      const saveData = await saveRes.json() as { id?: string }
      if (saveData.id) aria().pushUndo(saveData.id)
      const r    = await fetch("/api/content/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ snapshotId }) })
      const data = await r.json() as { content?: Record<string, string> }
      if (data.content) aria().setDraftContent(data.content)
      return undefined
    }

    default: return undefined
  }
}

// ── Send text to Aria (triggers her to speak) ──────────────────────────────
export function sendTextToAria(text: string) {
  if (!_ws || _ws.readyState !== WebSocket.OPEN || !_ready) return
  _ws.send(JSON.stringify({
    client_content: {
      turns: [{ role: "user", parts: [{ text }] }],
      turn_complete: true,
    },
  }))
}

// ── Connect (module-level, called once) ───────────────────────────────────
export async function ariaConnect() {
  if (_ws && (_ws.readyState === WebSocket.OPEN || _ws.readyState === WebSocket.CONNECTING)) return

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) { toast.error("Aria: API key missing"); return }

  const { voice: ARIA_VOICE, functions: ARIA_FUNCTIONS, systemPrompt: BASE_SYSTEM_PROMPT } = buildAriaConfig(aria().activeThemeId)

  aria().setAriaState("connecting")
  _ready = false
  _queue = []
  _playing = false

  try {
    _playCtx = new AudioContext({ sampleRate: 24000 })
    await _playCtx.resume()

    const ws = new WebSocket(`${WS_URL}?key=${apiKey}`)
    _ws = ws

    ws.onopen = async () => {
      let systemPrompt = BASE_SYSTEM_PROMPT
      try {
        const memRes = await fetch("/api/aria/memory")
        if (memRes.ok) {
          const { memories } = await memRes.json() as { memories: { key: string; value: string }[] }
          if (memories?.length) {
            const memBlock = "PERSONAL CONTEXT:\n" + memories.map((m) => `- ${m.key}: ${m.value}`).join("\n")
            systemPrompt = memBlock + "\n\n" + BASE_SYSTEM_PROMPT
          }
        }
      } catch {
        // silently skip if memory fetch fails — Aria still works without it
      }

      // Editor mode: inject editor instructions
      if (aria().editorMode) {
        systemPrompt += "\n\nEDITOR MODE: You are helping the site owner edit their website by voice. After each successful edit, confirm in one short sentence what changed. For remove_section and reorder_section, a confirmation modal will appear — tell the user to confirm or say yes/no. For publish_changes, announce success. Undo/redo are available by voice."
      }

      ws.send(JSON.stringify({
        setup: {
          model: LIVE_MODEL,
          generation_config: {
            response_modalities: ["AUDIO"],
            speech_config: { voice_config: { prebuilt_voice_config: { voice_name: ARIA_VOICE } } },
          },
          input_audio_transcription: {},
          system_instruction: { parts: [{ text: systemPrompt }] },
          tools: [{ function_declarations: ARIA_FUNCTIONS }],
        },
      }))
    }
    ws.onmessage = handleMessage
    ws.onerror   = () => toast.error("Aria: WebSocket error — check API key or network")
    ws.onclose   = (e) => {
      if (e.code !== 1000 && e.code !== 1001) {
        toast.error(`Aria disconnected (${e.code}): ${e.reason || "no reason"}`, { duration: 6000 })
      }
      aria().setConnected(false)
      aria().setAriaState("idle")
      _ready = false
    }

    // Mic
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
    })
    _stream = stream
    const ctx = new AudioContext({ sampleRate: 16000 })
    _audioCtx = ctx
    await ctx.resume()

    const source    = ctx.createMediaStreamSource(stream)
    const processor = ctx.createScriptProcessor(8192, 1, 1)
    _processor = processor

    processor.onaudioprocess = (e) => {
      if (!_ws || _ws.readyState !== WebSocket.OPEN || !_ready) return
      const pcm = floatTo16BitPCM(e.inputBuffer.getChannelData(0))
      _ws.send(JSON.stringify({ realtime_input: { media_chunks: [{ data: toBase64(pcm), mime_type: "audio/pcm;rate=16000" }] } }))
    }
    source.connect(processor)
    processor.connect(ctx.destination)

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    toast.error(`Aria: ${msg}`)
    aria().setAriaState("idle")
  }
}

// ── Disconnect ─────────────────────────────────────────────────────────────
export function ariaDisconnect() {
  _ready   = false
  _playing = false
  if (_silenceTimer) clearTimeout(_silenceTimer)
  _processor?.disconnect()
  _stream?.getTracks().forEach((t) => t.stop())
  _audioCtx?.close().catch(() => {})
  _playCtx?.close().catch(() => {})
  if (_ws?.readyState === WebSocket.OPEN) _ws.close(1000, "user closed")
  _ws = null; _audioCtx = null; _processor = null; _stream = null; _playCtx = null
  _queue = []; _playing = false
  aria().setConnected(false)
  aria().setAriaState("idle")
}

// ── Hook — thin React interface to the module singleton ────────────────────
export function useAriaLive() {
  const connect    = useCallback(() => { ariaConnect() },    [])
  const disconnect = useCallback(() => { ariaDisconnect() }, [])
  return { connect, disconnect }
}
