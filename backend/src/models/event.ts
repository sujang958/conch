import { z } from "zod"

export const EventModel = z.object({
  type: z.string(),
  payload: z.object({}),
})
export type EventType = z.infer<typeof EventModel>

export const EventNameEnum = z.enum(["GameStart"])
export type EventNameEnum = z.infer<typeof EventNameEnum>

export const EventHandler = z.object({
  name: EventNameEnum,
  handle: z.function().args(z.any()).returns(z.any()),
})
export type EventHandlerType = z.infer<typeof EventHandler>
