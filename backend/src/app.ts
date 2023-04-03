import Fastify from "fastify"
import WebsocketPlugin from "@fastify/websocket"
import { EventModel } from "./models/event"
import events from "./events"
import { redisClient } from "./db/redis"

const fastify = Fastify({
  logger: true,
})

fastify.register(WebsocketPlugin, { options: { maxPayload: 1048576 } })

fastify.register(async function (fastify) {
  fastify.get("/ws", { websocket: true }, (connection, req) => {
    connection.socket.on("message", (message) => {
      try {
        const decodedMessage = JSON.parse(message.toString())
        const event = EventModel.parse(decodedMessage)

        events.get(event.type)?.handle(event.payload)
      } catch (e) {
        console.log(e)
      }
    })
  })
})

const main = async () => {
  await redisClient.connect()

  fastify.listen({ port: 3000 }, (err, address) => {
    if (err) throw err
    console.log(`Server is now listening on ${address}`)
  })
}

main()
