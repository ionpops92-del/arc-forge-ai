import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth/current-user"

export interface ProjectAccessIdentity {
  userId: string | null
  primaryEmailAddress: string | null
}

export interface ProjectIdentity extends ProjectAccessIdentity {
  displayName: string | null
}

export class ProjectAccessError extends Error {
  constructor(
    message: string,
    public status: 401 | 403 | 404
  ) {
    super(message)
  }
}

export function projectAccessErrorResponse(error: unknown) {
  if (error instanceof ProjectAccessError) {
    return Response.json({ error: error.message }, { status: error.status })
  }

  throw error
}

export async function getCurrentProjectIdentity(
  request?: Request
): Promise<ProjectIdentity> {
  const user = await getCurrentUser(request)

  if (!user) {
    return {
      userId: null,
      primaryEmailAddress: null,
      displayName: null,
    }
  }

  return {
    userId: user.id,
    primaryEmailAddress: user.email,
    displayName: user.name ?? user.email,
  }
}

export async function getAccessibleProject(
  projectId: string,
  identity: ProjectAccessIdentity
) {
  if (!identity.userId) return null

  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: identity.primaryEmailAddress
        ? [
            { ownerId: identity.userId },
            {
              collaborators: {
                some: {
                  email: {
                    equals: identity.primaryEmailAddress,
                    mode: "insensitive",
                  },
                },
              },
            },
          ]
        : [{ ownerId: identity.userId }],
    },
  })
}

export async function userHasProjectAccess(
  projectId: string,
  identity: ProjectAccessIdentity
) {
  const project = await getAccessibleProject(projectId, identity)
  return Boolean(project)
}

export async function requireProjectAccess(
  projectId: string,
  identity: ProjectAccessIdentity
) {
  if (!identity.userId) {
    throw new ProjectAccessError("Unauthorized", 401)
  }

  const project = await getAccessibleProject(projectId, identity)

  if (!project) {
    throw new ProjectAccessError("Not found", 404)
  }

  return project
}

export async function requireProjectOwner(
  projectId: string,
  identity: ProjectAccessIdentity
) {
  if (!identity.userId) {
    throw new ProjectAccessError("Unauthorized", 401)
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })

  if (!project) {
    throw new ProjectAccessError("Not found", 404)
  }

  if (project.ownerId !== identity.userId) {
    throw new ProjectAccessError("Forbidden", 403)
  }

  return project
}
