import { RuntimeConfigError } from "@/lib/config/runtime-env"
import { LocalStorageProvider } from "@/lib/storage/local-storage-provider"
import { VercelBlobProvider } from "@/lib/storage/vercel-blob-provider"
import type { StorageProvider, StorageProviderName } from "@/lib/storage/types"

let cachedProvider: StorageProvider | null = null
let cachedProviderName: StorageProviderName | null = null

export function getStorageProviderName(): StorageProviderName {
  const configured = process.env.STORAGE_PROVIDER?.trim()
  if (!configured) return "local_fs"
  if (configured === "local_fs" || configured === "vercel_blob") return configured

  throw new RuntimeConfigError(
    "STORAGE_PROVIDER must be either local_fs or vercel_blob"
  )
}

export function getStorageProvider() {
  const providerName = getStorageProviderName()
  if (cachedProvider && cachedProviderName === providerName) return cachedProvider

  cachedProviderName = providerName
  cachedProvider =
    providerName === "vercel_blob"
      ? new VercelBlobProvider()
      : new LocalStorageProvider()

  return cachedProvider
}
