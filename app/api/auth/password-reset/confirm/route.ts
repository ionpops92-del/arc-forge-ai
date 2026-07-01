import { z } from "zod"
import { resetPasswordWithToken } from "@/lib/auth/account-tokens"
import { validatePasswordStrength } from "@/lib/auth/passwords"

const PasswordResetConfirmSchema = z.object({
  token: z.string().trim().min(20).max(512),
  newPassword: z.string().min(1).max(256),
})

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => ({}))
  const parsed = PasswordResetConfirmSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: "Invalid password reset request" }, { status: 400 })
  }

  const passwordErrors = validatePasswordStrength(parsed.data.newPassword)
  if (passwordErrors.length > 0) {
    return Response.json({ error: passwordErrors[0] }, { status: 400 })
  }

  const result = await resetPasswordWithToken({
    token: parsed.data.token,
    newPassword: parsed.data.newPassword,
  })

  if (!result.ok) {
    return Response.json(
      { error: "Invalid or expired password reset link" },
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}
