import { nanoid } from "nanoid"
import { redisClient } from "./redis.js"
import { Chess } from "chess.js"
import prisma from "../../prisma/prisma.js"
import { getOrCreate } from "../utils/map.js"
import { gameHouseholds } from "../ws/events/rooms.js"
import { EventRes } from "../types/events.js"
import EloRank from "elo-rank"

export const getNewElo = async ({
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

export const createGame = async ({
  players,
  time,
  increment,
}: {
  players: [string, string]
  /**
   * in seconds
   */
  time: number
  /**
   * in seconds
   */
  increment: number
}) => {
  let id = nanoid(23)
  while (true) {
    const duplicationCheck = await redisClient.get(`game:${id}:players`)
    if (!duplicationCheck) break
    id = nanoid(23)
  }

  const gameId = `game:${id}`
  const board = new Chess()

  const coloredPlayers =
    Math.random() > 0.5
      ? { white: players[0], black: players[1] }
      : { white: players[1], black: players[0] }

  const [white, black] = await Promise.all([
    prisma.user.findUnique({
      where: { id: coloredPlayers.white },
    }),
    prisma.user.findUnique({
      where: { id: coloredPlayers.black },
    }),
  ])

  if (!white || !black) return null

  const timeInMS = time * 1000
  const incrementInMS = increment * 1000

  await Promise.all([
    redisClient.hset(`${gameId}:players`, {
      ...coloredPlayers,
      whiteElo: white.elo,
      blackElo: black.elo,
    }),
    redisClient.set(`${gameId}:fen`, board.fen()),
    redisClient.set(`${gameId}:pgn`, board.pgn()),
    redisClient.hset(`${gameId}:info`, {
      time,
      increment,
      createdAt: Date.now(),
    }),
    redisClient.hset(`${gameId}:time`, {
      white: timeInMS,
      black: timeInMS,
      lastMovedTime: Date.now(),
      increment: incrementInMS,
    }),
  ])

  return id
}

export const endReason = (chess: Chess) => {
  if (!chess.isGameOver()) return null

  if (chess.isInsufficientMaterial()) return "INSUFFICIENT_MATERIAL"
  if (chess.isThreefoldRepetition()) return "REPETITION"
  if (chess.isStalemate()) return "STALEMATE"
  if (chess.isCheckmate()) return "CHECKMATE"

  return null
}

export const finishGame = async ({
  rawGameId,
  players,
  winner,
  reason,
  newElo,
}: {
  rawGameId: string
  players: Record<string, string>
  winner: "white" | "black" | "draw"
  reason: Extract<EventRes, { type: "GAME_END" }>["reason"]
  newElo: Awaited<ReturnType<typeof getNewElo>>
}) => {
  if (!newElo) return null

  const gameId = rawGameId.startsWith("game:") ? rawGameId : `game:${rawGameId}`

  const gameInfo = await redisClient.hgetall(`${gameId}:info`)
  const pgn = await redisClient.get(`${gameId}:pgn`)

  if (pgn == null) return null

  const keys = await redisClient.keys(`${gameId}:*`)

  redisClient.del(...keys)

  const [_, __, game] = await prisma.$transaction([
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
        reason,
        createdAt: new Date(Number(gameInfo.createdAt)),
        pgn,
        black: { connect: { id: players.black } },
        white: { connect: { id: players.white } },
        ...(players[winner] && {
          winner: { connect: { id: players[winner] } },
        }),
      },
    }),
  ])

  return game.id
}
