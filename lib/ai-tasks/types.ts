import type { AiTaskStatus, AiTaskType } from "@/app/generated/prisma/client"

export const AI_TASK_LEASE_SECONDS = 120
export const AI_TASK_POLL_INTERVAL_MS = 1500

export const AI_TASK_TERMINAL_STATUSES = [
  "succeeded",
  "failed",
  "cancelled",
  "timed_out",
] as const satisfies readonly AiTaskStatus[]

export interface CreateAiTaskRunInput {
  type: AiTaskType
  projectId: string
  userId: string
  payloadJson: unknown
  maxAttempts?: number
}

export interface SafeAiTaskRun {
  id: string
  type: AiTaskType
  status: AiTaskStatus
  projectId: string
  resultJson: unknown
  errorMessage: string | null
  attemptCount: number
  maxAttempts: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export function isTerminalAiTaskStatus(status: AiTaskStatus): boolean {
  return (AI_TASK_TERMINAL_STATUSES as readonly string[]).includes(status)
}
