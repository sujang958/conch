import { Chess } from "chess.js"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { verify } from "../../../auth/jwt.js"
import { broadcast } from "../../../utils/broadcast.js"
import { z } from "zod"
import { getOrCreate } from "../../../utils/map.js"
import { gameHouseholds } from "../rooms.js"

const moveEventParam = z.object({
  gameId: z.string(),
  from: z.string(),
  to: z.string(),
  promotion: z.string().optional(),
})

const MoveEvent: EventFile = {
  name: "MOVE",
  execute: async ({ ws, user }, arg) => {
    if (!user) return

    const now = Date.now()

    const parsedArg = moveEventParam.safeParse(JSON.parse(arg))

    if (!parsedArg.success) return

    const { gameId: rawGameId, from, to, promotion } = parsedArg.data

    const gameId = `game:${rawGameId}`

    const [pgn, players, time] = await Promise.all([
      redisClient.get(`${gameId}:pgn`),
      redisClient.hgetall(`${gameId}:players`),
      redisClient.hgetall(`${gameId}:time`),
    ])

    if (pgn === null || !user || !players || !time) return

    const foundTurn = Object.entries(players).find(
      ([_, value]) => value == user.id,
    )

    if (!foundTurn) return

    const requestedTurn = foundTurn[0].toLowerCase() == "white" ? "w" : "b"
    const requestedTurnFullname = requestedTurn == "w" ? "white" : "black"

    const lastMovedTime = Number(time.lastMovedTime)
    const increment = Number(time.increment)

    const remainingTimeStr = time[requestedTurnFullname]
    const remainingTime = Number(remainingTimeStr)

    if (isNaN(remainingTime) || isNaN(lastMovedTime) || isNaN(increment)) return

    const newRemainingTime = remainingTime - (now - lastMovedTime) + increment

    if (newRemainingTime <= 0) {
      return // TODO: send a GAME_END event and tell them who's the winner.
    }

    const chess = new Chess()

    chess.loadPgn(pgn)

    if (chess.turn() !== requestedTurn) return

    chess.move({ from, to, promotion })

    const newPgn = chess.pgn()

    await Promise.all([
      redisClient.set(`${gameId}:fen`, chess.fen()),
      redisClient.set(`${gameId}:pgn`, newPgn),
      redisClient.hset(`${gameId}:time`, "lastMovedTime", now),
      redisClient.hset(
        `${gameId}:time`,
        requestedTurnFullname,
        newRemainingTime,
      ),
    ])

    const households = getOrCreate(gameHouseholds, rawGameId, [])

    if (households.length < 1) return

    const res = JSON.stringify({
      type: "BOARD",
      gameId: gameId,
      time: Object.fromEntries(
        Object.entries(await redisClient.hgetall(`${gameId}:time`)).map(
          ([name, value]) => [name, Number(value)],
        ),
      ),
      pgn: newPgn,
    } satisfies EventRes)

    households
      .filter(
        (household) =>
          household.readyState !== household.CLOSED &&
          household.readyState !== household.CLOSING,
      )
      .forEach(async (household) => {
        household.send(res)
      })

    for (const i in households) {
      const household = households[i]
      if (
        household.readyState !== household.CLOSED &&
        household.readyState !== household.CLOSING
      )
        continue
      delete households[i]
    }

    gameHouseholds.set(
      rawGameId,
      households.filter((v) => v),
    )
  },
}

export default MoveEvent
