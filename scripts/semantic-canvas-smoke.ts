import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import { NODE_COLORS, SHAPE_DEFAULTS } from "@/types/canvas"
import { createCanvasDocV1 } from "@/lib/canvas/canvas-doc"
import { compileCanvasToDesignIrV1 } from "@/lib/canvas/design-ir"
import {
  baseNodeData,
  SEMANTIC_NODE_TEMPLATES,
  semanticTemplateSize,
} from "@/lib/canvas/semantic-defaults"
import { createEdgeLabelItems, mirrorEdgeLabelData } from "@/lib/canvas/edge-labels"
import { sanitizeCanvasSnapshot } from "@/lib/canvas/canvas-state"
import { validateCanvasSemantics } from "@/lib/canvas/semantic-validation"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function nodeFromTemplate(templateId: "service" | "database"): CanvasNode {
  const template = SEMANTIC_NODE_TEMPLATES.find(
    (item) => item.semanticType === templateId
  )
  assert(template, `missing ${templateId} template`)
  const color = NODE_COLORS[template.colorIndex]
  const size = semanticTemplateSize(template)

  return {
    id: `${templateId}-node`,
    type: "canvasNode",
    position: { x: 0, y: 0 },
    data: {
      ...baseNodeData(template.title),
      ...template.data,
      color: color.fill,
      textColor: color.text,
      shape: template.shape,
    },
    width: size.width,
    height: size.height,
  }
}

function edge(id: string, source: string, target: string, label: string): CanvasEdge {
  const labelItems = createEdgeLabelItems([label], [{ id: "edge-label-1", text: label }], id)

  return {
    id,
    type: "canvasEdge",
    source,
    target,
    sourceHandle: null,
    targetHandle: null,
    data: {
      semanticType: "unclassified",
      name: label,
      status: "draft",
      tags: [],
      sourceRefs: [],
      assumptions: [],
      decisionRefs: [],
      owner: null,
      ...mirrorEdgeLabelData(labelItems),
    },
  }
}

const legacyCanvas = sanitizeCanvasSnapshot({
  nodes: [
    {
      id: "legacy-node",
      type: "canvasNode",
      position: { x: 10, y: 20 },
      selected: true,
      dragging: true,
      data: {
        label: "Legacy",
        isEditing: true,
        draftText: "do not save",
      },
    },
  ],
  edges: [
    {
      id: "legacy-edge",
      type: "canvasEdge",
      source: "legacy-node",
      target: "legacy-node",
      selected: true,
      data: {
        label: "calls",
        labels: ["calls", "fallback"],
      },
    },
  ],
})

const legacyNode = legacyCanvas.nodes[0]
const legacyEdge = legacyCanvas.edges[0]
assert(legacyNode, "legacy node did not survive normalization")
assert(legacyEdge?.data, "legacy edge did not survive normalization")

assert(
  legacyNode.data.semanticType === "unclassified",
  "legacy node did not normalize to unclassified"
)
assert(
  legacyEdge.data.semanticType === "unclassified",
  "legacy edge did not normalize to unclassified"
)
assert(!("selected" in legacyNode), "selected leaked into node snapshot")
assert(!("dragging" in legacyNode), "dragging leaked into node snapshot")
assert(!("isEditing" in legacyNode.data), "isEditing leaked into node data")
assert(!("draftText" in legacyNode.data), "draftText leaked into node data")

const serviceNode = nodeFromTemplate("service")
const databaseNode = nodeFromTemplate("database")
const templateWarnings = validateCanvasSemantics({
  nodes: [serviceNode, databaseNode],
  edges: [],
}).filter((warning) => warning.severity !== "info")

assert(templateWarnings.length === 0, "service/database templates should validate")

const labelItems = createEdgeLabelItems(
  ["writes", "transaction"],
  [
    { id: "primary-label", text: "writes" },
    { id: "secondary-label", text: "transaction" },
  ],
  "db-edge-label"
)
const dbEdge = sanitizeCanvasSnapshot({
  nodes: [serviceNode, databaseNode],
  edges: [
    {
      ...edge("db-edge", serviceNode.id, databaseNode.id, "writes"),
      data: {
        semanticType: "db-write",
        ...mirrorEdgeLabelData(labelItems),
      },
    },
  ],
}).edges[0]

assert(dbEdge?.data, "db edge did not survive normalization")
assert(dbEdge.id === "db-edge", "edge id was not preserved")
assert(dbEdge.data.label === "writes", "primary edge label was not mirrored")
assert(dbEdge.data.labels?.[1] === "transaction", "edge labels were not preserved")
assert(
  dbEdge.data.labelItems?.[0]?.id === "primary-label",
  "edge labelItems were not preserved"
)

const reconnected = sanitizeCanvasSnapshot({
  nodes: [serviceNode, databaseNode],
  edges: [
    {
      ...dbEdge,
      source: databaseNode.id,
      target: serviceNode.id,
    },
  ],
}).edges[0]

assert(reconnected?.data, "reconnected edge did not survive normalization")
assert(reconnected.id === dbEdge.id, "reconnect normalization changed edge id")
assert(
  reconnected.data.labelItems?.[0]?.text === "writes",
  "reconnect normalization lost edge labels"
)

const doc = createCanvasDocV1(
  {
    nodes: [serviceNode, databaseNode],
    edges: [{ ...dbEdge, source: serviceNode.id, target: databaseNode.id }],
  },
  { projectId: "project-smoke", title: "Smoke System" }
)
const irA = compileCanvasToDesignIrV1(doc)
const irB = compileCanvasToDesignIrV1(doc)
assert(JSON.stringify(irA) === JSON.stringify(irB), "Design IR compiler is not deterministic")
assert(irA.services[0]?.id === serviceNode.id, "service node missing from Design IR")
assert(irA.dataModels[0]?.id === databaseNode.id, "database node missing from Design IR")

const secretCanvas = sanitizeCanvasSnapshot({
  nodes: [
    {
      id: "secret-node",
      type: "canvasNode",
      position: { x: 0, y: 0 },
      data: {
        ...baseNodeData("Secret Node"),
        apiKey: "sk-abcdefghijklmnopqrstuvwxyz123456",
        description: "token sk-abcdefghijklmnopqrstuvwxyz123456",
      },
      width: SHAPE_DEFAULTS.rectangle.width,
      height: SHAPE_DEFAULTS.rectangle.height,
    },
  ],
  edges: [],
})
const secretIr = compileCanvasToDesignIrV1(secretCanvas)
const exportedSecretIr = JSON.stringify(secretIr)
const secretNode = secretCanvas.nodes[0]
assert(secretNode, "secret node did not survive normalization")

assert(!exportedSecretIr.includes("sk-abcdefghijklmnopqrstuvwxyz123456"), "raw secret leaked into IR")
assert(!("apiKey" in secretNode.data), "raw secret field was persisted")

console.log("semantic canvas smoke passed")
