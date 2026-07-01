export class RuntimeConfigError extends Error {
  constructor(message: string) {
    super(message)
  }
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

export function parseConfiguredUrl(value: string, name: string) {
  try {
    return new URL(value)
  } catch {
    throw new RuntimeConfigError(`${name} must be a valid URL`)
  }
}
