export const APP_ENV_VALUES = [
  "local",
  "development",
  "staging",
  "production",
] as const

export type AppEnv = (typeof APP_ENV_VALUES)[number] | string

export class RuntimeConfigError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export function getAppEnv(): AppEnv {
  return process.env.APP_ENV?.trim() || "development"
}

export function isLocalAppEnv(env: AppEnv = getAppEnv()) {
  return env === "local"
}

export function isStrictTransportEnv(env: AppEnv = getAppEnv()) {
  return !isLocalAppEnv(env)
}

export function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new RuntimeConfigError(`${name} must be set`)
  }

  return value
}

export function isLocalHostname(hostname: string) {
  const normalized = hostname.toLowerCase()
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".localhost")
  )
}

function parseConfiguredUrl(value: string, name: string) {
  try {
    return new URL(value)
  } catch {
    throw new RuntimeConfigError(`${name} must be a valid URL`)
  }
}

export function assertBrowserHttpUrl(value: string, name: string) {
  const url = parseConfiguredUrl(value, name)

  if (isLocalAppEnv() && url.protocol === "http:" && isLocalHostname(url.hostname)) {
    return url
  }

  if (url.protocol !== "https:") {
    throw new RuntimeConfigError(`${name} must use https:// outside APP_ENV=local`)
  }

  return url
}

export function assertBrowserWebSocketUrl(value: string, name: string) {
  const url = parseConfiguredUrl(value, name)

  if (isLocalAppEnv() && url.protocol === "ws:" && isLocalHostname(url.hostname)) {
    return url
  }

  if (url.protocol !== "wss:") {
    throw new RuntimeConfigError(`${name} must use wss:// outside APP_ENV=local`)
  }

  return url
}

export function getAppUrl() {
  return assertBrowserHttpUrl(getRequiredEnv("APP_URL"), "APP_URL")
}

export function getRequestProtocol(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim().toLowerCase() ?? null
  }

  return new URL(request.url).protocol.replace(":", "").toLowerCase()
}

export function assertSecureBrowserRequest(request: Request) {
  if (!isStrictTransportEnv()) return

  const protocol = getRequestProtocol(request)
  if (protocol !== "https") {
    throw new RuntimeConfigError("HTTPS is required outside APP_ENV=local")
  }
}

export function getAllowedAppOrigins() {
  const origins = new Set<string>()
  const explicit = process.env.REALTIME_ALLOWED_ORIGINS?.trim()

  if (explicit) {
    for (const value of explicit.split(",")) {
      const trimmed = value.trim()
      if (trimmed) origins.add(assertBrowserHttpUrl(trimmed, "REALTIME_ALLOWED_ORIGINS").origin)
    }
  }

  const appUrl = process.env.APP_URL?.trim()
  if (appUrl) {
    origins.add(assertBrowserHttpUrl(appUrl, "APP_URL").origin)
  }

  return origins
}
