import mercurius from "mercurius"
import { parseCookie } from "../utils/cookie.js"
import { verify } from "../auth/jwt.js"

export const userAction = (
  callback: (user: { id: string }, arg: any) => any
) => {
  return async (_: any, arg: any, ctx: mercurius.MercuriusContext) => {
    const cookie = parseCookie(ctx.req.headers.cookie)
    if (!cookie.token) return null

    const user = await verify(cookie.token)
    if (!user) return null

    return await callback(user, arg)
  }
}
