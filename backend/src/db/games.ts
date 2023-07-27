import { nanoid } from "nanoid"
import { redisClient } from "./redis.js"
import { Chess } from "chess.js"
import prisma from "../../prisma/prisma.js"
import { getOrCreate } from "../utils/map.js"
import { gameHouseholds } from "../ws/events/rooms.js"
import { EventRes } from "../types/events.js"
import EloRank from "elo-rank"

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

  const interval = setInterval(async () => {
    const board = new Chess()
    const pgn = await redisClient.get(`${gameId}:pgn`)
    if (pgn == null) return

    board.loadPgn(pgn)

    if (board.isGameOver()) return

    if (board.turn() == "w")
      await redisClient.hincrby(`${gameId}:time`, "white", -100)
    else await redisClient.hincrby(`${gameId}:time`, "black", -100)

    const households = getOrCreate(gameHouseholds, id, [])

    const eventRes = JSON.stringify({
      type: "TIME",
      gameId: id,
      white: Number(await redisClient.hget(`${gameId}:time`, "white")),
      black: Number(await redisClient.hget(`${gameId}:time`, "black")),
    } satisfies EventRes)

    households.forEach(async ({ socket }) => socket.send(eventRes))
  }, 100)

  await Promise.all([
    redisClient.set(`${gameId}:interval`, interval[Symbol.toPrimitive]()),
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
      increment: increment * 1000,
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