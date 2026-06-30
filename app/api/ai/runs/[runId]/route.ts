import { getAiTaskRunStatusForProjectMember } from "@/lib/ai-tasks/task-service"
import { getCurrentProjectIdentity } from "@/lib/project-access"
import type { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ runId: string }> }
) {
  const identity = await getCurrentProjectIdentity(request)
  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { runId } = await ctx.params
  const run = await getAiTaskRunStatusForProjectMember(runId, identity)

  if (!run) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json({ run })
}
