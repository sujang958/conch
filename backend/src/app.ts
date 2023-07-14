import Fastify from "fastify"
import WebsocketPlugin from "@fastify/websocket"
import { dbClient } from "./db/redis"
import setupWebsocket from "./ws"
import setupGraphQL from "./gql"

const PORT = Number(process.env.PORT)

const fastify = Fastify({
  logger: true,
})

fastify.register(WebsocketPlugin)
fastify.register(setupWebsocket)

setupGraphQL(fastify)

const main = async () => {
  // await dbClient.connect()

  try {
    const res = await fastify.listen({ port: isNaN(PORT) ? 3000 : PORT })
    console.log(res)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main()
