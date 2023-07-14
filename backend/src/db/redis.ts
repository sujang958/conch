import { config } from "dotenv"
import { createClient } from "redis"

config()

export const redisClient = createClient({
  url: process.env.REDIS_URL,
})
