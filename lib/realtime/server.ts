import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http"
import { URL } from "node:url"
import { Prisma } from "@/app/generated/prisma/client"
import { prisma } from "@/lib/prisma"
import {
  parseRealtimeClientMessage,
  serializeRealtimeServerMessage,
} from "@/lib/realtime/protocol"
import { RealtimeRoomRegistry } from "@/lib/realtime/room-state"
import {
  RealtimeTokenError,
  verifyRealtimeRoomToken,
} from "@/lib/realtime/token"
import type { JsonValue, RealtimeTokenPayload } from "@/lib/realtime/types"
import { verifyRealtimeTokenProjectAccess } from "@/lib/realtime/access"
import { WebSocketServer, type RawData, type WebSocket } from "ws"

const DEFAULT_REALTIME_PORT = 3001

export interface RealtimeServerOptions {
  port?: number
  hostname?: string
}

export interface RunningRealtimeServer {
  server: Server
  close: () => Promise<void>
}

function toInputJson(value: JsonValue): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function writeHttpJson(
  response: ServerResponse,
  status: number,
  body: Record<string, string | number | boolean>
) {
  response.writeHead(status, { "content-type": "application/json" })
  response.end(JSON.stringify(body))
}

function rejectUpgrade(
  request: IncomingMessage,
  status: 400 | 401 | 403 | 404,
  message: string
) {
  request.socket.write(
    `HTTP/1.1 ${status} ${message}\r\nConnection: close\r\n\r\n`
  )
  request.socket.destroy()
}

function rawDataToString(data: RawData) {
  if (typeof data === "string") return data
  if (Buffer.isBuffer(data)) return data.toString("utf8")
  if (Array.isArray(data)) return Buffer.concat(data).toString("utf8")
  return Buffer.from(new Uint8Array(data)).toString("utf8")
}

async function authorizeUpgrade(request: IncomingMessage) {
  const url = new URL(request.url ?? "/", "http://localhost")

  if (url.pathname !== "/ws") {
    throw new RealtimeTokenError("Unknown realtime endpoint")
  }

  const token = url.searchParams.get("token")

  if (!token) {
    throw new RealtimeTokenError("Missing realtime token")
  }

  const payload = verifyRealtimeRoomToken(token)
  const hasAccess = await verifyRealtimeTokenProjectAccess(payload)

  if (!hasAccess) {
    throw new RealtimeTokenError("Realtime access was revoked")
  }

  return payload
}

async function persistRealtimeEvent(
  connection: RealtimeTokenPayload,
  eventType: string,
  payload: JsonValue
) {
  await prisma.realtimeRoomEvent.create({
    data: {
      projectId: connection.projectId,
      roomId: connection.roomId,
      userId: connection.userId,
      type: eventType,
      payloadJson: toInputJson(payload),
    },
  })
}

export function createRealtimeServer(options: RealtimeServerOptions = {}) {
  const port = options.port ?? DEFAULT_REALTIME_PORT
  const registry = new RealtimeRoomRegistry()
  const webSocketServer = new WebSocketServer({ noServer: true })
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost")

    if (request.method === "GET" && url.pathname === "/health") {
      writeHttpJson(response, 200, {
        status: "ok",
        service: "internal-realtime",
        uptimeSeconds: Math.floor(process.uptime()),
      })
      return
    }

    writeHttpJson(response, 404, { error: "Not found" })
  })

  server.on("upgrade", (request, socket, head) => {
    authorizeUpgrade(request)
      .then((payload) => {
        webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
          const connection = registry.join(webSocket, payload)

          console.info("[realtime] Client joined room", {
            roomId: payload.roomId,
            projectId: payload.projectId,
            userId: payload.userId,
          })

          webSocket.on("message", (rawData) => {
            const parsed = parseRealtimeClientMessage(rawDataToString(rawData))

            if (!parsed.ok) {
              registry.sendError(connection, parsed.error, "invalid_message")
              return
            }

            if (parsed.message.type === "presence.update") {
              registry.updatePresence(connection, parsed.message.presence)
              return
            }

            if (parsed.message.type === "room.ping") {
              registry.pong(connection, parsed.message.requestId)
              return
            }

            const roomEvent = parsed.message.event

            persistRealtimeEvent(payload, roomEvent.type, roomEvent.payload).catch((error: unknown) => {
              const message =
                error instanceof Error ? error.message : "Unknown error"
              console.warn("[realtime] Failed to persist room event", {
                roomId: payload.roomId,
                eventType: roomEvent.type,
                message,
              })
            })

            registry.broadcastEvent(connection, roomEvent)
          })

          webSocket.on("close", () => {
            registry.leave(connection)
            console.info("[realtime] Client left room", {
              roomId: payload.roomId,
              userId: payload.userId,
            })
          })

          webSocket.on("error", (error: Error) => {
            console.warn("[realtime] WebSocket error", {
              roomId: payload.roomId,
              userId: payload.userId,
              message: error.message,
            })
          })
        })
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Invalid realtime token"
        const status = message.includes("revoked") ? 403 : 401
        rejectUpgrade(request, status, status === 403 ? "Forbidden" : "Unauthorized")
      })
  })

  return {
    listen() {
      return new Promise<RunningRealtimeServer>((resolve) => {
        server.listen(port, options.hostname, () => {
          console.info("[realtime] Server started", { port })
          resolve({
            server,
            close: () =>
              new Promise<void>((closeResolve, closeReject) => {
                webSocketServer.clients.forEach((client: WebSocket) => {
                  client.send(
                    serializeRealtimeServerMessage({
                      type: "error",
                      message: "Realtime server is shutting down",
                      code: "server_shutdown",
                    })
                  )
                  client.close()
                })

                webSocketServer.close((webSocketError) => {
                  if (webSocketError) {
                    closeReject(webSocketError)
                    return
                  }

                  server.close((serverError) => {
                    if (serverError) {
                      closeReject(serverError)
                      return
                    }

                    closeResolve()
                  })
                })
              }),
          })
        })
      })
    },
  }
}
