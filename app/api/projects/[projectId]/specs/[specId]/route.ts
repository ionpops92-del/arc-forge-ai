import { getCurrentProjectIdentity } from "@/lib/project-access"
import {
  readProjectSpecMarkdown,
  specMarkdownResponse,
  specNotFoundResponse,
} from "@/lib/specs/spec-response"
import type { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ projectId: string; specId: string }> }
) {
  const identity = await getCurrentProjectIdentity(request)
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId, specId } = await ctx.params
  const spec = await readProjectSpecMarkdown(projectId, specId, identity)

  if (!spec.ok) return specNotFoundResponse(spec.error)

  return specMarkdownResponse(spec.content)
}
