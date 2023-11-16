import { redisClient } from "../../../db/redis.js"
import { EventFile } from "../../../types/events.js"

const CancelQueueEvent: EventFile = {
  name: "CANCEL_QUEUE",
  execute: async ({ socket, ws, user }, arg) => {
    if (!user) return

    const queueKeys = await redisClient.keys("queue:*")
    const queues: Array<[string, string[]]> = await Promise.all(
      queueKeys.map(async (key) => [key, await redisClient.lrange(key, 0, -1)]),
    )

    queues
      .filter(([_, queue]) =>
        queue.findIndex((player) => player.startsWith(user.id)) !== -1
      )

      // TODO: wip
  },
}
