import { config } from "dotenv"
import { runAiWorker } from "@/lib/ai-tasks/worker"

config({ path: ".env.local" })
config()

const controller = new AbortController()

process.on("SIGINT", () => controller.abort())
process.on("SIGTERM", () => controller.abort())

runAiWorker({ signal: controller.signal }).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown worker error"
  console.error("[ai-worker] Fatal startup error", { message })
  process.exit(1)
})
