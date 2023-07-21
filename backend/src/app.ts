import Fastify from "fastify"
import WebsocketPlugin from "@fastify/websocket"
import { redisClient } from "./db/redis.js"
import setupWebsocket from "./ws/index.js"
import setupGraphQL from "./gql/index.js"
import { config } from "dotenv"
import { sign } from "./auth/jwt.js"
import prisma from "../prisma/prisma.js"
import { Chess } from "chess.js"

config()

const PORT = Number(process.env.PORT)

const fastify = Fastify({
  logger: true,
})

fastify.register(WebsocketPlugin)
fastify.register(setupWebsocket)

setupGraphQL(fastify)

const main = async () => {
  // const gameId = "game:asefa3oijaio3japrdf"
  // const board = new Chess()
  // await Promise.all([
  //   redisClient.hset(`${gameId}:players`, {
  //     white: "clkc0e1ii0000uv3wcgiv54yd",
  //     black: "clkc0e1ii0000uv3wcgiv54yd",
  //   }),
  //   redisClient.set(`${gameId}:fen`, board.fen()),
  //   redisClient.set(`${gameId}:pgn`, board.pgn()),
  //   redisClient.hset(`${gameId}:info`, {
  //     time: 30000,
  //     increment: 2,
  //     createdAt: Date.now(),
  //   }),

  //   redisClient.hset(`${gameId}:time`, {
  //     white: 30000 * 1000,
  //     black: 30000 * 1000,
  //     lastMovedTime: Date.now(),
  //     increment: 2 * 1000,
  //   }),
  // ])

  try {
    const res = await fastify.listen({ port: isNaN(PORT) ? 3000 : PORT })
    console.log(res)
  } catch (err) {
    fastify.log.error(err)
  }
}

main()
