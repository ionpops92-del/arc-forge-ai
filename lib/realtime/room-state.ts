import { randomUUID } from "node:crypto"
import { WebSocket } from "ws"
import { serializeRealtimeServerMessage } from "@/lib/realtime/protocol"
import type {
  RealtimePresence,
  RealtimeRoomEvent,
  RealtimeServerMessage,
  RealtimeTokenPayload,
} from "@/lib/realtime/types"

interface RoomConnection {
  id: string
  socket: WebSocket
  userId: string
  projectId: string
  roomId: string
  presence: RealtimePresence | null
}

export class RealtimeRoomRegistry {
  private rooms = new Map<string, Map<string, RoomConnection>>()

  join(socket: WebSocket, tokenPayload: RealtimeTokenPayload) {
    const connection: RoomConnection = {
      id: randomUUID(),
      socket,
      userId: tokenPayload.userId,
      projectId: tokenPayload.projectId,
      roomId: tokenPayload.roomId,
      presence: null,
    }

    const room = this.getOrCreateRoom(connection.roomId)
    room.set(connection.id, connection)

    this.send(connection, {
      type: "room.joined",
      roomId: connection.roomId,
      projectId: connection.projectId,
      userId: connection.userId,
      connectionId: connection.id,
    })
    this.sendPresenceSnapshot(connection)

    return connection
  }

  leave(connection: RoomConnection) {
    const room = this.rooms.get(connection.roomId)

    if (!room) return

    room.delete(connection.id)

    if (room.size === 0) {
      this.rooms.delete(connection.roomId)
    } else {
      this.broadcastPresence(connection, null)
    }
  }

  updatePresence(
    connection: RoomConnection,
    presence: RealtimePresence | null
  ) {
    connection.presence = presence
    this.broadcastPresence(connection, presence)
  }

  pong(connection: RoomConnection, requestId?: string) {
    this.send(connection, {
      type: "room.pong",
      requestId,
    })
  }

  broadcastEvent(connection: RoomConnection, event: RealtimeRoomEvent) {
    this.broadcastToRoom(connection, {
      type: "event.broadcast",
      roomId: connection.roomId,
      userId: connection.userId,
      connectionId: connection.id,
      event,
    })
  }

  sendError(connection: RoomConnection, message: string, code?: string) {
    this.send(connection, {
      type: "error",
      message,
      code,
    })
  }

  private getOrCreateRoom(roomId: string) {
    const existing = this.rooms.get(roomId)
    if (existing) return existing

    const room = new Map<string, RoomConnection>()
    this.rooms.set(roomId, room)
    return room
  }

  private sendPresenceSnapshot(connection: RoomConnection) {
    const room = this.rooms.get(connection.roomId)
    const presence = room
      ? Array.from(room.values()).map((peer) => ({
          connectionId: peer.id,
          userId: peer.userId,
          presence: peer.presence,
        }))
      : []

    this.send(connection, {
      type: "presence.snapshot",
      roomId: connection.roomId,
      presence,
    })
  }

  private broadcastPresence(
    connection: RoomConnection,
    presence: RealtimePresence | null
  ) {
    this.broadcastToRoom(connection, {
      type: "presence.updated",
      roomId: connection.roomId,
      userId: connection.userId,
      connectionId: connection.id,
      presence,
    })
  }

  private broadcastToRoom(
    source: RoomConnection,
    message: RealtimeServerMessage
  ) {
    const room = this.rooms.get(source.roomId)
    if (!room) return

    for (const peer of room.values()) {
      if (peer.id !== source.id) {
        this.send(peer, message)
      }
    }
  }

  private send(connection: RoomConnection, message: RealtimeServerMessage) {
    if (connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(serializeRealtimeServerMessage(message))
    }
  }
}

export type RealtimeRoomConnection = ReturnType<RealtimeRoomRegistry["join"]>
