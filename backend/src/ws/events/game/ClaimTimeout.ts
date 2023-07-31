import { z } from "zod"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { gameHouseholds } from "../rooms.js"
import { getOrCreate } from "../../../utils/map.js"
import {
  getNewTime,
  isTimeoutVSInsufficientMaterial,
  playerInGameAction,
  sendGameEndEvent,
} from "../../../db/games.js"
import MoveEvent from "./Move.js"
import { Chess, DEFAULT_POSITION } from "chess.js"

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

    const { gameId, color, players } = action

    const requestedTo = color == "white" ? "black" : "white"
    const newRemainingTime = await getNewTime({
      time: await redisClient.hgetall(`${gameId}:time`),
      now: Date.now(),
      turn: requestedTo,
    })

    if (newRemainingTime > 0) return

    const fen = await redisClient.get(`${gameId}:fen`)

    if (fen == null)
      return socket.send(
        JSON.stringify({
          type: "ERROR",
          message: "Can't find the board",
        } satisfies EventRes),
      )

    await redisClient.hset(`${gameId}:time`, requestedTo, 0)

    const chess = new Chess(fen)

    let winner: "draw" | "white" | "black" = "draw"
    if (
      !(await isTimeoutVSInsufficientMaterial({
        chess,
        timedOutColor: requestedTo,
      }))
    )
      winner = color
    else winner = "draw"

    const reason =
      winner == "draw" ? "TIMEOUT VS INSUFFICIENT_MATERIAL" : "TIMEOUT"
    const households = getOrCreate(gameHouseholds, rawGameId, [])

    sendGameEndEvent({
      rawGameId,
      households,
      players,
      reason,
      winner,
    })

    return
  },
}

export default ClaimTimeoutEvent
