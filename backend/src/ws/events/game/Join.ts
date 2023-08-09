import { z } from "zod"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { gameHouseholds } from "../rooms.js"
import { getOrCreate } from "../../../utils/map.js"

const joinEventParam = z.object({
  gameId: z.string(),
})

const JoinEvent: EventFile = {
  name: "JOIN",
  execute: async ({ user, socket, ws }, arg) => {
    const parsed = joinEventParam.safeParse(JSON.parse(arg))

    if (!parsed.success) return

    const { gameId: rawGameId } = parsed.data
    const gameId = `game:${rawGameId}`

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

    if (pgn == null || !fen || !time) {
      socket.send(JSON.stringify({ type: "NOT_FOUND" } satisfies EventRes))
      socket.close()

      return
    }

    const households = getOrCreate(gameHouseholds, rawGameId, [])

    households.push({ socket, id: user?.id ?? null })

    const res = JSON.stringify({
      type: "BOARD",
      gameId: rawGameId,
      pgn,
      fen,
      players,
      time: Object.fromEntries(
        Object.entries(time).map(([name, value]) => [name, Number(value)]),
      ),
      ...(user && players.white == user.id && { for: "white" }),
      ...(user && players.black == user.id && { for: "black" }),
    } satisfies EventRes)

    socket.send(res)
  },
}

export default JoinEvent
