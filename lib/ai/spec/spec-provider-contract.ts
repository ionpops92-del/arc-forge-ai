import { z } from "zod"

export const AiSpecChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
})

const nodeDataSchema = z
  .object({
    label: z.string().optional(),
    shape: z.string().optional(),
    color: z.string().optional(),
  })
  .passthrough()

export const AiSpecNodeSchema = z
  .object({
    id: z.string(),
    type: z.string().optional(),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    data: nodeDataSchema.optional(),
  })
  .passthrough()

export const AiSpecEdgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    data: z.object({ label: z.string().optional() }).passthrough().optional(),
  })
  .passthrough()

export interface GenerateSpecMarkdownInput {
  projectId: string
  roomId: string
  chatHistory: AiSpecChatMessage[]
  nodes: AiSpecNode[]
  edges: AiSpecEdge[]
}

export type AiSpecChatMessage = z.infer<typeof AiSpecChatMessageSchema>
export type AiSpecNode = z.infer<typeof AiSpecNodeSchema>
export type AiSpecEdge = z.infer<typeof AiSpecEdgeSchema>

export const SPEC_SYSTEM_PROMPT = `You are Ghost AI, a senior technical architect. Generate a comprehensive Markdown technical specification document based on the provided architecture canvas and conversation context.

Structure the spec as follows:
1. **Overview** - What the system does and its key goals
2. **Architecture** - High-level architecture description based on the canvas
3. **Components** - Each node/service with its role and responsibilities
4. **Data Flow** - How data and requests move through the system
5. **Technology Choices** - Suggested technologies that fit the architecture
6. **Key Considerations** - Scalability, security, and performance notes

Write in clear, professional technical language. Use Markdown headers, bullet points, and code blocks where appropriate. Be specific and actionable.`

export function buildSpecContext(
  nodes: AiSpecNode[],
  edges: AiSpecEdge[],
  chatHistory: AiSpecChatMessage[]
) {
  const nodeLines = nodes
    .map((node) => {
      const label = node.data?.label ?? node.id
      const shape = node.data?.shape ?? "rectangle"
      const pos = node.position
        ? ` at (${Math.round(node.position.x)}, ${Math.round(node.position.y)})`
        : ""
      return `- ${label} (id: ${node.id}, shape: ${shape}${pos})`
    })
    .join("\n")

  const edgeLines = edges
    .map((edge) => {
      const label = edge.data?.label ? ` [${edge.data.label}]` : ""
      return `- ${edge.source} -> ${edge.target}${label}`
    })
    .join("\n")

  const chatLines = chatHistory
    .map((message) => `${message.role === "user" ? "User" : "Ghost AI"}: ${message.content}`)
    .join("\n")

  return [
    "## Canvas Nodes",
    nodeLines || "(none)",
    "",
    "## Canvas Connections",
    edgeLines || "(none)",
    "",
    "## Chat History",
    chatLines || "(none)",
  ].join("\n")
}
