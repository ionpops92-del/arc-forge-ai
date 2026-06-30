import { createHash, randomBytes, timingSafeEqual } from "crypto"

export function generateSecureToken() {
  return randomBytes(32).toString("base64url")
}

export function hashToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

export function timingSafeTokenHashEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)

  if (left.length !== right.length) {
    return false
  }

  return timingSafeEqual(left, right)
}
