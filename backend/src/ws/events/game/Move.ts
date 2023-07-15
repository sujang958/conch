import { verify } from "@@/auth/jwt"
import { redisClient } from "@@/db/redis"
import { EventFile } from "@@/types/events"
import { GameInfo } from "@@/types/schemas"
import { broadcast } from "@@/utils/broadcast"
import { Chess } from "chess.js"
import SuperJSON from "superjson"

const MoveEvent: EventFile = {
  name: "MOVE",
  execute: async ({ ws, cookie }, arg) => {
    // TODO: validate a token from cookies and if not valid, don't make a move

    const args = arg.split(" ")
    const gameId = args.shift()?.trim()
    const move = args.shift()?.trim()

    if (!gameId || !move) return

    const [fen, players, verified] = await Promise.all([
      redisClient.get(`game:${gameId}:fen`),
      redisClient.lRange(`game:${gameId}:players`, 0, -1),
      verify(cookie.token),
    ])

    if (!fen) return
    if (!players.includes(verified.id.toString())) return

    const chess = new Chess(fen)

    broadcast(
      ws.clients,
      SuperJSON.stringify({ board: chess.board(), id: gameId }),
    )
  },
}

export default MoveEvent
