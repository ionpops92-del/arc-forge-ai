import {
  RuntimeConfigError,
  assertBrowserWebSocketUrl,
  getRequiredEnv,
  isLocalHostname,
} from "@/lib/config/runtime-env"

export function getPublicRealtimeUrl() {
  const configured = process.env.NEXT_PUBLIC_REALTIME_URL?.trim()

  if (configured) {
    return assertBrowserWebSocketUrl(configured, "NEXT_PUBLIC_REALTIME_URL").toString()
  }

  if (typeof window !== "undefined" && isLocalHostname(window.location.hostname)) {
    return "ws://localhost:3001/ws"
  }

  throw new RuntimeConfigError(
    "NEXT_PUBLIC_REALTIME_URL must be set outside local browser sessions"
  )
}

export function getInternalRealtimePublishUrl() {
  const configured = process.env.INTERNAL_REALTIME_INTERNAL_URL?.trim()
  if (configured) return configured

  return "http://localhost:3001/internal/broadcast"
}

export function getInternalRealtimeServiceSecret() {
  return getRequiredEnv("INTERNAL_REALTIME_SERVICE_SECRET")
}
