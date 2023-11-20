import { isPlayerInQueue, redisClient } from "../../../db/redis.js"
import { EventFile, EventRes } from "../../../types/events.js"

const CancelQueueEvent: EventFile = {
  name: "CANCEL_QUEUE",
  execute: async ({ socket, ws, user }, arg) => {
    if (!user) return

    const playersQueue = await isPlayerInQueue(user.id)

    if (!playersQueue)
      return socket.send(
        JSON.stringify({
          type: "ERROR",
          message: "You are not in a queue",
        } satisfies EventRes),
      )

    await redisClient.srem(playersQueue.queueId, user.id)

    return socket.send(
      JSON.stringify({
        type: "QUEUE_CANCELED",
        message: "Queue canceled",
      } satisfies EventRes),
    )
  },
}

export default CancelQueueEvent
