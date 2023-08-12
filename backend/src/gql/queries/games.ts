import prisma from "../../../prisma/prisma.js"
import { publicAction } from "../actions.js"

export const games = publicAction(async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { blackGames: true, wonGames: true, whiteGames: true },
  })

  if (!user) return

  return {
    wonGames: user.wonGames,
    blackGames: user.blackGames,
    whiteGames: user.whiteGames,
  }
})
