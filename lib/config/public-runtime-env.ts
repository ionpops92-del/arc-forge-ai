import {
  RuntimeConfigError,
  isLocalHostname,
  parseConfiguredUrl,
} from "@/lib/config/runtime-common"

export const PUBLIC_APP_ENV_VALUES = [
  "local",
  "development",
  "staging",
  "production",
] as const

export type PublicAppEnv = (typeof PUBLIC_APP_ENV_VALUES)[number] | string

export function getPublicAppEnv(): PublicAppEnv {
  return process.env.NEXT_PUBLIC_APP_ENV?.trim() || "development"
}

export function isPublicLocalAppEnv(env: PublicAppEnv = getPublicAppEnv()) {
  return env === "local"
}

function getBrowserHostname() {
  if (typeof window === "undefined") return null
  return window.location.hostname
}

export function canUseInsecureLocalBrowserTransport(
  env: PublicAppEnv = getPublicAppEnv(),
  browserHostname: string | null = getBrowserHostname()
) {
  if (!isPublicLocalAppEnv(env)) return false
  return browserHostname === null || isLocalHostname(browserHostname)
}

export function assertPublicBrowserWebSocketUrl(
  value: string,
  name: string,
  browserHostname: string | null = getBrowserHostname()
) {
  const url = parseConfiguredUrl(value, name)

  if (
    canUseInsecureLocalBrowserTransport(getPublicAppEnv(), browserHostname) &&
    url.protocol === "ws:" &&
    isLocalHostname(url.hostname)
  ) {
    return url
  }

  if (url.protocol !== "wss:") {
    throw new RuntimeConfigError(
      `${name} must use wss:// outside NEXT_PUBLIC_APP_ENV=local browser-local mode`
    )
  }

  return url
}
