import Fastify from "fastify"
import WebsocketPlugin from "@fastify/websocket"
import setupWebsocket from "./ws/index.js"
import setupGraphQL from "./gql/index.js"
import { config } from "dotenv"
import cors from "@fastify/cors"
import { z } from "zod"
import prisma from "../prisma/prisma.js"

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

const { success } = envSchema.safeParse(process.env)

if (!success) {
  console.error("Invalid .env file")
  process.exit(401)
}

console.log("[ALERT] Detected environment:", process.env.NODE_ENV)

// const PORT = Number(process.env.PORT)

const fastify = Fastify({
  logger: true,
})

fastify.register(WebsocketPlugin)
fastify.register(setupWebsocket)
fastify.register(cors, {
  origin:
    process.env.NODE_ENV === "production"
      ? "https://conch.sujang.xyz"
      : "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
})

fastify.get("/test", async (req, reply) => {
  reply.header("Access-Control-Allow-Origin", "*")
  reply.header("Access-Control-Allow-Methods", "GET")

  return reply.send({ hi: ":)" })
})

await setupGraphQL(fastify)

export default async (req: any, res: any) => {
  await fastify.ready()
  fastify.server.emit("request", req, res)
}

// const res = await fastify.listen({
//   port: isNaN(PORT) ? 3000 : PORT,
//   host: "::",
// })

// console.log(res)

// process.on("uncaughtException", (error) => {
//   console.log(error)
// })
