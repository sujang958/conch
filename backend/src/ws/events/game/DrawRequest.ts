import { z } from "zod"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { gameHouseholds } from "../rooms.js"
import { getOrCreate } from "../../../utils/map.js"

const drawEventParam = z.object({
  gameId: z.string(),
})

const DrawEvent: EventFile = {
  name: "DRAW_REQUEST",
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

    const players = await redisClient.hgetall(`${gameId}:players`)

    if (players.white !== user.id && players.black !== user.id) return

    await redisClient.set(`${gameId}:draw_requested_by`, user.id)

    const requestedTo = players.white == user.id ? "black" : "white"

    const households = getOrCreate(gameHouseholds, rawGameId, [])

    const eventRes = JSON.stringify({
      type: "DRAW_REQUESTED",
      requestedBy: user.id,
      gameId: rawGameId,
    } satisfies EventRes)

    households
      .filter(({ id }) => id == players[requestedTo])
      .forEach(({ socket }) => {
        socket.send(eventRes)
      })
  },
}

export default DrawEvent
