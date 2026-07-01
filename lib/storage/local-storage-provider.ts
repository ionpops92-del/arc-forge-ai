import path from "node:path"
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import { RuntimeConfigError } from "@/lib/config/runtime-env"
import type { StorageProvider, WriteObjectOptions } from "@/lib/storage/types"

export function normalizeStorageObjectPath(objectPath: string) {
  const normalized = objectPath.replace(/\\/g, "/").trim()
  if (!normalized || normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) {
    throw new Error("Storage object path must be relative")
  }

  const parts = normalized.split("/")
  if (parts.some((part) => !part || part === "." || part === ".." || part.includes("\0"))) {
    throw new Error("Storage object path contains an unsafe segment")
  }

  return path.posix.normalize(parts.join("/"))
}

function getLocalStorageRoot() {
  const configuredRoot = process.env.LOCAL_STORAGE_ROOT?.trim() || ".local-storage"
  if (path.isAbsolute(configuredRoot)) {
    return path.normalize(configuredRoot)
  }

  const normalizedRoot = configuredRoot.replace(/\\/g, "/").replace(/^\.\//, "")
  if (normalizedRoot === ".local-storage") {
    return path.join(process.cwd(), ".local-storage")
  }

  if (normalizedRoot.startsWith(".local-storage/")) {
    const childParts = normalizedRoot.slice(".local-storage/".length).split("/")
    if (
      childParts.some(
        (part) => !part || part === "." || part === ".." || part.includes("\0")
      )
    ) {
      throw new RuntimeConfigError("LOCAL_STORAGE_ROOT contains an unsafe segment")
    }

    return path.join(process.cwd(), ".local-storage", ...childParts)
  }

  throw new RuntimeConfigError(
    "LOCAL_STORAGE_ROOT must be .local-storage, a child of .local-storage, or an absolute path"
  )
}

function resolveLocalObjectPath(objectPath: string) {
  const root = getLocalStorageRoot()
  const normalizedObjectPath = normalizeStorageObjectPath(objectPath)
  const resolved = path.resolve(root, ...normalizedObjectPath.split("/"))
  const relative = path.relative(root, resolved)

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Storage object path escapes the local storage root")
  }

  return { normalizedObjectPath, resolved }
}

export class LocalStorageProvider implements StorageProvider {
  async writeTextObject(
    objectPath: string,
    content: string,
    options?: WriteObjectOptions
  ) {
    void options
    const { normalizedObjectPath, resolved } = resolveLocalObjectPath(objectPath)
    await mkdir(path.dirname(resolved), { recursive: true })
    await writeFile(resolved, content, "utf8")
    return normalizedObjectPath
  }

  async readTextObject(objectPath: string) {
    const { resolved } = resolveLocalObjectPath(objectPath)
    try {
      return await readFile(resolved, "utf8")
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null
      throw error
    }
  }

  async writeJsonObject<T>(
    objectPath: string,
    value: T,
    options?: WriteObjectOptions
  ) {
    return this.writeTextObject(
      objectPath,
      `${JSON.stringify(value, null, 2)}\n`,
      options ?? { contentType: "application/json" }
    )
  }

  async readJsonObject<T>(objectPath: string) {
    const content = await this.readTextObject(objectPath)
    if (content === null) return null
    return JSON.parse(content) as T
  }

  async deleteObject(objectPath: string) {
    const { resolved } = resolveLocalObjectPath(objectPath)
    await rm(resolved, { force: true })
  }

  async objectExists(objectPath: string) {
    const { resolved } = resolveLocalObjectPath(objectPath)
    try {
      const entry = await stat(resolved)
      return entry.isFile()
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false
      throw error
    }
  }
}
