import "server-only"

import { prisma } from "@/lib/prisma"
import { generateSecureToken, hashToken } from "@/lib/auth/tokens"
import { hashPassword } from "@/lib/auth/passwords"

const REQUEST_COOLDOWN_MS = 60 * 1000
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000

export type TokenConsumeResult =
  | { ok: true; userId: string }
  | { ok: false; error: "invalid_or_expired" }

function tokenNotExpired(now = new Date()) {
  return {
    usedAt: null,
    expiresAt: { gt: now },
  }
}

function recentTokenWindow(now = new Date()) {
  return new Date(now.getTime() - REQUEST_COOLDOWN_MS)
}

export async function createEmailVerificationToken(userId: string) {
  const now = new Date()
  const recentToken = await prisma.emailVerificationToken.findFirst({
    where: {
      userId,
      usedAt: null,
      createdAt: { gte: recentTokenWindow(now) },
    },
    select: { id: true },
  })

  if (recentToken) {
    return { created: false as const, token: null, expiresAt: null }
  }

  const token = generateSecureToken()
  const expiresAt = new Date(now.getTime() + EMAIL_VERIFICATION_TTL_MS)

  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt,
      },
    }),
  ])

  return { created: true as const, token, expiresAt }
}

export async function consumeEmailVerificationToken(
  token: string
): Promise<TokenConsumeResult> {
  const now = new Date()
  const tokenHash = hashToken(token)
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  })

  if (!record || record.usedAt || record.expiresAt <= now) {
    return { ok: false, error: "invalid_or_expired" }
  }

  const consumed = await prisma.$transaction(async (tx) => {
    const updated = await tx.emailVerificationToken.updateMany({
      where: { id: record.id, ...tokenNotExpired(now) },
      data: { usedAt: now },
    })

    if (updated.count !== 1) return false

    await tx.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: now },
    })

    return true
  })

  return consumed
    ? { ok: true, userId: record.userId }
    : { ok: false, error: "invalid_or_expired" }
}

export async function createPasswordResetToken(userId: string) {
  const now = new Date()
  const recentToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId,
      usedAt: null,
      createdAt: { gte: recentTokenWindow(now) },
    },
    select: { id: true },
  })

  if (recentToken) {
    return { created: false as const, token: null, expiresAt: null }
  }

  const token = generateSecureToken()
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TTL_MS)

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt,
      },
    }),
  ])

  return { created: true as const, token, expiresAt }
}

export async function resetPasswordWithToken(input: {
  token: string
  newPassword: string
}): Promise<TokenConsumeResult> {
  const now = new Date()
  const tokenHash = hashToken(input.token)
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  })

  if (!record || record.usedAt || record.expiresAt <= now) {
    return { ok: false, error: "invalid_or_expired" }
  }

  const passwordHash = await hashPassword(input.newPassword)
  const consumed = await prisma.$transaction(async (tx) => {
    const updated = await tx.passwordResetToken.updateMany({
      where: { id: record.id, ...tokenNotExpired(now) },
      data: { usedAt: now },
    })

    if (updated.count !== 1) return false

    await tx.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: now },
    })

    await tx.passwordCredential.upsert({
      where: { userId: record.userId },
      update: { passwordHash },
      create: { userId: record.userId, passwordHash },
    })

    await tx.authSession.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: now },
    })

    return true
  })

  return consumed
    ? { ok: true, userId: record.userId }
    : { ok: false, error: "invalid_or_expired" }
}
