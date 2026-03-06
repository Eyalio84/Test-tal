"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAria } from "@/store/aria"
import { useCart } from "@/store/cart"
import type { AriaState } from "@/store/aria"

// ── Gemini Live API types ──────────────────────────────────────────────────
interface GeminiSession {
  sendRealtimeInput: (input: { audio: { data: string; mimeType: string } }) => void
  close: () => void
}

// ── Aria's function declarations ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ARIA_FUNCTIONS: any[] = [
  {
    name: "navigate",
    description: "Navigate the user to a page in the store",
    parameters: {
      type: "OBJECT",
      properties: {
        url: { type: "STRING", description: "The URL path to navigate to, e.g. /products, /collections, /about, /products?category=Rings" },
      },
      required: ["url"],
    },
  },
  {
    name: "scroll_page",
    description: "Scroll the current page up or down",
    parameters: {
      type: "OBJECT",
      properties: {
        direction: { type: "STRING", description: "up, down, top, or bottom" },
        amount:    { type: "NUMBER", description: "Pixels to scroll, default 400" },
      },
      required: ["direction"],
    },
  },
  {
    name: "add_to_cart",
    description: "Add a product to the shopping cart by its slug identifier",
    parameters: {
      type: "OBJECT",
      properties: {
        slug:  { type: "STRING", description: "Product slug e.g. gold-bracelet-set, pearl-drop-earrings" },
        name:  { type: "STRING", description: "Product display name" },
      },
      required: ["slug", "name"],
    },
  },
  {
    name: "open_cart",
    description: "Open the shopping cart drawer",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "filter_products",
    description: "Filter products by category on the shop page",
    parameters: {
      type: "OBJECT",
      properties: {
        category: { type: "STRING", description: "Category name: Rings, Necklaces, Earrings, Bracelets, Pendants, Brooches" },
      },
      required: ["category"],
    },
  },
  {
    name: "start_tour",
    description: "Start Aria's guided tour of the store",
    parameters: { type: "OBJECT", properties: {} },
  },
]

// ── System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Aria, an elegant and warm voice shopping assistant for a luxury handcrafted jewelry store. You have a sophisticated, warm personality — like a knowledgeable friend who knows everything about fine jewelry.

Your role:
- Help customers navigate and discover jewelry through natural conversation
- Add items to cart, filter collections, guide them through the store
- Give warm, concise responses (1-3 sentences) — you're speaking, not writing
- Use the provided functions to take actions in the store
- After taking an action, briefly confirm it aloud

Available product slugs: gold-bracelet-set, pearl-drop-earrings, sapphire-statement-ring, diamond-solitaire-pendant, rose-gold-chain-necklace, emerald-stud-earrings, vintage-gold-brooch, sterling-silver-cuff

Categories: Rings, Necklaces, Earrings, Bracelets, Pendants, Brooches

Voice style: Warm, confident, elegant. Short sentences. Never robotic.`

// ── PCM audio helpers ──────────────────────────────────────────────────────
function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  return buffer
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useAriaLive() {
  const {
    setAriaState, setConnected, setUserTranscript,
    setAriaTranscript, dispatchCommand, isConnected,
  } = useAria()
  const { addItem } = useCart()

  const sessionRef      = useRef<GeminiSession | null>(null)
  const audioCtxRef     = useRef<AudioContext | null>(null)
  const processorRef    = useRef<ScriptProcessorNode | null>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const playbackCtxRef  = useRef<AudioContext | null>(null)
  const playQueueRef    = useRef<ArrayBuffer[]>([])
  const isPlayingRef    = useRef(false)

  // ── Audio playback queue ─────────────────────────────────────────────────
  const playNextChunk = useCallback(async () => {
    if (isPlayingRef.current || playQueueRef.current.length === 0) return
    isPlayingRef.current = true
    setAriaState("speaking")

    const ctx = playbackCtxRef.current!
    const pcmData = playQueueRef.current.shift()!
    const int16 = new Int16Array(pcmData)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 0x8000

    const buffer = ctx.createBuffer(1, float32.length, 24000)
    buffer.copyToChannel(float32, 0)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.onended = () => {
      isPlayingRef.current = false
      if (playQueueRef.current.length > 0) {
        playNextChunk()
      } else {
        setAriaState("listening")
      }
    }
    source.start()
  }, [setAriaState])

  // ── Handle incoming Gemini messages ─────────────────────────────────────
  const handleMessage = useCallback((message: unknown) => {
    const msg = message as Record<string, unknown>

    // Audio from Aria
    const serverContent = msg.serverContent as Record<string, unknown> | undefined
    if (serverContent?.modelTurn) {
      const turn = serverContent.modelTurn as Record<string, unknown>
      const parts = (turn.parts as unknown[]) ?? []
      for (const part of parts) {
        const p = part as Record<string, unknown>
        if (p.inlineData) {
          const inlineData = p.inlineData as Record<string, unknown>
          const audioBuffer = base64ToArrayBuffer(inlineData.data as string)
          playQueueRef.current.push(audioBuffer)
          if (!isPlayingRef.current) playNextChunk()
        }
        if (p.text) {
          setAriaTranscript(p.text as string)
        }
      }
    }

    // User transcript
    const inputTranscription = msg.inputTranscription as Record<string, unknown> | undefined
    if (inputTranscription?.text) {
      setUserTranscript(inputTranscription.text as string)
    }

    // Function calls
    const toolCall = msg.toolCall as Record<string, unknown> | undefined
    if (toolCall?.functionCalls) {
      const calls = toolCall.functionCalls as Array<{ name: string; args: Record<string, unknown> }>
      for (const call of calls) {
        handleFunctionCall(call.name, call.args)
      }
    }
  }, [playNextChunk, setAriaTranscript, setUserTranscript])

  // ── Execute Aria's function calls ────────────────────────────────────────
  const handleFunctionCall = useCallback((name: string, args: Record<string, unknown>) => {
    switch (name) {
      case "navigate":
        dispatchCommand({ type: "NAVIGATE", url: args.url as string })
        break
      case "scroll_page":
        dispatchCommand({
          type: "SCROLL",
          direction: args.direction as "up" | "down" | "top" | "bottom",
          amount: (args.amount as number) ?? 400,
        })
        break
      case "add_to_cart":
        dispatchCommand({ type: "ADD_TO_CART", slug: args.slug as string, name: args.name as string })
        break
      case "open_cart":
        dispatchCommand({ type: "OPEN_CART" })
        break
      case "filter_products":
        dispatchCommand({ type: "FILTER", category: args.category as string })
        break
      case "start_tour":
        dispatchCommand({ type: "START_TOUR" })
        break
    }
  }, [dispatchCommand, addItem])

  // ── Connect to Gemini Live API ────────────────────────────────────────────
  const connect = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) { console.error("Aria: no NEXT_PUBLIC_GEMINI_API_KEY"); return }

    setAriaState("connecting")

    try {
      // Dynamic import — only in browser
      const { GoogleGenAI, Modality } = await import("@google/genai")
      const ai = new GoogleGenAI({ apiKey })

      playbackCtxRef.current = new AudioContext({ sampleRate: 24000 })

      const session = await ai.live.connect({
        model: "gemini-2.0-flash-live-001",
        callbacks: {
          onopen:   ()      => { setConnected(true); setAriaState("listening") },
          onmessage: (msg)  => handleMessage(msg),
          onerror:  (e)     => { console.error("Aria WebSocket error", e); disconnect() },
          onclose:  ()      => { setConnected(false); setAriaState("idle") },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          inputAudioTranscription: {},
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          tools: [{ functionDeclarations: ARIA_FUNCTIONS }],
        },
      })

      sessionRef.current = session as unknown as GeminiSession

      // Set up microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = new AudioContext({ sampleRate: 16000 })
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const processor = ctx.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (!sessionRef.current) return
        const float32 = e.inputBuffer.getChannelData(0)
        const pcmBuffer = floatTo16BitPCM(float32)
        const base64 = arrayBufferToBase64(pcmBuffer)
        sessionRef.current.sendRealtimeInput({
          audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
        })
      }

      source.connect(processor)
      processor.connect(ctx.destination)
    } catch (err) {
      console.error("Aria: connection failed", err)
      setAriaState("idle")
    }
  }, [handleMessage, setAriaState, setConnected])

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    processorRef.current?.disconnect()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close()
    playbackCtxRef.current?.close()
    sessionRef.current?.close()

    sessionRef.current   = null
    audioCtxRef.current  = null
    processorRef.current = null
    streamRef.current    = null
    playQueueRef.current = []
    isPlayingRef.current = false

    setConnected(false)
    setAriaState("idle")
  }, [setConnected, setAriaState])

  // Cleanup on unmount
  useEffect(() => () => { disconnect() }, [disconnect])

  return { connect, disconnect, isConnected }
}
