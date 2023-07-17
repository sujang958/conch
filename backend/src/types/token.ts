import { z } from "zod"

export const TokenPayload = z.object({
  id: z.string(),
})

export type TokenPayload = z.infer<typeof TokenPayload>
