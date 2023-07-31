import Fastify from "fastify"
import WebsocketPlugin from "@fastify/websocket"
import setupWebsocket from "./ws/index.js"
import setupGraphQL from "./gql/index.js"
import { config } from "dotenv"
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
  console.log(
    await createGame({
      players: ["clkl99dy20000uvxglbahswd7", "clknjfhsf0000uv3wzrlahf5x"],
      increment: 0,
      time: 30,
    }),
  )

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
