import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  getCurrentProjectIdentity,
  projectAccessErrorResponse,
  requireProjectOwner,
} from "@/lib/project-access"
import type { NextRequest } from "next/server"

const RenameProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
})

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]">
) {
  const identity = await getCurrentProjectIdentity(request)
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params

  try {
    await requireProjectOwner(projectId, identity)
  } catch (error) {
    return projectAccessErrorResponse(error)
  }

  const body: unknown = await request.json().catch(() => ({}))
  const parsed = RenameProjectSchema.safeParse(body)

  if (!parsed.success) return Response.json({ error: "name is required" }, { status: 400 })

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { name: parsed.data.name },
  })

  return Response.json({ project: updated })
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]">
) {
  const identity = await getCurrentProjectIdentity(_request)
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params

  try {
    await requireProjectOwner(projectId, identity)
  } catch (error) {
    return projectAccessErrorResponse(error)
  }

  await prisma.project.delete({ where: { id: projectId } })

  return new Response(null, { status: 204 })
}
