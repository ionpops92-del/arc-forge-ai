"use client"

import { ReactFlowProvider } from "@xyflow/react"
import { CanvasEditor } from "@/components/editor/canvas/canvas-editor"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import type { SaveStatus } from "@/hooks/use-canvas-autosave"

interface CanvasRoomProps {
  projectId: string
  pendingTemplate?: CanvasTemplate | null
  onTemplateImported?: () => void
  onSaveStatusChange?: (status: SaveStatus) => void
  onSaveReady?: (saveFn: () => void) => void
}

export function CanvasRoom({ projectId, pendingTemplate, onTemplateImported, onSaveStatusChange, onSaveReady }: CanvasRoomProps) {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <CanvasEditor
          projectId={projectId}
          pendingTemplate={pendingTemplate}
          onTemplateImported={onTemplateImported}
          onSaveStatusChange={onSaveStatusChange}
          onSaveReady={onSaveReady}
        />
      </ReactFlowProvider>
    </div>
  )
}
