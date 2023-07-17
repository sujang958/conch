import { WebSocket, WebSocketServer } from "ws"
import { z } from "zod"

export const eventFile = z.object({
  name: z.string(),
  execute: z
    .function()
    .args(
      z.object({
        cookie: z.record(z.string(), z.string()),
        socket: z.instanceof(WebSocket),
        ws: z.instanceof(WebSocketServer),
      }),
      z.string(),
    )
    .returns(z.any()),
})

export type EventFile = z.infer<typeof eventFile>

export const eventRes = z.union([
  z.object({
    type: z.literal("JOIN_GAME"),
    participants: z.array(z.string()),
    pgn: z.string({ description: "For those who reconnect" }).nullish(),
  }),
  z.object({
    type: z.literal("NEW_BOARD"),
    gameId: z.string(),
    move: z.string(),
    time: z.record(z.string(), z.string()),
  }),
  z.object({
    type: z.literal("GAME_END"),
  }),
])

export type EventRes = z.infer<typeof eventRes>
