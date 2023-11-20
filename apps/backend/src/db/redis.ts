import { config } from "dotenv"
import { Redis } from "ioredis"

config()

export const redisClient = new Redis(process.env.REDIS_URL ?? "")

export const isPlayerInQueue = async (id: `${string}:${string}` | string) => {
  const allQueues = await redisClient.keys("queue:*")
  const searched = await Promise.all(
    allQueues.map(
      async (queueId) =>
        [queueId, (await redisClient.sismember(queueId, id)) === 1] as const,
    ),
  )

  const oneThatHas = searched.find(([queueId, isMember]) => isMember)

  if (!oneThatHas) return false

  return { queueId: oneThatHas[0] }
}
