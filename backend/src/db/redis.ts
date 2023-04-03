import { config } from "dotenv"
import { createClient } from "redis"

config()

export const redisClient = createClient({
  password: process.env.REDIS_PW,
  url: process.env.REDIS_URL,
})
