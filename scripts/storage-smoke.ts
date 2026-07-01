import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { canvasSnapshotObjectPath, specMarkdownObjectPath } from "@/lib/storage/paths"
import { getStorageProvider } from "@/lib/storage/storage-provider"

async function expectRejects(action: () => Promise<unknown>, label: string) {
  try {
    await action()
  } catch {
    return
  }

  throw new Error(`${label} should have failed`)
}

async function main() {
  const root = await mkdtemp(path.join(os.tmpdir(), "arc-forge-storage-smoke-"))
  process.env.STORAGE_PROVIDER = "local_fs"
  process.env.LOCAL_STORAGE_ROOT = root

  try {
    const storage = getStorageProvider()

    const textPath = "smoke/readme.txt"
    await storage.writeTextObject(textPath, "hello storage", {
      contentType: "text/plain; charset=utf-8",
    })

    const text = await storage.readTextObject(textPath)
    if (text !== "hello storage") {
      throw new Error("text roundtrip failed")
    }

    const jsonPath = "smoke/data.json"
    await storage.writeJsonObject(jsonPath, { ok: true })
    const json = await storage.readJsonObject<{ ok: boolean }>(jsonPath)
    if (!json?.ok) {
      throw new Error("json roundtrip failed")
    }

    const canvasPath = canvasSnapshotObjectPath("project-smoke")
    await storage.writeJsonObject(canvasPath, { nodes: [], edges: [] })
    const canvas = await storage.readJsonObject<{ nodes: unknown[]; edges: unknown[] }>(
      canvasPath
    )
    if (!canvas || !Array.isArray(canvas.nodes) || !Array.isArray(canvas.edges)) {
      throw new Error("canvas roundtrip failed")
    }

    const specPath = specMarkdownObjectPath("project-smoke", "spec-smoke")
    await storage.writeTextObject(specPath, "# Smoke Spec\n")
    const spec = await storage.readTextObject(specPath)
    if (spec !== "# Smoke Spec\n") {
      throw new Error("spec roundtrip failed")
    }

    if (!(await storage.objectExists(specPath))) {
      throw new Error("objectExists failed")
    }

    await storage.deleteObject(specPath)
    if (await storage.objectExists(specPath)) {
      throw new Error("deleteObject failed")
    }

    await expectRejects(
      () => storage.writeTextObject("../escape.txt", "nope"),
      "path traversal"
    )

    console.log("storage smoke passed")
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
