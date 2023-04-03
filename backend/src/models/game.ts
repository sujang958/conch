import { z } from "zod"

export const GameModel = z.object({
  id: z.string(),
  fan: z.string(),
  white: z.string(),
  black: z.string(),

  time: z.number(),
  isFinished: z.boolean(),
})
