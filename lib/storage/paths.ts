function assertSafePathSegment(value: string, label: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed === "." || trimmed === "..") {
    throw new Error(`${label} must be a non-empty storage path segment`)
  }

  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("\0")) {
    throw new Error(`${label} must not contain path separators`)
  }

  return trimmed
}

export function canvasSnapshotObjectPath(projectId: string) {
  const safeProjectId = assertSafePathSegment(projectId, "projectId")
  return `canvas/${safeProjectId}.json`
}

export function canvasGraphObjectPath(projectId: string, graphId: string) {
  const safeProjectId = assertSafePathSegment(projectId, "projectId")
  const safeGraphId = assertSafePathSegment(graphId, "graphId")
  return `canvas/${safeProjectId}/graphs/${safeGraphId}.json`
}

export function specMarkdownObjectPath(projectId: string, specId: string) {
  const safeProjectId = assertSafePathSegment(projectId, "projectId")
  const safeSpecId = assertSafePathSegment(specId, "specId")
  return `specs/${safeProjectId}/${safeSpecId}.md`
}
