import prisma from "../../../prisma/prisma.js"
import { UserWithGamesWithUsers } from "../../__generated__/resolvers-types.js"
import { User } from "../../__generated__/resolvers-types.js"
import { verifyIdToken } from "../../auth/firebase.js"
import { sign } from "../../auth/jwt.js"
import { publicAction } from "../actions.js"

export const login = publicAction<UserWithGamesWithUsers>(
  async ({ idToken }, ctx) => {
    if (!idToken) return null

    const email = await verifyIdToken(idToken)
    if (!email) return null

    const user = await prisma.user.upsert({
      where: {
        email,
      },
      update: {},
      create: {
        email,
        // TODO: fetch country
      },
      include: {
        blackGames: { include: { winner: true, black: true, white: true } },
        whiteGames: { include: { winner: true, black: true, white: true } },
        wonGames: { include: { winner: true, black: true, white: true } },
      },
    })

    const token = await sign({ id: user.id })

    ctx.reply.header(
      "Set-Cookie",
      `token=${encodeURIComponent(token)}; HttpOnly`,
    )

    return user
  },
)
