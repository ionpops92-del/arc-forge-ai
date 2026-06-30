import { z } from "zod"
import { AiTaskType } from "@/app/generated/prisma/client"
import { createAiTaskRun } from "@/lib/ai-tasks/task-service"
import { getCurrentProjectIdentity, getAccessibleProject } from "@/lib/project-access"

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
})

const NodeDataSchema = z
  .object({
    label: z.string().optional(),
    shape: z.string().optional(),
    color: z.string().optional(),
  })
  .passthrough()

const NodeSchema = z
  .object({
    id: z.string(),
    type: z.string().optional(),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    data: NodeDataSchema.optional(),
  })
  .passthrough()

const EdgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    data: z.object({ label: z.string().optional() }).passthrough().optional(),
  })
  .passthrough()

const SpecRequestSchema = z.object({
  roomId: z.string().trim().min(1),
  chatHistory: z.array(ChatMessageSchema).default([]),
  nodes: z.array(NodeSchema).default([]),
  edges: z.array(EdgeSchema).default([]),
})

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity(request)
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  const parsed = SpecRequestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: "Missing roomId" }, { status: 400 })
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data
  const project = await getAccessibleProject(roomId, identity)
  if (!project) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const run = await createAiTaskRun({
    type: AiTaskType.generate_spec,
    projectId: project.id,
    userId: identity.userId,
    payloadJson: {
      projectId: project.id,
      roomId: project.id,
      chatHistory,
      nodes,
      edges,
    },
  })

  return Response.json({ runId: run.id }, { status: 201 })
}
