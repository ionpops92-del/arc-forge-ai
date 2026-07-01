import { randomUUID } from "node:crypto"
import { z } from "zod"
import { getAiProvider } from "@/lib/ai/providers/provider-factory"
import {
  AiSpecChatMessageSchema,
  AiSpecEdgeSchema,
  AiSpecNodeSchema,
} from "@/lib/ai/spec/spec-provider-contract"
import { prisma } from "@/lib/prisma"
import { specMarkdownObjectPath } from "@/lib/storage/paths"
import { getStorageProvider } from "@/lib/storage/storage-provider"

export const GenerateSpecPayloadSchema = z.object({
  projectId: z.string(),
  roomId: z.string(),
  chatHistory: z.array(AiSpecChatMessageSchema),
  nodes: z.array(AiSpecNodeSchema),
  edges: z.array(AiSpecEdgeSchema),
})

export type GenerateSpecPayload = z.infer<typeof GenerateSpecPayloadSchema>

export async function runGenerateSpecTask(payload: GenerateSpecPayload) {
  const spec = await getAiProvider().generateSpecMarkdown({
    projectId: payload.projectId,
    roomId: payload.roomId,
    chatHistory: payload.chatHistory,
    nodes: payload.nodes,
    edges: payload.edges,
  })

  const specId = randomUUID()
  const filePath = await getStorageProvider().writeTextObject(
    specMarkdownObjectPath(payload.projectId, specId),
    spec,
    { contentType: "text/markdown; charset=utf-8" }
  )

  const record = await prisma.projectSpec.create({
    data: {
      id: specId,
      projectId: payload.projectId,
      filePath,
    },
  })

  return { specId: record.id, specLength: spec.length }
}
