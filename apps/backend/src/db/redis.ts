import { config } from "dotenv"
import { Redis } from "ioredis"

config()

export const redisClient = new Redis(process.env.REDIS_URL ?? "", {
  password: process.env.REDIS_PW,
})
