import { prisma } from "@/lib/prisma"
import {
  type CanvasSnapshot,
  emptyCanvasSnapshot,
  sanitizeCanvasSnapshot,
  serializeCanvasSnapshot,
} from "@/lib/canvas/canvas-state"
import { canvasSnapshotObjectPath } from "@/lib/storage/paths"
import { getStorageProvider } from "@/lib/storage/storage-provider"

export async function readCanvasSnapshot(projectId: string): Promise<CanvasSnapshot | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasBlobUrl: true },
  })

  if (!project?.canvasBlobUrl) return null

  const canvas: unknown = await getStorageProvider()
    .readJsonObject(project.canvasBlobUrl)
    .catch(() => null)
  return canvas ? sanitizeCanvasSnapshot(canvas) : emptyCanvasSnapshot()
}

export async function writeCanvasSnapshot(
  projectId: string,
  snapshot: CanvasSnapshot
) {
  const canvas = serializeCanvasSnapshot(snapshot)
  const reference = await getStorageProvider().writeJsonObject(
    canvasSnapshotObjectPath(projectId),
    canvas,
    {
      contentType: "application/json",
    }
  )

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasBlobUrl: reference },
  })

  return { url: reference, reference, canvas }
}
