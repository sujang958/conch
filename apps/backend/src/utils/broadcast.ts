import { WebSocket } from "ws"

export const broadcast = (clients: Set<WebSocket>, data: string) => {
  clients.forEach(async (socket) => {
    if (socket.readyState !== socket.OPEN) return
    socket.send(data)
  })
}
