import prisma from "../../../prisma/prisma.js"
import { userAction } from "../actions.js"

export const changeBio = userAction(
  async (user, { bio }) =>
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        bio,
      },
      include: {
        blackGames: true,
        whiteGames: true,
        wonGames: true,
      },
    })
)
