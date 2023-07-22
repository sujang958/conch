import { nanoid } from "nanoid"
import { redisClient } from "./redis.js"
import { Chess } from "chess.js"

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
  let id = nanoid()
  while (true) {
    const duplicationCheck = await redisClient.get(`game:${id}:players`)
    if (!duplicationCheck) break
    id = nanoid()
  }

  const gameId = `game:${id}`
  const board = new Chess()

  await Promise.all([
    redisClient.hset(
      `${gameId}:players`,
      Math.random() > 0.5
        ? { white: players[0], black: players[1] }
        : { white: players[1], black: players[0] },
    ),
    redisClient.set(`${gameId}:fen`, board.fen()),
    redisClient.set(`${gameId}:pgn`, board.pgn()),
    redisClient.hset(`${gameId}:info`, {
      time,
      increment,
      createdAt: Date.now(),
    }),
    redisClient.hset(`${gameId}:time`, {
      white: time * 1000,
      black: time * 1000,
      lastMovedTime: Date.now(),
      increment: increment * 1000,
    }),
  ])

  return id
}
