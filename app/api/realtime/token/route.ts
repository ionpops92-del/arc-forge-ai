import { z } from "zod"
import {
  RuntimeConfigError,
  assertSecureBrowserRequest,
} from "@/lib/config/runtime-env"
import { getCurrentProjectIdentity } from "@/lib/project-access"
import {
  createAuthorizedRealtimeToken,
  RealtimeAccessError,
} from "@/lib/realtime/access"

const RealtimeTokenRequestSchema = z.object({
  projectId: z.string().trim().min(1).max(100),
  roomId: z.string().trim().min(1).max(100),
})

export async function POST(request: Request) {
  try {
    assertSecureBrowserRequest(request)
  } catch (error) {
    if (error instanceof RuntimeConfigError) {
      return Response.json({ error: error.message }, { status: 403 })
    }

    throw error
  }

  const identity = await getCurrentProjectIdentity(request)

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => ({}))
  const parsed = RealtimeTokenRequestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: "Invalid realtime room" }, { status: 400 })
  }

  try {
    const token = await createAuthorizedRealtimeToken({
      identity,
      projectId: parsed.data.projectId,
      roomId: parsed.data.roomId,
    })

    return Response.json({
      ...token,
      projectId: parsed.data.projectId,
      roomId: parsed.data.roomId,
    })
  } catch (error) {
    if (error instanceof RealtimeAccessError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    throw error
  }
}
