import {
  buildSpecContext,
  type GenerateSpecMarkdownInput,
} from "@/lib/ai/spec/spec-provider-contract"
import {
  validateDesignProviderResult,
  type DesignAction,
} from "@/lib/ai/design/design-actions"
import type {
  GenerateDesignActionsInput,
  GenerateDesignActionsResult,
} from "@/lib/ai/design/design-provider-contract"
import type { AiProvider } from "@/lib/ai/providers/types"

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36)

  return slug || "architecture"
}

function getPromptTopic(prompt: string) {
  return prompt
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 4)
    .join(" ") || "system"
}

function uniqueId(baseId: string, existingIds: Set<string>) {
  let id = baseId
  let index = 2

  while (existingIds.has(id)) {
    id = `${baseId}-${index}`
    index++
  }

  existingIds.add(id)
  return id
}

function formatEdgeLabels(edge: GenerateSpecMarkdownInput["edges"][number]) {
  const labels =
    edge.data?.labels?.map((label) => label.trim()).filter(Boolean) ?? []
  if (labels.length > 0) return ` (${labels.join("; ")})`

  return edge.data?.label ? ` (${edge.data.label})` : ""
}

export class MockAiProvider implements AiProvider {
  readonly name = "mock" as const

  async generateDesignActions(
    input: GenerateDesignActionsInput
  ): Promise<GenerateDesignActionsResult> {
    const topic = getPromptTopic(input.prompt)
    const slug = slugify(topic)
    const existingIds = new Set([
      ...input.currentCanvas.nodes.map((node) => node.id),
      ...input.currentCanvas.edges.map((edge) => edge.id),
    ])

    const clientId = uniqueId(`${slug}-client`, existingIds)
    const serviceId = uniqueId(`${slug}-service`, existingIds)
    const dataId = uniqueId(`${slug}-data-store`, existingIds)
    const clientToServiceId = uniqueId(`edge-${clientId}-${serviceId}`, existingIds)
    const serviceToDataId = uniqueId(`edge-${serviceId}-${dataId}`, existingIds)

    const rowOffset = Math.floor(input.currentCanvas.nodes.length / 3) * 180
    const actions: DesignAction[] = [
      {
        type: "addNode",
        id: clientId,
        label: `${topic} Client`,
        shape: "circle",
        colorIndex: 5,
        x: 100,
        y: 80 + rowOffset,
      },
      {
        type: "addNode",
        id: serviceId,
        label: `${topic} Service`,
        shape: "rectangle",
        colorIndex: 1,
        x: 360,
        y: 90 + rowOffset,
      },
      {
        type: "addNode",
        id: dataId,
        label: `${topic} Data Store`,
        shape: "cylinder",
        colorIndex: 7,
        x: 620,
        y: 80 + rowOffset,
      },
      {
        type: "addEdge",
        id: clientToServiceId,
        source: clientId,
        target: serviceId,
        label: "requests",
      },
      {
        type: "addEdge",
        id: serviceToDataId,
        source: serviceId,
        target: dataId,
        label: "persists",
      },
    ]

    return validateDesignProviderResult({
      actions,
      summary: `Mock AI generated a deterministic ${topic} architecture with a client, service, and data store.`,
    })
  }

  async generateSpecMarkdown(input: GenerateSpecMarkdownInput): Promise<string> {
    const context = buildSpecContext(input.nodes, input.edges, input.chatHistory)
    const nodeCount = input.nodes.length
    const edgeCount = input.edges.length
    const primaryNodes = input.nodes
      .slice(0, 8)
      .map((node) => `- ${node.data?.label ?? node.id}`)
      .join("\n")

    return [
      "# Technical Specification",
      "",
      "## Overview",
      `This deterministic mock specification summarizes project \`${input.projectId}\` for local development and smoke testing without external AI keys.`,
      "",
      "## Architecture",
      `The current canvas contains ${nodeCount} node${nodeCount === 1 ? "" : "s"} and ${edgeCount} connection${edgeCount === 1 ? "" : "s"}.`,
      "",
      "## Components",
      primaryNodes || "- No canvas components were provided.",
      "",
      "## Data Flow",
      input.edges.length
        ? input.edges
            .slice(0, 12)
            .map((edge) => `- ${edge.source} -> ${edge.target}${formatEdgeLabels(edge)}`)
            .join("\n")
        : "- No connections were provided.",
      "",
      "## Conversation Context",
      input.chatHistory.length
        ? input.chatHistory.map((message) => `- **${message.role}**: ${message.content}`).join("\n")
        : "- No chat history was provided.",
      "",
      "## Provider Context",
      "```text",
      context,
      "```",
      "",
    ].join("\n")
  }
}
