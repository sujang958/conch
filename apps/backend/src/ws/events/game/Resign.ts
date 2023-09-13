import { z } from "zod"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { gameHouseholds } from "../rooms.js"
import { getOrCreate } from "../../../utils/map.js"
import {
  deleteFromRedisMoveToPostgres,
  getNewElo,
  sendGameEndEvent,
} from "../../../db/games.js"

const resignEventParam = z.object({
  gameId: z.string(),
  reason: z.literal("TIMEOUT").nullish(),
})

const ResignEvent: EventFile = {
  name: "RESIGN",
  execute: async ({ user, socket, ws }, arg) => {
    const parsed = resignEventParam.safeParse(JSON.parse(arg))

    if (!parsed.success) return

    const { gameId: rawGameId } = parsed.data
    const gameId = `game:${rawGameId}`

    if (!user) return
    if (
      socket.readyState == socket.CLOSED ||
      socket.readyState == socket.CLOSING
    )
      return

    const players = await redisClient.hgetall(`${gameId}:players`)

    if (players.white !== user.id && players.black !== user.id) return

    const winner = players.white == user.id ? "black" : "white"
    const reason = parsed.data.reason ?? "RESIGN"

    sendGameEndEvent({ rawGameId, players, reason, winner })
  },
}

export default ResignEvent
