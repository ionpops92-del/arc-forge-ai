import { prisma } from "@/lib/prisma"
import { getCurrentProjectIdentity, userHasProjectAccess } from "@/lib/project-access"
import { getStorageProvider } from "@/lib/storage/storage-provider"
import type { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ projectId: string; specPath: string[] }> }
) {
  const identity = await getCurrentProjectIdentity(request)
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId, specPath } = await ctx.params
  const [specId, action, extra] = specPath
  const isDownload = action === "download"

  if (!specId || extra || (action && !isDownload)) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) return Response.json({ error: "Not found" }, { status: 404 })

  const spec = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
  })
  if (!spec) return Response.json({ error: "Not found" }, { status: 404 })

  const content = await getStorageProvider().readTextObject(spec.filePath).catch(() => null)
  if (content === null) {
    return Response.json({ error: "File not found" }, { status: 404 })
  }

  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      ...(isDownload
        ? { "Content-Disposition": `attachment; filename="spec-${specId}.md"` }
        : {}),
    },
  })
}
