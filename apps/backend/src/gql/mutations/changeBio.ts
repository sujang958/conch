import prisma from "../../../prisma/prisma.js"
import { UserWithGamesWithUsers } from "../../__generated__/resolvers-types.js"
import { userAction } from "../actions.js"

export const changeBio = userAction<UserWithGamesWithUsers>(
  async (user, { bio }) =>
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        bio,
      },
      include: {
        blackGames: { include: { black: true, white: true, winner: true } },
        whiteGames: { include: { black: true, white: true, winner: true } },
        wonGames: { include: { black: true, white: true, winner: true } },
      },
    }),
)
