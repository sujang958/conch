import { Chess } from "chess.js"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { verify } from "../../../auth/jwt.js"
import { broadcast } from "../../../utils/broadcast.js"
import { z } from "zod"
import { getOrCreate } from "../../../utils/map.js"
import { gameHouseholds } from "../rooms.js"
import { endReason } from "../../../db/games.js"
import EloRank from "elo-rank"
import prisma from "../../../../prisma/prisma.js"

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

const getNewElo = async ({
  whiteElo,
  blackElo,
  winner,
}: {
  whiteElo: number
  blackElo: number
  winner: "black" | "white" | "draw"
}) => {
  const elo = new EloRank()

  const expectedWhite = elo.getExpected(whiteElo, blackElo)
  const expectedBlack = elo.getExpected(blackElo, whiteElo)

  let newWhiteElo = whiteElo
  let newBlackElo = blackElo

  if (winner == "draw") {
    newWhiteElo = elo.updateRating(expectedWhite, 0.5, whiteElo)
    newBlackElo = elo.updateRating(expectedBlack, 0.5, blackElo)
  } else if (winner == "white") {
    newWhiteElo = elo.updateRating(expectedWhite, 1, whiteElo)
    newBlackElo = elo.updateRating(expectedBlack, 0, blackElo)
  } else {
    newWhiteElo = elo.updateRating(expectedWhite, 0, whiteElo)
    newBlackElo = elo.updateRating(expectedBlack, 1, blackElo)
  }

  return { white: newWhiteElo, black: newBlackElo }
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
        return // TODO: send a GAME_END event and tell them who's the winner.
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
        // TODO: add logics for resigns
        const winner = chess.isDraw()
          ? "draw"
          : chess.turn() == "b"
          ? "white"
          : "black"

        const newElo = await getNewElo({
          whiteElo: Number(players.whiteElo),
          blackElo: Number(players.blackElo),
          winner,
        })

        if (!newElo) return // TODO: send an error res

        const gameInfo = await redisClient.hgetall(`${gameId}:info`)

        prisma.$transaction([
          prisma.user.update({
            where: { id: players.white },
            data: { elo: newElo.white },
          }),
          prisma.user.update({
            where: { id: players.black },
            data: { elo: newElo.black },
          }),
          prisma.game.create({
            data: {
              increment: Number(gameInfo.increment),
              time: Number(gameInfo.time),
              createdAt: new Date(Number(gameInfo.createdAt)),
              pgn: chess.pgn(),
              black: { connect: { id: players.black } },
              white: { connect: { id: players.white } },
              ...(players[winner] && {
                winner: { connect: { id: players[winner] } },
              }),
            },
          }),
        ])

        const rawEventRes: EventRes = {
          type: "GAME_END",
          reason: endReason(chess) ?? "DRAW",
          newElo: {
            white: {
              now: newElo.white,
              change: newElo.white - Number(players.whiteElo), // TODO: maybe add a NaN filter
            },
            black: {
              now: newElo.black,
              change: newElo.black - Number(players.blackElo),
            },
          },
          winnerId: players[winner] ?? null,
        }
        const eventRes = JSON.stringify(rawEventRes)

        households.forEach(({ id, socket }) =>
          socket.send(
            players.white == id || players.black == id
              ? JSON.stringify({
                  ...rawEventRes,
                  you: getVictoryStatus(
                    players.white == id ? "white" : "black",
                    winner,
                  ),
                } satisfies EventRes)
              : eventRes,
          ),
        )

        const keys = await redisClient.keys(`${gameId}:*`)

        await redisClient.del(keys)

        return
      }

      // TODO: implement ties and resigns

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
