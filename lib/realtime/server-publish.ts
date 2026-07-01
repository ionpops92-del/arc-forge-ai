import type { RealtimeRoomEvent } from "@/lib/realtime/types"
import {
  getInternalRealtimePublishUrl,
  getInternalRealtimeServiceSecret,
} from "@/lib/realtime/realtime-url"

export interface PublishRealtimeRoomEventInput {
  projectId: string
  roomId: string
  userId?: string | null
  event: RealtimeRoomEvent
}

export async function publishRealtimeRoomEvent(
  input: PublishRealtimeRoomEventInput
) {
  const response = await fetch(getInternalRealtimePublishUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-realtime-secret": getInternalRealtimeServiceSecret(),
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error("Failed to publish realtime room event")
  }
}
