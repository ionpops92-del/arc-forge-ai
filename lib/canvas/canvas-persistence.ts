import { get, put } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import {
  type CanvasSnapshot,
  emptyCanvasSnapshot,
  sanitizeCanvasSnapshot,
  serializeCanvasSnapshot,
} from "@/lib/canvas/canvas-state"

function requireBlobToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Missing Vercel Blob read/write token.")
  }
}

export async function readCanvasSnapshot(projectId: string): Promise<CanvasSnapshot | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasBlobUrl: true },
  })

  if (!project?.canvasBlobUrl) return null

  requireBlobToken()
  const result = await get(project.canvasBlobUrl, { access: "private" })
  if (!result || result.statusCode !== 200 || !result.stream) return null

  const canvas: unknown = await new Response(result.stream).json().catch(() => null)
  return canvas ? sanitizeCanvasSnapshot(canvas) : emptyCanvasSnapshot()
}

export async function writeCanvasSnapshot(
  projectId: string,
  snapshot: CanvasSnapshot
) {
  requireBlobToken()
  const canvas = serializeCanvasSnapshot(snapshot)
  const blob = await put(`canvas/${projectId}.json`, JSON.stringify(canvas), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  })

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasBlobUrl: blob.url },
  })

  return { url: blob.url, canvas }
}
