import prisma from "../../../prisma/prisma.js"
import {
  UserWithGamesWithUsers,
} from "../../__generated__/resolvers-types.js"
import { userAction } from "../actions.js"

export const me = userAction<UserWithGamesWithUsers>(async (user, _) => {
  const fetched = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      blackGames: { include: { black: true, white: true, winner: true } },
      whiteGames: { include: { black: true, white: true, winner: true } },
      wonGames: { include: { black: true, white: true, winner: true } },
    },
  })

  if (!fetched) return null

  return fetched
})
