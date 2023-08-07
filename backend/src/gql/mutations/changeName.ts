import prisma from "../../../prisma/prisma.js"
import { userAction } from "../actions.js"

export const changeName = userAction(
  async (user, { name }) =>
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        name,
      },
      include: {
        blackGames: true,
        whiteGames: true,
        wonGames: true,
      },
    })
)
