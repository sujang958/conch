import { config } from "dotenv"
import jwt from "jsonwebtoken"
import { TokenPayload } from "../types/token.js"

config()

const JWT_SECRET = process.env.JWT_SECRET

export const sign = async (payload: TokenPayload) => {
  if (!JWT_SECRET) throw new Error("Can't load theJWT secret")

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "9999 years",
  })
}

export const verify = async (token: string) => {
  if (!JWT_SECRET) throw new Error("Can't load theJWT secret")

  try {
    const parsed = jwt.verify(token, JWT_SECRET)
    const typeChecked = TokenPayload.safeParse(parsed)

    if (!typeChecked.success) return null

    return typeChecked.data
  } catch (e) {
    console.log(e)
    return null
  }
}
