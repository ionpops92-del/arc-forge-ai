import { z } from "zod"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import { NODE_COLORS, NODE_SHAPES, SHAPE_DEFAULTS } from "@/types/canvas"

export interface CanvasSnapshot {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

const positionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
})

const nodeDataSchema = z
  .object({
    label: z.string().max(240).default(""),
    color: z.string().max(80).optional(),
    textColor: z.string().max(80).optional(),
    shape: z.enum(NODE_SHAPES).optional(),
  })
  .passthrough()

const nodeSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    type: z.literal("canvasNode").default("canvasNode"),
    position: positionSchema.default({ x: 0, y: 0 }),
    data: nodeDataSchema.default({ label: "" }),
    width: z.number().finite().positive().max(2000).optional(),
    height: z.number().finite().positive().max(2000).optional(),
    selected: z.boolean().optional(),
    dragging: z.boolean().optional(),
  })
  .passthrough()

const edgeDataSchema = z
  .object({
    label: z.string().max(240).optional(),
  })
  .passthrough()

const edgeSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    source: z.string().trim().min(1).max(120),
    target: z.string().trim().min(1).max(120),
    sourceHandle: z.string().max(120).nullable().optional(),
    targetHandle: z.string().max(120).nullable().optional(),
    type: z.literal("canvasEdge").default("canvasEdge"),
    data: edgeDataSchema.default({}),
  })
  .passthrough()

const canvasSnapshotSchema = z.object({
  nodes: z.array(nodeSchema).max(500).default([]),
  edges: z.array(edgeSchema).max(1000).default([]),
})

export function emptyCanvasSnapshot(): CanvasSnapshot {
  return { nodes: [], edges: [] }
}

export function sanitizeCanvasSnapshot(value: unknown): CanvasSnapshot {
  const parsed = canvasSnapshotSchema.safeParse(value)
  if (!parsed.success) return emptyCanvasSnapshot()

  return {
    nodes: parsed.data.nodes.map((node) => {
      const shape = node.data.shape ?? "rectangle"
      const size = SHAPE_DEFAULTS[shape] ?? SHAPE_DEFAULTS.rectangle
      return {
        ...node,
        id: node.id.trim(),
        type: "canvasNode",
        data: {
          ...node.data,
          label: node.data.label ?? "",
          color: node.data.color ?? NODE_COLORS[0].fill,
          textColor: node.data.textColor ?? NODE_COLORS[0].text,
          shape,
        },
        width: node.width ?? size.width,
        height: node.height ?? size.height,
        selected: false,
        dragging: false,
      } as CanvasNode
    }),
    edges: parsed.data.edges.map((edge) => ({
      ...edge,
      id: edge.id.trim(),
      source: edge.source.trim(),
      target: edge.target.trim(),
      sourceHandle: edge.sourceHandle ?? null,
      targetHandle: edge.targetHandle ?? null,
      type: "canvasEdge",
      data: {
        ...edge.data,
        label: edge.data.label ?? "",
      },
      markerEnd: {
        type: "arrowclosed",
        color: "rgba(255,255,255,0.4)",
        width: 16,
        height: 16,
      },
      selected: false,
    })) as CanvasEdge[],
  }
}

export function serializeCanvasSnapshot(snapshot: CanvasSnapshot) {
  return sanitizeCanvasSnapshot(snapshot)
}
