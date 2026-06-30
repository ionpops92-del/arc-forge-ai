import { z } from "zod"
import {
  getProjectShareDetails,
  isValidCollaboratorEmail,
  normalizeCollaboratorEmail,
} from "@/lib/project-collaborators"
import {
  getCurrentProjectIdentity,
  projectAccessErrorResponse,
  requireProjectOwner,
} from "@/lib/project-access"
import { prisma } from "@/lib/prisma"

const CollaboratorSchema = z.object({
  email: z.string().email().max(254),
})

function getEmailFromBody(body: unknown) {
  const parsed = CollaboratorSchema.safeParse(body)
  if (!parsed.success) {
    return null
  }

  return normalizeCollaboratorEmail(parsed.data.email)
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/collaborators">
) {
  const identity = await getCurrentProjectIdentity(request)

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await ctx.params
  const share = await getProjectShareDetails(projectId, identity)

  if (!share) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json({ share })
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/collaborators">
) {
  const identity = await getCurrentProjectIdentity(request)

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await ctx.params

  try {
    await requireProjectOwner(projectId, identity)
  } catch (error) {
    return projectAccessErrorResponse(error)
  }

  const body: unknown = await request.json().catch(() => ({}))
  const email = getEmailFromBody(body)

  if (!email || !isValidCollaboratorEmail(email)) {
    return Response.json({ error: "A valid email is required" }, { status: 400 })
  }

  if (identity.primaryEmailAddress && email === identity.primaryEmailAddress) {
    return Response.json(
      { error: "The project owner already has access" },
      { status: 400 }
    )
  }

  const existingCollaborator = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: {
        projectId,
        email,
      },
    },
  })

  if (existingCollaborator) {
    return Response.json(
      { error: "That collaborator already has access" },
      { status: 409 }
    )
  }

  await prisma.projectCollaborator.create({
    data: {
      projectId,
      email,
    },
  })

  return Response.json({ ok: true }, { status: 201 })
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/collaborators">
) {
  const identity = await getCurrentProjectIdentity(request)

  if (!identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = await ctx.params

  try {
    await requireProjectOwner(projectId, identity)
  } catch (error) {
    return projectAccessErrorResponse(error)
  }

  const body: unknown = await request.json().catch(() => ({}))
  const email = getEmailFromBody(body)

  if (!email || !isValidCollaboratorEmail(email)) {
    return Response.json({ error: "A valid email is required" }, { status: 400 })
  }

  const existingCollaborator = await prisma.projectCollaborator.findUnique({
    where: {
      projectId_email: {
        projectId,
        email,
      },
    },
  })

  if (!existingCollaborator) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.projectCollaborator.delete({
    where: {
      projectId_email: {
        projectId,
        email,
      },
    },
  })

  return new Response(null, { status: 204 })
}
