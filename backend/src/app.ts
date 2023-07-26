import Fastify from "fastify"
import WebsocketPlugin from "@fastify/websocket"
import { redisClient } from "./db/redis.js"
import setupWebsocket from "./ws/index.js"
import setupGraphQL from "./gql/index.js"
import { config } from "dotenv"
import { sign } from "./auth/jwt.js"
import prisma from "../prisma/prisma.js"
import { Chess } from "chess.js"
import { createGame } from "./db/games.js"

config()

const PORT = Number(process.env.PORT)

const fastify = Fastify({
  logger: true,
})

fastify.register(WebsocketPlugin)
fastify.register(setupWebsocket)

setupGraphQL(fastify)

const main = async () => {
  // console.log(
  //   await createGame({
  //     players: ["clkc0e1ii0000uv3wcgiv54yd", "clkj3np0o0000uv8kf3qiwzaj"],
  //     increment: 3000,
  //     time: 6969696969696969,
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
