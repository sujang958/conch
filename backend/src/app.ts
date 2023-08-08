import Fastify from "fastify"
import WebsocketPlugin from "@fastify/websocket"
import setupWebsocket from "./ws/index.js"
import setupGraphQL from "./gql/index.js"
import { config } from "dotenv"
import cors from "@fastify/cors"

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production"
    }
  }
}

config()

const PORT = Number(process.env.PORT)

const fastify = Fastify({
  logger: true,
})

if (!process.env.COOKIE_SECRET) process.exit(404)

fastify.register(WebsocketPlugin)
fastify.register(setupWebsocket)
fastify.register(cors, {
  origin:
    process.env.NODE_ENV === "production" ? "conch.vercel.app" : "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"],
})

setupGraphQL(fastify)

const main = async () => {
  // console.log(
  //   await createGame({
  //     players: ["clkw7hjda0000uvcglmsxkvls", "clkw7hjib0001uvcg7l5zpmlf"],
  //     increment: 0,
  //     time: 30,
  //   }),
  // )

  try {
    const res = await fastify.listen({ port: isNaN(PORT) ? 3000 : PORT })
    console.log(res)
  } catch (err) {
    fastify.log.error(err)
  }
}

main()

process.on("uncaughtException", (error) => {
  console.log(error)
})
