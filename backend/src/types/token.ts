import { z } from "zod"

export const TokenPayload = z.object({
  id: z.bigint(),
})

export type TokenPayload = z.infer<typeof TokenPayload>
