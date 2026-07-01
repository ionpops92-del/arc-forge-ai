import { config } from "dotenv"
import { createRealtimeServer } from "@/lib/realtime/server"

config({ path: ".env.local" })
config()

const port = Number.parseInt(process.env.REALTIME_PORT ?? "3001", 10)
const realtimeServer = createRealtimeServer({ port })

let closing = false

realtimeServer
  .listen()
  .then((runningServer) => {
    const close = () => {
      if (closing) return
      closing = true

      runningServer
        .close()
        .then(() => {
          console.info("[realtime] Server stopped")
          process.exit(0)
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : "Unknown shutdown error"
          console.error("[realtime] Shutdown failed", { message })
          process.exit(1)
        })
    }

    process.on("SIGINT", close)
    process.on("SIGTERM", close)
  })
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unknown realtime startup error"
    console.error("[realtime] Fatal startup error", { message })
    process.exit(1)
  })
