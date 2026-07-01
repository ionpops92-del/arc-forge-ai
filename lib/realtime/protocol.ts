import type {
  JsonValue,
  RealtimeClientMessage,
  RealtimePresence,
  RealtimeServerMessage,
} from "@/lib/realtime/types"
import { REALTIME_ROOM_EVENT_TYPES } from "@/lib/realtime/types"

export const MAX_REALTIME_PAYLOAD_BYTES = 64 * 1024
const MAX_EVENT_TYPE_LENGTH = 120
const KNOWN_ROOM_EVENT_TYPES = new Set<string>(REALTIME_ROOM_EVENT_TYPES)

interface ParseResultSuccess {
  ok: true
  message: RealtimeClientMessage
}

interface ParseResultFailure {
  ok: false
  error: string
}

export type ParseRealtimeMessageResult = ParseResultSuccess | ParseResultFailure

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true

  const valueType = typeof value

  if (valueType === "string" || valueType === "boolean") return true
  if (valueType === "number") return Number.isFinite(value)

  if (Array.isArray(value)) {
    return value.every(isJsonValue)
  }

  if (isRecord(value)) {
    return Object.values(value).every(isJsonValue)
  }

  return false
}

function isPresence(value: unknown): value is RealtimePresence {
  return isRecord(value) && isJsonValue(value)
}

function parseRoomEvent(rawEvent: unknown) {
  if (!isRecord(rawEvent)) {
    return { ok: false as const, error: "Event payload is required" }
  }

  const eventType = rawEvent.type
  const payload = rawEvent.payload

  if (
    typeof eventType !== "string" ||
    eventType.trim().length === 0 ||
    eventType.length > MAX_EVENT_TYPE_LENGTH
  ) {
    return { ok: false as const, error: "Event type is invalid" }
  }

  if (!isJsonValue(payload)) {
    return { ok: false as const, error: "Event payload must be JSON serializable" }
  }

  return {
    ok: true as const,
    event: {
      type: eventType,
      payload,
    },
  }
}

function parseJson(raw: string): unknown {
  return JSON.parse(raw) as unknown
}

export function parseRealtimeClientMessage(
  raw: string
): ParseRealtimeMessageResult {
  if (Buffer.byteLength(raw, "utf8") > MAX_REALTIME_PAYLOAD_BYTES) {
    return { ok: false, error: "Message is too large" }
  }

  let parsed: unknown

  try {
    parsed = parseJson(raw)
  } catch {
    return { ok: false, error: "Message must be valid JSON" }
  }

  if (!isRecord(parsed) || typeof parsed.type !== "string") {
    return { ok: false, error: "Message type is required" }
  }

  switch (parsed.type) {
    case "presence.update": {
      if (parsed.presence !== null && !isPresence(parsed.presence)) {
        return { ok: false, error: "Presence must be a JSON object or null" }
      }

      return {
        ok: true,
        message: {
          type: "presence.update",
          presence: parsed.presence,
        },
      }
    }

    case "room.ping": {
      if (
        parsed.requestId !== undefined &&
        typeof parsed.requestId !== "string"
      ) {
        return { ok: false, error: "requestId must be a string" }
      }

      return {
        ok: true,
        message: {
          type: "room.ping",
          requestId: parsed.requestId,
        },
      }
    }

    case "event.broadcast": {
      const parsedEvent = parseRoomEvent(parsed.event)
      if (!parsedEvent.ok) return { ok: false, error: parsedEvent.error }

      return {
        ok: true,
        message: {
          type: "event.broadcast",
          event: parsedEvent.event,
        },
      }
    }

    default:
      if (KNOWN_ROOM_EVENT_TYPES.has(parsed.type)) {
        const parsedEvent = parseRoomEvent(parsed)
        if (!parsedEvent.ok) return { ok: false, error: parsedEvent.error }

        return {
          ok: true,
          message: {
            type: "event.broadcast",
            event: parsedEvent.event,
          },
        }
      }

      return { ok: false, error: "Unsupported message type" }
  }
}

export function serializeRealtimeServerMessage(
  message: RealtimeServerMessage
): string {
  return JSON.stringify(message)
}

export function isRealtimeServerMessage(
  value: unknown
): value is RealtimeServerMessage {
  return isRecord(value) && typeof value.type === "string"
}
