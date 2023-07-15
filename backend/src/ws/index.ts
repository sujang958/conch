import { EventFile, eventFile } from "@@/types/events"
import { FastifyInstance } from "fastify"
import { readdirSync } from "fs"
import { join } from "path"

const lobbyEvents = new Map<string, EventFile>()
const gameEvents = new Map<string, EventFile>()

for (const eventFile of readdirSync(join(__dirname, "./events/lobby/"))) {
  const event: EventFile = require(join(
    __dirname,
    "events/lobby/",
    eventFile,
  )).default
  lobbyEvents.set(event.name, event)
}

for (const _eventFile of readdirSync(join(__dirname, "./events/game/"))) {
  const event: EventFile = require(join(
    __dirname,
    "events/game/",
    _eventFile,
  )).default
  console.log(eventFile.safeParse(event))
  gameEvents.set(event.name, event)
}

const parseCookie = (cookies: string) =>
  Object.fromEntries(
    cookies
      .split(";")
      .map((cookie) =>
        cookie.split("=").map((value) => decodeURIComponent(value.trim())),
      ),
  )

const setupWebsocket = async (fastify: FastifyInstance) => {
  fastify.get("/ws/lobby", { websocket: true }, (connection, req) => {
    connection.socket.on("message", (message) => {
      const args = message.toString("utf8").split(" ")
      const event = args.shift()?.toUpperCase()

      const eventFile = lobbyEvents.get(event ?? "")

      if (!eventFile) return connection.socket.send("")

      eventFile.execute(
        {
          cookie: parseCookie(req.headers.cookie ?? ""),
          ws: fastify.websocketServer,
          socket: connection.socket,
        },
        args.join(" "),
      )
    })
  })

  fastify.get("/ws/game", { websocket: true }, (connection, req) => {
    connection.socket.on("message", (message) => {
      const args = message.toString("utf8").split(" ")
      const event = args.shift()?.toUpperCase()

      const eventFile = gameEvents.get(event ?? "")

      if (!eventFile) return connection.socket.send("")

      eventFile.execute(
        {
          cookie: parseCookie(req.headers.cookie ?? ""),
          ws: fastify.websocketServer,
          socket: connection.socket,
        },
        args.join(" "),
      )
    })
  })
}
export default setupWebsocket
