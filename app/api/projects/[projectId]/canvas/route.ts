import { getCurrentProjectIdentity, userHasProjectAccess } from "@/lib/project-access"
import { readCanvasSnapshot, writeCanvasSnapshot } from "@/lib/canvas/canvas-persistence"
import { sanitizeCanvasSnapshot } from "@/lib/canvas/canvas-state"
import type { NextRequest } from "next/server"

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">
) {
  const identity = await getCurrentProjectIdentity(_request)
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params
  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) return Response.json({ error: "Not found" }, { status: 404 })

  const canvas = await readCanvasSnapshot(projectId)
  return Response.json({ canvas })
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/canvas">
) {
  const identity = await getCurrentProjectIdentity(request)
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params
  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) return Response.json({ error: "Not found" }, { status: 404 })

  const body: unknown = await request.json().catch(() => ({}))
  const { url } = await writeCanvasSnapshot(projectId, sanitizeCanvasSnapshot(body))

  return Response.json({ url })
}
