import prisma from "../../../prisma/prisma.js"
import { publicAction } from "../actions.js"

export const user = publicAction(async ({ id }) => {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      blackGames: { include: { black: true, white: true, winner: true } },
      whiteGames: { include: { black: true, white: true, winner: true } },
      wonGames: { include: { black: true, white: true, winner: true } },
    },
  })
})
