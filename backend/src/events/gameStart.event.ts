import { EventHandlerType, EventNameEnum } from "../models/event"

const GameStartEvent: EventHandlerType = {
  name: EventNameEnum.Enum.GameStart,
  handle: async (data) => {},
}

export default GameStartEvent
