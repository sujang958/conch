import { Chess } from "chess.js"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { z } from "zod"
import { getOrCreate } from "../../../utils/map.js"
import { gameHouseholds } from "../rooms.js"
import {
  getEndReason,
  getNewTime,
  isTimeoutVSInsufficientMaterial,
  sendGameEndEvent,
} from "../../../db/games.js"
import { propertyToNumber } from "../../../utils/object.js"

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

    try {
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

      const chess = new Chess()

      chess.loadPgn(pgn)

      const turn = chess.turn()
      const turnFullname = turn == "w" ? "white" : "black"
      const opponentColor = turnFullname == "white" ? "black" : "white"

      if (players[turnFullname] !== user.id) return

      const newRemainingTime = await getNewTime({
        time,
        now,
        turn: turnFullname,
      })

      if (newRemainingTime <= 0) {
        let winner: "draw" | "white" | "black" = "draw"

        if (
          !(await isTimeoutVSInsufficientMaterial({
            chess,
            timedOutColor: turnFullname,
          }))
        )
          winner = opponentColor
        else winner = "draw"

        const reason =
          winner == "draw" ? "TIMEOUT VS INSUFFICIENT_MATERIAL" : "TIMEOUT"

        sendGameEndEvent({ rawGameId, players, reason, winner })

        return
      }

      // --------AFTER MOVED-----------

      chess.move({ from, to, promotion })

      const newPgn = chess.pgn()
      const newFen = chess.fen()

      await Promise.all([
        redisClient.set(`${gameId}:fen`, newFen),
        redisClient.set(`${gameId}:pgn`, newPgn),
        redisClient.hset(`${gameId}:time`, "lastMovedTime", now),
        redisClient.hset(`${gameId}:time`, turnFullname, newRemainingTime),
      ])

      const households = getOrCreate(gameHouseholds, rawGameId, [])

      if (households.length < 1) return

      const [newTime, info] = await Promise.all([
        await redisClient.hgetall(`${gameId}:time`),
        await redisClient.hgetall(`${gameId}:info`),
      ])

      const res = JSON.stringify({
        type: "BOARD",
        gameId: gameId,
        time: propertyToNumber(newTime),
        info: propertyToNumber(info),
        pgn: newPgn,
        fen: newFen,
        players,
      } satisfies EventRes)

      households
        .filter(
          ({ socket }) =>
            socket.readyState !== socket.CLOSED &&
            socket.readyState !== socket.CLOSING,
        )
        .forEach(async ({ socket }) => {
          socket.send(res)
        })

      if (chess.isGameOver()) {
        const winner = chess.isDraw() ? "draw" : turnFullname
        const reason = getEndReason(chess) ?? "DRAW"

        sendGameEndEvent({ rawGameId, players, reason, winner })

        return
      }

      for (const i in households) {
        const { socket } = households[i]
        if (
          socket.readyState !== socket.CLOSED &&
          socket.readyState !== socket.CLOSING
        )
          continue
        delete households[i]
      }

      gameHouseholds.set(
        rawGameId,
        households.filter((v) => v),
      )
    } catch (e) {
      console.log(e)
    }
  },
}

export default MoveEvent
