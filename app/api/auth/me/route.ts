import { getCurrentUser } from "@/lib/auth/current-user"

export async function GET(request: Request) {
  const user = await getCurrentUser(request)

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  return Response.json({ user })
}
