import { EventFile, EventRes } from "../../../types/events.js"
import { verify } from "../../../auth/jwt.js"
import { redisClient } from "../../../db/redis.js"
import { z } from "zod"
import prisma from "../../../../prisma/prisma.js"
import { nanoid } from "nanoid"
import { Chess } from "chess.js"
import { broadcast } from "../../../utils/broadcast.js"
import { individuals } from "../rooms.js"
import { createGame } from "../../../db/games.js"

const joinGameParam = z.object({
  time: z.number({ description: "in seconds" }),
  increment: z.number({ description: "in seconds" }),
})

const INT4_MAX = 2_147_483_647
const ELO_DEVIATION = 250

const JoinGameEvent: EventFile = {
  name: "JOIN_GAME",
  execute: async ({ user, socket, ws }, arg) => {
    if (!user) return

    const parsedArg = joinGameParam.safeParse(JSON.parse(arg))

    if (!parsedArg.success) return
    if (parsedArg.data.time <= 0 || parsedArg.data.increment < 0) return
    if (parsedArg.data.time > INT4_MAX || parsedArg.data.increment > INT4_MAX)
      return // TODO: send an ERROR event res

    const allQueues = await redisClient.keys("queue:*")
    const searched = await Promise.all(
      allQueues.map(async (queueId) => {
        const queue = await redisClient.lrange(queueId, 0, -1)
        return (
          queue
            .map((user) => user.trim().split(":"))
            .findIndex(([userId, _]) => userId == user.id) < 0
        )
      }),
    )

    if (searched.includes(false)) {
      // TODO: send an ERROR event and a QUEUE event
      return
    }

    const queueId = `queue:${parsedArg.data.time}:${parsedArg.data.increment}`

    const [queue, userInfo] = await Promise.all([
      redisClient.lrange(queueId, 0, -1),
      prisma.user.findUnique({ where: { id: user.id } }),
    ])

    if (!userInfo) return

    const users = queue
      .map((v) => v.replace(/ /gi, "").split(":"))
      .map(([id, elo]) => [id, Number(elo)])

    const availableUserIndex = users
      .filter(([id, _]) => id !== userInfo.id)
      .findIndex(
        ([_, elo]) =>
          userInfo.elo - ELO_DEVIATION <= Number(elo) &&
          Number(elo) <= userInfo.elo + ELO_DEVIATION,
      )

    if (availableUserIndex < 0) {
      if (users.filter(([id, _]) => id === userInfo.id).length < 1)
        await redisClient.rpush(queueId, `${userInfo.id}:${userInfo.elo}`)
      return true
    }

    const [availableUserId, _] = users[availableUserIndex]

    await redisClient.lset(queueId, availableUserIndex, "DEL")
    await redisClient.lrem(queueId, 0, "DEL")

    const gameId = await createGame({
      players: [user.id, availableUserId.toString()],
      increment: parsedArg.data.increment,
      time: parsedArg.data.time,
    })

    if (!gameId) return // TODO: send an ERROR event res

    const user1 = individuals.get(user.id)
    const user2 = individuals.get(availableUserId.toString())

    if (!user1 || !user2) return // TODO: send an error event res
    if (!user1.OPEN || !user2.OPEN) return

    const res = JSON.stringify({
      type: "JOIN_GAME",
      gameId,
    } satisfies EventRes)

    user1.send(res)
    user2.send(res)
  },
}

export default JoinGameEvent
