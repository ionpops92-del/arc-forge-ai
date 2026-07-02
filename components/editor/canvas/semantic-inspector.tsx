"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Info, SquareArrowOutUpRight } from "lucide-react"
import type {
  CanvasEdge,
  CanvasEdgeData,
  CanvasNode,
  CanvasNodeData,
  SemanticEdgeType,
  SemanticNodeType,
} from "@/types/canvas"
import {
  SEMANTIC_EDGE_TYPES,
  SEMANTIC_NODE_TYPES,
  SUBCANVAS_CAPABLE_NODE_TYPES,
  semanticEdgeTypeLabel,
  semanticNodeTypeLabel,
} from "@/types/canvas"
import { semanticDefaultsForType } from "@/lib/canvas/semantic-defaults"
import type { SemanticValidationResult } from "@/lib/canvas/semantic-validation"
import {
  createEdgeLabelItems,
  edgeLabelTexts,
  mirrorEdgeLabelData,
  normalizeEdgeLabelItems,
} from "@/lib/canvas/edge-labels"
import { useCanvasMutations } from "@/components/editor/canvas/canvas-mutation-context"

interface SemanticInspectorProps {
  selectedNode: CanvasNode | null
  selectedEdge: CanvasEdge | null
  warnings: SemanticValidationResult[]
}

interface DraftFieldProps {
  label: string
  value: string
  onCommit: (value: string) => void
  multiline?: boolean
}

function toList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : []
}

function DraftField({ label, value, onCommit, multiline }: DraftFieldProps) {
  return (
    <DraftFieldInner
      key={`${label}:${value}`}
      label={label}
      value={value}
      onCommit={onCommit}
      multiline={multiline}
    />
  )
}

function DraftFieldInner({ label, value, onCommit, multiline }: DraftFieldProps) {
  const [draft, setDraft] = useState(value)

  const commit = () => {
    if (draft !== value) onCommit(draft.trim())
  }

  const className =
    "w-full rounded-xl border border-border-default bg-bg-elevated px-2.5 py-2 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary/60"

  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-medium text-text-muted">{label}</span>
      {multiline ? (
        <textarea
          value={draft}
          rows={3}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          className={`${className} resize-none`}
        />
      ) : (
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
            if (event.key === "Escape") setDraft(value)
          }}
          className={className}
        />
      )}
    </label>
  )
}

function ListField({
  label,
  values,
  onCommit,
}: {
  label: string
  values: string[]
  onCommit: (values: string[]) => void
}) {
  return (
    <DraftField
      label={label}
      value={values.join(", ")}
      onCommit={(value) =>
        onCommit(
          value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      }
    />
  )
}

function SelectField<TValue extends string>({
  label,
  value,
  options,
  optionLabel,
  onChange,
}: {
  label: string
  value: TValue
  options: readonly TValue[]
  optionLabel: (value: TValue) => string
  onChange: (value: TValue) => void
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-medium text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
        className="w-full rounded-xl border border-border-default bg-bg-elevated px-2.5 py-2 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary/60"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  )
}

function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-bg-elevated px-2.5 py-2 text-xs text-text-secondary">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[var(--color-accent-primary)]"
      />
    </label>
  )
}

function WarningList({ warnings }: { warnings: SemanticValidationResult[] }) {
  if (warnings.length === 0) {
    return (
      <div className="rounded-xl border border-state-success/25 bg-bg-elevated px-2.5 py-2 text-xs text-state-success">
        Semantic metadata is complete for this selection.
      </div>
    )
  }

  return (
    <div className="grid gap-1.5">
      {warnings.slice(0, 5).map((warning) => {
        const Icon = warning.severity === "info" ? Info : AlertTriangle
        const color =
          warning.severity === "info" ? "text-text-muted" : "text-state-warning"

        return (
          <div
            key={warning.id}
            className="flex gap-2 rounded-xl border border-border-default bg-bg-elevated px-2.5 py-2 text-xs text-text-secondary"
          >
            <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${color}`} />
            <span>{warning.message}</span>
          </div>
        )
      })}
    </div>
  )
}

function SubcanvasNotice({ node }: { node: CanvasNode }) {
  const semanticType = node.data.semanticType
  if (
    !semanticType ||
    !(SUBCANVAS_CAPABLE_NODE_TYPES as readonly string[]).includes(semanticType)
  ) {
    return null
  }

  return (
    <div className="grid gap-2 rounded-xl border border-border-default bg-bg-elevated px-2.5 py-2 text-xs text-text-secondary">
      <span>
        {node.data.subcanvasRef ? "Service design metadata is linked." : "Subcanvas not created yet."}
      </span>
      <button
        type="button"
        disabled
        className="flex h-8 items-center justify-center gap-2 rounded-xl border border-border-default text-text-faint"
      >
        <SquareArrowOutUpRight className="h-3.5 w-3.5" />
        Open design - coming next
      </button>
    </div>
  )
}

function NodeSpecificFields({
  node,
  patch,
}: {
  node: CanvasNode
  patch: (patch: Partial<CanvasNodeData>) => void
}) {
  const type = node.data.semanticType

  if (type === "service") {
    return (
      <>
        <DraftField label="Service kind" value={node.data.serviceKind ?? ""} onCommit={(serviceKind) => patch({ serviceKind })} />
        <DraftField label="Runtime" value={node.data.runtime ?? ""} onCommit={(runtime) => patch({ runtime })} />
        <DraftField label="Language" value={node.data.language ?? ""} onCommit={(language) => patch({ language })} />
        <DraftField label="Framework" value={node.data.framework ?? ""} onCommit={(framework) => patch({ framework })} />
        <DraftField label="Tenancy" value={node.data.tenancy ?? ""} onCommit={(tenancy) => patch({ tenancy })} />
        <DraftField label="Auth mode" value={node.data.authMode ?? ""} onCommit={(authMode) => patch({ authMode })} />
      </>
    )
  }

  if (type === "database") {
    return (
      <>
        <DraftField label="Database kind" value={node.data.dbKind ?? ""} onCommit={(dbKind) => patch({ dbKind })} />
        <DraftField label="Engine" value={node.data.engine ?? ""} onCommit={(engine) => patch({ engine })} />
        <DraftField label="ORM" value={node.data.orm ?? ""} onCommit={(orm) => patch({ orm })} />
      </>
    )
  }

  if (type === "worker") {
    return (
      <>
        <DraftField label="Trigger type" value={node.data.triggerType ?? ""} onCommit={(triggerType) => patch({ triggerType })} />
        <DraftField label="Retry policy" value={node.data.retryPolicy ?? ""} onCommit={(retryPolicy) => patch({ retryPolicy })} />
        <BooleanField label="Idempotency required" checked={Boolean(node.data.idempotencyRequired)} onChange={(idempotencyRequired) => patch({ idempotencyRequired })} />
      </>
    )
  }

  if (type === "auth-module") {
    return (
      <>
        <DraftField label="Auth strategy" value={node.data.authStrategy ?? ""} onCommit={(authStrategy) => patch({ authStrategy })} />
        <DraftField label="Session mode" value={node.data.sessionMode ?? ""} onCommit={(sessionMode) => patch({ sessionMode })} />
        <BooleanField label="Email verification" checked={Boolean(node.data.emailVerification)} onChange={(emailVerification) => patch({ emailVerification })} />
      </>
    )
  }

  if (type === "endpoint") {
    return (
      <>
        <DraftField label="Method" value={node.data.method ?? ""} onCommit={(method) => patch({ method })} />
        <DraftField label="Path" value={node.data.path ?? ""} onCommit={(path) => patch({ path })} />
        <BooleanField label="Auth required" checked={Boolean(node.data.authRequired)} onChange={(authRequired) => patch({ authRequired })} />
        <BooleanField label="Idempotent" checked={Boolean(node.data.idempotent)} onChange={(idempotent) => patch({ idempotent })} />
      </>
    )
  }

  return null
}

export function SemanticInspector({
  selectedNode,
  selectedEdge,
  warnings,
}: SemanticInspectorProps) {
  const { updateNodeData, updateEdgeData } = useCanvasMutations()
  const selectionWarnings = useMemo(() => {
    const targetId = selectedNode?.id ?? selectedEdge?.id
    return targetId
      ? warnings.filter((warning) => warning.targetId === targetId)
      : warnings.filter((warning) => warning.severity !== "info")
  }, [selectedEdge?.id, selectedNode?.id, warnings])

  if (!selectedNode && !selectedEdge) {
    if (warnings.length === 0) return null

    return (
      <aside className="pointer-events-auto absolute left-4 top-4 z-20 w-80 rounded-2xl border border-border-default bg-bg-surface/95 p-3 shadow-xl backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-text-primary">Semantic warnings</p>
          <span className="rounded-full bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted">
            {warnings.length}
          </span>
        </div>
        <WarningList warnings={selectionWarnings} />
      </aside>
    )
  }

  if (selectedNode) {
    const semanticType = selectedNode.data.semanticType ?? "unclassified"
    const patch = (nextPatch: Partial<CanvasNodeData>) =>
      updateNodeData(selectedNode.id, nextPatch)

    return (
      <aside className="pointer-events-auto absolute left-4 top-4 z-20 max-h-[calc(100%-2rem)] w-80 overflow-y-auto rounded-2xl border border-border-default bg-bg-surface/95 p-3 shadow-xl backdrop-blur-xl">
        <div className="mb-3">
          <p className="text-xs font-semibold text-text-primary">Semantic Inspector</p>
          <p className="truncate text-[11px] text-text-muted">{selectedNode.id}</p>
        </div>
        <div className="grid gap-2">
          <WarningList warnings={selectionWarnings} />
          <SelectField<SemanticNodeType>
            label="Node type"
            value={semanticType}
            options={SEMANTIC_NODE_TYPES}
            optionLabel={semanticNodeTypeLabel}
            onChange={(nextType) =>
              patch({
                ...semanticDefaultsForType(nextType),
                name: selectedNode.data.name || selectedNode.data.label || semanticNodeTypeLabel(nextType),
              })
            }
          />
          <DraftField label="Name" value={selectedNode.data.name ?? ""} onCommit={(name) => patch({ name })} />
          <DraftField label="Label" value={selectedNode.data.label ?? ""} onCommit={(label) => patch({ label })} />
          <DraftField label="Description" value={selectedNode.data.description ?? ""} onCommit={(description) => patch({ description })} multiline />
          <SelectField
            label="Status"
            value={selectedNode.data.status ?? "draft"}
            options={["draft", "approved", "deprecated"] as const}
            optionLabel={(value) => value}
            onChange={(status) => patch({ status })}
          />
          <ListField label="Tags" values={toList(selectedNode.data.tags)} onCommit={(tags) => patch({ tags })} />
          <DraftField label="Owner" value={selectedNode.data.owner ?? ""} onCommit={(owner) => patch({ owner: owner || null })} />
          <ListField label="Source refs" values={toList(selectedNode.data.sourceRefs)} onCommit={(sourceRefs) => patch({ sourceRefs })} />
          <ListField label="Assumptions" values={toList(selectedNode.data.assumptions)} onCommit={(assumptions) => patch({ assumptions })} />
          <ListField label="Decision refs" values={toList(selectedNode.data.decisionRefs)} onCommit={(decisionRefs) => patch({ decisionRefs })} />
          <NodeSpecificFields node={selectedNode} patch={patch} />
          <SubcanvasNotice node={selectedNode} />
        </div>
      </aside>
    )
  }

  if (selectedEdge) {
    const edgeData = selectedEdge.data ?? {}
    const semanticType = edgeData.semanticType ?? "unclassified"
    const patch = (nextPatch: Partial<CanvasEdgeData>) =>
      updateEdgeData(selectedEdge.id, nextPatch)
    const edgeLabels = edgeLabelTexts(edgeData)

    return (
      <aside className="pointer-events-auto absolute left-4 top-4 z-20 max-h-[calc(100%-2rem)] w-80 overflow-y-auto rounded-2xl border border-border-default bg-bg-surface/95 p-3 shadow-xl backdrop-blur-xl">
        <div className="mb-3">
          <p className="text-xs font-semibold text-text-primary">Semantic Inspector</p>
          <p className="truncate text-[11px] text-text-muted">{selectedEdge.id}</p>
        </div>
        <div className="grid gap-2">
          <WarningList warnings={selectionWarnings} />
          <SelectField<SemanticEdgeType>
            label="Edge type"
            value={semanticType}
            options={SEMANTIC_EDGE_TYPES}
            optionLabel={semanticEdgeTypeLabel}
            onChange={(nextType) => patch({ semanticType: nextType })}
          />
          <DraftField label="Name" value={edgeData.name ?? ""} onCommit={(name) => patch({ name })} />
          <DraftField
            label="Primary label"
            value={edgeLabels[0] ?? ""}
            onCommit={(label) => {
              const previousItems = normalizeEdgeLabelItems(edgeData)
              const nextLabels = label
                ? [label, ...edgeLabels.slice(1)]
                : edgeLabels.slice(1)
              patch(mirrorEdgeLabelData(createEdgeLabelItems(nextLabels, previousItems, `${selectedEdge.id}-label`)))
            }}
          />
          <DraftField label="Description" value={edgeData.description ?? ""} onCommit={(description) => patch({ description })} multiline />
          <SelectField
            label="Status"
            value={edgeData.status ?? "draft"}
            options={["draft", "approved", "deprecated"] as const}
            optionLabel={(value) => value}
            onChange={(status) => patch({ status })}
          />
          <ListField label="Tags" values={toList(edgeData.tags)} onCommit={(tags) => patch({ tags })} />
          <DraftField label="Method" value={String(edgeData.method ?? "")} onCommit={(method) => patch({ method })} />
          <DraftField label="Path" value={String(edgeData.path ?? "")} onCommit={(path) => patch({ path })} />
          <DraftField label="Operation hint" value={String(edgeData.operationHint ?? "")} onCommit={(operationHint) => patch({ operationHint })} />
          <DraftField label="Event name" value={String(edgeData.eventName ?? "")} onCommit={(eventName) => patch({ eventName })} />
          <DraftField label="Topic" value={String(edgeData.topic ?? "")} onCommit={(topic) => patch({ topic })} />
          <ListField label="Source refs" values={toList(edgeData.sourceRefs)} onCommit={(sourceRefs) => patch({ sourceRefs })} />
          <ListField label="Assumptions" values={toList(edgeData.assumptions)} onCommit={(assumptions) => patch({ assumptions })} />
          <ListField label="Decision refs" values={toList(edgeData.decisionRefs)} onCommit={(decisionRefs) => patch({ decisionRefs })} />
        </div>
      </aside>
    )
  }

  return null
}
