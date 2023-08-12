import prisma from "../../../prisma/prisma.js"
import { publicAction } from "../actions.js"

export const user = publicAction(async ({ id }) => {
  return JSON.parse(
    JSON.stringify(
      await prisma.user.findUnique({
        where: { id },
        include: { blackGames: true, whiteGames: true, wonGames: true },
      })
    )
  )
})
