import Fastify from "fastify"
import WebsocketPlugin from "@fastify/websocket"
import setupWebsocket from "./ws/index.js"
import setupGraphQL from "./gql/index.js"
import { config } from "dotenv"
import cors from "@fastify/cors"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.union([z.literal("development"), z.literal("production")]),
  REDIS_URL: z.string(),
  DB_URL: z.string(),
  JWT_SECRET: z.string(),
})

type EnvType = z.infer<typeof envSchema>

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvType {}
  }
}

config()

const { sucess } = envSchema.safeParse(process.env)

if (!sucess) {
  console.error("Invalid .env file")
  process.exit(401)
}

const PORT = Number(process.env.PORT)

const fastify = Fastify({
  logger: true,
})

fastify.register(WebsocketPlugin)
fastify.register(setupWebsocket)
fastify.register(cors, {
  origin:
    process.env.NODE_ENV === "production"
      ? "https://conch.vercel.app"
      : "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
})

await setupGraphQL(fastify)

const res = await fastify.listen({ port: isNaN(PORT) ? 3000 : PORT })

console.log(res)

process.on("uncaughtException", (error) => {
  console.log(error)
})
