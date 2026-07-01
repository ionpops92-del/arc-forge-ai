import { prisma } from "@/lib/prisma"
import { userHasProjectAccess } from "@/lib/project-access"
import { getStorageProvider } from "@/lib/storage/storage-provider"
import type { ProjectAccessIdentity } from "@/lib/project-access"

type ProjectSpecMarkdownResult =
  | { ok: true; content: string }
  | { ok: false; error: "Not found" | "File not found" }

export async function readProjectSpecMarkdown(
  projectId: string,
  specId: string,
  identity: ProjectAccessIdentity
): Promise<ProjectSpecMarkdownResult> {
  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) return { ok: false, error: "Not found" }

  const spec = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
    select: { filePath: true },
  })
  if (!spec) return { ok: false, error: "Not found" }

  try {
    const content = await getStorageProvider().readTextObject(spec.filePath)
    if (content === null) return { ok: false, error: "File not found" }

    return { ok: true, content }
  } catch {
    return { ok: false, error: "File not found" }
  }
}

export function specNotFoundResponse(error: "Not found" | "File not found") {
  return Response.json({ error }, { status: 404 })
}

export function specMarkdownResponse(
  content: string,
  options?: { downloadFilename?: string }
) {
  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      ...(options?.downloadFilename
        ? {
            "Content-Disposition": `attachment; filename="${options.downloadFilename}"`,
          }
        : {}),
    },
  })
}
