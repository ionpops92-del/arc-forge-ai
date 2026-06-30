import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { clearAuthSessionCookie, setAuthSessionCookie } from "@/lib/auth/cookies"
import {
  AUTH_SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/constants"
import { generateSecureToken, hashToken } from "@/lib/auth/tokens"

export interface SessionRequestMetadata {
  userAgent?: string | null
  ipAddress?: string | null
}

function getRequestCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=")
    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="))
    }
  }

  return null
}

export function getRequestMetadata(request: Request): SessionRequestMetadata {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null

  return {
    userAgent: request.headers.get("user-agent"),
    ipAddress,
  }
}

async function getSessionToken(request?: Request) {
  if (request) {
    return getRequestCookie(request, AUTH_SESSION_COOKIE_NAME)
  }

  const cookieStore = await cookies()
  return cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null
}

export async function createSession(
  userId: string,
  metadata: SessionRequestMetadata = {}
) {
  const token = generateSecureToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000)

  const session = await prisma.authSession.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: metadata.userAgent?.slice(0, 512) ?? null,
      ipAddress: metadata.ipAddress?.slice(0, 128) ?? null,
    },
  })

  await setAuthSessionCookie(token, expiresAt)

  return { session, token, expiresAt }
}

export async function getSessionFromRequest(request?: Request) {
  const token = await getSessionToken(request)
  if (!token) return null

  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null
  }

  return session
}

export async function getCurrentSession() {
  return getSessionFromRequest()
}

export async function revokeSession(sessionId: string) {
  await prisma.authSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.authSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

export async function revokeCurrentSession(request?: Request) {
  const session = await getSessionFromRequest(request)

  if (session) {
    await revokeSession(session.id)
  }

  await clearAuthSessionCookie()
}

export async function cleanupExpiredSessions() {
  await prisma.authSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
}
