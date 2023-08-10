import { userAction } from "../actions.js"

export const logout = userAction((user, _, ctx) => {
  ctx.reply.header(
    "set-cookie",
    "token=deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT",
  )
  return true
})
