import type {
  CanvasNodeData,
  NodeShape,
  SemanticNodeType,
} from "@/types/canvas"
import { NODE_COLORS, SHAPE_DEFAULTS } from "@/types/canvas"

export type SemanticTemplateType = "service" | "database" | "worker" | "auth-module"
export type ServiceInternalTemplateType =
  | "endpoint"
  | "entity"
  | "worker"
  | "event-contract"
  | "business-rule"
  | "validation-rule"
  | "policy"

export interface SemanticNodeTemplate {
  semanticType: SemanticTemplateType | ServiceInternalTemplateType
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

export const SERVICE_INTERNAL_NODE_TEMPLATES: SemanticNodeTemplate[] = [
  {
    semanticType: "endpoint",
    title: "Endpoint",
    shape: "circle",
    colorIndex: 1,
    data: {
      semanticType: "endpoint",
      label: "Endpoint",
      name: "Endpoint",
      method: "POST",
      path: "/resource",
      authRequired: true,
      idempotent: false,
      status: "draft",
    },
  },
  {
    semanticType: "entity",
    title: "Entity",
    shape: "rectangle",
    colorIndex: 7,
    data: {
      semanticType: "entity",
      label: "Entity",
      name: "Entity",
      fields: [],
      tenantKey: "tenantId",
      status: "draft",
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
      triggerType: "event",
      retryPolicy: "required",
      idempotencyRequired: true,
      status: "draft",
    },
  },
  {
    semanticType: "event-contract",
    title: "Event",
    shape: "diamond",
    colorIndex: 3,
    data: {
      semanticType: "event-contract",
      label: "Event",
      name: "Event",
      direction: "published",
      topic: "domain.event",
      deliveryGuarantee: "at-least-once",
      status: "draft",
    },
  },
  {
    semanticType: "business-rule",
    title: "Business Rule",
    shape: "rectangle",
    colorIndex: 2,
    data: {
      semanticType: "business-rule",
      label: "Business Rule",
      name: "Business Rule",
      ruleType: "invariant",
      status: "draft",
    },
  },
  {
    semanticType: "validation-rule",
    title: "Validation",
    shape: "diamond",
    colorIndex: 4,
    data: {
      semanticType: "validation-rule",
      label: "Validation",
      name: "Validation",
      validationScope: "input",
      severity: "error",
      status: "draft",
    },
  },
  {
    semanticType: "policy",
    title: "Policy",
    shape: "pill",
    colorIndex: 5,
    data: {
      semanticType: "policy",
      label: "Policy",
      name: "Policy",
      policyKind: "security",
      enforcementMode: "server-side",
      auditRequired: true,
      status: "draft",
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

  if (semanticType === "endpoint") {
    return {
      semanticType,
      method: "POST",
      path: "/resource",
      authRequired: true,
      idempotent: false,
    }
  }

  if (semanticType === "entity") {
    return {
      semanticType,
      fields: [],
      tenantKey: "tenantId",
    }
  }

  if (semanticType === "event-contract") {
    return {
      semanticType,
      direction: "published",
      topic: "domain.event",
      deliveryGuarantee: "at-least-once",
    }
  }

  if (semanticType === "business-rule") {
    return {
      semanticType,
      ruleType: "invariant",
    }
  }

  if (semanticType === "validation-rule") {
    return {
      semanticType,
      validationScope: "input",
      severity: "error",
    }
  }

  if (semanticType === "policy") {
    return {
      semanticType,
      policyKind: "security",
      enforcementMode: "server-side",
      auditRequired: true,
    }
  }

  return { semanticType }
}

export function semanticTemplateSize(template: SemanticNodeTemplate) {
  return SHAPE_DEFAULTS[template.shape]
}
