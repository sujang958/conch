import { z } from "zod"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { gameHouseholds } from "../rooms.js"
import { getOrCreate } from "../../../utils/map.js"
import { getNewTime, playerInGameAction } from "../../../db/games.js"
import MoveEvent from "./Move.js"

const claimTimeoutEventParam = z.object({
  gameId: z.string(),
})

const ClaimTimeoutEvent: EventFile = {
  name: "CLAIM_TIMEOUT",
  execute: async ({ user, socket, ws }, arg) => {
    const parsed = claimTimeoutEventParam.safeParse(JSON.parse(arg))

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

    const { gameId, color } = action

    const requestedTo = color == "white" ? "black" : "white"
    const newRemainingTime = await getNewTime({
      time: await redisClient.hgetall(`${gameId}:time`),
      now: Date.now(),
      turn: requestedTo,
    })

    if (newRemainingTime > 0) return

    await redisClient.hset(`${gameId}:time`, requestedTo, 0)

    MoveEvent.execute(
      { socket, ws, user },
      JSON.stringify({
        gameId: rawGameId,
        from: "efjoefjoefjo",
        to: "efjoefjoefjoef",
        promotion: "efjoefjoefjoefjo",
      }),
    )
  },
}

export default ClaimTimeoutEvent
