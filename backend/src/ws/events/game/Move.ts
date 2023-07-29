import { Chess } from "chess.js"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { verify } from "../../../auth/jwt.js"
import { broadcast } from "../../../utils/broadcast.js"
import { z } from "zod"
import { getOrCreate } from "../../../utils/map.js"
import { gameHouseholds } from "../rooms.js"
import { endReason, finishGame, getNewElo } from "../../../db/games.js"
import EloRank from "elo-rank"
import prisma from "../../../../prisma/prisma.js"
import { Square } from "chess.js"
import { PieceSymbol } from "chess.js"

const moveEventParam = z.object({
  gameId: z.string(),
  from: z.string(),
  to: z.string(),
  promotion: z.string().optional(),
})

const getVictoryStatus = (
  me: "white" | "black",
  winner: "white" | "black" | "draw",
) => {
  if (winner == "draw") return "DRAW"
  if (me == "black")
    return winner == "white" ? "LOST" : winner == "black" ? "WON" : "DRAW"
  else return winner == "white" ? "WON" : winner == "black" ? "LOST" : "DRAW"
}

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

      const households = getOrCreate(gameHouseholds, rawGameId, [])

      if (households.length < 1) return

      const chess = new Chess()

      chess.loadPgn(pgn)

      const turn = chess.turn()
      const turnFullname = turn == "w" ? "white" : "black"

      if (players[turnFullname] !== user.id) return

      const lastMovedTime = Number(time.lastMovedTime)
      const increment = Number(time.increment)

      const remainingTimeStr = time[turnFullname]
      const remainingTime = Number(remainingTimeStr)

      if (isNaN(remainingTime) || isNaN(lastMovedTime) || isNaN(increment))
        return

      const newRemainingTime = remainingTime - (now - lastMovedTime) + increment

      if (newRemainingTime <= 0) {
        const opponentColor = turn == "w" ? "black" : "white"

        const opponentPieces: { [key in PieceSymbol]: number } = {
          b: 0,
          p: 0,
          n: 0,
          r: 0,
          q: 0,
          k: 0,
        }

        chess.board().forEach((squares) => {
          squares
            .filter(
              (
                square,
              ): square is Exclude<
                ReturnType<typeof chess.board>[0][0],
                null
              > => square !== null,
            )
            .filter(
              (square) =>
                square.color == (opponentColor == "white" ? "w" : "b"),
            )
            .forEach((square) => {
              opponentPieces[square.type] += 1
            })
        })

        let winner: "draw" | "white" | "black" = "draw"

        if (
          opponentPieces.r > 0 ||
          opponentPieces.q > 0 ||
          opponentPieces.b >= 2 ||
          opponentPieces.n >= 2 ||
          (opponentPieces.n >= 1 && opponentPieces.b >= 1) ||
          opponentPieces.p > 0
        )
          winner = opponentColor
        else winner = "draw"

        const newElo = await getNewElo({
          whiteElo: Number(players.whiteElo),
          blackElo: Number(players.blackElo),
          winner,
        })

        finishGame({
          rawGameId,
          reason:
            winner == "draw" ? "TIMEOUT VS INSUFFICIENT_MATERIAL" : "TIMEOUT",
          newElo,
          players,
          winner,
        })

        const rawEventRes = {
          type: "GAME_END",
          newElo: {
            white: {
              now: newElo.white,
              change: newElo.white - Number(players.whiteElo),
            },
            black: {
              now: newElo.black,
              change: newElo.black - Number(players.blackElo),
            },
          },
          reason: "RESIGN",
          winnerId: players[winner],
        } satisfies EventRes
        const eventRes = JSON.stringify(rawEventRes)

        households
          .filter(({ id }) => players.white == id || players.black == id)
          .forEach(({ id, socket }) =>
            socket.send(
              JSON.stringify({
                ...rawEventRes,
                you: id == players[winner] ? "WON" : "LOST",
              } satisfies EventRes),
            ),
          )
        households.forEach(({ socket }) => socket.send(eventRes))

        return
      }

      chess.move({ from, to, promotion })

      const newPgn = chess.pgn()
      const newFen = chess.fen()

      await Promise.all([
        redisClient.set(`${gameId}:fen`, newFen),
        redisClient.set(`${gameId}:pgn`, newPgn),
        redisClient.hset(`${gameId}:time`, "lastMovedTime", now),
        redisClient.hset(`${gameId}:time`, turnFullname, newRemainingTime),
      ])

      const res = JSON.stringify({
        type: "BOARD",
        gameId: gameId,
        time: Object.fromEntries(
          Object.entries(await redisClient.hgetall(`${gameId}:time`)).map(
            ([name, value]) => [name, Number(value)],
          ),
        ),
        pgn: newPgn,
        fen: newFen,
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
        const winner = chess.isDraw()
          ? "draw"
          : chess.turn() == "b"
          ? "white"
          : "black"
        const reason = endReason(chess) ?? "DRAW"

        const newElo = await getNewElo({
          whiteElo: Number(players.whiteElo),
          blackElo: Number(players.blackElo),
          winner,
        })

        if (!newElo) return // SEND AN ERROR res

        finishGame({ rawGameId, players, reason, winner, newElo })

        const rawEventRes = {
          type: "GAME_END",
          newElo: {
            white: {
              now: newElo.white,
              change: newElo.white - Number(players.whiteElo),
            },
            black: {
              now: newElo.black,
              change: newElo.black - Number(players.blackElo),
            },
          },
          reason,
          winnerId: players[winner],
        } satisfies EventRes
        const eventRes = JSON.stringify(rawEventRes)

        households
          .filter(({ id }) => players.white == id || players.black == id)
          .forEach(({ id, socket }) =>
            socket.send(
              JSON.stringify({
                ...rawEventRes,
                you: getVictoryStatus(
                  players.white == id ? "white" : "black",
                  winner,
                ),
              } satisfies EventRes),
            ),
          )
        households.forEach(({ socket }) => socket.send(eventRes))

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
