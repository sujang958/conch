import { config } from "dotenv"
import { createClient } from "redis"

config()

export const dbClient = createClient({
  url: process.env.REDIS_URL,
})
