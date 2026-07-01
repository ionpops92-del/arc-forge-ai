import { getSessionFromRequest } from "@/lib/auth/session-service"

export interface SafeUser {
  id: string
  email: string
  name: string | null
  emailVerifiedAt: Date | null
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

interface UserRecord {
  id: string
  email: string
  name: string | null
  emailVerifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
  passwordHash?: never
}

export class AuthenticationError extends Error {
  status = 401

  constructor(message = "Unauthorized") {
    super(message)
  }
}

export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerifiedAt: user.emailVerifiedAt,
    emailVerified: Boolean(user.emailVerifiedAt),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export async function getCurrentUser(request?: Request) {
  const session = await getSessionFromRequest(request)

  return session ? toSafeUser(session.user) : null
}

export async function requireUser(request?: Request) {
  const user = await getCurrentUser(request)

  if (!user) {
    throw new AuthenticationError()
  }

  return user
}

export async function requireUserId(request?: Request) {
  const user = await requireUser(request)
  return user.id
}
