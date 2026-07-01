import {
  RuntimeConfigError,
} from "@/lib/config/runtime-common"
import {
  assertPublicBrowserWebSocketUrl,
  canUseInsecureLocalBrowserTransport,
} from "@/lib/config/public-runtime-env"

export function getPublicRealtimeUrl() {
  const configured = process.env.NEXT_PUBLIC_REALTIME_URL?.trim()
  const browserHostname =
    typeof window === "undefined" ? null : window.location.hostname

  if (configured) {
    return assertPublicBrowserWebSocketUrl(
      configured,
      "NEXT_PUBLIC_REALTIME_URL",
      browserHostname
    ).toString()
  }

  if (canUseInsecureLocalBrowserTransport(undefined, browserHostname)) {
    return "ws://localhost:3001/ws"
  }

  throw new RuntimeConfigError(
    "NEXT_PUBLIC_REALTIME_URL must be set outside local browser sessions"
  )
}
