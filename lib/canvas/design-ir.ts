import type {
  CanvasEdge,
  CanvasEdgeData,
  CanvasNode,
  CanvasNodeData,
  SemanticEdgeType,
  SemanticNodeType,
} from "@/types/canvas"
import { DESIGN_IR_VERSION, isSemanticEdgeType, isSemanticNodeType } from "@/types/canvas"
import type { CanvasDocV1 } from "@/lib/canvas/canvas-doc"
import { createCanvasDocV1, normalizeCanvasDocV1 } from "@/lib/canvas/canvas-doc"
import {
  type CanvasSnapshot,
  sanitizeCanvasSnapshot,
} from "@/lib/canvas/canvas-state"
import {
  looksLikeRawSecretValue,
  shouldStripSecretField,
} from "@/lib/canvas/secret-guards"

export const DESIGN_IR_SCHEMA_URL =
  "https://arcforge.dev/schemas/design-ir.v1.json" as const

export interface DesignIrProject {
  id: string
  name: string
  tenantModel: "owner-scoped-now-workspace-compatible-later"
  defaultRuntime: "node-typescript"
  defaultDatabase: "postgresql"
  defaultOrm: "prisma"
}

export interface DesignIrScope {
  rootGraphId: string
  compiledGraphIds: string[]
}

export interface DesignIrNode {
  id: string
  name: string
  semanticType: SemanticNodeType
  description: string
  status: string
  tags: string[]
  metadata: Record<string, unknown>
}

export interface DesignIrRelation {
  id: string
  source: string
  target: string
  semanticType: SemanticEdgeType
  label: string
  labels: string[]
  metadata: Record<string, unknown>
}

export interface DesignIrDecision {
  id: string
  sourceId: string
}

export interface DesignIrV1 {
  $schema: typeof DESIGN_IR_SCHEMA_URL
  irVersion: typeof DESIGN_IR_VERSION
  project: DesignIrProject
  scope: DesignIrScope
  decisions: DesignIrDecision[]
  services: DesignIrNode[]
  apis: DesignIrNode[]
  dataModels: DesignIrNode[]
  policies: DesignIrNode[]
  assumptions: string[]
  sourceRefs: string[]
  relations: DesignIrRelation[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isCanvasDoc(value: CanvasSnapshot | CanvasDocV1): value is CanvasDocV1 {
  return "$schema" in value && "docVersion" in value
}

function cleanExportValue(key: string, value: unknown): unknown {
  if (shouldStripSecretField(key, value)) return undefined

  if (typeof value === "string") {
    return looksLikeRawSecretValue(value) ? "[redacted-secret]" : value
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => cleanExportValue(key, item))
      .filter((item) => item !== undefined)
  }

  if (isRecord(value)) {
    const output: Record<string, unknown> = {}
    for (const [childKey, childValue] of Object.entries(value)) {
      const clean = cleanExportValue(childKey, childValue)
      if (clean !== undefined) output[childKey] = clean
    }
    return output
  }

  return value
}

function exportMetadata(data: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {}
  const omitted = new Set(["color", "textColor", "shape"])

  for (const [key, value] of Object.entries(data)) {
    if (omitted.has(key)) continue
    const clean = cleanExportValue(key, value)
    if (clean !== undefined) output[key] = clean
  }

  return output
}

function nodeName(node: CanvasNode): string {
  const name = node.data.name?.trim()
  if (name) return name
  const label = node.data.label?.trim()
  return label || node.id
}

function toIrNode(node: CanvasNode): DesignIrNode {
  const semanticType = isSemanticNodeType(node.data.semanticType)
    ? node.data.semanticType
    : "unclassified"

  return {
    id: node.id,
    name: nodeName(node),
    semanticType,
    description: node.data.description?.trim() ?? "",
    status: node.data.status ?? "draft",
    tags: node.data.tags ?? [],
    metadata: exportMetadata(node.data),
  }
}

function relationLabel(edge: CanvasEdge): string {
  return edge.data?.label?.trim() ?? ""
}

function toIrRelation(edge: CanvasEdge): DesignIrRelation {
  const data: CanvasEdgeData = edge.data ?? {}
  const semanticType = isSemanticEdgeType(data.semanticType)
    ? data.semanticType
    : "unclassified"

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    semanticType,
    label: relationLabel(edge),
    labels: data.labels ?? [],
    metadata: exportMetadata(data),
  }
}

function collectStrings(nodes: CanvasNode[], edges: CanvasEdge[], field: keyof CanvasNodeData) {
  const values = new Set<string>()
  for (const item of [...nodes, ...edges]) {
    const raw = item.data?.[field]
    if (!Array.isArray(raw)) continue
    for (const value of raw) {
      if (typeof value === "string" && value.trim()) values.add(value.trim())
    }
  }
  return [...values].sort((a, b) => a.localeCompare(b))
}

function collectDecisions(nodes: CanvasNode[], edges: CanvasEdge[]): DesignIrDecision[] {
  const decisions: DesignIrDecision[] = []
  for (const item of [...nodes, ...edges]) {
    const refs = item.data?.decisionRefs ?? []
    for (const ref of refs) {
      if (ref.trim()) decisions.push({ id: ref.trim(), sourceId: item.id })
    }
  }

  return decisions.sort((a, b) =>
    `${a.id}:${a.sourceId}`.localeCompare(`${b.id}:${b.sourceId}`)
  )
}

function sortNodes(nodes: DesignIrNode[]): DesignIrNode[] {
  return [...nodes].sort((a, b) => a.id.localeCompare(b.id))
}

export function compileCanvasToDesignIrV1(
  input: CanvasSnapshot | CanvasDocV1,
  options: { projectId?: string; projectName?: string } = {}
): DesignIrV1 {
  const doc = isCanvasDoc(input)
    ? normalizeCanvasDocV1(input, { projectId: options.projectId })
    : createCanvasDocV1(sanitizeCanvasSnapshot(input), {
        projectId: options.projectId ?? "",
      })

  const nodes = [...doc.nodes].sort((a, b) => a.id.localeCompare(b.id))
  const edges = [...doc.edges].sort((a, b) => a.id.localeCompare(b.id))
  const irNodes = nodes.map(toIrNode)

  return {
    $schema: DESIGN_IR_SCHEMA_URL,
    irVersion: DESIGN_IR_VERSION,
    project: {
      id: doc.projectId,
      name: options.projectName ?? doc.title,
      tenantModel: "owner-scoped-now-workspace-compatible-later",
      defaultRuntime: "node-typescript",
      defaultDatabase: "postgresql",
      defaultOrm: "prisma",
    },
    scope: {
      rootGraphId: doc.graphId,
      compiledGraphIds: [doc.graphId],
    },
    decisions: collectDecisions(nodes, edges),
    services: sortNodes(irNodes.filter((node) => node.semanticType === "service")),
    apis: sortNodes(
      irNodes.filter((node) =>
        ["api", "endpoint-group", "endpoint"].includes(node.semanticType)
      )
    ),
    dataModels: sortNodes(
      irNodes.filter((node) =>
        ["database", "domain-model", "entity", "cache", "queue", "event-contract"].includes(
          node.semanticType
        )
      )
    ),
    policies: sortNodes(
      irNodes.filter((node) =>
        ["policy", "business-rule", "validation-rule", "auth-module"].includes(
          node.semanticType
        )
      )
    ),
    assumptions: collectStrings(nodes, edges, "assumptions"),
    sourceRefs: collectStrings(nodes, edges, "sourceRefs"),
    relations: edges.map(toIrRelation),
  }
}
