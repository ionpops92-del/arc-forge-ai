import { z } from "zod"
import { applyDesignActions } from "@/lib/ai/design/design-actions"
import { getAiProvider } from "@/lib/ai/providers/provider-factory"
import { readCanvasSnapshot, writeCanvasSnapshot } from "@/lib/canvas/canvas-persistence"
import { publishRealtimeRoomEvent } from "@/lib/realtime/server-publish"
import { AI_ASSISTANT_NAME } from "@/lib/branding"
import type { JsonValue } from "@/lib/realtime/types"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

const AI_USER_ID = "arc-forge-ai"

export const DesignAgentPayloadSchema = z.object({
  prompt: z.string().trim().min(1),
  roomId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
})

export type DesignAgentPayload = z.infer<typeof DesignAgentPayloadSchema>

function toRealtimePayload(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue
}

async function publishStatus(projectId: string, roomId: string, text: string, status: string) {
  await publishRealtimeRoomEvent({
    projectId,
    roomId,
    userId: AI_USER_ID,
    event: {
      type: "ai.status",
      payload: { text, status },
    },
  }).catch(() => {})
}

async function publishCanvas(projectId: string, roomId: string, nodes: CanvasNode[], edges: CanvasEdge[]) {
  await publishRealtimeRoomEvent({
    projectId,
    roomId,
    userId: AI_USER_ID,
    event: {
      type: "canvas.snapshot",
      payload: toRealtimePayload({ nodes, edges }),
    },
  }).catch(() => {})
}

export async function runDesignAgentTask(payload: DesignAgentPayload) {
  const projectId = payload.roomId

  await publishStatus(
    projectId,
    payload.roomId,
    `${AI_ASSISTANT_NAME} is analyzing your request...`,
    "start"
  )

  try {
    const currentCanvas = (await readCanvasSnapshot(projectId)) ?? { nodes: [], edges: [] }
    const result = await getAiProvider().generateDesignActions({
      prompt: payload.prompt,
      projectId,
      roomId: payload.roomId,
      currentCanvas,
    })

    const addCount = result.actions.filter((action) => action.type === "addNode").length
    await publishStatus(
      projectId,
      payload.roomId,
      `Placing ${addCount} node${addCount !== 1 ? "s" : ""} on the canvas...`,
      "thinking"
    )

    const nextCanvas = applyDesignActions(result.actions, currentCanvas)

    await writeCanvasSnapshot(projectId, nextCanvas)
    await publishCanvas(projectId, payload.roomId, nextCanvas.nodes, nextCanvas.edges)
    await publishStatus(projectId, payload.roomId, result.summary, "complete")

    return { success: true, actionsApplied: result.actions.length, summary: result.summary }
  } catch (error) {
    await publishStatus(
      projectId,
      payload.roomId,
      `${AI_ASSISTANT_NAME} encountered an error. Please try again.`,
      "error"
    )
    throw error
  }
}
