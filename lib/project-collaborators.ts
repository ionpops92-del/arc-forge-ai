import { prisma } from "@/lib/prisma"
import { getAccessibleProject, type ProjectIdentity } from "@/lib/project-access"
import { isValidEmail, normalizeEmail } from "@/lib/auth/email"

interface UserLookup {
  id: string
  email: string
  name: string | null
}

export interface ProjectSharePerson {
  email: string | null
  displayName: string
  avatarUrl: string | null
  role: "owner" | "collaborator"
}

export interface ProjectShareDetails {
  projectId: string
  projectName: string
  canManage: boolean
  owner: ProjectSharePerson
  collaborators: ProjectSharePerson[]
}

export function normalizeCollaboratorEmail(email: string) {
  return normalizeEmail(email)
}

export function isValidCollaboratorEmail(email: string) {
  return isValidEmail(email)
}

function getUserDisplayName(user: UserLookup | null, fallback?: string | null) {
  return user?.name || user?.email || fallback || "Unknown user"
}

const MAX_COLLABORATOR_LOOKUP = 500

async function getUsersByEmail(emails: string[]) {
  if (emails.length === 0) {
    return new Map<string, UserLookup>()
  }

  const limited = emails.slice(0, MAX_COLLABORATOR_LOOKUP)
  const users = await prisma.user.findMany({
    where: { email: { in: limited } },
    select: { id: true, email: true, name: true },
  })

  return new Map(users.map((user) => [normalizeEmail(user.email), user]))
}

async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  })
}

export async function getProjectShareDetails(
  projectId: string,
  identity: ProjectIdentity
): Promise<ProjectShareDetails | null> {
  const accessibleProject = await getAccessibleProject(projectId, identity)

  if (!accessibleProject) {
    return null
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      ownerId: true,
      collaborators: {
        select: {
          email: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })

  if (!project) {
    return null
  }

  const collaboratorEmails = project.collaborators.map((collaborator) =>
    normalizeCollaboratorEmail(collaborator.email)
  )

  const [ownerUser, collaboratorUsersByEmail] = await Promise.all([
    getUserById(project.ownerId),
    getUsersByEmail(collaboratorEmails),
  ])

  const ownerEmail =
    ownerUser?.email ??
    (identity.userId === project.ownerId ? identity.primaryEmailAddress : null)

  return {
    projectId: project.id,
    projectName: project.name,
    canManage: identity.userId === project.ownerId,
    owner: {
      email: ownerEmail,
      displayName: getUserDisplayName(ownerUser, ownerEmail ?? "Project owner"),
      avatarUrl: null,
      role: "owner",
    },
    collaborators: collaboratorEmails.map((email) => {
      const user = collaboratorUsersByEmail.get(email) ?? null

      return {
        email,
        displayName: getUserDisplayName(user, email),
        avatarUrl: null,
        role: "collaborator" as const,
      }
    }),
  }
}
