import { revokeCurrentSession } from "@/lib/auth/session-service"

export async function POST(request: Request) {
  await revokeCurrentSession(request)

  return Response.json({ ok: true })
}
