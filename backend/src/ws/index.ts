import { FastifyInstance, FastifyRequest } from "fastify"
import { readdirSync } from "fs"
import { join } from "path"
import { EventFile, eventFile } from "../types/events.js"
import { URL, fileURLToPath, pathToFileURL } from "url"
import { verify } from "../auth/jwt.js"
import WebSocket from "ws"
import fastifyWebsocket from "@fastify/websocket"
import { individuals } from "./events/rooms.js"

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
      .replace(/ /gi, "")
      .split(";")
      .map((cookie) =>
        cookie.split("=").map((value) => decodeURIComponent(value.trim())),
      ),
  )

const handleMessage = async ({
  message,
  connection,
  fastify,
  req,
  events,
  beforeExecute,
}: {
  message: WebSocket.RawData
  fastify: FastifyInstance
  connection: fastifyWebsocket.SocketStream
  req: FastifyRequest
  events: Map<string, EventFile>
  beforeExecute?: ({ userId }: { userId?: string }) => any
}) => {
  const args = message.toString("utf8").split(" ")
  const event = args.shift()?.toUpperCase()

  const eventFile = events.get(event ?? "")
  if (!eventFile) return connection.socket.send("")

  const cookie = parseCookie(req.headers.cookie ?? "")
  const user = await verify(cookie.token)

  if (beforeExecute) await beforeExecute({ userId: user?.id })

  eventFile.execute(
    {
      user,
      ws: fastify.websocketServer,
      socket: connection.socket,
    },
    args.join(" "),
  )
}

const setupWebsocket = async (fastify: FastifyInstance) => {
  fastify.get("/ws/lobby", { websocket: true }, (connection, req) => {
    connection.socket.on("message", async (message) => {
      handleMessage({
        message,
        connection,
        events: lobbyEvents,
        fastify,
        req,
        beforeExecute: ({ userId }) => {
          if (!userId) return

          individuals.set(userId, connection.socket)
        },
      })
    })
  })

  fastify.get("/ws/game", { websocket: true }, (connection, req) => {
    connection.socket.on("message", async (message) => {
      handleMessage({
        message,
        connection,
        events: gameEvents,
        fastify,
        req,
      })
    })
  })
}

export default setupWebsocket
