import prisma from "../../../prisma/prisma.js"
import { verifyIdToken } from "../../auth/firebase.js"
import { sign } from "../../auth/jwt.js"
import { publicAction } from "../actions.js"

export const login = publicAction(async ({ idToken }, ctx) => {
  if (!idToken) return
  const email = await verifyIdToken(idToken)
  if (!email) return false

  const user = await prisma.user.upsert({
    where: {
      email,
    },
    update: {},
    create: {
      email,
    },
  })

  const token = await sign({ id: user.id })

  ctx.reply.header("Set-Cookie", `token=${encodeURIComponent(token)}; HttpOnly`)

  return true
})
