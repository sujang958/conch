import { EventFile, EventRes } from "../../../types/events.js"
import { verify } from "../../../auth/jwt.js"
import { redisClient } from "../../../db/redis.js"
import { z } from "zod"
import prisma from "../../../../prisma/prisma.js"
import { nanoid } from "nanoid"
import { Chess } from "chess.js"
import { broadcast } from "../../../utils/broadcast.js"
import { individuals } from "../rooms.js"

const joinGameParam = z.object({
  time: z.number({ description: "in seconds" }),
  increment: z.number({ description: "in seconds" }),
})

const JoinGameEvent: EventFile = {
  name: "JOIN_GAME",
  execute: async ({ user, socket, ws }, arg) => {
    if (!user) return

    const parsedArg = joinGameParam.safeParse(JSON.parse(arg))

    if (!parsedArg.success) return

    const queueId = `queue:${parsedArg.data.time}:${parsedArg.data.increment}`

    const [queue, userInfo] = await Promise.all([
      redisClient.lRange(queueId, 0, -1),
      prisma.user.findUnique({ where: { id: user.id } }),
    ])

    if (!userInfo) return

    const users = queue
      .map((v) => v.replace(/ /gi, "").split(":"))
      .map(([id, elo]) => [id, Number(elo)])

    const availableUserIndex = users.findIndex(
      ([_, elo]) =>
        userInfo.elo - 200 <= Number(elo) && Number(elo) <= userInfo.elo + 200,
    )

    if (availableUserIndex < 0) {
      await redisClient.rPush(queueId, `${userInfo.id}:${userInfo.elo}`)
      return true
    }

    const [availableUserId, _] = users[availableUserIndex]

    await redisClient.lSet(queueId, availableUserIndex, "DEL")
    await redisClient.lRem(queueId, 0, "DEL")

    let id = nanoid()
    while (true) {
      const duplicationCheck = await redisClient.get(`game:${id}:players`)
      if (!duplicationCheck) break
      id = nanoid()
    }

    const gameId = `game:${id}`

    const board = new Chess()

    await Promise.all([
      redisClient.hSet(
        `${gameId}:players`,
        Math.random() > 0.5
          ? { white: user.id, black: availableUserId.toString() }
          : { white: availableUserId.toString(), black: user.id },
      ),
      redisClient.set(`${gameId}:fen`, board.fen()),
      redisClient.set(`${gameId}:pgn`, board.pgn()),
      redisClient.hSet(`${gameId}:info`, {
        time: parsedArg.data.time,
        increment: parsedArg.data.increment,
        createdAt: Date.now(),
      }),

      redisClient.hSet(`${gameId}:time`, {
        white: parsedArg.data.time * 1000,
        black: parsedArg.data.time * 1000,
        lastMovedTime: Date.now(),
        increment: parsedArg.data.increment * 1000,
      }),
    ])

    const user1 = individuals.get(user.id)
    const user2 = individuals.get(availableUserId.toString())

    if (!user1 || !user2) return // TODO: send an error event res
    if (!user1.OPEN || !user2.OPEN) return

    const res = JSON.stringify({
      type: "JOIN_GAME",
      gameId: id,
    } satisfies EventRes)

    user1.send(res)
    user2.send(res)
  },
}

export default JoinGameEvent
