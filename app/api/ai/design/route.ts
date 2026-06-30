import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { tasks } from "@trigger.dev/sdk/v3"
import { getAccessibleProject, getCurrentProjectIdentity } from "@/lib/project-access"
import type { designAgent } from "@/trigger/design-agent"

const DesignRequestSchema = z.object({
  prompt: z.string().trim().min(1),
  roomId: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
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

  if (roomId !== project.id) {
    return Response.json({ error: "Invalid roomId" }, { status: 400 })
  }

  const handle = await tasks.trigger<typeof designAgent>("design-agent", {
    prompt,
    roomId: project.id,
    userId: identity.userId,
  })

  await prisma.taskRun.create({
    data: { runId: handle.id, projectId: project.id, userId: identity.userId },
  })

  return Response.json({ runId: handle.id }, { status: 201 })
}
