import { z } from "zod"
import { redisClient } from "../db/redis"
import { EventHandlerType, EventNameEnum } from "../models/event"

const GameStartData = z.object({
  
})

const GameStartEvent: EventHandlerType = {
  name: EventNameEnum.Enum.GameStart,
  handle: async (data) => {
    redisClient.get("")
  },
}

export default GameStartEvent
