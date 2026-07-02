import { z } from "zod"
import { NODE_COLORS, NODE_SHAPES, SHAPE_DEFAULTS } from "@/types/canvas"
import type { CanvasEdge, CanvasNode, NodeShape } from "@/types/canvas"
import type { CanvasSnapshot } from "@/lib/canvas/canvas-state"
import { baseNodeData } from "@/lib/canvas/semantic-defaults"
import { createEdgeLabelItems, mirrorEdgeLabelData } from "@/lib/canvas/edge-labels"

const objectIdSchema = z.string().trim().min(1).max(120)
const labelSchema = z.string().trim().min(1).max(240)
const coordinateSchema = z.number().finite().min(-100000).max(100000)
const dimensionSchema = z.number().finite().positive().max(2000)
const colorIndexSchema = z.number().int().min(0).max(NODE_COLORS.length - 1)

const addNodeActionSchema = z.object({
  type: z.literal("addNode"),
  id: objectIdSchema,
  label: labelSchema,
  shape: z.enum(NODE_SHAPES).default("rectangle"),
  colorIndex: colorIndexSchema.default(0),
  x: coordinateSchema,
  y: coordinateSchema,
})

const moveNodeActionSchema = z.object({
  type: z.literal("moveNode"),
  id: objectIdSchema,
  x: coordinateSchema,
  y: coordinateSchema,
})

const resizeNodeActionSchema = z.object({
  type: z.literal("resizeNode"),
  id: objectIdSchema,
  width: dimensionSchema,
  height: dimensionSchema,
})

const updateNodeActionSchema = z.object({
  type: z.literal("updateNode"),
  id: objectIdSchema,
  label: labelSchema.optional(),
  shape: z.enum(NODE_SHAPES).optional(),
  colorIndex: colorIndexSchema.optional(),
})

const deleteNodeActionSchema = z.object({
  type: z.literal("deleteNode"),
  id: objectIdSchema,
})

const addEdgeActionSchema = z.object({
  type: z.literal("addEdge"),
  id: objectIdSchema,
  source: objectIdSchema,
  target: objectIdSchema,
  label: z.string().trim().max(240).optional(),
})

const deleteEdgeActionSchema = z.object({
  type: z.literal("deleteEdge"),
  id: objectIdSchema,
})

export const DesignActionSchema = z.discriminatedUnion("type", [
  addNodeActionSchema,
  moveNodeActionSchema,
  resizeNodeActionSchema,
  updateNodeActionSchema,
  deleteNodeActionSchema,
  addEdgeActionSchema,
  deleteEdgeActionSchema,
])

export const DesignProviderResultSchema = z.object({
  actions: z.array(DesignActionSchema).max(100),
  summary: z.string().trim().min(1).max(1000),
})

export type DesignAction = z.infer<typeof DesignActionSchema>
export type DesignProviderResult = z.infer<typeof DesignProviderResultSchema>

export function validateDesignProviderResult(value: unknown): DesignProviderResult {
  return DesignProviderResultSchema.parse(value)
}

function getNodeColor(colorIndex: number) {
  const idx = Math.min(Math.max(Math.round(colorIndex), 0), NODE_COLORS.length - 1)
  return NODE_COLORS[idx]
}

function createCanvasNode(action: Extract<DesignAction, { type: "addNode" }>): CanvasNode {
  const shape: NodeShape = action.shape
  const color = getNodeColor(action.colorIndex)
  const size = SHAPE_DEFAULTS[shape] ?? SHAPE_DEFAULTS.rectangle

  return {
    id: action.id,
    type: "canvasNode",
    position: { x: action.x, y: action.y },
    data: {
      ...baseNodeData(action.label),
      color: color.fill,
      textColor: color.text,
      shape,
    },
    width: size.width,
    height: size.height,
  }
}

function createCanvasEdge(action: Extract<DesignAction, { type: "addEdge" }>): CanvasEdge {
  const labelItems = createEdgeLabelItems(action.label ? [action.label] : [], [], `${action.id}-label`)

  return {
    id: action.id,
    type: "canvasEdge",
    source: action.source,
    target: action.target,
    sourceHandle: null,
    targetHandle: null,
    data: {
      semanticType: "unclassified",
      name: action.label ?? "",
      status: "draft",
      tags: [],
      sourceRefs: [],
      assumptions: [],
      decisionRefs: [],
      owner: null,
      ...mirrorEdgeLabelData(labelItems),
    },
    markerEnd: {
      type: "arrowclosed",
      color: "rgba(255,255,255,0.4)",
      width: 16,
      height: 16,
    },
  }
}

export function applyDesignActions(
  actions: DesignAction[],
  currentCanvas: CanvasSnapshot
): CanvasSnapshot {
  const nodes: CanvasNode[] = currentCanvas.nodes.map(
    (node) => ({ ...node, data: { ...node.data } }) as CanvasNode
  )
  const edges: CanvasEdge[] = currentCanvas.edges.map(
    (edge) => ({ ...edge, data: { ...(edge.data ?? {}) } }) as CanvasEdge
  )

  for (const action of actions) {
    switch (action.type) {
      case "addNode": {
        const node = createCanvasNode(action)
        const existingIndex = nodes.findIndex((existing) => existing.id === action.id)
        if (existingIndex >= 0) nodes[existingIndex] = node
        else nodes.push(node)
        break
      }

      case "moveNode": {
        const node = nodes.find((item) => item.id === action.id)
        if (node) node.position = { x: action.x, y: action.y }
        break
      }

      case "resizeNode": {
        const node = nodes.find((item) => item.id === action.id)
        if (node) {
          node.width = action.width
          node.height = action.height
        }
        break
      }

      case "updateNode": {
        const node = nodes.find((item) => item.id === action.id)
        if (node) {
          if (action.label !== undefined) node.data.label = action.label
          if (action.shape !== undefined) node.data.shape = action.shape
          if (action.colorIndex !== undefined) {
            const color = getNodeColor(action.colorIndex)
            node.data.color = color.fill
            node.data.textColor = color.text
          }
        }
        break
      }

      case "deleteNode": {
        const nodeIndex = nodes.findIndex((item) => item.id === action.id)
        if (nodeIndex >= 0) nodes.splice(nodeIndex, 1)

        for (let index = edges.length - 1; index >= 0; index--) {
          if (edges[index].source === action.id || edges[index].target === action.id) {
            edges.splice(index, 1)
          }
        }
        break
      }

      case "addEdge": {
        const edge = createCanvasEdge(action)
        const existingIndex = edges.findIndex((existing) => existing.id === action.id)
        if (existingIndex >= 0) edges[existingIndex] = edge
        else edges.push(edge)
        break
      }

      case "deleteEdge": {
        const index = edges.findIndex((item) => item.id === action.id)
        if (index >= 0) edges.splice(index, 1)
        break
      }
    }
  }

  return { nodes, edges }
}
