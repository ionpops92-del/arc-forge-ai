import type { CanvasEdgeData, CanvasEdgeLabelItem } from "@/types/canvas"

const MAX_EDGE_LABELS = 8

function cleanLabel(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 240) : ""
}

function cleanLabelId(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback
  const id = value.trim().slice(0, 120)
  return id || fallback
}

export function createEdgeLabelItems(
  texts: string[],
  previousItems: CanvasEdgeLabelItem[] = [],
  idPrefix = "label"
): CanvasEdgeLabelItem[] {
  return texts
    .map((text, index) => {
      const cleanText = cleanLabel(text)
      if (!cleanText) return null

      return {
        id: cleanLabelId(previousItems[index]?.id, `${idPrefix}-${index + 1}`),
        text: cleanText,
      }
    })
    .filter((item): item is CanvasEdgeLabelItem => item !== null)
    .slice(0, MAX_EDGE_LABELS)
}

export function normalizeEdgeLabelItems(
  data?: Pick<CanvasEdgeData, "label" | "labels" | "labelItems">
): CanvasEdgeLabelItem[] {
  const rawItems = Array.isArray(data?.labelItems) ? data.labelItems : []
  const labelItems = rawItems
    .map((item, index) => {
      const text = cleanLabel(item?.text)
      if (!text) return null

      return {
        id: cleanLabelId(item?.id, `label-${index + 1}`),
        text,
      }
    })
    .filter((item): item is CanvasEdgeLabelItem => item !== null)
    .slice(0, MAX_EDGE_LABELS)

  if (labelItems.length > 0) return labelItems

  const labels = Array.isArray(data?.labels)
    ? data.labels.map(cleanLabel).filter(Boolean)
    : []

  if (labels.length > 0) {
    return createEdgeLabelItems(labels, [], "label")
  }

  const legacyLabel = cleanLabel(data?.label)
  return legacyLabel ? createEdgeLabelItems([legacyLabel], [], "label") : []
}

export function mirrorEdgeLabelData(
  labelItems: CanvasEdgeLabelItem[]
): Pick<CanvasEdgeData, "label" | "labels" | "labelItems"> {
  const cleanItems = createEdgeLabelItems(
    labelItems.map((item) => item.text),
    labelItems,
    "label"
  )
  const labels = cleanItems.map((item) => item.text)

  return {
    label: labels[0] ?? "",
    labels,
    labelItems: cleanItems,
  }
}

export function edgeLabelTexts(data?: CanvasEdgeData): string[] {
  return normalizeEdgeLabelItems(data).map((item) => item.text)
}
