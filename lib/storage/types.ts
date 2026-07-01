export type StorageProviderName = "local_fs" | "vercel_blob"

export interface WriteObjectOptions {
  contentType?: string
}

export interface StorageProvider {
  writeTextObject(
    objectPath: string,
    content: string,
    options?: WriteObjectOptions
  ): Promise<string>
  readTextObject(objectPath: string): Promise<string | null>
  writeJsonObject<T>(
    objectPath: string,
    value: T,
    options?: WriteObjectOptions
  ): Promise<string>
  readJsonObject<T>(objectPath: string): Promise<T | null>
  deleteObject(objectPath: string): Promise<void>
  objectExists(objectPath: string): Promise<boolean>
}
