import { EventFile, EventRes } from "../../../types/events.js"
import { isPlayerInQueue, redisClient } from "../../../db/redis.js"
import { z } from "zod"
import prisma from "../../../../prisma/prisma.js"
import { individuals } from "../rooms.js"
import {
  createGame,
  getEloPropertyName,
  getTimeKind,
} from "../../../db/games.js"
import { search } from "node-emoji"

const joinGameParam = z.object({
  time: z.number({ description: "in seconds" }),
  increment: z.number({ description: "in seconds" }),
})

const INT4_MAX = 2_147_483_647
const ELO_DEVIATION = 300

const JoinGameEvent: EventFile = {
  name: "JOIN_GAME",
  execute: async ({ user, socket, ws }, arg) => {
    // TODO: set으로 바꾼거 테스트

    if (!user) return

    const parsedArg = joinGameParam.safeParse(JSON.parse(arg))

    if (!parsedArg.success)
      return socket.send(
        JSON.stringify({
          type: "ERROR",
          message: "Invalid time settings",
        } satisfies EventRes),
      )
    if (parsedArg.data.time <= 0 || parsedArg.data.increment < 0)
      return socket.send(
        JSON.stringify({
          type: "ERROR",
          message: "Time and increment can't be negative",
        } satisfies EventRes),
      )
    if (parsedArg.data.time > INT4_MAX || parsedArg.data.increment > INT4_MAX)
      return socket.send(
        JSON.stringify({
          type: "ERROR",
          message: `Time and increment can't be greater than ${INT4_MAX}`,
        } satisfies EventRes),
      )

    const timeKind = getTimeKind(parsedArg.data.time)
    const eloPropertyName = getEloPropertyName(timeKind)
    const userInfo = await prisma.user.findUnique({ where: { id: user.id } })

    if (!userInfo)
      return socket.send(
        JSON.stringify({
          type: "ERROR",
          message: "You can't be found in the database",
        } satisfies EventRes),
      )

    const formattedIdElo =
      `${userInfo.id}:${userInfo[eloPropertyName]}` as const

    if (await isPlayerInQueue(formattedIdElo))
      return socket.send(
        JSON.stringify({
          type: "ERROR",
          message: "You're already in a queue",
        } satisfies EventRes),
      )

    const queueId = `queue:${parsedArg.data.time}:${parsedArg.data.increment}`

    const queue = await redisClient.smembers(queueId)

    const users = queue
      .map((v) => v.replace(/ /gi, "").split(":"))
      .map(([id, elo]) => [id, Number(elo)])

    const availableUserIndex = users
      .filter(([id, _]) => id !== userInfo.id)
      .findIndex(
        ([_, elo]) =>
          userInfo[eloPropertyName] - ELO_DEVIATION <= Number(elo) &&
          Number(elo) <= userInfo[eloPropertyName] + ELO_DEVIATION,
      )

    if (availableUserIndex < 0) {
      await redisClient.sadd(queueId, formattedIdElo)

      return true
    }

    const [availableUserId, _] = users[availableUserIndex]

    await redisClient.srem(queueId, availableUserId)

    const gameId = await createGame({
      players: [user.id, availableUserId.toString()],
      increment: parsedArg.data.increment,
      time: parsedArg.data.time,
    })

    if (!gameId)
      return socket.send(
        JSON.stringify({
          type: "ERROR",
          message: "Players can't be found",
        } satisfies EventRes),
      )

    const user1 = individuals.get(user.id)
    const user2 = individuals.get(availableUserId.toString())

    if (!user1 || !user2)
      return socket.send(
        JSON.stringify({
          type: "ERROR",
          message: "One of the players disconnected",
        } satisfies EventRes),
      )
    if (!user1.OPEN || !user2.OPEN)
      return socket.send(
        JSON.stringify({
          type: "ERROR",
          message: "One of the players disconnected",
        } satisfies EventRes),
      )

    const res = JSON.stringify({
      type: "JOIN_GAME",
      gameId,
    } satisfies EventRes)

    user1.send(res)
    user2.send(res)
  },
}

export default JoinGameEvent
