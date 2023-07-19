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

    const { gameId } = parsed.data

    const households = getOrCreate(gameHouseholds, gameId, [])

    if (socket.CLOSED || socket.CLOSING) return

    households.push(socket)

    const [pgn, time] = await Promise.all([
      await redisClient.get(`${gameId}:pgn`),
      await redisClient.hGetAll(`${gameId}:time`),
    ])

    const res = JSON.stringify({
      type: "BOARD",
      gameId,
      pgn: pgn ?? "",
      time: Object.fromEntries(
        Object.entries(time).map(([name, value]) => [name, Number(value)]),
      ),
    } satisfies EventRes)

    socket.send(res)
  },
}

export default JoinEvent
