import prisma from "../../../prisma/prisma.js"
import { verifyIdToken } from "../../auth/firebase.js"
import { sign } from "../../auth/jwt.js"
import { publicAction } from "../actions.js"

export const login = publicAction(async ({ idToken }, ctx) => {
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
    },
    include: {
      blackGames: true,
      whiteGames: true,
      wonGames: true,
    },
  })

  const token = await sign({ id: user.id })

  ctx.reply.header("Set-Cookie", `token=${encodeURIComponent(token)}; HttpOnly`)

  return user
})
