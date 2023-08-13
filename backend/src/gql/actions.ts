import { parseCookie } from "../utils/cookie.js"
import { verify } from "../auth/jwt.js"
import { Context } from "./index.js"

export const userAction = (
  callback: (user: { id: string }, arg: any, ctx: Context) => any,
) => {
  return async (_: any, arg: any, ctx: Context) => {
    const cookie = parseCookie(ctx.req.headers.cookie)
    if (!cookie.token) return null

    const user = await verify(cookie.token)
    if (!user) return null

    return await callback(user, arg, ctx)
  }
}

export const publicAction =
  (callback: (arg: any, ctx: Context) => any) =>
  async (_: any, arg: any, ctx: Context) =>
    await callback(arg, ctx)
