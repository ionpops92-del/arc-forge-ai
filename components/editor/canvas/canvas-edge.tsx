"use client"

import { useCallback, useMemo, useState } from "react"
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react"
import type { EdgeProps } from "@xyflow/react"
import { Plus, X } from "lucide-react"
import type { CanvasEdge, CanvasEdgeData } from "@/types/canvas"
import { useCanvasMutations } from "@/components/editor/canvas/canvas-mutation-context"

type EditingTarget = number | "new" | null

function normalizeLabels(data?: CanvasEdgeData) {
  const labels = Array.isArray(data?.labels) ? data.labels : []
  const normalized = labels
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, 8)

  if (normalized.length > 0) return normalized

  const legacyLabel = data?.label?.trim()
  return legacyLabel ? [legacyLabel] : []
}

export function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
}: EdgeProps<CanvasEdge>) {
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [draftLabel, setDraftLabel] = useState("")
  const { updateEdgeData } = useCanvasMutations()
  const labels = useMemo(() => normalizeLabels(data), [data])

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  const isEditing = editingTarget !== null
  const isActive = selected || isHovered || isEditing
  const stroke = isActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)"

  const updateLabels = useCallback(
    (nextLabels: string[]) => {
      const cleanLabels = nextLabels
        .map((label) => label.trim())
        .filter(Boolean)
        .slice(0, 8)

      updateEdgeData(id, {
        label: cleanLabels[0] ?? "",
        labels: cleanLabels,
      })
    },
    [id, updateEdgeData]
  )

  const startEditing = useCallback(
    (target: EditingTarget) => (event: React.MouseEvent) => {
      event.stopPropagation()
      setDraftLabel(typeof target === "number" ? labels[target] ?? "" : "")
      setEditingTarget(target)
    },
    [labels]
  )

  const commitEdit = useCallback(
    (nextValue?: string) => {
      if (editingTarget === null) return

      const value = (nextValue ?? draftLabel).trim()
      if (editingTarget === "new") {
        if (value) updateLabels([...labels, value])
      } else {
        const nextLabels = [...labels]
        if (value) {
          nextLabels[editingTarget] = value
        } else {
          nextLabels.splice(editingTarget, 1)
        }
        updateLabels(nextLabels)
      }

      setEditingTarget(null)
      setDraftLabel("")
    },
    [draftLabel, editingTarget, labels, updateLabels]
  )

  const deleteLabel = useCallback(
    (index: number) => (event: React.MouseEvent) => {
      event.stopPropagation()
      const nextLabels = labels.filter((_, labelIndex) => labelIndex !== index)
      updateLabels(nextLabels)
    },
    [labels, updateLabels]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      event.stopPropagation()
      if (event.key === "Enter") {
        event.preventDefault()
        commitEdit(event.currentTarget.value)
      }
      if (event.key === "Escape") {
        event.preventDefault()
        setEditingTarget(null)
        setDraftLabel("")
      }
    },
    [commitEdit]
  )

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={labels.length > 0 ? startEditing(0) : startEditing("new")}
      />
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: 1.5,
          strokeLinecap: "round",
          transition: "stroke 0.15s",
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan flex flex-col items-center gap-1"
        >
          {labels.map((label, index) => (
            <div
              key={`${id}-${index}-${label}`}
              className="flex items-center gap-1 rounded-full border border-border-subtle bg-bg-surface px-2.5 py-1 text-xs text-text-primary shadow-xl"
              onDoubleClick={startEditing(index)}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {editingTarget === index ? (
                <input
                  autoFocus
                  value={draftLabel}
                  onChange={(event) => setDraftLabel(event.target.value)}
                  onBlur={(event) => commitEdit(event.currentTarget.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={(event) => event.target.select()}
                  className="w-28 bg-transparent text-center text-xs text-text-primary outline-none"
                  aria-label="Edit edge label"
                />
              ) : (
                <>
                  <button
                    type="button"
                    className="cursor-text"
                    onClick={startEditing(index)}
                    title="Edit label"
                  >
                    {label}
                  </button>
                  {selected ? (
                    <button
                      type="button"
                      onClick={deleteLabel(index)}
                      className="flex h-4 w-4 items-center justify-center rounded-full text-text-faint transition-colors hover:bg-bg-subtle hover:text-text-primary"
                      title="Remove label"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                </>
              )}
            </div>
          ))}

          {editingTarget === "new" ? (
            <input
              autoFocus
              value={draftLabel}
              onChange={(event) => setDraftLabel(event.target.value)}
              onBlur={(event) => commitEdit(event.currentTarget.value)}
              onKeyDown={handleKeyDown}
              onFocus={(event) => event.target.select()}
              className="w-32 rounded-full border border-accent-ai/40 bg-bg-surface px-3 py-1 text-center text-xs text-text-primary shadow-xl outline-none"
              placeholder="Edge label"
              aria-label="New edge label"
            />
          ) : selected ? (
            <button
              type="button"
              onClick={startEditing("new")}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              className="flex items-center gap-1 rounded-full border border-accent-ai/30 bg-accent-ai/10 px-2.5 py-1 text-[11px] font-medium text-accent-ai-text shadow-xl transition-colors hover:border-accent-ai/60 hover:bg-accent-ai/20"
              title="Add edge label"
            >
              <Plus className="h-3 w-3" />
              {labels.length > 0 ? "label" : "double-click or add label"}
            </button>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
