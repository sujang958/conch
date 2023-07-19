import { WebSocket } from "ws"

export const gameRooms = new Map<string, WebSocket>()
