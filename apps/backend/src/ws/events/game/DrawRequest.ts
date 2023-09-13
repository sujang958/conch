import { z } from "zod"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { gameHouseholds } from "../rooms.js"
import { getOrCreate } from "../../../utils/map.js"
import { playerInGameAction } from "../../../db/games.js"

const drawEventParam = z.object({
  gameId: z.string(),
})

const DrawEvent: EventFile = {
  name: "DRAW_REQUEST",
  execute: async ({ user, socket, ws }, arg) => {
    const parsed = drawEventParam.safeParse(JSON.parse(arg))

    if (!parsed.success) return
    if (!user) return

    const { gameId: rawGameId } = parsed.data

    const action = await playerInGameAction({ rawGameId, userId: user.id })

    if (!action)
      return socket.send(
        JSON.stringify({
          type: "ERROR",
          message: "You're not the players of the game",
        } satisfies EventRes),
      )

    const { gameId, players, color } = action

    await redisClient.set(`${gameId}:draw_requested_by`, user.id)

    const requestedTo = color == "white" ? "black" : "white"
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
