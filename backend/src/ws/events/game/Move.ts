import { Chess } from "chess.js"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { verify } from "../../../auth/jwt.js"
import { broadcast } from "../../../utils/broadcast.js"
import { z } from "zod"

const moveEventParam = z.object({
  gameId: z.string(),
  from: z.string(),
  to: z.string(),
  promotion: z.string().optional(),
})

const MoveEvent: EventFile = {
  name: "MOVE",
  execute: async ({ ws, cookie }, arg) => {
    const now = Date.now()

    // TODO: validate a token from cookies and if not valid, don't make a move

    const parsedArg = moveEventParam.safeParse(JSON.parse(arg))

    if (!parsedArg.success) return

    const { gameId: rawGameId, from, to, promotion } = parsedArg.data

    const gameId = `game:${rawGameId}`

    const [pgn, players, time, user] = await Promise.all([
      redisClient.get(`${gameId}:pgn`),
      redisClient.hGetAll(`${gameId}:players`),
      redisClient.hGetAll(`${gameId}:time`),
      verify(cookie.token),
    ])

    if (!pgn || !user || !players || !time) return // what about creating them instead of returning?

    const foundTurn = Object.entries(players).find(
      ([_, value]) => value == user.id,
    )

    if (!foundTurn) return

    const turn = foundTurn[1].toLowerCase() == "white" ? "w" : "b"
    const turnFullname = turn == "w" ? "white" : "black"

    const lastMovedTime = Number(time.lastMovedTime)
    const increment = Number(time.increment)

    const remainingTimeStr = time[turnFullname]
    const remainingTime = Number(remainingTimeStr)

    if (isNaN(remainingTime) || isNaN(lastMovedTime) || isNaN(increment)) return

    const newRemainingTime = remainingTime - (now - lastMovedTime) + increment

    if (newRemainingTime <= 0) {
      return // TODO: send a GAME_END event and tell them who's the winner.
    }

    const chess = new Chess()

    chess.loadPgn(pgn)

    if (chess.turn() !== turn) return

    const move = chess.move({ from, to, promotion })

    const newPgn = chess.pgn()

    await Promise.all([
      redisClient.set(`${gameId}:fen`, chess.fen()),
      redisClient.set(`${gameId}:pgn`, newPgn),
      redisClient.hSet(`${gameId}:time`, "lastMovedTime", now),
      redisClient.hSet(`${gameId}:time`, turnFullname, newRemainingTime),
    ])

    broadcast(
      ws.clients,
      JSON.stringify({
        type: "NEW_BOARD",
        gameId: gameId,
        time: await redisClient.hGetAll(`${gameId}`),
        move: move.san,
      } satisfies EventRes),
    )
  },
}

export default MoveEvent
