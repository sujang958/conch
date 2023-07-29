import { z } from "zod"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { gameHouseholds } from "../rooms.js"
import { getOrCreate } from "../../../utils/map.js"
import { finishGame, getNewElo } from "../../../db/games.js"

const drawEventParam = z.object({
  gameId: z.string(),
  accepted: z.boolean(),
})

const DrawEvent: EventFile = {
  name: "DRAW_ACCEPT",
  execute: async ({ user, socket, ws }, arg) => {
    const parsed = drawEventParam.safeParse(JSON.parse(arg))

    if (!parsed.success) return

    const { gameId: rawGameId, accepted } = parsed.data
    const gameId = `game:${rawGameId}`

    if (!user) return
    if (
      socket.readyState == socket.CLOSED ||
      socket.readyState == socket.CLOSING
    )
      return

    const [players, drawRequestedBy] = await Promise.all([
      await redisClient.hgetall(`${gameId}:players`),
      await redisClient.get(`${gameId}:draw_requested_by`),
    ])

    if (players.white !== user.id && players.black !== user.id) return
    if (user.id == drawRequestedBy) return

    const households = getOrCreate(gameHouseholds, rawGameId, [])

    const newElo = await getNewElo({
      whiteElo: Number(players.whiteElo),
      blackElo: Number(players.blackElo),
      winner: "draw",
    })

    finishGame({
      rawGameId,
      newElo,
      players,
      reason: "DRAW",
      winner: "draw",
    })

    const eventRes = JSON.stringify({
      type: "DRAW_RESULT",
      accepted,
      gameId: rawGameId,
    } satisfies EventRes)

    // TODO: debug draw

    households
      .filter(({ id }) => id == drawRequestedBy)
      .forEach(({ socket }) => {
        socket.send(eventRes)
      })
  },
}

export default DrawEvent
