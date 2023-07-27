import { z } from "zod"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { gameHouseholds } from "../rooms.js"
import { getOrCreate } from "../../../utils/map.js"

const drawEventParam = z.object({
  gameId: z.string(),
})

const DrawEvent: EventFile = {
  name: "DRAW",
  execute: async ({ user, socket, ws }, arg) => {
    const parsed = drawEventParam.safeParse(JSON.parse(arg))

    if (!parsed.success) return

    const { gameId: rawGameId } = parsed.data
    const gameId = `game:${rawGameId}`

    if (!user) return
    if (
      socket.readyState == socket.CLOSED ||
      socket.readyState == socket.CLOSING
    )
      return

    const [pgn, fen, time, players] = await Promise.all([
      await redisClient.get(`${gameId}:pgn`),
      await redisClient.get(`${gameId}:fen`),
      await redisClient.hgetall(`${gameId}:time`),
      await redisClient.hgetall(`${gameId}:players`),
    ])

    if (pgn == null || !fen || !time) return

    if (players.white !== user.id && players.black !== user.id) return

    const requestedTo = players.white == user.id ? "black" : "white"

    const households = getOrCreate(gameHouseholds, rawGameId, [])

    const eventRes = JSON.stringify({
      type: "DRAW_REQUESTED",
      requestedBy: user.id,
    } satisfies EventRes)

    households
      .filter(({ id }) => id == players[requestedTo])
      .forEach(({ socket }) => {
        socket.send(eventRes)
      })
  },
}

export default DrawEvent
