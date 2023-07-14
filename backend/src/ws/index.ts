import { FastifyInstance } from "fastify"

const setupWebsocket = async (fastify: FastifyInstance) => {
  fastify.get("/ws", { websocket: true }, (connection, req) => {
    connection.socket.on("message", (message) => {
      connection.socket.send("hi from wildcard route")
    })
  })
}
export default setupWebsocket
