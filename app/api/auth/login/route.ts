import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { normalizeEmail } from "@/lib/auth/email"
import { verifyPassword } from "@/lib/auth/passwords"
import {
  createSession,
  getRequestMetadata,
} from "@/lib/auth/session-service"
import { toSafeUser } from "@/lib/auth/current-user"

const LoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
})

const GENERIC_LOGIN_ERROR = "Invalid email or password"

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => ({}))
  const parsed = LoginSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 })
  }

  const email = normalizeEmail(parsed.data.email)

  // TODO: add durable per-IP/email rate limiting when shared cache infra is available.
  const user = await prisma.user.findUnique({
    where: { email },
    include: { passwordCredential: true },
  })

  if (!user?.passwordCredential) {
    return Response.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 })
  }

  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user.passwordCredential.passwordHash
  )

  if (!passwordMatches) {
    return Response.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 })
  }

  await createSession(user.id, getRequestMetadata(request))

  return Response.json({ user: toSafeUser(user) })
}
