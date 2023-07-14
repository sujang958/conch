import { WebSocket } from "ws"

export type EventFile = {
  name: string
  execute: (socket: WebSocket, args: string) => any
}
