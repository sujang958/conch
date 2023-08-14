import vegot from "vegot"
import prisma from "../../../prisma/prisma.js"
import { UserWithGamesWithUsers } from "../../__generated__/resolvers-types.js"
import { User } from "../../__generated__/resolvers-types.js"
import { verifyIdToken } from "../../auth/firebase.js"
import { sign } from "../../auth/jwt.js"
import { publicAction } from "../actions.js"
import { find } from "node-emoji"

export const login = publicAction<UserWithGamesWithUsers>(
  async ({ idToken }, ctx) => {
    if (!idToken) return null

    const email = await verifyIdToken(idToken)
    if (!email) return null

    const res = await fetch(
      `https://api.country.is/${
        ctx.req.ip == "::1" ? "118.45.145.72" : ctx.req.ip
      }`,
    )
    const json = await res.json()

    const user = await prisma.user.upsert({
      where: {
        email,
      },
      update: {},
      create: {
        email,
        country: find(json?.country?.toLowerCase() ?? "rainbow")?.emoji,
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
