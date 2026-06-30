import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { normalizeEmail } from "@/lib/auth/email"
import {
  hashPassword,
  validatePasswordStrength,
} from "@/lib/auth/passwords"
import {
  createSession,
  getRequestMetadata,
} from "@/lib/auth/session-service"
import { toSafeUser } from "@/lib/auth/current-user"

const RegisterSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
  name: z.string().trim().max(100).optional(),
})

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => ({}))
  const parsed = RegisterSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: "Invalid registration details" }, { status: 400 })
  }

  const email = normalizeEmail(parsed.data.email)
  const passwordErrors = validatePasswordStrength(parsed.data.password)

  if (passwordErrors.length > 0) {
    return Response.json({ error: passwordErrors[0] }, { status: 400 })
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (existingUser) {
    return Response.json({ error: "Email is already registered" }, { status: 409 })
  }

  const passwordHash = await hashPassword(parsed.data.password)

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email,
        name: parsed.data.name?.trim() || null,
      },
    })

    await tx.passwordCredential.create({
      data: {
        userId: createdUser.id,
        passwordHash,
      },
    })

    return createdUser
  })

  await createSession(user.id, getRequestMetadata(request))

  return Response.json({ user: toSafeUser(user) }, { status: 201 })
}
