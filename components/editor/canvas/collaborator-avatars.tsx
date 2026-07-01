"use client"

import { UserMenu } from "@/components/auth/user-menu"
import { useRealtimeRoom } from "@/hooks/use-realtime-room"

const MAX_VISIBLE = 5
const FALLBACK_COLLABORATOR_COLOR = "var(--color-text-muted)"

export function CollaboratorAvatars() {
  const { presence, connectionId } = useRealtimeRoom()
  const collaborators = presence.filter((o) => o.connectionId !== connectionId)
  const visible = collaborators.slice(0, MAX_VISIBLE)
  const overflow = collaborators.length - MAX_VISIBLE

  return (
    <div className="absolute right-3 top-3 z-40 flex items-center gap-2">
      {visible.length > 0 && (
        <>
          <div className="flex items-center -space-x-2">
            {visible.map((other) => (
              <AvatarChip
                key={other.connectionId}
                name={
                  typeof other.presence?.name === "string"
                    ? other.presence.name
                    : "Anonymous"
                }
                color={
                  typeof other.presence?.color === "string"
                    ? other.presence.color
                    : FALLBACK_COLLABORATOR_COLOR
                }
              />
            ))}
            {overflow > 0 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg-base bg-bg-elevated text-xs font-medium text-text-primary ring-1 ring-white/20">
                +{overflow}
              </div>
            )}
          </div>
          <div className="h-5 w-px bg-border-subtle" />
        </>
      )}
      <UserMenu compact />
    </div>
  )
}

function AvatarChip({
  name,
  color,
}: {
  name: string
  color: string
}) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-bg-base text-xs font-semibold text-white ring-1 ring-white/20"
      style={{ background: color }}
      title={name}
    >
      {initials}
    </div>
  )
}
