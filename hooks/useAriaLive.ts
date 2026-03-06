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

// ── Gemini Live config ─────────────────────────────────────────────────────
const WS_URL   = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
const LIVE_MODEL = "models/gemini-2.5-flash-native-audio-preview-12-2025"

const ARIA_FUNCTIONS = [
  { name: "navigate",                  description: "Navigate to a page in the store",                                      parameters: { type: "OBJECT", properties: { url:      { type: "STRING", description: "/products, /collections, /about, /products?category=Rings" } }, required: ["url"] } },
  { name: "scroll_page",               description: "Scroll the page up, down, top, or bottom",                             parameters: { type: "OBJECT", properties: { direction: { type: "STRING", description: "up | down | top | bottom" }, amount: { type: "NUMBER" } }, required: ["direction"] } },
  { name: "add_to_cart",               description: "Add a jewelry product to the cart",                                    parameters: { type: "OBJECT", properties: { slug: { type: "STRING", description: "gold-bracelet-set | pearl-drop-earrings | sapphire-statement-ring | diamond-solitaire-pendant | rose-gold-chain-necklace | emerald-stud-earrings | vintage-gold-brooch | sterling-silver-cuff" }, name: { type: "STRING" } }, required: ["slug","name"] } },
  { name: "open_cart",                 description: "Open the shopping cart",                                               parameters: { type: "OBJECT", properties: {} } },
  { name: "filter_products",           description: "Filter shop by jewelry category",                                      parameters: { type: "OBJECT", properties: { category: { type: "STRING", description: "Rings | Necklaces | Earrings | Bracelets | Pendants | Brooches" } }, required: ["category"] } },
  { name: "start_tour",                description: "Start Aria's guided store tour",                                       parameters: { type: "OBJECT", properties: {} } },
  { name: "read_cart",                 description: "Read the current cart contents aloud — items, quantities, and total",  parameters: { type: "OBJECT", properties: {} } },
  { name: "check_stock",               description: "Check if a specific product is in stock",                              parameters: { type: "OBJECT", properties: { slug: { type: "STRING", description: "gold-bracelet-set | pearl-drop-earrings | sapphire-statement-ring | diamond-solitaire-pendant | rose-gold-chain-necklace | emerald-stud-earrings | vintage-gold-brooch | sterling-silver-cuff" } }, required: ["slug"] } },
  { name: "filter_by_price",           description: "Filter shop products by maximum price — use for 'show me items under $X'", parameters: { type: "OBJECT", properties: { maxPrice: { type: "NUMBER", description: "Maximum price in USD e.g. 100" } }, required: ["maxPrice"] } },
  { name: "describe_current_product",  description: "Describe the product currently shown on the page — name, price, materials, story", parameters: { type: "OBJECT", properties: {} } },
]

const SYSTEM_PROMPT = `You are Aria, an elegant and warm voice shopping assistant for a luxury handcrafted jewelry store.

Personality: sophisticated, warm, knowledgeable — like a trusted friend who knows everything about fine jewelry.
Voice style: concise (1-3 sentences), conversational, natural — never robotic.

Your capabilities: navigate pages, filter products, add items to cart, scroll, give guided tour.

Products: gold-bracelet-set ($89), pearl-drop-earrings ($65), sapphire-statement-ring ($245), diamond-solitaire-pendant ($185), rose-gold-chain-necklace ($125), emerald-stud-earrings ($145), vintage-gold-brooch ($75), sterling-silver-cuff ($55)
Categories: Rings, Necklaces, Earrings, Bracelets, Pendants, Brooches

STRICT SILENCE RULES — follow exactly:
- scroll_page: execute silently. Say NOTHING. Zero words. The page moves — that IS the response.
- navigate: execute silently. Say NOTHING. The page change is the response.
- add_to_cart: one warm confirmation sentence only. e.g. "Done — I've added that to your cart."
- open_cart: one warm sentence. e.g. "Here's your cart."
- filter_products: one warm sentence. e.g. "Showing you the rings collection."
- filter_by_price: one sentence. e.g. "Here are pieces under $80."
- start_tour: one welcoming sentence to begin, then stop speaking. The tour cards handle the narration.
- read_cart: speak the result naturally — list items and total warmly.
- check_stock: speak the result naturally in one sentence.
- describe_current_product: describe the piece warmly in 2-3 sentences. Include price and stock status.

When first connected, greet the user warmly in 1-2 sentences and offer to help or start the tour.`

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
    case "navigate":        dispatchCommand({ type: "NAVIGATE",    url: args.url as string }); return undefined
    case "scroll_page":     dispatchCommand({ type: "SCROLL",      direction: args.direction as "up"|"down"|"top"|"bottom", amount: (args.amount as number) ?? 400 }); return undefined
    case "add_to_cart":     dispatchCommand({ type: "ADD_TO_CART", slug: args.slug as string, name: args.name as string }); return undefined
    case "open_cart":       dispatchCommand({ type: "OPEN_CART" }); return undefined
    case "filter_products": dispatchCommand({ type: "FILTER",      category: args.category as string }); return undefined
    case "start_tour":      dispatchCommand({ type: "START_TOUR" }); return undefined

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

    default: return undefined
  }
}

// ── Connect (module-level, called once) ───────────────────────────────────
export async function ariaConnect() {
  if (_ws && (_ws.readyState === WebSocket.OPEN || _ws.readyState === WebSocket.CONNECTING)) return

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) { toast.error("Aria: API key missing"); return }

  aria().setAriaState("connecting")
  _ready = false
  _queue = []
  _playing = false

  try {
    _playCtx = new AudioContext({ sampleRate: 24000 })
    await _playCtx.resume()

    const ws = new WebSocket(`${WS_URL}?key=${apiKey}`)
    _ws = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        setup: {
          model: LIVE_MODEL,
          generation_config: {
            response_modalities: ["AUDIO"],
            speech_config: { voice_config: { prebuilt_voice_config: { voice_name: "Aoede" } } },
          },
          input_audio_transcription: {},
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
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
