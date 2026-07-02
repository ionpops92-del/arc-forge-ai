import { prisma } from "@/lib/prisma"
import {
  getAccessibleProject,
  type ProjectIdentity,
} from "@/lib/project-access"
import {
  createRealtimeRoomToken,
  type CreatedRealtimeToken,
} from "@/lib/realtime/token"
import type { RealtimeTokenPayload } from "@/lib/realtime/types"
import { GraphIdError, parseRealtimeRoomId } from "@/lib/canvas/graph-ids"

const MAX_PROJECT_ID_LENGTH = 100

export class RealtimeAccessError extends Error {
  constructor(
    message: string,
    public status: 400 | 401 | 403 | 404
  ) {
    super(message)
  }
}

export interface RealtimeRoomAccessInput {
  identity: ProjectIdentity
  projectId: string
  roomId: string
}

function normalizeRoomId(value: string) {
  return value.trim()
}

function parseRoomOrThrow(roomId: string) {
  try {
    return parseRealtimeRoomId(roomId)
  } catch (error) {
    if (error instanceof GraphIdError) {
      throw new RealtimeAccessError(error.message, 400)
    }

    throw error
  }
}

export async function authorizeRealtimeRoomAccess({
  identity,
  projectId,
  roomId,
}: RealtimeRoomAccessInput) {
  if (!identity.userId) {
    throw new RealtimeAccessError("Unauthorized", 401)
  }

  const normalizedProjectId = normalizeRoomId(projectId)
  const normalizedRoomId = normalizeRoomId(roomId)
  const parsedRoom = parseRoomOrThrow(normalizedRoomId)

  if (
    !normalizedProjectId ||
    normalizedProjectId.length > MAX_PROJECT_ID_LENGTH ||
    parsedRoom.projectId.length > MAX_PROJECT_ID_LENGTH
  ) {
    throw new RealtimeAccessError("Invalid realtime room", 400)
  }

  if (parsedRoom.projectId !== normalizedProjectId) {
    throw new RealtimeAccessError("Realtime room must match project", 400)
  }

  const project = await getAccessibleProject(normalizedProjectId, identity)

  if (!project) {
    throw new RealtimeAccessError("Forbidden", 403)
  }

  return project
}

export async function createAuthorizedRealtimeToken(
  input: RealtimeRoomAccessInput
): Promise<CreatedRealtimeToken> {
  await authorizeRealtimeRoomAccess(input)

  if (!input.identity.userId) {
    throw new RealtimeAccessError("Unauthorized", 401)
  }

  return createRealtimeRoomToken({
    userId: input.identity.userId,
    projectId: normalizeRoomId(input.projectId),
    roomId: normalizeRoomId(input.roomId),
  })
}

export async function verifyRealtimeTokenProjectAccess(
  payload: RealtimeTokenPayload
) {
  let parsedRoom: ReturnType<typeof parseRealtimeRoomId>
  try {
    parsedRoom = parseRealtimeRoomId(payload.roomId)
  } catch {
    return false
  }

  if (parsedRoom.projectId !== payload.projectId) return false

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true },
  })

  if (!user) return false

  const project = await getAccessibleProject(payload.projectId, {
    userId: user.id,
    primaryEmailAddress: user.email,
  })

  return Boolean(project)
}
