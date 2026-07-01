import type { CanvasSnapshot } from "@/lib/canvas/canvas-state"
import type { DesignProviderResult } from "@/lib/ai/design/design-actions"

export interface GenerateDesignActionsInput {
  prompt: string
  projectId: string
  roomId: string
  currentCanvas: CanvasSnapshot
}

export type GenerateDesignActionsResult = DesignProviderResult
