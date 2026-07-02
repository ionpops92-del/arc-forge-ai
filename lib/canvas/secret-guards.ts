const SECRET_KEY_PATTERN =
  /(?:api[_-]?key|secret|password|passwd|token|private[_-]?key|client[_-]?secret|access[_-]?key|refresh[_-]?token|credential)/i

const RAW_SECRET_VALUE_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bAIza[0-9A-Za-z_-]{20,}\b/,
  /\bghp_[0-9A-Za-z]{20,}\b/,
  /\bgithub_pat_[0-9A-Za-z_]{20,}\b/,
  /\bsk-[0-9A-Za-z]{20,}\b/,
  /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/,
  /\beyJ[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{10,}\b/,
]

export function isSecretReference(value: string): boolean {
  return /^(secretRef|secretCapabilityRef|secret-ref|secret-capability-ref):[A-Za-z0-9._:/-]+$/i.test(
    value.trim()
  )
}

export function isSecretLikeKey(key: string): boolean {
  return SECRET_KEY_PATTERN.test(key)
}

export function looksLikeRawSecretValue(value: string): boolean {
  const clean = value.trim()
  if (!clean || isSecretReference(clean)) return false
  return RAW_SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(clean))
}

export function shouldStripSecretField(key: string, value: unknown): boolean {
  return (
    isSecretLikeKey(key) &&
    typeof value === "string" &&
    value.trim().length > 0 &&
    !isSecretReference(value)
  )
}
