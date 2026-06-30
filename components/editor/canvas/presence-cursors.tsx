"use client"

import { useOthers } from "@liveblocks/react"
import { useViewport } from "@xyflow/react"
import { Loader2 } from "lucide-react"

export function PresenceCursors() {
  const others = useOthers()
  const { x: viewportX, y: viewportY, zoom } = useViewport()

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {others.map((other) => {
        const cursor = other.presence.cursor
        if (!cursor) return null

        const x = cursor.x * zoom + viewportX
        const y = cursor.y * zoom + viewportY
        const color = other.info?.color ?? "#888888"
        const name = other.info?.name ?? "Anonymous"

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
              {other.presence.thinking && (
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
