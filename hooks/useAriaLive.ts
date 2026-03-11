"use client"

import { useCallback } from "react"
import toast from "react-hot-toast"
import { useAria } from "@/store/aria"
import { useCanvas } from "@/store/canvas"
import { ARIA_CHANGELOG, buildChangelogPrompt } from "@/lib/ariaChangelog"

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
import * as devLogger from "@/lib/devLogger"

// ── Gemini Live config ─────────────────────────────────────────────────────
const WS_URL      = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent"
const LIVE_MODEL  = "models/gemini-2.5-flash-native-audio-preview-12-2025"

// Build theme-aware + context-aware config at connect time
function buildAriaConfig(themeId: string) {
  const ariaContext   = aria().ariaContext
  const currentPage   = aria().currentPage
  const theme         = THEMES[themeId] ?? THEMES["jewelry"]
  const { aria: ariaTheme, brand } = theme

  // ── Platform context: override functions + system prompt ─────────────────
  if (ariaContext === "platform") {
    const functions = [
      { name: "navigate_to_template",
        description: "Navigate to a live template of a specific theme",
        parameters: { type: "OBJECT", properties: {
          themeId: { type: "STRING", description: "jewelry | candy | bakery | flowers | wine | restaurant | portfolio | saas" }
        }, required: ["themeId"] } },
      { name: "navigate",
        description: "Navigate to a page",
        parameters: { type: "OBJECT", properties: { url: { type: "STRING", description: "/, /templates, /templates/[themeId], /themes, /about" } }, required: ["url"] } },
      { name: "scroll_page",
        description: "Scroll the page up, down, top, or bottom",
        parameters: { type: "OBJECT", properties: { direction: { type: "STRING", description: "up | down | top | bottom" }, amount: { type: "NUMBER" } }, required: ["direction"] } },
      { name: "explain_pricing",
        description: "Verbally explain the StoreKit pricing tiers to the visitor",
        parameters: { type: "OBJECT", properties: {} } },
    ]
    const systemPrompt = `You are Aria — warm, curious, and genuinely excited to help people build something they're proud of.
You power StoreKit, a platform where anyone can build a beautiful online store using just their voice.
Your job: help visitors feel welcome, show them what's possible, and guide them toward trying a template.
Never be salesy. Be the kind of guide who makes someone feel like they've come to the right place.

Available templates: jewelry → "Jewelry Store", candy → "Sweet Drops Candy Shop", bakery → "The Bakery", flowers → "Petal & Stem", wine → "The Cellar", restaurant → "Maison Dore Boutique Restaurant", portfolio → "Photographer's Portfolio", saas → "Velo".

STRICT SILENCE RULES — follow exactly:
- scroll_page: execute silently. Say NOTHING. Zero words. The page moves — that IS the response.
- navigate: execute silently. Say NOTHING. The page change is the response.
- navigate_to_template: execute silently. Say NOTHING.

Keep all responses under 3 sentences.
When first connected, greet warmly in 1 sentence — introduce yourself and invite them to explore. Example tone: "Hi, I'm Aria — ask me anything, or say 'show me a template' and I'll take you there."`
    return { voice: "Aoede", functions, systemPrompt }
  }

  const functions = [
    { name: "save_memory",
      description: "Save something to remember about this user for next session",
      parameters: { type: "OBJECT", properties: {
        key:   { type: "STRING", description: "short identifier e.g. preferred_name, style_notes, size_preference" },
        value: { type: "STRING", description: "what to remember about the user" },
      }, required: ["key", "value"] } },
    { name: "navigate",                  description: "Navigate to any page on the site",                                     parameters: { type: "OBJECT", properties: { url:      { type: "STRING", description: ariaContext === "member" ? "/, /dashboard, /admin/editor, /admin/themes, /admin, /products, /collections, /about, /themes, /templates" : "/, /products, /collections, /about, /templates, /themes" } }, required: ["url"] } },
    { name: "scroll_page",               description: "Scroll the page up, down, top, or bottom",                             parameters: { type: "OBJECT", properties: { direction: { type: "STRING", description: "up | down | top | bottom" }, amount: { type: "NUMBER" } }, required: ["direction"] } },
    { name: "add_to_cart",               description: `Add a product to the cart`,                                            parameters: { type: "OBJECT", properties: { slug: { type: "STRING", description: ariaTheme.products }, name: { type: "STRING" } }, required: ["slug","name"] } },
    { name: "open_cart",                 description: "Open the shopping cart",                                               parameters: { type: "OBJECT", properties: {} } },
    { name: "filter_products",           description: `Filter shop by category`,                                              parameters: { type: "OBJECT", properties: { category: { type: "STRING", description: ariaTheme.categories } }, required: ["category"] } },
    { name: "read_cart",                 description: "Read the current cart contents aloud — items, quantities, and total",  parameters: { type: "OBJECT", properties: {} } },
    { name: "check_stock",               description: "Check if a specific product is in stock",                              parameters: { type: "OBJECT", properties: { slug: { type: "STRING", description: ariaTheme.products } }, required: ["slug"] } },
    { name: "filter_by_price",           description: "Filter shop products by maximum price — use for 'show me items under $X'", parameters: { type: "OBJECT", properties: { maxPrice: { type: "NUMBER", description: "Maximum price in USD e.g. 100" } }, required: ["maxPrice"] } },
    { name: "describe_current_product",  description: "Describe the product currently shown on the page — name, price, materials, story", parameters: { type: "OBJECT", properties: {} } },
    { name: "describe_product",
      description: "Describe any specific product by name — tell the user about it, price, and availability. Use this when the user asks 'tell me about X', 'what is X', 'describe X'.",
      parameters: { type: "OBJECT", properties: {
        slug: { type: "STRING", description: ariaTheme.products }
      }, required: ["slug"] } },
    { name: "navigate_to_product",
      description: "Navigate to a specific product's detail page. Use when the user says 'show me X', 'take me to X', 'open X', 'I want to see X'.",
      parameters: { type: "OBJECT", properties: {
        slug: { type: "STRING", description: ariaTheme.products }
      }, required: ["slug"] } },
    { name: "list_all_products",
      description: "List all available products with prices. Use when the user asks 'what do you have?', 'show me everything', 'what's on your menu?', 'what are you selling?'",
      parameters: { type: "OBJECT", properties: {} } },
    { name: "recommend_product",
      description: "Recommend a product. Use when the user asks 'what would you recommend?', 'surprise me', 'what's popular?', 'what's your best seller?', 'help me pick something'.",
      parameters: { type: "OBJECT", properties: {
        budget: { type: "NUMBER", description: "Optional maximum price hint from the user" }
      } } },

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

    // ── Admin + dev functions (member context only) ────────────────────────
    ...(ariaContext === "member" ? [
      { name: "navigate_admin",
        description: "Navigate to an admin or dashboard section by name",
        parameters: { type: "OBJECT", properties: {
          section: { type: "STRING", description: "dashboard | editor | themes | media | components | admin | image-scout" },
        }, required: ["section"] } },
      { name: "open_dev_hub",
        description: "Toggle the developer DevHub panel — useful for inspecting state, logs, and components at runtime",
        parameters: { type: "OBJECT", properties: {} } },
      { name: "list_components",
        description: "List all available atomic components in the component registry — their names and categories",
        parameters: { type: "OBJECT", properties: {} } },
      { name: "image_scout_search",
        description: "Search for images on Image Scout for a specific theme and slot. Use when user says 'find images for the hero', 'search for jewelry hero images', etc.",
        parameters: { type: "OBJECT", properties: {
          themeId: { type: "STRING", description: "jewelry | candy | bakery | flowers | wine | restaurant | portfolio | saas" },
          slot:    { type: "STRING", description: "hero | rings | necklaces | about | team-1 | etc." },
          prompt:  { type: "STRING", description: "Search description for the image" },
        }, required: ["themeId", "slot", "prompt"] } },
      { name: "image_scout_cdn_search",
        description: "Search the existing CDN catalog by meaning. Use when user says 'find me a dark moody image', 'show me all hero images'",
        parameters: { type: "OBJECT", properties: {
          query: { type: "STRING", description: "Semantic description of what to find in the CDN" },
        }, required: ["query"] } },
    ] : []),

    // ── Component editor functions (Task 4.2) ──────────────────────────────
    ...(ariaContext === "member" ? [
      { name: "add_component",
        description: "Add an atomic component to the page canvas. Use when user says 'add a button', 'add a card', 'add a hero', etc.",
        parameters: { type: "OBJECT", properties: {
          component_slug: { type: "STRING", description: "Kebab-case component identifier (e.g. button, card, hero_section)" },
          position: { type: "STRING", description: "Optional position: before_footer (default) or after_hero" },
          props: { type: "OBJECT", description: "Optional component props to initialize with (e.g. {label: 'Click me'})" },
        }, required: ["component_slug"] } },
      { name: "edit_component",
        description: "Edit props of a component on the canvas. Use when user says 'change the button text', 'update the card color', etc.",
        parameters: { type: "OBJECT", properties: {
          component_id: { type: "STRING", description: "ID of the component instance on the canvas" },
          props: { type: "OBJECT", description: "Props to update (only provide props that changed)" },
        }, required: ["component_id"] } },
      { name: "remove_component",
        description: "Remove a component from the page canvas.",
        parameters: { type: "OBJECT", properties: {
          component_id: { type: "STRING", description: "ID of the component instance to remove" },
        }, required: ["component_id"] } },
    ] : []),

    // ── Global functions — available in ALL contexts ────────────────────────
    { name: "get_changelog",
      description: "List Aria's recent capability upgrades. Use when user asks 'what's new', 'what can you do', 'what are your capabilities', 'what were your latest upgrades'.",
      parameters: { type: "OBJECT", properties: {} } },
    { name: "write_to_report",
      description: "Write a note to the Session Report Pad. Use when the owner asks you to document something, record a bug, note an observation, or generate a test entry. Also use proactively when something notable happens during a test session.",
      parameters: { type: "OBJECT", properties: {
        text: { type: "STRING", description: "The note to write. Be specific and detailed." },
        type: { type: "STRING", description: "observation | bug | navigation | test | summary | aria_note" },
      }, required: ["text", "type"] } },
    { name: "clear_report",
      description: "Clear all entries from the Session Report Pad. Use when owner says 'clear the report', 'start fresh', 'reset the pad'.",
      parameters: { type: "OBJECT", properties: {} } },
    { name: "summarize_session",
      description: "Generate a structured session summary and write it to the report pad. Use when owner says 'summarize this session', 'generate a report', 'what did we test'.",
      parameters: { type: "OBJECT", properties: {
        focus: { type: "STRING", description: "Optional: what aspect to focus the summary on" },
      } } },
  ]

  // Member context: override opening lines, keep rest of personality
  const personaOpening = ariaContext === "member"
    ? `You are Aria, the owner's personal runtime assistant and developer companion for ${brand.name}.\nYou can navigate anywhere on the platform, edit the site by voice, document test sessions in the Report Pad, answer questions about your own changelog and capabilities, and generate structured test reports for the coordinator (Claude Code).\nDuring test sessions, proactively use write_to_report to document: pages visited and their state, features tested and whether they worked, bugs or unexpected behavior, and summaries when asked.\nPersonality: ${ariaTheme.personality}.`
    : `You are ${ariaTheme.name}, a voice shopping assistant for ${brand.name} — ${brand.tagline}.\nPersonality: ${ariaTheme.personality}.`

  const systemPrompt = `${personaOpening}
Voice style: concise (1-3 sentences), conversational, natural — never robotic.

Current page: ${currentPage}
Your capabilities: navigate pages, filter products, add items to cart, read cart, check stock, describe any product by name or the current page, list all products, get recommendations, scroll.
${ariaContext === "member" ? "Admin capabilities: open the DevHub panel, list components, navigate to any admin section." : ""}

Products: ${ariaTheme.products}
Categories: ${ariaTheme.categories}

STRICT SILENCE RULES — follow exactly:
- scroll_page: execute silently. Say NOTHING. Zero words. The page moves — that IS the response.
- navigate: execute silently. Say NOTHING. The page change is the response.
- navigate_to_product: execute silently. Say NOTHING.
- add_to_cart: one warm confirmation sentence only.
- open_cart: one warm sentence.
- filter_products: one warm sentence naming the category shown.
- filter_by_price: one sentence naming the price limit.
- read_cart: speak the result naturally — list items and total warmly.
- check_stock: speak the result naturally in one sentence.
- describe_current_product: describe the item warmly in 2-3 sentences. Include price and stock status.
- describe_product: describe the product warmly in 2-3 sentences. Include price and stock status.
- list_all_products: list all products warmly, mention prices naturally.
- recommend_product: speak your recommendation warmly in 2-3 sentences. Be enthusiastic.
- navigate_admin: execute silently. Say NOTHING.
- open_dev_hub: one short confirmation (e.g. "DevHub toggled").
- list_components: speak the component summary naturally in 1-2 sentences.
- get_changelog: speak the top 3-4 upgrades naturally in 2-3 sentences.
- write_to_report: execute silently. Say NOTHING. The entry appears in the pad.
- clear_report: one brief confirmation ("Report cleared.").
- summarize_session: one brief confirmation after writing ("Summary added to the report pad.").

When first connected, greet the user warmly and briefly — 1-2 sentences max — then ask what they'd like to explore.
${buildChangelogPrompt()}`

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
    devLogger.log("aria", "system", "ariaConnect", "ready · setupComplete")
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
      devLogger.log("aria", "info", "toolCall", `→ ${call.name}`, call.args)
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
    case "navigate_to_template": dispatchCommand({ type: "NAVIGATE", url: `/templates/${args.themeId as string}` }); return undefined
    case "explain_pricing": return "StoreKit has three tiers: Starter is free and lets you build with Aria. Builder at $29/month adds a custom domain and priority support. Pro at $79/month adds team members, analytics, and advanced AI editing. All plans include Aria voice control."
    case "navigate":        dispatchCommand({ type: "NAVIGATE",    url: args.url as string }); return undefined
    case "scroll_page":     dispatchCommand({ type: "SCROLL",      direction: args.direction as "up"|"down"|"top"|"bottom", amount: (args.amount as number) ?? 400 }); return undefined
    case "add_to_cart": {
      const slug = args.slug as string
      const name = args.name as string
      if (aria().ariaContext === "template") {
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
      // Extract slug from current URL path (/products/[slug]) — no DOM dependency
      const slugMatch = aria().currentPage.match(/^\/products\/([^/?#]+)/)
        ?? aria().currentPage.match(/^\/templates\/[^/]+\/products\/([^/?#]+)/)
      const slug = slugMatch?.[1]
      if (!slug) return "I can't see a product on this page — navigate to a product first."
      const res = await fetch(`/api/product/${slug}`)
      const p = await res.json()
      if (!p?.id) return "I couldn't load the product details."
      const stock = !p.inStock ? "currently out of stock" : (p.stockCount !== null && p.stockCount <= 5) ? `only ${p.stockCount} left` : "in stock"
      return `${p.name} — ${p.description ?? "a handcrafted piece"}. Priced at $${p.price.toFixed(2)}, ${stock}.`
    }

    case "describe_product": {
      const slug = args.slug as string
      if (aria().ariaContext === "template") {
        const theme = THEMES[aria().activeThemeId]
        const p = theme?.products.find(pr => pr.slug === slug)
        if (!p) return "I don't have a product with that name in my catalog."
        const stock = p.inStock === false
          ? "currently out of stock"
          : (p.stockCount !== undefined && p.stockCount <= 5)
            ? `only ${p.stockCount} left`
            : "in stock"
        return `${p.name} — ${p.description}. Priced at $${p.price.toFixed(2)}, ${stock}.`
      }
      const res = await fetch(`/api/product/${slug}`)
      const p = await res.json()
      if (!p?.id) return "I couldn't find that product."
      const stock = !p.inStock ? "currently out of stock"
        : (p.stockCount !== null && p.stockCount <= 5) ? `only ${p.stockCount} left` : "in stock"
      return `${p.name} — ${p.description ?? "a handcrafted piece"}. Priced at $${p.price.toFixed(2)}, ${stock}.`
    }

    case "navigate_to_product": {
      const { ariaContext: ctx, activeThemeId: tid } = aria()
      const url = ctx === "template"
        ? `/templates/${tid}/products/${args.slug as string}`
        : `/products/${args.slug as string}`
      dispatchCommand({ type: "NAVIGATE", url })
      return undefined
    }

    case "list_all_products": {
      if (aria().ariaContext === "template") {
        const theme = THEMES[aria().activeThemeId]
        if (!theme) return "I couldn't load the product catalog."
        const list = theme.products.map(p => `${p.name} at $${p.price.toFixed(2)}`).join(", ")
        return `Here's everything we carry: ${list}.`
      }
      // Real store: fetch from DB via admin API
      const res = await fetch("/api/admin/products/list")
      if (!res.ok) return "I couldn't load the product catalog right now."
      const products = await res.json() as Array<{ name: string; price: number }>
      if (!products?.length) return "The catalog is currently empty."
      const list = products.map(p => `${p.name} at $${p.price.toFixed(2)}`).join(", ")
      return `Here's everything we carry: ${list}.`
    }

    case "recommend_product": {
      const theme = THEMES[aria().activeThemeId]
      if (!theme) return "I couldn't load the products."
      const budget = args.budget as number | undefined
      const pool = budget
        ? theme.products.filter(p => p.price <= budget && p.inStock !== false)
        : theme.products.filter(p => p.inStock !== false)
      if (pool.length === 0) return "I don't have any products within that budget right now."
      const pick = pool[Math.floor(Math.random() * pool.length)]
      return `I'd recommend the ${pick.name} — ${pick.description} It's $${pick.price.toFixed(2)} and it's one of my favorites.`
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

    // ── Component canvas manipulation ──────────────────────────────────────
    case "add_component": {
      if (!aria().editorMode) return undefined
      const slug = args.component_slug as string
      const position = (args.position as string | undefined) ?? "before_footer"
      const props = (args.props as Record<string, unknown> | undefined) ?? {}

      // Fetch component to validate it exists
      try {
        const res = await fetch(`/api/components?search=${slug}`)
        const components = await res.json() as Array<{ slug: string; name: string }>
        const found = components.find(c => c.slug === slug)
        if (!found) return `I couldn't find a component with the slug "${slug}".`
      } catch {
        return "Failed to validate component — please try again."
      }

      // Add to canvas store
      const componentId = useCanvas.getState().addComponent(slug, props, position)
      return `Added ${slug} component to canvas (ID: ${componentId}).`
    }

    case "edit_component": {
      if (!aria().editorMode) return undefined
      const componentId = args.component_id as string
      const props = (args.props as Record<string, unknown> | undefined) ?? {}

      // Check if component exists in canvas
      const instance = useCanvas.getState().getInstance(componentId)
      if (!instance) return `Component with ID "${componentId}" not found on canvas.`

      // Update in canvas store
      useCanvas.getState().updateComponent(componentId, props)
      return `Updated ${instance.slug} component (ID: ${componentId}).`
    }

    case "remove_component": {
      if (!aria().editorMode) return undefined
      const componentId = args.component_id as string

      // Check if component exists in canvas
      const instance = useCanvas.getState().getInstance(componentId)
      if (!instance) return `Component with ID "${componentId}" not found on canvas.`

      // Remove from canvas store
      useCanvas.getState().removeComponent(componentId)
      return `Removed ${instance.slug} component from canvas.`
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

    // ── Admin / dev commands ───────────────────────────────────────────────
    case "navigate_admin": {
      const section = args.section as string
      const urls: Record<string, string> = {
        dashboard:    "/dashboard",
        editor:       "/admin/editor",
        themes:       "/admin/themes",
        media:        "/admin/media",
        components:   "/admin/components",
        "image-scout":"/admin/image-scout",
        scout:        "/admin/image-scout",
        admin:        "/admin",
      }
      const url = urls[section] ?? "/admin"
      dispatchCommand({ type: "NAVIGATE", url })
      return undefined
    }

    case "open_dev_hub": {
      const devHubMod = await import("@/lib/devHubStore")
      devHubMod.toggle()
      devLogger.log("aria", "info", "voiceCmd", "DevHub toggled via voice")
      return undefined
    }

    case "list_components": {
      const res = await fetch("/api/components")
      if (!res.ok) return "I couldn't load the component registry."
      const components = await res.json() as Array<{ slug: string; name: string; category: string }>
      if (!components?.length) return "The component registry is empty."
      const grouped: Record<string, string[]> = {}
      for (const c of components) {
        grouped[c.category] = grouped[c.category] ? [...grouped[c.category], c.name] : [c.name]
      }
      const summary = Object.entries(grouped)
        .map(([cat, names]) => `${cat}: ${names.join(", ")}`)
        .join(". ")
      return `${components.length} components registered. ${summary}.`
    }

    case "image_scout_search": {
      const themeId = args.themeId as string
      const slot    = args.slot    as string
      const prompt  = args.prompt  as string
      // Navigate to Image Scout with pre-filled params
      dispatchCommand({ type: "NAVIGATE", url: `/admin/image-scout?theme=${themeId}&slot=${slot}&q=${encodeURIComponent(prompt)}` })
      return `Navigating to Image Scout — searching for ${slot} images for the ${themeId} theme.`
    }

    case "image_scout_cdn_search": {
      const query = args.query as string
      const res = await fetch(`/api/admin/image-scout/catalog?q=${encodeURIComponent(query)}`)
      if (!res.ok) return "I couldn't search the CDN catalog."
      const data = await res.json() as { results: Array<{ r2Key: string; altText: string; themeId: string; slot: string }> }
      if (!data.results?.length) return "No matching images found in the CDN catalog."
      const list = data.results.slice(0, 3).map(r => `${r.themeId}/${r.slot}: ${r.altText || r.r2Key}`).join(". ")
      return `Found ${data.results.length} images. Top matches: ${list}.`
    }

    case "get_changelog":
      return ARIA_CHANGELOG.slice(0, 5)
        .map((e) => `• ${e.capability} (${e.date}): ${e.description}`)
        .join("\n")

    case "write_to_report": {
      const { useReportPad } = await import("@/store/reportPad")
      useReportPad.getState().addEntry(
        args.text as string,
        (args.type as string) as import("@/store/reportPad").EntryType
      )
      return undefined
    }

    case "clear_report": {
      const { useReportPad } = await import("@/store/reportPad")
      useReportPad.getState().clearAll()
      return undefined
    }

    case "summarize_session": {
      const { useReportPad } = await import("@/store/reportPad")
      const { entries } = useReportPad.getState()
      const focus = args.focus as string | undefined
      const counts = entries.reduce<Record<string, number>>((acc, e) => {
        acc[e.type] = (acc[e.type] ?? 0) + 1
        return acc
      }, {})
      const countStr = Object.entries(counts).map(([t, n]) => `${n} ${t}`).join(", ")
      const recentEntries = entries.slice(-5).map((e) => `[${e.timestamp}] ${e.type}: ${e.text}`).join("\n")
      const summary = [
        `## Session Summary${focus ? ` — ${focus}` : ""}`,
        `**Total entries:** ${entries.length} (${countStr || "none"})`,
        `**Session page:** ${aria().currentPage}`,
        `**Recent activity:**\n${recentEntries || "No entries yet."}`,
      ].join("\n")
      useReportPad.getState().addEntry(summary, "summary")
      return undefined
    }

    default: return undefined
  }
}

// ── Send silent page context update to a live session ─────────────────────
// Uses turn_complete:false so Aria receives context without speaking a response
export function sendPageContextToAria(pathname: string) {
  if (!_ws || _ws.readyState !== WebSocket.OPEN || !_ready) return
  _ws.send(JSON.stringify({
    client_content: {
      turns: [{ role: "user", parts: [{ text: `[SYSTEM — do not respond] Page changed to: ${pathname}` }] }],
      turn_complete: false,
    },
  }))
  devLogger.log("aria", "system", "pageContext", `page → ${pathname}`)
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
  devLogger.log("aria", "info", "ariaConnect", `connecting · ctx=${aria().ariaContext} · theme=${aria().activeThemeId}`)
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

      // ── Task 4.1: Inject component registry into system prompt ──────────────
      if (aria().ariaContext === "member" && aria().editorMode) {
        try {
          const compRes = await fetch("/api/components")
          if (compRes.ok) {
            const components = await compRes.json() as Array<{ slug: string; name: string; category: string }>
            if (components?.length) {
              const compBlock = "AVAILABLE_COMPONENTS:\n" + components
                .map((c) => `- ${c.slug}: ${c.name} (${c.category})`)
                .join("\n")
              systemPrompt += "\n\n" + compBlock
            }
          }
        } catch {
          // silently skip if component fetch fails — Aria still works without it
        }
      }

      // Editor mode: inject editor instructions
      if (aria().editorMode) {
        systemPrompt += "\n\nEDITOR MODE: You are helping the site owner edit their website by voice. After each successful edit, confirm in one short sentence what changed. For remove_section and reorder_section, a confirmation modal will appear — tell the user to confirm or say yes/no. For publish_changes, announce success. Undo/redo are available by voice. You can also add, edit, and remove atomic components from the page — users can say 'add a button', 'change the card color', 'remove the hero', etc."
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
    ws.onerror   = () => {
      devLogger.log("aria", "error", "ariaConnect", "WebSocket error — check API key or network")
      toast.error("Aria: WebSocket error — check API key or network")
    }
    ws.onclose   = (e) => {
      devLogger.log("aria", "warn", "ariaConnect", `disconnected · code=${e.code}`, e.reason || undefined)
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
