import type {
  CanvasNodeData,
  NodeShape,
  SemanticNodeType,
} from "@/types/canvas"
import { NODE_COLORS, SHAPE_DEFAULTS } from "@/types/canvas"

export type SemanticTemplateType = "service" | "database" | "worker" | "auth-module"

export interface SemanticNodeTemplate {
  semanticType: SemanticTemplateType
  title: string
  shape: NodeShape
  colorIndex: number
  data: Partial<CanvasNodeData>
}

export const SEMANTIC_NODE_TEMPLATES: SemanticNodeTemplate[] = [
  {
    semanticType: "service",
    title: "Service",
    shape: "pill",
    colorIndex: 1,
    data: {
      semanticType: "service",
      label: "Service",
      name: "Service",
      serviceKind: "application-service",
      runtime: "node-typescript",
      language: "typescript",
      framework: "",
      tenancy: "owner-scoped-now-workspace-compatible-later",
      authMode: "internal-cookie-session",
    },
  },
  {
    semanticType: "database",
    title: "Database",
    shape: "cylinder",
    colorIndex: 7,
    data: {
      semanticType: "database",
      label: "Database",
      name: "Database",
      dbKind: "relational",
      engine: "postgresql",
      orm: "prisma",
    },
  },
  {
    semanticType: "worker",
    title: "Worker",
    shape: "hexagon",
    colorIndex: 6,
    data: {
      semanticType: "worker",
      label: "Worker",
      name: "Worker",
      triggerType: "manual-or-event",
      retryPolicy: "required",
      idempotencyRequired: true,
    },
  },
  {
    semanticType: "auth-module",
    title: "Auth",
    shape: "pill",
    colorIndex: 2,
    data: {
      semanticType: "auth-module",
      label: "Auth Module",
      name: "Auth Module",
      authStrategy: "internal-cookie-session",
      sessionMode: "httpOnly-cookie",
      emailVerification: true,
    },
  },
]

export function baseNodeData(label = ""): CanvasNodeData {
  return {
    label,
    name: label,
    semanticType: "unclassified",
    status: "draft",
    tags: [],
    sourceRefs: [],
    assumptions: [],
    decisionRefs: [],
    owner: null,
    color: NODE_COLORS[0].fill,
    textColor: NODE_COLORS[0].text,
    shape: "rectangle",
  }
}

export function semanticDefaultsForType(
  semanticType: SemanticNodeType
): Partial<CanvasNodeData> {
  if (semanticType === "service") {
    return {
      semanticType,
      serviceKind: "application-service",
      runtime: "node-typescript",
      language: "typescript",
      framework: "",
      tenancy: "owner-scoped-now-workspace-compatible-later",
      authMode: "internal-cookie-session",
    }
  }

  if (semanticType === "database") {
    return {
      semanticType,
      dbKind: "relational",
      engine: "postgresql",
      orm: "prisma",
    }
  }

  if (semanticType === "worker") {
    return {
      semanticType,
      triggerType: "manual-or-event",
      retryPolicy: "required",
      idempotencyRequired: true,
    }
  }

  if (semanticType === "auth-module") {
    return {
      semanticType,
      authStrategy: "internal-cookie-session",
      sessionMode: "httpOnly-cookie",
      emailVerification: true,
    }
  }

  return { semanticType }
}

export function semanticTemplateSize(template: SemanticNodeTemplate) {
  return SHAPE_DEFAULTS[template.shape]
}
