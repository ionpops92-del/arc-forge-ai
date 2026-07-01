export type JsonPrimitive = string | number | boolean | null

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue }

export interface RealtimeTokenPayload {
  sub: string
  userId: string
  projectId: string
  roomId: string
  iat: number
  exp: number
}

export type RealtimePresence = Record<string, JsonValue>

export interface RealtimePresenceRecord {
  connectionId: string
  userId: string
  presence: RealtimePresence | null
}

export interface RealtimeRoomEvent {
  type: string
  payload: JsonValue
}

export interface RealtimeClientPresenceUpdate {
  type: "presence.update"
  presence: RealtimePresence | null
}

export interface RealtimeClientPing {
  type: "room.ping"
  requestId?: string
}

export interface RealtimeClientEventBroadcast {
  type: "event.broadcast"
  event: RealtimeRoomEvent
}

export type RealtimeClientMessage =
  | RealtimeClientPresenceUpdate
  | RealtimeClientPing
  | RealtimeClientEventBroadcast

export interface RealtimeServerRoomJoined {
  type: "room.joined"
  roomId: string
  projectId: string
  userId: string
  connectionId: string
}

export interface RealtimeServerPresenceSnapshot {
  type: "presence.snapshot"
  roomId: string
  presence: RealtimePresenceRecord[]
}

export interface RealtimeServerPresenceUpdated {
  type: "presence.updated"
  roomId: string
  userId: string
  connectionId: string
  presence: RealtimePresence | null
}

export interface RealtimeServerEventBroadcast {
  type: "event.broadcast"
  roomId: string
  userId: string
  connectionId: string
  event: RealtimeRoomEvent
}

export interface RealtimeServerPong {
  type: "room.pong"
  requestId?: string
}

export interface RealtimeServerError {
  type: "error"
  message: string
  code?: string
}

export type RealtimeServerMessage =
  | RealtimeServerRoomJoined
  | RealtimeServerPresenceSnapshot
  | RealtimeServerPresenceUpdated
  | RealtimeServerEventBroadcast
  | RealtimeServerPong
  | RealtimeServerError
