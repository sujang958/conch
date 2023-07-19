import { z } from "zod"
import { verify } from "../../../auth/jwt.js"
import { EventFile, EventRes } from "../../../types/events.js"
import { broadcast } from "../../../utils/broadcast.js"
import { redisClient } from "../../../db/redis.js"

const joinEventParam = z.object({
  gameId: z.string(),
})

const JoinEvent: EventFile = {
  name: "JOIN",
  execute: async ({ user, socket, ws }, arg) => {
    const parsed = joinEventParam.safeParse(JSON.parse(arg))

    if (!parsed.success) return

    const { gameId } = parsed.data

    const [pgn, time] = await Promise.all([
      await redisClient.get(`${gameId}:pgn`),
      await redisClient.hGetAll(`${gameId}:time`),
    ])

    broadcast(
      ws.clients,
      JSON.stringify({
        type: "BOARD",
        gameId,
        pgn: pgn ?? "",
        time: Object.fromEntries(
          Object.entries(time).map(([name, value]) => [name, Number(value)]),
        ),
      } satisfies EventRes),
    )
  },
}

export default JoinEvent
