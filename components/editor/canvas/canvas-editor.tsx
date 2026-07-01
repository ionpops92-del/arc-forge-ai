"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  ConnectionLineType,
  MarkerType,
  useNodes,
  useEdges,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useReactFlow } from "@xyflow/react"
import type { Connection, EdgeChange, NodeChange } from "@xyflow/react"
import type { CanvasNode, CanvasEdge, NodeShape } from "@/types/canvas"
import { NODE_COLORS } from "@/types/canvas"
import { CanvasNodeComponent } from "@/components/editor/canvas/canvas-node"
import { CanvasEdgeComponent } from "@/components/editor/canvas/canvas-edge"
import { ShapePanel } from "@/components/editor/canvas/shape-panel"
import { CanvasControls } from "@/components/editor/canvas/canvas-controls"
import { PresenceCursors } from "@/components/editor/canvas/presence-cursors"
import { CollaboratorAvatars } from "@/components/editor/canvas/collaborator-avatars"
import { CanvasMutationProvider } from "@/components/editor/canvas/canvas-mutation-context"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import { useCanvasAutosave, type SaveStatus } from "@/hooks/use-canvas-autosave"
import { useRealtimeRoom } from "@/hooks/use-realtime-room"
import { getUserColor } from "@/lib/user-color"
import { useCurrentUser } from "@/hooks/use-current-user"
import type { CanvasSnapshot } from "@/lib/canvas/canvas-state"

const nodeTypes = { canvasNode: CanvasNodeComponent }
const edgeTypes = { canvasEdge: CanvasEdgeComponent }

const CONNECTION_LINE_STYLE: React.CSSProperties = {
  stroke: "rgba(255,255,255,0.4)",
  strokeWidth: 1.5,
  strokeLinecap: "round",
}

let nodeCounter = 0
let edgeCounter = 0

function generateNodeId(shape: string): string {
  return `${shape}-${Date.now()}-${++nodeCounter}`
}

function generateEdgeId(): string {
  return `edge-${Date.now()}-${++edgeCounter}`
}

interface CanvasEditorProps {
  projectId: string
  pendingTemplate?: CanvasTemplate | null
  onTemplateImported?: () => void
  onSaveStatusChange?: (status: SaveStatus) => void
  onSaveReady?: (saveFn: () => void) => void
}

export function CanvasEditor({
  projectId,
  pendingTemplate,
  onTemplateImported,
  onSaveStatusChange,
  onSaveReady,
}: CanvasEditorProps) {
  const {
    nodes,
    edges,
    setCanvasSnapshot,
    patchPresence,
    status: realtimeStatus,
  } = useRealtimeRoom()
  const { user } = useCurrentUser()
  const reactFlow = useReactFlow()
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = reactFlow
  const wrapperRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const historyPastRef = useRef<CanvasSnapshot[]>([])
  const historyFutureRef = useRef<CanvasSnapshot[]>([])
  const [historyState, setHistoryState] = useState({
    canUndo: false,
    canRedo: false,
  })
  const didFitInitialCanvasRef = useRef(false)

  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [nodes, edges])

  const publishCanvas = useCallback(
    (nextNodes: CanvasNode[], nextEdges: CanvasEdge[]) => {
      setCanvasSnapshot(
        { nodes: nextNodes, edges: nextEdges },
        { broadcast: true }
      )
    },
    [setCanvasSnapshot]
  )

  const syncHistoryState = useCallback(() => {
    setHistoryState({
      canUndo: historyPastRef.current.length > 0,
      canRedo: historyFutureRef.current.length > 0,
    })
  }, [])

  const commitCanvas = useCallback(
    (
      nextNodes: CanvasNode[],
      nextEdges: CanvasEdge[],
      options: { recordHistory?: boolean } = {}
    ) => {
      if (options.recordHistory !== false) {
        historyPastRef.current.push({
          nodes: nodesRef.current,
          edges: edgesRef.current,
        })
        historyFutureRef.current = []
        syncHistoryState()
      }

      publishCanvas(nextNodes, nextEdges)
    },
    [publishCanvas, syncHistoryState]
  )

  useEffect(() => {
    if (didFitInitialCanvasRef.current) return
    if (nodes.length === 0) return
    didFitInitialCanvasRef.current = true
    setTimeout(() => fitView({ duration: 300 }), 120)
  }, [fitView, nodes.length])

  useEffect(() => {
    if (!pendingTemplate) return

    const timeoutId = window.setTimeout(() => {
      commitCanvas(pendingTemplate.nodes, pendingTemplate.edges)
      onTemplateImported?.()
      window.setTimeout(() => fitView({ duration: 300 }), 120)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [commitCanvas, fitView, onTemplateImported, pendingTemplate])

  const { status: saveStatus, save } = useCanvasAutosave(projectId, nodes, edges)

  useEffect(() => {
    onSaveStatusChange?.(saveStatus)
  }, [saveStatus, onSaveStatusChange])
  useEffect(() => {
    onSaveReady?.(save)
  }, [save, onSaveReady])

  const rfNodes = useNodes<CanvasNode>()
  const rfEdges = useEdges<CanvasEdge>()
  const rfNodesRef = useRef(rfNodes)
  const rfEdgesRef = useRef(rfEdges)

  useEffect(() => {
    rfNodesRef.current = rfNodes
    rfEdgesRef.current = rfEdges
  }, [rfNodes, rfEdges])

  const onNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      const nextNodes = applyNodeChanges(changes, nodesRef.current)
      commitCanvas(nextNodes, edgesRef.current)
    },
    [commitCanvas]
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<CanvasEdge>[]) => {
      const nextEdges = applyEdgeChanges(changes, edgesRef.current)
      commitCanvas(nodesRef.current, nextEdges)
    },
    [commitCanvas]
  )

  const deleteSelection = useCallback(() => {
    const selectedNodes = rfNodesRef.current.filter((node) => node.selected)
    const selectedEdges = rfEdgesRef.current.filter((edge) => edge.selected)
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return

    const selectedNodeIds = new Set(selectedNodes.map((node) => node.id))
    const selectedEdgeIds = new Set(selectedEdges.map((edge) => edge.id))
    const nextNodes = nodesRef.current.filter((node) => !selectedNodeIds.has(node.id))
    const nextEdges = edgesRef.current.filter(
      (edge) =>
        !selectedEdgeIds.has(edge.id) &&
        !selectedNodeIds.has(edge.source) &&
        !selectedNodeIds.has(edge.target)
    )

    commitCanvas(nextNodes, nextEdges)
  }, [commitCanvas])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      deleteSelection()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [deleteSelection])

  const currentUserId = user?.id ?? "anonymous"
  const currentUserName = user?.name ?? user?.email ?? "You"
  const currentUserColor = getUserColor(currentUserId)

  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      patchPresence({
        cursor: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
        name: currentUserName,
        color: currentUserColor,
      })
    },
    [currentUserColor, currentUserName, patchPresence, screenToFlowPosition]
  )

  const onMouseLeave = useCallback(() => {
    patchPresence({ cursor: null })
  }, [patchPresence])

  const undo = useCallback(() => {
    const previous = historyPastRef.current.pop()
    if (!previous) return

    historyFutureRef.current.push({
      nodes: nodesRef.current,
      edges: edgesRef.current,
    })
    syncHistoryState()
    publishCanvas(previous.nodes, previous.edges)
  }, [publishCanvas, syncHistoryState])

  const redo = useCallback(() => {
    const next = historyFutureRef.current.pop()
    if (!next) return

    historyPastRef.current.push({
      nodes: nodesRef.current,
      edges: edgesRef.current,
    })
    syncHistoryState()
    publishCanvas(next.nodes, next.edges)
  }, [publishCanvas, syncHistoryState])

  const { canUndo, canRedo } = historyState

  useKeyboardShortcuts({ reactFlow, undo, redo })

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      const nextEdge: CanvasEdge = {
        id: generateEdgeId(),
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
        type: "canvasEdge",
        data: { label: "" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "rgba(255,255,255,0.4)",
          width: 16,
          height: 16,
        },
      }

      commitCanvas(nodesRef.current, [...edgesRef.current, nextEdge])
    },
    [commitCanvas]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const raw = event.dataTransfer.getData("application/arc-forge-shape")
      if (!raw) return

      let payload: { shape: NodeShape; size: { width: number; height: number } }
      try {
        payload = JSON.parse(raw) as typeof payload
      } catch {
        return
      }

      const center = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const position = {
        x: center.x - payload.size.width / 2,
        y: center.y - payload.size.height / 2,
      }

      const newNode: CanvasNode = {
        id: generateNodeId(payload.shape),
        type: "canvasNode",
        position,
        data: {
          label: "",
          color: NODE_COLORS[0].fill,
          textColor: NODE_COLORS[0].text,
          shape: payload.shape,
        },
        width: payload.size.width,
        height: payload.size.height,
      }

      commitCanvas([...nodesRef.current, newNode], edgesRef.current)
    },
    [commitCanvas, screenToFlowPosition]
  )

  const mutationContext = useMemo(
    () => ({
      updateNodeData: (nodeId: string, patch: Partial<CanvasNode["data"]>) => {
        const nextNodes = nodesRef.current.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...patch } }
            : node
        )
        commitCanvas(nextNodes, edgesRef.current)
      },
      updateEdgeData: (edgeId: string, patch: Partial<CanvasEdge["data"]>) => {
        const nextEdges = edgesRef.current.map((edge) =>
          edge.id === edgeId
            ? { ...edge, data: { ...edge.data, ...patch } }
            : edge
        )
        commitCanvas(nodesRef.current, nextEdges)
      },
      upsertEdge: (edge: CanvasEdge) => {
        const nextEdges = [
          ...edgesRef.current.filter((existing) => existing.id !== edge.id),
          edge,
        ]
        commitCanvas(nodesRef.current, nextEdges)
      },
    }),
    [commitCanvas]
  )

  return (
    <CanvasMutationProvider value={mutationContext}>
      <div
        ref={wrapperRef}
        className="relative h-full w-full"
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          connectionLineStyle={CONNECTION_LINE_STYLE}
          connectionLineType={ConnectionLineType.SmoothStep}
          className="bg-bg-base"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="var(--color-border-subtle)"
          />
        </ReactFlow>
        <CanvasControls
          onZoomIn={() => zoomIn({ duration: 200 })}
          onZoomOut={() => zoomOut({ duration: 200 })}
          onFitView={() => fitView({ duration: 200 })}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
        <ShapePanel />
        <PresenceCursors />
        <CollaboratorAvatars />
        <ConnectionStatus status={realtimeStatus} />
        <SaveStatusIndicator status={saveStatus} />
      </div>
    </CanvasMutationProvider>
  )
}

function ConnectionStatus({ status }: { status: string }) {
  if (status === "connected") return null

  return (
    <div className="pointer-events-none absolute left-1/2 top-4 z-40 -translate-x-1/2">
      <span className="rounded-full border border-border-default bg-bg-surface/95 px-3 py-1 text-xs text-text-muted shadow-xl backdrop-blur-xl">
        {status === "connecting" ? "Connecting…" : "Realtime disconnected"}
      </span>
    </div>
  )
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null
  return (
    <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2">
      <span
        className={
          "rounded-full px-3 py-1 text-xs font-medium " +
          (status === "saving"
            ? "bg-bg-elevated text-text-faint"
            : status === "saved"
              ? "bg-bg-elevated text-text-secondary"
              : "bg-bg-elevated text-red-400")
        }
      >
        {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "Save failed"}
      </span>
    </div>
  )
}
