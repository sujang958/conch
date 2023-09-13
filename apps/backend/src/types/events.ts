import { WebSocket, WebSocketServer } from "ws"
import { z } from "zod"

export const eventFile = z.object({
  name: z.string(),
  execute: z
    .function()
    .args(
      z.object({
        user: z
          .object({
            id: z.string(),
          })
          .nullish(),
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
    gameId: z.string(),
  }),
  z.object({
    type: z.literal("BOARD"),
    gameId: z.string(),
    pgn: z.string(),
    fen: z.string(),
    time: z.record(z.string(), z.number()),
    info: z.record(z.string(), z.number()),
    players: z.record(z.string(), z.string()),
    for: z.union([z.literal("white"), z.literal("black")]).nullish(),
  }),
  z.object({
    type: z.literal("GAME_END"),
    reason: z.union([
      z.literal("STALEMATE"),
      z.literal("REPETITION"),
      z.literal("CHECKMATE"),
      z.literal("DRAW"),
      z.literal("INSUFFICIENT_MATERIAL"),
      z.literal("RESIGN"),
      z.literal("TIMEOUT"),
      z.literal("TIMEOUT VS INSUFFICIENT_MATERIAL"),
    ]),
    winnerId: z.string().nullish(),
    you: z
      .union([z.literal("WON"), z.literal("LOST"), z.literal("DRAW")])
      .nullish(),
    newElo: z.object({
      white: z.object({
        now: z.number(),
        change: z.number(),
      }),
      black: z.object({
        now: z.number(),
        change: z.number(),
      }),
    }),
  }),
  z.object({
    type: z.literal("DRAW_REQUESTED"),
    gameId: z.string(),
    requestedBy: z.string(),
  }),
  z.object({
    type: z.literal("DRAW_RESPONSE"),
    gameId: z.string(),
    accepted: z.boolean(),
  }),
  z.object({
    type: z.literal("ERROR"),
    message: z.string(),
  }),
  z.object({
    type: z.literal("NOT_FOUND"),
  }),
])

export type EventRes = z.infer<typeof eventRes>

export type GameEndReason = Extract<EventRes, { type: "GAME_END" }>["reason"]
