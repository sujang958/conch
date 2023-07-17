import { FastifyInstance } from "fastify"
import { readdirSync } from "fs"
import { join } from "path"
import { EventFile, eventFile } from "../types/events.js"
import { URL, fileURLToPath, pathToFileURL } from "url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

const lobbyEvents = new Map<string, EventFile>()
const gameEvents = new Map<string, EventFile>()

const loadEvents = async (category: string, map: Map<string, EventFile>) => {
  const eventsPath = `./events/${category}/`
  const results = await Promise.allSettled(
    readdirSync(join(__dirname, eventsPath)).map(async (eventFileName) => {
      const event = (
        await import(
          pathToFileURL(join(__dirname, eventsPath, eventFileName)).href
        )
      ).default
      const parsed = eventFile.parse(event)

      map.set(parsed.name, parsed)
    }),
  )

  results
    .filter(
      (result): result is PromiseRejectedResult => result.status == "rejected",
    )
    .forEach((rejected) => {
      console.log("Rejected", rejected.reason)
    })
}

await Promise.all([
  loadEvents("lobby", lobbyEvents),
  loadEvents("game", gameEvents),
])

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
