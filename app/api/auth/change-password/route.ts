import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/passwords"
import { getSessionFromRequest } from "@/lib/auth/session-service"

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(1).max(256),
})

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request)

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => ({}))
  const parsed = ChangePasswordSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: "Invalid password details" }, { status: 400 })
  }

  const passwordErrors = validatePasswordStrength(parsed.data.newPassword)
  if (passwordErrors.length > 0) {
    return Response.json({ error: passwordErrors[0] }, { status: 400 })
  }

  const credential = await prisma.passwordCredential.findUnique({
    where: { userId: session.userId },
    select: { passwordHash: true },
  })

  if (!credential) {
    return Response.json({ error: "Password sign-in is not available" }, { status: 400 })
  }

  const passwordMatches = await verifyPassword(
    parsed.data.currentPassword,
    credential.passwordHash
  )

  if (!passwordMatches) {
    return Response.json({ error: "Current password is incorrect" }, { status: 400 })
  }

  const passwordHash = await hashPassword(parsed.data.newPassword)
  const now = new Date()

  await prisma.$transaction([
    prisma.passwordCredential.update({
      where: { userId: session.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.updateMany({
      where: { userId: session.userId, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.authSession.updateMany({
      where: {
        userId: session.userId,
        revokedAt: null,
        id: { not: session.id },
      },
      data: { revokedAt: now },
    }),
  ])

  return Response.json({ ok: true })
}
