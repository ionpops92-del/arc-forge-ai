import { z } from "zod"
import { getCurrentProjectIdentity, userHasProjectAccess } from "@/lib/project-access"
import {
  canvasGraphExists,
  readCanvasDoc,
  writeCanvasDoc,
} from "@/lib/canvas/canvas-persistence"
import {
  ROOT_GRAPH_ID,
  appendGraphIdSuffix,
  createServiceGraphIdBase,
  subcanvasScopeForNode,
} from "@/lib/canvas/graph-ids"
import { createCanvasDocV1 } from "@/lib/canvas/canvas-doc"
import { emptyCanvasSnapshot } from "@/lib/canvas/canvas-state"
import type { CanvasNode } from "@/types/canvas"
import type { NextRequest } from "next/server"

const CreateSubcanvasSchema = z.object({
  parentGraphId: z.literal(ROOT_GRAPH_ID).default(ROOT_GRAPH_ID),
  parentNodeId: z.string().trim().min(1).max(120),
})

async function uniqueGraphId(projectId: string, parentNode: CanvasNode) {
  const baseGraphId = createServiceGraphIdBase(parentNode)
  for (let index = 0; index < 20; index += 1) {
    const candidate =
      index === 0 ? baseGraphId : appendGraphIdSuffix(baseGraphId, String(index + 1))
    const exists = await canvasGraphExists(projectId, candidate)
    if (!exists) return candidate
  }

  return appendGraphIdSuffix(baseGraphId, Math.random().toString(36).slice(2, 8))
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/projects/[projectId]/subcanvas">
) {
  const identity = await getCurrentProjectIdentity(request)
  if (!identity.userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await ctx.params
  const hasAccess = await userHasProjectAccess(projectId, identity)
  if (!hasAccess) return Response.json({ error: "Not found" }, { status: 404 })

  const body: unknown = await request.json().catch(() => ({}))
  const parsed = CreateSubcanvasSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: "Invalid subcanvas request" }, { status: 400 })
  }

  const rootDoc =
    (await readCanvasDoc(projectId, parsed.data.parentGraphId)) ??
    createCanvasDocV1(emptyCanvasSnapshot(), { projectId })
  const parentNode = rootDoc.nodes.find((node) => node.id === parsed.data.parentNodeId)
  if (!parentNode) {
    return Response.json({ error: "Parent node not found" }, { status: 404 })
  }

  const scopeKind = subcanvasScopeForNode(parentNode.data.semanticType)
  if (scopeKind !== "service-internal") {
    return Response.json({ error: "Only service drill-down is available" }, { status: 400 })
  }

  if (parentNode.data.subcanvasRef?.graphId) {
    const existingRef = parentNode.data.subcanvasRef
    return Response.json({
      subcanvasRef: existingRef,
      parentGraph: rootDoc,
      childGraph: await readCanvasDoc(projectId, existingRef.graphId),
    })
  }

  const now = new Date().toISOString()
  const graphId = await uniqueGraphId(projectId, parentNode)
  const title = parentNode.data.name?.trim() || parentNode.data.label?.trim() || "Service design"
  const subcanvasRef = {
    graphId,
    scopeKind,
    title,
    createdAt: now,
    updatedAt: now,
  }
  const nextRootDoc = {
    ...rootDoc,
    nodes: rootDoc.nodes.map((node) =>
      node.id === parentNode.id
        ? {
            ...node,
            data: {
              ...node.data,
              subcanvasRef,
            },
          }
        : node
    ),
  }
  const childGraph = createCanvasDocV1(emptyCanvasSnapshot(), {
    projectId,
    graphId,
    parentNodeId: parentNode.id,
    scopeKind,
    title,
  })

  await writeCanvasDoc(projectId, childGraph, {
    graphId,
    parentNodeId: parentNode.id,
    scopeKind,
    title,
  })
  const { doc: parentGraph } = await writeCanvasDoc(projectId, nextRootDoc, {
    graphId: ROOT_GRAPH_ID,
    scopeKind: "system-root",
    title: rootDoc.title,
  })

  return Response.json(
    {
      subcanvasRef,
      parentGraph,
      childGraph,
    },
    { status: 201 }
  )
}
