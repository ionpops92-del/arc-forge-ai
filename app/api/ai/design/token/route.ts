import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth as triggerAuth } from "@trigger.dev/sdk/v3"
import { requireUserId } from "@/lib/auth/current-user"

const TokenRequestSchema = z.object({
  runId: z.string().trim().min(1),
})

export async function POST(request: Request) {
  const userId = await requireUserId(request).catch(() => null)
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body: unknown = await request.json().catch(() => ({}))
  const parsed = TokenRequestSchema.safeParse(body)

  if (!parsed.success) return Response.json({ error: "Missing runId" }, { status: 400 })

  const { runId } = parsed.data
  const taskRun = await prisma.taskRun.findUnique({ where: { runId } })
  if (!taskRun || taskRun.userId !== userId) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const token = await triggerAuth.createPublicToken({
    scopes: { read: { runs: [runId] } },
  })

  return Response.json({ token })
}
