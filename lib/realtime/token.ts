import { createHmac, timingSafeEqual } from "node:crypto"
import type { RealtimeTokenPayload } from "@/lib/realtime/types"

const TOKEN_VERSION = "v1"
const TOKEN_TTL_SECONDS = 5 * 60
const MIN_SECRET_LENGTH = 16

export interface CreateRealtimeTokenInput {
  userId: string
  projectId: string
  roomId: string
  displayName: string | null
}

export interface CreatedRealtimeToken {
  token: string
  expiresAt: string
  expiresInSeconds: number
}

export class RealtimeTokenError extends Error {
  constructor(message = "Invalid realtime token") {
    super(message)
  }
}

function getRealtimeTokenSecret() {
  const secret = process.env.INTERNAL_REALTIME_TOKEN_SECRET?.trim()

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error("INTERNAL_REALTIME_TOKEN_SECRET must be set")
  }

  return secret
}

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url")
}

function decodeJson(value: string): unknown {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url")
}

function constantTimeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) return false

  return timingSafeEqual(leftBuffer, rightBuffer)
}

function isRealtimeTokenPayload(
  value: unknown
): value is RealtimeTokenPayload {
  if (typeof value !== "object" || value === null) return false

  const candidate = value as Partial<RealtimeTokenPayload>

  return (
    typeof candidate.sub === "string" &&
    typeof candidate.userId === "string" &&
    candidate.sub === candidate.userId &&
    typeof candidate.projectId === "string" &&
    typeof candidate.roomId === "string" &&
    (candidate.displayName === null ||
      typeof candidate.displayName === "string") &&
    typeof candidate.iat === "number" &&
    typeof candidate.exp === "number"
  )
}

export function createRealtimeRoomToken(
  input: CreateRealtimeTokenInput
): CreatedRealtimeToken {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + TOKEN_TTL_SECONDS
  const payload: RealtimeTokenPayload = {
    sub: input.userId,
    userId: input.userId,
    projectId: input.projectId,
    roomId: input.roomId,
    displayName: input.displayName,
    iat: now,
    exp,
  }
  const encodedPayload = encodeJson(payload)
  const signature = sign(encodedPayload, getRealtimeTokenSecret())

  return {
    token: `${TOKEN_VERSION}.${encodedPayload}.${signature}`,
    expiresAt: new Date(exp * 1000).toISOString(),
    expiresInSeconds: TOKEN_TTL_SECONDS,
  }
}

export function verifyRealtimeRoomToken(token: string): RealtimeTokenPayload {
  const [version, encodedPayload, signature] = token.split(".")

  if (version !== TOKEN_VERSION || !encodedPayload || !signature) {
    throw new RealtimeTokenError()
  }

  const expectedSignature = sign(encodedPayload, getRealtimeTokenSecret())

  if (!constantTimeEquals(signature, expectedSignature)) {
    throw new RealtimeTokenError()
  }

  let payload: unknown

  try {
    payload = decodeJson(encodedPayload)
  } catch {
    throw new RealtimeTokenError()
  }

  if (!isRealtimeTokenPayload(payload)) {
    throw new RealtimeTokenError()
  }

  const now = Math.floor(Date.now() / 1000)

  if (payload.exp <= now) {
    throw new RealtimeTokenError("Realtime token has expired")
  }

  return payload
}
