"use client"

import { createContext, useContext } from "react"
import type { CanvasEdge, CanvasEdgeData, CanvasNodeData } from "@/types/canvas"

interface CanvasMutationContextValue {
  updateNodeData: (nodeId: string, patch: Partial<CanvasNodeData>) => void
  updateEdgeData: (edgeId: string, patch: Partial<CanvasEdgeData>) => void
  deleteNode: (nodeId: string) => void
  deleteEdge: (edgeId: string) => void
  upsertEdge: (edge: CanvasEdge) => void
}

const CanvasMutationContext = createContext<CanvasMutationContextValue | null>(null)

export function CanvasMutationProvider({
  value,
  children,
}: {
  value: CanvasMutationContextValue
  children: React.ReactNode
}) {
  return (
    <CanvasMutationContext.Provider value={value}>
      {children}
    </CanvasMutationContext.Provider>
  )
}

export function useCanvasMutations() {
  const context = useContext(CanvasMutationContext)
  if (!context) {
    throw new Error("useCanvasMutations must be used inside CanvasMutationProvider")
  }

  return context
}
