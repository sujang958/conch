import prisma from "../../../prisma/prisma.js"
import { userAction } from "../actions.js"

export const me = userAction(
  async (user, _) =>
    await prisma.user.findUnique({
      where: { id: user.id },
      include: { blackGames: true, whiteGames: true, wonGames: true },
    })
)
