import {
  RuntimeConfigError,
  getRequiredEnv,
  isLocalAppEnv,
} from "@/lib/config/runtime-env"
import { parseConfiguredUrl } from "@/lib/config/runtime-common"

export function getInternalRealtimePublishUrl() {
  const configured = process.env.INTERNAL_REALTIME_INTERNAL_URL?.trim()
  if (configured) {
    return parseConfiguredUrl(
      configured,
      "INTERNAL_REALTIME_INTERNAL_URL"
    ).toString()
  }

  if (isLocalAppEnv()) {
    return "http://localhost:3001/internal/broadcast"
  }

  throw new RuntimeConfigError(
    "INTERNAL_REALTIME_INTERNAL_URL must be set outside APP_ENV=local"
  )
}

export function getInternalRealtimeServiceSecret() {
  return getRequiredEnv("INTERNAL_REALTIME_SERVICE_SECRET")
}
