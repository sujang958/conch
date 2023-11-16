import { config } from "dotenv"
import { Redis } from "ioredis"

config()

export const redisClient = new Redis(process.env.REDIS_URL ?? "")

export const isPlayerInQueue = async (formattedId: `${string}:${string}`) => {
  const allQueues = await redisClient.keys("queue:*")
  const searched = await Promise.all(
    allQueues.map(
      async (queueId) => await redisClient.sismember(queueId, formattedId),
    ),
  )

  return searched.includes(1)
}
