import { z } from "zod"
import { AiTaskType } from "@/app/generated/prisma/client"
import { createAiTaskRun } from "@/lib/ai-tasks/task-service"
import { graphIdFromSearchParam, parseRealtimeRoomId } from "@/lib/canvas/graph-ids"
import { getAccessibleProject, getCurrentProjectIdentity } from "@/lib/project-access"

const DesignRequestSchema = z.object({
  prompt: z.string().trim().min(1),
  roomId: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
  graphId: z.string().trim().min(1).optional(),
})

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity(request)
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  const parsed = DesignRequestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { prompt, roomId, projectId } = parsed.data
  const project = await getAccessibleProject(projectId, identity)

  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  let parsedRoom: ReturnType<typeof parseRealtimeRoomId>
  let graphId: string

  try {
    parsedRoom = parseRealtimeRoomId(roomId)
    graphId = graphIdFromSearchParam(parsed.data.graphId ?? null)
  } catch {
    return Response.json({ error: "Invalid roomId" }, { status: 400 })
  }

  if (parsedRoom.projectId !== project.id || parsedRoom.graphId !== graphId) {
    return Response.json({ error: "Invalid roomId" }, { status: 400 })
  }

  const run = await createAiTaskRun({
    type: AiTaskType.design_agent,
    projectId: project.id,
    userId: identity.userId,
    payloadJson: {
      prompt,
      roomId,
      projectId: project.id,
      graphId,
      userId: identity.userId,
    },
  })

  return Response.json({ runId: run.id }, { status: 201 })
}
