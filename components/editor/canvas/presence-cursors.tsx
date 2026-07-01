"use client"

import { useViewport } from "@xyflow/react"
import { Loader2 } from "lucide-react"
import { useRealtimeRoom } from "@/hooks/use-realtime-room"

const FALLBACK_CURSOR_COLOR = "var(--color-text-muted)"

export function PresenceCursors() {
  const { presence, connectionId } = useRealtimeRoom()
  const { x: viewportX, y: viewportY, zoom } = useViewport()

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {presence.map((other) => {
        if (other.connectionId === connectionId) return null
        const cursor = other.presence?.cursor
        if (
          !cursor ||
          typeof cursor !== "object" ||
          Array.isArray(cursor) ||
          typeof cursor.x !== "number" ||
          typeof cursor.y !== "number"
        ) {
          return null
        }

        const x = cursor.x * zoom + viewportX
        const y = cursor.y * zoom + viewportY
        const color =
          typeof other.presence?.color === "string"
            ? other.presence.color
            : FALLBACK_CURSOR_COLOR
        const name =
          typeof other.presence?.name === "string"
            ? other.presence.name
            : "Anonymous"
        const thinking = other.presence?.thinking === true

        return (
          <div
            key={other.connectionId}
            className="absolute z-50"
            style={{ left: x, top: y }}
          >
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L14 8.5L8 10.5L5.5 17L1 1Z"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <div
              className="mt-0.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-white"
              style={{ background: color, whiteSpace: "nowrap" }}
            >
              {thinking && (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              )}
              {name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
