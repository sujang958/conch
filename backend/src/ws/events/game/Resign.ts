import { z } from "zod"
import { EventFile, EventRes } from "../../../types/events.js"
import { redisClient } from "../../../db/redis.js"
import { gameHouseholds } from "../rooms.js"
import { getOrCreate } from "../../../utils/map.js"
import { finishGame, getNewElo } from "../../../db/games.js"

const resignEventParam = z.object({
  gameId: z.string(),
  reason: z.literal("TIMEOUT").nullish(),
})

const ResignEvent: EventFile = {
  name: "RESIGN",
  execute: async ({ user, socket, ws }, arg) => {
    const parsed = resignEventParam.safeParse(JSON.parse(arg))

    if (!parsed.success) return

    const { gameId: rawGameId } = parsed.data
    const gameId = `game:${rawGameId}`

    if (!user) return
    if (
      socket.readyState == socket.CLOSED ||
      socket.readyState == socket.CLOSING
    )
      return

    const players = await redisClient.hgetall(`${gameId}:players`)

    if (players.white !== user.id && players.black !== user.id) return

    const households = getOrCreate(gameHouseholds, rawGameId, [])

    const winner = players.white == user.id ? "black" : "white"

    const newElo = await getNewElo({
      whiteElo: Number(players.whiteElo),
      blackElo: Number(players.blackElo),
      winner,
    })

    finishGame({
      gameId: rawGameId,
      newElo,
      players,
      reason: parsed.data.reason ?? "RESIGN",
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
  },
}

export default ResignEvent
