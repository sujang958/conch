import prisma from "../../../prisma/prisma.js"
import { userAction } from "../actions.js"

export const changeName = userAction(async (user, { name: _name }) => {
  const name = String(_name).trim()

  if (name.length > 50) throw new Error("Name must be shorter than 50")

  return await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      name,
    },
    include: {
      blackGames: { include: { black: true, white: true, winner: true } },
      whiteGames: { include: { black: true, white: true, winner: true } },
      wonGames: { include: { black: true, white: true, winner: true } },
    },
  })
})
