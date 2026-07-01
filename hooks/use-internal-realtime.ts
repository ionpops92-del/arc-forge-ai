"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type {
  RealtimeClientMessage,
  RealtimePresence,
  RealtimeRoomEvent,
  RealtimeServerMessage,
} from "@/lib/realtime/types"

type RealtimeConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

interface UseInternalRealtimeOptions {
  projectId: string
  roomId: string
  enabled?: boolean
}

interface RealtimeTokenResponse {
  token: string
}

function getRealtimeWebSocketUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_INTERNAL_REALTIME_URL

  if (configuredUrl) return configuredUrl

  if (typeof window === "undefined") return "ws://localhost:3001/ws"

  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "ws://localhost:3001/ws"
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${protocol}//${window.location.host}/ws`
}

function parseServerMessage(raw: string): RealtimeServerMessage | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    return typeof parsed === "object" && parsed !== null && "type" in parsed
      ? (parsed as RealtimeServerMessage)
      : null
  } catch {
    return null
  }
}

export function useInternalRealtime({
  projectId,
  roomId,
  enabled = false,
}: UseInternalRealtimeOptions) {
  const socketRef = useRef<WebSocket | null>(null)
  const connectRef = useRef<() => Promise<void>>(async () => {})
  const reconnectTimeoutRef = useRef<number | null>(null)
  const shouldReconnectRef = useRef(false)
  const [status, setStatus] = useState<RealtimeConnectionStatus>("idle")
  const [lastMessage, setLastMessage] = useState<RealtimeServerMessage | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false

    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    socketRef.current?.close()
    socketRef.current = null
    setStatus("disconnected")
  }, [])

  const connect = useCallback(async () => {
    if (!projectId || !roomId) return

    shouldReconnectRef.current = true
    setStatus("connecting")
    setError(null)

    const response = await fetch("/api/realtime/token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId, roomId }),
    })

    if (!response.ok) {
      setStatus("error")
      setError("Unable to authorize realtime room")
      return
    }

    const tokenResponse = (await response.json()) as RealtimeTokenResponse
    const websocketUrl = new URL(getRealtimeWebSocketUrl())
    websocketUrl.searchParams.set("token", tokenResponse.token)

    const socket = new WebSocket(websocketUrl.toString())
    socketRef.current = socket

    socket.onopen = () => {
      setStatus("connected")
    }

    socket.onmessage = (event) => {
      if (typeof event.data !== "string") return

      const message = parseServerMessage(event.data)
      if (message) setLastMessage(message)
    }

    socket.onerror = () => {
      setStatus("error")
      setError("Realtime connection failed")
    }

    socket.onclose = () => {
      socketRef.current = null
      setStatus("disconnected")

      if (shouldReconnectRef.current) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connectRef.current().catch(() => {
            setStatus("error")
            setError("Realtime reconnect failed")
          })
        }, 1500)
      }
    }
  }, [projectId, roomId])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const sendMessage = useCallback((message: RealtimeClientMessage) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false

    socketRef.current.send(JSON.stringify(message))
    return true
  }, [])

  const sendPresence = useCallback(
    (presence: RealtimePresence | null) =>
      sendMessage({ type: "presence.update", presence }),
    [sendMessage]
  )

  const broadcastEvent = useCallback(
    (event: RealtimeRoomEvent) =>
      sendMessage({ type: "event.broadcast", event }),
    [sendMessage]
  )

  useEffect(() => {
    if (!enabled) {
      shouldReconnectRef.current = false
      socketRef.current?.close()
      socketRef.current = null
      return
    }

    const connectTimeout = window.setTimeout(() => {
      connectRef.current().catch(() => {
        setStatus("error")
        setError("Realtime connection failed")
      })
    }, 0)

    return () => {
      window.clearTimeout(connectTimeout)
      shouldReconnectRef.current = false

      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      socketRef.current?.close()
      socketRef.current = null
    }
  }, [enabled, projectId, roomId])

  return {
    status,
    lastMessage,
    error,
    connect,
    disconnect,
    sendPresence,
    broadcastEvent,
  }
}
