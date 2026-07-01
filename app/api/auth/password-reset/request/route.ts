import { z } from "zod"
import { RuntimeConfigError } from "@/lib/config/runtime-env"
import { createPasswordResetToken } from "@/lib/auth/account-tokens"
import {
  canExposeDevAuthLink,
  sendPasswordResetEmail,
} from "@/lib/auth/account-emails"
import { normalizeEmail } from "@/lib/auth/email"
import { assertEmailDeliveryConfigured } from "@/lib/email/email-provider"
import { prisma } from "@/lib/prisma"

const GENERIC_RESET_RESPONSE = {
  ok: true,
  message: "If that email is registered, a password reset link has been sent.",
}

const PasswordResetRequestSchema = z.object({
  email: z.string().email().max(254),
})

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => ({}))
  const parsed = PasswordResetRequestSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(GENERIC_RESET_RESPONSE)
  }

  const email = normalizeEmail(parsed.data.email)

  try {
    assertEmailDeliveryConfigured()
  } catch (error) {
    if (error instanceof RuntimeConfigError) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    throw error
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  })

  if (!user) {
    return Response.json(GENERIC_RESET_RESPONSE)
  }

  const token = await createPasswordResetToken(user.id)
  if (!token.created || !token.token) {
    return Response.json(GENERIC_RESET_RESPONSE)
  }

  try {
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      token: token.token,
    })

    return Response.json({
      ...GENERIC_RESET_RESPONSE,
      ...(canExposeDevAuthLink()
        ? { devOnlyResetLink: emailResult.link }
        : {}),
    })
  } catch (error) {
    if (error instanceof RuntimeConfigError) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    throw error
  }
}
