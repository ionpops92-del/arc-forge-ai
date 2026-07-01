import { RuntimeConfigError } from "@/lib/config/runtime-env"
import { createEmailVerificationToken } from "@/lib/auth/account-tokens"
import {
  canExposeDevAuthLink,
  sendVerificationEmail,
} from "@/lib/auth/account-emails"
import { getCurrentUser } from "@/lib/auth/current-user"
import { assertEmailDeliveryConfigured } from "@/lib/email/email-provider"

export async function POST(request: Request) {
  const user = await getCurrentUser(request)

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user.emailVerifiedAt) {
    return Response.json({ ok: true })
  }

  try {
    assertEmailDeliveryConfigured()
  } catch (error) {
    if (error instanceof RuntimeConfigError) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    throw error
  }

  const token = await createEmailVerificationToken(user.id)
  if (!token.created || !token.token) {
    return Response.json({ ok: true })
  }

  try {
    const email = await sendVerificationEmail({
      to: user.email,
      token: token.token,
    })

    return Response.json({
      ok: true,
      ...(canExposeDevAuthLink()
        ? { devOnlyVerificationLink: email.link }
        : {}),
    })
  } catch (error) {
    if (error instanceof RuntimeConfigError) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    throw error
  }
}
