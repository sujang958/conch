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

const getNewElo = async ({
  white,
  black,
  winner,
}: {
  white: string
  black: string
  winner: "black" | "white" | "draw"
}) => {
  const elo = new EloRank()

  const [whiteUser, blackUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: white } }),
    prisma.user.findUnique({
      where: { id: black },
    }),
  ])

  if (!whiteUser || !blackUser) return null // TODO: send an ERROR event

  const whiteElo = whiteUser.elo
  const blackElo = blackUser.elo

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
          (household) =>
            household.readyState !== household.CLOSED &&
            household.readyState !== household.CLOSING,
        )
        .forEach(async (household) => {
          household.send(res)
        })

      if (chess.isGameOver()) {
        // TODO: add logics for resigns
        const winner = chess.isDraw()
          ? "draw"
          : chess.turn() == "b"
          ? "white"
          : "black"

        const newElo = await getNewElo({
          white: players.white,
          black: players.black,
          winner,
        })

        if (!newElo) return // TODO: send an error res

        const eventRes = JSON.stringify({
          type: "GAME_END",
          reason: endReason(chess) ?? "DRAW",
          newElo,
          winnerId: players[winner] ?? null,
        } satisfies EventRes)

        households.forEach((household) => household.send(eventRes))

        const gameInfo = await redisClient.hgetall(`${gameId}:info`)
        gameInfo.time

        await prisma.game.create({
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
        })

        const keys = await redisClient.keys(`${gameId}:*`)

        await redisClient.del(keys)

        return
      }

      // TODO: implement ties and resigns

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
    } catch (e) {
      console.log(e)
    }
  },
}

export default MoveEvent
