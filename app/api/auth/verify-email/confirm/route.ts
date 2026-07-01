import { z } from "zod"
import { consumeEmailVerificationToken } from "@/lib/auth/account-tokens"

const ConfirmEmailVerificationSchema = z.object({
  token: z.string().trim().min(20).max(512),
})

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => ({}))
  const parsed = ConfirmEmailVerificationSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid or expired verification link" },
      { status: 400 }
    )
  }

  const result = await consumeEmailVerificationToken(parsed.data.token)
  if (!result.ok) {
    return Response.json(
      { error: "Invalid or expired verification link" },
      { status: 400 }
    )
  }

  return Response.json({ ok: true })
}
