import { EventFile } from "@/types/events"
import { FastifyInstance } from "fastify"
import { readdirSync } from "fs"
import { join } from "path"

const events = new Map<string, EventFile>()

for (const eventFile of readdirSync(join(__dirname, "./events/"))) {
  const event: EventFile = require(join(
    __dirname,
    "events/",
    eventFile,
  )).default
  events.set(event.name, event)
}

const setupWebsocket = async (fastify: FastifyInstance) => {
  fastify.get("/ws", { websocket: true }, (connection, req) => {
    // fastify.websocketServer.clients.forEach(client => {
    //   if (client.readyState == 1) client.
    // })

    req.cookie

    connection.socket.on("message", (message) => {
      const args = message.toString("utf8").split(" ")
      const event = args.shift()?.toUpperCase()

      const eventFile = events.get(event ?? "")

      if (!eventFile) return connection.socket.send("")

      eventFile.execute(connection.socket, args.join(" "))
    })
  })
}
export default setupWebsocket
