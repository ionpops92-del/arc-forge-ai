import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, tool } from "ai"
import { z } from "zod"
import { getGoogleAiApiKey } from "@/lib/ai/google-api-key"
import { readCanvasSnapshot, writeCanvasSnapshot } from "@/lib/canvas/canvas-persistence"
import { publishRealtimeRoomEvent } from "@/lib/realtime/server-publish"
import type { JsonValue } from "@/lib/realtime/types"
import { NODE_COLORS, NODE_SHAPES, SHAPE_DEFAULTS } from "@/types/canvas"
import type { CanvasEdge, CanvasNode, NodeShape } from "@/types/canvas"

const AI_USER_ID = "ghost-ai"

const COLOR_NAMES = [
  "neutral",
  "blue",
  "purple",
  "orange",
  "red",
  "pink",
  "green",
  "teal",
]

export const DesignAgentPayloadSchema = z.object({
  prompt: z.string().trim().min(1),
  roomId: z.string().trim().min(1),
  userId: z.string().trim().min(1),
})

export type DesignAgentPayload = z.infer<typeof DesignAgentPayloadSchema>

function buildSystemPrompt(): string {
  const colorGuide = NODE_COLORS.map(
    (c, i) => `  ${i} (${COLOR_NAMES[i]}): fill=${c.fill} text=${c.text}`
  ).join("\n")

  return `You are Ghost AI, an expert system architect that generates technical architecture diagrams on a collaborative canvas.

ALLOWED SHAPES (use exact value):
- rectangle  -> services, APIs, microservices, components
- cylinder   -> databases, storage, caches
- hexagon    -> external systems, third-party services, boundaries
- circle     -> events, triggers, endpoints, user entry-points
- diamond    -> decision gateways, conditionals
- pill       -> processes, workflows, jobs

COLOR PALETTE (colorIndex 0-7):
${colorGuide}
Recommended mapping:
- 1 (blue)   -> APIs, services, servers
- 7 (teal)   -> databases, storage
- 3 (orange) -> message queues, brokers, async flows
- 6 (green)  -> success paths, healthy services, CDN
- 2 (purple) -> auth, security, identity
- 5 (pink)   -> user-facing UI, clients
- 0 (neutral)-> generic / unclassified

LAYOUT RULES:
- Start top-left at approximately x=100, y=80
- Horizontal gap between sibling nodes: 240-280px
- Vertical gap between rows: 160-200px
- Group related nodes in horizontal rows; use vertical rows for sequential flows
- Edge IDs must be unique, e.g. "edge-api-auth", "edge-1"
- Node IDs must be unique short slugs, e.g. "api-gateway", "user-db", "auth-service"

GENERATION RULES:
- Create 5-12 nodes; do not overcrowd
- Add edges to show data/request flow
- Prefer clear left-to-right or top-to-bottom flows
- When the canvas already has nodes, extend or modify instead of replacing unless asked

INSTRUCTIONS:
- Call addNode for each node you want to place on the canvas
- Call addEdge for each connection between nodes
- Call finalizeDesign last with a 1-2 sentence summary of what was designed`
}

function clampColor(idx: number): number {
  return Math.min(Math.max(Math.round(idx ?? 0), 0), NODE_COLORS.length - 1)
}

const canvasTools = {
  addNode: tool({
    description: "Add a new node to the canvas",
    inputSchema: z.object({
      id: z.string().describe('Unique slug ID e.g. "api-gateway", "user-db"'),
      label: z.string().describe("Display label for the node"),
      shape: z.enum(NODE_SHAPES).describe("Node shape"),
      colorIndex: z.number().int().min(0).max(7).describe("Color palette index 0-7"),
      x: z.number().describe("X position in pixels"),
      y: z.number().describe("Y position in pixels"),
    }),
  }),
  moveNode: tool({
    description: "Move an existing node to a new position",
    inputSchema: z.object({
      id: z.string().describe("ID of the node to move"),
      x: z.number(),
      y: z.number(),
    }),
  }),
  resizeNode: tool({
    description: "Resize an existing node",
    inputSchema: z.object({
      id: z.string(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
  }),
  updateNodeData: tool({
    description: "Update the label, shape, or color of an existing node",
    inputSchema: z.object({
      id: z.string(),
      label: z.string().optional(),
      shape: z.enum(NODE_SHAPES).optional(),
      colorIndex: z.number().int().min(0).max(7).optional(),
    }),
  }),
  deleteNode: tool({
    description: "Delete a node from the canvas",
    inputSchema: z.object({
      id: z.string(),
    }),
  }),
  addEdge: tool({
    description: "Add a directed edge between two nodes",
    inputSchema: z.object({
      id: z.string().describe('Unique edge ID e.g. "edge-api-db"'),
      source: z.string().describe("Source node ID"),
      target: z.string().describe("Target node ID"),
      label: z.string().optional().describe("Optional edge label"),
    }),
  }),
  deleteEdge: tool({
    description: "Delete an edge from the canvas",
    inputSchema: z.object({
      id: z.string(),
    }),
  }),
  finalizeDesign: tool({
    description: "Complete the design and provide a summary; call this last",
    inputSchema: z.object({
      summary: z.string().describe("1-2 sentence description of the designed architecture"),
    }),
  }),
}

type ToolName = keyof typeof canvasTools
type ToolCall = { toolName: ToolName; input: Record<string, unknown> }

function toRealtimePayload(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue
}

async function publishStatus(projectId: string, roomId: string, text: string, status: string) {
  await publishRealtimeRoomEvent({
    projectId,
    roomId,
    userId: AI_USER_ID,
    event: {
      type: "ai.status",
      payload: { text, status },
    },
  }).catch(() => {})
}

async function publishCanvas(projectId: string, roomId: string, nodes: CanvasNode[], edges: CanvasEdge[]) {
  await publishRealtimeRoomEvent({
    projectId,
    roomId,
    userId: AI_USER_ID,
    event: {
      type: "canvas.snapshot",
      payload: toRealtimePayload({ nodes, edges }),
    },
  }).catch(() => {})
}

export async function runDesignAgentTask(payload: DesignAgentPayload) {
  const googleApiKey = getGoogleAiApiKey()
  const google = createGoogleGenerativeAI({ apiKey: googleApiKey })
  const projectId = payload.roomId

  await publishStatus(projectId, payload.roomId, "Ghost AI is analyzing your request...", "start")

  try {
    const currentCanvas = (await readCanvasSnapshot(projectId)) ?? { nodes: [], edges: [] }
    const canvasContext =
      currentCanvas.nodes.length > 0
        ? `Canvas has ${currentCanvas.nodes.length} existing node(s). Current state:\n${JSON.stringify(currentCanvas, null, 2)}\nExtend or modify based on the request; only clear if explicitly asked.`
        : "The canvas is currently empty; create a fresh design."

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: buildSystemPrompt(),
      prompt: `User request: ${payload.prompt}\n\n${canvasContext}`,
      tools: canvasTools,
      toolChoice: "required",
    })

    const toolCalls = result.steps.flatMap((s) => s.toolCalls) as ToolCall[]
    const actionCalls = toolCalls.filter((c) => c.toolName !== "finalizeDesign")
    const finalizeCall = toolCalls.find((c) => c.toolName === "finalizeDesign")
    const summary =
      (finalizeCall?.input as { summary?: string } | undefined)?.summary ??
      "Design applied to canvas."

    const addCount = actionCalls.filter((c) => c.toolName === "addNode").length
    await publishStatus(
      projectId,
      payload.roomId,
      `Placing ${addCount} node${addCount !== 1 ? "s" : ""} on the canvas...`,
      "thinking"
    )

    const nextCanvas = {
      nodes: [...currentCanvas.nodes],
      edges: [...currentCanvas.edges],
    }

    for (const call of actionCalls) {
      applyToolCall(call, nextCanvas.nodes, nextCanvas.edges)
    }

    await writeCanvasSnapshot(projectId, nextCanvas)
    await publishCanvas(projectId, payload.roomId, nextCanvas.nodes, nextCanvas.edges)
    await publishStatus(projectId, payload.roomId, summary, "complete")

    return { success: true, actionsApplied: actionCalls.length, summary }
  } catch (error) {
    await publishStatus(
      projectId,
      payload.roomId,
      "Ghost AI encountered an error. Please try again.",
      "error"
    )
    throw error
  }
}

function applyToolCall(
  call: ToolCall,
  nodes: CanvasNode[],
  edges: CanvasEdge[]
) {
  const input = call.input

  switch (call.toolName) {
    case "addNode": {
      const { id, label, shape, colorIndex, x, y } = input as {
        id: string
        label: string
        shape: NodeShape
        colorIndex: number
        x: number
        y: number
      }
      const ci = clampColor(colorIndex)
      const color = NODE_COLORS[ci]
      const size = SHAPE_DEFAULTS[shape] ?? SHAPE_DEFAULTS.rectangle
      const node: CanvasNode = {
        id,
        type: "canvasNode",
        position: { x, y },
        data: { label, color: color.fill, textColor: color.text, shape },
        width: size.width,
        height: size.height,
      }

      const existingIndex = nodes.findIndex((existing) => existing.id === id)
      if (existingIndex >= 0) nodes[existingIndex] = node
      else nodes.push(node)
      break
    }

    case "moveNode": {
      const { id, x, y } = input as { id: string; x: number; y: number }
      const node = nodes.find((item) => item.id === id)
      if (node) node.position = { x, y }
      break
    }

    case "resizeNode": {
      const { id, width, height } = input as {
        id: string
        width: number
        height: number
      }
      const node = nodes.find((item) => item.id === id)
      if (node) {
        node.width = width
        node.height = height
      }
      break
    }

    case "updateNodeData": {
      const { id, label, shape, colorIndex } = input as {
        id: string
        label?: string
        shape?: NodeShape
        colorIndex?: number
      }
      const node = nodes.find((item) => item.id === id)
      if (node) {
        if (label !== undefined) node.data.label = label
        if (shape !== undefined) node.data.shape = shape
        if (colorIndex !== undefined) {
          const ci = clampColor(colorIndex)
          node.data.color = NODE_COLORS[ci].fill
          node.data.textColor = NODE_COLORS[ci].text
        }
      }
      break
    }

    case "deleteNode": {
      const { id } = input as { id: string }
      const nodeIndex = nodes.findIndex((item) => item.id === id)
      if (nodeIndex >= 0) nodes.splice(nodeIndex, 1)

      for (let index = edges.length - 1; index >= 0; index--) {
        if (edges[index].source === id || edges[index].target === id) {
          edges.splice(index, 1)
        }
      }
      break
    }

    case "addEdge": {
      const { id, source, target, label } = input as {
        id: string
        source: string
        target: string
        label?: string
      }
      const edge: CanvasEdge = {
        id,
        type: "canvasEdge",
        source,
        target,
        sourceHandle: null,
        targetHandle: null,
        data: { label: label ?? "" },
        markerEnd: {
          type: "arrowclosed",
          color: "rgba(255,255,255,0.4)",
          width: 16,
          height: 16,
        },
      }
      const existingIndex = edges.findIndex((existing) => existing.id === id)
      if (existingIndex >= 0) edges[existingIndex] = edge
      else edges.push(edge)
      break
    }

    case "deleteEdge": {
      const { id } = input as { id: string }
      const index = edges.findIndex((item) => item.id === id)
      if (index >= 0) edges.splice(index, 1)
      break
    }
  }
}
