import { nanoid } from "nanoid"
import { redisClient } from "./redis.js"
import { Chess, PieceSymbol } from "chess.js"
import prisma from "../../prisma/prisma.js"
import { getOrCreate } from "../utils/map.js"
import { gameHouseholds } from "../ws/events/rooms.js"
import { EventRes, GameEndReason } from "../types/events.js"
import EloRank from "elo-rank"

export const getVictoryStatus = (
  me: "white" | "black",
  winner: "white" | "black" | "draw",
) => {
  if (winner == "draw") return "DRAW"
  if (me == "black") return winner == "white" ? "LOST" : "WON"
  else return winner == "white" ? "WON" : "LOST"
}

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

/**
 *
 * @param time in seconds
 * @returns
 */
export const getTimeKind = (time: number) => {
  if (time < 180) return "BULLET"
  else if (time >= 180 && time < 60 * 10) return "BLITZ"
  else return "RAPID"
}

export type TimeKind = ReturnType<typeof getTimeKind>

export const getEloPropertyName = (timeKind: TimeKind) => {
  if (timeKind === "BULLET") return "bulletElo"
  else if (timeKind === "BLITZ") return "blitzElo"
  else return "rapidElo"
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
  const timeKind = getTimeKind(time)
  const eloPropertyName = getEloPropertyName(timeKind)

  await Promise.all([
    redisClient.hset(`${gameId}:players`, {
      ...coloredPlayers,
      whiteElo: white[eloPropertyName],
      blackElo: black[eloPropertyName],
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

export const getEndReason = (chess: Chess) => {
  if (!chess.isGameOver()) return null

  if (chess.isInsufficientMaterial()) return "INSUFFICIENT_MATERIAL"
  if (chess.isThreefoldRepetition()) return "REPETITION"
  if (chess.isStalemate()) return "STALEMATE"
  if (chess.isCheckmate()) return "CHECKMATE"

  return null
}

export const deleteFromRedisMoveToPostgres = async ({
  rawGameId,
  players,
  winner,
  reason,
  newElo,
}: {
  rawGameId: string
  players: Record<string, string>
  winner: "white" | "black" | "draw"
  reason: GameEndReason
  newElo: Awaited<ReturnType<typeof getNewElo>>
}) => {
  if (!newElo) return null

  const gameId = rawGameId.startsWith("game:") ? rawGameId : `game:${rawGameId}`

  const gameInfo = await redisClient.hgetall(`${gameId}:info`)
  const pgn = await redisClient.get(`${gameId}:pgn`)

  if (pgn == null) return null

  const keys = await redisClient.keys(`${gameId}:*`)

  redisClient.del(...keys)

  const time = Number(gameInfo.time)
  const timeKind = getTimeKind(time)
  const eloPropertyName = getEloPropertyName(timeKind)

  const [_, __, game] = await prisma.$transaction([
    prisma.user.update({
      where: { id: players.white },
      data: { [eloPropertyName]: newElo.white },
    }),
    prisma.user.update({
      where: { id: players.black },
      data: { [eloPropertyName]: newElo.black },
    }),
    prisma.game.create({
      data: {
        increment: Number(gameInfo.increment),
        time,
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

export const playerInGameAction = async ({
  rawGameId,
  userId,
}: {
  rawGameId: string
  userId: string
}): Promise<
  | {
      color: "white" | "black"
      gameId: string
      players: Record<string, string>
    }
  | false
> => {
  const gameId = `game:${rawGameId}`
  const players = await redisClient.hgetall(`${gameId}:players`)

  if (players.white !== userId && players.black !== userId) return false

  return {
    color: players.white == userId ? "white" : "black",
    gameId,
    players,
  }
}

export const getNewTime = async ({
  time,
  turn,
  now,
}: {
  time: Record<string, string>
  turn: "white" | "black"
  now: number
}) => {
  const lastMovedTime = Number(time.lastMovedTime)
  const increment = Number(time.increment)

  const remainingTimeStr = time[turn]
  const remainingTime = Number(remainingTimeStr)

  if (isNaN(remainingTime) || isNaN(lastMovedTime) || isNaN(increment))
    return NaN

  const newRemainingTime = remainingTime - (now - lastMovedTime) + increment

  return newRemainingTime
}

export const sendGameEndEvent = async ({
  rawGameId,
  winner,
  reason,
  players,
}: {
  rawGameId: string
  winner: "white" | "black" | "draw"
  reason: GameEndReason
  players: Record<string, string>
}) => {
  const households = getOrCreate(gameHouseholds, rawGameId, [])

  const newElo = await getNewElo({
    whiteElo: Number(players.whiteElo),
    blackElo: Number(players.blackElo),
    winner,
  })

  if (!newElo) return

  deleteFromRedisMoveToPostgres({
    rawGameId,
    players,
    reason,
    winner,
    newElo,
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
            id == players.black ? "black" : "white",
            winner,
          ),
        } satisfies EventRes),
      ),
    )
  households.forEach(({ socket }) => socket.send(eventRes))
}

export const isTimeoutVSInsufficientMaterial = async ({
  chess,
  timedOutColor,
}: {
  chess: Chess
  timedOutColor: "white" | "black"
}) => {
  const opponentColor = timedOutColor == "white" ? "black" : "white"

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
        ): square is Exclude<ReturnType<typeof chess.board>[0][0], null> =>
          square !== null,
      )
      .filter(
        (square) => square.color == (opponentColor == "white" ? "w" : "b"),
      )
      .forEach((square) => {
        opponentPieces[square.type] += 1
      })
  })

  if (
    opponentPieces.r >= 1 ||
    opponentPieces.q >= 1 ||
    opponentPieces.b >= 2 ||
    opponentPieces.n >= 2 || // knights can't FORCE checkmates, but can checkmate.
    (opponentPieces.n >= 1 && opponentPieces.b >= 1) ||
    opponentPieces.p >= 1
  )
    return false
  else return true
}
