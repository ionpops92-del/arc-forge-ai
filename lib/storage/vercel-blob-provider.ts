import { del, get, put } from "@vercel/blob"
import type { StorageProvider, WriteObjectOptions } from "@/lib/storage/types"

function requireBlobToken() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN must be set when STORAGE_PROVIDER=vercel_blob")
  }
}

export class VercelBlobProvider implements StorageProvider {
  async writeTextObject(
    objectPath: string,
    content: string,
    options?: WriteObjectOptions
  ) {
    requireBlobToken()
    const blob = await put(objectPath, content, {
      access: "private",
      contentType: options?.contentType ?? "text/plain; charset=utf-8",
      addRandomSuffix: false,
      allowOverwrite: true,
    })

    return blob.url
  }

  async readTextObject(objectPath: string) {
    requireBlobToken()
    const result = await get(objectPath, { access: "private" })
    if (!result || result.statusCode !== 200 || !result.stream) return null
    return new Response(result.stream).text()
  }

  async writeJsonObject<T>(
    objectPath: string,
    value: T,
    options?: WriteObjectOptions
  ) {
    return this.writeTextObject(objectPath, JSON.stringify(value), {
      contentType: options?.contentType ?? "application/json",
    })
  }

  async readJsonObject<T>(objectPath: string) {
    const content = await this.readTextObject(objectPath)
    if (content === null) return null
    return JSON.parse(content) as T
  }

  async deleteObject(objectPath: string) {
    requireBlobToken()
    await del(objectPath)
  }

  async objectExists(objectPath: string) {
    return (await this.readTextObject(objectPath)) !== null
  }
}
