import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentProjectIdentity } from "@/lib/project-access"

const CreateProjectSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  name: z.string().trim().max(120).optional(),
})

export async function GET(request: Request) {
  const identity = await getCurrentProjectIdentity(request)
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await prisma.project.findMany({
    where: { ownerId: identity.userId },
    orderBy: { createdAt: "desc" },
  })

  return Response.json({ projects })
}

export async function POST(request: Request) {
  const identity = await getCurrentProjectIdentity(request)
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  const parsed = CreateProjectSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: "Invalid project details" }, { status: 400 })
  }

  const name = parsed.data.name?.trim() || "Untitled Project"
  const id = parsed.data.id?.trim() || undefined

  const project = await prisma.project.create({
    data: { ...(id ? { id } : {}), ownerId: identity.userId, name },
  })

  return Response.json({ project }, { status: 201 })
}
